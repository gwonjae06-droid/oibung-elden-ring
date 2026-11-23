import {readBattleSession} from './src/battle-session.mjs';
import {act as actArena, startPattern} from './src/combat.mjs';
import {damageArenaBoss} from './src/arena-damage.mjs';
import {startClownPattern} from './src/clown-combat.mjs';
import {prepareCircusPhaseTransition} from './src/clown-troupe.mjs';
import {actDice} from './src/dice-player.mjs';
import {damageDice} from './src/dice-combat.mjs';
import {actBlood,damageBlood,startBloodPattern,bloodBossAirborne} from './src/blood-combat.mjs';

const id = new URL(location.href).searchParams.get('boss');
const chapter = {
  kwon: {name:'긴턱의 이권재', latin:'THE JAWBLADE', numeral:'I', hp:4822, tone:'#ccb792', weapon:'sword'},
  clown: {name:'광대 오슬우', latin:'THE RINGMASTER', numeral:'II', hp:5076, tone:'#e3ad71', weapon:'sword'},
  dice: {name:'거대 주사위 박성원', latin:'THE HOUSE', numeral:'III', hp:5711, tone:'#7ed4b2', weapon:'bow'},
  blood: {name:'영원한 혈왕 배서준', latin:'THE BLOOD KING', numeral:'IV', hp:6345, tone:'#f2a8a9', weapon:'sword'},
}[id];
if (!chapter) throw new Error('Unknown montage chapter');
const width=1280, height=720, fps=30;
const canvas=document.createElement('canvas');
canvas.width=width;
canvas.height=height;
const ctx=canvas.getContext('2d',{alpha:false});
const output={frames:[], events:[], index:0};
const smooth=(x)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const move={x:0,z:0,lock:true};
let game,recording=false,clock=0,remaining=0,shotAge=0,closing=0,frame,plan;
let phase=0,ended=false;

function draw(renderer) {
  const source=renderer.domElement;
  ctx.fillStyle='#090809';ctx.fillRect(0,0,width,height);
  ctx.filter='contrast(1.035) saturate(1.055) brightness(1.065)';
  ctx.drawImage(source,0,0,width,height);
  ctx.filter='none';
  const edge=ctx.createRadialGradient(640,355,235,640,355,730);
  edge.addColorStop(0,'rgba(6,4,5,0)');edge.addColorStop(1,'rgba(6,4,5,.35)');
  ctx.fillStyle=edge;ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#090809';ctx.fillRect(0,0,width,25);ctx.fillRect(0,695,width,25);
  const intro=output.index/fps;
  if(intro<2.35){
    const alpha=smooth(intro/.38)*smooth((2.35-intro)/.45);
    ctx.save();ctx.globalAlpha=alpha;
    const shadow=ctx.createLinearGradient(0,0,730,0);
    shadow.addColorStop(0,'rgba(7,6,7,.85)');shadow.addColorStop(1,'rgba(7,6,7,0)');
    ctx.fillStyle=shadow;ctx.fillRect(0,490,735,205);
    ctx.fillStyle=chapter.tone;ctx.fillRect(59,538,2,101);
    ctx.font='600 17px Georgia, serif';ctx.letterSpacing='3px';
    ctx.fillText('ODEN RING  /  '+chapter.numeral,80,557);
    ctx.letterSpacing='0px';ctx.fillStyle='#f5f0e7';ctx.font='600 45px Noto Serif CJK KR, serif';
    ctx.fillText(chapter.name,78,603);
    ctx.fillStyle=chapter.tone;ctx.font='500 16px Georgia, serif';ctx.letterSpacing='3px';
    ctx.fillText(chapter.latin,81,634);ctx.restore();
  }
  if(closing>0){
    ctx.save();ctx.globalAlpha=smooth((closing-.18)/.43);ctx.textAlign='center';
    const shade=ctx.createLinearGradient(0,420,0,695);
    shade.addColorStop(0,'rgba(9,7,8,0)');shade.addColorStop(1,'rgba(9,7,8,.87)');
    ctx.fillStyle=shade;ctx.fillRect(0,420,width,275);
    ctx.fillStyle=chapter.tone;ctx.fillRect(584,545,112,1);
    ctx.font='600 43px Noto Serif CJK KR, serif';ctx.letterSpacing='9px';
    ctx.fillStyle='#f7f0e4';ctx.fillText('토벌',640,597);ctx.restore();
  }
  const blackout=Math.max(1-smooth(intro/.22),closing>1.85?smooth((closing-1.85)/.72):0);
  if(blackout>0){ctx.fillStyle='rgba(9,8,9,'+blackout+')';ctx.fillRect(0,0,width,height);}
  output.frames.push(canvas.toDataURL('image/jpeg',.89).split(',')[1]);
  output.index++;
}

