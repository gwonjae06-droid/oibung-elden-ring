export const TAU = Math.PI * 2;
export const TEMPO = 1;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const BOSS_SCALE=1.4;
export const CINEMATIC=5.2;
export const WEAPONS = {
  sword:{name:'검',damage:72,heavy:120,cost:18,heavyCost:30,wind:.17,active:.14,end:.32,range:3.5,poise:24},
  hammer:{name:'망치',damage:114,heavy:192,cost:27,heavyCost:40,wind:.43,active:.18,end:.52,range:3.7,poise:62},
  bow:{name:'활',damage:68,heavy:126,cost:17,heavyCost:29,wind:.30,active:.08,end:.28,range:38,poise:13,projectile:true},
  cards:{name:'카드',damage:27,heavy:32,cost:22,heavyCost:35,wind:.23,active:.10,end:.33,range:30,poise:9,projectile:true}
};
export const PATTERNS = {
  sweep:{name:'왕검 횡단',wind:.48,active:.22,recover:.95,damage:25},
  reverse:{name:'역린 참격',wind:.24,active:.22,recover:1.05,damage:28},
  thrust:{name:'왕의 관통',wind:1.05,active:.2,recover:1.3,damage:42},
  slam:{name:'천추 처형',wind:1.0,active:.3,recover:1.4,damage:45},
  cross:{name:'붉은 사선',wind:.55,active:.25,recover:1.0,damage:28},
  leap:{name:'군림 낙하',wind:.8,active:.6,recover:1.4,damage:43},
  whirl:{name:'패왕 회천',wind:.85,active:.72,recover:1.3,damage:36},
  rise:{name:'승천 검격',wind:.46,active:.3,recover:1.15,damage:36},
  jab:{name:'연화 검격',wind:.28,active:.18,recover:1.0,damage:18},
  rush:{name:'무영 발도',wind:.55,active:.3,recover:1.0,damage:32},
  retreat:{name:'납도 — 정적',wind:.24,active:.32,recover:.9,damage:0},
  wave:{name:'월광 파',wind:.65,active:.2,recover:1.0,damage:27}
};
export const ORDER={1:['rush','sweep','thrust','leap'],2:['draw','flurry','execution','crescent','tempest','counter']};
export const SEQUENCES={draw:['retreat','rush','reverse'],flurry:['cross','reverse','jab','jab','rise'],execution:['thrust','slam'],crescent:['wave','wave','rush'],tempest:['whirl','cross','slam'],counter:['retreat','rise','thrust']};
export const SWORD={x:0,y:2.3,z:2.8,length:8.55,width:.78};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),toward=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
const emit=(g,type,data={})=>g.events.push({type,...data});
function confine(p){const r=Math.hypot(p.x,p.z);if(r>23){p.x*=23/r;p.z*=23/r;}}
export function segmentDistance(p,a,b){const x=b.x-a.x,z=b.z-a.z,d=x*x+z*z,t=d?clamp(((p.x-a.x)*x+(p.z-a.z)*z)/d,0,1):0;return Math.hypot(p.x-a.x-x*t,p.z-a.z-z*t);}
export function cinematicPose(b){
  const t=b.phase===2?(b.state==='transition'?b.t:CINEMATIC):0;
  return {standing:ease(t/1.8),reach:ease((t-1.8)/1.1),detach:ease((t-2.9)/.9),equip:ease((t-3.8)/1.4),time:t};
}
export function bodyPose(b){const s=cinematicPose(b).standing,air=b.pattern==='leap'&&b.state==='active'&&b.t<PATTERNS.leap.active*.7?Math.sin(Math.PI*b.t/(PATTERNS.leap.active*.7))*2.6:0;return {standing:s,angle:-.9*s,pivotY:1.5,pivotZ:-1.5,lift:air};}
export function bodyPoint(b,p){const q=bodyPose(b),c=Math.cos(q.angle),s=Math.sin(q.angle),y=p.y-1.5,z=p.z+1.5;return {x:p.x*BOSS_SCALE,y:(1.5+y*c-z*s+q.lift)*BOSS_SCALE,z:(-1.5+y*s+z*c)*BOSS_SCALE};}
export function patternConfig(b){
  const c=PATTERNS[b.pattern];if(b.phase!==2)return c;
  const wind={rush:.38,jab:.19,cross:.32,reverse:.2,slam:1.12,thrust:.7,whirl:.68,rise:.3,retreat:.52,wave:.36,leap:.8,sweep:.3}[b.pattern];
  return {...c,wind,damage:c.damage+(b.pattern==='jab'?4:7),recover:{slam:1.05,thrust:.85,whirl:.9,rise:.8,reverse:.8,rush:.8}[b.pattern]||.8};
}
export function createGame(weapon='sword'){
  if(!WEAPONS[weapon])throw new Error('Unknown weapon');
  return {status:'playing',time:0,weapon,events:[],projectiles:[],bossShots:[],nextId:0,
    player:{x:0,z:13,yaw:Math.PI,hp:120,maxHp:120,stamina:100,regen:0,action:null,invuln:0,potions:3},
    boss:{x:0,z:-4,yaw:0,hp:1800,maxHp:1800,phase:1,state:'idle',t:0,wait:.8,pattern:'sweep',sequence:0,attackId:0,hit:false,poise:0,combo:false,chain:0,speed:1,queue:[],lastOpening:null,recovery:0,punishable:false,leapSpeed:0,aim:0,pressure:0},
    stats:{hits:0,dodges:0,damage:0}};
}
export function act(g,type){
  const p=g.player,w=WEAPONS[g.weapon];if(g.status!=='playing'||p.action||g.boss.state==='transition')return false;
  if(type==='heal'){if(!p.potions||p.hp>=p.maxHp)return false;p.potions--;p.action={kind:'heal',t:0,total:1.05,done:false};emit(g,'heal-start');return true;}
  if(type==='roll'){if(p.stamina<25)return false;p.stamina-=25;p.regen=.85;p.action={kind:'roll',t:0,total:.52,yaw:p.yaw};emit(g,'roll');return true;}
  if(type!=='light'&&type!=='heavy')return false;const heavy=type==='heavy',cost=heavy?w.heavyCost:w.cost;if(p.stamina<cost)return false;
  p.stamina-=cost;p.regen=.85;const wind=w.wind*(heavy?1.65:1),active=w.active,end=w.end*(heavy?1.2:1);
  p.action={kind:'attack',t:0,total:wind+active+end,wind,active,heavy,done:false,hit:false,yaw:p.yaw};emit(g,'attack-start',{heavy});return true;
}
export function rolling(p){return p.action?.kind==='roll'&&p.action.t>=.075&&p.action.t<=.35;}
export function startPattern(g,name){if(!PATTERNS[name])throw new Error('Unknown pattern');const b=g.boss;b.state='windup';b.pattern=name;b.t=0;b.hit=false;b.attackId++;b.punishable=false;b.yaw=toward(b,g.player);b.aim=b.yaw;emit(g,'telegraph',{name:PATTERNS[name].name});}
export function beginSequence(g,opening){
  const b=g.boss,map=b.phase===1?{rush:['rush'],sweep:['sweep','reverse'],thrust:['thrust'],leap:['leap']}:SEQUENCES;
  if(!map[opening])throw new Error('Opening not in phase');b.queue=map[opening].slice(1);b.lastOpening=opening;startPattern(g,map[opening][0]);
}
export function chooseOpening(g){
  const b=g.boss,d=dist(b,g.player);let list;
  if(b.phase===1)list=d>13?['thrust','leap']:d<5?['sweep','rush']:ORDER[1];
  else if(g.player.action?.kind==='heal')list=['draw','execution'];
  else list=d>13?['crescent','draw','execution']:d<5?['counter','flurry','tempest']:ORDER[2];
  list=list.filter(k=>k!==b.lastOpening);return list[(b.sequence++)%list.length];
}
export function swordPose(b){
  const cfg=patternConfig(b),q=cinematicPose(b),stand=q.standing,carry=mix(.25,-.6,stand),cut=mix(.25,.72,stand);
  let ly=0,ey=0,lp=carry,ep=cut,back=0;
  switch(b.pattern){
    case 'sweep':ly=1.3;ey=-1.3;lp=cut;break;
    case 'reverse':ly=-1.35;ey=1.35;lp=cut;break;
    case 'cross':ly=1.15;ey=-1.2;lp=-.75;ep=.85;break;
    case 'thrust':case 'jab':lp=ep=mix(.18,.68,stand);back=b.pattern==='jab'?1:1.4;break;
    case 'slam':lp=-1.15;ep=mix(.4,1.03,stand);break;
    case 'leap':lp=-1;ep=.45;break;
    case 'whirl':ly=ey=1.32;lp=ep=cut;break;
    case 'rise':lp=1.05;ep=-.8;ey=.3;break;
    case 'rush':ly=1.5;ey=-1.45;lp=cut;break;
    case 'retreat':ly=ey=-1.25;lp=ep=.15;break;
    case 'wave':lp=-.8;ep=.85;break;
  }
  let yaw=0,pitch=carry,offset=0;
  if(b.state==='windup'){const t=ease(b.t/cfg.wind);yaw=ly*t;pitch=mix(carry,lp,t);offset=-back*t;}
  else if(b.state==='active'){const t=ease(b.t/cfg.active);yaw=mix(ly,ey,t);pitch=mix(lp,ep,t);offset=mix(-back,back*.7,t);}
  else if(b.state==='recovery'){const t=ease(b.t/Math.max(.01,b.recovery||cfg.recover));yaw=mix(ey,0,t);pitch=mix(ep,carry,t);offset=mix(back*.7,0,t);}
  const neck=bodyPoint(b,SWORD),grip={x:.4,y:5.2,z:2.4},equip=q.detach;
  let root={x:mix(neck.x,grip.x,equip),y:mix(neck.y,grip.y,equip),z:mix(neck.z,grip.z,equip)+offset};
  if(b.state==='transition'){yaw=mix(0,-1.25,q.equip);pitch=mix(.15,-.6,q.equip);}
  return {...root,yaw,pitch,length:SWORD.length};
}
export function swordSegment(b){const p=swordPose(b),c=Math.cos(b.yaw),s=Math.sin(b.yaw),a={x:b.x+p.x*c+p.z*s,y:p.y,z:b.z-p.x*s+p.z*c};const yaw=b.yaw+p.yaw,len=SWORD.length*Math.cos(p.pitch);return {a,b:{x:a.x+Math.sin(yaw)*len,y:a.y-Math.sin(p.pitch)*SWORD.length,z:a.z+Math.cos(yaw)*len}};}
export function handPoint(b,side){const p=swordPose(b),x=side*.35,z=-.35,cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),cp=Math.cos(p.pitch),sp=Math.sin(p.pitch);return {x:p.x+x*cy+z*cp*sy,y:p.y-z*sp,z:p.z-x*sy+z*cp*cy};}
export function bladeHits(p,{a,b},width=SWORD.width){const dy=b.y-a.y;let lo=0,hi=1;if(Math.abs(dy)<1e-8){if(a.y<.1||a.y>2.2)return false;}else{const t0=(.1-a.y)/dy,t1=(2.2-a.y)/dy;lo=Math.max(0,Math.min(t0,t1));hi=Math.min(1,Math.max(t0,t1));if(lo>hi)return false;}const at=t=>({x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)});return segmentDistance(p,at(lo),at(hi))<width;}
function bossDamage(g,amount,poise){
  const b=g.boss;if(b.hp<=0||b.state==='transition')return;const damage=Math.min(b.hp,amount*(b.state==='stagger'?1.25:1));b.hp-=damage;g.stats.damage+=damage;g.stats.hits++;b.poise+=poise;emit(g,'boss-hit',{amount:Math.round(damage)});
  if(b.hp<=0){b.hp=0;b.state='dead';b.queue=[];g.status='won';g.projectiles=[];g.bossShots=[];emit(g,'victory');return;}
  if(b.phase===1&&b.hp<=b.maxHp*.5){b.phase=2;b.state='transition';b.t=0;b.queue=[];b.poise=0;b.punishable=false;g.projectiles=[];g.bossShots=[];g.player.action=null;emit(g,'phase');}
  else if(b.poise>=(b.phase===2?280:180)&&!['transition','stagger'].includes(b.state)){b.poise=0;b.state='stagger';b.t=0;b.queue=[];b.punishable=false;emit(g,'stagger');}
}
function hurtPlayer(g,damage){const p=g.player;if(g.status!=='playing'||p.invuln>0||g.boss.state==='transition')return;if(rolling(p)){g.stats.dodges++;emit(g,'dodge');return;}p.hp=Math.max(0,p.hp-damage);p.invuln=.32;p.action={kind:'hurt',t:0,total:.22};emit(g,'player-hit',{amount:damage});if(!p.hp){g.status='lost';g.bossShots=[];emit(g,'death');}}
function spawnProjectiles(g,a){const w=WEAPONS[g.weapon],n=g.weapon==='cards'?(a.heavy?5:3):1;for(let i=0;i<n;i++)g.projectiles.push({id:g.nextId++,x:g.player.x,z:g.player.z,y:1.2,yaw:a.yaw+(i-(n-1)/2)*.075,speed:g.weapon==='bow'?26:20,life:1.7,damage:a.heavy?w.heavy:w.damage,poise:w.poise*(a.heavy?1.5:1),kind:g.weapon});emit(g,'shot');}
function moveBoss(b,v,dt,side=0){const y=b.aim??b.yaw;b.x+=(Math.sin(y)*v+Math.cos(y)*side)*dt;b.z+=(Math.cos(y)*v-Math.sin(y)*side)*dt;confine(b);}
export function step(g,dt,input={}){
  if(g.status!=='playing')return;dt=clamp(dt,0,1/30);g.time+=dt;const p=g.player,b=g.boss,w=WEAPONS[g.weapon];
  if(b.state==='transition'){b.t+=dt;if(b.t>=CINEMATIC){b.state='idle';b.t=0;b.wait=.55;emit(g,'armed');}return;}
  p.invuln=Math.max(0,p.invuln-dt);p.regen=Math.max(0,p.regen-dt);if(!p.regen&&!p.action)p.stamina=Math.min(100,p.stamina+30*dt);
  const mx=input.x||0,mz=input.z||0,mag=Math.hypot(mx,mz);
  if(!p.action&&mag){p.x+=mx/Math.max(1,mag)*4.7*dt;p.z+=mz/Math.max(1,mag)*4.7*dt;}if(!p.action){if(input.lock)p.yaw=toward(p,b);else if(mag)p.yaw=Math.atan2(mx,mz);}
  if(p.action){const a=p.action;a.t+=dt;
    if(a.kind==='roll'){if(a.t<=dt*1.1&&mag)a.yaw=Math.atan2(mx,mz);p.x+=Math.sin(a.yaw)*10*dt;p.z+=Math.cos(a.yaw)*10*dt;}
    else if(a.kind==='heal'&&!a.done&&a.t>=.78){a.done=true;p.hp=Math.min(p.maxHp,p.hp+65);emit(g,'healed');}
    else if(a.kind==='attack'){if(a.t>=a.wind&&!a.done){a.done=true;emit(g,'swing');if(w.projectile)spawnProjectiles(g,a);}if(!w.projectile&&!a.hit&&a.t>=a.wind&&a.t<=a.wind+a.active&&dist(p,b)<=w.range+2.5&&Math.abs(angleDelta(a.yaw,toward(p,b)))<1.25){a.hit=true;bossDamage(g,a.heavy?w.heavy:w.damage,w.poise*(a.heavy?1.85:1));}}
    if(a.t>=a.total&&p.action===a)p.action=null;
  }
  confine(p);
  for(const q of g.projectiles){const old={x:q.x,z:q.z};q.x+=Math.sin(q.yaw)*q.speed*dt;q.z+=Math.cos(q.yaw)*q.speed*dt;q.life-=dt;if(q.life>0&&segmentDistance(b,old,q)<2.8){q.life=0;bossDamage(g,q.damage,q.poise);}}
  g.projectiles=g.projectiles.filter(q=>q.life>0);if(g.status!=='playing'||b.state==='transition')return;
  for(const q of g.bossShots){const old={x:q.x,z:q.z};q.x+=Math.sin(q.yaw)*q.speed*dt;q.z+=Math.cos(q.yaw)*q.speed*dt;q.life-=dt;if(Math.hypot(q.x,q.z)>27)q.life=0;if(q.life>0&&segmentDistance(p,old,q)<.9){q.life=0;hurtPlayer(g,q.damage);}}
  g.bossShots=g.bossShots.filter(q=>q.life>0);if(g.status!=='playing')return;
  b.poise=Math.max(0,b.poise-dt*5);b.t+=dt;const cfg=patternConfig(b);
  if(b.state==='stagger'){if(b.t>=(b.phase===2?1.3:2.1)){b.state='idle';b.t=0;b.wait=.35;}return;}
  if(b.state==='idle'){b.punishable=false;b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*2.7,dt*2.7);b.aim=b.yaw;if(dist(p,b)>8)moveBoss(b,b.phase===1?6.2:5.7,dt);b.wait-=dt;if(b.wait<=0)beginSequence(g,chooseOpening(g));}
  else if(b.state==='windup'){
    if(b.pattern==='rush'&&b.t<.18)moveBoss(b,0,dt,b.sequence%2?8:-8);
    if(b.t<cfg.wind*(b.phase===2?.68:.55)){b.yaw+=clamp(angleDelta(b.yaw,toward(b,p)),-dt*2.1,dt*2.1);b.aim=b.yaw;}
    if(b.t>=cfg.wind){b.state='active';b.t=0;emit(g,'boss-swing');if(b.pattern==='leap')b.leapSpeed=clamp((dist(p,b)-3)/(cfg.active*.7),0,26);
      if(b.pattern==='wave'){for(const offset of (b.phase===2?[-.14,0,.14]:[0]))g.bossShots.push({id:g.nextId++,x:b.x+Math.sin(b.yaw)*4,z:b.z+Math.cos(b.yaw)*4,yaw:b.yaw+offset,speed:b.phase===2?22:18,life:1.5,damage:cfg.damage});emit(g,'boss-shot');}
    }
  }else if(b.state==='active'){
    if(b.pattern==='rush')moveBoss(b,b.phase===2?31:23,dt);else if(b.pattern==='thrust')moveBoss(b,19,dt);else if(b.pattern==='jab')moveBoss(b,10,dt);else if(b.pattern==='retreat')moveBoss(b,-9,dt);else if(b.pattern==='leap'&&b.t<cfg.active*.7)moveBoss(b,b.leapSpeed,dt);else if(b.pattern==='whirl')b.yaw+=TAU/cfg.active*dt;
    if(!b.hit&&!['wave','retreat'].includes(b.pattern)){const seg=swordSegment(b),land=b.pattern==='leap'&&b.t>=cfg.active*.7&&dist(p,b)<5.2,slam=b.pattern==='slam'&&b.t>=cfg.active*.84&&dist(p,seg.b)<3.2,physical=b.pattern!=='leap'||b.t>=cfg.active*.7;if(land||slam||(physical&&bladeHits(p,seg))){b.hit=true;hurtPlayer(g,cfg.damage);}}
    if(b.t>=cfg.active){b.state='recovery';b.t=0;b.punishable=b.queue.length===0;b.recovery=b.punishable?cfg.recover:(b.phase===2?.055:.12);emit(g,b.punishable?'opening':'combo-gap');}
  }else if(b.state==='recovery'&&b.t>=b.recovery){if(b.queue.length)startPattern(g,b.queue.shift());else{b.state='idle';b.t=0;b.wait=b.phase===2?.1:.16;b.punishable=false;}}
  const d=dist(p,b);if(d<3){const a=d<.001?p.yaw:toward(b,p);p.x=b.x+Math.sin(a)*3;p.z=b.z+Math.cos(a)*3;confine(p);}
}
