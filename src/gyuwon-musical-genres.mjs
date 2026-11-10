import {setupReferenceMinigame,actReferenceMinigame,tickReferenceMinigame} from './gyuwon-reference-rules.mjs';
import {actFivePerformanceAt,poseActFiveHands} from './gyuwon-act-five-score.mjs';
import {gyuwonDisplayYear} from './gyuwon-musical-route.mjs';
// The live route keeps four exam years, then four playable genres and a
// noncombat ensemble finale. Recording IDs 7/10 remain archive fixtures. No exam/result roll or fake remote damage is used here.
import {playerIncomingDamage} from './weapon-stats.mjs';
import {applyGyuwonPlayerDamage,gyuwonPlayerHpFloor} from './gyuwon-ending-survival.mjs';
import {GYUWON_SONGS,gyuwonSongKey} from './gyuwon-song-data.mjs';
import {GYUWON_RUNNER_ENTER_SECONDS} from './gyuwon-runner-director.mjs';
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {gyuwonMasterScene} from './gyuwon-master-director.mjs';
import {gyuwonLyricActionAt} from './gyuwon-lyric-actions.mjs';
import {gyuwonCurtainCallAt,isGyuwonCurtainCall} from './gyuwon-curtain-call.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export const gyuwonStageProgress=m=>clamp((m?.time||0)/(m?.clock?.duration||GYUWON_SONGS[gyuwonSongKey(m)]?.duration||180),0,1);
const FINALE_SCENES=Object.freeze({solo:0,memory:0,actors:1,runner:2,parade:2,breather:3,stars:4,'grand-chorus':5,'curtain-call':5,bow:5});
export const gyuwonFinaleMemoryPhase=time=>FINALE_SCENES[gyuwonMasterScene(11,time).kind]??0;
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const GYUWON_MUSICAL_ACTS=Object.freeze({
 5:Object.freeze({kind:'turn',name:'턴제 모험',color:'#e7a43f',title:'첫 번째 노래 · 새로운 모험'}),
 6:Object.freeze({kind:'runner',name:'끝없는 달리기',color:'#e879b5',title:'두 번째 노래 · 달려, 달려!'}),
 7:Object.freeze({kind:'army',name:'작은 전쟁',color:'#6db1eb',title:'세 번째 노래 · 모두 함께'}),
 8:Object.freeze({kind:'rhythm',name:'박자 맞추기',color:'#ad88eb',title:'세 번째 노래 · 발끝의 박자'}),
 9:Object.freeze({kind:'fighter',name:'격투 극장',color:'#df6261',title:'네 번째 노래 · 마지막 한 판'}),
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
  shotCooldown:0,invulnerable:0,guard:0,hitFlash:0,combo:0,success:0,score:0,
  turn:'player',turnCount:0,turnTime:0,turnWind:0,turnMove:'',turnGuard:false,
  obstacles:[],runnerSpawn:1.4,runnerDistance:0,jumpY:0,jumpV:0,slide:0,
  money:75,units:[],enemySpawn:2.2,armyPulse:0,armyBase:100,
  beat:.72,beatTime:0,note:null,noteCount:0,
  fightWind:1.4,fightCooldown:0,fightAttack:'punch',fightGuard:0,
  bullets:[],enemyShots:[],enemyWind:2.2,enemyTarget:null,
  finaleCount:0,finaleStep:0,finaleHazards:[],finaleNext:12,
  curtain:0,curtainLine:0,finishing:false};
}
function locate(g,m){
 const p=g.player,b=g.boss;
 p.action=null;p.floorY=0;p.floorV=0;p.invuln=Math.max(p.invuln,1.25);
 if(m.kind==='runner'){p.x=-8;p.z=0;b.x=12;b.z=0;}
 else if(m.kind==='army'){p.x=-19;p.z=0;b.x=19;b.z=0;}
 else if(m.kind==='shooter'){p.x=-9;p.z=0;b.x=10;b.z=0;}
 else if(m.kind==='turn'){p.x=-7;p.z=0;b.x=7;b.z=0;}
 else if(m.kind==='finale'){p.x=0;p.z=5;b.x=0;b.z=-8;}
 else {p.x=-7;p.z=0;b.x=7;b.z=0;}
 p.yaw=m.kind==='finale'?Math.PI:Math.PI/2;b.yaw=m.kind==='finale'?0:-Math.PI/2;
}
export function enterGyuwonMusical(g,emit=()=>{}){
 const e=g?.gyuwon?.years;
 if(!e||!isGyuwonMusicalYear(e.year))return false;
 const previous=e.musical;
 const m=newState(e.year);
 m.displayYear=gyuwonDisplayYear(e.year);m.fromYear=previous?.year??null;
 if(e.year===8&&previous?.year===6)m.danceHandoff={count:4,kinds:[0,1,2,3],fromRunner:true};
 // Preserve a concrete cast from the last seconds of VII instead of replacing
 // them with anonymous dancers at the VIII opening. The original song clocks
 // remain independent; the image carryover is a normal, unskippable transition.
 // Preserve the final full 3D theater model for Act VI's real entrance.
 // This is visual-only: no previous attack or combat clock is advanced.
 if(e.year===6&&previous?.year===5&&previous.giantRaid)
  m.handoffFromFive=previous;
  if(e.year===8&&previous?.year===7){
  m.danceHandoff=previous.armyFinale||{
   count:Math.max(3,Math.min(6,previous.units?.filter(u=>u.team===1&&u.hp>0).length||4)),
   kinds:previous.units?.filter(u=>u.team===1&&u.hp>0).slice(0,6).map(u=>u.type)||[]};
 }
 if(e.year===5){m.transition=5.8;m.entryDuration=5.8;m.overture=true;}else m.entryDuration=2.7;
 m.bpm=GYUWON_BEATS[e.year]?.bpm||GYUWON_SONGS[e.year].bpm;m.chartIndex=0;
 const from={px:g.player.x,pz:g.player.z,bx:g.boss.x,bz:g.boss.z};
 e.musical=m;e.mode='musical';e.cast=null;e.castT=0;
 g.player.hp=Math.max(gyuwonPlayerHpFloor(g),g.player.hp);
 e.grade=null;e.gradeT=0;e.subjectLabel=null;e.wards=[];e.signatureUsed=true;
 e.mapPending=false;e.mapClock=0;e.recover=0;e.day=365;
 g.gyuwon.space='white';g.gyuwon.stageMemory=null;g.gyuwon.pattern=null;
 g.gyuwon.hazards.length=0;g.projectiles.length=0;g.gyuwon.stun=0;
 g.boss.state='recovery';g.boss.phase=2;
 locate(g,m);setupReferenceMinigame(g,m);
 m.entry={...from,tx:g.player.x,tz:g.player.z,btx:g.boss.x,btz:g.boss.z};
 if(m.reference&&m.year>=6){g.player.x=m.entry.tx;g.player.z=m.entry.tz;}else{g.player.x=from.px;g.player.z=from.pz;}g.boss.x=from.bx;g.boss.z=from.bz;
 emit('gyuwon-musical-act',{year:e.year,genre:m.kind,title:m.title});
 emit('gyuwon-musical-dialogue',{line:m.dialogue,year:e.year});
 return true;
}
function deal(g,amount,emit){
 const e=g.gyuwon.years,m=e.musical;
 if(!m||m.finishing||m.songEnded||g.status!=='playing')return 0;
 const points=Math.max(0,Math.round(amount));
 m.score+=points;m.combo++;e.performance=(e.performance||0)+points;g.stats.hits++;
 m.hitFlash=.2;emit('gyuwon-musical-hit',{points,kind:m.kind});
 return points;
}
function take(g,amount,emit){
 const m=g.gyuwon.years?.musical,p=g.player;
 if(!m||m.finishing||p.invuln>0||m.guard>0||m.transition>0)return false;
 // A hit still lands, staggers, and produces feedback. It never kills the
 // player nor triggers the old surprise full heal in the narrative finale.
 const value=applyGyuwonPlayerDamage(g,playerIncomingDamage(g,amount*.4));
 p.invuln=.67;m.hitFlash=.26;
 emit('hurt',{amount:value});
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
 if(type==='light'||type==='skill')m.playerStrike={age:0,damage:type==='skill'?195:125,home:g.player.x};
 if(type==='roll')m.guard=2.6;
 m.turn='boss';m.turnWind=1.45;m.turnTime=0;m.turnGuard=false;
 m.turnOrigin=g.boss.x;
 m.turnMove=(m.turnCount++%3===2)?'crescendo':'swing';
 emit('gyuwon-musical-cue',{kind:'turn',wind:1.45});
 return true;
}
function rhythmPress(g,m,type,emit){
 if(type==='heal')return heal(g,emit);
 const note=m.note;
 if(!note||note.done||!['light','skill','roll'].includes(type))return false;
 const good=note.key===type&&Math.abs(note.time)<=.21;
 if(good){
  note.done=true;m.success++;deal(g,type==='skill'?135:105,emit);
  m.guard=.18;emit('gyuwon-musical-beat',{good:true,combo:m.combo});
 }else{
  m.combo=0;emit('gyuwon-musical-beat',{good:false});
 }
 return good;
}
export function actGyuwonMusical(g,type,emit=()=>{}){
 const m=g?.gyuwon?.years?.musical;
 if(!m||g.status!=='playing'||m.finishing||m.songEnded)return false;
 if(type==='skip-act')return false;
 if(m.transition>0||m.clock?.source==='error')return false;
 if(m.reference)return actReferenceMinigame(g,m,type,{deal,take,heal,emit});
 if(m.kind==='turn')return turnChoice(g,m,type,emit);
 if(m.kind==='rhythm')return rhythmPress(g,m,type,emit);
 if(m.kind==='finale')return false; // 11수 is an unskippable, noncombat curtain call.
 if(type==='heal')return heal(g,emit);
 if(m.kind==='runner'){
  if(type==='roll'&&m.jumpY<.01){m.jumpV=9.4;return true;}
  if(type==='skill'){m.slide=.67;return true;}
  if(type==='light'&&m.shotCooldown<=0){
   m.shotCooldown=.73;m.bullets.push({x:g.player.x,z:0,life:2,damage:36});return true;
  }
  return false;
 }
 if(m.kind==='army'){
  const setup={light:[30,64,30,3.2,1.8],skill:[55,48,70,9,1.4],roll:[78,135,20,2.6,1.5]}[type];
  if(!setup||m.money<setup[0]||m.units.length>=48)return false;
  m.money-=setup[0];m.units.push({id:g.nextId++,team:1,
   x:-17,z:0,hp:setup[1],attack:setup[2],range:setup[3],speed:setup[4],
   cool:.4,role:type});
  emit('gyuwon-musical-summon',{role:type,team:1});
  return true;
 }
 if(m.kind==='fighter'){
  if(type==='roll'){m.guard=.46;m.dash={left:.3,vx:-9};return true;}
  if(m.shotCooldown>0||!['light','skill'].includes(type))return false;
  const reach=type==='skill'?5.2:3.6;
  m.shotCooldown=type==='skill'?.87:.38;
  m.playerStrike={age:0,reach,damage:type==='skill'?188:104};
  return true;
 }
 if(m.kind==='shooter'){
  if(type==='roll'){
   m.guard=.43;m.invulnerable=.43;
   m.dash={left:.3,vx:-9};
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
  const q=clamp(m.turnTime/1.2,0,1),k=q*q*(3-2*q);
  g.boss.x=m.turnOrigin+(g.player.x+2.8-m.turnOrigin)*k;
  if(m.turnWind<=0){
   if(!m.turnGuard&&m.guard<=0&&near(g.player,g.boss,4.15))take(g,m.turnMove==='crescendo'?27:19,emit);
   else{m.success++;emit('gyuwon-musical-parry');}
   m.turn='recover';m.turnTime=.45;
  }
 }else if(m.turn==='recover'){
  g.boss.x+=(m.turnOrigin-g.boss.x)*Math.min(1,dt*9);
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
 for(const shot of m.bullets){shot.x+=24*dt;shot.life-=dt;
  if(near(shot,g.boss,1.6)){shot.life=0;deal(g,shot.damage,emit);}}
 m.bullets=m.bullets.filter(o=>o.life>0);
}
function tickArmy(g,m,dt,emit){
 m.money=clamp(m.money+dt*19,0,220);
 m.enemySpawn-=dt;
 if(m.enemySpawn<=0&&m.units.length<48){
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
 // Mapped beats from original-master excerpts; uncertain spans have sparse
 // guide notes, which should be replaced after manual full-recording charting.
 if(finale&&!m.finaleChart)m.finaleChart=gyuwonMasterRhythmNotes(11);
 const chart=finale?m.finaleChart:(GYUWON_BEATS[m.year]?.notes||[]);
 if(m.note){
  m.note.time=m.note.at-m.time;
  if(m.note.time<-.27){if(!m.note.done){m.combo=0;take(g,finale?10:16,emit);}m.note=null;}
 }
 while(!m.note&&m.chartIndex<chart.length){
  const beat=chart[m.chartIndex];
  if(beat.at<m.time-.27){m.chartIndex++;continue;}
  if(beat.at-m.time>1.05)break;
  m.chartIndex++;m.note={at:beat.at,time:beat.at-m.time,key:beat.key,index:beat.lane,done:false};
 }
 if(finale)m.finaleStep=gyuwonFinaleMemoryPhase(m.time);
}
function tickCurtainCall(g,m,duration){
 // No enemy patterns, rhythm misses, damage, camera chases or attacks:
 // the hero watches five performers revisit each earlier boss phase.
 m.curtainCall=gyuwonCurtainCallAt(m.time,duration);
 m.finaleHazards.length=0;m.finaleNext=Infinity;m.note=null;m.playerStrike=null;
 m.hitFlash=0;m.dash=null;m.guard=0;
 g.player.action=null;g.player.x=0;g.player.z=5;g.player.floorY=0;
 g.player.yaw=Math.PI;g.boss.x=0;g.boss.z=-8;g.boss.yaw=0;
}
function tickFighter(g,m,dt,input,emit){
 const p=g.player,b=g.boss;
 p.x=clamp(p.x+clamp(input.x??0,-1,1)*7.8*dt,-18,17);
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
 p.x=clamp(p.x+clamp(input.x??0,-1,1)*8*dt,-19,19);
 p.z=clamp(p.z+clamp(input.z??0,-1,1)*8*dt,-14,14);
 b.z=Math.sin(m.time*.85)*3.8;b.x=10+Math.sin(m.time*.5)*1.1;
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
  if(near(shot,b,2.3)){shot.life=0;deal(g,shot.damage,emit);}
 }
 m.bullets=m.bullets.filter(s=>s.life>0&&Math.abs(s.x)<25&&Math.abs(s.z)<25);
 for(const shot of m.enemyShots){
  shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;shot.life-=dt;
  if(near(shot,p,1.1)){shot.life=0;take(g,18,emit);}
 }
 m.enemyShots=m.enemyShots.filter(s=>s.life>0&&Math.abs(s.x)<25&&Math.abs(s.z)<25);
 p.yaw=angle(p,b);b.yaw=angle(b,p);
}

function clearAct(g,m){
 g.gyuwon.hazards.length=0;g.projectiles.length=0;
 m.enemyShots=[];m.bullets=[];m.obstacles=[];m.units=[];m.note=null;
}
function beginCurtain(g,m,emit){
 clearAct(g,m);m.finishing=true;m.curtain=0;m.time=0;m.clock=null;
 m.dialogue='';m.transition=0;g.gyuwon.years.mode='curtain';
 emit('gyuwon-musical-curtain',{year:11});
}
function tickStrike(g,m,dt,emit){
 const a=m.playerStrike;if(!a)return;a.age+=dt;
 if(m.kind==='turn'){
  const q=Math.min(1,a.age/.42),back=Math.max(0,Math.min(1,(a.age-.65)/.4));
  g.player.x=a.home+(g.boss.x-2.8-a.home)*Math.sin(q*Math.PI/2)*(1-back);
 }
 if(!a.hit&&a.age>=.44){a.hit=true;
  if(near(g.player,g.boss,a.reach||3.6))deal(g,a.damage,emit);
 }
 if(a.age>=1.05)m.playerStrike=null;
}
export function tickGyuwonMusical(g,dt,{emit=()=>{},input={},advance=()=>{}}={}){
 const e=g?.gyuwon?.years,m=e?.musical;
 if(!m||g.status!=='playing')return;
 const realDt=clamp(dt,0,1/30),song=GYUWON_SONGS[gyuwonSongKey(m)];
 // Finite audio position is authoritative. Buffering freezes gameplay too.
 // Media time is authoritative even when visual frames lag; audio errors freeze the act.
 const priorSongTime=m.time;
 dt=m.clock?(m.clock.source==='media'?Math.max(0,Math.min(.05,m.clock.time-m.time)):0):realDt;
 if(m.clock?.ended)m.time=m.clock.duration;
 else if(m.clock?.source==='media')m.time=Math.max(m.time,m.clock.time);
 else m.time+=dt;
 if(m.giantRaid)m.songPerformance=actFivePerformanceAt(m.time);
 // After the 2D road is fully opaque, release the entire prior 3D combat
 // state so six-minute runs do not retain two sets of character data.
 if(m.year===6&&m.handoffFromFive&&m.time>=GYUWON_RUNNER_ENTER_SECONDS)
  m.handoffFromFive=null;
 const duration=m.clock?.duration||song.duration;
 m.actProgress=clamp(m.time/duration,0,1);
 m.masterScene=gyuwonMasterScene(gyuwonSongKey(m),m.time);
 // The complete 170-line performance is sampled from the actual audio clock.
 // Year 7 and year 10 are explicitly excluded from this lyric layer.
 m.lyricAction=gyuwonLyricActionAt(gyuwonSongKey(m),m.time);
 if(isGyuwonCurtainCall(m))tickCurtainCall(g,m,m.clock?.duration||song.duration);
 const ended=m.clock?m.clock.ended:m.time>=duration;
 if(m.finishing){
  m.curtain=m.time;
  const start=duration*.8;
  g.boss.hp=800*(1-clamp((m.time-start)/Math.max(.01,duration-start),0,1));
  if(ended){g.boss.hp=0;g.boss.state='dead';g.status='won';emit('victory');}
  return;
 }
 if(ended&&!m.songEnded){
  m.songEnded=true;m.settle=0;m.settleFrom=g.boss.hp;
  // Keep the last pose visible while old damage ownership is removed.
  for(const o of [...m.enemyShots,...m.bullets,...m.obstacles,...m.units])o.damage=0;
  emit('gyuwon-song-ended',{year:e.year,target:song.target});
 }
 if(m.songEnded){
  tickStrike(g,m,realDt,emit);
  m.settle=Number.isFinite(m.clock?.afterEnd)?m.clock.afterEnd:m.settle+realDt;const q=clamp(m.settle/1.1,0,1),ease=q*q*(3-2*q);
  g.boss.hp=m.settleFrom+(song.target-m.settleFrom)*ease;
  if(q===1){g.boss.hp=song.target;clearAct(g,m);
   if(e.year===11)beginCurtain(g,m,emit);else advance();}
  return;
 }
 if(dt<=0)return;
 // The stage entrance advances by genuine audio time even when physics dt is capped.
 m.transition=Math.max(0,m.transition-Math.max(0,m.time-priorSongTime));
 m.guard=Math.max(0,m.guard-dt);m.invulnerable=Math.max(0,m.invulnerable-dt);
 m.shotCooldown=Math.max(0,m.shotCooldown-dt);m.hitFlash=Math.max(0,m.hitFlash-dt);
 g.player.invuln=Math.max(0,g.player.invuln-dt);
 if(m.dash){const d=m.dash,step=Math.min(dt,d.left);g.player.x=clamp(g.player.x+d.vx*step,-19,19);d.left-=step;if(d.left<=0)m.dash=null;}
 if(m.transition>0){
  if(m.giantRaid)poseActFiveHands(m,dt);
  const q=1-m.transition/m.entryDuration,k=q*q*(3-2*q),a=m.entry;
  if(a&&!(m.reference&&m.year>=6)){g.player.x=a.px+(a.tx-a.px)*k;g.player.z=a.pz+(a.tz-a.pz)*k;g.boss.x=a.bx+(a.btx-a.bx)*k;g.boss.z=a.bz+(a.btz-a.bz)*k;}
  return;
 }
 if(m.reference){tickReferenceMinigame(g,m,dt,input||{},{deal,take,heal,emit});e.day=Math.max(0,Math.ceil(365*(1-m.time/duration)));return;}
 tickStrike(g,m,dt,emit);
 if(m.kind==='turn')tickTurn(g,m,dt,emit);
 else if(m.kind==='runner')tickRunner(g,m,dt,emit);
 else if(m.kind==='army')tickArmy(g,m,dt,emit);
 else if(m.kind==='rhythm')tickRhythm(g,m,dt,emit);
 else if(m.kind==='fighter')tickFighter(g,m,dt,input||{},emit);
 else if(m.kind==='shooter')tickShooter(g,m,dt,input||{},emit);
 else if(m.kind==='finale')tickCurtainCall(g,m,duration);
 e.day=Math.max(0,Math.ceil(365*(1-m.time/duration)));
}