const shoot=window.__shoot={ready:false,manual:false,loops:[],movement:move,
  render(renderer,scene,camera,g,unblocked){
    if (g!==game) return;
    if (unblocked && g.status==='playing') this.ready=true;
    if (recording) draw(renderer);
  }
};

function observe(g) {
  game=g;
  g.boss.maxHp=g.boss.hp=chapter.hp;
  g.startGrace=0;
  const push=g.events.push;
  g.events.push=function(...items) {
    if(recording){
      for(const e of items)output.events.push({t:output.index/fps,type:e.type,source:e.source,phase:g.boss.phase});
    }
    return push.apply(this,items);
  };
}

function play(seconds,{enter=null,stop=null,rate=1,pilot='orbit',capture=true}={}) {
  return {take:Math.ceil(seconds*fps),enter,stop,rate,pilot,capture};
}
function target() {
  const {boss:b,dice:d,player:p}=game;
  if(!d) return b;
  if(d.giant) return {x:0,z:-21};
  return d.pose || p;
}
function sight(distance=8,offset=0){
  const {player:p,boss:b}=game;
  const q=game.dice?.giant?{x:0,z:-37}:game.dice?.pose||b;
  if(id==='dice'&&!game.dice.giant){
    p.x=Math.max(-48,Math.min(48,q.x+distance));p.z=Math.max(-48,Math.min(48,q.z+offset));
  } else {p.x=q.x+offset;p.z=q.z+distance;}
  p.yaw=Math.atan2(q.x-p.x,q.z-p.z);
}
function faceAndAttack(){
  const p=game.player,q=game.dice?.pose||game.boss;
  p.action=null;
  p.yaw=Math.atan2(q.x-p.x,q.z-p.z);
  if(id==='dice') return actDice(game,'light');
  if(id==='blood') return actBlood(game,'light');
  return actArena(game,'light');
}
function damage(ratio){
  const b=game.boss;
  const wasPhase=b.phase;
  const amount=Math.max(0,b.hp-b.maxHp*ratio);
  const q=game.dice?.pose||b;
  const point={x:q.x,y:q.y??2.4,z:q.z};
  if(id==='dice') damageDice(game,amount,point);
  else if(id==='blood') damageBlood(game,amount,point);
  else damageArenaBoss(game,amount,0,{point});
  if(id==='clown'&&b.phase!==wasPhase)prepareCircusPhaseTransition(game);
}
function moveName(name){
  if(id==='kwon') startPattern(game,name);
  else if(id==='clown') startClownPattern(game,name);
  else if(id==='blood'&&!startBloodPattern(game,name))throw new Error('Blood pattern could not start: '+name);
}
const hitCut=(ratio)=>[
  play(.44,{enter:()=>{if(id!=='dice') sight(id==='blood'?3.5:3.25);faceAndAttack();},pilot:'still'}),
  play(.32,{enter:()=>damage(ratio),pilot:'still'}),
];
const win=()=>[
  play(.42,{enter:()=>{if(id!=='dice')sight(id==='blood'?3.6:3.5);faceAndAttack();},pilot:'still'}),
  play(2.62,{enter:()=>{damage(0);if(game.status!=='won')throw new Error('Finisher was rejected');closing=.001;},pilot:'still'}),
];

