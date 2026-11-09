import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';
export const REFERENCE_UNIT_TYPES=Object.freeze([
 {name:'종이병',cost:40,hp:74,attack:15,range:1.8,speed:2,cool:2.2},
 {name:'방패병',cost:80,hp:195,attack:10,range:1.6,speed:1.1,cool:3.5},
 {name:'장궁병',cost:125,hp:62,attack:30,range:7.4,speed:1.35,cool:4.4},
 {name:'검투사',cost:175,hp:140,attack:48,range:2.4,speed:1.7,cool:5},
 {name:'마도사',cost:240,hp:88,attack:65,range:8.5,speed:1.1,cool:6},
 {name:'거인병',cost:360,hp:390,attack:84,range:3.2,speed:.8,cool:8}
]);
export const REFERENCE_PARTY=Object.freeze([
 {name:'검의 서약',weapon:'sword',speed:118,color:'#7abbe4'},
 {name:'철추의 서약',weapon:'hammer',speed:92,color:'#efb668'},
 {name:'화살의 서약',weapon:'bow',speed:126,color:'#95d4ac'},
 {name:'문양의 서약',weapon:'cards',speed:108,color:'#c5a0e7'}
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.z||0)-(b.z||0));
const smooth=q=>{q=clamp(q,0,1);return q*q*(3-2*q);};
export const usesReference2d=m=>!!m?.reference&&m.year>=6&&m.year<=10&&!m.finishing;
const aliveTargets=m=>m.enemies.filter(e=>e.hp>0);
function activeParty(m){return m.party.find(p=>p.id===m.turnActor)||m.party[0];}
function nextTurn(m){
 const actors=[...m.party.filter(a=>a.hp>0),...m.enemies.filter(a=>a.hp>0)];
 if(!actors.length)return;
 actors.sort((a,b)=>a.av-b.av||a.id.localeCompare(b.id));const a=actors[0],min=a.av;
 for(const p of actors)p.av=Math.max(0,p.av-min);
 a.av+=10000/a.speed;m.turnActor=a.id;m.turn=a.team===1?'player':'boss';m.turnWind=a.team<0?1.25:0;
 m.turnElapsed=0;m.turnCount++;m.actorMotion=null;m.enemyHit=false;
 m.queue=actors.map(p=>({id:p.id,name:p.name,team:p.team,av:p.av,weapon:p.weapon})).sort((a,b)=>a.av-b.av);
 if(a.team<0){m.enemyVictim=m.party.filter(p=>p.hp>0)[m.turnCount%m.party.filter(p=>p.hp>0).length]?.id;}
}
export function setupReferenceMinigame(g,m){
 if(m.year<5||m.year>10)return;
 m.reference=true;m.nextId=0;m.judgement='';m.judgementUntil=0;
 if(m.year===5){
  m.skillPoints=3;m.maxSkillPoints=5;m.targetIndex=0;m.wave=1;
  m.party=REFERENCE_PARTY.map((p,i)=>({...p,id:'ally'+i,team:1,index:i,x:-9+i*5,z:11+i*.9,homeX:-9+i*5,homeZ:11+i*.9,hp:i===1?175:125,maxHp:i===1?175:125,energy:75+i*7,av:10000/p.speed}));
  m.enemies=Array.from({length:5},(_,i)=>({id:'enemy'+i,index:i,name:i===0?'최규원':i<3?'답안의 기사':'별빛 수호기',team:-1,x:[0,-9,8,-14,14][i],z:[-11,-7,-8,-12,-13][i],hp:i===0?320:150,maxHp:i===0?320:150,toughness:60,maxToughness:60,weakness:i%4,speed:84+i*5,av:10000/(84+i*5),broken:0,reform:0}));
  nextTurn(m);
 }else if(m.year===6){
  g.player.x=-10;g.player.z=0;m.jumpY=0;m.jumpV=0;m.jumpCount=0;m.slide=0;m.energy=100;m.jellies=[];m.runnerSpawn=1.8;m.jellySpawn=.15;m.platforms=[{x:-35,end:28,y:0}];m.runnerRecoverClock=14;m.runnerBiome='meadow';m.runnerDistance=0;m.pickups=0;m.bonus=0;m.fallRecovery=0;
 }else if(m.year===7){
  m.money=180;m.moneyCap=500;m.workerLevel=1;m.unitCooldowns=[0,0,0,0,0,0];m.baseHp=1000;m.baseMaxHp=1000;m.enemyBaseHp=3000;m.enemyBaseMaxHp=3000;m.cannon=65;m.cannonShot=null;m.armyWave=1;m.enemySpawn=2;m.units=[];m.baseReform=0;m.enemyFort=1;m.armyTruce=false;
 }else if(m.year===8){
  const chart=GYUWON_BEATS[8],period=60/chart.bpm;
  m.dancePeriod=period;m.dancePatterns=[];let start=3.2,index=0;
  while(start+period*8<GYUWON_SONGS[8].duration-4){
   const kind=['pose','turn','pose','quick'][index%4],count=kind==='quick'?1:index%3===1?4:3;
   const cue=start+period*(kind==='turn'?3:3.5),first=start+period*(kind==='pose'?6:kind==='turn'?5:5.5);
   m.dancePatterns.push({id:index,kind,cue,first,count,spacing:kind==='pose'?2:1,done:[],misses:[],facing:index%2?-1:1});
   start=first+period*((count-1)*(kind==='pose'?2:1)+2.7);
    if(index%5===4)start+=period*7;
    index++;
  }
  m.dancePose=0;m.danceFacing=1;m.danceFlash=0;m.danceLastCue=-1;m.danceCue='';m.danceError=0;m.note=null;
 }else if(m.year===9){
  g.player.x=-7;g.boss.x=7;g.player.z=g.boss.z=0;
  m.fighters=[{x:-7,y:0,vy:0,hp:100,maxHp:100,meter:20,facing:1,action:null,stun:0,guard:false,crouch:false,combo:0},{x:7,y:0,vy:0,hp:100,maxHp:100,meter:0,facing:-1,action:null,stun:0,guard:false,crouch:false,combo:0}];
  m.fightRound=1;m.fightReset=0;m.enemyThink=1.35;m.hitSparks=[];m.roundWins=[0,0];m.fightHitstop=0;
 }else if(m.year===10){
  g.player.x=0;g.player.z=13;m.weaponMode='spread';m.bombs=3;m.power=1;m.shotCooldown=0;m.bullets=[];m.enemyShots=[];m.shooterTargets=[{id:g.nextId++,x:-6,z:-12,hp:180,maxHp:180,phase:0,wind:1.6,aim:0,kind:'carrier'},{id:g.nextId++,x:6,z:-12,hp:180,maxHp:180,phase:1,wind:2.25,aim:0,kind:'carrier'}];m.shooterSpawn=4;m.powerItems=[];m.chain=0;m.chainTime=0;m.scroll=0;m.bombEffect=0;m.autoFire=true;
 }
}
function targetHit(g,m,target,damage,actor,c){
 if(!target||target.hp<=0)return;
 const weak=target.weakness===actor.index,breakAmount=(weak?35:18)*(damage>50?1.5:1);
 target.hp=Math.max(0,target.hp-damage*(weak?1.35:1));
 target.toughness=Math.max(0,target.toughness-breakAmount);actor.energy=Math.min(100,actor.energy+(m.actorMotion?.type==='ultimate'?0:22));
 if(target.toughness===0&&target.broken<=0){target.broken=3;target.av+=40;c.deal(g,180,c.emit);}
 c.deal(g,Math.round(damage*(weak?1.4:1)),c.emit);m.hitTarget=target.id;m.hitTargetUntil=m.time+.35;
 if(!target.hp){target.reform=3;c.deal(g,250,c.emit);}
}
function beginTurnAttack(m,type,actor=activeParty(m)){
 const target=m.enemies[m.targetIndex]?.hp>0?m.enemies[m.targetIndex]:aliveTargets(m)[0];if(!target)return false;m.targetIndex=target.index;
 m.actorMotion={actorId:actor.id,targetId:target.id,type,age:0,hitAt:type==='ultimate'?1.15:.7,duration:type==='ultimate'?2.2:1.4,hit:false,fromX:actor.x,fromZ:actor.z};
 m.returnTurn=m.turn;m.turn='animation';return true;
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
 if(m.year===5){
  if(/^target[0-4]$/.test(type)){const n=Number(type.slice(6));if(m.enemies[n].hp<=0)return false;m.targetIndex=n;return true;}
  if(type==='target-next'||type==='target-prev'){
   const direction=type==='target-next'?1:-1;for(let i=0;i<5;i++){m.targetIndex=(m.targetIndex+direction+5)%5;if(m.enemies[m.targetIndex].hp>0)break;}return true;
  }
  if(type.startsWith('ultimate')){const i=Number(type.slice(8))||0,p=m.party[i];if(!p||p.hp<=0||p.energy<100||m.actorMotion)return false;if(!beginTurnAttack(m,'ultimate',p))return false;p.energy=0;return true;}
  if(m.turn!=='player'||m.actorMotion)return false;
  const actor=activeParty(m);
  if(type==='light'){if(!beginTurnAttack(m,'light',actor))return false;m.skillPoints=Math.min(5,m.skillPoints+1);return true;}
  if(type==='skill'&&m.skillPoints>0){if(!beginTurnAttack(m,'skill',actor))return false;m.skillPoints--;return true;}
  if(type==='roll'){actor.hp=Math.min(actor.maxHp,actor.hp+20);actor.energy=Math.min(100,actor.energy+15);nextTurn(m);return true;}
  return false;
 }
 if(m.year===6){
  if(['light','roll','jump'].includes(type)&&m.jumpCount<2){m.jumpV=m.jumpCount?8:9.2;m.jumpCount++;m.slide=0;m.slideHeld=false;return true;}
  if(type==='skill'||type==='slide'){m.slide=.95;m.slideHeld=true;return true;}
  if(type==='slide-end'){m.slide=0;m.slideHeld=false;return true;}
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
function tickReferenceTurn(g,m,dt,c){
 // Never resurrect a defeated enemy at the same location on a short timer.
 const p=m.actProgress||0;
 if(!m.actorMotion&&m.wave<3&&p>=(m.wave===1?.38:.76)){
  m.wave++;m.targetIndex=0;m.skillPoints=Math.min(m.maxSkillPoints,m.skillPoints+1);
  for(const e of m.enemies){e.maxHp=Math.round((e.index===0?330:135)*(m.wave===2?1.2:1.6));e.hp=e.maxHp;
   e.x=[0,-10,9,-15,15][e.index]+(m.wave===2?-1.6:1.6);e.toughness=e.maxToughness=65+15*(m.wave-1);e.broken=0;e.reform=0;e.av+=30;}
  nextTurn(m);
 }
 for(const e of m.enemies)e.broken=Math.max(0,e.broken-dt);
 if(m.actorMotion){
  const a=m.actorMotion,p=m.party.find(p=>p.id===a.actorId),t=m.enemies.find(t=>t.id===a.targetId);a.age+=dt;
  const advance=smooth(a.age/.55)*(1-smooth((a.age-.86)/.5));
  if(a.type!=='ultimate'&&t){p.x=a.fromX+(t.x-a.fromX)*advance*.85;p.z=a.fromZ+(t.z-a.fromZ)*advance*.85;}
  if(!a.hit&&a.age>=a.hitAt){a.hit=true;if(a.type==='ultimate'){for(const e of aliveTargets(m))targetHit(g,m,e,95,p,c);}else if(t&&dist(p,t)<6){targetHit(g,m,t,a.type==='skill'?58:32,p,c);if(a.type==='skill')for(const e of aliveTargets(m))if(e!==t&&Math.abs(e.index-t.index)===1)targetHit(g,m,e,22,p,c);}}
  if(a.age>=a.duration){p.x=p.homeX;p.z=p.homeZ;m.actorMotion=null;if(a.type==='ultimate'){m.turn=m.returnTurn;}else nextTurn(m);}
 }else if(m.turn==='boss'){
  const enemy=m.enemies.find(e=>e.id===m.turnActor),victim=m.party.find(p=>p.id===m.enemyVictim);
  if(!enemy||enemy.hp<=0||enemy.broken>0){nextTurn(m);return;}
  m.turnElapsed+=dt;m.turnWind=Math.max(0,1.25-m.turnElapsed);
  if(m.turnElapsed>=1.25&&!m.enemyHit){m.enemyHit=true;if(victim){victim.hp=Math.max(0,victim.hp-18);victim.energy=Math.min(100,victim.energy+16);c.take(g,18,c.emit);}}
  if(m.turnElapsed>=1.8){m.enemyHit=false;nextTurn(m);}
 }
 g.boss.x=m.enemies[0].x;g.boss.z=m.enemies[0].z;
}
function tickReferenceRunner(g,m,dt,c){
 const p=g.player,progress=m.actProgress||0,relief=progress>.57&&progress<.69;
 m.runnerBiome=progress<.33?'meadow':progress<.55?'rain':progress<.75?'quiet':'sunrise';
 const speed=m.bonus>0?17:relief?11:13;
 m.bonus=Math.max(0,m.bonus-dt);m.runnerDistance+=speed*dt;m.energy=Math.max(0,m.energy-dt*1.35);m.slide=m.slideHeld?.95:Math.max(0,m.slide-dt);
 for(const platform of m.platforms){platform.x-=speed*dt;platform.end-=speed*dt;}
 m.platforms=m.platforms.filter(a=>a.end>-35);
 let last=m.platforms.at(-1);if(last&&last.end<37){const gap=relief?0:m.pickups%3===1?5.2:3.6;m.platforms.push({x:last.end+gap,end:last.end+gap+18+(m.pickups%3)*3,y:0});}
 const grounded=m.platforms.some(a=>p.x>=a.x&&p.x<=a.end);
 m.jumpY+=m.jumpV*dt;m.jumpV-=24*dt;
 if(grounded&&m.jumpY<=0&&m.jumpV<=0){m.jumpY=0;m.jumpV=0;m.jumpCount=0;}
 if(m.jumpY<-5){c.take(g,25,c.emit);m.energy=Math.max(0,m.energy-12);m.jumpY=2.8;m.jumpV=0;m.jumpCount=0;m.platforms.push({x:p.x-3,end:p.x+10,y:0});}
 p.floorY=m.jumpY;
 if(!relief){m.runnerSpawn-=dt;if(m.runnerSpawn<=0){m.runnerSpawn=progress>.77?1.55:2.1+(m.pickups%4)*.2;m.obstacles.push({id:g.nextId++,x:24,kind:m.nextId%2?'low':'high',width:1.3,hit:false});m.nextId=(m.nextId||0)+1;}}else m.runnerSpawn=Math.max(m.runnerSpawn,1.4);
 m.runnerRecoverClock-=dt;if(m.runnerRecoverClock<=0){m.runnerRecoverClock=14;m.jellies.push({id:g.nextId++,x:22,y:1.1,kind:'heart'});}
 for(const o of m.obstacles){o.x-=speed*dt;const bottom=m.jumpY,top=bottom+(m.slide>0?.72:2.1),lo=o.kind==='low'?1.5:0,hi=o.kind==='low'?3.6:1.2;
  if(!o.hit&&Math.abs(o.x-p.x)<1.02&&top>lo&&bottom<hi){o.hit=true;m.combo=0;c.take(g,20,c.emit);m.energy=Math.max(0,m.energy-8);}
 }
 m.obstacles=m.obstacles.filter(o=>o.x>-30);
 m.jellySpawn-=dt;if(m.jellySpawn<=0){m.jellySpawn=.26;const i=m.pickups+(m.jellies.length||0);m.jellies.push({id:g.nextId++,x:25,y:.7+Math.sin(i*.4)*.55+(i%9<3?1.8:0),kind:i%17===0?'heart':i%7===0?'gold':'jelly'});}
 for(const j of m.jellies){j.x-=speed*dt;if(Math.hypot(j.x-p.x,j.y-(m.jumpY+(m.slide>0?.4:1)))<1){j.collected=true;m.pickups++;m.energy=Math.min(100,m.energy+(j.kind==='heart'?18:.55));c.deal(g,j.kind==='gold'?150:45,c.emit);if(m.pickups%30===0)m.bonus=4;}}
 m.jellies=m.jellies.filter(j=>!j.collected&&j.x>-30);
 if(m.energy===0){c.take(g,8,c.emit);m.energy=20;}
}
function tickReferenceArmy(g,m,dt,c){
 m.money=Math.min(m.moneyCap,m.money+dt*(22+m.workerLevel*7));m.cannon=Math.min(100,m.cannon+dt*4.8);m.unitCooldowns=m.unitCooldowns.map(t=>Math.max(0,t-dt));
 const p=m.actProgress||0;
 m.armyTruce=p>=.59&&p<.70;
 if(m.armyTruce){m.enemySpawn=Math.max(m.enemySpawn,.8);return;}
 if((m.enemyFort<2&&p>=.39)||(m.enemyFort<3&&p>=.77)){m.enemyFort++;m.enemyBaseHp=m.enemyBaseMaxHp=Math.round(3000*(1+.35*(m.enemyFort-1)));m.enemySpawn=.6;}
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
 if(m.fightReset>0){m.fightReset-=dt;if(m.fightReset<=0){for(let i=0;i<2;i++){const f=m.fighters[i];f.hp=100;f.x=i?7:-7;f.y=0;f.vy=0;f.action=null;f.stun=0;}m.fightRound++;}return;}
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
 if(p.hp<=0||b.hp<=0){m.roundWins[p.hp<=0?1:0]++;m.fightReset=2;}
 g.player.x=p.x;g.player.z=0;g.player.floorY=p.y;g.boss.x=b.x;g.boss.z=0;
}
function tickReferenceShooter(g,m,dt,input,c){
 const p=g.player;if(m.pointerTarget){const dx=m.pointerTarget.x-p.x,dz=m.pointerTarget.z-p.z,d=Math.hypot(dx,dz),q=Math.min(1,dt*26/Math.max(.001,d));p.x+=dx*q;p.z+=dz*q;}p.x=clamp(p.x+(input.x||0)*10*dt,-11,11);p.z=clamp(p.z-(input.z||0)*10*dt,-8,16);m.scroll+=dt*5;m.bombEffect=Math.max(0,m.bombEffect-dt);m.chainTime=Math.max(0,m.chainTime-dt);if(m.chainTime===0)m.chain=0;
 m.shotCooldown-=dt;if(m.shotCooldown<=0){m.shotCooldown=.115;for(let i=0;i<m.power;i++){const d=(i-(m.power-1)/2)*(m.weaponMode==='laser'?.18:.52);m.bullets.push({x:p.x+d,z:p.z-1,life:2.5,vx:d*1.2,vz:-30,damage:9,kind:m.weaponMode==='laser'?'laser':'shot'});}}
 m.shooterSpawn-=dt;if(m.shooterSpawn<=0&&m.shooterTargets.length<7){m.shooterSpawn=4;const side=m.turnCount++%2?-1:1;m.shooterTargets.push({id:g.nextId++,x:side*9,z:-19,hp:45,maxHp:45,phase:m.turnCount,wind:1.4,aim:0,kind:'fighter'});}
 for(const e of m.shooterTargets){
  if(e.hp<=0)continue;e.z+=e.kind==='fighter'?dt*3:Math.sin(m.time*.7+e.phase)*dt*.45;e.x+=Math.sin(m.time*.8+e.phase)*dt*.6;e.wind-=dt;
  if(e.wind<=0){const angle=Math.atan2(p.x-e.x,p.z-e.z);for(let i=-2;i<=2;i++){const a=angle+i*(e.kind==='carrier'?.19:.12);m.enemyShots.push({x:e.x,z:e.z+1,vx:Math.sin(a)*6.5,vz:Math.cos(a)*6.5,life:7,age:0,kind:e.phase%2?'amber':'red'});}e.wind=e.kind==='carrier'?2.15:2.7;}
 }
 for(const a of m.bullets){a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;for(const e of m.shooterTargets)if(e.hp>0&&dist(a,e)<(e.kind==='carrier'?1.45:.85)){e.hp-=a.damage;a.life=0;c.deal(g,a.damage,c.emit);if(e.hp<=0){m.chain++;m.chainTime=2.5;c.deal(g,500+m.chain*50,c.emit);m.powerItems.push({x:e.x,z:e.z,kind:m.chain%3===0?'power':'medal'});}break;}}
 for(const a of m.enemyShots){a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;a.age+=dt;if(dist(a,p)<.68){a.life=0;c.take(g,18,c.emit);m.chain=0;}}
 m.bullets=m.bullets.filter(a=>a.life>0&&a.z>-23);m.enemyShots=m.enemyShots.filter(a=>a.life>0&&Math.abs(a.x)<15&&a.z<23);
 m.shooterTargets=m.shooterTargets.filter(e=>e.hp>0&&e.z<21);
 if(!m.shooterTargets.some(e=>e.kind==='carrier'))m.shooterTargets.push({id:g.nextId++,x:0,z:-16,hp:300,maxHp:300,phase:2,wind:2,aim:0,kind:'carrier'});
 for(const item of m.powerItems){item.z+=dt*3;if(dist(item,p)<1.4){item.done=true;if(item.kind==='power')m.power=Math.min(3,m.power+1);c.deal(g,200,c.emit);}}
 m.powerItems=m.powerItems.filter(a=>!a.done&&a.z<21);g.boss.x=0;g.boss.z=-12;
}
export function tickReferenceMinigame(g,m,dt,input,c){
 if(m.year===5)tickReferenceTurn(g,m,dt,c);
 else if(m.year===6)tickReferenceRunner(g,m,dt,c);
 else if(m.year===7)tickReferenceArmy(g,m,dt,c);
 else if(m.year===8)tickReferenceDance(g,m,dt,c);
 else if(m.year===9)tickReferenceFighter(g,m,dt,input,c);
 else if(m.year===10)tickReferenceShooter(g,m,dt,input,c);
}
export function referenceKeyAction(m,code){
 if(!m?.reference)return null;
 if(m.year===5)return {KeyA:'target-prev',ArrowLeft:'target-prev',KeyD:'target-next',ArrowRight:'target-next',KeyQ:'light',KeyE:'skill',Space:'light',Digit1:'ultimate0',Digit2:'ultimate1',Digit3:'ultimate2',Digit4:'ultimate3'}[code]||null;
 if(m.year===6)return {ArrowUp:'jump',KeyW:'jump',ArrowDown:'slide',KeyS:'slide',Space:'jump',KeyJ:'jump',KeyL:'slide'}[code]||null;
 if(m.year===7)return {Digit1:'summon0',Digit2:'summon1',Digit3:'summon2',Digit4:'summon3',Digit5:'summon4',Digit6:'summon5',KeyU:'upgrade',KeyK:'cannon'}[code]||null;
 if(m.year===9)return {KeyK:'kick',KeyI:'guard',KeyO:'super',Space:'jump',KeyW:'jump',ArrowUp:'jump'}[code]||null;
 if(m.year===10)return {Space:'bomb',KeyB:'bomb'}[code]||null;
 return null;
}
