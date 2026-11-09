import {setupGiantRaid,actGiantRaid,tickGiantRaid} from './gyuwon-giant-raid.mjs';
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';
import {gyuwonMasterScene,gyuwonAlignDanceBeat} from './gyuwon-master-director.mjs';
import {gyuwonRunnerScene,gyuwonRunnerAccent,gyuwonRunnerGap,gyuwonRunnerObstacleVariant,gyuwonRunnerDashReady,gyuwonRunnerLyricStage} from './gyuwon-runner-director.mjs';
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
  g.player.x=-10;g.player.z=0;runnerInitMotion(m);m.energy=100;m.jellies=[];m.runnerSpawn=1.8;m.jellySpawn=.15;m.platforms=[{x:-35,end:28,y:0}];m.runnerRecoverClock=14;m.runnerBiome='meadow';m.runnerDistance=0;m.pickups=0;m.bonus=0;m.fallRecovery=0;m.starCharge=0;m.dashTime=0;m.dashCooldown=0;m.runnerScene=gyuwonRunnerScene(0);m.runnerBiome='theater';m.runnerSpeed=9;m.runnerGuided=true;m.guideRescues=0;m.guideBridgesLeft=0;m.guideAction='';m.guideActionUntil=0;m.guideScene='overture';m.runnerLyric=null;
 }else if(m.year===7){
  m.money=180;m.moneyCap=500;m.workerLevel=1;m.unitCooldowns=[0,0,0,0,0,0];m.baseHp=1000;m.baseMaxHp=1000;m.enemyBaseHp=3000;m.enemyBaseMaxHp=3000;m.cannon=65;m.cannonShot=null;m.armyWave=1;m.enemySpawn=2;m.units=[];m.baseReform=0;m.enemyFort=1;m.armyTruce=false;
 }else if(m.year===8){
  const chart=GYUWON_BEATS[8],period=60/chart.bpm;
  m.dancePeriod=period;m.dancePatterns=[];let start=3.2,index=0;
  while(start+period*8<GYUWON_SONGS[8].duration-4){
   if(start>GYUWON_SONGS[8].duration*.57&&start<GYUWON_SONGS[8].duration*.68){start=GYUWON_SONGS[8].duration*.69;continue;}
   const kind=['pose','turn','pose','quick'][index%4],count=kind==='quick'?1:index%3===1?4:3;
   const prepared=start+period*(kind==='turn'?3:3.5);
   const first=gyuwonAlignDanceBeat(start+period*(kind==='pose'?6:kind==='turn'?5:5.5));
   const cue=Math.max(start,prepared+(first-(start+period*(kind==='pose'?6:kind==='turn'?5:5.5))));
   m.dancePatterns.push({id:index,kind,cue,first,count,spacing:kind==='pose'?2:1,done:[],misses:[],facing:index%2?-1:1});
   start=first+period*((count-1)*(kind==='pose'?2:1)+2.7);
    if(index%5===4)start+=period*7;
    index++;
  }
  m.dancePose=0;m.danceFacing=1;m.danceFlash=0;m.danceLastCue=-1;m.danceCue='';m.danceError=0;m.note=null;
 }else if(m.year===9){
  g.player.x=-7;g.boss.x=7;g.player.z=g.boss.z=0;
  m.fighters=[{x:-7,y:0,vy:0,hp:100,maxHp:100,meter:20,facing:1,action:null,stun:0,guard:false,crouch:false,combo:0},{x:7,y:0,vy:0,hp:100,maxHp:100,meter:0,facing:-1,action:null,stun:0,guard:false,crouch:false,combo:0}];
  m.fightRound=1;m.fightReset=0;m.enemyThink=1.35;m.hitSparks=[];m.roundWins=[0,0];m.fightHitstop=0;m.roundWait=false;
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
  if(['light','roll','jump'].includes(type))return runnerPressJump(m);
  if(type==='skill'||type==='slide')return runnerPressSlide(m);
  if(type==='slide-end')return runnerReleaseSlide(m);
  if(type==='dash'&&gyuwonRunnerDashReady(m)){m.starCharge-=55;m.dashCooldown=2.7;m.dashTime=.62;m.bonus=Math.max(m.bonus,.62);return true;}
  return false;
 }
 if(m.year===7){
  if(type==='upgrade'){const cost=m.workerLevel*95;if(m.money<cost||m.workerLevel>=6)return false;m.money-=cost;m.workerLevel++;m.moneyCap=400+m.workerLevel*150;return true;}
  if(type==='cannon'){if(m.cannon<100||m.cannonShot)return false;m.cannon=0;m.cannonShot={age:0,hit:false,x:-18,hitIds:[]};return true;}
  const n=type.startsWith('summon')?Number(type.slice(6)):{light:0,skill:2,roll:1}[type],spec=REFERENCE_UNIT_TYPES[n];
  if(!spec||m.money<spec.cost||m.unitCooldowns[n]>0||m.units.length>=48)return false;
  m.money-=spec.cost;m.unitCooldowns[n]=spec.cool;m.units.push({id:g.nextId++,team:1,type:n,x:-17,z:0,hp:spec.hp,maxHp:spec.hp,attack:spec.attack,range:spec.range,speed:spec.speed,cool:0,wind:0,hit:false,attackAge:0,knock:0,role:n===2||n===4?'ranged':'melee'});return true;
 }
 if(m.year===8){
  const wanted={light:'pose',skill:'turn',roll:'quick'}[type];if(!wanted)return false;
  let best=null,error=Infinity,slot=-1;
  for(const pattern of m.dancePatterns)for(let i=0;i<pattern.count;i++){
   if(pattern.done[i]||pattern.misses[i])continue;
   const delta=Math.abs(m.time-(pattern.first+i*pattern.spacing*m.dancePeriod));
   if(delta<error){best=pattern;error=delta;slot=i;}
  }
  if(!best||best.kind!==wanted||error>.19){m.combo=0;m.danceError=.55;return false;}
  best.done[slot]=true;m.dancePose=.35;m.danceFacing=best.kind==='pose'?best.facing:-m.danceFacing;m.danceFlash=.35;m.success++;
  m.judgement=error<.075?'PERFECT':'GOOD';m.judgementUntil=m.time+.5;c.deal(g,error<.075?150:100,c.emit);return true;
 }
 if(m.year===9){
  const f=m.fighters[0];if(m.fightReset>0)return false;
  if(type==='jump'||type==='roll'){if(f.y>0||f.stun>0)return false;f.vy=10;return true;}
  if(type==='guard'){m.guardHeld=true;return true;}
  if(type==='guard-end'){m.guardHeld=false;return true;}
  return fighterAttack(f,{light:'light',kick:'kick',skill:'skill',super:'super'}[type]||'light');
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
 m.dashTime=Math.max(0,m.dashTime-dt);
 m.dashCooldown=Math.max(0,m.dashCooldown-dt);
 const dash=m.dashTime>0,speed=scene.speed+(dash?5:0)+(m.bonus>0&&!dash?2:0);
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
 }
 p.floorY=m.jumpY;
 // Every obstacle is born offscreen right, with a real approach interval.
 if(!relief&&!opening){
  m.runnerSpawn-=dt;
  if(m.runnerSpawn<=0){
   const period=scene.key==='final-sprint'?.86:
    scene.key==='skyroad'?1.1:scene.key==='bridge'?1.28:scene.key==='rain'?1.34:
    scene.key==='sunrise'?1.44:1.8;
   m.runnerSpawn=period+(m.nextId%4===3?.25:0);
   const index=m.nextId||0;
   const kind=index%2?'low':'high';
   m.obstacles.push({id:g.nextId++,x:24,kind,
    variant:gyuwonRunnerObstacleVariant(scene,index),width:1.3,hit:false,
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
   o.hit=true;
   if(dash){
    m.success++;m.starCharge=Math.min(100,m.starCharge+2);
    c.deal(g,75,c.emit);
   }else{
    m.combo=0;c.take(g,20,c.emit);
    m.energy=Math.max(0,m.energy-8);
   }
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
 m.money=Math.min(m.moneyCap,m.money+dt*(22+m.workerLevel*7));m.cannon=Math.min(100,m.cannon+dt*4.8);m.unitCooldowns=m.unitCooldowns.map(t=>Math.max(0,t-dt));
 const p=m.actProgress||0;
 m.armyTruce=m.time>=108&&gyuwonMasterScene(7,m.time).kind!=='reunion'&&gyuwonMasterScene(7,m.time).kind!=='exit';
 if(m.armyTruce){m.enemySpawn=Math.max(m.enemySpawn,.8);return;}
 if((m.enemyFort<2&&m.time>=56.5)||(m.enemyFort<3&&m.time>=126)){m.enemyFort++;m.enemyBaseHp=m.enemyBaseMaxHp=Math.round(3000*(1+.35*(m.enemyFort-1)));m.enemySpawn=.6;}
 m.enemySpawn-=dt;if(m.enemySpawn<=0&&m.units.length<48&&m.enemyBaseHp>0){const type=(m.armyWave++%6),s=REFERENCE_UNIT_TYPES[type];m.enemySpawn=1.9+(type%3)*.28;m.units.push({id:g.nextId++,team:-1,type,x:17,z:0,hp:s.hp*.72,maxHp:s.hp*.72,attack:s.attack*.65,range:s.range,speed:s.speed*.85,cool:0,wind:0,hit:false,attackAge:0,knock:0,role:type===2||type===4?'ranged':'melee'});}
 for(const u of m.units){if(u.hp<=0)continue;u.cool=Math.max(0,u.cool-dt);u.x+=u.knock*dt;u.knock*=Math.exp(-dt*8);
  let target=null,best=Infinity;for(const v of m.units){const d=Math.abs(u.x-v.x);if(v.hp>0&&v.team!==u.team&&d<best){target=v;best=d;}}
  const baseX=u.team>0?18:-18,baseRange=Math.abs(baseX-u.x)<=u.range&&(u.team>0?m.enemyBaseHp>0:m.baseHp>0);
  if(u.wind>0){u.attackAge+=dt;u.wind=Math.max(0,u.wind-dt);
   if(u.wind<=0&&!u.hit){u.hit=true;if(target&&best<u.range+.4){target.hp-=u.attack;target.knock=u.team*2.6;if(u.team>0)c.deal(g,u.attack*.4,c.emit);}else if(baseRange){if(u.team>0){m.enemyBaseHp=Math.max(0,m.enemyBaseHp-u.attack);c.deal(g,u.attack,c.emit);}else{m.baseHp=Math.max(0,m.baseHp-u.attack);c.take(g,12,c.emit);}}u.cool=u.role==='ranged'?1.3:.9;}
  }else if((target&&best<u.range)||baseRange){if(u.cool===0){u.wind=.55;u.attackAge=0;u.hit=false;}}
  else u.x+=u.team*u.speed*dt;
 }
 m.units=m.units.filter(u=>u.hp>0&&Math.abs(u.x)<22);
 if(m.cannonShot){const a=m.cannonShot;a.age+=dt;a.x=-18+Math.max(0,a.age-.65)*55;
  if(a.age>=.65)for(const u of m.units)if(u.team<0&&u.x<=a.x&&!a.hitIds.includes(u.id)){a.hitIds.push(u.id);u.hp-=130;u.knock=7;c.deal(g,80,c.emit);}if(a.age>1.7)m.cannonShot=null;
 }
 if(m.enemyBaseHp<=0){m.enemyBaseHp=0;m.baseReform+=dt;}else m.baseReform=0;
 if(m.baseHp<=0){m.baseHp=350;c.take(g,70,c.emit);}
}
function tickReferenceDance(g,m,dt,c){
 m.dancePose=Math.max(0,m.dancePose-dt);m.danceFlash=Math.max(0,m.danceFlash-dt);m.danceError=Math.max(0,m.danceError-dt);
 for(const p of m.dancePatterns){
  if(m.time>=p.cue&&m.time<p.first&&m.danceLastCue!==p.id){m.danceLastCue=p.id;m.danceCue=p.kind==='pose'?'쿠—킨!':p.kind==='turn'?'댄! 댄!':'하잇!';c.emit('gyuwon-dance-cue',{kind:p.kind});}
  for(let i=0;i<p.count;i++){const at=p.first+i*p.spacing*m.dancePeriod;if(!p.done[i]&&!p.misses[i]&&m.time>at+.2){p.misses[i]=true;m.combo=0;m.danceError=.6;c.take(g,14,c.emit);}}
 }
 m.danceCurrent=m.dancePatterns.find(p=>m.time>=p.cue-m.dancePeriod&&m.time<=p.first+(p.count-1)*p.spacing*m.dancePeriod+1)||null;
}
function tickReferenceFighter(g,m,dt,input,c){
 const [p,b]=m.fighters;
 const progress=m.actProgress||0,cut=m.fightRound===1?41/180:m.fightRound===2?108/180:1;
 if(m.fightReset>0){
  if(progress>=cut&&m.fightRound<3){for(let i=0;i<2;i++){const f=m.fighters[i];f.hp=100;f.x=i?7:-7;f.y=0;f.vy=0;f.action=null;f.stun=0;}m.fightRound++;m.fightReset=0;m.enemyThink=1.35;}
  else{m.fightReset=1;return;}
 }
 if((m.fightRound===1&&m.time>=41)||(m.fightRound===2&&m.time>=108)){
  for(let i=0;i<2;i++){const f=m.fighters[i];f.hp=100;f.x=i?7:-7;f.y=0;f.vy=0;f.action=null;f.stun=0;}m.fightRound++;m.enemyThink=1.1;
 }
 p.crouch=(input.z||0)<-.35;p.guard=!!input.guard||!!m.guardHeld||((input.x||0)*p.facing<-.3);p.facing=p.x<b.x?1:-1;b.facing=-p.facing;
 if(!p.action&&p.stun===0)p.x=clamp(p.x+(input.x||0)*(p.crouch?2.1:7)*dt,-16,16);
 m.enemyThink-=dt;if(!b.action&&b.stun===0){const d=Math.abs(b.x-p.x);if(d>3.4)b.x+=Math.sign(p.x-b.x)*3.8*dt;else if(m.enemyThink<=0){fighterAttack(b,['light','kick','skill'][m.turnCount++%3]);m.enemyThink=1.4;}b.guard=!!p.action&&p.action.t<p.action.wind+p.action.live&&m.turnCount%3===0;}
 for(let i=0;i<2;i++){const f=m.fighters[i],enemy=m.fighters[1-i];f.comboTimer=Math.max(0,(f.comboTimer||0)-dt);if(f.comboTimer===0)f.combo=0;f.stun=Math.max(0,f.stun-dt);f.y=Math.max(0,f.y+f.vy*dt);f.vy=f.y>0?f.vy-24*dt:0;
  const a=f.action;if(!a)continue;a.t+=dt;
  if(!a.hit&&a.t>=a.wind&&a.t<a.wind+a.live){a.hit=true;const reach=Math.abs(enemy.x-f.x),height=Math.abs(enemy.y-f.y),inFront=(enemy.x-f.x)*f.facing>-.3;
   if(reach<a.range&&height<a.reachY&&inFront&&!(enemy.crouch&&a.kind==='light'&&enemy.y<.1)){const blocked=enemy.guard&&enemy.y<.1&&(a.kind!=='kick'||enemy.crouch),damage=a.damage*(blocked?.13:1);enemy.hp=Math.max(0,enemy.hp-damage);enemy.stun=blocked?.1:.22;enemy.x=clamp(enemy.x+f.facing*(blocked?.18:.6),-16,16);f.meter=Math.min(100,f.meter+12);f.combo++;f.comboTimer=1.05;enemy.combo=0;enemy.comboTimer=0;m.hitSparks.push({x:(f.x+enemy.x)/2,y:1+enemy.y,age:0,blocked});if(i===0)c.deal(g,Math.round(damage*13),c.emit);else c.take(g,blocked?3:damage,c.emit);}
  }
  if(a.t>=a.wind+a.live+a.recovery)f.action=null;
 }
 if(Math.abs(b.x-p.x)<1.9){const mid=(b.x+p.x)/2;p.x=mid-p.facing*.95;b.x=mid+p.facing*.95;}
 m.hitSparks=m.hitSparks.filter(s=>(s.age+=dt)<.35);
 if((p.hp<=0||b.hp<=0)&&!m.fightReset){m.roundWins[p.hp<=0?1:0]++;m.fightReset=1;}
 g.player.x=p.x;g.player.z=0;g.player.floorY=p.y;g.boss.x=b.x;g.boss.z=0;
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
 if(m.year===6)return {ArrowUp:'jump',KeyW:'jump',ArrowDown:'slide',KeyS:'slide',Space:'jump',KeyJ:'jump',KeyL:'slide',KeyK:'dash',ShiftLeft:'dash',ShiftRight:'dash'}[code]||null;
 if(m.year===7)return {Digit1:'summon0',Digit2:'summon1',Digit3:'summon2',Digit4:'summon3',Digit5:'summon4',Digit6:'summon5',KeyU:'upgrade',KeyK:'cannon'}[code]||null;
 if(m.year===9)return {KeyK:'kick',KeyI:'guard',KeyO:'super',Space:'jump',KeyW:'jump',ArrowUp:'jump'}[code]||null;
 if(m.year===10)return {Space:'bomb',KeyB:'bomb'}[code]||null;
 return null;
}