const plans={
  kwon:()=>[
    play(4.8,{enter:()=>{sight(7,1);moveName('leap');}}),
    ...hitCut(.65),
    play(5.5,{pilot:'still',stop:()=>game.boss.state!=='transition'}),
    play(4.1,{enter:()=>{sight(7,-2);moveName('wave');}}),
    ...hitCut(.32),
    play(5.5,{pilot:'still',stop:()=>game.boss.state!=='transition'}),
    play(3.6,{enter:()=>{sight(11,1);moveName('skyRend');},pilot:'wide'}),
    ...hitCut(.18),
    play(6.1,{pilot:'still'}),
    play(7.7,{pilot:'wide',capture:false,stop:()=>game.kwonMoon.mode==='storm'&&game.kwonMoon.time>=4.8}),
    play(3.55,{pilot:'wide'}),
    play(15,{pilot:'wide',capture:false,stop:()=>game.kwonMoon.completed}),
    ...win(),
  ],
  clown:()=>[
    play(4.9,{enter:()=>{sight(9,1);moveName('knifeJugglerRelay');}}),
    ...hitCut(.49),
    play(5.5,{pilot:'still',stop:()=>game.boss.state!=='transition'}),
    play(4.8,{enter:()=>{sight(9,-2);moveName('directorInfernalRing');},pilot:'wide'}),
    ...hitCut(.22),
    play(6.0,{enter:()=>{sight(12,2);moveName('allCastRequiem');},pilot:'wide'}),
    ...win(),
  ],
  dice:()=>[
    play(4.3,{enter:()=>{sight(21,15);const d=game.dice;Object.assign(d,{state:'recovery',t:100,pendingPattern:true,forcedPatternSlot:1});},pilot:'wide'}),
    ...hitCut(.65),
    play(9,{pilot:'still',stop:()=>game.dice.giant?.state==='recovery'}),
    play(5.5,{enter:()=>{sight(37,-1);Object.assign(game.dice.giant,{t:100,captureSlot:14});},pilot:'wide'}),
    ...hitCut(.32),
    play(7.6,{enter:()=>{sight(38,0);const giant=game.dice.giant;Object.assign(giant,{state:'recovery',t:100,captureSlot:7});},pilot:'wide'}),
    ...win(),
  ],
  blood:()=>[
    play(4.6,{enter:()=>{sight(10,0);moveName('fountain');},pilot:'wide'}),
    ...hitCut(.69),
    play(6.2,{pilot:'still',stop:()=>game.boss.phase===2&&game.boss.state!=='transition'}),
    play(1.0,{enter:()=>{sight(13,3);damage(3000/game.boss.maxHp);},pilot:'still'}),
    play(14,{pilot:'wide',stop:()=>game.blood.requiredTsunamiDone&&game.boss.state!=='pattern'}),
    ...hitCut(.24),
    play(7,{pilot:'still',stop:()=>game.boss.phase===3&&game.boss.state!=='transition'}),
    play(6.7,{enter:()=>{sight(12,1);moveName('seraphInwardPillars');},pilot:'wide'}),
    play(2.2,{pilot:'still',capture:false,stop:()=>!bloodBossAirborne(game)&&game.boss.state!=='transition'}),
    ...win(),
  ],
};

function setMovement(mode) {
  const p=game.player,q=target();
  const dx=q.x-p.x,dz=q.z-p.z,range=Math.max(1,Math.hypot(dx,dz));
  const forward=mode==='wide'?(range<8?-.58:0):mode==='orbit'?(range>10?.45:range<5?-.42:0):0;
  const sideways=mode==='still'?0:Math.cos(shotAge*.8)*.55;
  move.x=(dx*forward+dz*sideways)/range;
  move.z=(dz*forward-dx*sideways)/range;
  p.invuln=Math.max(.22,p.invuln||0);
  p.hp=Math.max(p.maxHp*.65,p.hp);
  if(mode!=='still'&&!p.action&&Math.abs(shotAge-1.1)<.017){
    if(id==='dice')actDice(game,'roll',move);
    else if(id==='blood')actBlood(game,'roll',move);
    else actArena(game,'roll');
  }
}

shoot.batch=(count=12)=>{
  if(!shoot.ready)throw new Error('Battle is not ready');
  if(!shoot.manual){shoot.manual=true;frame=shoot.loops.at(-1);clock=performance.now();plan=plans[id]();}
  for(let i=0;i<count&&!ended;i++){
    if(remaining<=0||plan[0]?.stop?.()&&shotAge>=.15){
      if(remaining!==0||shotAge>0)plan.shift();
      if(!plan.length){ended=true;break;}
      remaining=plan[0].take;shotAge=0;
      recording=plan[0].capture;shoot.skipRender=!recording;
      plan[0].enter?.();
    }
    if(phase!==game.boss.phase){phase=game.boss.phase;output.events.push({t:output.index/fps,type:'phase-marker',phase});}
    const dt=plan[0].rate/fps;
    clock+=1000*dt;
    setMovement(plan[0].pilot);
    frame(clock,dt,1/fps);
    if(closing>0)closing+=1/fps;
    remaining--;
    shotAge+=1/fps;
  }
  const result={frames:output.frames,events:output.events,index:output.index,done:ended,phase,status:game.status,shot:plan.length};
  output.frames=[];output.events=[];
  return result;
};

async function launch(){
  document.getElementById('journey')?.close();
  try{localStorage.setItem('oibung-muted','1');}catch{}
  if(id==='kwon'){
    await import('./src/arena.mjs');
    const s=readBattleSession(document);
    if(!s)throw new Error('Arena session missing');
    s.start(chapter.weapon,observe);
    return;
  }
  const options={weapon:chapter.weapon,practice:true,configure:observe};
  if(id==='clown') (await import('./src/clown-battle.mjs')).launchClownBattle(options);
  else if(id==='dice') (await import('./src/dice-battle.mjs')).launchDiceBattle(options);
  else (await import('./src/blood-battle.mjs')).launchBloodBattle(options);
}
launch().catch(error=>{shoot.error=error.stack;console.error(error);});
