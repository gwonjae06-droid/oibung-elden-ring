import {createGame,step as baseStep,rolling,clamp,angleDelta} from './combat.mjs';

export const ARENA=23,BALL_LIMIT=19.5,BODY_R=3.3,CLOWN_HP=2000,FLY=.9,SWELL=.55,HUG_DIST=3.8,HUG_TIME=2.2,HEAD_Y=9.9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),toward=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const emit=(g,type,data={})=>g.events.push({type,...data});
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const crossed=(a,t,at)=>a<at&&t>=at;
const confineTo=(o,r)=>{const d=Math.hypot(o.x,o.z);if(d>r){o.x*=r/d;o.z*=r/d;}};
const newVis=()=>({pose:'idle',k:0,mode:'full',crouch:0,glove:0,neck:0,neckTarget:null,tilt:0,juggle:0,jump:0,shake:0,throwK:0,stomp:0});
const resetVis=c=>{c.vis=newVis();};
const setHead=(c,pose,k,mode='full')=>{c.vis.pose=pose;c.vis.k=clamp(k,0,1);c.vis.mode=mode;};

export function inZone(z,p){
  if(z.shape==='lane'){const dx=p.x-z.x,dz=p.z-z.z,along=dx*Math.sin(z.yaw)+dz*Math.cos(z.yaw),lat=dx*Math.cos(z.yaw)-dz*Math.sin(z.yaw);return along>=0&&along<=z.len&&Math.abs(lat)<=z.w/2;}
  if(Math.hypot(p.x-z.x,p.z-z.z)>=z.r)return false;
  return z.shape==='circle'||Math.abs(angleDelta(z.yaw,toward(z,p)))<z.half;
}
export function hurt(g,damage,src){
  const p=g.player,c=g.clown;if(g.status!=='playing'||g.boss.state==='transition')return false;
  c.hits.push({src,t:g.time});if(c.hits.length>128)c.hits.shift();
  if(p.invuln>0)return false;
  if(rolling(p)){g.stats.dodges++;g.events.push({type:'dodge'});return false;}
  p.hp=Math.max(0,p.hp-damage);p.invuln=.32;p.action={kind:'hurt',t:0,total:.22};
  emit(g,'player-hit',{amount:damage});g.hitstop=Math.max(g.hitstop||0,.07);
  if(!p.hp){g.status='lost';emit(g,'death');}
  return true;
}
function addZone(g,z){
  const zone={id:g.nextId++,age:0,state:'warn',fade:0,kind:'danger',damage:0,final:0,blast:false,visual:false,...z};
  g.clown.zones.push(zone);emit(g,'clown-zone',{id:zone.id,shape:zone.shape,warn:zone.warn});return zone;
}
function resolveZone(g,z){
  const p=g.player;
  if(!z.visual&&inZone(z,p)){
    if(z.kind==='push'){
      if(!rolling(p)){const d=Math.hypot(p.x-z.x,p.z-z.z),a=d<.001?p.yaw+Math.PI:toward(z,p);p.x+=Math.sin(a)*2.5;p.z+=Math.cos(a)*2.5;confineTo(p,ARENA);emit(g,'clown-shove');}
    }else if(z.damage>0)hurt(g,z.damage,z.id);
  }
  if(z.blast)emit(g,'clown-blast',{x:z.x,z:z.z,r:z.r});
}
function updateZones(g,dt){
  const c=g.clown;
  for(const z of c.zones){
    if(z.state==='warn'){z.age+=dt;if(z.age>=z.warn){z.state='burst';z.fade=.28;resolveZone(g,z);}}
    else z.fade-=dt;
  }
  c.zones=c.zones.filter(z=>z.state==='warn'||z.fade>0);
}
function spawnBomb(g,o){
  const b=g.boss,bomb={id:g.nextId++,t:0,fly:FLY,warn:FLY+SWELL,from:{x:b.x,y:HEAD_Y,z:b.z},...o};
  g.clown.bombs.push(bomb);emit(g,'clown-throw',{kind:bomb.kind});return bomb;
}
function updateBombs(g,dt){const c=g.clown;for(const b of c.bombs)b.t+=dt;c.bombs=c.bombs.filter(b=>b.t<b.warn+.3);}
function lockTarget(g,limit=ARENA-1){const p=g.player;let x=p.x,z=p.z;const r=Math.hypot(x,z);if(r>limit){x*=limit/r;z*=limit/r;}return {x,z};}
function throwHead(g,r,damage){
  const t=lockTarget(g),zone=addZone(g,{shape:'circle',x:t.x,z:t.z,r,warn:FLY+SWELL,damage,final:SWELL,blast:true});
  return spawnBomb(g,{kind:'head',x:t.x,z:t.z,r,zone:zone.id});
}
function throwBall(g){
  const t=lockTarget(g),zone=addZone(g,{shape:'circle',x:t.x,z:t.z,r:1.9,warn:.85,damage:22,final:.3,blast:true});
  return spawnBomb(g,{kind:'ball',x:t.x,z:t.z,r:1.9,fly:.85,warn:.85,zone:zone.id});
}
function fitLen(b,yaw,len,limit=BALL_LIMIT){while(len>3&&Math.hypot(b.x+Math.sin(yaw)*len,b.z+Math.cos(yaw)*len)>limit)len-=.5;return len;}

