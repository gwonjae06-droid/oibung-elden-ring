import {applyBossHitTrait,tickBossHitTraits} from './boss-hit-traits.mjs';
import {BLOOD_RULES as R,BLOOD_PATTERNS,bloodPool,hazardContains} from './blood-data.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createPlayerState,actPlayer,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';

const emit=(g,type,data={})=>g.events.push({type,...data});
const clampArena=p=>{const d=Math.hypot(p.x,p.z);if(d>R.radius-1){p.x*= (R.radius-1)/d;p.z*= (R.radius-1)/d;}};
export function createBloodGame(weapon='sword'){
 if(!Object.hasOwn(WEAPONS,weapon))throw Error('Unknown weapon');
 return {bossId:'blood',weapon,time:0,status:'playing',nextId:1,events:[],projectiles:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState({x:0,z:14}),
  boss:{x:0,z:-5,hp:R.hp,maxHp:R.hp,phase:1,state:'recovery',yaw:0},
  blood:{pattern:null,index:0,t:0,recover:1.2,hazards:[],elevation:0,slow:0,stun:0,transitioned:false,phasePending:false,deathTime:0}};
}
export function actBlood(g,type,input={}){
 if(g.status!=='playing'||g.boss.state==='transition')return false;
 if(!g.player.action)g.player.yaw=type==='roll'&&(input.x||input.z)?Math.atan2(input.x||0,input.z||0):Math.atan2(g.boss.x-g.player.x,g.boss.z-g.player.z);
 return actPlayer(g,type);
}
export function damageBlood(g,amount){
 if(g.status!=='playing'||g.boss.state==='transition'||!Number.isFinite(amount)||amount<=0)return 0;
 const b=g.boss,s=g.blood,damage=Math.min(amount,b.phase===1?Math.max(0,b.hp-1):b.hp);b.hp-=damage;
 if(damage)emit(g,'boss-hit',{amount:damage});
 if(b.phase===1&&b.hp<=b.maxHp*.5)s.phasePending=true;
 if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;s.slow=0;emit(g,'victory');}
 return damage;
}
function hit(g,amount,source){
 const s=g.blood;if(s.elevation>2&&!WEAPONS[g.weapon].projectile)return;
 const damage=damageBlood(g,amount*(g.boss.phase===2?(g.boss.state==='recovery'?1.6:s.elevation>2?.65:1):1));
 if(!damage)return;
 settlePlayerHit(g,damage,source,{canStun:g.boss.state!=='transition',stun:d=>{s.stun=Math.min(1.2,d);}});
}
function hazard(g,shape,opts={}){const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:1,life:.35,age:0,damage:24,hit:false,...opts};g.blood.hazards.push(h);return h;}
export function startBloodPattern(g,id){
 const spec=BLOOD_PATTERNS[id];if(!spec||spec.phase!==g.boss.phase||g.status!=='playing'||g.boss.state==='transition')return false;
 const b=g.boss,s=g.blood,p=g.player,aim=Math.atan2(p.x-b.x,p.z-b.z);s.hazards.length=0;s.pattern=id;s.t=0;b.state='pattern';b.yaw=aim;s.target={x:p.x,z:p.z};s.origin={x:b.x,z:b.z};
 const circle=(x,z,warn,r=3,extra={})=>hazard(g,'circle',{x,z,warn,r,...extra});
 const lane=(yaw,warn,extra={})=>hazard(g,'lane',{yaw,warn,width:2.6,length:6,life:2.1,vx:Math.sin(yaw)*18,vz:Math.cos(yaw)*18,...extra});
 if(id==='wave')lane(aim,1);
 if(id==='fountain')for(let i=0;i<3;i++)circle(p.x+(i-1)*4,p.z,1+i*.55,2.7);
 if(id==='burst')circle(b.x,b.z,1.35,9,{damage:38});
 if(id==='orbs')for(let i=-1;i<=1;i++){const a=aim+i*.18;circle(b.x,b.z,1,1.15,{vx:Math.sin(a)*15,vz:Math.cos(a)*15,life:2.2,damage:22});}
 if(id==='chain'){circle(p.x,p.z,1,3,{slow:.65,damage:12});circle(p.x,p.z,2.25,3.6,{damage:28});}
 if(id==='orbit')hazard(g,'ring',{r:3,width:.9,grow:8,warn:1,life:2,damage:26});
 if(id==='vortex')circle(p.x,p.z,1.4,5,{life:1.4,damage:30});
 if(id==='dive')circle(p.x,p.z,1.6,5,{damage:38,life:.5});
 if(id==='eclipse')hazard(g,'ring',{x:0,z:0,r:17,width:10,warn:1.8,life:1,damage:42});
 if(id==='rain')for(let i=0;i<6;i++){const a=i*2.4;circle(p.x+Math.sin(a)*i*1.3,p.z+Math.cos(a)*i*1.3,.9+i*.48,2.8,{damage:20});}
 if(id==='wing')hazard(g,'cone',{yaw:aim,arc:1.15,r:12,warn:1.1,life:.4,damage:34});
 if(id==='pulse')for(let i=0;i<3;i++)hazard(g,'ring',{r:2,width:.7,grow:17,warn:.85+i*.7,life:1.5,damage:22});
 if(id==='pursuit'){lane(aim,1.2,{width:2.8,length:9,life:.7,damage:32,vx:Math.sin(aim)*30,vz:Math.cos(aim)*30});circle(p.x,p.z,2.55,4,{damage:28});}
 if(id==='tide')for(let i=0;i<4;i++)lane(i*Math.PI/2,1.2+i*.6,{x:0,z:0,length:9,width:3,life:1.2,damage:32});
 emit(g,'blood-warning',{pattern:id});return true;
}
function beginPhase(g){const s=g.blood;g.boss.phase=2;g.boss.state='transition';s.transitioned=true;s.phasePending=false;s.t=0;s.index=0;s.hazards.length=0;g.projectiles.length=0;g.player.action=null;s.slow=0;s.stun=0;emit(g,'phase');}
export function skipBloodTransition(g){if(g.boss.state!=='transition')return false;g.blood.t=R.transition;return true;}
function hurt(g,h){
 const p=g.player,a=p.action,rolling=a?.kind==='roll'&&a.t>=.08&&a.t<=.4;
 if(p.invuln>0||rolling){if(!h.dodged){g.stats.dodges++;h.dodged=true;}return;}
 h.hit=true;const before=p.hp;p.hp=Math.max(0,p.hp-h.damage);applyBossHitTrait(g,before-p.hp,{boss:'blood'});p.invuln=.65;if(h.slow)g.blood.slow=h.slow;emit(g,'hurt',{amount:h.damage});
 if(p.hp<=0){g.status='lost';g.blood.hazards.length=0;g.projectiles.length=0;emit(g,'death');}
}
function tickBoss(g,dt){
 const b=g.boss,s=g.blood;s.slow=Math.max(0,s.slow-dt);
 if(b.state==='transition'){s.t+=dt;s.elevation=Math.min(4,Math.max(0,s.t-2)*2);if(s.t>=R.transition){b.state='recovery';s.recover=2.8;s.elevation=0;s.t=0;emit(g,'blood-land');}return;}
 if(s.stun>0){s.stun=Math.max(0,s.stun-dt);return;}
 if(b.state==='recovery'){
  s.elevation=Math.max(0,s.elevation-dt*10);
  if(s.phasePending){beginPhase(g);return;}
  // Land close enough to offer every melee weapon a real counterattack window.
  const dx=g.player.x-b.x,dz=g.player.z-b.z,d=Math.hypot(dx,dz);if(d>4){const speed=Math.min(9,(d-4)/dt);b.x+=dx/d*speed*dt;b.z+=dz/d*speed*dt;clampArena(b);}
  s.recover-=dt;if(s.recover<=0){const pool=bloodPool(b.phase);startBloodPattern(g,pool[s.index++%pool.length]);}return;
 }
 s.t+=dt;const spec=BLOOD_PATTERNS[s.pattern];
 s.elevation=spec.air?Math.min(5,s.t*6):0;
 if(s.pattern==='dive'&&s.t>=1.6){b.x=s.target.x;b.z=s.target.z;s.elevation=0;}
 if(s.pattern==='pursuit'&&s.t>=1.2){const u=Math.min(1,(s.t-1.2)/.7);b.x=s.origin.x+(s.target.x-s.origin.x)*u;b.z=s.origin.z+(s.target.z-s.origin.z)*u;}
 for(const h of s.hazards){h.age+=dt;if(!h.fired&&h.age>=h.warn){h.fired=true;emit(g,'blood-impact',{pattern:s.pattern});}if(h.age>=h.warn&&h.age<=h.warn+h.life&&!h.hit&&hazardContains(h,g.player))hurt(g,h);if(g.status!=='playing')return;}
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);
 if(s.t>=spec.duration){s.hazards.length=0;b.state='recovery';s.recover=spec.recover;s.elevation=0;emit(g,'blood-land');}
}
function tickPlayer(g,dt,input){
 const p=g.player,b=g.boss,w=WEAPONS[g.weapon];tickPlayerResources(g,dt);
 tickPlayerAction(g,dt,w,{melee:a=>{const dx=b.x-p.x,dz=b.z-p.z,dist=Math.hypot(dx,dz);if(dist<=w.range+1.5&&Math.abs(Math.atan2(Math.sin(Math.atan2(dx,dz)-a.yaw),Math.cos(Math.atan2(dx,dz)-a.yaw)))<1.2&&g.blood.elevation<=2){a.hit=true;hit(g,w.damage*a.mult,a);}}});
 if(g.status!=='playing')return;
 for(const q of g.projectiles){const prev=advancePlayerProjectile(q,dt);if(q.hit||q.life<=0)continue;const dx=q.x-prev.x,dz=q.z-prev.z,n=dx*dx+dz*dz,u=n?Math.max(0,Math.min(1,((b.x-prev.x)*dx+(b.z-prev.z)*dz)/n)):0;if(Math.hypot(prev.x+dx*u-b.x,prev.z+dz*u-b.z)<=1.6){q.hit=true;hit(g,q.damage,q.source);q.life=0;}}
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
  left-=h;
 }
}
