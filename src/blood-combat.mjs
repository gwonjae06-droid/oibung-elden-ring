import {createBloodPatternDeck,nextBloodPattern} from './blood-pattern-director.mjs';
import {SERAPH_CANONICAL_PATTERNS,spawnSeraphDoctrine} from './blood-seraph-doctrine.mjs';
import {BLOOD_EPIC_CUTS} from './blood-epic-script.mjs';
import {beginBloodWhip,stepBloodWhip} from './blood-whip.mjs';
import {bloodTsunamiFlanks,bloodTsunamiApproach} from './blood-tsunami.mjs';
import {bloodReadableWarning} from './attack-readability.mjs';
import {addBloodRiteAccent} from './blood-rite-escalation.mjs';
import {BOSS_TEMPO} from './boss-tempo.mjs';
import {createBloodWalk,createBloodManeuver,sampleBloodWalk,bloodFlightHeight,bloodFlightPosition} from './blood-footwork.mjs';
import {applyBossHitTrait,tickBossHitTraits} from './boss-hit-traits.mjs';
import {journeyWeaknessMultiplier} from './journey-balance.mjs';
import {BLOOD_RULES as R,BLOOD_PHASE_TWO_ENTRY_RATIO,BLOOD_PHASE_THREE_ENTRY_RATIO,
 BLOOD_FINAL_HYMN_RATIO,BLOOD_SERAPH_TRANSITION,BLOOD_SERAPH_REBIRTH_HEAL,BLOOD_PATTERNS,hazardContains,bloodHazardContactReady} from './blood-data.mjs';
import {createBloodSiphonState,tickBloodSiphon} from './blood-siphon.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createPlayerState,actPlayer,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {playerWalkSpeed,playerRollSpeed,playerRolling} from './player-movement-rules.mjs';
import {playerMeleeReach} from './weapon-abilities.mjs';
import {playerIncomingDamage} from './weapon-stats.mjs';
import {claimPlayerProjectileHit,playerProjectileHitsCircle} from './player-projectile-data.mjs';
import {kwonMeleeContact,kwonProjectileContact} from './kwon-hurtbox.mjs';
import {bloodHurtShapes} from './boss-hit-regions.mjs';