export const PATTERNS={
  laughBomb:{name:'웃음 폭탄',dur:4.9,recover:1.8,phases:[1,2]},
  dash:{name:'곡예 돌진',dur:2.85,recover:1.5,phases:[1,2]},
  juggle:{name:'저글링 낙하',dur:4.15,recover:1.7,phases:[1]},
  clap:{name:'풍선 박수',dur:2.25,recover:1.4,phases:[1,2]},
  bounce:{name:'공 튀기기',dur:2.7,recover:1.7,phases:[1,2]},
  shove:{name:'관객 밀어내기',dur:1.6,recover:1.0,phases:[1,2]},
  tripleBomb:{name:'삼중 웃음 폭탄',dur:6.65,recover:2.3,phases:[2]},
  rollingSmile:{name:'굴러오는 미소',dur:5.0,recover:2.0,phases:[2]},
  inverseBow:{name:'거꾸로 된 인사',dur:3.4,recover:2.2,phases:[2]},
  lastClap:{name:'마지막 박수',dur:5.35,recover:2.2,phases:[2]}
};
const RUN={
  laughBomb(g,c,a,t){
    if(!c.f.s){c.f.s=1;emit(g,'clown-inflate');}
    if(t<1.4){setHead(c,'inflate',t/1.4);c.vis.shake=t/1.4;}else if(t<1.65)setHead(c,'hold',1);
    if(crossed(a,t,1.4))emit(g,'clown-silence');
    if(crossed(a,t,1.65))throwHead(g,3.2,34);
    if(t>=1.65){c.vis.throwK=clamp((t-1.65)/.35,0,1);setHead(c,'regrow',(t-1.65)/(PATTERNS.laughBomb.dur-1.65),'small');}
  },
  dash(g,c,a,t){
    const b=g.boss,p=g.player;
    if(!c.f.lane){const yaw=toward(b,p),len=fitLen(b,yaw,12);c.f.lane={x:b.x,z:b.z,yaw,len};c.yaw=yaw;addZone(g,{shape:'lane',x:b.x,z:b.z,yaw,len,w:BODY_R*2,warn:1.35,visual:true});emit(g,'clown-stomp');}
    const L=c.f.lane;c.vis.stomp=t<.9?Math.abs(Math.sin(t*16)):0;c.vis.crouch=t<.9?smooth(t/.9):0;
    if(crossed(a,t,.9))emit(g,'clown-dash');
    if(t>=.9&&t<=1.35){
      const k=(t-.9)/.45,nx=L.x+Math.sin(L.yaw)*L.len*k,nz=L.z+Math.cos(L.yaw)*L.len*k;c.odo+=Math.hypot(nx-b.x,nz-b.z);b.x=nx;b.z=nz;c.noSeparate=true;
      if(!c.f.hit&&dist(p,b)<BODY_R&&inZone({...L,shape:'lane',w:BODY_R*2},p)){c.f.hit=1;hurt(g,30,'dash'+g.nextId);}
    }else c.noSeparate=false;
  },
  juggle(g,c,a,t){
    if(!c.f.s){c.f.s=1;emit(g,'clown-juggle');}
    c.vis.juggle=t<2.2?1:0;
    for(const at of[.9,1.25,1.6])if(crossed(a,t,at))throwBall(g);
  },
  clap(g,c,a,t){
    const b=g.boss;
    if(!c.f.z){c.yaw=toward(b,g.player);c.f.z=addZone(g,{shape:'cone',x:b.x,z:b.z,r:4.8,yaw:c.yaw,half:.873,warn:.85,damage:28,final:.25});}
    c.vis.glove=t<.85?smooth(t/.85):smooth(1-(t-.85)/1);
    if(crossed(a,t,.85))emit(g,'clown-clap');
  },
  bounce(g,c,a,t){
    const b=g.boss;
    if(!c.f.z)c.f.z=addZone(g,{shape:'circle',x:b.x,z:b.z,r:4.8,warn:1,damage:30,final:.3});
    c.vis.crouch=t<.7?smooth(t/.7):0;c.vis.jump=t>=.7&&t<=1?Math.sin(Math.PI*(t-.7)/.3):0;
    if(crossed(a,t,1))emit(g,'clown-bounce');
  },
  shove(g,c,a,t){
    const b=g.boss;
    if(!c.f.z){c.shoveCd=4;c.f.z=addZone(g,{shape:'circle',x:b.x,z:b.z,r:3.5,warn:.6,kind:'push'});}
    c.vis.tilt=t<.6?smooth(t/.6):smooth(1-(t-.6)/.4);
  },
  tripleBomb(g,c,a,t){
    const T=[1.2,2.05,2.9],S=[0,1.2,2.05];
    if(!c.f.s){c.f.s=1;emit(g,'clown-inflate');}
    if(t<2.9){const i=t<1.2?0:t<2.05?1:2;setHead(c,'inflate',(t-S[i])/(T[i]-S[i]));c.vis.shake=.6;}
    for(const at of T)if(crossed(a,t,at))throwHead(g,2.8,30);
    if(t>=2.9)setHead(c,'regrow',(t-2.9)/(PATTERNS.tripleBomb.dur-2.9),'small');
  },
  rollingSmile(g,c,a,t){
    const b=g.boss,p=g.player;
    if(!c.f.lane){
      const yaw=toward(b,p),len=fitLen(b,yaw,14),ex=b.x+Math.sin(yaw)*len,ez=b.z+Math.cos(yaw)*len;
      c.f.lane={x:b.x,z:b.z,yaw,len,ex,ez};c.yaw=yaw;
      addZone(g,{shape:'lane',x:b.x,z:b.z,yaw,len,w:4,warn:2.3,visual:true});
      addZone(g,{shape:'circle',x:ex,z:ez,r:3.2,warn:3,damage:34,final:.7,blast:true});
    }
    const L=c.f.lane;
    if(t<1.1)setHead(c,'hold',1);else setHead(c,'regrow',(t-1.1)/(PATTERNS.rollingSmile.dur-1.1),'small');
    if(crossed(a,t,1.1)){c.f.roll=spawnBomb(g,{kind:'roll',fly:0,warn:1.9,x:L.ex,z:L.ez,r:3.2,px:L.x,pz:L.z});emit(g,'clown-roll');}
    if(c.f.roll){
      const k=clamp((t-1.1)/1.2,0,1);c.f.roll.px=L.x+(L.ex-L.x)*k;c.f.roll.pz=L.z+(L.ez-L.z)*k;
      if(t<=2.3&&!c.f.hit&&dist(p,{x:c.f.roll.px,z:c.f.roll.pz})<2&&inZone({...L,shape:'lane',w:4},p)){c.f.hit=1;hurt(g,26,'roll'+c.f.roll.id);}
    }
  },
  inverseBow(g,c,a,t){
    const b=g.boss;
    if(crossed(a,t,.2)){
      const p=lockTarget(g);let x=p.x,z=p.z;const d=Math.hypot(x-b.x,z-b.z);if(d>10){x=b.x+(x-b.x)*10/d;z=b.z+(z-b.z)*10/d;}
      c.f.tgt={x,z};c.f.zone=addZone(g,{shape:'circle',x,z,r:3.2,warn:1,damage:40,final:.4,blast:true});
    }
    c.vis.neckTarget=c.f.tgt||null;c.vis.crouch=smooth(t/.2);
    c.vis.neck=t<.2?0:t<1.2?smooth((t-.2)/.8):1-smooth((t-1.2)/1);
    if(crossed(a,t,1.2))emit(g,'clown-slam',{x:c.f.tgt.x,z:c.f.tgt.z});
  },
  lastClap(g,c,a,t){
    const b=g.boss;
    if(!c.f.z){c.yaw=toward(b,g.player);c.f.z=addZone(g,{shape:'cone',x:b.x,z:b.z,r:5,yaw:c.yaw,half:.873,warn:.9,damage:28,final:.25});}
    c.vis.glove=t<.9?smooth(t/.9):smooth(1-(t-.9)/.6);
    if(crossed(a,t,.9)){emit(g,'clown-clap');emit(g,'clown-inflate');}
    if(t>=.9&&t<1.7)setHead(c,'inflate',(t-.9)/.8);
    if(crossed(a,t,1.7))throwHead(g,3,34);
    if(t>=1.7)setHead(c,'regrow',(t-1.7)/(PATTERNS.lastClap.dur-1.7),'small');
  }
};

