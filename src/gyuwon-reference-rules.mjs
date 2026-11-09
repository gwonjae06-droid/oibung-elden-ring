import {setupGiantRaid,actGiantRaid,tickGiantRaid} from './gyuwon-giant-raid.mjs';
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';
import {gyuwonFightScene,gyuwonFightGround,GYUWON_FIGHT_SET_PIECES} from './gyuwon-fight-director.mjs';
import {gyuwonMasterScene,gyuwonAlignDanceBeat} from './gyuwon-master-director.mjs';
import {gyuwonDanceScene,gyuwonDanceJudge,gyuwonDanceNextCue,GYUWON_DANCE_WINDOWS} from './gyuwon-dance-director.mjs';
import {gyuwonArmyScene} from './gyuwon-army-director.mjs';
import {gyuwonRunnerScene,gyuwonRunnerAccent,gyuwonRunnerGap,gyuwonRunnerObstacleVariant,gyuwonRunnerLyricStage} from './gyuwon-runner-director.mjs';
import {runnerInitMotion,runnerPressJump,runnerPressSlide,runnerReleaseSlide,runnerStepMotion,runnerObstacleContact,runnerGuideReset,runnerGuideBridge,runnerGuideCatch,runnerGuideWarning} from './gyuwon-runner-physics.mjs';
export const REFERENCE_UNIT_TYPES=Object.freeze([
 {name:'턱검 기사',cost:40,hp:74,attack:15,range:1.8,speed:2,cool:2.2},
 {name:'광대 인형',cost:80,hp:195,attack:10,range:1.6,speed:1.1,cool:3.5},
 {name:'카지노 주사위',cost:125,hp:62,attack:30,range:7.4,speed:1.35,cool:4.4},
 {name:'혈익 전사',cost:175,hp:140,attack:48,range:2.4,speed:1.7,cool:5},
 {name:'답안 마도사',cost:240,hp:88,attack:65,range:8.5,speed:1.1,cool:6},
 {name:'거대 행진자',cost:360,hp:390,attack:84,range:3.2,speed:.8,cool:8}
]);
export const REFERENCE_PARTY=Object.freeze([
 {name:'이권재 · 턱검',weapon:'sword',speed:118,color:'#7abbe4'},
 {name:'오슬우 · 광대',weapon:'hammer',speed:92,color:'#efb668'},
 {name:'박성원 · 주사위',weapon:'bow',speed:126,color:'#95d4ac'},
 {name:'배서준 · 혈술',weapon:'cards',speed:108,color:'#c5a0e7'}
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.z||0)-(b.z||0));
export const usesReference2d=m=>!!m?.reference&&m.year>=6&&m.year<=10&&!m.finishing;
export function setupReferenceMinigame(g,m){
 if(m.year<5||m.year>10)return;
 m.reference=true;m.nextId=0;m.judgement='';m.judgementUntil=0;
 if(m.year===5){
  setupGiantRaid(g,m,REFERENCE_PARTY);
 }else if(m.year===6){
  g.player.x=-10;g.player.z=0;runnerInitMotion(m);m.energy=100;m.jellies=[];m.runnerSpawn=1.8;m.jellySpawn=.15;m.platforms=[{x:-35,end:28,y:0}];m.runnerRecoverClock=14;m.runnerBiome='meadow';m.runnerDistance=0;m.pickups=0;m.bonus=0;m.fallRecovery=0;m.starCharge=0;m.dashTime=0;m.dashCooldown=0;m.runnerScene=gyuwonRunnerScene(0);m.runnerBiome='theater';m.runnerSpeed=9;m.runnerGuided=true;m.guideRescues=0;m.guideBridgesLeft=0;m.guideAction='';m.guideActionUntil=0;m.guideScene='overture';m.runnerLyric=null;m.lyricObstacleKeys=new Set();m.runnerPreviousAudio=0;
 }else if(m.year===7){
  m.money=180;m.moneyCap=500;m.workerLevel=1;m.unitCooldowns=[0,0,0,0,0,0];m.baseHp=1000;m.baseMaxHp=1000;m.enemyBaseHp=3000;m.enemyBaseMaxHp=3000;m.cannon=65;m.cannonShot=null;m.armyWave=1;m.enemySpawn=2;m.units=[];m.baseReform=0;m.enemyFort=1;m.armyTruce=false;m.deployLane=0;m.armyRallied=false;m.armyReunionDone=false;m.armyConvoys=0;m.armyConvoyClock=3;m.rallyPulse=0;m.armySiegeFlash=0;m.armyVerseRecruits=0;m.armyCaptainRecruits=0;
 }else if(m.year===8){
  const chart=GYUWON_BEATS[8],period=60/chart.bpm;
  m.dancePeriod=period;m.dancePatterns=[];let start=5.2,index=0;
  while(start+period*8<174.5){
   // Source-clocked figures with advance body/footstep preparation; no notes
   // including its intimate bridge; only the last unskippable bow is exempt.

   const kind=['pose','quick','turn','pose','quick','turn','pose','quick'][index%8];
   const count=kind==='quick'?3:index%3===1?4:3;
   const first=gyuwonAlignDanceBeat(start+period*(kind==='turn'?5:6));
   const cue=Math.max(start,first-Math.max(1.35,period*3.4));
   if(first+(count-1)*(kind==='pose'?2:1)*period>=174.5)break;
   m.dancePatterns.push({id:index,kind,cue,first,count,spacing:kind==='pose'?2:1,
    done:[],misses:[],facing:index%2?-1:1});
   start=first+period*((count-1)*(kind==='pose'?2:1)+(index%4===3?2.4:1.5));
   index++;
  }
  m.dancePose=0;m.dancePoseKind='dance';m.danceFacing=1;m.danceFlash=0;
  m.danceLastCue=-1;m.danceCue='';m.danceError=0;m.danceEnergy=0;
  m.danceRivalScore=0;m.danceScene=gyuwonDanceScene(0);m.danceCueId='';
  m.dancePreviousTime=0;m.danceHit=null;m.note=null;m.playerWeapon=g.weapon||'sword';
 }else if(m.year===9){
  g.player.x=-7;g.boss.x=7;g.player.z=g.boss.z=0;
  m.fighters=[{x:-7,y:0,vy:0,hp:100,maxHp:100,meter:20,facing:1,action:null,stun:0,guard:false,crouch:false,combo:0},{x:7,y:0,vy:0,hp:100,maxHp:100,meter:0,facing:-1,action:null,stun:0,guard:false,crouch:false,combo:0}];
  m.fightRound=1;m.fightReset=0;m.enemyThink=1.35;m.hitSparks=[];m.roundWins=[0,0];m.fightHitstop=0;m.roundWait=false;m.fightWorld=gyuwonFightScene(0);m.fightHazards=[];m.fightCueKeys=new Set();m.encoreOrbs=[];m.encoreCollected=0;m.encoreNext=0;m.fightJumpLatch=false;m.fightParryWindow=0;m.fightParryFlash=0;m.fightPriorScene='handoff';m.fightLastLyricActionId=null;m.fightLyricMotion=null;m.playerWeapon=g.weapon||'sword';
 }else if(m.year===10){
  g.player.x=0;g.player.z=13;m.weaponMode='spread';m.bombs=3;m.power=1;m.shotCooldown=0;m.bullets=[];m.enemyShots=[];m.shooterTargets=[{id:g.nextId++,x:-6,z:-12,hp:180,maxHp:180,phase:0,wind:1.6,aim:0,kind:'carrier'},{id:g.nextId++,x:6,z:-12,hp:180,maxHp:180,phase:1,wind:2.25,aim:0,kind:'carrier'}];m.shooterSpawn=4;m.powerItems=[];m.chain=0;m.chainTime=0;m.scroll=0;m.bombEffect=0;m.autoFire=true;m.finalCarrierSpawned=false;m.victoryFlight=false;
 }
}
const fighterSpecs={light:{wind:.2,live:.12,recovery:.25,range:3.1,damage:9,reachY:1.4},kick:{wind:.29,live:.15,recovery:.32,range:4.3,damage:14,reachY:.8},skill:{wind:.42,live:.19,recovery:.43,range:5.6,damage:22,reachY:1.5},super:{wind:.62,live:.27,recovery:.55,range:10,damage:35,reachY:2.5}};
function fighterAttack(f,type){
 if(f.action||f.stun>0)return false;
 if(type==='super'&&f.meter<100)return false;
 if(type==='super')f.meter-=100;
 f.action={kind:type,t:0,...fighterSpecs[type],hit:false};return true;
}
export function actReferenceMinigame(g,m,type,c){
 if(type==='heal')return c.heal(g,c.emit);
 if(m.year===5)return actGiantRaid(g,m,type,c);
 if(m.year===6){
  // Keep movement controls, collision height and the drawn armor in sync.
  if(['light','roll','jump'].includes(type))return runnerPressJump(m);
  if(type==='skill'||type==='slide')return runnerPressSlide(m);
  if(type==='slide-end')return runnerReleaseSlide(m);

  return false;
 }
 if(m.year===7){
  if(type==='lane'){m.deployLane=1-(m.deployLane||0);return true;}
  if(type==='upgrade'){const cost=m.workerLevel*95;if(m.money<cost||m.workerLevel>=6)return false;m.money-=cost;m.workerLevel++;m.moneyCap=400+m.workerLevel*150;return true;}
  if(type==='cannon'){
   if(m.armyTruce){if(m.cannon<40||m.armyRallied)return false;
    m.cannon-=40;m.armyRallied=true;m.rallyPulse=2.4;
    m.money=Math.min(m.moneyCap,m.money+75);
    for(const u of m.units)if(u.team>0)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.5);
    return true;
   }
   if(m.cannon<100||m.cannonShot)return false;
   m.cannon=0;m.cannonShot={age:0,hit:false,x:-18,hitIds:[]};return true;
  }
  const n=type.startsWith('summon')?Number(type.slice(6)):{light:0,skill:2,roll:1}[type],spec=REFERENCE_UNIT_TYPES[n];
  if(!spec||m.money<spec.cost||m.unitCooldowns[n]>0||m.units.length>=48)return false;
  m.money-=spec.cost;m.unitCooldowns[n]=spec.cool;m.units.push({id:g.nextId++,team:1,type:n,x:-17,z:0,hp:spec.hp,maxHp:spec.hp,attack:spec.attack,range:spec.range,speed:spec.speed,cool:0,wind:0,hit:false,attackAge:0,knock:0,role:n===2||n===4?'ranged':'melee',lane:m.deployLane||0});return true;
 }
 if(m.year===8){
  // The score, anticipation pose and physical note all read one clock/cue.
  // Two buttons only: J is a standard/quick step, L is the turn.
  const judgement=gyuwonDanceJudge(m.dancePatterns,m.time,type,m.dancePeriod);
  if(!judgement)return false;
  if(!judgement.accepted){
   if(judgement.error<=GYUWON_DANCE_WINDOWS.good){
    m.combo=0;m.danceError=.4;
   }
   return false;
  }
  const p=judgement.pattern;
  p.done[judgement.index]=true;
  m.dancePose=.52;
  m.dancePoseKind=p.kind==='turn'?'turn':p.kind==='quick'?'quick':'dance';
  m.danceFacing=p.kind==='turn'?-m.danceFacing:p.facing;
  m.danceFlash=.44;
  m.danceEnergy=Math.min(100,(m.danceEnergy||0)+(judgement.grade==='PERFECT'?13:8));
  m.success++;
  m.judgement=judgement.grade;m.judgementUntil=m.time+.5;
  // The burst is attached to the ACTUAL accepted press, never just a flash
  // that looks like a hit but fails to score.
  m.danceHit={at:m.time,action:judgement.action,grade:judgement.grade,facing:m.danceFacing,
   scheduledAt:judgement.at,kind:p.kind};
  c.deal(g,judgement.grade==='PERFECT'?150:100,c.emit);
  return true;
 }
 if(m.year===9){
  const f=m.fighters[0];
  if(type==='guard'){m.guardHeld=true;m.fightParryWindow=.22;return true;}
  if(type==='guard-end'){m.guardHeld=false;return true;}
  if(m.fightReset>0){
   if(type!=='light'||m.encoreCollected>=6)return false;
   const orb=m.encoreOrbs.find(o=>!o.collected&&Math.abs(o.x-f.x)<2.9);
   if(!orb)return false;
   orb.collected=true;m.encoreCollected++;f.meter=Math.min(100,f.meter+8);
   c.deal(g,24,c.emit);return true;
  }
  if(type==='jump'||type==='roll'){if(f.y>0||f.stun>0)return false;f.vy=10;return true;}
  if(type==='super')return fighterAttack(f,'super'); // older programmatic commands
  if(type==='kick'||type==='skill')return fighterAttack(f,type);
  if(type!=='light')return false;
  const combo=f.combo||0;
  return fighterAttack(f,f.meter>=100?'super':combo>=4?'skill':combo>=2?'kick':'light');
 }
 if(m.year===10){
  if(type==='roll'||type==='bomb'){if(!m.bombs)return false;m.bombs--;m.bombEffect=1.1;m.enemyShots=[];m.guard=1.2;for(const e of m.shooterTargets){e.hp-=90;c.deal(g,90,c.emit);}return true;}
  if(type==='skill'){m.weaponMode=m.weaponMode==='laser'?'spread':'laser';return true;}
  if(type==='light'){m.shotCooldown=0;return true;}
 }
 return false;
}
function tickReferenceRunner(g,m,dt,c){
 const p=g.player,scene=gyuwonRunnerScene(m.time,m.clock?.duration||GYUWON_SONGS[6].duration);
 const previous=m.runnerScene?.key;
 m.runnerScene=scene;m.runnerBiome=scene.biome;m.runnerLyric=gyuwonRunnerLyricStage(scene.time);m.runnerGuided=true;
 const relief=scene.relief,opening=scene.opening>.01,
  accent=gyuwonRunnerAccent(scene.time);
 if(previous!==scene.key){
  runnerGuideReset(m,scene);
  // Reset the old attack's warning; no "invisible" windups across new acts.
  if(relief){m.obstacles.length=0;m.runnerSpawn=2.4;}
  else m.runnerSpawn=Math.max(m.runnerSpawn,1.2);
 }
 m.dashTime=0;m.dashCooldown=0;
 const speed=scene.speed+(m.bonus>0?1.2:0);
 m.runnerSpeed=speed;
 m.bonus=Math.max(0,m.bonus-dt);m.runnerDistance+=speed*dt;
 m.energy=Math.max(0,m.energy-dt*(relief?.5:1.25));
 m.fallRecovery=Math.max(0,m.fallRecovery-dt);
 // The entire world moves past the stationary armored knight.
 for(const platform of m.platforms){platform.x-=speed*dt;platform.end-=speed*dt;}
 m.platforms=m.platforms.filter(a=>a.end>-35);
 let last=m.platforms.at(-1);
 if(!last){m.platforms.push({x:p.x+4,end:p.x+23,y:0});last=m.platforms[0];}
 if(last.end<37){
  const gap=gyuwonRunnerGap(scene,m.pickups);
  const bridge=runnerGuideBridge(m,last.end,gap,m.time);
  const next={x:last.end+gap,end:last.end+gap+21+(m.pickups%3)*2,y:0};
  // All road segments remain ordered left→right, including physical bridges.
  if(bridge)m.platforms.push(bridge);
  m.platforms.push(next);
 }
 const grounded=m.platforms.some(a=>p.x>=a.x&&p.x<=a.end);
 runnerStepMotion(m,grounded,dt);
 if(m.jumpY< -3&&runnerGuideCatch(m,p,m.time)){
  c.emit('gyuwon-runner-bridge-rescue',{year:6,biome:scene.biome});
 }
 if(m.jumpY< -5){
  if(m.fallRecovery<=0)c.take(g,25,c.emit);
  m.energy=Math.max(0,m.energy-12);m.jumpY=2.8;m.jumpV=0;m.jumpCount=0;
  m.grounded=false;m.fallRecovery=1.4;
  m.platforms.push({x:p.x-3,end:p.x+12,y:0});
  m.platforms.sort((a,b)=>a.x-b.x);
 }
 p.floorY=m.jumpY;
 // Make the literal mountain/curtain lyrics affect REAL existing collision
 // geometry, but never silently place a hazard during a seek or in a road gap.
 const lyric=m.lyricAction,priorAudio=m.runnerPreviousAudio||0;
 const regularFrame=m.time>=priorAudio&&m.time-priorAudio<.18;
 if(lyric&&regularFrame&&m.time-lyric.start<.20&&
    !m.lyricObstacleKeys.has(lyric.id)){
  m.lyricObstacleKeys.add(lyric.id);
  const event=lyric.attackEvents.find(e=>e.type==='runner-obstacle');
  const kind=event?.kind;
  if(kind&&!relief&&!opening){
   const position=p.x+17.5;
   if(m.platforms.some(a=>position>=a.x+1&&position<=a.end-1)){
    m.obstacles.push({id:g.nextId++,x:position,kind,
     variant:event.variant,width:1.8,hit:false,
     section:scene.key,spawnTime:m.time,lyricId:lyric.id});
    m.runnerSpawn=Math.max(m.runnerSpawn,1.4);
   }
  }
 }
 m.runnerPreviousAudio=m.time;
 // Every obstacle is born offscreen right, with a real approach interval.
 if(!relief&&!opening){
  m.runnerSpawn-=dt;
  if(m.runnerSpawn<=0){
   const period=scene.key==='final-sprint'?.94:
   scene.key==='skyroad'?1.12:scene.key==='bridge'?1.18:scene.key==='rain'?1.19:
   scene.key==='sunrise'?1.24:1.38;
   m.runnerSpawn=period+(m.nextId%4===3?.25:0);
   const index=m.nextId||0;
   const pattern=scene.key==='rain'?['low','high','low','spire','high','low']:
    ['high','low','high','spire','low','high'];
   const challenge=pattern[index%pattern.length],kind=challenge==='low'?'low':'high';
   m.obstacles.push({id:g.nextId++,x:24,kind,challenge,height:challenge==='spire'?2.33:1.30,
    variant:gyuwonRunnerObstacleVariant(scene,index),width:challenge==='spire'?1.5:1.3,hit:false,
    section:scene.key,spawnTime:m.time});
   m.nextId=index+1;
  }
 }else m.runnerSpawn=Math.max(m.runnerSpawn,opening?1.9:1.4);
 runnerGuideWarning(m,p.x,m.time);
 m.runnerRecoverClock-=dt;
 if(m.runnerRecoverClock<=0){
  m.runnerRecoverClock=14;
  m.jellies.push({id:g.nextId++,x:22,y:1.1,kind:'heart'});
 }
 for(const o of m.obstacles){
  o.x-=speed*dt;
  if(!o.hit&&runnerObstacleContact(m,p.x,o)){
   o.hit=true;m.combo=0;c.take(g,20,c.emit);m.energy=Math.max(0,m.energy-8);
  }else if(!o.hit&&!o.cleared&&o.x<p.x-(o.width||1.3)){
   o.cleared=true;m.success++;m.combo++;c.deal(g,o.challenge==='spire'?150:95,c.emit);
  }
 }
 m.obstacles=m.obstacles.filter(o=>o.x>-30);
 m.jellySpawn-=dt;
 if(m.jellySpawn<=0){
  m.jellySpawn=scene.key==='quiet'?.45:.26;
  const i=m.pickups+(m.jellies.length||0);
  m.jellies.push({id:g.nextId++,x:25,y:.7+Math.sin(i*.4)*.55+(i%9<3?1.8:0),
   kind:i%17===0?'heart':i%7===0||accent.star&&i%4===0?'gold':'jelly'});
 }
 for(const j of m.jellies){
  j.x-=speed*dt;
  if(Math.hypot(j.x-p.x,j.y-(m.jumpY+(m.slideVisual>.5?.4:1)))<1){
   j.collected=true;m.pickups++;
   m.energy=Math.min(100,m.energy+(j.kind==='heart'?18:.55));
   m.starCharge=Math.min(100,m.starCharge+(j.kind==='gold'?15:j.kind==='heart'?6:1.6));
   c.deal(g,j.kind==='gold'?150:45,c.emit);
   if(m.pickups%30===0)m.bonus=4;
  }
 }
 m.jellies=m.jellies.filter(j=>!j.collected&&j.x>-30);
 if(m.energy===0){c.take(g,8,c.emit);m.energy=20;}
}
function tickReferenceArmy(g,m,dt,c){
 const scene=gyuwonArmyScene(m.time,m.clock?.duration||GYUWON_SONGS[7].duration);
 m.armyTruce=m.time>=108&&m.time<126;
 m.money=Math.min(m.moneyCap,m.money+dt*(22+m.workerLevel*7));
 m.cannon=Math.min(100,m.cannon+dt*4.8);
 m.unitCooldowns=m.unitCooldowns.map(t=>Math.max(0,t-dt));
 m.rallyPulse=Math.max(0,(m.rallyPulse||0)-dt);
 m.armySiegeFlash=Math.max(0,(m.armySiegeFlash||0)-dt);
 // One, two, three, four: these are playable allied recruits, not visual ghosts.
 const verseTimes=[17.9,21.52,25.26,28.82];
 while(m.armyVerseRecruits<verseTimes.length&&m.time>=verseTimes[m.armyVerseRecruits]){
  const index=m.armyVerseRecruits++,type=index,s=REFERENCE_UNIT_TYPES[type];
  if(m.units.length<46)m.units.push({id:g.nextId++,team:1,type,
   x:-17,z:0,hp:s.hp,maxHp:s.hp,attack:s.attack,range:s.range,speed:s.speed,
   cool:.45,wind:0,hit:false,attackAge:0,knock:0,
   role:type===2?'ranged':'melee',lane:index%2,lyricRecruit:true});
 }
 const captainTimes=[40.44,43.94];
 while(m.armyCaptainRecruits<captainTimes.length&&m.time>=captainTimes[m.armyCaptainRecruits]){
  const index=m.armyCaptainRecruits++,type=index?4:0,s=REFERENCE_UNIT_TYPES[type];
  if(m.units.length<46)m.units.push({id:g.nextId++,team:1,type,
   x:-17,z:0,hp:s.hp,maxHp:s.hp,attack:s.attack,range:s.range,speed:s.speed,
   cool:.45,wind:0,hit:false,attackAge:0,knock:0,
   role:type===4?'ranged':'melee',lane:index,lyricRecruit:true});
 }
 if(m.time>=174.5){
  // Close the battle with a parade; capture its survivors for the new dance.
  m.armyParade=true;m.enemySpawn=9999;
  if(!m.armyFinale)m.armyFinale={
   count:Math.max(3,Math.min(6,m.units.filter(u=>u.team===1&&u.hp>0).length||4)),
   kinds:m.units.filter(u=>u.team===1&&u.hp>0).slice(0,6).map(u=>u.type)};
  return;
 }
 // Three different castles are fixed score events, not infinite respawns.
 if(m.enemyFort<2&&m.time>=56.5){
  m.enemyFort=2;m.enemyBaseHp=m.enemyBaseMaxHp=4050;m.enemySpawn=.7;m.armyConvoys=0;m.armyConvoyClock=4;
 }
 if(m.enemyFort<3&&m.time>=126){
  m.enemyFort=3;m.enemyBaseHp=m.enemyBaseMaxHp=5100;m.enemySpawn=.7;m.armyConvoys=0;
 }
 if(m.time>=126&&!m.armyReunionDone){
  m.armyReunionDone=true;
  const count=m.armyRallied?3:1;
  for(let i=0;i<count&&m.units.length<46;i++){
   const type=i%2?3:0,s=REFERENCE_UNIT_TYPES[type];
   m.units.push({id:g.nextId++,team:1,type,x:-17,z:0,hp:s.hp,maxHp:s.hp,
    attack:s.attack,range:s.range,speed:s.speed,cool:.4,wind:0,hit:false,
    attackAge:0,knock:0,role:'melee',lane:i%2,returning:true});
  }
  m.rallyPulse=2.4;
 }
 if(m.armyTruce){
  // The quiet bridge is still playable: troops lower weapons, retreat and
  // visibly recover instead of freezing the entire simulation.
  m.enemySpawn=Math.max(m.enemySpawn,.8);
  for(const u of m.units){
   if(u.hp<=0)continue;
   u.wind=0;u.hit=false;u.cool=Math.max(0,u.cool-dt);
   const home=u.team>0?-13:13;
   u.x+=Math.sign(home-u.x)*Math.min(Math.abs(home-u.x),dt*(u.speed||1)*1.6);
   if(u.team>0)u.hp=Math.min(u.maxHp,u.hp+dt*(m.armyRallied?9:3));
  }
  m.units=m.units.filter(u=>u.hp>0);
  return;
 }
 // A small *finite* supply convoy fills early victories without rebuilding
 // destroyed enemy castles or endlessly duplicating the main objective.
 if(m.enemyBaseHp<=0&&m.enemyFort<3&&scene.key!=='lonely'){
  m.armyConvoyClock-=dt;
  if(m.armyConvoyClock<=0&&m.armyConvoys<3&&m.units.length<46){
   const type=m.armyConvoys%2?5:1,s=REFERENCE_UNIT_TYPES[type];
   m.units.push({id:g.nextId++,team:-1,type,x:17,z:0,hp:s.hp*1.1,
    maxHp:s.hp*1.1,attack:s.attack*.4,range:s.range,speed:s.speed*.65,
    cool:0,wind:0,hit:false,attackAge:0,knock:0,role:'melee',
    lane:m.armyConvoys%2,kind:'supply'});
   m.armyConvoys++;m.armyConvoyClock=6;
  }
 }
 m.enemySpawn-=dt;
 if(m.enemySpawn<=0&&m.units.length<46&&m.enemyBaseHp>0&&m.time<173){
  const type=(m.armyWave++%6),s=REFERENCE_UNIT_TYPES[type];
  const lane=m.armyWave%2;
  m.enemySpawn=scene.key==='siege'?1.55:scene.key==='reunion'?1.7:2+(type%3)*.22;
  m.units.push({id:g.nextId++,team:-1,type,x:17,z:0,hp:s.hp*.72,
   maxHp:s.hp*.72,attack:s.attack*.65,range:s.range,speed:s.speed*.85,
   cool:0,wind:0,hit:false,attackAge:0,knock:0,
   role:type===2||type===4?'ranged':'melee',lane});
 }
 for(const u of m.units){
  if(u.hp<=0)continue;
  const lane=u.lane??0;
  u.cool=Math.max(0,u.cool-dt);
  u.x+=u.knock*dt;u.knock*=Math.exp(-dt*8);
  let target=null,best=Infinity;
  for(const v of m.units){
   if(v.hp<=0||v.team===u.team||(v.lane??0)!==lane)continue;
   const d=Math.abs(u.x-v.x);
   if(d<best){target=v;best=d;}
  }
  const baseX=u.team>0?18:-18;
  const baseAlive=u.team>0?m.enemyBaseHp>0:m.baseHp>0;
  const baseRange=baseAlive&&Math.abs(baseX-u.x)<=u.range;
  if(u.wind>0){
   u.attackAge+=dt;u.wind=Math.max(0,u.wind-dt);
   if(u.wind<=0&&!u.hit){
    u.hit=true;
    // Resolve at physical contact following the visible 0.55s windup.
    if(target&&target.hp>0&&Math.abs(u.x-target.x)<u.range+.4){
     target.hp-=u.attack;target.knock=u.team*2.6;
     if(u.team>0){c.deal(g,u.attack*.4,c.emit);
      if(u.type===3){for(const a of m.units)if(a.team>0&&(a.lane??0)===lane&&Math.abs(a.x-u.x)<5)a.hp=Math.min(a.maxHp,a.hp+5);}}
    }else if(baseRange){
     if(u.team>0){
      const siege=u.type===5?1.6:1;
      m.enemyBaseHp=Math.max(0,m.enemyBaseHp-u.attack*siege);
      m.armySiegeFlash=.36;c.deal(g,u.attack*siege,c.emit);
     }else{m.baseHp=Math.max(0,m.baseHp-u.attack);c.take(g,12,c.emit);}
    }
    u.cool=u.role==='ranged'?1.3:.9;
   }
  }else if((target&&best<u.range)||baseRange){
   if(u.cool===0){u.wind=.55;u.attackAge=0;u.hit=false;}
  }else u.x+=u.team*u.speed*dt;
 }
 m.units=m.units.filter(u=>u.hp>0&&Math.abs(u.x)<22);
 if(m.cannonShot){
  const a=m.cannonShot;a.age+=dt;
  a.x=-18+Math.max(0,a.age-.65)*55;
  if(a.age>=.65)for(const u of m.units)if(u.team<0&&u.x<=a.x&&!a.hitIds.includes(u.id)){
   a.hitIds.push(u.id);u.hp-=130;u.knock=7;c.deal(g,80,c.emit);
  }
  if(a.age>1.7)m.cannonShot=null;
 }
 if(m.enemyBaseHp<=0)m.baseReform+=dt;else m.baseReform=0;
 if(m.baseHp<=0){m.baseHp=350;c.take(g,70,c.emit);}
}
function tickReferenceDance(g,m,dt,c){
 m.danceScene=gyuwonDanceScene(m.time);
 const skipped=m.time-(m.dancePreviousTime??m.time)>.35;
 m.dancePreviousTime=m.time;
 m.dancePose=Math.max(0,m.dancePose-dt);m.danceFlash=Math.max(0,m.danceFlash-dt);
 m.danceError=Math.max(0,m.danceError-dt);
 m.danceEnergy=Math.max(0,(m.danceEnergy||0)-dt*.9);
 for(const p of m.dancePatterns){
  for(let i=0;i<p.count;i++){
   const at=p.first+i*p.spacing*m.dancePeriod;
   // Never inflict surprise hits from notes the audio clock jumped over.
   if(!p.done[i]&&!p.misses[i]&&m.time>at+GYUWON_DANCE_WINDOWS.expired){
    p.misses[i]=true;
    if(skipped)continue;
    m.combo=0;m.danceRivalScore++;m.danceError=.6;
    c.take(g,14,c.emit);
   }
  }
 }
 const next=gyuwonDanceNextCue(m.dancePatterns,m.time,m.dancePeriod);
 m.danceCurrent=next?.pattern||null;
 if(next?.active){
  const key=next.pattern.id+':'+next.index;
  // Audio instruction is never necessary: the leader also demonstrates
  // the winding arm/feet; the timing is identical in Canvas and input.
  if(m.danceCueId!==key&&next.remaining>.25){
   m.danceCueId=key;m.danceCue=next.kind;
   c.emit('gyuwon-dance-cue',{kind:next.kind});
  }
 }
}
function tickReferenceFighter(g,m,dt,input,c){
 const [p,b]=m.fighters,t=m.time,scene=gyuwonFightScene(t);
 m.fightWorld=scene;
 const nextRound=m.fightRound===1&&t>=41?2:m.fightRound===2&&t>=108?3:m.fightRound;
 if(nextRound!==m.fightRound){
  m.fightRound=nextRound;m.fightReset=0;m.roundWait=false;m.encoreOrbs=[];m.encoreCollected=0;
  for(let i=0;i<2;i++){const f=m.fighters[i];f.hp=f.maxHp;f.x=i?7:-7;f.y=0;f.vy=0;f.action=null;f.stun=0;f.combo=0;}
  m.enemyThink=1.35;m.fightLyricMotion=null;
 }
 if(scene.kind!==m.fightPriorScene){
  // Continue the duel at lower intensity through quieter passages.
  m.fightPriorScene=scene.kind;
 }
 m.fightParryWindow=Math.max(0,m.fightParryWindow-dt);
 m.fightParryFlash=Math.max(0,m.fightParryFlash-dt);
 // A sung phrase changes actual boss positioning / motion once. It is not
 // an artificial playback timer; seeking past an event cannot replay attacks.
 const verse=m.lyricAction;
 if(verse&&verse.id!==m.fightLastLyricActionId){
  m.fightLastLyricActionId=verse.id;
  if(t-verse.start<.25){
   if(verse.actionId==='leftSwingRight'){
    m.fightLyricMotion={from:b.x,to:clamp(b.x-1.2,-16,16),start:t,duration:.65};
    if(!b.action&&b.stun<=0&&fighterAttack(b,'kick'))b.action.wind=.75;
   }else if(['runAndFly','smileAndFly'].includes(verse.actionId)){
    b.vy=Math.max(b.vy,9.5);
    m.fightLyricMotion={from:b.x,to:clamp(b.x+Math.sign(p.x-b.x)*1.4,-16,16),start:t,duration:.92};
   }else if(['roundEcho1','roundEcho2','roundEcho3','roundEcho4','roundEcho5'].includes(verse.actionId)){
    // Echo attack hitboxes are scheduled separately in the same authored
    // scene score; lyric entrance here only arranges the physical cast.
    b.facing=b.x<p.x?1:-1;
   }else if(verse.actionId==='danceOrFight'){
    m.fightLyricMotion={from:b.x,to:clamp(b.x-.75,-16,16),start:t,duration:.55};
   }
  }
 }
  if(m.fightLyricMotion){
  const move=m.fightLyricMotion,q=clamp((t-move.start)/move.duration,0,1),
   s=q*q*(3-2*q);
  b.x=move.from+(move.to-move.from)*s;
  if(q>=1)m.fightLyricMotion=null;
 }
  p.crouch=(input.z||0)<-.4;p.guard=!!input.guard||!!m.guardHeld;
 if((input.z||0)>.48&&!m.fightJumpLatch&&p.y<=0&&p.stun<=0&&!m.fightReset){p.vy=10;m.fightJumpLatch=true;}
 if((input.z||0)<.2)m.fightJumpLatch=false;
 if(!p.action&&p.stun<=0)p.x=clamp(p.x+(input.x||0)*(p.crouch?3:7)*dt,-16,16);
 p.facing=p.x<b.x?1:-1;b.facing=-p.facing;
 p.floorY=gyuwonFightGround(t,p.x);b.floorY=gyuwonFightGround(t,b.x);
 for(const f of m.fighters){
  f.stun=Math.max(0,f.stun-dt);f.comboTimer=Math.max(0,(f.comboTimer||0)-dt);
  if(f.comboTimer===0)f.combo=0;
  f.y=Math.max(0,f.y+f.vy*dt);f.vy=f.y>0?f.vy-24*dt:0;
 }
 if(m.fightReset){
  m.roundWait=true;
  if(m.encoreNext<=t&&m.encoreCollected<6&&m.encoreOrbs.every(o=>o.collected)){
   const x=[-11,0,10,-5,5,0][m.encoreCollected];
   m.encoreOrbs=[{x,collected:false,created:t}];m.encoreNext=t+2.8;
  }
  g.player.x=p.x;g.player.floorY=(p.floorY||0)+p.y;g.boss.x=b.x;
  return;
 }
 // Start each music-specific attack once and only when its authored verse plays.
 for(let i=0;i<GYUWON_FIGHT_SET_PIECES.length;i++){
  const cue=GYUWON_FIGHT_SET_PIECES[i];
  if(t<cue.at||m.fightCueKeys.has(i))continue;
  m.fightCueKeys.add(i);
  if(t-cue.at<1.35)m.fightHazards.push({...cue,x:clamp(p.x,-13,13),hit:false});
 }
 for(const h of m.fightHazards){
  const age=t-h.at;
  if(age<h.wind||age>h.wind+.28||h.hit)continue;
  h.hit=true;
  if(h.damage<=0)continue; // Short echo phrases show preparation without instant damage.
  if(Math.abs(p.x-h.x)<=h.radius&&p.y+(p.floorY||0)<1.6){
   if(p.guard){m.fightParryFlash=.28;p.meter=Math.min(100,p.meter+12);}
   else c.take(g,h.damage,c.emit);
  }
 }
 m.fightHazards=m.fightHazards.filter(h=>t-h.at<h.wind+.65);
 if(t>5.9){
  b.meter=Math.min(100,b.meter+dt*(m.fightRound===3?11:3));
  m.enemyThink-=dt;
  const d=Math.abs(b.x-p.x);
  if(!b.action&&b.stun<=0){
   if(d>3.1&&!m.fightLyricMotion)b.x=clamp(b.x+Math.sign(p.x-b.x)*(m.fightRound>=2?4.2:3.6)*dt,-16,16);
   else if(m.enemyThink<=0){
    const n=m.turnCount++,kind=b.meter>=100&&m.fightRound===3?'super':
     m.fightRound===1?['light','kick','light','skill'][n%4]:
     m.fightRound===2?['kick','skill','light','kick'][n%4]:
     ['skill','kick','light','super'][n%4];
    fighterAttack(b,kind==='super'&&b.meter<100?'skill':kind);
    m.enemyThink=scene.quiet?2.35:m.fightRound===3?1.35:1.55;
   }
  }
  b.guard=!!p.action&&p.action.t<p.action.wind+p.action.live&&m.turnCount%4===0;
 }else b.guard=false;
 b.floorY=gyuwonFightGround(t,b.x);
 if(Math.abs(b.x-p.x)<1.9){const mid=(b.x+p.x)/2;p.x=clamp(mid-p.facing*.95,-16,16);b.x=clamp(mid+p.facing*.95,-16,16);}
 p.floorY=gyuwonFightGround(t,p.x);b.floorY=gyuwonFightGround(t,b.x);
 for(let i=0;i<2;i++){
  const f=m.fighters[i],enemy=m.fighters[1-i],a=f.action;if(!a)continue;
  a.t+=dt;
  if(!a.hit&&a.t>=a.wind&&a.t<a.wind+a.live){
   a.hit=true;
   const reach=Math.abs(enemy.x-f.x),
    height=Math.abs(((enemy.floorY||0)+enemy.y)-((f.floorY||0)+f.y)),
    inFront=(enemy.x-f.x)*f.facing>-.3;
   if(reach<a.range&&height<a.reachY&&inFront&&!(enemy.crouch&&a.kind==='light'&&enemy.y<.1)){
    const parry=enemy.guard&&enemy.y<.1&&i===1&&m.fightParryWindow>0;
    const blocked=enemy.guard&&enemy.y<.1&&(a.kind!=='kick'||enemy.crouch);
    const damage=a.damage*(parry?0:blocked?.13:1);
    enemy.hp=Math.max(0,enemy.hp-damage);
    enemy.stun=parry?.7:blocked?.1:.22;
    enemy.x=clamp(enemy.x+f.facing*(blocked?.18:.6),-16,16);
    f.meter=Math.min(100,f.meter+12);f.combo++;f.comboTimer=1.35;
    enemy.combo=0;enemy.comboTimer=0;
    m.hitSparks.push({x:(f.x+enemy.x)/2,y:1+(enemy.floorY||0)+enemy.y,age:0,blocked:blocked||parry});
    if(parry){m.fightParryWindow=0;m.fightParryFlash=.35;p.meter=Math.min(100,p.meter+24);c.deal(g,30,c.emit);}
    if(i===0)c.deal(g,Math.round(damage*13),c.emit);
    else if(!parry)c.take(g,blocked?3:damage,c.emit);
   }else if(i===0)f.combo=0;
  }
  if(a.t>=a.wind+a.live+a.recovery)f.action=null;
 }
 m.hitSparks=m.hitSparks.filter(s=>(s.age+=dt)<.4);
 if((p.hp<=0||b.hp<=0)&&!m.fightReset){
  m.roundWins[p.hp<=0?1:0]++;m.fightReset=1;m.roundWait=true;
  m.encoreNext=t+1.5;m.encoreOrbs=[];m.encoreCollected=0;p.action=null;b.action=null;
 }
 g.player.x=p.x;g.player.z=0;g.player.floorY=(p.floorY||0)+p.y;
 g.boss.x=b.x;g.boss.z=0;
}
function tickReferenceShooter(g,m,dt,input,c){
 const p=g.player;if(m.pointerTarget){const dx=m.pointerTarget.x-p.x,dz=m.pointerTarget.z-p.z,d=Math.hypot(dx,dz),q=Math.min(1,dt*26/Math.max(.001,d));p.x+=dx*q;p.z+=dz*q;}p.x=clamp(p.x+(input.x||0)*10*dt,-11,11);p.z=clamp(p.z-(input.z||0)*10*dt,-8,16);m.scroll+=dt*5;m.bombEffect=Math.max(0,m.bombEffect-dt);m.chainTime=Math.max(0,m.chainTime-dt);if(m.chainTime===0)m.chain=0;
 m.shotCooldown-=dt;if(m.shotCooldown<=0){m.shotCooldown=.115;for(let i=0;i<m.power;i++){const d=(i-(m.power-1)/2)*(m.weaponMode==='laser'?.18:.52);m.bullets.push({x:p.x+d,z:p.z-1,life:2.5,vx:d*1.2,vz:-30,damage:9,kind:m.weaponMode==='laser'?'laser':'shot'});}}
 const progress=m.actProgress||0,scene=gyuwonMasterScene(10,m.time).kind,quiet=scene==='starlight';
 if(m.time>=132&&!m.finalCarrierSpawned){m.finalCarrierSpawned=true;m.shooterTargets.push({id:g.nextId++,x:0,z:-15,hp:1100,maxHp:1100,phase:7,wind:3.2,aim:0,kind:'carrier'});}
 if(!quiet)m.shooterSpawn-=dt;if(m.shooterSpawn<=0&&!quiet&&m.shooterTargets.length<7&&m.time<147){m.shooterSpawn=4;const side=m.turnCount++%2?-1:1;m.shooterTargets.push({id:g.nextId++,x:side*9,z:-19,hp:45,maxHp:45,phase:m.turnCount,wind:1.4,aim:0,kind:'fighter'});}
 for(const e of m.shooterTargets){
  if(e.hp<=0)continue;e.z+=e.kind==='fighter'?dt*3:Math.sin(m.time*.7+e.phase)*dt*.45;e.x+=Math.sin(m.time*.8+e.phase)*dt*.6;
  // Lock direction during a visible aiming pose, instead of retargeting
  // instantly on the firing frame. VFX and bullets use e.lockedAim together.
  if(e.wind>1.13&&e.wind-dt<=1.13)e.lockedAim=Math.atan2(p.x-e.x,p.z-e.z);
  e.wind-=dt;
  if(e.wind<=0){
   const angle=e.lockedAim??Math.atan2(p.x-e.x,p.z-e.z);
   for(let i=-2;i<=2&&m.enemyShots.length<100;i++){
    const a=angle+i*(e.kind==='carrier'?.19:.12);
    m.enemyShots.push({x:e.x,z:e.z+1,vx:Math.sin(a)*6.5,vz:Math.cos(a)*6.5,life:7,age:0,kind:e.phase%2?'amber':'red'});
   }
   e.lockedAim=null;e.wind=e.kind==='carrier'?2.15:2.7;
  }
 }
 for(const a of m.bullets){a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;for(const e of m.shooterTargets)if(e.hp>0&&dist(a,e)<(e.kind==='carrier'?1.45:.85)){e.hp-=a.damage;a.life=0;c.deal(g,a.damage,c.emit);if(e.hp<=0){m.chain++;m.chainTime=2.5;c.deal(g,500+m.chain*50,c.emit);m.powerItems.push({x:e.x,z:e.z,kind:m.chain%3===0?'power':'medal'});}break;}}
 for(const a of m.enemyShots){a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;a.age+=dt;if(dist(a,p)<.68){a.life=0;c.take(g,18,c.emit);m.chain=0;}}
 m.bullets=m.bullets.filter(a=>a.life>0&&a.z>-23);m.enemyShots=m.enemyShots.filter(a=>a.life>0&&Math.abs(a.x)<15&&a.z<23);
 m.shooterTargets=m.shooterTargets.filter(e=>e.hp>0&&e.z<21);
 m.victoryFlight=m.finalCarrierSpawned&&!m.shooterTargets.some(e=>e.kind==='carrier');
 if(m.victoryFlight&&m.powerItems.length<12&&m.time%3<dt)m.powerItems.push({x:Math.sin(m.time)*8,z:-17,kind:'medal'});
 for(const item of m.powerItems){item.z+=dt*3;if(dist(item,p)<1.4){item.done=true;if(item.kind==='power')m.power=Math.min(3,m.power+1);c.deal(g,200,c.emit);}}
 m.powerItems=m.powerItems.filter(a=>!a.done&&a.z<21);g.boss.x=0;g.boss.z=-12;
}
export function tickReferenceMinigame(g,m,dt,input,c){
 if(m.year===5)tickGiantRaid(g,m,dt,c);
 else if(m.year===6)tickReferenceRunner(g,m,dt,c);
 else if(m.year===7)tickReferenceArmy(g,m,dt,c);
 else if(m.year===8)tickReferenceDance(g,m,dt,c);
 else if(m.year===9)tickReferenceFighter(g,m,dt,input,c);
 else if(m.year===10)tickReferenceShooter(g,m,dt,input,c);
}
export function referenceKeyAction(m,code){
 if(!m?.reference)return null;
 if(m.year===5)return {KeyA:'target-prev',ArrowLeft:'target-prev',KeyD:'target-next',ArrowRight:'target-next',KeyQ:'light',KeyE:'skill',Space:'support',Digit1:'ultimate0',Digit2:'ultimate1',Digit3:'ultimate2',Digit4:'ultimate3'}[code]||null;
 if(m.year===6)return {ArrowUp:'jump',KeyW:'jump',ArrowDown:'slide',KeyS:'slide',Space:'jump',KeyJ:'jump',KeyL:'slide'}[code]||null;
 if(m.year===7)return {KeyT:'lane',Digit1:'summon0',Digit2:'summon1',Digit3:'summon2',Digit4:'summon3',Digit5:'summon4',Digit6:'summon5',KeyU:'upgrade',KeyK:'cannon'}[code]||null;
 if(m.year===8)return {KeyJ:'light',KeyL:'skill'}[code]||null;
 if(m.year===9)return {KeyJ:'light',KeyK:'guard',Space:'jump'}[code]||null;
 if(m.year===10)return {Space:'bomb',KeyB:'bomb'}[code]||null;
 return null;
}
