import {tickBossHitTraits} from './boss-hit-traits.mjs';
import {GYUWON_RULES as R,GYUWON_PATTERNS,gyuwonPool,hazardContains} from './gyuwon-data.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createPlayerState,actPlayer,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';

const emit=(g,type,data={})=>g.events.push({type,...data});
const clampArena=p=>{const d=Math.hypot(p.x,p.z);if(d>R.radius-1){p.x*= (R.radius-1)/d;p.z*= (R.radius-1)/d;}};
export function createGyuwonGame(weapon='sword'){
 if(!Object.hasOwn(WEAPONS,weapon))throw Error('Unknown weapon');
 return {bossId:'gyuwon',weapon,time:0,status:'playing',nextId:1,events:[],projectiles:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState({x:0,z:14}),
  boss:{x:0,z:-5,hp:R.hp,maxHp:R.hp,phase:1,state:'recovery',yaw:0},
  gyuwon:{pattern:null,index:0,t:0,recover:1.2,hazards:[],elevation:0,slow:0,stun:0,transitioned:false,phasePending:false,deathTime:0,memory:[]}};
}
export function actGyuwon(g,type,input={}){
 if(g.status!=='playing'||g.boss.state==='transition')return false;
 if(!g.player.action)g.player.yaw=type==='roll'&&(input.x||input.z)?Math.atan2(input.x||0,input.z||0):Math.atan2(g.boss.x-g.player.x,g.boss.z-g.player.z);
 return actPlayer(g,type);
}
export function damageGyuwon(g,amount){
 if(g.status!=='playing'||g.boss.state==='transition'||!Number.isFinite(amount)||amount<=0)return 0;
 const b=g.boss,s=g.gyuwon,damage=Math.min(amount,b.phase===1?Math.max(0,b.hp-1):b.hp);b.hp-=damage;
 if(damage)emit(g,'boss-hit',{amount:damage});
 if(b.phase===1&&b.hp<=b.maxHp*.5)s.phasePending=true;
 if(b.hp<=0){g.status='won';b.state='dead';s.hazards.length=0;g.projectiles.length=0;s.slow=0;emit(g,'victory');}
 return damage;
}
function hit(g,amount,source){
 const s=g.gyuwon;if(s.elevation>2&&!WEAPONS[g.weapon].projectile)return;
 const damage=damageGyuwon(g,amount*(g.boss.phase===2?(g.boss.state==='recovery'?1.6:s.elevation>2?.65:1):1));
 if(!damage)return;
 settlePlayerHit(g,damage,source,{canStun:g.boss.state!=='transition',stun:d=>{s.stun=Math.min(1.2,d);}});
}
function hazard(g,shape,opts={}){const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:1,life:.35,age:0,damage:24,hit:false,...opts};g.gyuwon.hazards.push(h);return h;}
export function startGyuwonPattern(g,id){
 const spec=GYUWON_PATTERNS[id];if(!spec||g.status!=='playing'||g.boss.state==='transition')return false;
 const b=g.boss,s=g.gyuwon,p=g.player,aim=Math.atan2(p.x-b.x,p.z-b.z);s.hazards.length=0;s.pattern=id;s.t=0;b.state='pattern';b.yaw=aim;s.target={x:p.x,z:p.z};s.origin={x:b.x,z:b.z};
 const lane=(x,z,yaw,warn,extra={})=>hazard(g,'lane',{x,z,yaw,warn,width:1.15,length:42,life:.3,damage:24,...extra});
 if(id==='line')for(let i=-1;i<=1;i++)lane(p.x+i*5,p.z,0,1.1+Math.abs(i)*.22);
 if(id==='mark')for(let i=0;i<3;i++)hazard(g,'circle',{x:p.x+(i-1)*4,z:p.z,r:2.5,warn:1.1+i*.5,damage:22});
 if(id==='repeat'){
 const traces=s.memory.length?s.memory:[{shape:'lane',x:p.x,z:p.z,yaw:aim,width:1.15,length:42,r:2}];
 for(const h of traces){hazard(g,h.shape,{...h,warn:1,age:0,hit:false,fired:false,damage:26,life:.3});hazard(g,h.shape,{...h,warn:g.boss.phase===2?1.85:2.25,age:0,hit:false,fired:false,damage:26,life:.3});}
 }
 if(id!=='repeat')s.memory=s.hazards.map(({shape,x,z,yaw,width,length,r})=>({shape,x,z,yaw,width,length,r}));
 emit(g,'gyuwon-warning',{pattern:id});return true;
}
function beginPhase(g){const s=g.gyuwon;g.boss.phase=2;g.boss.state='transition';s.transitioned=true;s.phasePending=false;s.t=0;s.index=0;s.hazards.length=0;g.projectiles.length=0;g.player.action=null;s.slow=0;s.stun=0;emit(g,'phase');}
export function skipGyuwonTransition(g){if(g.boss.state!=='transition')return false;g.gyuwon.t=R.transition;return true;}
function hurt(g,h){
 const p=g.player,a=p.action,rolling=a?.kind==='roll'&&a.t>=.08&&a.t<=.4;
 if(p.invuln>0||rolling){if(!h.dodged){g.stats.dodges++;h.dodged=true;}return;}
 h.hit=true;p.hp=Math.max(0,p.hp-h.damage);p.invuln=.65;if(h.slow)g.gyuwon.slow=h.slow;emit(g,'hurt',{amount:h.damage});
 if(p.hp<=0){g.status='lost';g.gyuwon.hazards.length=0;g.projectiles.length=0;emit(g,'death');}
}
function tickBoss(g,dt){
 const b=g.boss,s=g.gyuwon;s.slow=Math.max(0,s.slow-dt);
 if(b.state==='transition'){s.t+=dt;s.elevation=0;if(s.t>=R.transition){b.state='recovery';s.recover=2.8;s.elevation=0;s.t=0;emit(g,'gyuwon-land');}return;}
 if(s.stun>0){s.stun=Math.max(0,s.stun-dt);return;}
 if(b.state==='recovery'){
  s.elevation=Math.max(0,s.elevation-dt*10);
  if(s.phasePending){beginPhase(g);return;}
  // Land close enough to offer every melee weapon a real counterattack window.
  const dx=g.player.x-b.x,dz=g.player.z-b.z,d=Math.hypot(dx,dz);if(d>4){const speed=Math.min(9,(d-4)/dt);b.x+=dx/d*speed*dt;b.z+=dz/d*speed*dt;clampArena(b);}
  s.recover-=dt;if(s.recover<=0){const pool=gyuwonPool(b.phase);startGyuwonPattern(g,pool[s.index++%pool.length]);}return;
 }
 s.t+=dt;const spec=GYUWON_PATTERNS[s.pattern];s.elevation=0;
 for(const h of s.hazards){h.age+=dt;if(!h.fired&&h.age>=h.warn){h.fired=true;emit(g,'gyuwon-impact',{pattern:s.pattern});}if(h.age>=h.warn&&h.age<=h.warn+h.life&&!h.hit&&hazardContains(h,g.player))hurt(g,h);if(g.status!=='playing')return;}
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);
 if(s.t>=spec.duration){s.hazards.length=0;b.state='recovery';s.recover=spec.recover;s.elevation=0;emit(g,'gyuwon-land');}
}
function tickPlayer(g,dt,input){
 const p=g.player,b=g.boss,w=WEAPONS[g.weapon];tickPlayerResources(g,dt);
 tickPlayerAction(g,dt,w,{melee:a=>{const dx=b.x-p.x,dz=b.z-p.z,dist=Math.hypot(dx,dz);if(dist<=w.range+1.5&&Math.abs(Math.atan2(Math.sin(Math.atan2(dx,dz)-a.yaw),Math.cos(Math.atan2(dx,dz)-a.yaw)))<1.2&&g.gyuwon.elevation<=2){a.hit=true;hit(g,w.damage*a.mult,a);}}});
 if(g.status!=='playing')return;
 for(const q of g.projectiles){const prev=advancePlayerProjectile(q,dt);if(q.hit||q.life<=0)continue;const dx=q.x-prev.x,dz=q.z-prev.z,n=dx*dx+dz*dz,u=n?Math.max(0,Math.min(1,((b.x-prev.x)*dx+(b.z-prev.z)*dz)/n)):0;if(Math.hypot(prev.x+dx*u-b.x,prev.z+dz*u-b.z)<=1.6){q.hit=true;hit(g,q.damage,q.source);q.life=0;}}
 g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing')return;
 const a=p.action;if(a?.kind==='roll'){p.x+=Math.sin(a.yaw)*18*dt;p.z+=Math.cos(a.yaw)*18*dt;}
 else if(!a){const x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z)),speed=8*(g.gyuwon.slow>0?.65:1)*(p.skill.blue>0?1.5:1);p.x+=x/n*speed*dt;p.z+=z/n*speed*dt;p.yaw=Math.atan2(b.x-p.x,b.z-p.z);}
 clampArena(p);
}
export function stepGyuwon(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);while(left>1e-9&&g.status==='playing'){
  const h=Math.min(1/120,left);g.time+=h;
  if(g.boss.state==='transition'){g.player.action=null;g.projectiles.length=0;tickBoss(g,h);}
  else{tickBossHitTraits(g,h);if(g.status!=='playing')return;tickPlayer(g,h,input);if(g.status==='playing')tickBoss(g,h);}
  left-=h;
 }
}