const LISTS={
  1:{far:['laughBomb','dash','juggle'],mid:['laughBomb','juggle','clap','dash','bounce'],near:['clap','bounce','laughBomb']},
  2:{far:['tripleBomb','rollingSmile','dash'],mid:['tripleBomb','rollingSmile','inverseBow','lastClap','dash','laughBomb','bounce'],near:['lastClap','bounce','inverseBow']}
};
export function choosePattern(g){
  const c=g.clown,d=dist(g.boss,g.player),L=LISTS[g.boss.phase===2?2:1];
  let list=d>12?L.far:d<5.5?L.near:L.mid;
  if(d<4&&c.shoveCd<=0&&c.seq%2===0)list=['shove',...list];
  list=list.filter(k=>k!==c.last);
  return list[(c.seq++)%list.length];
}
export function startClownPattern(g,name){
  if(!PATTERNS[name])throw new Error('Unknown clown pattern');
  const c=g.clown;c.state='pattern';c.name=name;c.pt=0;c.f={};c.punish=false;resetVis(c);
  emit(g,'clown-telegraph',{name:PATTERNS[name].name,key:name});
}
function finishPattern(g){
  const c=g.clown;c.last=c.name;c.state='idle';c.name=null;c.f={};c.wait=g.boss.phase===2?.5:.7;c.punish=false;c.noSeparate=false;resetVis(c);
}
function tickClown(g,dt){
  const c=g.clown,b=g.boss,p=g.player;
  if(c.state==='idle'){
    c.yaw+=clamp(angleDelta(c.yaw,toward(b,p)),-dt*2.5,dt*2.5);
    const d=dist(b,p);
    if(d>9){const v=g.boss.phase===2?5:4,s=Math.min(v*dt,d-9),a=toward(b,p);b.x+=Math.sin(a)*s;b.z+=Math.cos(a)*s;confineTo(b,BALL_LIMIT);c.odo+=s;}
    c.wait-=dt;
    if(c.wait<=0)startClownPattern(g,c.hug>HUG_TIME&&c.shoveCd<=0?'shove':choosePattern(g));
  }else if(c.state==='pattern'){
    const def=PATTERNS[c.name],a=c.pt;c.pt+=dt;
    RUN[c.name](g,c,a,c.pt);
    c.punish=c.pt>=def.dur-def.recover;
    if(c.pt>=def.dur)finishPattern(g);
  }
}
function updateClown(g,dt){
  const c=g.clown,b=g.boss,p=g.player;
  c.time+=dt;c.hug=dist(p,b)<HUG_DIST?c.hug+dt:0;c.shoveCd=Math.max(0,c.shoveCd-dt);
  updateBombs(g,dt);updateZones(g,dt);
  if(c.stunT>0)c.stunT=Math.max(0,c.stunT-dt);else tickClown(g,dt);
  b.yaw=c.yaw;
  if(!c.noSeparate){const d=dist(p,b);if(d<BODY_R){const a=d<.001?p.yaw:toward(b,p);p.x=b.x+Math.sin(a)*BODY_R;p.z=b.z+Math.cos(a)*BODY_R;confineTo(p,ARENA);}}
}
export function createClownGame(weapon='sword'){
  const g=createGame(weapon);
  Object.assign(g.boss,{x:0,z:-6,hp:CLOWN_HP,maxHp:CLOWN_HP,state:'clown',phase:1,stun:1e9,poise:0});
  g.player.z=14;
  g.clown={state:'idle',wait:1.4,pt:0,name:null,f:{},last:null,seq:0,zones:[],bombs:[],stunT:0,hug:0,shoveCd:0,punish:false,noSeparate:false,odo:0,yaw:0,time:0,hits:[],vis:newVis()};
  return g;
}
export function stepClown(g,dt,input={}){
  if(g.status!=='playing')return;
  const b=g.boss,c=g.clown;dt=clamp(dt,0,1/30);
  if(b.state!=='transition'){b.state='clown';b.stun=1e9;b.poise=0;}
  const frozen=g.hitstop>0,from=g.events.length;
  baseStep(g,dt,input);
  for(let i=from;i<g.events.length;i++){
    const e=g.events[i];
    if(e.type==='skill-stun')c.stunT=1;
    else if(e.type==='phase'){c.zones=[];c.bombs=[];c.state='transition';c.name=null;c.f={};c.punish=false;c.noSeparate=false;resetVis(c);}
    else if(e.type==='armed'){b.state='clown';b.stun=1e9;b.poise=0;c.state='idle';c.wait=1.2;emit(g,'clown-phase2');}
    else if(e.type==='victory'){c.zones=[];c.bombs=[];c.state='defeated';resetVis(c);}
  }
  if(frozen||g.status!=='playing'||b.state==='transition'||b.state==='dead')return;
  b.state='clown';b.stun=1e9;b.poise=0;
  updateClown(g,dt);
}
export function clownView(g){
  const c=g.clown,b=g.boss;let action='공연이 시작됩니다.';
  if(b.state==='transition')action='웃음이 멈추었습니다…';
  else if(c.stunT>0)action='기절! 지금이 기회입니다';
  else if(c.punish)action='빈틈 — 지금 반격하세요';
  else if(c.state==='pattern')action=PATTERNS[c.name].name;
  return {name:'광대 오슬우',sub:b.phase===2?'끝나지 않는 앙코르':'즐거운 공연',phase:b.phase,hp:b.hp,maxHp:b.maxHp,action};
}
