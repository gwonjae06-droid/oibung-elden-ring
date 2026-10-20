export const TAU = Math.PI * 2;
export const TEMPO = 1;
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const WEAPONS = {
  sword:{name:'검',damage:72,heavy:120,cost:18,heavyCost:30,wind:.17,active:.14,end:.32,range:3.5,poise:24},
  hammer:{name:'망치',damage:114,heavy:192,cost:27,heavyCost:40,wind:.43,active:.18,end:.52,range:3.7,poise:62},
  bow:{name:'활',damage:68,heavy:126,cost:17,heavyCost:29,wind:.30,active:.08,end:.28,range:38,poise:13,projectile:true},
  cards:{name:'카드',damage:27,heavy:32,cost:22,heavyCost:35,wind:.23,active:.10,end:.33,range:30,poise:9,projectile:true}
};
export const PATTERNS = {
  sweep:{name:'사냥꾼의 초격',wind:.48,active:.22,recover:.95,damage:25},
  reverse:{name:'되돌림 베기',wind:.24,active:.22,recover:1.05,damage:28},
  thrust:{name:'매복 관통',wind:1.05,active:.2,recover:1.3,damage:42},
  slam:{name:'처형 내려찍기',wind:1.0,active:.3,recover:1.4,damage:45},
  cross:{name:'검객의 사선 초격',wind:.55,active:.25,recover:1.0,damage:28},
  leap:{name:'포식자 낙하',wind:.8,active:.6,recover:1.4,damage:43},
  whirl:{name:'회전 결전베기',wind:.85,active:.72,recover:1.3,damage:36},
  rise:{name:'후퇴 반격 올려베기',wind:.46,active:.3,recover:1.15,damage:36},
  jab:{name:'검객의 연속 찌르기',wind:.28,active:.18,recover:1.0,damage:18},
  rush:{name:'측면 도약 발도',wind:.55,active:.3,recover:1.0,damage:32},
  retreat:{name:'검객의 유인 보법',wind:.24,active:.32,recover:.9,damage:0},
  wave:{name:'추격 검기',wind:.65,active:.2,recover:1.0,damage:27}
};
export const ORDER={1:['rush','sweep','thrust','leap'],2:['cross','jab','retreat','wave','whirl']};
export const SWORD={x:0,y:2.3,z:2.8,length:6.84,width:.72};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const toward=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
function confine(p){const r=Math.hypot(p.x,p.z);if(r>23){p.x*=23/r;p.z*=23/r;}}
const emit=(g,type,data={})=>g.events.push({type,...data});
export function segmentDistance(p,a,b){const x=b.x-a.x,z=b.z-a.z,d=x*x+z*z,t=d?clamp(((p.x-a.x)*x+(p.z-a.z)*z)/d,0,1):0;return Math.hypot(p.x-a.x-x*t,p.z-a.z-z*t);}
export function bodyPose(b){
  const standing=b.phase===2?(b.state==='transition'?ease(b.t/1.8):1):0;
  const airborne=b.pattern==='leap'&&b.state==='active'&&b.t<PATTERNS.leap.active*.7?Math.sin(Math.PI*b.t/(PATTERNS.leap.active*.7))*2.6:0;
  return {standing,angle:-.9*standing,pivotY:1.5,pivotZ:-1.5,lift:airborne};
}
export function bodyPoint(b,p){
  const q=bodyPose(b),c=Math.cos(q.angle),s=Math.sin(q.angle),y=p.y-q.pivotY,z=p.z-q.pivotZ;
  return {x:p.x,y:q.pivotY+y*c-z*s+q.lift,z:q.pivotZ+y*s+z*c};
}
export function createGame(weapon='sword'){
  if(!WEAPONS[weapon])throw new Error('Unknown weapon');
  return {status:'playing',time:0,weapon,events:[],projectiles:[],bossShots:[],nextId:0,
    player:{x:0,z:13,yaw:Math.PI,hp:120,maxHp:120,stamina:100,regen:0,action:null,invuln:0,potions:3},
    boss:{x:0,z:-4,yaw:0,hp:1800,maxHp:1800,phase:1,state:'idle',t:0,wait:.8,pattern:'sweep',sequence:0,attackId:0,hit:false,poise:0,combo:false,chain:0,speed:1,queue:[],lastOpening:null,recovery:0,punishable:false,leapSpeed:0},
    stats:{hits:0,dodges:0,damage:0}};
}
export function act(g,type){
  const p=g.player,w=WEAPONS[g.weapon];if(g.status!=='playing'||p.action)return false;
  if(type==='heal'){if(!p.potions||p.hp>=p.maxHp)return false;p.potions--;p.action={kind:'heal',t:0,total:1.05,done:false};emit(g,'heal-start');return true;}
  if(type==='roll'){if(p.stamina<25)return false;p.stamina-=25;p.regen=.85;p.action={kind:'roll',t:0,total:.52,yaw:p.yaw};emit(g,'roll');return true;}
  if(type!=='light'&&type!=='heavy')return false;
  const heavy=type==='heavy',cost=heavy?w.heavyCost:w.cost;if(p.stamina<cost)return false;
  p.stamina-=cost;p.regen=.85;const wind=w.wind*(heavy?1.65:1),active=w.active,end=w.end*(heavy?1.2:1);
  p.action={kind:'attack',t:0,total:wind+active+end,wind,active,heavy,done:false,hit:false,yaw:p.yaw};emit(g,'attack-start',{heavy});return true;
}
export function rolling(p){return p.action?.kind==='roll'&&p.action.t>=.075&&p.action.t<=.35;}
export function startPattern(g,name){
  if(!PATTERNS[name])throw new Error('Unknown pattern');const b=g.boss;
  b.state='windup';b.pattern=name;b.t=0;b.hit=false;b.attackId++;b.punishable=false;b.yaw=toward(b,g.player);b.aim=b.yaw;
  emit(g,'telegraph',{name:PATTERNS[name].name});
}
export function beginSequence(g,opening){
  const b=g.boss;
  const combos=b.phase===1?{rush:['rush'],sweep:['sweep','reverse'],thrust:['thrust'],leap:['leap']}:
    {cross:['cross','reverse','slam'],jab:['jab','jab','thrust'],retreat:['retreat','rise'],wave:['wave','rush'],whirl:['whirl']};
  const seq=combos[opening];if(!seq)throw new Error('Opening not in phase');
  b.queue=seq.slice(1);b.lastOpening=opening;startPattern(g,seq[0]);
}
export function chooseOpening(g){
  const b=g.boss,d=dist(b,g.player);
  let options=b.phase===1?(d>11?['thrust','leap']:d<4?['sweep','rush']:['rush','sweep','thrust','leap']):
    (d>11?['wave','jab']:d<4?['retreat','cross','whirl']:['cross','jab','retreat','wave','whirl']);
  options=options.filter(k=>k!==b.lastOpening);return options[(b.sequence++)%options.length];
}
export function swordPose(b){
  const cfg=PATTERNS[b.pattern],stand=bodyPose(b).standing,carry=mix(.25,-.65,stand),cut=mix(.25,.63,stand);
  let loadYaw=0,endYaw=0,loadPitch=carry,endPitch=cut,back=0;
  switch(b.pattern){
    case 'sweep':loadYaw=1.3;endYaw=-1.3;loadPitch=cut;break;
    case 'reverse':loadYaw=-1.3;endYaw=1.3;loadPitch=cut;break;
    case 'cross':loadYaw=1.05;endYaw=-1.1;loadPitch=-.75;endPitch=.75;break;
    case 'thrust':case 'jab':loadPitch=endPitch=mix(.18,.62,stand);back=b.pattern==='jab'?1.0:1.3;break;
    case 'slam':loadPitch=-1.15;endPitch=mix(.4,1.0,stand);break;
    case 'leap':loadPitch=-1.0;endPitch=.45;break;
    case 'whirl':loadYaw=endYaw=1.32;loadPitch=endPitch=cut;break;
    case 'rise':loadPitch=mix(.95,1.05,stand);endPitch=-.8;endYaw=.25;break;
    case 'rush':loadYaw=1.2;endYaw=-1.3;loadPitch=cut;break;
    case 'retreat':loadPitch=endPitch=-.65;break;
    case 'wave':loadPitch=-.65;endPitch=.75;break;
  }
  let yaw=0,pitch=carry,offset=0;
  if(b.state==='windup'){const t=ease(b.t/cfg.wind);yaw=loadYaw*t;pitch=mix(carry,loadPitch,t);offset=-back*t;}
  else if(b.state==='active'){const t=ease(b.t/cfg.active);yaw=mix(loadYaw,endYaw,t);pitch=mix(loadPitch,endPitch,t);offset=mix(-back,back*.7,t);}
  else if(b.state==='recovery'){const t=ease(b.t/Math.max(.01,b.recovery||cfg.recover));yaw=mix(endYaw,0,t);pitch=mix(endPitch,carry,t);offset=mix(back*.7,0,t);}
  const root=bodyPoint(b,SWORD);root.z+=offset;
  return {...root,yaw,pitch,length:SWORD.length};
}
export function swordSegment(b){
  const p=swordPose(b),c=Math.cos(b.yaw),s=Math.sin(b.yaw),a={x:b.x+p.x*c+p.z*s,y:p.y,z:b.z-p.x*s+p.z*c};
  const yaw=b.yaw+p.yaw,len=p.length*Math.cos(p.pitch);
  return {a,b:{x:a.x+Math.sin(yaw)*len,y:a.y-Math.sin(p.pitch)*p.length,z:a.z+Math.cos(yaw)*len}};
}
export function bladeHits(p,seg,width=SWORD.width){
  const {a,b}=seg,dy=b.y-a.y;let lo=0,hi=1;
  if(Math.abs(dy)<1e-8){if(a.y<.1||a.y>2.2)return false;}
  else{const t0=(.1-a.y)/dy,t1=(2.2-a.y)/dy;lo=Math.max(0,Math.min(t0,t1));hi=Math.min(1,Math.max(t0,t1));if(lo>hi)return false;}
  const at=t=>({x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)});return segmentDistance(p,at(lo),at(hi))<width;
}
function bossDamage(g,amount,poise){
  const b=g.boss;if(b.hp<=0)return;const actual=Math.min(b.hp,amount*(b.state==='stagger'?1.25:1));
  b.hp-=actual;g.stats.damage+=actual;g.stats.hits++;b.poise+=poise;emit(g,'boss-hit',{amount:Math.round(actual)});
  if(b.hp<=0){b.hp=0;b.state='dead';b.queue=[];g.status='won';g.projectiles=[];g.bossShots=[];emit(g,'victory');return;}
  if(b.phase===1&&b.hp<=b.maxHp*.5){b.phase=2;b.state='transition';b.t=0;b.queue=[];b.chain=0;b.poise=0;b.punishable=false;g.bossShots=[];emit(g,'phase');}
  else if(b.poise>=180&&b.state!=='stagger'&&b.state!=='transition'){b.poise=0;b.state='stagger';b.t=0;b.queue=[];b.punishable=false;emit(g,'stagger');}
}
function hurtPlayer(g,amount){
  const p=g.player;if(g.status!=='playing'||p.invuln>0)return;
  if(rolling(p)){g.stats.dodges++;emit(g,'dodge');return;}
  p.hp=Math.max(0,p.hp-amount);p.invuln=.45;p.action={kind:'hurt',t:0,total:.25};emit(g,'player-hit',{amount});
  if(!p.hp){g.status='lost';g.bossShots=[];emit(g,'death');}
}
function spawnProjectiles(g,a){
  const w=WEAPONS[g.weapon],n=g.weapon==='cards'?(a.heavy?5:3):1;
  for(let i=0;i<n;i++)g.projectiles.push({id:g.nextId++,x:g.player.x,z:g.player.z,y:1.2,yaw:a.yaw+(i-(n-1)/2)*.075,speed:g.weapon==='bow'?26:20,life:1.7,damage:a.heavy?w.heavy:w.damage,poise:w.poise*(a.heavy?1.5:1),kind:g.weapon});
  emit(g,'shot');
}
function moveBoss(b,v,dt,side=0){const y=b.aim??b.yaw;b.x+=(Math.sin(y)*v+Math.cos(y)*side)*dt;b.z+=(Math.cos(y)*v-Math.sin(y)*side)*dt;confine(b);}
export function step(g,dt,input={}){
  if(g.status!=='playing')return;dt=clamp(dt,0,1/30);g.time+=dt;const p=g.player,b=g.boss,w=WEAPONS[g.weapon];
  p.invuln=Math.max(0,p.invuln-dt);p.regen=Math.max(0,p.regen-dt);if(!p.regen&&!p.action)p.stamina=Math.min(100,p.stamina+30*dt);
  const mx=input.x||0,mz=input.z||0,mag=Math.hypot(mx,mz);
  if(!p.action&&mag){p.x+=mx/Math.max(1,mag)*4.7*dt;p.z+=mz/Math.max(1,mag)*4.7*dt;}
  if(!p.action){if(input.lock)p.yaw=toward(p,b);else if(mag)p.yaw=Math.atan2(mx,mz);}
  if(p.action){
    const a=p.action;a.t+=dt;
    if(a.kind==='roll'){if(a.t<=dt*1.1&&mag)a.yaw=Math.atan2(mx,mz);p.x+=Math.sin(a.yaw)*10*dt;p.z+=Math.cos(a.yaw)*10*dt;}
    else if(a.kind==='heal'&&!a.done&&a.t>=.78){a.done=true;p.hp=Math.min(p.maxHp,p.hp+65);emit(g,'healed');}
    else if(a.kind==='attack'){
      if(a.t>=a.wind&&!a.done){a.done=true;emit(g,'swing');if(w.projectile)spawnProjectiles(g,a);}
      if(!w.projectile&&!a.hit&&a.t>=a.wind&&a.t<=a.wind+a.active&&dist(p,b)<=w.range+1.7&&Math.abs(angleDelta(a.yaw,toward(p,b)))<1.25){a.hit=true;bossDamage(g,a.heavy?w.heavy:w.damage,w.poise*(a.heavy?1.85:1));}
    }
    if(a.t>=a.total&&p.action===a)p.action=null;
  }
  confine(p);
  for(const q of g.projectiles){const old={x:q.x,z:q.z};q.x+=Math.sin(q.yaw)*q.speed*dt;q.z+=Math.cos(q.yaw)*q.speed*dt;q.life-=dt;if(q.life>0&&segmentDistance(b,old,q)<2.1){q.life=0;bossDamage(g,q.damage,q.poise);}}
  g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing')return;
  for(const q of g.bossShots){const old={x:q.x,z:q.z};q.x+=Math.sin(q.yaw)*q.speed*dt;q.z+=Math.cos(q.yaw)*q.speed*dt;q.life-=dt;if(Math.hypot(q.x,q.z)>26)q.life=0;if(q.life>0&&segmentDistance(p,old,q)<.85){q.life=0;hurtPlayer(g,q.damage);}}
  g.bossShots=g.bossShots.filter(q=>q.life>0);if(g.status!=='playing')return;
  b.poise=Math.max(0,b.poise-dt*5);b.t+=dt;const cfg=PATTERNS[b.pattern];
  if(b.state==='transition'||b.state==='stagger'){
    if(b.t>=(b.state==='transition'?1.8:2.1)){b.state='idle';b.t=0;b.wait=.45;}
    return;
  }
  if(b.state==='idle'){
    b.punishable=false;b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*2.7,dt*2.7);b.aim=b.yaw;
    if(dist(p,b)>7)moveBoss(b,b.phase===1?6.2:4.6,dt);b.wait-=dt;
    if(b.wait<=0)beginSequence(g,chooseOpening(g));
  }else if(b.state==='windup'){
    if(b.pattern==='rush'&&b.t<.2)moveBoss(b,0,dt,b.sequence%2?8:-8);
    if(b.t<cfg.wind*.55){b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*1.8,dt*1.8);b.aim=b.yaw;}
    if(b.t>=cfg.wind){
      b.state='active';b.t=0;emit(g,'boss-swing');
      if(b.pattern==='leap')b.leapSpeed=clamp((dist(p,b)-2.5)/(cfg.active*.7),0,25);
      if(b.pattern==='wave'){g.bossShots.push({id:g.nextId++,x:b.x+Math.sin(b.yaw)*3.8,z:b.z+Math.cos(b.yaw)*3.8,yaw:b.yaw,speed:18,life:1.5,damage:cfg.damage});emit(g,'boss-shot');}
    }
  }else if(b.state==='active'){
    if(b.pattern==='rush')moveBoss(b,23,dt);
    else if(b.pattern==='thrust')moveBoss(b,16,dt);
    else if(b.pattern==='jab')moveBoss(b,7,dt);
    else if(b.pattern==='retreat')moveBoss(b,-11,dt);
    else if(b.pattern==='leap'&&b.t<cfg.active*.7)moveBoss(b,b.leapSpeed,dt);
    else if(b.pattern==='whirl')b.yaw+=TAU/cfg.active*dt;
    if(!b.hit&&!['wave','retreat'].includes(b.pattern)){
      const seg=swordSegment(b),land=b.pattern==='leap'&&b.t>=cfg.active*.7&&dist(p,b)<4.6;
      const slam=b.pattern==='slam'&&b.t>=cfg.active*.84&&dist(p,seg.b)<2.4;
      const physical=b.pattern!=='leap'||b.t>=cfg.active*.7;
      if(land||slam||(physical&&bladeHits(p,seg))){b.hit=true;hurtPlayer(g,cfg.damage);}
    }
    if(b.t>=cfg.active){b.state='recovery';b.t=0;b.punishable=b.queue.length===0;b.recovery=b.punishable?cfg.recover:.12;emit(g,b.punishable?'opening':'combo-gap');}
  }else if(b.state==='recovery'&&b.t>=b.recovery){
    if(b.queue.length)startPattern(g,b.queue.shift());
    else{b.state='idle';b.t=0;b.wait=.16;b.punishable=false;}
  }
  const d=dist(p,b);if(d<2.3){const a=d<.001?p.yaw:toward(b,p);p.x=b.x+Math.sin(a)*2.3;p.z=b.z+Math.cos(a)*2.3;confine(p);}
}
