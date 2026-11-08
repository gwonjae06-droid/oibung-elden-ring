import {GYUWON_MUSICAL_ACTS} from './gyuwon-musical-genres.mjs';

// All seven genres share one compact, responsive controller. Only game state
// changes the UI; the UI cannot invent collision, damage or a fake result.
const BUTTONS=Object.freeze({
 turn:['공격','스킬','방어','회복'],
 runner:['투척','슬라이드','점프','회복'],
 army:['돌격단원','궁수단원','방패단원','회복'],
 rhythm:['박자','강박','회피박','회복'],
 fighter:['주먹','강타','회피','회복'],
 shooter:['발사','삼연발','대시','회복'],
 finale:['노래','고음','회피박','회복']
});
const TYPES=['light','skill','roll','heal'];
const pad=String.raw`
.gy-musical-layer{position:absolute;inset:0;pointer-events:none;z-index:27;color:#1d2433;font-family:system-ui,sans-serif}
.gy-musical-top{position:absolute;top:12%;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;max-width:82vw;text-align:center}
.gy-musical-title{background:#fffbf5e8;border:1px solid #8885;border-radius:30px;padding:7px 20px;box-shadow:0 7px 25px #2531451b;font-size:clamp(14px,2vw,22px);font-weight:900;letter-spacing:.06em}
.gy-musical-info{background:#fffdf9dd;border-radius:18px;padding:5px 14px;color:#3c4261;font-size:clamp(11px,1.15vw,14px);font-weight:700}
.gy-musical-dialogue{position:absolute;left:50%;bottom:21%;width:min(86vw,750px);transform:translateX(-50%);padding:16px 20px;background:linear-gradient(90deg,#1b253adf,#313444eb,#1b253adf);color:#fff7ec;text-align:center;border-radius:16px;border:1px solid #fff3;font:600 clamp(15px,2.2vw,25px)/1.5 'Georgia',serif;text-shadow:0 2px 10px #0f1225;box-shadow:0 8px 26px #1116}
.gy-musical-actions{position:absolute;bottom:5%;right:4%;display:flex;gap:6px;pointer-events:auto}
.gy-musical-actions button{border:1px solid #303a55a0;border-radius:12px;background:#f9f7f4ee;box-shadow:0 4px 11px #0002;color:#293044;padding:10px 11px;font:800 12px/1.2 system-ui,sans-serif;min-width:57px;touch-action:manipulation}
.gy-musical-actions button:active{transform:translateY(2px);background:#f0dfca}
.gy-musical-actions button:disabled{opacity:.33}
.gy-musical-phases{position:absolute;left:50%;top:7%;transform:translateX(-50%);display:flex;width:min(80vw,620px);gap:3px}
.gy-musical-phases span{flex:1;border:1px solid #2222;border-radius:6px;height:9px;opacity:.32;box-shadow:inset 0 0 5px #0002}
.gy-musical-phases span.active{opacity:1;height:13px;transform:translateY(-2px);box-shadow:0 0 12px currentColor}
.gy-musical-phases span.finished{opacity:.78}
.gy-musical-beat{width:54px;height:54px;margin-top:16px;border:5px solid #bb87d9;border-radius:50%;background:#fcfcffe8;box-shadow:0 0 20px #9063e35c;display:grid;place-items:center;font-weight:950;font-size:24px;will-change:transform}
.gy-musical-beat[data-note='roll']{border-color:#60acb1}
.gy-musical-beat[data-note='skill']{border-color:#d9954d}
.gy-musical-layer.curtain{background:linear-gradient(90deg,#0b122b55,#1d233744,#0b122b55);color:#fff}
.gy-musical-layer.curtain .gy-musical-top{opacity:0}
.gy-musical-layer.curtain .gy-musical-dialogue{bottom:28%;background:#101423ba}
@media(max-width:720px){.gy-musical-actions{bottom:12%;right:2%;gap:3px}.gy-musical-actions button{padding:8px 5px;min-width:48px;font-size:10px}.gy-musical-dialogue{bottom:31%;padding:9px 10px}.gy-musical-top{top:14%}.gy-musical-title{font-size:14px;padding:5px 10px}.gy-musical-info{font-size:11px}.gy-musical-phases{top:9%}}
`;
export function createGyuwonMusicalHud(doc,shell,{onAction=()=>{}}={}){
 const style=doc.createElement('style');style.textContent=pad;shell.appendChild(style);
 const wrap=doc.createElement('div');wrap.className='gy-musical-layer';wrap.hidden=true;
 const phases=doc.createElement('div');phases.className='gy-musical-phases';
 const spans=Object.entries(GYUWON_MUSICAL_ACTS).map(([year,data])=>{
  const piece=doc.createElement('span');piece.style.background=data.color;
  piece.title=year+'수 · '+data.name;phases.appendChild(piece);return piece;
 });
 const top=doc.createElement('div');top.className='gy-musical-top';
 const title=doc.createElement('div');title.className='gy-musical-title';
 const info=doc.createElement('div');info.className='gy-musical-info';
 const beat=doc.createElement('div');beat.className='gy-musical-beat';beat.hidden=true;
 top.append(title,info,beat);
 const dialogue=doc.createElement('div');dialogue.className='gy-musical-dialogue';dialogue.hidden=true;
 const actions=doc.createElement('div');actions.className='gy-musical-actions';
 const btns=TYPES.map((type,index)=>{
  const btn=doc.createElement('button');btn.type='button';btn.dataset.musicalAction=type;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();if(!btn.disabled)onAction(type);});
  actions.appendChild(btn);return btn;
 });
 wrap.append(phases,top,dialogue,actions);shell.appendChild(wrap);
 let lastKind=null,lastTitle='',currentYear=0;
 function update(g,paused=false){
  const e=g?.gyuwon?.years,m=e?.musical;
  const active=!!m&&g.status==='playing';
  wrap.hidden=!active;
  if(!active)return;
  const isCurtain=m.finishing||e.mode==='curtain';
  wrap.classList.toggle('curtain',isCurtain);
  if(currentYear!==e.year){currentYear=e.year;
   spans.forEach((s,i)=>s.className=i===e.year-5?'active':i<e.year-5?'finished':'');
  }
  if(lastKind!==m.kind){lastKind=m.kind;
   btns.forEach((b,i)=>b.textContent=BUTTONS[m.kind]?.[i]||TYPES[i]);
  }
  btns.forEach(b=>b.disabled=paused||m.transition>0||isCurtain);
  const period=m.transition>0?m.title:e.year+'수 · '+GYUWON_MUSICAL_ACTS[e.year].name;
  if(period!==lastTitle){title.textContent=period;lastTitle=period;}
  const status=m.kind==='turn'?m.turn==='player'?'당신의 차례':m.turn==='boss'?'최규원의 차례':'다음 턴':
   m.kind==='runner'?'거리 '+Math.floor(m.runnerDistance)+'m':
   m.kind==='army'?'에너지 '+Math.floor(m.money)+' · 유닛 '+m.units.filter(u=>u.team===1).length:
   m.kind==='fighter'?'연속 공격 '+m.combo:
   m.kind==='shooter'?'발사체 '+m.bullets.length+' · 회피':
   '콤보 '+m.combo;
  info.textContent=status;
  const hasNote=!!m.note&&!m.note.done&&['rhythm','finale'].includes(m.kind);
  beat.hidden=!hasNote;
  if(hasNote){
   const p=Math.max(0,Math.min(1,m.note.time/1.05));
   beat.style.transform='scale('+(0.9+p*1.4)+')';
   beat.textContent=m.note.key==='roll'?'↯':m.note.key==='skill'?'♪':'♫';
   beat.dataset.note=m.note.key;
  }
  const showLine=g.time>=0&&(m.time<m.dialogueUntil||isCurtain&&m.curtain<16.5);
  dialogue.hidden=!showLine||!m.dialogue;
  if(showLine&&dialogue.textContent!==m.dialogue)dialogue.textContent=m.dialogue;
 }
 return {update,onAction(fn){onAction=fn;},dispose(){wrap.remove();style.remove();}};
}
