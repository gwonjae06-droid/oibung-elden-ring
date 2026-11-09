import {GYUWON_MUSICAL_ACTS} from './gyuwon-musical-genres.mjs';
import {gyuwonSubtitleAt} from './gyuwon-subtitles.mjs';
import {GYUWON_SONGS,gyuwonSongKey} from './gyuwon-song-data.mjs';
import {REFERENCE_UNIT_TYPES,REFERENCE_PARTY} from './gyuwon-reference-rules.mjs';
import {GYUWON_FINALE_CREDITS,gyuwonDedicationAt,gyuwonCurtainCallAt} from './gyuwon-curtain-call.mjs';
const names={turn:[['light','일반 공격','Q'],['skill','전투 스킬','E'],['support','지원','Space']],runner:[['jump','Jump','Space'],['slide','Slide','L'],['dash','✦ Dash','K']],army:[['upgrade','생산력','U'],['lane','전선 변경','T'],...REFERENCE_UNIT_TYPES.map((u,i)=>['summon'+i,u.name,''+(i+1)]),['cannon','대포','K']],rhythm:[['light','포즈','J'],['skill','턴','L'],['roll','빠른 턴','Space']],fighter:[['light','주먹','J'],['kick','킥','K'],['skill','스킬','L'],['super','초필살','O'],['jump','점프','Space'],['guard','방어','I']],shooter:[['bomb','폭탄','Space'],['skill','무기','L']],finale:[['light','노래','J'],['skill','고음','L'],['roll','회피박','Space'],['heal','회복','E']]};
const glyphs={sword:'╱',hammer:'♜',bow:'➶',cards:'◇'};
const css=`
.gy-musical-layer{position:absolute;inset:0;z-index:27;pointer-events:none;color:#e5e8eb;font-family:system-ui,sans-serif}.gy-musical-top{position:absolute;left:50%;top:12%;transform:translateX(-50%);text-align:center;display:grid;gap:5px;justify-items:center}.gy-musical-title,.gy-musical-info{background:#172536de;border:1px solid #9eafbf66;border-radius:22px;padding:7px 18px;font-weight:700;font-size:16px}.gy-musical-info{font-size:12px;padding:4px 13px}.gy-musical-phases{position:absolute;left:35%;top:4%;width:30%;display:flex;gap:4px}.gy-musical-phases span{height:5px;flex:1;opacity:.3;border-radius:5px}.gy-musical-phases .active{opacity:1;box-shadow:0 0 9px currentColor}.gy-musical-actions{position:absolute;bottom:4%;right:4%;display:flex;gap:8px;pointer-events:auto}.gy-musical-actions button{position:relative;display:grid;place-items:center;gap:4px;min-width:78px;min-height:62px;padding:8px 14px;background:#f7f6f0e8;border:2px solid #535b69;border-radius:12px;color:#27374a;font-weight:800;font-size:14px;touch-action:none}.gy-musical-actions button kbd{font:600 10px system-ui;color:#54616c}.gy-musical-actions button:disabled{filter:grayscale(.8);opacity:.45}.gy-musical-actions button:active{transform:translateY(2px)}.gy-musical-dialogue{position:absolute;left:50%;bottom:clamp(116px,22vh,180px);transform:translateX(-50%);padding:0;max-width:88vw;width:max-content;background:transparent;border:0;border-radius:5px;text-align:center;text-shadow:0 2px 5px #000;pointer-events:none}.gy-lyric-en{font:500 clamp(10px,1.35vw,17px)/1.5 system-ui;white-space:normal;overflow-wrap:break-word;color:#fff}.gy-lyric-ko{font:650 clamp(12px,1.7vw,21px)/1.5 system-ui;white-space:normal;overflow-wrap:break-word;color:#fff0cc}.gy-musical-beat{width:54px;height:54px;border:4px solid #dbaeed;border-radius:50%;display:grid;place-items:center;font-size:25px;background:#ffffffef;color:#384358}.gy-musical-layer[data-reference='true']:not(.turn):not(.finale) .gy-musical-top,.gy-musical-layer[data-reference='true']:not(.turn):not(.finale) .gy-musical-phases{display:none}.gy-musical-layer.runner .gy-musical-actions{left:5%;right:5%;bottom:4%;justify-content:space-between}.runner .gy-musical-actions button{min-width:clamp(100px,16vw,220px);height:clamp(53px,11vh,95px);border-radius:50%;font-size:clamp(18px,3vw,39px);background:#fff8c999;border:4px solid #6e794b99;color:#fff;text-shadow:-2px -2px #263125,2px 2px #263125}.runner .gy-musical-actions kbd{display:none}.army .gy-musical-actions{left:3%;right:3%;bottom:2%;display:grid;grid-template-columns:.82fr .82fr repeat(6,1fr) .92fr;gap:5px}.army .gy-musical-actions button{padding:5px 3px;min-width:0;height:clamp(66px,13vh,115px);border:3px solid #292c33;border-radius:4px;background:#f2efe6;color:#1e272d;font-size:clamp(9px,1.1vw,16px);box-shadow:0 0 0 2px #b5a998}.army .gy-musical-actions kbd{display:none}.gy-unit-face{height:28px;font:800 30px/1 monospace;color:#222}.gy-unit-cost{font-size:12px}.gy-card-meter{position:absolute;bottom:0;left:0;height:6px;background:#5ccec7}.fighter .gy-musical-actions{right:3%;bottom:3%;gap:6px}.fighter .gy-musical-actions button{min-width:54px;width:clamp(52px,6.5vw,86px);height:clamp(50px,9vh,76px);padding:4px;background:#1c2935d9;color:#fff0d0;border:2px solid #c4ab76;border-radius:50%}.shooter .gy-musical-actions{right:3%;bottom:10%;display:grid}.shooter .gy-musical-actions button{background:#285c6a;color:#e2f6ff;border-color:#7cdeed}.rhythm .gy-musical-actions{bottom:3%;right:4%;gap:12px}.rhythm .gy-musical-actions button{background:#efe8e1;color:#574168;border-color:#8e709c;min-width:90px}.gy-turn-queue{position:absolute;left:1.5%;top:15%;width:70px;display:grid;gap:5px}.gy-turn-queue div{position:relative;height:44px;background:#172635d9;border:1px solid #7e9aad;color:#e7eef2;display:flex;align-items:center;justify-content:space-around;border-radius:3px;font-size:19px}.gy-turn-queue small{font:600 10px system-ui}.gy-turn-queue .enemy{border-color:#a77071;color:#e0a4a3}.gy-turn-queue .current{border:2px solid #f3d9a1;box-shadow:0 0 13px #eed09a77}.gy-turn-enemies{position:absolute;inset:0;pointer-events:none}.gy-turn-target{position:absolute;transform:translate(-50%,-100%);width:110px;pointer-events:auto;background:#0c192eaa;border:0;color:#f1eee1;padding:4px 6px;border-radius:4px;font:600 10px system-ui;text-align:left}.gy-turn-target.selected{outline:1px solid #f1d19a}.gy-turn-target .hp,.gy-turn-target .tough{height:4px;background:#342c2d;margin-top:3px}.gy-turn-target .hp i{display:block;height:4px;background:#d7987d}.gy-turn-target .tough{background:#4e5d6c}.gy-turn-target .tough i{display:block;height:3px;background:#dbe9ed}.gy-turn-target .weak{font-size:15px;color:#a8cae0;letter-spacing:.15em}.gy-turn-party{position:absolute;bottom:3.5%;left:13%;width:53%;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;pointer-events:auto}.gy-party-card{height:101px;position:relative;display:grid;grid-template-columns:50px 1fr;align-items:center;gap:4px;border:1px solid #9eabbc66;border-radius:10px;background:#132130d9;color:#dfeaf1;padding:7px;font:700 12px system-ui;text-align:left}.gy-party-card.active{outline:2px solid #f4d397;box-shadow:0 0 20px #e7bf6844}.gy-party-card .portrait{font:800 42px Georgia;text-align:center;color:var(--party)}.gy-party-card .hp{height:5px;background:#384649;grid-column:1/-1}.gy-party-card .hp i{display:block;height:5px;background:#83cbd1}.gy-party-card .energy{position:absolute;right:8px;top:-16px;width:36px;height:36px;border-radius:50%;display:grid;place-content:center;border:3px solid var(--party);background:#142330;font-size:10px}.gy-party-card.ready .energy{box-shadow:0 0 14px #ffecc7;color:#ffedab}.gy-party-card small{font:500 10px system-ui;color:#b9c8d8}.gy-turn-points{position:absolute;bottom:18%;right:4%;padding:8px 16px;background:#101e31dd;font-size:22px;letter-spacing:.3em;color:#b5e4e8;border-radius:20px}.turn .gy-musical-top{top:4%;left:77%;max-width:30%;font-size:12px}.turn .gy-musical-title{font-size:13px}.turn .gy-musical-info{font-size:12px}.turn .gy-musical-actions{bottom:4%;right:3%;width:27%;justify-content:flex-end}.turn .gy-musical-actions button{min-width:70px;width:31%;height:88px;border-radius:50%;background:#172a3ddd;color:#f3e8ca;border:2px solid #aabec6;padding:4px;font-size:13px}.turn .gy-musical-dialogue{bottom:24%;max-width:68vw}.curtain .gy-musical-top,.curtain .gy-musical-actions,.curtain .gy-musical-phases,.curtain .gy-turn-queue,.curtain .gy-turn-party,.curtain .gy-turn-enemies,.curtain .gy-turn-points{display:none}.curtain .gy-musical-dialogue{bottom:24%}.gy-musical-layer[data-reference='true'].shooter .gy-musical-dialogue{bottom:13%;max-width:72vw;background:transparent}.shooter .gy-lyric-en{font-size:clamp(9px,1vw,13px)}.shooter .gy-lyric-ko{font-size:clamp(11px,1.2vw,16px)}
.gy-musical-audio-retry{position:absolute;top:43%;left:50%;transform:translate(-50%,-50%);pointer-events:auto;padding:14px 22px;border:1px solid #fff9;border-radius:6px;background:#151c2eeb;color:white;font-weight:700;font-size:16px}
.gy-musical-layer[data-reference='true']:not(.turn) .gy-musical-dialogue{top:27%;bottom:auto}.gy-musical-layer[data-reference='true'].rhythm .gy-musical-dialogue{top:33%}.gy-musical-layer[data-reference='true'].shooter .gy-musical-dialogue{top:20%;bottom:auto}
@media(max-height:500px){.gy-turn-queue{width:48px;top:20%;gap:3px}.gy-turn-queue div{height:26px;font-size:13px}.gy-party-card{height:64px;grid-template-columns:30px 1fr;font-size:9px;padding:4px}.gy-party-card .portrait{font-size:26px}.gy-party-card .energy{width:27px;height:27px;font-size:8px;top:-11px;right:3px}.gy-party-card small{font-size:8px}.gy-turn-party{gap:4px;left:10%;bottom:3%}.turn .gy-musical-actions button{min-width:45px;height:57px;font-size:10px}.gy-turn-target{width:75px;font-size:8px}.gy-turn-target .weak{font-size:11px}.gy-turn-points{font-size:15px;bottom:21%}.turn .gy-musical-top{top:3%}.gy-musical-actions button{min-height:40px;font-size:10px;min-width:47px;padding:5px}.rhythm .gy-musical-actions button{min-width:65px}.gy-musical-dialogue{padding:5px 9px;bottom:clamp(90px,21vh,110px)}.gy-lyric-en{font-size:10px}.gy-lyric-ko{font-size:12px}.army .gy-musical-dialogue{bottom:24%}.fighter .gy-musical-dialogue{bottom:21%}}

.gy-theater-progress[hidden]{display:none!important}
.gy-theater-progress{position:absolute;top:2%;left:50%;transform:translateX(-50%);width:min(520px,57vw);display:grid;gap:4px;text-align:center;z-index:2;filter:drop-shadow(0 2px 4px #0009)}
.gy-theater-heading{color:#fff1c8;font:700 clamp(9px,1.1vw,13px)/1.3 system-ui;letter-spacing:.14em}
.gy-theater-meter{height:8px;background:#181b2999;border:1px solid #f9d8a488;border-radius:99px;overflow:hidden}
.gy-theater-fill{height:100%;background:linear-gradient(90deg,#ab4562,#e0b269,#f3e6ad);transition:width .15s linear}
.gy-theater-song{color:#eff3ff;font:500 clamp(9px,.9vw,12px)/1.3 system-ui}
.gy-musical-phases{display:none!important}
.gy-musical-dialogue{max-width:min(86vw,960px);width:86vw;filter:drop-shadow(0 2px 6px #000) drop-shadow(0 -1px 3px #0009)}
.gy-lyric-en{font-size:clamp(11px,1.35vw,17px)}
.gy-lyric-ko{font-size:clamp(13px,1.7vw,21px)}
 .gy-musical-layer.fighter .gy-theater-progress{top:21%}
@media(max-height:500px){.gy-theater-progress{top:1%;width:min(410px,49vw);gap:2px}.gy-theater-meter{height:5px}.gy-musical-dialogue{max-width:80vw}}
.gy-curtain-cast{position:absolute;top:18%;left:50%;transform:translateX(-50%);white-space:nowrap;font:500 clamp(12px,1.5vw,20px)/1.7 Georgia,serif;letter-spacing:.24em;text-shadow:0 2px 7px #000;color:#f5e3bb;pointer-events:none}
.gy-curtain-credits{position:absolute;inset:18% 12% 19%;overflow:hidden;text-align:center;pointer-events:none;mask-image:linear-gradient(transparent,#000 12%,#000 83%,transparent)}
.gy-curtain-credits>div{position:absolute;left:0;right:0;top:100%;display:grid;justify-items:center;gap:clamp(16px,4vh,40px);will-change:transform;color:#fff6e0;text-shadow:0 2px 13px #000;letter-spacing:.11em}
.gy-curtain-credits p{font:500 clamp(16px,2.3vw,28px)/1.7 Georgia,"Malgun Gothic",serif}
.gy-curtain-credits p:first-child{font-size:clamp(26px,4vw,58px);letter-spacing:.22em}
.gy-dedication{position:absolute;left:6%;right:6%;top:39%;text-align:center;font:500 clamp(20px,3.2vw,47px)/1.6 Georgia,"Malgun Gothic",serif;letter-spacing:.07em;color:#fff0d3;text-shadow:0 2px 13px #000,0 0 40px #f6c97a66;pointer-events:none}
.gy-musical-layer.finale .gy-musical-actions,.gy-musical-layer.finale .gy-musical-top,.gy-musical-layer.finale .gy-turn-queue,.gy-musical-layer.finale .gy-turn-party,.gy-musical-layer.finale .gy-turn-enemies,.gy-musical-layer.finale .gy-turn-points{display:none!important}
.gy-musical-layer.finale .gy-musical-dialogue{top:auto!important;bottom:4%!important;max-width:90vw}
.gy-dedication[hidden],.gy-curtain-credits[hidden],.gy-curtain-cast[hidden]{display:none!important}
@media(max-height:500px){.gy-curtain-credits{inset:16% 8% 24%}.gy-curtain-credits>div{gap:12px}.gy-curtain-credits p{font-size:14px}.gy-curtain-cast{top:19%;font-size:12px}.gy-dedication{top:37%;font-size:20px}}
.gy-musical-layer.runner .gy-musical-actions{justify-content:space-between;gap:clamp(4px,1vw,12px)}
.gy-musical-layer.runner .gy-musical-actions button{min-width:clamp(76px,14vw,175px);height:clamp(52px,11vh,90px);font-size:clamp(15px,2.3vw,29px)}
.gy-musical-layer.runner [data-musical-action="dash"]{border-color:#e6ca88;background:#425d76c9}
.gy-musical-layer.runner [data-musical-action="dash"]:not(:disabled){box-shadow:0 0 18px #ffe6a488}
/* A glowing action button is a tactile affordance, never a pattern explanation. */
.turn .gy-musical-actions button.spotlight-ready{border-color:#ffe6a6;color:#fff4d4;
background:#776143e8;box-shadow:0 0 20px #ffe1a68c,0 0 0 2px #f5d99680;
animation:gy-sung-response .55s ease-in-out infinite alternate}
@keyframes gy-sung-response{from{filter:brightness(.9)}to{filter:brightness(1.24)}}
@media(prefers-reduced-motion:reduce){.turn .gy-musical-actions button.spotlight-ready{animation:none}}
`;
export function createGyuwonMusicalHud(doc,shell,{onAction=()=>{}}={}){
 const style=doc.createElement('style');style.textContent=css;shell.appendChild(style);
 const wrap=doc.createElement('div');wrap.className='gy-musical-layer';wrap.hidden=true;
 const phases=doc.createElement('div');phases.className='gy-musical-phases';const spans=Object.values(GYUWON_MUSICAL_ACTS).map(a=>{const x=doc.createElement('span');x.style.background=a.color;phases.appendChild(x);return x;});
 const theater=doc.createElement('div');theater.className='gy-theater-progress';theater.setAttribute('aria-label','뮤지컬 공연 진행도');
 const theaterHeading=doc.createElement('div');theaterHeading.className='gy-theater-heading';
 const theaterMeter=doc.createElement('div');theaterMeter.className='gy-theater-meter';theaterMeter.setAttribute('role','progressbar');
 const theaterFill=doc.createElement('div');theaterFill.className='gy-theater-fill';theaterMeter.appendChild(theaterFill);
 const theaterSong=doc.createElement('div');theaterSong.className='gy-theater-song';theater.append(theaterHeading,theaterMeter,theaterSong);
 const top=doc.createElement('div');top.className='gy-musical-top';const title=doc.createElement('div');title.className='gy-musical-title';const info=doc.createElement('div');info.className='gy-musical-info';const beat=doc.createElement('div');beat.className='gy-musical-beat';top.append(title,info,beat);
 const dialogue=doc.createElement('div');dialogue.className='gy-musical-dialogue';const english=doc.createElement('div'),korean=doc.createElement('div');english.className='gy-lyric-en';korean.className='gy-lyric-ko';dialogue.append(english,korean);
 const actions=doc.createElement('div');actions.className='gy-musical-actions';const queue=doc.createElement('div');queue.className='gy-turn-queue';const targets=doc.createElement('div');targets.className='gy-turn-enemies';const party=doc.createElement('div');party.className='gy-turn-party';const points=doc.createElement('div');points.className='gy-turn-points';const curtainCast=doc.createElement('div');curtainCast.className='gy-curtain-cast';curtainCast.hidden=true;
 const credits=doc.createElement('div');credits.className='gy-curtain-credits';credits.hidden=true;
 const creditRoll=doc.createElement('div');for(const line of GYUWON_FINALE_CREDITS){const text=doc.createElement('p');text.textContent=line;creditRoll.appendChild(text);}credits.appendChild(creditRoll);
 const dedication=doc.createElement('div');dedication.className='gy-dedication';dedication.hidden=true;dedication.setAttribute('aria-live','off');
 const audioRetry=doc.createElement('button');audioRetry.type='button';audioRetry.className='gy-musical-audio-retry';audioRetry.textContent='음원 오류 · 재시도';audioRetry.hidden=true;audioRetry.addEventListener('click',()=>onAction('retry-audio'));wrap.append(phases,theater,top,dialogue,actions,queue,targets,party,points,curtainCast,credits,dedication,audioRetry);shell.appendChild(wrap);
 const bind=(btn,act)=>{btn.type='button';btn.dataset.musicalAction=act;btn.addEventListener('pointerdown',e=>{e.preventDefault();if(!btn.disabled)onAction(act);});btn.addEventListener('click',e=>{if(e.detail===0&&!btn.disabled)onAction(act);});for(const type of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(type,()=>{if(act==='slide'||act==='guard')onAction(act+'-end');});};
 let lastKind='',buttons=[],targetButtons=[],partyButtons=[];
 function rebuild(m){
  actions.replaceChildren();buttons=[];for(const [act,name,key]of names[m.kind]||names.finale){const b=doc.createElement('button');bind(b,act);if(m.kind==='army'&&act.startsWith('summon')){const type=Number(act.slice(6));b.innerHTML=`<span class="gy-unit-face">${['♧','◈','➶','⚔','✦','♜'][type]}</span><span>${name}</span><span class="gy-unit-cost">${REFERENCE_UNIT_TYPES[type].cost}원</span><i class="gy-card-meter"></i>`;}else b.innerHTML=`<span>${name}</span><kbd>${key}</kbd>`;actions.appendChild(b);buttons.push({b,act});}
  queue.replaceChildren();targets.replaceChildren();party.replaceChildren();targetButtons=[];partyButtons=[];
  if(m.year===5&&m.reference){
   for(let i=0;i<5;i++){const b=doc.createElement('button');b.className='gy-turn-target';bind(b,'target'+i);b.innerHTML='<div class="name"></div><div class="weak"></div><div class="hp"><i></i></div><div class="tough"><i></i></div>';targets.appendChild(b);targetButtons.push(b);}
   for(let i=0;i<4;i++){const p=REFERENCE_PARTY[i],b=doc.createElement('button');b.className='gy-party-card';b.style.setProperty('--party',p.color);bind(b,'ultimate'+i);b.innerHTML=`<span class="portrait">${glyphs[p.weapon]}</span><span>${p.name}<br><small>${i+1} · 필살기</small></span><span class="energy"></span><span class="hp"><i></i></span>`;party.appendChild(b);partyButtons.push(b);}
  }
 }
 function update(g,paused=false){
  const m=g?.gyuwon?.years?.musical;wrap.hidden=!m||g.status!=='playing';if(wrap.hidden)return;
  wrap.dataset.reference=String(!!m.reference);wrap.className='gy-musical-layer '+m.kind+(m.finishing?' curtain':'');
  if(lastKind!==m.kind){lastKind=m.kind;rebuild(m);}
  for(let i=0;i<spans.length;i++)spans[i].className=i===m.year-5?'active':i<m.year-5?'finished':'';
  const duration=Number.isFinite(m.clock?.duration)&&m.clock.duration>0?m.clock.duration:GYUWON_SONGS[gyuwonSongKey(m)].duration;
  const progress=Math.min(1,Math.max(0,m.time/duration)),overall=Math.min(1,Math.max(0,((m.year-5)+progress)/7));
  theater.hidden=!!m.finishing;theaterHeading.textContent='THE GREATEST SHOW · '+(m.year-4)+'막 / 7막 · '+Math.floor(overall*100)+'%';
  theaterSong.textContent=GYUWON_MUSICAL_ACTS[m.year].name+' · '+Math.floor(m.time/60)+':'+String(Math.floor(m.time%60)).padStart(2,'0')+' / '+Math.floor(duration/60)+':'+String(Math.floor(duration%60)).padStart(2,'0');
  theaterFill.style.width=(overall*100)+'%';theaterMeter.setAttribute('aria-valuenow',String(Math.floor(overall*100)));
  const isTurn=m.year===5&&m.reference;queue.hidden=targets.hidden=party.hidden=points.hidden=!isTurn;
  if(isTurn){
   // New encore props keep a clickable target linked to their collider.
   while(targetButtons.length<m.enemies.length){
    const i=targetButtons.length,b=doc.createElement('button');b.className='gy-turn-target';
    bind(b,'target'+i);b.innerHTML='<div class="name"></div><div class="weak"></div><div class="hp"><i></i></div><div class="tough"><i></i></div>';
    targets.appendChild(b);targetButtons.push(b);
   }
   title.textContent='5수 · 거대 최규원';const actor=m.party.find(a=>a.id===m.turnActor);info.textContent=m.turn==='player'?(actor?.name||'')+'의 차례':m.turn==='boss'?'최규원의 차례':'공연 중';
   points.textContent='✦'.repeat(m.skillPoints)+'◇'.repeat(5-m.skillPoints);
   queue.innerHTML=[{id:m.turnActor,team:actor?1:-1,weapon:actor?.weapon,av:0},...m.queue.slice(0,7)].map((a,i)=>`<div class="${a.team<0?'enemy':''} ${i===0?'current':''}"><span>${a.team>0?glyphs[a.weapon]||'◇':'◆'}</span><small>${Math.round(a.av)}</small></div>`).join('');
   targetButtons.forEach((b,i)=>{const e=m.enemies[i],p=m.targetScreens?.[i];b.hidden=e.hp<=0||e.active===false||!p?.visible;if(p){b.style.left=p.left+'px';b.style.top=p.top+'px';}b.classList.toggle('selected',i===m.targetIndex);b.querySelector('.name').textContent=e.name;b.querySelector('.weak').textContent=['╱','♜','➶','◇'][e.weakness]+(e.broken>0?' ✧':'');b.querySelector('.hp i').style.width=(e.hp/e.maxHp*100)+'%';b.querySelector('.tough i').style.width=(e.toughness/e.maxToughness*100)+'%';});
   partyButtons.forEach((b,i)=>{const p=m.party[i];b.classList.toggle('active',p.id===m.turnActor);b.classList.toggle('ready',p.energy>=100);b.disabled=m.turn==='finish'||p.energy<100||!!m.actorMotion||m.transition>0||m.songEnded||paused;b.querySelector('.energy').textContent=Math.round(p.energy)+'%';b.querySelector('.hp i').style.width=(p.hp/p.maxHp*100)+'%';});
  }else{title.textContent=m.year+'수 · '+GYUWON_MUSICAL_ACTS[m.year].name;info.textContent='COMBO '+m.combo+' · '+m.score;}
  buttons.forEach(({b,act})=>{let disabled=paused||m.transition>0||m.songEnded||m.finishing;
   if(isTurn){
    const a=m.raidAttack,counterWindow=m.turn==='boss'&&a&&!a.blocked
     &&a.age>=a.wind*.28&&a.age<=a.wind+.12;
    const reactive=act==='support'&&counterWindow;
    disabled=disabled||(!reactive&&(m.turn!=='player'||!!m.actorMotion))
     ||act==='skill'&&m.skillPoints<=0;
    if(act==='support'){
     b.classList.toggle('spotlight-ready',!!reactive&&!paused);
     b.querySelector('span').textContent=reactive?'빛의 응답':'지원';
    }
   }
   if(m.year===7){if(act.startsWith('summon')){const n=Number(act.slice(6)),s=REFERENCE_UNIT_TYPES[n];disabled=disabled||m.money<s.cost||m.unitCooldowns[n]>0;b.querySelector('.gy-card-meter').style.width=(1-m.unitCooldowns[n]/s.cool)*100+'%';}else if(act==='upgrade')disabled=disabled||m.money<m.workerLevel*95||m.workerLevel>=6;else if(act==='cannon'){
    const rally=!!m.armyTruce;
    disabled=disabled||(rally?(m.cannon<40||m.armyRallied):m.cannon<100);
    const title=b.querySelector('span');
    if(title)title.textContent=rally?'깃발 집결':'대포';
   }else if(act==='lane'){
    const title=b.querySelector('span');
    if(title)title.textContent=m.deployLane===1?'하단 생산':'상단 생산';
    b.style.outline=m.deployLane===1?'2px solid #a0dcd1':'2px solid #f2dbaa';
   }}
   if(m.year===6&&act==='dash'){disabled=disabled||(m.starCharge||0)<55||(m.dashCooldown||0)>0;b.title=disabled?'별빛을 모으면 질주할 수 있습니다':'별빛 질주';}
   if(m.year===10&&act==='bomb')disabled=disabled||m.bombs<=0;
   if(m.year===9&&act==='super')disabled=disabled||m.fighters[0].meter<100;b.disabled=disabled;
  });
  // The finale is a song-clocked memorial, not another QTE battle.
  const curtainCall=m.kind==='finale'&&!m.finishing;
  const frame=curtainCall?(m.curtainCall||gyuwonCurtainCallAt(m.time,duration)):null;
  curtainCast.hidden=!curtainCall||frame.mode!=='recollection';
  curtainCast.textContent=curtainCast.hidden?'':frame.name+' · '+frame.phase+'막의 기억';
  credits.hidden=!curtainCall||frame.mode!=='credits';
  if(!credits.hidden){
   const travel=credits.clientHeight+creditRoll.scrollHeight;
   creditRoll.style.transform='translateY(-'+Math.round(travel*frame.creditsProgress)+'px)';
  }
  const line=m.finishing?gyuwonDedicationAt(m.time):null;
  dedication.hidden=!line||line.opacity<=0;dedication.textContent=line?.line||'';
  dedication.style.opacity=String(line?.opacity||0);
  actions.hidden=curtainCall||m.finishing;
  top.hidden=curtainCall||m.finishing;
  const hasNote=!m.reference&&!!m.note&&!m.note.done&&m.kind==='rhythm';beat.hidden=!hasNote;if(hasNote){beat.style.transform='scale('+(1+Math.max(0,m.note.time/1.05))+')';beat.textContent=m.note.key==='roll'?'↯':m.note.key==='skill'?'♪':'♫';}
  audioRetry.hidden=m.clock?.source!=='error';
  const cue=gyuwonSubtitleAt(gyuwonSongKey(m),m.time);dialogue.hidden=!cue;english.textContent=cue?.en||'';korean.textContent=cue?.ko||'';wrap.style.background=m.finishing?'rgba(0,0,0,'+Math.max(0,Math.min(1,(m.curtain-GYUWON_SONGS.ending.duration*.9)/(GYUWON_SONGS.ending.duration*.1)))+')':'';
 }
 return {update,onAction(fn){onAction=fn;},dispose(){wrap.remove();style.remove();}};
}
