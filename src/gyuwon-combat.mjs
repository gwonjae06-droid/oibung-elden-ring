import {tickBossHitTraits} from './boss-hit-traits.mjs';
import {playerWalkSpeed,playerRollSpeed,playerRolling} from './player-movement-rules.mjs';
import {playerIncomingDamage} from './weapon-stats.mjs';
import {playerMeleeReach} from './weapon-abilities.mjs';
import {claimPlayerProjectileHit} from './player-projectile-data.mjs';
import {kwonMeleeContact,kwonProjectileContact} from './kwon-hurtbox.mjs';
import {gyuwonHurtShapes} from './boss-hit-regions.mjs';
import {createPatternShuffle,drawPatternShuffle} from './pattern-shuffle.mjs';
import {GYUWON_RULES as R,GYUWON_PATTERNS,gyuwonPool,hazardContains,memoryInterval,MEMORY_ORDER} from './gyuwon-data.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createPlayerState,actPlayer,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {createGyuwonYears,tickGyuwonYears} from './gyuwon-years.mjs';

const emit=(g,type,data={})=>g.events.push({type,...data});
const clampArena=p=>{const d=Math.hypot(p.x,p.z);if(d>R.radius-1){p.x*= (R.radius-1)/d;p.z*= (R.radius-1)/d;}};
export function createGyuwonGame(weapon='sword',{seed,yearMode=false}={}){
 if(!Object.hasOwn(WEAPONS,weapon))throw Error('Unknown weapon');
 const game={bossId:'gyuwon',weapon,time:0,status:'playing',nextId:1,events:[],projectiles:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState({x:0,z:14,weapon}),
  boss:{x:0,z:-5,hp:R.hp,maxHp:R.hp,phase:1,state:'recovery',yaw:0},
  gyuwon:{patternDeck:createPatternShuffle(seed),pattern:null,index:0,t:0,recover:1.2,motionBeats:[],hazards:[],elevation:0,slow:0,stun:0,transitioned:false,phasePending:false,deathTime:0,memory:[],space:'white',spaceTime:0,stageTime:0,stageIndex:0,stageMemory:null,memoryVariant:0,memoryRun:0,memoryRunTarget:2,proofQueue:[],proofIndex:0,whiteQuota:2,whiteCycle:0,casts:0,lastWarpCast:-1,teleport:null}};
 if(yearMode)game.gyuwon.years=createGyuwonYears();
 // All weapon skills (card sigils, burning arrows, hammer guard and throw)
 // settle through the shared player combat manager, including DoT statistics.
 Object.defineProperty(game,'applyBonusDamage',{enumerable:false,writable:true,configurable:true,
  value:(amount,poise=0,{dot=false}={})=>{
   const dealt=damageGyuwon(game,amount,null,{dot});
   if(dealt>0){game.stats.damage+=dealt;if(!dot)game.stats.hits++;}
   return dealt;
  }});
 return game;
}
export function actGyuwon(g,type,input={}){
 if(g.status!=='playing'||g.boss.state==='transition'||g.gyuwon.years?.mode==='result')return false;
 if(!g.player.action)g.player.yaw=type==='roll'&&(input.x||input.z)?Math.atan2(input.x||0,input.z||0):Math.atan2(g.boss.x-g.player.x,g.boss.z-g.player.z);
 return actPlayer(g,type);
}
export function damageGyuwon(g,amount,impact=null,{dot=false}={}){
 if(g.status!=='playing'||g.boss.state==='transition'||!Number.isFinite(amount)||amount<=0)return 0;
 // In the annual-exam encounter, every year is vulnerable;
 // during the five-subject exam only, incoming damage is halved.
 if(g.gyuwon.years){
  const b=g.boss,s=g.gyuwon,e=s.years;
  if(e.mode==='result')return 0;
  // The sixth-year shrine is breakable. Intact figures absorb a modest portion
  // of incoming boss damage until the player clears them or the cast ends.
  const shield=e.cast==='ultimateShrine'&&e.wards?.some(w=>w.hp>0)?0.78:1;
  const dealt=Math.min(b.hp,amount*(e.mode==='exam'?.5:1)*shield);
  b.hp-=dealt;if(dealt&&!dot)emit(g,'boss-hit',{amount:dealt,
   ...(impact?{x:impact.x,y:impact.y,z:impact.z,part:impact.part}:{})});
  if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;emit(g,'victory');}
  return dealt;
 }
 // White space absorbs the blow. Record it so the view can dissolve it into written glyphs.
 if(g.boss.phase===2&&g.gyuwon.space==='white'){
  if(!dot){g.gyuwon.absorbAt=g.time;g.gyuwon.absorbCount=(g.gyuwon.absorbCount||0)+1;}
  return 0;
 }
 const b=g.boss,s=g.gyuwon,damage=Math.min(amount,b.phase<3?Math.max(0,b.hp-1):b.hp);b.hp-=damage;
 if(damage&&!dot)emit(g,'boss-hit',{amount:damage,
  ...(impact?{x:impact.x,y:impact.y,z:impact.z,part:impact.part}:{})});
 if(b.phase===1&&b.hp<=b.maxHp*.65||b.phase===2&&b.hp<=b.maxHp*.3)s.phasePending=true;
 if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;s.slow=0;emit(g,'victory');}
 return damage;
}
// The shrine effigies are real strike targets, not cosmetic invulnerable props.
// These contacts share player melee/projectile hit ownership with boss contacts.
export function strikeGyuwonWard(g,x,z,damage,yaw=null,reach=2.9){
 const e=g.gyuwon?.years;
 if(e?.mode!=='combat'||e.cast!=='ultimateShrine'||!e.wards?.length)return false;
 let best=null,dist=Infinity;
 for(const ward of e.wards){
  if(ward.hp<=0)continue;
  const dx=ward.x-x,dz=ward.z-z,d=Math.hypot(dx,dz);
  if(d>reach+1.4||d>=dist)continue;
  if(yaw!==null){
   const diff=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),
    Math.cos(Math.atan2(dx,dz)-yaw));
   if(Math.abs(diff)>.64)continue;
  }
  best=ward;dist=d;
 }
 if(!best)return false;
 best.hp=Math.max(0,best.hp-damage);
 emit(g,'gyuwon-ward-hit',{x:best.x,z:best.z,amount:damage});
 if(best.hp<=0){
  g.gyuwon.hazards=g.gyuwon.hazards.filter(h=>h.wardIndex!==best.index);
  emit(g,'gyuwon-ward-break',{x:best.x,z:best.z,remaining:e.wards.filter(w=>w.hp>0).length});
 }
 return true;
}
function hit(g,amount,source,impact=null){
 const s=g.gyuwon;if(s.elevation>2&&!WEAPONS[g.weapon].projectile)return;
 const damage=damageGyuwon(g,amount*(g.boss.phase===2?(g.boss.state==='recovery'?1.6:s.elevation>2?.65:1):1),impact);
 if(!damage)return;
 settlePlayerHit(g,damage,source,{canStun:g.boss.state!=='transition',stun:d=>{s.stun=Math.min(1.2,d);}});
}
function hazard(g,shape,opts={}){const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:1,life:.35,age:0,damage:24,hit:false,...opts};g.gyuwon.hazards.push(h);return h;}
export function startGyuwonPattern(g,id,{replay=null}={}){
 const spec=GYUWON_PATTERNS[id];if(!spec||g.status!=='playing'||g.boss.state==='transition')return false;
 const b=g.boss,s=g.gyuwon,p=g.player,aim=Math.atan2(p.x-b.x,p.z-b.z);s.hazards.length=0;s.pattern=id;s.t=0;b.state='pattern';b.yaw=aim;s.target={x:p.x,z:p.z};s.origin={x:b.x,z:b.z};s.casts++;
 if(replay){
  s.hazards=replay.hazards.map(h=>({...h,id:g.nextId++,age:0,hit:false,fired:false,
   damage:h.originalDamage??h.damage,preview:false,inkFinger:true}));
  s.motionBeats=[...new Set(s.hazards.map(h=>h.warn))].sort((a,b)=>a-b);
  emit(g,'gyuwon-warning',{pattern:id});return true;
 }
 if(b.phase===3&&MEMORY_ORDER.includes(id)){
  // Only the actual attack may advance the memory room. Never change rooms on an idle timer.
  if(s.stageMemory===id)s.memoryRun++;
  else{s.stageMemory=id;s.stageTime=0;s.stageIndex++;s.memoryRun=1;
   s.memoryRunTarget=2+s.stageIndex%2;emit(g,'memory-stage',{memory:id});}
  s.memoryVariant=drawPatternShuffle(s.patternDeck,'gyuwon-memory-'+id,[0,1,2]);
 }
 const lane=(x,z,yaw,warn,extra={})=>hazard(g,'lane',{x,z,yaw,warn,width:1.15,length:42,life:.3,damage:24,...extra});
 if(id==='line')for(let i=-1;i<=1;i++)lane(p.x+i*5,p.z,0,1.35+Math.abs(i)*.22);
 if(id==='mark')for(let i=0;i<3;i++)hazard(g,'circle',{x:p.x+(i-1)*4,z:p.z,r:2.5,warn:1.35+i*.5,damage:22});
 if(id==='repeat'){
 // Replay at most three recognizable writing traces, not a screen of overlapping sectors.
  const remembered=s.memory.filter(h=>h.shape==='lane'||h.shape==='circle').slice(0,3);
  const traces=remembered.length?remembered:[{shape:'lane',x:p.x,z:p.z,yaw:aim,width:1.15,length:42,r:2}];
 for(const h of traces){hazard(g,h.shape,{...h,warn:1,age:0,hit:false,fired:false,damage:26,life:.3});hazard(g,h.shape,{...h,warn:g.boss.phase===2?1.85:2.25,age:0,hit:false,fired:false,damage:26,life:.3});}
 }
 if(id==='choice'){
  // At shared movement speed, a randomly distant safe fifth can be
  // physically unreachable from the perimeter. Keep the player's CURRENT
  // sector safe; a late, separately warned locked note then forces movement.
  const sector=Math.PI*2/5,theta=(Math.atan2(p.x,p.z)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
  const nearest=Math.round(theta/sector)%5;
  for(let i=0;i<5;i++)if(i!==nearest)hazard(g,'cone',{
   x:0,z:0,yaw:i*sector,arc:.5,r:26,warn:1.95+i*.15
  });
  hazard(g,'circle',{x:p.x,z:p.z,r:2.75,warn:2.95,life:.36,damage:24});
 }
 if(id==='timetable')for(let i=0;i<4;i++)lane((i-1.5)*7,0,0,1.45+i*.6);
 if(id==='blank')hazard(g,'ring',{x:b.x,z:b.z,r:2,width:.6,grow:12,warn:1.4,life:2});
 if(id==='negate')for(let i=0;i<3;i++)hazard(g,'circle',{x:p.x+(i-1)*5,z:p.z,r:3,warn:1.4+i*.4});
 if(id==='contradiction')for(let i=-1;i<=1;i+=2)lane(p.x,p.z,i*.65,1.5+(i+1)*.3);
 if(id==='reverse'||id==='stop')for(let i=0;i<3;i++){lane((i-1)*6,0,0,1.2+i*.35);if(id==='reverse')lane((i-1)*6,0,0,3.4-i*.35);}
 // Each second-phase action has its own floor-space language. Every hit
 // resolves from the exact same lane/ring/cone shape displayed by the view.
 if(id==='verdict'){
  lane(p.x,p.z,0,1.35,{width:2.4,length:34,damage:28,visual:'verdict'});
  for(const side of [-1,1])hazard(g,'cone',{
   x:b.x,z:b.z,yaw:aim+side*.66,arc:.39,r:23,
   warn:side<0?2.2:3.05,life:.42,damage:29,visual:'verdict-seal'
  });
 }
 if(id==='mirror'){
  const axis=Math.max(4,Math.min(15,Math.abs(p.x)+4));
  for(const side of [-1,1])hazard(g,'circle',{
   x:side*axis,z:p.z,r:3.3,warn:side<0?1.35:1.95,
   life:.42,damage:26,visual:'mirror'
  });
  lane(p.x,p.z,Math.PI/2,3.2,{width:2.1,length:32,damage:29,visual:'mirror-cross'});
 }
 if(id==='axiom'){
  hazard(g,'ring',{x:b.x,z:b.z,r:2.8,width:.9,grow:7,
   warn:1.65,life:1.8,damage:30,visual:'axiom'});
  for(const side of [-1,1])lane(p.x+side*6,p.z,0,side<0?2.3:3.1,
   {width:1.8,length:35,damage:26,visual:'axiom-line'});
 }
 if(id==='paradox'){
  lane(p.x,p.z,.72,1.3,{width:2.0,length:38,damage:27,visual:'paradox'});
  lane(p.x,p.z,-.72,2.15,{width:2.0,length:38,damage:27,visual:'paradox'});
  hazard(g,'ring',{x:p.x,z:p.z,r:2.9,width:1.0,grow:5,
   warn:3.1,life:1.2,damage:30,visual:'paradox-ring'});
 }
 if(id==='erasure'){
  for(let i=0;i<5;i++){
   const theta=i*Math.PI*2/5;
   hazard(g,'circle',{x:p.x+Math.sin(theta)*6,z:p.z+Math.cos(theta)*6,
    r:3.0,warn:1.35+i*.58,life:.5,damage:28,visual:'erasure'});
  }
  hazard(g,'ring',{x:b.x,z:b.z,r:3,width:1,grow:6,
   warn:3.95,life:1.25,damage:30,visual:'erasure-ring'});
 }
 // A 2P dark-world counterexample: two committed diagonal proofs, then a
 // clearly growing refutation ring. Standing on the original aim point is
 // punished; moving diagonally keeps an open escape route at shared 4.7 speed.
 if(id==='counterproof'){
  const center={x:p.x,z:p.z};
  lane(center.x,center.z,Math.PI*.25,1.75,
   {width:1.45,length:27,life:.44,damage:27,visual:'counterproof-line'});
  lane(center.x,center.z,-Math.PI*.25,2.72,
   {width:1.45,length:27,life:.44,damage:27,visual:'counterproof-line'});
  hazard(g,'ring',{x:center.x,z:center.z,r:2.6,width:1.05,grow:5.4,
   warn:3.55,life:.86,damage:29,visual:'counterproof-ring'});
 }
 if(id==='sword'){lane(p.x+(s.memoryVariant===1?-6:s.memoryVariant===2?6:0),0,s.memoryVariant===2?.14:0,2,{width:2.8,length:900,life:.35,damage:36,visual:'sword'});lane(p.x,0,0,3.1,{width:2.8,length:900,damage:22});lane(0,p.z,Math.PI/2,4.4,{width:2.5,length:900,damage:30,visual:'sword'});}
 if(id==='circus'){
  for(let i=0;i<5;i++){const yaw=i*Math.PI/(s.memoryVariant===1?2.6:2)+(s.memoryVariant===2?.28:0);hazard(g,'circle',{x:Math.sin(yaw)*-60+(i===4?8:0),z:Math.cos(yaw)*-60,r:4.5,warn:1+i*.65,life:3.2,vx:Math.sin(yaw)*38,vz:Math.cos(yaw)*38,visual:'ball',damage:27});}
  for(let i=0;i<3;i++)hazard(g,'circle',{x:p.x+(i-1)*7,z:p.z,r:3,warn:2+i*.7,visual:'spotlight'});
  for(let i=-2;i<=2;i++)if(i!==0)hazard(g,'lane',{x:i*8,z:-55,yaw:0,width:2,length:7,warn:3,life:3,vz:35,visual:'crowd'});
 }
 if(id==='gamble'){
  s.roll=1+Math.floor(Math.random()*6);emit(g,'gyuwon-roll',{value:s.roll});
  for(let i=0;i<s.roll+3;i++){const a=i*(s.memoryVariant===1?1.7:2.4)+s.memoryVariant*.45;hazard(g,'circle',{x:i===0?p.x:Math.sin(a)*16,z:i===0?p.z:Math.cos(a)*16,r:3.3,warn:1.3+i*.4,visual:'dice',damage:30});}
  for(let i=0;i<6;i++)if(i!==s.roll%6)hazard(g,'cone',{x:0,z:0,yaw:i*Math.PI/3,arc:.36,r:26,warn:4.8,life:.5,damage:28,visual:'roulette'});
 }
 if(id==='tsunami'){
  // Combined memory: Gyuwon recasts Kwon's cleave through the remembered tsunami. The cut lands on
  // the corridor, then the corridor slides sideways toward a new gap (collision and mesh both read h.gap).
  // The wave stays hazards[0]; the cleave lane is appended after it.
  const gap0=Math.max(-13,Math.min(13,p.x*.5+(s.memoryVariant-1)*1.4));
  const dir=gap0>1?-1:gap0<-1?1:(s.stageIndex%2?-1:1);
  hazard(g,'wave',{x:0,z:-180,gap:gap0,opening:3.2,depth:2.2,speed:60,warn:2,life:6,damage:65,visual:'wave',
   gapTarget:Math.max(-13,Math.min(13,gap0+dir*4)),shiftAt:2.55,shiftSpeed:5});
  lane(gap0,0,0,2.2,{width:2.8,length:900,life:.35,damage:26,visual:'sword'});
 }
 if(id==='chalk'){
  for(let i=0;i<4;i++)lane((i-1.5)*(s.memoryVariant===1?8.5:7),0,s.memoryVariant===2?.12:0,1.2+i*.55,{visual:'formula'});
  lane(p.x,p.z,.78,3.5,{length:26,visual:'cross'});lane(p.x,p.z,-.78,4,{length:26,visual:'cross'});
  hazard(g,'ring',{x:0,z:0,r:3,width:.8,grow:9,warn:4.5,life:1.8,visual:'chalk-ring'});
 }
 if(!['repeat','reverse','stop'].includes(id))s.memory=s.hazards.map(({shape,x,z,yaw,width,length,r,arc,grow})=>({shape,x,z,yaw,width,length,r,arc,grow}));
 // Animation uses this stable damage timeline after one-shot hazards have expired.
 if(b.phase===2&&s.space==='white'){
  const frozen=s.hazards.map(h=>({...h,originalDamage:h.damage}));
  s.proofQueue.push({id,hazards:frozen,duration:spec.duration});
  for(const h of s.hazards){h.originalDamage=h.damage;h.damage=0;h.preview=true;}
 }
 s.motionBeats=[...new Set(s.hazards.map(h=>h.warn).filter(Number.isFinite))].sort((a,b)=>a-b);
 emit(g,'gyuwon-warning',{pattern:id});return true;
}
// These pairs give each phase a legible question -> answer -> consequence rhythm.
// Shuffled decks remain authoritative: all abilities play before any repeats.
export const GYUWON_FOLLOWUPS=Object.freeze({
 '1':Object.freeze({mark:['repeat'],line:['contradiction'],timetable:['blank'],choice:['mark'],contradiction:['mark'],blank:['line']}),
 white:Object.freeze({negate:['verdict'],verdict:['mirror'],mirror:['axiom'],axiom:['negate']}),
 dark:Object.freeze({reverse:['paradox'],paradox:['counterproof'],counterproof:['stop'],stop:['erasure'],erasure:['reverse']}),
 '3':Object.freeze({sword:['circus'],circus:['gamble'],gamble:['tsunami'],tsunami:['chalk'],chalk:['sword']})
});
// Independent decks preserve previously unplayed white/dark spells and varied openings.
export function chooseGyuwonPattern(g){
 const b=g.boss,s=g.gyuwon,pool=gyuwonPool(b.phase,s.space);
 const family=b.phase===2?s.space:String(b.phase);
 const preferred=b.phase===3&&s.stageMemory?[]:GYUWON_FOLLOWUPS[family]?.[s.pattern]||[];
 return drawPatternShuffle(s.patternDeck,'gyuwon-'+b.phase+'-'+(b.phase===2?s.space:'main'),
  pool,{avoid:s.pattern,preferred});
}
function beginPhase(g){const s=g.gyuwon;g.boss.phase++;g.boss.state='transition';s.transitioned=true;s.phasePending=false;s.t=0;s.index=0;s.space='white';s.spaceTime=0;s.stageTime=0;s.stageIndex=0;s.stageMemory=null;s.memoryRun=0;s.proofQueue=[];s.proofIndex=0;s.whiteCycle=0;s.whiteQuota=2;s.teleport=null;s.lastWarpCast=-1;s.hazards.length=0;s.motionBeats=[];s.memory=[];s.pattern=null;g.projectiles.length=0;g.player.action=null;s.slow=0;s.stun=0;emit(g,'phase');}
function hurt(g,h){
 const p=g.player,rolling=playerRolling(p);
 if(p.invuln>0||rolling){if(!h.dodged){g.stats.dodges++;h.dodged=true;}return;}
 const amount=Math.min(p.hp,playerIncomingDamage(g,h.damage));
 h.hit=true;p.hp=Math.max(0,p.hp-amount);p.invuln=.65;if(h.slow)g.gyuwon.slow=h.slow;
 emit(g,'hurt',{amount});
 if(p.hp<=0){g.status='lost';g.gyuwon.hazards.length=0;g.projectiles.length=0;emit(g,'death');}
}
function tickBoss(g,dt){
 if(g.gyuwon.years){tickGyuwonYears(g,dt,{hurt:h=>hurt(g,h),emit:(type,data={})=>emit(g,type,data)});return;}
 const b=g.boss,s=g.gyuwon;
 if(b.phase===2&&b.state!=='transition')s.spaceTime+=dt;
 // Actual memory transitions are emitted by startGyuwonPattern, never the idle clock.
 if(b.phase===3&&s.stageMemory)s.stageTime+=dt;
 s.slow=Math.max(0,s.slow-dt);
 if(b.state==='transition'){s.t+=dt;s.elevation=0;if(s.t>=R.transition){b.state='recovery';s.recover=2.8;s.elevation=0;s.t=0;emit(g,'gyuwon-land');}return;}
 if(s.stun>0){s.stun=Math.max(0,s.stun-dt);return;}
 if(b.state==='recovery'){
  s.elevation=Math.max(0,s.elevation-dt*10);
  if(s.teleport){
   s.teleport.t+=dt;
   if(s.teleport.t>=1.25){b.x=s.teleport.to.x;b.z=s.teleport.to.z;
    s.teleport=null;emit(g,'gyuwon-teleport',{x:b.x,z:b.z});}
   return;
  }
  if(s.phasePending){beginPhase(g);return;}
  // Land close enough to offer every melee weapon a real counterattack window.
  const dx=g.player.x-b.x,dz=g.player.z-b.z,d=Math.hypot(dx,dz);
  // Let the player punish the landed attack before any forward steps resume.
  const lastSpec=GYUWON_PATTERNS[s.pattern],window=lastSpec?.recover??(b.phase===1?1.2:2.8);
  const planted=Math.min(.8,window*.35);
  // No sliding chase: all physical relocation is preceded by a full visible warp charge.
  // The rig, sword collision capsules and the recovery facing share this yaw.
  const facing=Math.atan2(dx,dz);
  b.yaw+=Math.atan2(Math.sin(facing-b.yaw),Math.cos(facing-b.yaw))*Math.min(1,dt*6.5);
  s.recover-=dt;if(s.recover<=0){
   if(s.casts>0&&s.casts%3===0&&s.lastWarpCast!==s.casts){
    s.lastWarpCast=s.casts;
    const theta=Math.atan2(g.player.x-b.x,g.player.z-b.z)+((s.casts%2)?1:-1)*1.7;
    const to={x:g.player.x+Math.sin(theta)*8,z:g.player.z+Math.cos(theta)*8};
    clampArena(to);s.teleport={t:0,from:{x:b.x,z:b.z},to};
    emit(g,'gyuwon-teleport-charge',{x:b.x,z:b.z,to});return;
   }
   if(b.phase===2){
    if(s.space==='white'&&s.proofQueue.length>=s.whiteQuota){
     s.space='dark';s.proofIndex=0;s.spaceTime=0;emit(g,'space');
    }else if(s.space==='dark'&&s.proofIndex>=s.proofQueue.length){
     s.space='white';s.proofQueue=[];s.proofIndex=0;s.whiteCycle++;
     s.whiteQuota=2+s.whiteCycle%2;s.spaceTime=0;emit(g,'space');
    }
    s.index++;
    if(s.space==='dark'){
     const proof=s.proofQueue[s.proofIndex++];
     if(proof){startGyuwonPattern(g,proof.id,{replay:proof});return;}
    }
    const id=drawPatternShuffle(s.patternDeck,'gyuwon-white-proof',
     gyuwonPool(2,'dark'),{avoid:s.pattern});
    startGyuwonPattern(g,id);return;
   }
   s.index++;
   const id=b.phase===3&&s.stageMemory&&s.memoryRun<s.memoryRunTarget
    ?s.stageMemory:chooseGyuwonPattern(g);
   startGyuwonPattern(g,id);
  }return;
 }
 s.t+=dt;const spec=GYUWON_PATTERNS[s.pattern];s.elevation=0;
 for(const h of s.hazards){h.age+=dt;
  // The remembered cleave slides the tsunami's corridor; collision and the mesh both read h.gap.
  if(h.gapTarget!==undefined&&h.age>=h.shiftAt){const gd=h.gapTarget-h.gap;h.gap+=Math.sign(gd)*Math.min(Math.abs(gd),h.shiftSpeed*dt);}
  if(!h.fired&&h.age>=h.warn){h.fired=true;if(!h.preview)emit(g,'gyuwon-impact',{pattern:s.pattern});}if(!h.preview&&h.damage>0&&h.age>=h.warn&&h.age<=h.warn+h.life&&!h.hit&&hazardContains(h,g.player))hurt(g,h);if(g.status!=='playing')return;}
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);
 if(s.t>=spec.duration){
  s.hazards.length=0;b.state='recovery';
  // Low-health memories shorten downtime only, never the actual telegraph or hit.
  const pressure=b.phase===3?memoryInterval(b.hp/b.maxHp):8;
  s.recover=spec.recover*(pressure<=1?.82:pressure<=2.5?.90:1);
  s.elevation=0;emit(g,'gyuwon-land');
 }
}
function tickPlayer(g,dt,input){
 const p=g.player,b=g.boss,w=WEAPONS[g.weapon];tickPlayerResources(g,dt);
 let shapes=null;const bodyShapes=()=>shapes??=gyuwonHurtShapes(g);
 tickPlayerAction(g,dt,w,{
  backstep:(a,h)=>{p.x-=Math.sin(a.yaw)*9*h;p.z-=Math.cos(a.yaw)*9*h;},
  melee:a=>{
   if(g.gyuwon.elevation>2)return;
   if(strikeGyuwonWard(g,p.x,p.z,w.damage*a.mult,a.yaw,
     playerMeleeReach(g,g.weapon==='hammer'?3.05:2.85))){a.hit=true;return;}
   const impact=kwonMeleeContact(bodyShapes(),p,{
    reach:playerMeleeReach(g,g.weapon==='hammer'?3.05:2.85),yaw:a.yaw,height:1.85,bladeRadius:.28});
   if(impact){a.hit=true;hit(g,w.damage*a.mult+(a.bankedBonus||0),a,impact);}
  }
 });
 if(g.status!=='playing')return;
 for(const q of g.projectiles){
  const prev=advancePlayerProjectile(q,dt,p);
  if(q.hit||q.bossHit||q.life<=0)continue;
  // Projectile vs. physical shrine effigy: swept 2D segment check.
  const vx=q.x-prev.x,vz=q.z-prev.z,range=vx*vx+vz*vz;
  const wards=g.gyuwon.years?.wards;
  const shrine=g.gyuwon.years?.cast==='ultimateShrine'&&wards?.some(w=>w.hp>0);
  if(shrine){
   let absorbed=false;
   for(const w of wards){
    if(w.hp<=0)continue;
    const t=range>1e-7?Math.max(0,Math.min(1,((w.x-prev.x)*vx+(w.z-prev.z)*vz)/range)):0;
    if(Math.hypot(prev.x+vx*t-w.x,prev.z+vz*t-w.z)<1.55){
     if(claimPlayerProjectileHit(q))strikeGyuwonWard(g,w.x,w.z,q.damage);
     absorbed=true;break;
    }
   }
   if(absorbed)continue;
  }
  const impact=kwonProjectileContact(bodyShapes(),prev,{x:q.x,y:q.y,z:q.z});
  if(impact&&claimPlayerProjectileHit(q))hit(g,q.damage,q.source,impact);
 }
 g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing')return;
 const a=p.action;if(a?.kind==='roll'){
  const speed=playerRollSpeed(g);p.x+=Math.sin(a.yaw)*speed*dt;p.z+=Math.cos(a.yaw)*speed*dt;
 }else if(!a){const x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z));
  const speed=playerWalkSpeed(p,(g.gyuwon.slow>0?.65:1)*(p.skill.blue>0?1.5:1));
  p.x+=x/n*speed*dt;p.z+=z/n*speed*dt;p.yaw=Math.atan2(b.x-p.x,b.z-p.z);
 }
 clampArena(p);
}
export function stepGyuwon(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);while(left>1e-9&&g.status==='playing'){
  const h=Math.min(1/120,left);g.time+=h;
  if(g.boss.state==='transition'){g.player.action=null;g.projectiles.length=0;tickBoss(g,h);}
  else if(g.gyuwon.years?.mode==='result'){
   g.player.action=null;g.projectiles.length=0;tickBoss(g,h);
  }
  else{tickBossHitTraits(g,h);if(g.status!=='playing')return;tickPlayer(g,h,input);if(g.status==='playing')tickBoss(g,h);}
  left-=h;
 }
}
