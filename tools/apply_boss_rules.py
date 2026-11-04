import os
import re
import subprocess


def rd(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def wr(p, s):
    d = os.path.dirname(p)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


class Miss(Exception):
    pass


class Editor:
    def __init__(self):
        self.orig = {}
        self.new = {}

    def read(self, p):
        if p in self.new:
            if self.new[p] is None:
                raise Miss('deleted earlier: ' + p)
            return self.new[p]
        if not os.path.exists(p):
            raise Miss('missing file ' + p)
        s = rd(p)
        self.orig[p] = s
        self.new[p] = s
        return s

    def edit(self, p, old, new, count=1):
        s = self.read(p)
        n = s.count(old)
        if n != count:
            raise Miss('%s: expected %d match(es) for %r, found %d' % (p, count, old[:60], n))
        self.new[p] = s.replace(old, new)

    def soft(self, p, old, new):
        try:
            s = self.read(p)
        except Miss:
            return
        if old in s:
            self.new[p] = s.replace(old, new)

    def sub(self, p, pattern, repl, flags=0):
        s = self.read(p)
        s2, n = re.subn(pattern, repl, s, flags=flags)
        if n != 1:
            raise Miss('%s: pattern matched %d time(s): %s' % (p, n, pattern[:60]))
        self.new[p] = s2

    def drop_line(self, p, prefix):
        lines = self.read(p).splitlines(True)
        hit = [i for i, l in enumerate(lines) if l.lstrip().startswith(prefix)]
        if len(hit) != 1:
            raise Miss('%s: expected one line starting with %r, found %d' % (p, prefix, len(hit)))
        del lines[hit[0]]
        self.new[p] = ''.join(lines)

    def absent(self, p, *words):
        s = self.read(p)
        for w in words:
            if w in s:
                raise Miss('%s: still contains %r' % (p, w))

    def delete(self, p):
        self.read(p)
        self.new[p] = None

    def put(self, p, text):
        if p not in self.orig:
            self.orig[p] = rd(p) if os.path.exists(p) else None
        self.new[p] = text

    def write(self):
        for p, s in self.new.items():
            if s is None:
                os.remove(p)
            elif s != self.orig.get(p):
                wr(p, s)

    def restore(self):
        for p, s in self.orig.items():
            if s is None:
                if os.path.exists(p):
                    os.remove(p)
            else:
                wr(p, s)


def run_tests():
    r = subprocess.run(['npm', 'test'], capture_output=True, text=True, timeout=400)
    out = r.stdout + '\n' + r.stderr
    names = set(m.group(1).strip() for m in re.finditer(r'^[ \t]*not ok \d+ - (.*?)[ \t]*$', out, re.M))
    return names, out


baseline, base_out = run_tests()
report = []


def group(name, fn):
    ed = Editor()
    try:
        fn(ed)
    except (Miss, ValueError) as e:
        report.append(('MISS', name, str(e)))
        print('MISS', name, e)
        return
    ed.write()
    for p, s in ed.new.items():
        if s is not None and p.endswith('.mjs'):
            r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
            if r.returncode != 0:
                ed.restore()
                report.append(('SYNTAX', name, p + ': ' + r.stderr[-200:]))
                print('SYNTAX', name)
                return
    fails, _ = run_tests()
    fresh = fails - baseline
    if fresh:
        ed.restore()
        report.append(('REVERT', name, 'new failing tests: ' + '; '.join(sorted(fresh)[:5])))
        print('REVERT', name, sorted(fresh)[:5])
        return
    report.append(('OK', name, ''))
    print('OK', name)


# ---------------- A1: no player-facing skip controls ----------------
def g_boss_intro(ed):
    P = 'src/boss-intro.mjs'
    ed.drop_line(P, "const skip=el('button'")
    ed.edit(P, "[veil,top,bottom,box,skip]", "[veil,top,bottom,box]")
    ed.edit(P, "skip.onclick=()=>finish(true);", "")
    ed.edit(P, "skip.focus({preventScroll:true});", "overlay.setAttribute('tabindex','-1');overlay.focus({preventScroll:true});")
    ed.edit(P, "{reduced=false,raf=", "{raf=")
    ed.edit(P, "apply(introFrame(0,reduced));", "apply(introFrame(0));")
    ed.edit(P, "const f=introFrame(elapsed,reduced);", "const f=introFrame(elapsed);")
    ed.edit(P, "duration:introDuration(reduced)", "duration:introDuration(false)")
    ed.edit(P, "if(reduced){top.style", "if(false){top.style")
    ed.edit(P, "reduced?'none':'translateY('", "'translateY('")
    ed.absent(P, 'reduced', '건너뛰기', 'skip.onclick')
    T = 'tests/boss-intro.test.mjs'
    ed.edit(T, "assert.equal(overlay.children.at(-1).focused,true);", "assert.equal(overlay.focused,true);assert.equal(overlay.children.length,4);")
    s = ed.read(T)
    a = s.index("test('the skip button and the skip method end it at once'")
    b = s.index('});', a) + 3
    new_test = "test('no skip control is rendered and the cinematic ends only by itself',async()=>{\n const a=rig(),va=playBossIntro(a.doc,a.arena,'clown',a.options);\n assert.equal(a.arena.children[0].children.length,4);\n for(let i=0;i<130&&a.arena.children.length;i++)a.step(50);\n assert.equal(await va.finished,true);assert.equal(a.arena.children.length,0);\n const b=rig(),vb=playBossIntro(b.doc,b.arena,'dice',b.options);\n vb.skip();vb.skip();\n assert.equal(await vb.finished,true);assert.equal(b.arena.children.length,0);\n});"
    s = s[:a] + new_test + s[b:]
    c = s.index("test('reduced motion uses opacity instead of sliding bars'")
    ed.new[T] = s[:c].rstrip() + '\n'


def g_journey_transition(ed):
    J = 'src/journey-transition.mjs'
    ed.edit(J, "import {reducedMotion} from './display-preferences.mjs';", "")
    ed.drop_line(J, "const skip=doc.createElement('button')")
    ed.edit(J, "let done=false,", "doc.body.appendChild(d);let done=false,")
    ed.edit(J, ",calm=reducedMotion();", ";")
    ed.edit(J, "skip.onclick=()=>end(true);d.addEventListener('cancel',e=>{e.preventDefault();end(true);});", "d.addEventListener('cancel',e=>e.preventDefault());")
    ed.edit(J, "d.showModal();skip.focus();", "d.setAttribute('tabindex','-1');d.showModal();d.focus({preventScroll:true});")
    ed.edit(J, "el.style.transform=calm?'none':`translateX(${(i?-1:1)*-cut*105}%)`;", "el.style.transform=`translateX(${(i?-1:1)*-cut*105}%)`;")
    ed.edit(J, "stage:bow>0?'bow':'entry'},calm?0:t);", "stage:bow>0?'bow':'entry'},t);")
    ed.edit(J, "if(t>=(calm?1.4:boss==='kwon'?2.5:boss==='clown'?5.4:2.5)){", "if(t>=(boss==='kwon'?2.5:boss==='clown'?5.4:2.5)){")
    ed.absent(J, 'calm', 'reducedMotion', '건너뛰기', 'skip.onclick')


def g_dice_entrance(ed):
    D = 'src/dice-entrance-view.mjs'
    ed.drop_line(D, "const skip=make('button'")
    ed.edit(D, "dialog.appendChild(skip);", "")
    ed.edit(D, "skip.onclick=()=>end(true);dialog.addEventListener('cancel',e=>{e.preventDefault();end(true);});", "dialog.addEventListener('cancel',e=>e.preventDefault());")
    ed.edit(D, "dialog.showModal();skip.focus({preventScroll:true});", "dialog.setAttribute('tabindex','-1');dialog.showModal();dialog.focus({preventScroll:true});")
    ed.edit(D, "const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);", "")
    ed.edit(D, "rotateZ('+(reduced?0:p.travel*540)+'deg)'", "rotateZ('+(p.travel*540)+'deg)'")
    ed.absent(D, 'reduced', '건너뛰기', 'skip.onclick')


def g_dice_skip(ed):
    U = 'src/dice-ui.mjs'
    ed.drop_line(U, "const skip=doc.createElement('button');skip.id='skip-giant'")
    ed.edit(U, "skip.hidden=giant?.state!=='transition';", "")
    ed.absent(U, 'skip.hidden', 'skip-giant', '건너뛰기')
    B = 'src/dice-battle.mjs'
    ed.edit(B, "import {skipGiant} from './dice-giant.mjs';", "")
    ed.edit(B, "$('skip-giant').onclick=()=>{if(mode==='playing'){skipGiant(g);canvas.focus();}};", "")
    ed.edit(B, "$('skip-giant').disabled=mode!=='playing';", "")
    ed.absent(B, 'skip-giant', 'skipGiant')


def g_blood_skip(ed):
    H = 'src/blood-ui.mjs'
    ed.drop_line(H, "const skip=doc.createElement('button')")
    ed.edit(H, "skip.hidden=b.state!=='transition';", "")
    ed.edit(H, "return {d,root,shell,$,skip,canvas:", "return {d,root,shell,$,canvas:")
    ed.absent(H, '건너뛰기', 'skip.hidden', 'skip,canvas')
    K = 'src/blood-battle.mjs'
    ed.edit(K, "createBloodGame,actBlood,stepBlood,skipBloodTransition", "createBloodGame,actBlood,stepBlood")
    ed.edit(K, "hud.skip.onclick=()=>{if(mode==='playing'){transformationAudio.skip();skipBloodTransition(g);canvas.focus();}};", "")
    ed.absent(K, 'hud.skip', 'skipBloodTransition')


# ---------------- E1: no low-quality or reduced-motion modes ----------------
def g_display_prefs(ed):
    ed.put('src/display-preferences.mjs', rd('tools/payload/src/display-preferences.mjs'))


def g_blood_quality(ed):
    Q = 'src/blood-fluid.mjs'
    ed.edit(Q, "export function bloodQuality({coarse=false,storage}={}){", "export function bloodQuality({coarse=false}={}){")
    ed.drop_line(Q, "let low=false;try{storage??=")
    ed.edit(Q, "return {low,segments:low?8:coarse?12:20,drops:low?96:coarse?192:360,puddles:low?14:coarse?28:44,ripples:low?8:coarse?16:28,wingRibs:low?4:6};", "return {low:false,segments:coarse?12:20,drops:coarse?192:360,puddles:coarse?28:44,ripples:coarse?16:28,wingRibs:6};")
    T = 'tests/blood-fluid.test.mjs'
    ed.edit(T, "test('mobile and low tiers reduce geometry, particle count and wing ribs without dropping spell forms'", "test('the touch tier reduces geometry and particle count without dropping spell forms'")
    ed.edit(T, "const normal=bloodQuality({storage:null}),mobile=bloodQuality({coarse:true,storage:null}),low=bloodQuality({storage:{getItem:()=> 'low'}});", "const normal=bloodQuality({}),mobile=bloodQuality({coarse:true});")
    ed.edit(T, "assert.ok(low.drops<mobile.drops&&mobile.drops<normal.drops);assert.ok(low.segments<mobile.segments&&mobile.segments<normal.segments);assert.ok(low.wingRibs<normal.wingRibs);", "assert.ok(mobile.drops<normal.drops);assert.ok(mobile.segments<normal.segments);")
    ed.edit(T, "bloodQuality({storage:{getItem:()=> 'low'}})", "bloodQuality({coarse:true})")
    ed.edit('tests/blood-stage.test.mjs', "bloodQuality({storage:{getItem:()=> 'low'}})", "bloodQuality({coarse:true})")


def g_screen_fx(ed):
    ed.edit('src/screen-fx.mjs', "reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)", "reduced=false")
    ed.drop_line('tests/screen-fx.test.mjs', "test('reduced motion keeps a constant low-health opacity'")


def g_boss_ui_chain(ed):
    ed.edit('src/boss-ui-chain.mjs', "const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches),mobile=", "const reduced=false,mobile=")


def g_clown_actor(ed):
    ed.edit('src/clown-actor.mjs', "const reduced=Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);", "const reduced=false;")


def g_boss_transition(ed):
    ed.edit('src/boss-transition.mjs', "reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,STORAGE=", "reduced=false,STORAGE=")


def g_hit_feedback(ed):
    ed.sub('src/player-hit-feedback.mjs', r'\n[ \t]*@media\(prefers-reduced-motion:reduce\)\{\.oden-hit-overlay\.active\{animation:oden-damage-flash \.65s ease-out both\}\}', lambda m: '')


def g_kwon_visuals(ed):
    ed.edit('src/kwon-visuals.mjs', "try{low=localStorage.getItem('oibung.quality')==='low';}catch{}", "")


def g_journey_settings(ed):
    JY = 'src/journey.mjs'
    ed.edit(JY, "doc.body.dataset.motion=pref('oibung.motion','auto');doc.body.dataset.quality=pref('oibung.quality','auto');", "doc.body.dataset.motion='auto';doc.body.dataset.quality='auto';")
    ed.edit(JY, R'''<label class="j-setting">그래픽 <select id="j-quality"><option value="auto">기본</option><option value="low" ${pref('oibung.quality','auto')==='low'?'selected':''}>저사양 · 렌더 해상도 제한</option></select></label><label class="j-setting"><input type="checkbox" id="j-motion" ${pref('oibung.motion','auto')==='reduced'?'checked':''}> 모션 감소</label><p>그래픽·모션 적용 시 게임을 새로고침합니다. 진행 중인 도전은 종료됩니다.</p>''', "")
    ed.edit(JY, "${button('apply','그래픽·모션 설정 적용')}", "")
    ed.edit(JY, "else if(action==='apply'){put('oibung.quality',dialog.querySelector('#j-quality').value);put('oibung.motion',dialog.querySelector('#j-motion').checked?'reduced':'auto');persist();win.location.reload();}", "")
    ed.absent(JY, 'oibung.quality', 'oibung.motion', 'j-quality', 'j-motion')


# ---------------- requested balance and HUD cleanup ----------------
def g_dice_sound(ed):
    F = 'src/boss-foley-map.mjs'
    ed.edit(F, "case 'dice-impact':return cue(f.impact,.34,1.25,.22,.17);", "case 'dice-impact':return cue(f.impact,.22,1.25,.22,.17);")
    ed.edit(F, "case 'dice-stomp':return cue(f.giant,.39,1.55,.26,.25);", "case 'dice-stomp':return cue(f.giant,.25,1.55,.26,.25);")
    ed.edit(F, "case 'dice-jump':return cue(f.jump,.27,1,.16,.25);", "case 'dice-jump':return cue(f.jump,.2,1,.16,.25);")


def g_weapon_sound(ed):
    W = 'src/player-weapon-sfx.mjs'
    ed.edit(W, "clip(fx('u_2c8g87fmmx-bow-sound-596323.mp3'),.14,.66,.13,.15)", "clip(fx('u_2c8g87fmmx-bow-sound-596323.mp3'),.21,.66,.13,.15)")
    ed.edit(W, "clip(fx('freesound_community-card-sounds-35956.mp3'),.11,.35,.09,.13)", "clip(fx('freesound_community-card-sounds-35956.mp3'),.17,.35,.09,.13)")
    ed.edit(W, "clip(fx('oxidvideos-taking-playing-card-522520.mp3'),.12,.42,.1,.13)", "clip(fx('oxidvideos-taking-playing-card-522520.mp3'),.18,.42,.1,.13)")
    ed.edit(W, "clip(fx('oxidvideos-taking-playing-card-2-522516.mp3'),.12,.42,.1,.13)", "clip(fx('oxidvideos-taking-playing-card-2-522516.mp3'),.18,.42,.1,.13)")
    ed.edit(W, "clip(fx('freesound_community-card-mixing-48088.mp3'),.1,.58,.13,.13)", "clip(fx('freesound_community-card-mixing-48088.mp3'),.15,.58,.13,.13)")


def g_dice_text(ed):
    U = 'src/dice-ui.mjs'
    ed.edit(U, "$('load-status').textContent='깔리면 즉사합니다. 착지 후 한 번 공격하고 옆으로 이탈하세요.';", "$('load-status').textContent='';")
    ed.edit(U, "if(tips.length)tips[tips.length-1].textContent='사진이 옆면에 드러났을 때만 피해를 줄 수 있습니다. 4연속 구르기 종료 후 사진 면에서 한 번 반격하고 옆으로 이탈하세요. 몸체에 깔리면 회피 무적과 관계없이 즉사합니다.';", "")
    ed.edit(U, "shell.querySelector('.intro').textContent='거대한 손님들이 내려다보는 룰렛 탁자. 다음 칸을 읽고, 착지한 뒤 반격하세요.';", "shell.querySelector('.intro').textContent='';")
    ed.edit(U, "panel.hidden=!giant||giant.state==='transition'||g.status!=='playing';", "panel.hidden=true;")
    ed.sub(U, r"\$\('boss-action'\)\.textContent=g\.status==='won'\?'박성원이 토벌되었다'.*?'빈틈 — 지금 반격하세요';", lambda m: "$('boss-action').textContent='';", flags=re.S)
    B = 'src/dice-battle.mjs'
    ed.edit(B, "$('giant-hud').hidden=cutscene;", "$('giant-hud').hidden=true;")
    ed.sub(B, r"\$\('result-text'\)\.textContent=g\.status==='won'\?'주사위가 멈추습니다\.':g\.dice\.giant\?'[^']*':'[^']*';", lambda m: "$('result-text').textContent=g.status==='won'?'주사위가 멈추습니다.':'';")


def g_blood_text(ed):
    H = 'src/blood-ui.mjs'
    ed.edit(H, "import {createBloodStageUi} from './blood-stage-ui.mjs';", "")
    ed.edit(H, "import {bloodStage} from './blood-stage.mjs';", "")
    ed.edit(H, ",stageUi=createBloodStageUi(shell,doc)", "")
    ed.edit(H, "stageUi.update(g);", "")
    ed.edit(H, "stageUi.dispose();", "")
    ed.sub(H, r"\$\('boss-action'\)\.textContent=b\.state==='transition'\?.*?bloodStage\(g\)\.label:''\);", lambda m: "$('boss-action').textContent='';", flags=re.S)
    ed.edit(H, "$('notice').textContent=b.state==='transition'?'':s.slow>0?'피의 사슬 · 회피는 정상적으로 사용할 수 있습니다':'';$('notice').classList.toggle('visible',s.slow>0);", "$('notice').textContent='';$('notice').classList.remove('visible');")
    ed.edit(H, "$('load-status').textContent='밝은 바닥 예고를 피하고, 착지한 붉은 구체에 반격하세요.';", "$('load-status').textContent='';")
    ed.absent(H, 'bloodStage', 'createBloodStageUi', '지금 반격', '빈틈')
    ed.delete('src/blood-stage-ui.mjs')
    ed.edit('src/blood-battle.mjs', "'밝은 예고에서 벗어나고, 공중 공격 뒤 착지한 구체에 반격하세요.'", "''")


def g_blood_rectangles(ed):
    ed.edit('src/blood-view.mjs', "for(const h of s.hazards){seen.add(h.id);warning(h,g);}", "for(const h of s.hazards){if(h.shape==='lane')continue;seen.add(h.id);warning(h,g);}")
    ed.edit('tests/blood-render.test.mjs', "for(const id of ['wave','wing']){", "for(const id of ['wing']){")


def g_skill_text(ed):
    ed.edit('src/battle-hud.mjs', "text('skill-text',skill.text);", "text('skill-text',game.dice||game.blood?'':skill.text);")


def g_docs(ed):
    ed.soft('scripts/blood-browser-smoke.cjs', "await page.getByRole('button',{name:'건너뛰기',exact:true}).click();", "await page.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const r=document.querySelector('#blood-battle')?.firstElementChild.shadowRoot;return r&&readBattleSession(r)?.active;});")
    ed.soft('scripts/blood-browser-smoke.cjs', "await page.locator('#blood-battle').getByRole('button',{name:'혈익 변신 건너뛰기'}).click();", "await page.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const r=document.querySelector('#blood-battle').firstElementChild.shadowRoot;return readBattleSession(r).game.boss.state!=='transition';});")
    ed.soft('scripts/blood-qa.html', '<button data-cmd="skip">Skip</button>', '')
    ed.soft('scripts/blood-qa.html', '<button data-cmd="low">Low quality</button><button data-cmd="normal">Normal quality</button>', '')
    ed.soft('scripts/blood-qa-driver.mjs', "if(cmd==='skip'){skipBloodTransition(g);s.resume();}", '')
    ed.soft('scripts/blood-qa-driver.mjs', "startBloodPattern,skipBloodTransition}", "startBloodPattern}")
    ed.soft('scripts/blood-qa-driver.mjs', "if(cmd==='low'||cmd==='normal'){localStorage.setItem('oibung.quality',cmd==='low'?'low':'high');run++;start();}", '')
    ed.soft('README.md', '네 보스의 소개 컷씬이 나오고 건너뛰기·재개가 정상인지', '네 보스의 소개 컷씬에 건너뛰기 버튼이 없고, 끝까지 재생한 뒤 전투가 시작되는지')
    ed.soft('docs/dice-possession.md', '컷씬 건너뛰기는 동일한 최종 상태로 이동합니다.', '플레이어용 컷씬 건너뛰기는 제공하지 않으며, 연출이 끝나면 다음 상태로 이동합니다.')
    ed.soft('docs/dice-possession.md', '컷씬 건너뛰기/일시정지/다시 시작', '컷씬 전체 재생/일시정지/다시 시작')
    ed.soft('docs/design-implementation-status.md', '건너뛰기, 머리 구체·혈익 변화', '전체 재생, 머리 구체·혈익 변화')
    ed.soft('docs/blood-effect-stages.md', '움직임 줄이기 설정에서는 출렁임과 방울 수가 줄어듭니다.', '움직임 줄이기·저사양 모드는 지원하지 않습니다(docs/boss-design-rules.md).')


def g_rules_doc(ed):
    ed.put('docs/boss-design-rules.md', rd('tools/payload/docs/boss-design-rules.md'))


def g_rules_test(ed):
    ed.put('tests/boss-rules.test.mjs', rd('tools/payload/tests/boss-rules.test.mjs'))


for name, fn in [
    ('skip: boss-intro', g_boss_intro),
    ('skip: journey-transition', g_journey_transition),
    ('skip: dice-entrance-view', g_dice_entrance),
    ('skip: dice ui and battle', g_dice_skip),
    ('skip: blood ui and battle', g_blood_skip),
    ('modes: display-preferences', g_display_prefs),
    ('modes: blood quality tier', g_blood_quality),
    ('modes: screen-fx', g_screen_fx),
    ('modes: boss-ui-chain', g_boss_ui_chain),
    ('modes: clown-actor', g_clown_actor),
    ('modes: boss-transition', g_boss_transition),
    ('modes: hit feedback css', g_hit_feedback),
    ('modes: kwon-visuals', g_kwon_visuals),
    ('modes: journey settings', g_journey_settings),
    ('sound: dice movement quieter', g_dice_sound),
    ('sound: bow and card attacks louder', g_weapon_sound),
    ('hud: dice text removed', g_dice_text),
    ('hud: blood text and stage bar removed', g_blood_text),
    ('hud: blood rectangle warnings removed', g_blood_rectangles),
    ('hud: skill description hidden', g_skill_text),
    ('docs and qa tooling', g_docs),
    ('rules: document', g_rules_doc),
    ('rules: test', g_rules_test),
]:
    group(name, fn)

final, final_out = run_tests()
lines = ['## 적용 결과', '']
for status, name, msg in report:
    lines.append('- **%s** %s %s' % (status, name, msg))
lines += ['', '## 변경 전부터 실패하던 테스트 (%d개)' % len(baseline), '']
for n in sorted(baseline):
    lines.append('- ' + n)
base_lines = base_out.splitlines()
for n in sorted(baseline)[:8]:
    for i, l in enumerate(base_lines):
        if re.match(r'^[ \t]*not ok \d+ - ' + re.escape(n) + r'[ \t]*$', l):
            lines += ['', '### ' + n, '```'] + base_lines[i:i + 16] + ['```']
            break
lines += ['', '## 최종 테스트 실패 (%d개)' % len(final), '']
for n in sorted(final):
    lines.append('- ' + n)
with open('/tmp/report.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines)[:60000] + '\n')
print('done')
