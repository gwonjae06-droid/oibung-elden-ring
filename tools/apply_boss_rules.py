import re
import sys
from pathlib import Path


def rd(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def wr(p, s):
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def fail(msg):
    print('PATCH FAILED: ' + msg)
    sys.exit(1)


def edit(p, old, new, count=1):
    s = rd(p)
    n = s.count(old)
    if n != count:
        fail('%s: expected %d match(es) for %r, found %d' % (p, count, old[:70], n))
    wr(p, s.replace(old, new))


def soft(p, old, new):
    try:
        s = rd(p)
    except FileNotFoundError:
        print('note: missing', p)
        return
    if old in s:
        wr(p, s.replace(old, new))
    else:
        print('note: no match in', p, old[:40])


def drop_line(p, prefix):
    lines = rd(p).splitlines(True)
    hit = [i for i, l in enumerate(lines) if l.lstrip().startswith(prefix)]
    if len(hit) != 1:
        fail('%s: expected one line starting with %r, found %d' % (p, prefix, len(hit)))
    del lines[hit[0]]
    wr(p, ''.join(lines))


def absent(p, *words):
    s = rd(p)
    for w in words:
        if w in s:
            fail('%s: still contains %r' % (p, w))


# --- payload files (rules document, rules test, display preferences) ---
root = Path('tools/payload')
for f in sorted(root.rglob('*')):
    if f.is_file():
        dest = Path(*f.relative_to(root).parts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        wr(str(dest), rd(str(f)))

# --- A1: no player-facing skip controls ---
P = 'src/boss-intro.mjs'
drop_line(P, "const skip=el('button'")
edit(P, "[veil,top,bottom,box,skip]", "[veil,top,bottom,box]")
edit(P, "skip.onclick=()=>finish(true);", "")
edit(P, "skip.focus({preventScroll:true});", "overlay.setAttribute('tabindex','-1');overlay.focus({preventScroll:true});")
edit(P, "{reduced=false,raf=", "{raf=")
edit(P, "apply(introFrame(0,reduced));", "apply(introFrame(0));")
edit(P, "const f=introFrame(elapsed,reduced);", "const f=introFrame(elapsed);")
edit(P, "duration:introDuration(reduced)", "duration:introDuration(false)")
edit(P, "if(reduced){top.style", "if(false){top.style")
edit(P, "reduced?'none':'translateY('", "'translateY('")
absent(P, 'reduced', '건너뛰기', 'skip.onclick')

J = 'src/journey-transition.mjs'
edit(J, "import {reducedMotion} from './display-preferences.mjs';", "")
drop_line(J, "const skip=doc.createElement('button')")
edit(J, "let done=false,raf=0,last=null", "doc.body.appendChild(d);let done=false,raf=0,last=null")
edit(J, ",calm=reducedMotion();", ";")
edit(J, "skip.onclick=()=>end(true);d.addEventListener('cancel',e=>{e.preventDefault();end(true);});", "d.addEventListener('cancel',e=>e.preventDefault());")
edit(J, "d.showModal();skip.focus();", "d.setAttribute('tabindex','-1');d.showModal();d.focus({preventScroll:true});")
edit(J, "el.style.transform=calm?'none':`translateX(${(i?-1:1)*-cut*105}%)`;", "el.style.transform=`translateX(${(i?-1:1)*-cut*105}%)`;")
edit(J, "stage:bow>0?'bow':'entry'},calm?0:t);", "stage:bow>0?'bow':'entry'},t);")
edit(J, "if(t>=(calm?1.4:boss==='kwon'?2.5:boss==='clown'?5.4:2.5)){", "if(t>=(boss==='kwon'?2.5:boss==='clown'?5.4:2.5)){")
absent(J, 'calm', 'reducedMotion', '건너뛰기', 'skip.onclick')

D = 'src/dice-entrance-view.mjs'
drop_line(D, "const skip=make('button'")
edit(D, "dialog.appendChild(skip);", "")
edit(D, "skip.onclick=()=>end(true);dialog.addEventListener('cancel',e=>{e.preventDefault();end(true);});", "dialog.addEventListener('cancel',e=>e.preventDefault());")
edit(D, "dialog.showModal();skip.focus({preventScroll:true});", "dialog.setAttribute('tabindex','-1');dialog.showModal();dialog.focus({preventScroll:true});")
edit(D, "const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);", "")
edit(D, "rotateZ('+(reduced?0:p.travel*540)+'deg)'", "rotateZ('+(p.travel*540)+'deg)'")
absent(D, 'reduced', '건너뛰기', 'skip.onclick')

U = 'src/dice-ui.mjs'
drop_line(U, "const skip=doc.createElement('button');skip.id='skip-giant'")
edit(U, "skip.hidden=giant?.state!=='transition';", "")
absent(U, 'skip.hidden', 'skip-giant', '건너뛰기')

B = 'src/dice-battle.mjs'
edit(B, "import {skipGiant} from './dice-giant.mjs';", "")
edit(B, "$('skip-giant').onclick=()=>{if(mode==='playing'){skipGiant(g);canvas.focus();}};", "")
edit(B, "$('skip-giant').disabled=mode!=='playing';", "")
absent(B, 'skip-giant', 'skipGiant')

H = 'src/blood-ui.mjs'
drop_line(H, "const skip=doc.createElement('button')")
edit(H, "skip.hidden=b.state!=='transition';", "")
edit(H, "return {d,root,shell,$,skip,canvas:", "return {d,root,shell,$,canvas:")
absent(H, '건너뛰기', 'skip.hidden', 'skip,canvas')

K = 'src/blood-battle.mjs'
edit(K, "createBloodGame,actBlood,stepBlood,skipBloodTransition", "createBloodGame,actBlood,stepBlood")
edit(K, "hud.skip.onclick=()=>{if(mode==='playing'){transformationAudio.skip();skipBloodTransition(g);canvas.focus();}};", "")
absent(K, 'hud.skip', 'skipBloodTransition')

# --- E1: low quality and reduced motion are not supported ---
edit('src/screen-fx.mjs', "reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)", "reduced=false")
edit('src/boss-ui-chain.mjs', "const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches),mobile=", "const reduced=false,mobile=")
edit('src/clown-actor.mjs', "const reduced=Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);", "const reduced=false;")
edit('src/boss-transition.mjs', "reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,STORAGE=", "reduced=false,STORAGE=")
edit('src/kwon-visuals.mjs', "try{low=localStorage.getItem('oibung.quality')==='low';}catch{}", "")

F = 'src/player-hit-feedback.mjs'
s = rd(F)
s, n = re.subn(r'\n[ \t]*@media\(prefers-reduced-motion:reduce\)\{\.oden-hit-overlay\.active\{animation:oden-damage-flash \.65s ease-out both\}\}', '', s)
if n != 1:
    fail(F + ': reduced-motion media block not found exactly once')
wr(F, s)

Q = 'src/blood-fluid.mjs'
edit(Q, "export function bloodQuality({coarse=false,storage}={}){", "export function bloodQuality({coarse=false}={}){")
drop_line(Q, "let low=false;try{storage??=")
edit(Q, "return {low,segments:low?8:coarse?12:20,drops:low?96:coarse?192:360,puddles:low?14:coarse?28:44,ripples:low?8:coarse?16:28,wingRibs:low?4:6};", "return {low:false,segments:coarse?12:20,drops:coarse?192:360,puddles:coarse?28:44,ripples:coarse?16:28,wingRibs:6};")

JY = 'src/journey.mjs'
edit(JY, "doc.body.dataset.motion=pref('oibung.motion','auto');doc.body.dataset.quality=pref('oibung.quality','auto');", "doc.body.dataset.motion='auto';doc.body.dataset.quality='auto';")
edit(JY, R'''<label class="j-setting">그래픽 <select id="j-quality"><option value="auto">기본</option><option value="low" ${pref('oibung.quality','auto')==='low'?'selected':''}>저사양 · 렌더 해상도 제한</option></select></label><label class="j-setting"><input type="checkbox" id="j-motion" ${pref('oibung.motion','auto')==='reduced'?'checked':''}> 모션 감소</label><p>그래픽·모션 적용 시 게임을 새로고침합니다. 진행 중인 도전은 종료됩니다.</p>''', "")
edit(JY, "${button('apply','그래픽·모션 설정 적용')}", "")
edit(JY, "else if(action==='apply'){put('oibung.quality',dialog.querySelector('#j-quality').value);put('oibung.motion',dialog.querySelector('#j-motion').checked?'reduced':'auto');persist();win.location.reload();}", "")
absent(JY, 'oibung.quality', 'oibung.motion', 'j-quality', 'j-motion')

# --- tests that exercised the removed behaviour ---
T = 'tests/boss-intro.test.mjs'
edit(T, "assert.equal(overlay.children.at(-1).focused,true);", "assert.equal(overlay.focused,true);assert.equal(overlay.children.length,4);")
s = rd(T)
a = s.index("test('the skip button and the skip method end it at once'")
b = s.index('});', a) + 3
new_test = "test('no skip control is rendered and the cinematic ends only by itself',async()=>{\n const a=rig(),va=playBossIntro(a.doc,a.arena,'clown',a.options);\n assert.equal(a.arena.children[0].children.length,4);\n for(let i=0;i<130&&a.arena.children.length;i++)a.step(50);\n assert.equal(await va.finished,true);assert.equal(a.arena.children.length,0);\n const b=rig(),vb=playBossIntro(b.doc,b.arena,'dice',b.options);\n vb.skip();vb.skip();\n assert.equal(await vb.finished,true);assert.equal(b.arena.children.length,0);\n});"
s = s[:a] + new_test + s[b:]
c = s.index("test('reduced motion uses opacity instead of sliding bars'")
s = s[:c].rstrip() + '\n'
wr(T, s)

drop_line('tests/screen-fx.test.mjs', "test('reduced motion keeps a constant low-health opacity'")
drop_line('tests/circus-ui.test.mjs', "test('reduced motion removes decorative movement'")

T = 'tests/blood-fluid.test.mjs'
edit(T, "test('mobile and low tiers reduce geometry, particle count and wing ribs without dropping spell forms'", "test('the touch tier reduces geometry and particle count without dropping spell forms'")
edit(T, "const normal=bloodQuality({storage:null}),mobile=bloodQuality({coarse:true,storage:null}),low=bloodQuality({storage:{getItem:()=> 'low'}});", "const normal=bloodQuality({}),mobile=bloodQuality({coarse:true});")
edit(T, "assert.ok(low.drops<mobile.drops&&mobile.drops<normal.drops);assert.ok(low.segments<mobile.segments&&mobile.segments<normal.segments);assert.ok(low.wingRibs<normal.wingRibs);", "assert.ok(mobile.drops<normal.drops);assert.ok(mobile.segments<normal.segments);")
edit(T, "bloodQuality({storage:{getItem:()=> 'low'}})", "bloodQuality({coarse:true})")
edit('tests/blood-stage.test.mjs', "bloodQuality({storage:{getItem:()=> 'low'}})", "bloodQuality({coarse:true})")

# --- QA tooling and documentation (best effort) ---
soft('scripts/blood-browser-smoke.cjs', "await page.getByRole('button',{name:'건너뛰기',exact:true}).click();", "await page.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const r=document.querySelector('#blood-battle')?.firstElementChild.shadowRoot;return r&&readBattleSession(r)?.active;});")
soft('scripts/blood-browser-smoke.cjs', "await page.locator('#blood-battle').getByRole('button',{name:'혈익 변신 건너뛰기'}).click();", "await page.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const r=document.querySelector('#blood-battle').firstElementChild.shadowRoot;return readBattleSession(r).game.boss.state!=='transition';});")
soft('scripts/blood-qa.html', '<button data-cmd="skip">Skip</button>', '')
soft('scripts/blood-qa.html', '<button data-cmd="low">Low quality</button><button data-cmd="normal">Normal quality</button>', '')
soft('scripts/blood-qa-driver.mjs', "if(cmd==='skip'){skipBloodTransition(g);s.resume();}", '')
soft('scripts/blood-qa-driver.mjs', "startBloodPattern,skipBloodTransition}", "startBloodPattern}")
soft('scripts/blood-qa-driver.mjs', "if(cmd==='low'||cmd==='normal'){localStorage.setItem('oibung.quality',cmd==='low'?'low':'high');run++;start();}", '')
soft('README.md', '네 보스의 소개 컷씬이 나오고 건너뛰기·재개가 정상인지', '네 보스의 소개 컷씬에 건너뛰기 버튼이 없고, 끝까지 재생한 뒤 전투가 시작되는지')
soft('docs/dice-possession.md', '컷씬 건너뛰기는 동일한 최종 상태로 이동합니다.', '플레이어용 컷씬 건너뛰기는 제공하지 않으며, 연출이 끝나면 다음 상태로 이동합니다.')
soft('docs/dice-possession.md', '컷씬 건너뛰기/일시정지/다시 시작', '컷씬 전체 재생/일시정지/다시 시작')
soft('docs/design-implementation-status.md', '건너뛰기, 머리 구체·혈익 변화', '전체 재생, 머리 구체·혈익 변화')
soft('docs/blood-effect-stages.md', '움직임 줄이기 설정에서는 출렁임과 방울 수가 줄어듭니다.', '움직임 줄이기·저사양 모드는 지원하지 않습니다(docs/boss-design-rules.md).')

# --- final guard: no quality/motion switch may remain in the source ---
bad = re.compile(r'oibung\.quality|oibung\.motion|prefers-reduced-motion|j-quality|j-motion')
for f in sorted(Path('src').glob('*.mjs')):
    if bad.search(rd(str(f))):
        fail(str(f) + ' still references a quality or motion mode')
print('patch applied')
