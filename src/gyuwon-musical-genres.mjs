// One unbroken, playable eleven-act fight. Acts 1-4 keep the authored
// annual system. Acts 5-11 replace it with six distinct controls/genres and
// a final musical. No exam/result roll or fake remote damage is used here.
import {acceptAnnualDamage,annualFloor,syncAnnualHealth} from './gyuwon-annual-progress.mjs';
import {playerIncomingDamage} from './weapon-stats.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const GYUWON_MUSICAL_ACTS=Object.freeze({
 5:Object.freeze({kind:'turn',name:'턴제 모험',color:'#e7a43f',title:'첫 번째 노래 · 새로운 모험'}),
 6:Object.freeze({kind:'runner',name:'끝없는 달리기',color:'#e879b5',title:'두 번째 노래 · 달려, 달려!'}),
 7:Object.freeze({kind:'army',name:'작은 전쟁',color:'#6db1eb',title:'세 번째 노래 · 모두 함께'}),
 8:Object.freeze({kind:'rhythm',name:'박자 맞추기',color:'#ad88eb',title:'네 번째 노래 · 발끝의 박자'}),
 9:Object.freeze({kind:'fighter',name:'격투 극장',color:'#df6261',title:'다섯 번째 노래 · 마지막 한 판'}),
 10:Object.freeze({kind:'shooter',name:'총알의 왈츠',color:'#6eaf8a',title:'여섯 번째 노래 · 빗발치는 별'}),
 11:Object.freeze({kind:'finale',name:'마지막 뮤지컬',color:'#e0bd79',title:'마지막 노래 · 잊지 못할 무대'})
});
export const isGyuwonMusicalYear=year=>Number.isInteger(year)&&year>=5&&year<=11;
const scripted=[
 '자, 이제부터는 내가 한번 이야기를 바꿔볼게!',
 '이번에는 모두 함께 달려보자!',
 '혼자 하는 공연은 너무 외롭잖아!',
 '이제 내 박자에 맞춰 줘!',
 '마지막까지 웃으며 싸워 보자!',
 '별들이 쏟아지는 무대가 필요해!',
 '관객 여러분… 정말 마지막 노래예요.'
];
function newState(year){
 const a=GYUWON_MUSICAL_ACTS[year];
 return {year,kind:a.kind,time:0,transition:2.7,title:a.title,color:a.color,
  dialogue:scripted[year-5],dialogueUntil:4.7,
  shotCooldown:0,invulnerable:0,guard:0,hitFlash:0,combo:0,success:0,
  turn:'player',turnTime:0,turnWind:0,turnMove:'',turnGuard:false,
  obstacles:[],runnerSpawn:1.4,runnerDistance:0,jumpY:0,jumpV:0,slide:0,
  money:75,units:[],enemySpawn:2.2,armyPulse:0,armyBase:100,
  beat:.72,beatTime:0,note:null,noteCount:0,
  fightWind:1.4,fightCooldown:0,fightAttack:'punch',fightGuard:0,
  bullets:[],enemyShots:[],enemyWind:2.2,enemyTarget:null,
  finaleCount:0,finaleStep:0,
  curtain:0,curtainLine:0,finishing:false};
}
function locate(g,m){
 const p=g.player,b=g.boss;
 p.action=null;p.floorY=0;p.floorV=0;p.invuln=Math.max(p.invuln,1.25);
 if(m.kind==='runner'){p.x=-8;p.z=0;b.x=12;b.z=0;}
 else if(m.kind==='army'){p.x=-19;p.z=0;b.x=19;b.z=0;}
 else if(m.kind==='shooter'){p.x=-9;p.z=0;b.x=10;b.z=0;}
 else if(m.kind==='turn'){p.x=-7;p.z=0;b.x=7;b.z=0;}
 else {p.x=-7;p.z=0;b.x=7;b.z=0;}
 p.yaw=Math.PI/2;b.yaw=-Math.PI/2;
}
export function enterGyuwonMusical(g,emit=()=>{}){
 const e=g?.gyuwon?.years;
 if(!e||!isGyuwonMusicalYear(e.year))return false;
 const m=newState(e.year);
 e.musical=m;e.mode='musical';e.cast=null;e.castT=0;
 e.grade=null;e.gradeT=0;e.subjectLabel=null;e.wards=[];e.signatureUsed=true;
 e.mapPending=false;e.mapClock=0;e.recover=0;e.day=365;
 g.gyuwon.space='white';g.gyuwon.stageMemory=null;g.gyuwon.pattern=null;
 g.gyuwon.hazards.length=0;g.projectiles.length=0;g.gyuwon.stun=0;
 g.boss.state='recovery';g.boss.phase=2;
 locate(g,m);
 emit('gyuwon-musical-act',{year:e.year,genre:m.kind,title:m.title});
 emit('gyuwon-musical-dialogue',{line:m.dialogue,year:e.year});
 return true;
}
function deal(g,amount,emit){
 const e=g.gyuwon.years,m=e.musical;
 if(!m||m.finishing||g.status!=='playing')return 0;
 const result=acceptAnnualDamage(g,Math.max(0,amount));
 const done=result.health;
 if(done>0){
  g.stats.damage+=done;g.stats.hits++;
  m.hitFlash=.2;emit('boss-hit',{amount:done,x:g.boss.x,y:1.7,z:g.boss.z});
  emit('gyuwon-musical-hit',{amount:done,kind:m.kind});
 }
 return done;
}
function take(g,amount,emit){
 const m=g.gyuwon.years?.musical,p=g.player;
 if(!m||m.finishing||p.invuln>0||m.guard>0||m.transition>0)return false;
 const value=Math.min(p.hp,playerIncomingDamage(g,amount));
 p.hp=Math.max(0,p.hp-value);p.invuln=.67;m.hitFlash=.26;
 emit('hurt',{amount:value});
 if(!p.hp){g.status='lost';emit('death');}
 return true;
}
const heal=(g,emit)=>{
 const p=g.player;
 if(!p.potions||p.hp>=p.maxHp)return false;
 p.potions--;p.hp=Math.min(p.maxHp,p.hp+65);emit('healed');return true;
};
function turnChoice(g,m,type,emit){
 if(m.turn==='boss'){
  if(type==='roll'){m.turnGuard=true;emit('gyuwon-musical-parry');return true;}
  return false;
 }
 if(m.turn!=='player')return false;
 if(type==='heal'&&!heal(g,emit))return false;
 if(type==='light')deal(g,125,emit);
 if(type==='skill')deal(g,195,emit);
 if(type==='roll')m.guard=2.6;
 m.turn='boss';m.turnWind=1.45;m.turnTime=0;m.turnGuard=false;
 m.turnMove=(m.combo++%3===2)?'crescendo':'swing';
 emit('gyuwon-musical-cue',{kind:'turn',wind:1.45});
 return true;
}
function rhythmPress(g,m,type,emit){
 if(type==='heal')return heal(g,emit);
 const note=m.note;
 if(!note||note.done||!['light','skill','roll'].includes(type))return false;
 const good=note.key===type&&Math.abs(note.time)<=.21;
 if(good){
  note.done=true;m.success++;m.combo++;deal(g,type==='skill'?135:105,emit);
  m.guard=.18;emit('gyuwon-musical-beat',{good:true,combo:m.combo});
 }else{
  m.combo=0;emit('gyuwon-musical-beat',{good:false});
 }
 return good;
}
export function actGyuwonMusical(g,type,emit=()=>{}){
 const m=g?.gyuwon?.years?.musical;
 if(!m||g.status!=='playing'||m.finishing||m.transition>0)return false;
 if(m.kind==='turn')return turnChoice(g,m,type,emit);
 if(m.kind==='rhythm'||m.kind==='finale')return rhythmPress(g,m,type,emit);
 if(type==='heal')return heal(g,emit);
 if(m.kind==='runner'){
  if(type==='roll'&&m.jumpY<.01){m.jumpV=9.4;return true;}
  if(type==='skill'){m.slide=.67;return true;}
  if(type==='light'&&m.shotCooldown<=0){
   m.shotCooldown=.73;deal(g,36,emit);return true;
  }
  return false;
 }
 if(m.kind==='army'){
  const setup={light:[30,64,30,3.2,1.8],skill:[55,48,70,9,1.4],roll:[78,135,20,2.6,1.5]}[type];
  if(!setup||m.money<setup[0])return false;
  m.money-=setup[0];m.units.push({id:g.nextId++,team:1,
   x:-17,z:0,hp:setup[1],attack:setup[2],range:setup[3],speed:setup[4],
   cool:.4,role:type});
  emit('gyuwon-musical-summon',{role:type,team:1});
  return true;
 }
 if(m.kind==='fighter'){
  if(type==='roll'){m.guard=.46;g.player.x=clamp(g.player.x-2.6,-18,15);return true;}
  if(m.shotCooldown>0||!['light','skill'].includes(type))return false;
  const reach=type==='skill'?5.2:3.6;
  m.shotCooldown=type==='skill'?.87:.38;
  if(Math.abs(g.player.x-g.boss.x)<=reach){
   deal(g,type==='skill'?188:104,emit);
   g.boss.x=clamp(g.boss.x+.6,-16,17);
  }
  return true;
 }
 if(m.kind==='shooter'){
  if(type==='roll'){
   m.guard=.43;m.invulnerable=.43;
   g.player.x=clamp(g.player.x-2.8,-19,19);
   return true;
  }
  if(m.shotCooldown>0||!['light','skill'].includes(type))return false;
  const spread=type==='skill'?[-.22,0,.22]:[0];
  const theta=angle(g.player,g.boss);
  for(const d of spread)m.bullets.push({x:g.player.x,z:g.player.z,
   vx:Math.sin(theta+d)*27,vz:Math.cos(theta+d)*27,life:2,damage:type==='skill'?65:69});
  m.shotCooldown=type==='skill'?.7:.24;
  emit('gyuwon-musical-shot',{count:spread.length});
  return true;
 }
 return false;
}
function tickTurn(g,m,dt,emit){
 if(m.turn==='boss'){
  m.turnTime+=dt;m.turnWind-=dt;
  if(m.turnWind<=0){
   if(!m.turnGuard&&m.guard<=0)take(g,m.turnMove==='crescendo'?27:19,emit);
   else{m.success++;emit('gyuwon-musical-parry');}
   m.turn='recover';m.turnTime=.45;
  }
 }else if(m.turn==='recover'){
  m.turnTime-=dt;if(m.turnTime<=0)m.turn='player';
 }
}
function tickRunner(g,m,dt,emit){
 const p=g.player;
 m.jumpY=Math.max(0,m.jumpY+m.jumpV*dt);
 m.jumpV=m.jumpY>0?m.jumpV-24*dt:0;
 if(m.jumpY===0)m.jumpV=0;
 p.floorY=m.jumpY;m.slide=Math.max(0,m.slide-dt);
 m.runnerDistance+=dt*13;
 m.runnerSpawn-=dt;
 if(m.runnerSpawn<=0){
  m.runnerSpawn=1.12+(m.success%3)*.2;
  m.obstacles.push({id:g.nextId++,x:18,kind:m.success%4===2?'low':'high',
   hit:false,passed:false});
 }
 for(const o of m.obstacles){
  const old=o.x;o.x-=13*dt;
  if(!o.hit&&old>=p.x&&o.x<=p.x){
   o.hit=true;
   const avoided=o.kind==='high'?m.jumpY>1.05:m.slide>.05;
   if(avoided){m.success++;m.combo++;deal(g,110,emit);}
   else{m.combo=0;take(g,18,emit);}
  }
 }
 m.obstacles=m.obstacles.filter(o=>o.x>-21);
}
function tickArmy(g,m,dt,emit){
 m.money=clamp(m.money+dt*19,0,220);
 m.enemySpawn-=dt;
 if(m.enemySpawn<=0){
  m.enemySpawn=2.05+(m.success%3)*.36;
  m.units.push({id:g.nextId++,team:-1,x:17,z:0,hp:55+(m.success%4)*12,
   attack:16,range:2.7,speed:1.5,cool:.4,role:'enemy'});
 }
 for(const u of m.units){
  if(u.hp<=0)continue;
  u.cool=Math.max(0,u.cool-dt);
  const closest=m.units.filter(v=>v.team!==u.team&&v.hp>0)
   .sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x))[0];
  const reach=closest&&Math.abs(closest.x-u.x)<u.range;
  if(reach){if(u.cool<=0){closest.hp-=u.attack;u.cool=u.role==='skill'?1.25:.84;}}
  else u.x+=u.team*u.speed*dt;
  if(u.team===1&&u.x>=17){
   u.hp=0;m.success++;deal(g,u.attack*(u.role==='roll'?2.1:2.9),emit);
  }else if(u.team===-1&&u.x<=-17){
   u.hp=0;take(g,16,emit);
  }
 }
 m.units=m.units.filter(u=>u.hp>0&&Math.abs(u.x)<=20);
 g.player.x=-19;g.boss.x=19;
}
function tickRhythm(g,m,dt,emit,finale=false){
 m.beatTime+=dt;
 if(m.note){
  m.note.time-=dt;
  if(m.note.time<-.27){
   if(!m.note.done){m.combo=0;take(g,finale?25:19,emit);}
   m.note=null;
  }
 }
 if(!m.note&&m.beatTime>=.19){
  m.beatTime=0;
  const cycle=m.noteCount++;
  const keys=finale?['light','roll','light','skill','light','light','roll','skill']:
   ['light','light','roll','light','skill','light','roll','light'];
  m.note={key:keys[cycle%keys.length],time:1.05,done:false,
   index:cycle%4};
 }
 if(finale){
  // The final show changes its choreographed light/wall beat without
  // replacing the player controls or throwing in unexplained death hits.
  m.finaleStep=Math.floor(m.time/5)%6;
 }
}
function tickFighter(g,m,dt,input,emit){
 const p=g.player,b=g.boss;
 p.x=clamp(p.x+clamp(input.x,-1,1)*7.8*dt,-18,17);
 const reach=Math.abs(p.x-b.x);
 m.fightCooldown-=dt;m.fightWind-=dt;
 if(m.fightWind<=0&&m.fightAttack){
  if(reach<4.15)take(g,m.fightAttack==='kick'?28:20,emit);
  m.fightAttack=null;m.fightCooldown=1.10;
 }
 if(!m.fightAttack&&m.fightCooldown<=0){
  m.fightAttack=m.combo%3===2?'kick':'punch';
  m.fightWind=m.fightAttack==='kick'?1.20:1.02;
  emit('gyuwon-musical-cue',{kind:m.fightAttack,wind:m.fightWind});
 }
 if(!m.fightAttack&&reach>3.1)b.x+=Math.sign(p.x-b.x)*Math.min(3.2*dt,reach-3.1);
 p.z=b.z=0;p.yaw=Math.PI/2;b.yaw=-Math.PI/2;
}
function tickShooter(g,m,dt,input,emit){
 const p=g.player,b=g.boss;
 p.x=clamp(p.x+clamp(input.x,-1,1)*8*dt,-19,19);
 p.z=clamp(p.z+clamp(input.z,-1,1)*8*dt,-14,14);
 b.z=Math.sin(m.time*.85)*6;b.x=10+Math.sin(m.time*.5)*2;
 m.enemyWind-=dt;
 if(m.enemyWind<=0){
  const a=angle(b,p);m.enemyTarget={x:p.x,z:p.z,wind:1.05,age:0,a};
  m.enemyWind=2.2;
 }
 if(m.enemyTarget){
  const w=m.enemyTarget;w.age+=dt;
  if(w.age>=w.wind){
   for(const spread of [-.14,0,.14]){
    m.enemyShots.push({x:b.x,z:b.z,
     vx:Math.sin(w.a+spread)*12,vz:Math.cos(w.a+spread)*12,life:4});
   }
   m.enemyTarget=null;
  }
 }
 for(const shot of m.bullets){
  shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;shot.life-=dt;
  if(near(shot,b,2.1)){shot.life=0;deal(g,shot.damage,emit);}
 }
 m.bullets=m.bullets.filter(s=>s.life>0&&Math.abs(s.x)<25&&Math.abs(s.z)<25);
 for(const shot of m.enemyShots){
  shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;shot.life-=dt;
  if(near(shot,p,1.1)){shot.life=0;take(g,18,emit);}
 }
 m.enemyShots=m.enemyShots.filter(s=>s.life>0&&Math.abs(s.x)<25&&Math.abs(s.z)<25);
 p.yaw=angle(p,b);b.yaw=angle(b,p);
}
export function tickGyuwonMusical(g,dt,{emit=()=>{},input={},advance=()=>{}}={}){
 const e=g?.gyuwon?.years,m=e?.musical;
 if(!m||g.status!=='playing')return;
 dt=clamp(dt,0,1/30);m.time+=dt;
 m.transition=Math.max(0,m.transition-dt);
 m.guard=Math.max(0,m.guard-dt);m.invulnerable=Math.max(0,m.invulnerable-dt);
 m.shotCooldown=Math.max(0,m.shotCooldown-dt);m.hitFlash=Math.max(0,m.hitFlash-dt);
 g.player.invuln=Math.max(0,g.player.invuln-dt);
 if(m.finishing){
  m.curtain+=dt;
  g.boss.hp=Math.max(0,800*(1-clamp((m.curtain-13)/4,0,1)));
  const lines=[
   [1.4,'한 소년은 아주 오랫동안 달렸습니다.'],
   [5.2,'수많은 세상을 여행했지만, 자신의 꿈은 아직 찾지 못했지요.'],
   [9.0,'그는 마지막으로 무대에 서서 조용히 물었습니다.'],
   [12.0,'나도… 뭔가 되고 싶었는데.'],
   [15.0,'그렇게 소년의 긴 공연이 끝났습니다.']
  ];
  for(let i=m.curtainLine;i<lines.length;i++)if(m.curtain>=lines[i][0]){
   m.curtainLine=i+1;m.dialogue=lines[i][1];
   m.dialogueUntil=m.time+3.45;emit('gyuwon-musical-dialogue',{line:m.dialogue,year:11});
  }
  if(m.curtain>=17.6){
   g.boss.hp=0;g.boss.state='dead';g.status='won';emit('victory');
  }
  return;
 }
 if(m.transition>0)return;
 if(e.year===11&&g.boss.hp<=800){
  // The last 800 HP is not a surprise new fight: it is a locked,
  // unskippable narrative ending. Clear ALL live projectiles.
  m.finishing=true;m.curtain=0;m.curtainLine=0;m.dialogue='…이제, 무대가 끝나는 걸까?';
  m.dialogueUntil=m.time+2.7;e.mode='curtain';
  g.gyuwon.hazards.length=0;m.enemyShots=[];m.bullets=[];m.obstacles=[];m.units=[];
  emit('gyuwon-musical-curtain',{year:11});
  emit('gyuwon-musical-dialogue',{line:m.dialogue,year:11});
  return;
 }
 const inputs=input||{};
 if(m.kind==='turn')tickTurn(g,m,dt,emit);
 else if(m.kind==='runner')tickRunner(g,m,dt,emit);
 else if(m.kind==='army')tickArmy(g,m,dt,emit);
 else if(m.kind==='rhythm')tickRhythm(g,m,dt,emit);
 else if(m.kind==='fighter')tickFighter(g,m,dt,inputs,emit);
 else if(m.kind==='shooter')tickShooter(g,m,dt,inputs,emit);
 else if(m.kind==='finale')tickRhythm(g,m,dt,emit,true);
 if(g.status!=='playing')return;
 // Never ask for a random examination grade again after act four.
 // A short curtain bridge gives the stage and camera time to change
 // without an abrupt jump to another set of controls.
 if(g.boss.hp<=annualFloor(g)+.000001){
  if(!Number.isFinite(m.nextAct))m.nextAct=1.3;
  m.nextAct-=dt;if(m.nextAct<=0){advance();return;}
 }
 syncAnnualHealth(g);
}
