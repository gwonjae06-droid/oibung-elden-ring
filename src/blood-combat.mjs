import {createBloodPatternDeck,nextBloodPattern} from './blood-pattern-director.mjs';
import {createBloodWalk,sampleBloodWalk,bloodFlightHeight,bloodFlightPosition} from './blood-footwork.mjs';
import {applyBossHitTrait,tickBossHitTraits} from './boss-hit-traits.mjs';
import {journeyWeaknessMultiplier} from './journey-balance.mjs';
import {BLOOD_RULES as R,BLOOD_PATTERNS,hazardContains} from './blood-data.mjs';
import {createBloodSiphonState,tickBloodSiphon} from './blood-siphon.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createPlayerState,actPlayer,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {claimPlayerProjectileHit} from './player-projectile-data.mjs';
import {kwonMeleeContact,kwonProjectileContact} from './kwon-hurtbox.mjs';
import {bloodHurtShapes} from './boss-hit-regions.mjs';

// Only the blood encounter uses floor-skimming ranged attacks. The other
// bosses retain their original projectile trajectories and aerial hit rules.
export const BLOOD_AIRBORNE_HEIGHT=.45;
export const BLOOD_PROJECTILE_GROUND_HEIGHT=.38;
export function bloodBossAirborne(g){
 return (g?.blood?.elevation||0)>BLOOD_AIRBORNE_HEIGHT;
}
export function bloodProjectileGroundHeight(projectile){
 return projectile?.kind==='wave' ? .25 : BLOOD_PROJECTILE_GROUND_HEIGHT;
}
const emit=(g,type,data={})=>g.events.push({type,...data});
const clampArena=p=>{const d=Math.hypot(p.x,p.z);if(d>R.radius-1){p.x*= (R.radius-1)/d;p.z*= (R.radius-1)/d;}};
export function createBloodGame(weapon='sword',{seed}={}){
 if(!Object.hasOwn(WEAPONS,weapon))throw Error('Unknown weapon');
 return {bossId:'blood',weapon,time:0,status:'playing',nextId:1,events:[],projectiles:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState({x:0,z:14}),
  boss:{x:0,z:-5,hp:R.hp,maxHp:R.hp,phase:1,state:'recovery',yaw:0},
  blood:{deck:createBloodPatternDeck(seed),walk:null,pattern:null,index:0,t:0,recover:1.2,hazards:[],elevation:0,slow:0,stun:0,transitioned:false,phasePending:false,deathTime:0,siphon:createBloodSiphonState()}};
}
export function actBlood(g,type,input={}){
 if(g.status!=='playing'||g.boss.state==='transition')return false;
 if(!g.player.action)g.player.yaw=type==='roll'&&(input.x||input.z)?Math.atan2(input.x||0,input.z||0):Math.atan2(g.boss.x-g.player.x,g.boss.z-g.player.z);
 return actPlayer(g,type);
}
export function damageBlood(g,amount,impact=null){
 if(g.status!=='playing'||g.boss.state==='transition'||bloodBossAirborne(g)||!Number.isFinite(amount)||amount<=0)return 0;
 const b=g.boss,s=g.blood,damage=Math.min(amount,b.phase===1?Math.max(0,b.hp-1):b.hp);b.hp-=damage;
 if(damage)emit(g,'boss-hit',{amount:damage,...(impact?{x:impact.x,y:impact.y,z:impact.z,part:impact.part}:{})});
 if(b.phase===1&&b.hp<=b.maxHp*.5)s.phasePending=true;
 if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;s.slow=0;emit(g,'victory');}
 return damage;
}
function hit(g,amount,source,projectile=false,impact=null){
 const s=g.blood;if(bloodBossAirborne(g))return 0;
 const damage=damageBlood(g,amount*(g.boss.phase===2&&g.boss.state==='recovery'?journeyWeaknessMultiplier(g,'blood',1.6):1),impact);
 if(!damage)return 0;
 settlePlayerHit(g,damage,source,{canStun:g.boss.state!=='transition',stun:d=>{s.stun=Math.min(1.2,d);}});return damage;
}
function hazard(g,shape,opts={}){const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:1,life:.45,age:0,damage:24,hit:false,...opts};g.blood.hazards.push(h);return h;}
export function startBloodPattern(g,id){
 const spec=BLOOD_PATTERNS[id];if(!spec||spec.phase!==g.boss.phase||g.status!=='playing'||g.boss.state==='transition')return false;
 const b=g.boss,s=g.blood,p=g.player,aim=Math.atan2(p.x-b.x,p.z-b.z);s.walk=null;s.hazards.length=0;s.pattern=id;s.t=0;b.state='pattern';b.yaw=aim;s.target={x:p.x,z:p.z};s.origin={x:b.x,z:b.z};
 const circle=(x,z,warn,r=3,extra={})=>hazard(g,'circle',{x,z,warn,r,...extra});
 const lane=(yaw,warn,extra={})=>hazard(g,'lane',{yaw,warn,width:6,length:10,life:2.3,vx:Math.sin(yaw)*18,vz:Math.cos(yaw)*18,...extra});
 const point=(x,z)=>{const d=Math.hypot(x,z),n=d>23?23/d:1;return {x:x*n,z:z*n};};
 if(id==='wave')lane(aim,1.2);
 if(id==='fountain')for(let i=0;i<5;i++){const q=point(p.x+Math.cos(aim)*(i-2)*6,p.z-Math.sin(aim)*(i-2)*6);circle(q.x,q.z,1.2+i*.45,4);}
 if(id==='burst')circle(b.x,b.z,1.6,14,{damage:38,life:.5});
 if(id==='orbs')for(let i=-2;i<=2;i++){const a=aim+i*.23;circle(b.x,b.z,1.2,1.8,{vx:Math.sin(a)*15,vz:Math.cos(a)*15,life:2.3,damage:22,yaw:a});}
 if(id==='chain'){circle(p.x,p.z,1.1,3.8,{slow:.65,damage:12});circle(p.x,p.z,2.8,5,{damage:28});}
 if(id==='orbit')hazard(g,'ring',{r:3,width:1.4,grow:10,warn:1.2,life:2.1,damage:26});
 if(id==='vortex')circle(p.x,p.z,1.6,7.5,{life:1.6,damage:30});
 if(id==='lances')for(let i=0;i<5;i++){const q=point(p.x+Math.cos(aim)*(i-2)*6.5,p.z-Math.sin(aim)*(i-2)*6.5);circle(q.x,q.z,1.4+i*.5,4.5,{damage:27,life:.65});}
 if(id==='cross')for(let i=0;i<4;i++){const yaw=i*Math.PI/2;lane(yaw,1.5+(i%2)*1.3,{x:-Math.sin(yaw)*25,z:-Math.cos(yaw)*25,width:4.5,length:12,life:1.9,vx:Math.sin(yaw)*23,vz:Math.cos(yaw)*23,damage:29});}
 // Two real sweeping blood blades, drawn backward before the hands
 // intersect. Their two warning times drive distinct arm follow-throughs.
 if(id==='bloodScissors')for(let i=0;i<2;i++){
  const yaw=aim+(i?-.52:.52);
  lane(yaw,1.3+i*1.05,{width:4.4,length:21,life:.72,damage:30,
    vx:Math.sin(yaw)*22,vz:Math.cos(yaw)*22});
 }
 // Nails grow around the captured player position. A delayed central
 // heart-beat stops camping the middle, but leaves a dodgeable exit.
 if(id==='heartCage'){
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2+.3,q=point(p.x+Math.sin(angle)*6.4,p.z+Math.cos(angle)*6.4);
   circle(q.x,q.z,1.25+i*.38,3.3,{life:.6,damage:25});
  }
  circle(p.x,p.z,3.0,4.5,{life:.55,damage:32});
 }
 if(id==='dive')circle(p.x,p.z,1.8,7.5,{damage:38,life:.65});
 if(id==='eclipse')hazard(g,'ring',{x:0,z:0,r:18,width:10,warn:2.8,life:.8,damage:42});
 if(id==='rain')for(let i=0;i<10;i++){const a=i*2.4,q=point(p.x+Math.sin(a)*i*1.7,p.z+Math.cos(a)*i*1.7);circle(q.x,q.z,1+i*.35,3.7,{damage:20,life:.4});}
 if(id==='wing')hazard(g,'cone',{yaw:aim,arc:1.15,r:19,warn:1.4,life:.5,damage:34});
 if(id==='pulse')for(let i=0;i<3;i++)hazard(g,'ring',{r:2,width:1.1,grow:18,warn:1.1+i*.75,life:1.7,damage:22});
 if(id==='pursuit'){lane(aim,1.4,{width:5,length:14,life:.75,damage:32,vx:Math.sin(aim)*28,vz:Math.cos(aim)*28});circle(p.x,p.z,3,6.5,{damage:28});}
 if(id==='tide')for(let i=0;i<4;i++)lane(i*Math.PI/2,1.4+i*.7,{x:0,z:0,length:13,width:5,life:1.3,damage:32});
 if(id==='judgement')for(let i=0;i<3;i++)hazard(g,'cone',{yaw:aim+[-.8,.8,0][i],arc:.5,r:23,warn:1.5+i*1.2,life:.55,damage:32});
 if(id==='ritual'){for(let beat=0;beat<2;beat++)for(let i=0;i<4;i++)hazard(g,'cone',{x:0,z:0,yaw:i*Math.PI/2+beat*Math.PI/4,arc:.45,innerR:5.5,r:26,warn:2+beat*1.65,life:.65,damage:30});hazard(g,'ring',{x:0,z:0,r:2,width:1.1,grow:18,warn:4.9,life:1.4,damage:26});}
 // Three wing scythes are visible in the existing animated wing rig;
 // each has a distinct anticipation rather than dealing damage mid-twist.
 if(id==='wingShear')for(let i=0;i<3;i++)
  hazard(g,'cone',{yaw:aim+[0,.8,-.8][i],arc:.48,r:21,
    warn:1.15+i*1.0,life:.48,damage:31});
 // A processional chain of red beads advances in a readable spiral.
 // The last bead returns to the locked position, rewarding movement.
 if(id==='rosary'){
  for(let i=0;i<6;i++){
   const angle=i*Math.PI*.75,radius=2.4+(i%3)*3.4;
   const q=point(p.x+Math.sin(angle)*radius,p.z+Math.cos(angle)*radius);
   circle(q.x,q.z,1.15+i*.5,3.5,{life:.54,damage:26});
  }
  circle(p.x,p.z,4.25,4.5,{life:.58,damage:32});
 }
 s.strikeAt=Math.min(...s.hazards.map(h=>h.warn));
 emit(g,'blood-warning',{pattern:id});return true;
}
function beginPhase(g){const s=g.blood;g.boss.phase=2;g.boss.state='transition';s.transitioned=true;s.phasePending=false;s.siphon=createBloodSiphonState();s.t=0;s.index=0;s.walk=null;s.hazards.length=0;g.projectiles.length=0;g.player.action=null;s.slow=0;s.stun=0;emit(g,'phase');}
export function skipBloodTransition(g){if(g.boss.state!=='transition')return false;g.blood.t=R.transition;return true;}
function hurt(g,h){
 const p=g.player,a=p.action,rolling=a?.kind==='roll'&&a.t>=.08&&a.t<=.4;
 if(p.invuln>0||rolling){if(!h.dodged){g.stats.dodges++;h.dodged=true;}return;}
 h.hit=true;const before=p.hp;p.hp=Math.max(0,p.hp-h.damage);applyBossHitTrait(g,before-p.hp,{boss:'blood'});p.invuln=.65;if(h.slow)g.blood.slow=h.slow;emit(g,'hurt',{amount:h.damage});
 if(p.hp<=0){g.status='lost';g.blood.hazards.length=0;g.projectiles.length=0;emit(g,'death');}
}
function beginRecovery(g,duration){const s=g.blood;g.boss.state='recovery';s.recover=duration;s.elevation=0;s.walk=createBloodWalk(g.boss,g.player,duration);}
function tickBoss(g,dt){
 const b=g.boss,s=g.blood;s.slow=Math.max(0,s.slow-dt);
 if(b.state==='transition'){s.t+=dt;s.elevation=Math.min(4,Math.max(0,s.t-2)*2)*Math.max(0,Math.min(1,(R.transition-s.t)/.55));if(s.t>=R.transition){beginRecovery(g,2.8);s.t=0;emit(g,'blood-land');}return;}
 if(s.stun>0){s.stun=Math.max(0,s.stun-dt);return;}
 if(b.state==='recovery'){
  s.elevation=Math.max(0,s.elevation-dt*10);
  if(s.phasePending){beginPhase(g);return;}
  if(!s.walk)s.walk=createBloodWalk(b,g.player,s.recover);
  s.walk.t+=dt;const step=sampleBloodWalk(s.walk);b.x=step.x;b.z=step.z;b.yaw=step.yaw;
  s.recover-=dt;if(s.recover<=0){
    s.index++;
    const distance=Math.hypot(b.x-g.player.x,b.z-g.player.z);
    startBloodPattern(g,nextBloodPattern(s.deck,b.phase,
      g.journeyBalance?.mode==='story'?{distance}:{}));
   }return;
 }
 s.t+=dt;const spec=BLOOD_PATTERNS[s.pattern];
 s.elevation=spec.air?bloodFlightHeight(s.pattern,s.t,spec.duration,s.strikeAt):0;
 if(spec.air){const pos=bloodFlightPosition(s.pattern,s.t,s.origin,s.target,s.strikeAt);b.x=pos.x;b.z=pos.z;}
 for(const h of s.hazards){h.age+=dt;if(!h.fired&&h.age>=h.warn){h.fired=true;emit(g,'blood-impact',{pattern:s.pattern});}if(h.age>=h.warn&&h.age<=h.warn+h.life&&!h.hit&&hazardContains(h,g.player))hurt(g,h);if(g.status!=='playing')return;}
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);
 if(s.t>=spec.duration){s.hazards.length=0;beginRecovery(g,spec.recover);emit(g,'blood-land');}
}
function tickPlayer(g,dt,input){
 const p=g.player,b=g.boss,w=WEAPONS[g.weapon];tickPlayerResources(g,dt);
 tickPlayerAction(g,dt,w,{melee:a=>{
   if(bloodBossAirborne(g))return;
   const reach=g.weapon==='hammer'?3.05:2.85;
   const impact=kwonMeleeContact(bloodHurtShapes(g),p,{reach,yaw:a.yaw,height:1.85,bladeRadius:.28});
   if(impact){a.hit=true;hit(g,w.damage*a.mult,a,false,impact);}
  }});
 if(g.status!=='playing')return;
 for(const q of g.projectiles){
  // Blood shots skim the cathedral floor rather than pitching up to a flying
  // target. Keep simulation height identical to the actual rendered mesh.
  q.y=bloodProjectileGroundHeight(q);
  const prev=advancePlayerProjectile(q,dt);
  if(q.hit||q.bossHit||q.life<=0)continue;
  // An airborne boss does not intercept, consume, reward or take damage from
  // a floor-level shot. It simply passes underneath until he lands.
  const prevY=Number.isFinite(prev.y)?prev.y:q.y;
  const impact=!bloodBossAirborne(g)?kwonProjectileContact(bloodHurtShapes(g),
   {x:prev.x,y:prevY,z:prev.z},{x:q.x,y:q.y,z:q.z}):null;
  if(impact&&claimPlayerProjectileHit(q))hit(g,q.damage,q.source,true,impact);
 }
 g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing')return;
 const a=p.action;if(a?.kind==='roll'){p.x+=Math.sin(a.yaw)*18*dt;p.z+=Math.cos(a.yaw)*18*dt;}
 else if(!a){const x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z)),speed=8*(g.blood.slow>0?.65:1)*(p.skill.blue>0?1.5:1);p.x+=x/n*speed*dt;p.z+=z/n*speed*dt;p.yaw=Math.atan2(b.x-p.x,b.z-p.z);}
 clampArena(p);
}
export function stepBlood(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);while(left>1e-9&&g.status==='playing'){
  const h=Math.min(1/120,left);g.time+=h;
  if(g.boss.state==='transition'){g.player.action=null;g.projectiles.length=0;tickBoss(g,h);}
  else{tickBossHitTraits(g,h);if(g.status!=='playing')return;tickPlayer(g,h,input);if(g.status==='playing')tickBoss(g,h);}
  if(g.status==='playing')tickBloodSiphon(g,h);
  left-=h;
 }
}