// Only the blood encounter uses floor-skimming ranged attacks. The other
// bosses retain their original projectile trajectories and aerial hit rules.
export const BLOOD_AIRBORNE_HEIGHT=.45;
export const BLOOD_PROJECTILE_GROUND_HEIGHT=.38;
export const BLOOD_REQUIRED_TSUNAMI_HP=3000;
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
 const game={bossId:'blood',weapon,time:0,status:'playing',nextId:1,events:[],projectiles:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState({x:0,z:14,weapon}),
  boss:{x:0,z:-5,hp:R.hp,maxHp:R.hp,phase:1,state:'recovery',yaw:0},
  blood:{requiredTsunamiStarted:false,requiredTsunamiDone:false,
    seraphArmed:false,seraphPending:false,seraphAwakened:false,
    seraphFinaleStarted:false,seraphFinaleDone:false,seraphHealDone:false,transitionKind:null,
    deck:createBloodPatternDeck(seed),walk:null,pattern:null,index:0,t:0,recover:1.2*BOSS_TEMPO.recovery,maneuver:0,hazards:[],elevation:0,slow:0,stun:0,transitioned:false,phasePending:false,cathedralShattered:false,seaCrashed:false,deathTime:0,siphon:createBloodSiphonState(),whip:null,whipCooldown:1.65,patternDuration:0}};
 Object.defineProperty(game,'applyBonusDamage',{enumerable:false,writable:true,configurable:true,
  value:(amount,poise=0,{dot=false}={})=>{
   const dealt=damageBlood(game,amount,null,{dot});
   if(dealt>0){game.stats.damage+=dealt;if(!dot)game.stats.hits++;}
   return dealt;
  }});
 return game;
}
export function actBlood(g,type,input={}){
 if(g.status!=='playing'||g.boss.state==='transition')return false;
 if(!g.player.action)g.player.yaw=type==='roll'&&(input.x||input.z)?Math.atan2(input.x||0,input.z||0):Math.atan2(g.boss.x-g.player.x,g.boss.z-g.player.z);
 return actPlayer(g,type);
}
export function damageBlood(g,amount,impact=null,{dot=false}={}){
 if(g.status!=='playing'||g.boss.state==='transition'||bloodBossAirborne(g)||!Number.isFinite(amount)||amount<=0)return 0;
 const b=g.boss,s=g.blood;
 // Hold at the threshold until the mandatory wave finishes, including DoT
 // and overkill hits. Do not heal a game whose HP was externally set lower.
 const floor=!s.requiredTsunamiDone?Math.min(b.hp,BLOOD_REQUIRED_TSUNAMI_HP):
  b.phase===2&&s.seraphArmed?Math.min(b.hp,b.maxHp*BLOOD_PHASE_THREE_ENTRY_RATIO):
  b.phase===1?1:0;
 const damage=Math.min(amount,Math.max(0,b.hp-floor));b.hp-=damage;
 if(damage&&!dot)emit(g,'boss-hit',{amount:damage,...(impact?{x:impact.x,y:impact.y,z:impact.z,part:impact.part}:{})});
 if(b.phase===1&&b.hp<=b.maxHp*BLOOD_PHASE_TWO_ENTRY_RATIO)s.phasePending=true;
 if(b.phase===2&&s.seraphArmed&&s.requiredTsunamiDone&&
   b.hp<=b.maxHp*BLOOD_PHASE_THREE_ENTRY_RATIO)s.seraphPending=true;
 if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;s.whip=null;s.slow=0;emit(g,'victory');}
 return damage;
}
function hit(g,amount,source,projectile=false,impact=null){
 const s=g.blood;if(bloodBossAirborne(g))return 0;
 const damage=damageBlood(g,amount*(g.boss.phase===2&&g.boss.state==='recovery'?journeyWeaknessMultiplier(g,'blood',1.6):1),impact);
 if(!damage)return 0;
 settlePlayerHit(g,damage,source,{canStun:g.boss.state!=='transition',stun:d=>{s.stun=Math.min(1.2,d);}});return damage;
}
function hazard(g,shape,opts={}){const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:1,life:.45,age:0,damage:24,hit:false,...opts};h.warn=bloodReadableWarning(h.warn*BOSS_TEMPO.windup);g.blood.hazards.push(h);return h;}
// Attackable ritual channels cancel only their own future hazards and heal share.
export function severHeartNode(g,amount,point){
 const s=g.blood;
 if(s.pattern!=='heartFeast'||g.boss.state!=='pattern'||!(amount>0))return false;
 const n=s.heartNodes?.find(node=>node.hp>0&&Math.hypot(node.x-point.x,node.z-point.z)<node.r);
 if(!n)return false;
 n.hp=Math.max(0,n.hp-amount);
 g.events.push({type:'blood-impact',pattern:'heartFeast',x:n.x,z:n.z});
 if(n.hp===0){
  for(const h of s.hazards)if(h.channel===n.id){h.hit=true;h.damage=0;}
  g.events.push({type:'blood-channel-severed',x:n.x,z:n.z,channel:n.id});
 }
 return true;
}
export function startBloodPattern(g,id){
 const spec=BLOOD_PATTERNS[id];if(!spec||spec.phase!==g.boss.phase||g.status!=='playing'||g.boss.state==='transition')return false;
 // A public/manual pattern request must not replace the mandatory wave.
 if(g.blood.requiredTsunamiStarted&&!g.blood.requiredTsunamiDone)return false;
 const b=g.boss,s=g.blood,p=g.player,aim=Math.atan2(p.x-b.x,p.z-b.z);s.walk=null;s.hazards.length=0;s.heartNodes=[];s.tsunami=null;s.tsunamiSoundPlayed=false; s.pattern=id;s.patternDuration=spec.duration;s.t=0;s.seraphWingReturn=null;b.state='pattern';b.yaw=aim;s.target={x:p.x,z:p.z};s.origin={x:b.x,z:b.z};
 const circle=(x,z,warn,r=3,extra={})=>hazard(g,'circle',{x,z,warn,r,...extra});
 const lane=(yaw,warn,extra={})=>hazard(g,'lane',{yaw,warn,width:6,length:10,life:2.3,vx:Math.sin(yaw)*18,vz:Math.cos(yaw)*18,...extra});
 const point=(x,z)=>{const d=Math.hypot(x,z),n=d>R.radius-5?(R.radius-5)/d:1;return {x:x*n,z:z*n};};
 if(id==='wave')lane(aim,1.2);
 if(id==='fountain')for(let i=0;i<5;i++){const q=point(p.x+Math.cos(aim)*(i-2)*6,p.z-Math.sin(aim)*(i-2)*6);circle(q.x,q.z,1.2+i*.45,4);}
 if(id==='burst')circle(b.x,b.z,1.6,14,{damage:38,life:.5});
 if(id==='orbs')for(let i=-2;i<=2;i++){const a=aim+i*.23;circle(b.x,b.z,1.2,1.8,{vx:Math.sin(a)*15,vz:Math.cos(a)*15,life:2.3,damage:22,yaw:a});}
 // The old 5m follow-up depended on an anomalous 18m/s player dodge.
  // Keep a full 10m/s shared dodge viable with a slightly tighter ring.
  if(id==='chain'){circle(p.x,p.z,1.1,3.8,{slow:.65,damage:12});circle(p.x,p.z,2.8,4.25,{damage:28});}
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
 // Two immense blood walls cross the entire arena, cut around the caster.
 // Four lane hazards share the same fixed safety corridor as their 3D crests.
 if(id==='requiem')for(const flank of bloodTsunamiFlanks({x:b.x,z:b.z,yaw:aim}))
  hazard(g,'lane',flank);
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
 // Reversing currents pull inward before a central eruption.
 if(id==='reverseFlow'){
  hazard(g,'ring',{x:p.x,z:p.z,r:17,width:2.3,grow:-6.4,warn:1.65,life:1.95,damage:22});
  circle(p.x,p.z,3.95,5.8,{damage:35,life:.6});
 }
 // Two distinct humanoid blood forms condense before their delayed sweeps.
 if(id==='bloodStatues')for(let i=0;i<2;i++){
  const theta=aim+(i?1:-1)*.8,q=point(p.x+Math.sin(theta)*7,p.z+Math.cos(theta)*7);
  circle(q.x,q.z,1.6+i*.82,3.7,{damage:26,life:.7});
  hazard(g,'lane',{x:q.x,z:q.z,yaw:theta+(i?-.6:.6),width:4.1,length:12,
   vx:Math.sin(theta)*8,vz:Math.cos(theta)*8,warn:2.7+i*.95,life:.7,damage:30});
 }
 if(id==='wingGenesis'){
  for(let i=0;i<3;i++)hazard(g,'cone',{x:b.x,z:b.z,yaw:aim+[0,.8,-.8][i],arc:.6,
    r:24,innerR:3,warn:2.0+i*1.12,life:.48,damage:31});
  hazard(g,'ring',{x:b.x,z:b.z,r:11,width:1.4,grow:13,warn:4.4,life:.72,damage:24});
 }
 // Three tangible channels can be destroyed before the heart's final beat.
 if(id==='heartFeast'){
  for(let i=0;i<3;i++){
   const theta=i*Math.PI*2/3+aim,q=point(b.x+Math.sin(theta)*9,b.z+Math.cos(theta)*9);
   const n={id:i,x:q.x,z:q.z,r:2.6,hp:32};s.heartNodes.push(n);
   circle(q.x,q.z,2.15+i*.76,3.8,{damage:28,life:.52,channel:i});
  }
  hazard(g,'ring',{x:b.x,z:b.z,r:18,width:2,grow:-4,warn:5.6,life:.6,damage:29});
 }
 if(id==='seraphWings')for(let i=0;i<3;i++)
  hazard(g,'cone',{x:b.x,z:b.z,yaw:aim+[.67,-.67,0][i],
   arc:.47,r:20,warn:1.15+i*.89,life:.48,damage:29+i*2});
 if(id==='seraphPulse')for(let i=0;i<3;i++)
  hazard(g,'ring',{x:b.x,z:b.z,r:3+i*1.9,width:1.18,grow:13.3,
   warn:1.24+i*.83,life:1.38,damage:25});
 if(id==='seraphLances')for(let i=0;i<5;i++){
  const a=aim+Math.PI/2,offset=(i-2)*3.45,
   q=point(p.x+Math.sin(a)*offset,p.z+Math.cos(a)*offset);
  circle(q.x,q.z,1.28+i*.52,3.0,{life:.55,damage:27});
 }
 if(id==='seraphCrown'){
  for(let i=0;i<3;i++)hazard(g,'cone',{x:b.x,z:b.z,
   yaw:aim+[-.84,0,.84][i],arc:.44,innerR:3,r:23,
   warn:1.34+i*.86,life:.5,damage:31});
  hazard(g,'ring',{x:b.x,z:b.z,r:6,width:1.35,grow:10,
   warn:4.05,life:1.06,damage:28});
 }
 // The eye fixes three independent beam directions at cast start; after
 // each visible charge, the corresponding 3D ray and the ground hitbox agree.
 if(id==='seraphGaze')for(let i=0;i<3;i++){
  const angle=aim+[0,.38,-.38][i],q=point(b.x+Math.sin(angle)*12,b.z+Math.cos(angle)*12);
  hazard(g,'lane',{x:q.x,z:q.z,yaw:angle,width:1.7,length:24,
   warn:1.62+i*1.09,life:.52,damage:36});
 }
 // Many separate falling feathers: read each delayed landing, then dodge.
 if(id==='seraphFeathers')for(let i=0;i<12;i++){
  const angle=i*2.399963+aim,radius=2.3*Math.sqrt(i+1),
   q=point(p.x+Math.sin(angle)*radius,p.z+Math.cos(angle)*radius);
  circle(q.x,q.z,1.05+i*.31,2.4+(i%3)*.36,{life:.52,damage:26});
 }
 // Closing feather walls leave the middle open initially, then the wing
 // tips converge on the boss. No full-arena instant kill.
 if(id==='seraphEmbrace'){
  for(let i=0;i<3;i++)hazard(g,'ring',{x:b.x,z:b.z,
   r:22-i*4.2,width:1.6,grow:-7.8,warn:1.52+i*1.04,life:1.42,damage:28});
  circle(b.x,b.z,4.7,4.8,{life:.56,damage:33});
 }
 // A real grounded impact ON the seraph, then a radial wake.
 if(id==='seraphDescent'){
  circle(b.x,b.z,1.9,8,{life:.57,damage:37});
  hazard(g,'ring',{x:b.x,z:b.z,r:4,width:1.15,grow:12,
   warn:3.14,life:1.2,damage:28});
  circle(b.x,b.z,4.34,3.9,{life:.48,damage:31});
 }
 if(id==='seraphFinale'){
  for(let i=0;i<4;i++)hazard(g,'cone',{x:b.x,z:b.z,
   yaw:aim+[-.95,.95,-.38,.38][i],arc:.34,innerR:3.5,r:24,
   warn:1.48+i*.85,life:.48,damage:34});
  for(let i=0;i<2;i++)hazard(g,'ring',{x:b.x,z:b.z,r:5+i*1.8,width:1.32,grow:14,
   warn:5.15+i*.94,life:1.2,damage:34});
 }
 // Every seraph attack shares its geometry and warning clock with the renderer.
 if(SERAPH_CANONICAL_PATTERNS.includes(id))spawnSeraphDoctrine(g,id,(shape,opts)=>hazard(g,shape,opts));
 if(id==='seraphWingCross'){
  const last=s.hazards.filter(h=>h.seraphCue==='wing-pass').at(-1);
  if(last)s.seraphWingReturn={x:last.x+last.vx*last.life,
   z:last.z,start:last.warn+last.life,duration:.85};
 }
 // Bind the encounter state before passing the two-argument hazard spawner.
 addBloodRiteAccent(g,id,(shape,opts)=>hazard(g,shape,opts));
 // The camera completes its reveal and returns well before the first actual
 // collision. This adjusts the authoritative attack clock, not just visuals.
 const lead=BLOOD_EPIC_CUTS[id]?.lead||0;
 if(lead)for(const h of s.hazards)h.warn+=lead;
 if(id==='requiem')s.tsunami={yaw:aim,origin:{x:b.x,z:b.z},
  rows:[0,1].map(row=>{
   const h=s.hazards.find(x=>x.tsunami&&x.row===row);
   return {warn:h.warn,life:h.life};
  })};
 s.strikeAt=Math.min(...s.hazards.map(h=>h.warn));
 emit(g,'blood-warning',{pattern:id});return true;
}
function beginPhase(g){const s=g.blood;g.boss.phase=2;g.boss.state='transition';s.transitioned=true;s.phasePending=false;s.seraphArmed=true;s.transitionKind='angel';s.siphon=createBloodSiphonState();s.t=0;s.index=0;s.walk=null;s.hazards.length=0;s.whip=null;s.whipCooldown=1.65;g.projectiles.length=0;g.player.action=null;s.slow=0;s.stun=0;emit(g,'phase');}
function beginSeraph(g){
 const s=g.blood,b=g.boss;
 b.phase=3;b.state='transition';s.transitionKind='seraph';s.seraphPending=false;
 s.seraphArmed=false;s.seraphAwakened=false;s.seraphHealDone=false;s.t=0;s.pattern=null;
 s.walk=null;s.hazards.length=0;s.heartNodes=[];s.whip=null;
 s.whipCooldown=Infinity;s.stun=0;s.slow=0;s.elevation=0;
 if(s.siphon)s.siphon.active=false;
 g.projectiles.length=0;g.player.action=null;
 emit(g,'phase',{phase:3});emit(g,'blood-seraph-awakening',{duration:BLOOD_SERAPH_TRANSITION});
}
export function skipBloodTransition(g){if(g.boss.state!=='transition')return false;g.blood.t=g.boss.phase===3?BLOOD_SERAPH_TRANSITION:R.transition;return true;}
function hurt(g,h){
 const p=g.player,rolling=playerRolling(p);
 if(p.invuln>0||rolling){if(!h.dodged){g.stats.dodges++;h.dodged=true;}
  // Once dodged, a travelling ring cannot re-hit on its lingering tail.
  if(h.shape==='ring')h.hit=true;
  return;}
 h.hit=true;const amount=Math.min(p.hp,playerIncomingDamage(g,h.damage));
 const before=p.hp;p.hp=Math.max(0,p.hp-amount);applyBossHitTrait(g,before-p.hp,{boss:'blood'});p.invuln=.65;if(h.slow)g.blood.slow=h.slow;emit(g,'hurt',{amount});
 if(p.hp<=0){g.status='lost';g.blood.hazards.length=0;g.projectiles.length=0;emit(g,'death');}
}
function beginRecovery(g,duration){const s=g.blood;g.boss.state='recovery';s.recover=duration;s.elevation=0;s.walk=createBloodWalk(g.boss,g.player,duration);}
function tickBoss(g,dt){
 const b=g.boss,s=g.blood;s.slow=Math.max(0,s.slow-dt);
 if(b.state==='transition'){s.t+=dt;
  if(s.transitionKind==='seraph'){
   if(s.t>=2.65&&!s.seraphHealDone){
    s.seraphHealDone=true;
    const amount=Math.max(0,Math.min(BLOOD_SERAPH_REBIRTH_HEAL,b.maxHp-b.hp));
    if(amount>0){b.hp+=amount;emit(g,'blood-seraph-heal',{amount,x:b.x,z:b.z,y:6.7});}
   }
   const progress=Math.min(1,s.t/BLOOD_SERAPH_TRANSITION);
   s.elevation=Math.max(0,Math.sin(progress*Math.PI))*2;
   if(s.t>=BLOOD_SERAPH_TRANSITION){
    s.seraphAwakened=true;s.elevation=0;s.t=0;
    beginRecovery(g,1.85);emit(g,'blood-seraph-reveal');
   }
   return;
  }
  if(s.t>=2.65&&!s.cathedralShattered){s.cathedralShattered=true;emit(g,'blood-cathedral-shatter');}
  if(s.t>=3.85&&!s.seaCrashed){s.seaCrashed=true;emit(g,'blood-sea-crash');}
  s.elevation=Math.min(4,Math.max(0,s.t-2)*2)*Math.max(0,Math.min(1,(R.transition-s.t)/.55));if(s.t>=R.transition){beginRecovery(g,Math.max(2.2,2.8*BOSS_TEMPO.recovery));s.t=0;emit(g,'blood-land');}return;}
 // Interrupt the previous attack cleanly, but retain the existing phase
 // transition, full requiem warning/camera, wave hazards and approach sound.
 if(b.phase===2&&b.hp<=BLOOD_REQUIRED_TSUNAMI_HP&&!s.requiredTsunamiStarted){
  s.whip=null;s.whipCooldown=1.65;s.elevation=0;s.stun=0;
  if(startBloodPattern(g,'requiem'))s.requiredTsunamiStarted=true;
  return;
 }
 if(b.phase===2&&s.seraphPending&&b.state!=='pattern'){beginSeraph(g);return;}
 if(b.phase===3&&b.state!=='pattern'&&!s.seraphFinaleStarted&&
  b.hp<=b.maxHp*BLOOD_FINAL_HYMN_RATIO){
  if(startBloodPattern(g,'seraphFinale')){s.seraphFinaleStarted=true;return;}
 }
 if(s.stun>0){s.stun=Math.max(0,s.stun-dt);s.whip=null;return;}
 // A telegraphed, fixed-angle counter to distant ranged camping.
 // It cannot overlap the 2P camera-only spectacles or a real wide-area hit.
 if(b.phase!==3){stepBloodWhip(g,dt,h=>hurt(g,h));if(g.status!=='playing')return;beginBloodWhip(g);}
 if(b.state==='recovery'){
  s.elevation=Math.max(0,s.elevation-dt*10);
  if(s.phasePending){beginPhase(g);return;}
  // Brace during the windup without changing the visible hit timing.
  if(s.whip){s.recover-=dt;return;}
  if(!s.walk)s.walk=createBloodWalk(b,g.player,s.recover);
  s.walk.t+=dt;const step=sampleBloodWalk(s.walk);b.x=step.x;b.z=step.z;b.yaw=s.whip?.yaw??step.yaw;
  s.recover-=dt;
  if(s.recover<=0){
   // Keep every frame of the existing stationary punish window first.
   // A separate non-attacking stance now makes the boss visibly reposition.
   b.state='maneuver';s.maneuver=b.phase===3?.78:Math.max(.98,(b.phase===2?1.14:1.24)*BOSS_TEMPO.gap);
   s.walk=createBloodManeuver(b,g.player,s.maneuver,s.index,b.phase);
  }
  return;
 }
 if(b.state==='maneuver'){
  if(s.phasePending){beginPhase(g);return;}
  s.walk.t+=dt;
  const pose=sampleBloodWalk(s.walk);
  b.x=pose.x;b.z=pose.z;b.yaw=pose.yaw;
  s.maneuver-=dt;
  if(s.maneuver<=0){
   s.index++;
   const distance=Math.hypot(b.x-g.player.x,b.z-g.player.z);
   startBloodPattern(g,nextBloodPattern(s.deck,b.phase,
     g.journeyBalance?.mode==='story'?{distance}:{}));
  }
  return;
 }
 s.t+=dt;const spec=BLOOD_PATTERNS[s.pattern];
 // Sound is keyed to the authoritative wave's distance, not to the camera
 // (which may cut away), and fires once before the first actual sweep.
 if(s.pattern==='requiem'&&!s.tsunamiSoundPlayed&&
  bloodTsunamiApproach(g).intensity>.16){
  s.tsunamiSoundPlayed=true;emit(g,'blood-tsunami-approach',{pattern:'requiem'});
 }
 s.elevation=spec.air?bloodFlightHeight(s.pattern,s.t,spec.duration,s.strikeAt):0;
 if(spec.air){const pos=bloodFlightPosition(s.pattern,s.t,s.origin,s.target,s.strikeAt);b.x=pos.x;b.z=pos.z;}
 for(const h of s.hazards){h.age+=dt;if(!h.fired&&h.age>=h.warn){h.fired=true;emit(g,'blood-impact',{pattern:s.pattern});}if(bloodHazardContactReady(h)&&h.age<=h.warn+h.life&&!h.hit&&hazardContains(h,g.player))hurt(g,h);if(g.status!=='playing')return;}
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);
 if(s.t>=spec.duration){
  if(s.pattern==='requiem'&&s.requiredTsunamiStarted&&!s.requiredTsunamiDone)s.requiredTsunamiDone=true;
  if(s.pattern==='seraphFinale'){s.seraphFinaleDone=true;emit(g,'blood-seraph-final-note');}
  if(s.pattern==='heartFeast'&&!s.seraphPending){
   const alive=s.heartNodes.filter(n=>n.hp>0).length;
   const heal=Math.max(0,Math.min(b.maxHp*.025*alive/3,b.maxHp*BLOOD_PHASE_TWO_ENTRY_RATIO-b.hp));
   if(heal>0){b.hp+=heal;emit(g,'blood-siphon-heal',{amount:heal,x:b.x,z:b.z,y:4.7});}
   s.heartNodes=[];
  }
  s.hazards.length=0;beginRecovery(g,spec.recover);emit(g,'blood-land');}
}
function tickPlayer(g,dt,input){
 const p=g.player,b=g.boss,w=WEAPONS[g.weapon];tickPlayerResources(g,dt);
 tickPlayerAction(g,dt,w,{backstep:(a,h)=>{p.x-=Math.sin(a.yaw)*9*h;p.z-=Math.cos(a.yaw)*9*h;},melee:a=>{
   if(bloodBossAirborne(g))return;
   const reach=playerMeleeReach(g,g.weapon==='hammer'?3.05:2.85);
   const n=g.blood.heartNodes?.find(q=>q.hp>0&&Math.hypot(q.x-p.x,q.z-p.z)<reach+q.r&&
     Math.abs(Math.atan2(Math.sin(Math.atan2(q.x-p.x,q.z-p.z)-a.yaw),Math.cos(Math.atan2(q.x-p.x,q.z-p.z)-a.yaw)))<.6);
   if(n&&severHeartNode(g,w.damage*a.mult,{x:n.x,z:n.z})){a.hit=true;return;}
   const impact=kwonMeleeContact(bloodHurtShapes(g),p,{reach,yaw:a.yaw,height:1.85,bladeRadius:.28});
   if(impact){a.hit=true;hit(g,w.damage*a.mult+(a.bankedBonus||0),a,false,impact);}
  }});
 if(g.status!=='playing')return;
 for(const q of g.projectiles){
  // Blood shots skim the cathedral floor rather than pitching up to a flying
  // target. Keep simulation height identical to the actual rendered mesh.
  if(!q.returningHammer)q.y=bloodProjectileGroundHeight(q);
  const prev=advancePlayerProjectile(q,dt,p);
  if(q.hit||q.bossHit||q.life<=0)continue;
  // An airborne boss does not intercept, consume, reward or take damage from
  // a floor-level shot. It simply passes underneath until he lands.
  const node=g.blood.heartNodes?.find(n=>n.hp>0&&playerProjectileHitsCircle(prev,q,n,n.r));
  if(node&&claimPlayerProjectileHit(q)){severHeartNode(g,q.damage,{x:node.x,z:node.z});continue;}
  const prevY=Number.isFinite(prev.y)?prev.y:q.y;
  const impact=!bloodBossAirborne(g)?kwonProjectileContact(bloodHurtShapes(g),
   {x:prev.x,y:prevY,z:prev.z},{x:q.x,y:q.y,z:q.z}):null;
  if(impact&&claimPlayerProjectileHit(q))hit(g,q.damage,q.source,true,impact);
 }
 g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing')return;
 const a=p.action;if(a?.kind==='roll'){p.x+=Math.sin(a.yaw)*playerRollSpeed(g)*dt;p.z+=Math.cos(a.yaw)*playerRollSpeed(g)*dt;}
 else if(!a){const x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z)),speed=playerWalkSpeed(p,g.blood.slow>0?.65:1);p.x+=x/n*speed*dt;p.z+=z/n*speed*dt;p.yaw=Math.atan2(b.x-p.x,b.z-p.z);}
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
