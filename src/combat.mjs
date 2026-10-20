export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDelta = (a, b) => Math.atan2(Math.sin(b-a), Math.cos(b-a));
export const WEAPONS = {
  sword: {name:'검', damage:72, heavy:120, cost:18, heavyCost:30, wind:.17, active:.14, end:.32, range:3.5, poise:24},
  hammer:{name:'망치',damage:114,heavy:192,cost:27,heavyCost:40,wind:.43,active:.18,end:.52,range:3.7,poise:62},
  bow:{name:'활',damage:68,heavy:126,cost:17,heavyCost:29,wind:.30,active:.08,end:.28,range:38,poise:13,projectile:true},
  cards:{name:'카드',damage:27,heavy:32,cost:22,heavyCost:35,wind:.23,active:.10,end:.33,range:30,poise:9,projectile:true}
};
export const PATTERNS = {
  sweep:{name:'긴턱 횡베기',wind:1.0,active:.43,recover:1.10,damage:26},
  reverse:{name:'되돌려 베기',wind:.72,active:.42,recover:1.05,damage:24},
  thrust:{name:'장검 돌진',wind:1.15,active:.60,recover:1.35,damage:34},
  slam:{name:'턱 내려찍기',wind:1.25,active:.36,recover:1.55,damage:39},
  cross:{name:'쌍턱 교차베기',wind:1.05,active:.50,recover:1.45,damage:36}
};
const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
function toward(a,b){return Math.atan2(b.x-a.x,b.z-a.z);}
function confine(p){const d=Math.hypot(p.x,p.z);if(d>23){p.x*=23/d;p.z*=23/d;}}
export function segmentDistance(p,a,b){
  const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
  const t=den?clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/den,0,1):0;
  return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);
}
export function createGame(weapon='sword'){
  if(!WEAPONS[weapon])throw new Error('Unknown weapon');
  return {status:'playing',time:0,weapon,events:[],projectiles:[],nextId:0,
    player:{x:0,z:13,yaw:Math.PI,hp:120,maxHp:120,stamina:100,regen:0,action:null,invuln:0,potions:3},
    boss:{x:0,z:-4,yaw:0,hp:1800,maxHp:1800,phase:1,state:'idle',t:0,wait:1.1,pattern:'sweep',sequence:0,attackId:0,hit:false,poise:0,combo:false},
    stats:{hits:0,dodges:0,damage:0}};
}
const emit=(g,type,data={})=>g.events.push({type,...data});
export function act(g,type){
  const p=g.player,w=WEAPONS[g.weapon];
  if(g.status!=='playing'||p.action)return false;
  if(type==='heal'){
    if(!p.potions||p.hp>=p.maxHp)return false;
    p.potions--;p.action={kind:'heal',t:0,total:1.05,done:false};emit(g,'heal-start');return true;
  }
  if(type==='roll'){
    if(p.stamina<25)return false;
    p.stamina-=25;p.regen=.85;p.action={kind:'roll',t:0,total:.52,yaw:p.yaw};emit(g,'roll');return true;
  }
  if(type!=='light'&&type!=='heavy')return false;
  const heavy=type==='heavy',cost=heavy?w.heavyCost:w.cost;
  if(p.stamina<cost)return false;
  p.stamina-=cost;p.regen=.85;
  const wind=w.wind*(heavy?1.65:1),active=w.active,end=w.end*(heavy?1.2:1);
  p.action={kind:'attack',t:0,total:wind+active+end,wind,active,heavy,done:false,hit:false,yaw:p.yaw};
  emit(g,'attack-start',{heavy});return true;
}
export function rolling(p){return p.action?.kind==='roll'&&p.action.t>=.075&&p.action.t<=.35;}
export function startPattern(g,name){
  const b=g.boss;if(!PATTERNS[name])throw new Error('Unknown pattern');
  b.state='windup';b.pattern=name;b.t=0;b.hit=false;b.attackId++;
  b.yaw=toward(b,g.player);emit(g,'telegraph',{name:PATTERNS[name].name});
}
export function jawPose(b,index){
  const side=index===0?-1:1,pat=b.pattern,cfg=PATTERNS[pat];
  const u=b.state==='active'?clamp(b.t/cfg.active,0,1):b.state==='recovery'?1:0;
  const wind=b.state==='windup'?clamp(b.t/cfg.wind,0,1):1;
  const relax=b.state==='recovery'?clamp(b.t/cfg.recover,0,1):0;
  let yaw=side*.22,pitch=.06;
  if(['windup','active','recovery'].includes(b.state)){
    if(pat==='sweep'||pat==='reverse'){
      const activeSide=pat==='sweep'?-1:1;
      if(side===activeSide)yaw=(pat==='sweep'?1:-1)*(b.state==='windup'?1.13*wind:1.13-2.35*u);
      else yaw=side*.55;
    }else if(pat==='cross')yaw=side*(b.state==='windup'?.22+.90*wind:1.12-1.5*u);
    else if(pat==='thrust')yaw=side*(.22-.17*wind);
    else if(pat==='slam'){
      pitch=b.state==='windup'?-1.12*wind:-1.12+1.50*u;
      yaw=side*.14;
    }
    yaw=yaw*(1-relax)+side*.22*relax;pitch=pitch*(1-relax)+.06*relax;
  }
  return {x:side*.68,y:1.6,z:1.9,yaw,pitch,length:5.2};
}
export function jawSegments(b){
  return [0,1].map(i=>{
    const p=jawPose(b,i),c=Math.cos(b.yaw),s=Math.sin(b.yaw);
    const root={x:b.x+p.x*c+p.z*s,y:p.y,z:b.z-p.x*s+p.z*c};
    const yaw=b.yaw+p.yaw,len=p.length*Math.cos(p.pitch);
    return {a:root,b:{x:root.x+Math.sin(yaw)*len,y:root.y-Math.sin(p.pitch)*p.length,z:root.z+Math.cos(yaw)*len},index:i};
  });
}
function bossDamage(g,amount,poise){
  const b=g.boss;if(b.hp<=0)return;
  const actual=Math.min(b.hp,amount*(b.state==='stagger'?1.25:1));
  b.hp-=actual;g.stats.damage+=actual;g.stats.hits++;emit(g,'boss-hit',{amount:Math.round(actual)});
  b.poise+=poise;
  if(b.hp<=0){b.hp=0;g.status='won';b.state='dead';g.projectiles=[];emit(g,'victory');return;}
  if(b.phase===1&&b.hp<=b.maxHp*.5){b.phase=2;b.state='transition';b.t=0;b.combo=false;b.poise=0;emit(g,'phase');}
  else if(b.poise>=180&&b.state!=='stagger'&&b.state!=='transition'){b.poise=0;b.state='stagger';b.t=0;emit(g,'stagger');}
}
function hurtPlayer(g,amount){
  const p=g.player;if(p.invuln>0||g.status!=='playing')return;
  if(rolling(p)){g.stats.dodges++;emit(g,'dodge');return;}
  p.hp=Math.max(0,p.hp-amount);p.invuln=.65;p.action={kind:'hurt',t:0,total:.32};emit(g,'player-hit',{amount});
  if(!p.hp){g.status='lost';emit(g,'death');}
}
function spawnProjectiles(g,a){
  const w=WEAPONS[g.weapon],n=g.weapon==='cards'?(a.heavy?5:3):1;
  for(let i=0;i<n;i++){
    const yaw=a.yaw+(i-(n-1)/2)*.075;
    g.projectiles.push({id:g.nextId++,x:g.player.x,z:g.player.z,y:1.2,yaw,speed:g.weapon==='bow'?26:20,life:1.7,damage:a.heavy?w.heavy:w.damage,poise:w.poise*(a.heavy?1.5:1),kind:g.weapon});
  }
  emit(g,'shot');
}
export function step(g,dt,input={}){
  if(g.status!=='playing')return;
  dt=clamp(dt,0,1/30);g.time+=dt;
  const p=g.player,b=g.boss,w=WEAPONS[g.weapon];
  p.invuln=Math.max(0,p.invuln-dt);p.regen=Math.max(0,p.regen-dt);
  if(!p.regen&&!p.action)p.stamina=Math.min(100,p.stamina+30*dt);
  const mx=input.x||0,mz=input.z||0,mag=Math.hypot(mx,mz);
  if(!p.action&&mag){p.x+=mx/Math.max(1,mag)*4.7*dt;p.z+=mz/Math.max(1,mag)*4.7*dt;}
  if(!p.action){if(input.lock)p.yaw=toward(p,b);else if(mag)p.yaw=Math.atan2(mx,mz);}
  if(p.action){
    const a=p.action;a.t+=dt;
    if(a.kind==='roll'){
      if(a.t<=dt*1.1&&mag)a.yaw=Math.atan2(mx,mz);
      p.x+=Math.sin(a.yaw)*10*dt;p.z+=Math.cos(a.yaw)*10*dt;
    }else if(a.kind==='heal'&&!a.done&&a.t>=.78){a.done=true;p.hp=Math.min(p.maxHp,p.hp+65);emit(g,'healed');}
    else if(a.kind==='attack'){
      if(a.t>=a.wind&&!a.done){a.done=true;emit(g,'swing');if(w.projectile)spawnProjectiles(g,a);}
      if(!w.projectile&&!a.hit&&a.t>=a.wind&&a.t<=a.wind+a.active){
        const d=dist(p,b),angle=Math.abs(angleDelta(a.yaw,toward(p,b)));
        if(d<=w.range+1.7&&angle<1.25){a.hit=true;bossDamage(g,a.heavy?w.heavy:w.damage,w.poise*(a.heavy?1.85:1));}
      }
    }
    if(a.t>=a.total&&p.action===a)p.action=null;
  }
  confine(p);
  for(const q of g.projectiles){
    const old={x:q.x,z:q.z};q.x+=Math.sin(q.yaw)*q.speed*dt;q.z+=Math.cos(q.yaw)*q.speed*dt;q.life-=dt;
    if(q.life>0&&segmentDistance(b,old,q)<2.1){q.life=0;bossDamage(g,q.damage,q.poise);}
  }
  g.projectiles=g.projectiles.filter(q=>q.life>0);
  if(g.status!=='playing')return;
  b.poise=Math.max(0,b.poise-dt*5);b.t+=dt;
  const cfg=PATTERNS[b.pattern],speed=b.phase===2?1.15:1;
  if(b.state==='transition'||b.state==='stagger'){
    if(b.t>=(b.state==='stagger'?2.1:1.65)){b.state='idle';b.t=0;b.wait=.4;}
    return;
  }
  if(b.state==='idle'){
    b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*2.1,dt*2.1);
    const d=dist(p,b);
    if(d>6.1){const v=(b.phase===2?3.5:2.6)*dt;b.x+=Math.sin(b.yaw)*v;b.z+=Math.cos(b.yaw)*v;confine(b);}
    b.wait-=dt;
    if(b.wait<=0){
      const order=b.phase===2?['cross','thrust','sweep','reverse','slam']:['sweep','thrust','slam','reverse'];
      const name=d>10?'thrust':order[b.sequence++%order.length];startPattern(g,name);
    }
  }else if(b.state==='windup'){
    if(b.t<cfg.wind*.62/speed)b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*.9,dt*.9);
    if(b.t>=cfg.wind/speed){b.state='active';b.t=0;emit(g,'boss-swing');}
  }else if(b.state==='active'){
    if(b.pattern==='thrust'){
      b.x+=Math.sin(b.yaw)*12*dt;b.z+=Math.cos(b.yaw)*12*dt;confine(b);
    }
    if(!b.hit){
      const segments=jawSegments(b).filter(j=>!(b.pattern==='sweep'&&j.index===1)&&!(b.pattern==='reverse'&&j.index===0));
      const hit=segments.some(j=>Math.min(j.a.y,j.b.y)<2&&Math.max(j.a.y,j.b.y)>.1&&segmentDistance(p,j.a,j.b)<.74);
      const slam=b.pattern==='slam'&&b.t>cfg.active*.84&&dist(p,{x:b.x+Math.sin(b.yaw)*5.6,z:b.z+Math.cos(b.yaw)*5.6})<2.5;
      if(hit||slam){b.hit=true;hurtPlayer(g,cfg.damage);}
    }
    if(b.t>=cfg.active){b.state='recovery';b.t=0;}
  }else if(b.state==='recovery'&&b.t>=cfg.recover/speed){
    if(b.phase===2&&b.pattern==='sweep'&&!b.combo){b.combo=true;startPattern(g,'reverse');}
    else{b.combo=false;b.state='idle';b.t=0;b.wait=b.phase===2?.32:.65;}
  }
  const d=dist(p,b),min=2.3;
  if(d<min){const angle=d<.001?p.yaw:toward(b,p);p.x=b.x+Math.sin(angle)*min;p.z=b.z+Math.cos(angle)*min;confine(p);}
}
