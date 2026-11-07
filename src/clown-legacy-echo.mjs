// The original balloon-riding O Seulwoo is now a SMALL act-two mini-midboss.
// This combat module is pure; his original full rig and photographed head are
// rendered separately. No cutscene, boss HP borrowing, hidden projectiles or
// independent boss phase may be started by an echo.
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const safe=p=>{const r=Math.hypot(p.x,p.z);return r>22?{x:p.x*22/r,z:p.z*22/r}:{x:p.x,z:p.z}};
const facing=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const LEGACY_ECHO_CONFIG=Object.freeze({
 max:2,scale:.255,hp:135,speed:3.2,range:7.7,
 damage:Object.freeze({headBomb:9,clap:10,roll:11,juggle:8}),
 telegraph:1.42,travel:.42,cooldown:6.4
});
export const LEGACY_ECHO_MOVES=Object.freeze(['headBomb','clap','roll','juggle']);
export const legacyEchoCount=g=>{
 const seed=Number.isFinite(g?.patternShuffle?.seed)?g.patternShuffle.seed:(g?.nextId||1);
 return 1+(Math.floor(Math.abs(seed))%2);
};
export function createLegacyEcho(g,index=0){
 const b=g.boss,angle=index===0?-1.06:1.06,r=15;
 const q=safe({x:b.x+Math.sin(angle)*r,z:b.z+Math.cos(angle)*r});
 return {id:g.nextId++,role:'legacyEcho',legacy:true,legacyIndex:index,
  x:q.x,z:q.z,vx:0,vz:0,yaw:facing(q,g.player),
  life:LEGACY_ECHO_CONFIG.hp,maxHp:LEGACY_ECHO_CONFIG.hp,
  age:0,cast:0,cooldown:3.1+index*1.15,down:false,death:0,flash:0,step:0,
  target:null,showCue:null,seenHit:null,routine:null,legacyAttackIndex:index,legacyAttack:null};
}
export function beginLegacyEchoAttack(g,m,{zone,emit}){
 if(!m?.legacy||m.down||!g?.player)return null;
 const move=LEGACY_ECHO_MOVES[m.legacyAttackIndex++%LEGACY_ECHO_MOVES.length];
 const warn=LEGACY_ECHO_CONFIG.telegraph,now=g.clown.time;
 const aim=safe(g.player),from={x:m.x,z:m.z},angle=facing(from,aim);
 const distance=Math.hypot(aim.x-from.x,aim.z-from.z);
 const l=clamp(distance+1,4.8,10.6);
 const attack={kind:move,start:now,wind:warn,from,aim,yaw:angle,len:l,hit:false};
 m.legacyAttack=attack;m.cast=warn+(move==='roll'?LEGACY_ECHO_CONFIG.travel:.4);
 m.cooldown=LEGACY_ECHO_CONFIG.cooldown+m.legacyIndex*.55;
 m.showCue=move;m.target=aim;
 const common={warn,source:'legacyEcho',miniOwner:m.id,major:false};
 if(move==='headBomb'){
  zone(g,{shape:'circle',...aim,r:2.25,damage:LEGACY_ECHO_CONFIG.damage.headBomb,
   sound:'legacyHeadBomb',blast:true,...common});
 }else if(move==='clap'){
  const front=safe({x:from.x+Math.sin(angle)*2.05,z:from.z+Math.cos(angle)*2.05});
  zone(g,{shape:'circle',...front,r:2.65,damage:LEGACY_ECHO_CONFIG.damage.clap,
   sound:'legacyGloveClap',...common});
 }else if(move==='roll'){
  // Warning covers the exact subsequent physical swept ball. Do not let the
  // zone itself damage across the whole lane at once.
  zone(g,{shape:'lane',...from,yaw:angle,len:l,w:2.35,damage:0,
   visual:true,sound:'legacyBallRush',...common});
 }else{
  for(let i=0;i<2;i++){
   const q=safe({x:aim.x+Math.sin(angle+i*1.9)*2.85,z:aim.z+Math.cos(angle+i*1.9)*2.85});
   zone(g,{shape:'circle',...q,r:1.7,damage:LEGACY_ECHO_CONFIG.damage.juggle,
    sound:'legacyJuggle',...common,warn:warn+i*.36});
  }
 }
 emit(g,'clown-legacy-echo-cast',{id:m.id,kind:move,x:m.x,z:m.z,wind:warn});
 return attack;
}
const segmentDistance=(p,a,b)=>{
 const dx=b.x-a.x,dz=b.z-a.z;
 const t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/Math.max(.0001,dx*dx+dz*dz),0,1);
 return Math.hypot(p.x-(a.x+dx*t),p.z-(a.z+dz*t));
};
export function stepLegacyEcho(g,m,{hurt}={}){
 const a=m?.legacyAttack;if(!a||m.down)return false;
 const now=g.clown.time,u=now-a.start;
 if(a.kind==='roll'&&u>=a.wind&&u<=a.wind+LEGACY_ECHO_CONFIG.travel+.02){
  const p=clamp((u-a.wind)/LEGACY_ECHO_CONFIG.travel,0,1);
  const eased=p*p*(3-2*p);
  const old={x:m.x,z:m.z};
  const pos=safe({x:a.from.x+Math.sin(a.yaw)*a.len*eased,
   z:a.from.z+Math.cos(a.yaw)*a.len*eased});
  m.x=pos.x;m.z=pos.z;m.yaw=a.yaw;
  // The exact swept distance drives the old striped ball rotation as well
  // as the articulated clown gait; an unmoving old ball looked fake.
  m.step+=Math.hypot(pos.x-old.x,pos.z-old.z);
  if(!a.hit&&segmentDistance(g.player,old,pos)<1.12){
   a.hit=true;if(typeof hurt==='function')hurt(g,LEGACY_ECHO_CONFIG.damage.roll,'legacyEcho-'+m.id);
  }
 }
 if(u>=a.wind+(a.kind==='roll'?LEGACY_ECHO_CONFIG.travel:.4)){
  m.legacyAttack=null;m.showCue=null;return false;
 }
 return true;
}
