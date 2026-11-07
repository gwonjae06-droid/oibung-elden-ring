// Kwon's second unskippable act-three cinematic and deterministic moon debris.
// This is pure simulation: THREE never owns a gameplay collider.
export const KWON_MOON=Object.freeze({
 threshold:500,cinematic:8.1,slashTimes:[1.38,2.62,3.93],
 waveTimes:[0,3.45,6.9],fall:2.6,stormEnd:11.4,maxMeteors:9,
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const q=clamp(x,0,1);return q*q*(3-2*q);};
export function moonPosition(){return {x:-38,y:34,z:-58};}
export function moonCinematicPose(time){
 const t=Math.max(0,Number(time)||0);
 const cuts=KWON_MOON.slashTimes.map((start,index)=>{
  const wind=smooth((t-(start-.7))/.68);
  const stroke=smooth((t-start)/.33);
  const aftermath=1-smooth((t-start-.14)/.77);
  return {index,start,wind,stroke,intensity:stroke*aftermath};
 });
 return {
  cuts,fracture:cuts.reduce((v,c)=>v+c.stroke,0)/cuts.length,
  focus:smooth((t-.15)/.8)*(1-smooth((t-6.55)/1.2)),
  fragmentRelease:smooth((t-4.02)/.9),
  recoil:cuts.reduce((v,c)=>Math.max(v,c.intensity),0),
 };
}
export function makeKwonMoonState(){return {
 triggered:false,mode:'dormant',time:0,slashes:0,waveIndex:0,meteors:[],completed:false,
};}
export function beginKwonMoonCinematic(g){
 const b=g?.boss,m=g?.kwonMoon;
 if(!m||m.triggered||g.status!=='playing'||b.phase!==3||b.hp<=0||
    b.hp>KWON_MOON.threshold||['transition','dead'].includes(b.state))return false;
 m.triggered=true;m.mode='cinematic';m.time=0;m.slashes=0;m.waveIndex=0;m.meteors.length=0;
 Object.assign(b,{state:'moonCinematic',t:0,queue:[],stun:0,poise:0,wait:0,punishable:false});
 g.player.action=null;g.bossShots.length=0;g.projectiles.length=0;g.kwonFractures.length=0;
 g.events.push({type:'kwon-moon-cinematic'});
 return true;
}
function meteorLocations(g,wave){
 // Snapshot at warning time. Never chase the player while falling.
 // Three separate sites with gaps wide enough to escape with normal walking.
 const p=g.player,targets=[{x:p.x,z:p.z}];
 for(let j=1;j<3;j++){
  const a=(wave*1.8+j*2.399963+1.17);
  const r=10+(j%2)*3;
  targets.push({x:Math.sin(a)*r,z:Math.cos(a)*r});
 }
 return targets.map((pos,i)=>({
  id:g.nextId++,x:clamp(pos.x,-17,17),z:clamp(pos.z,-17,17),
  age:0,impact:KWON_MOON.fall+(i===1?.34:i===2?.66:0),
  radius:i===0?3.65:3.95,damage:wave===2?44:38,
  hit:false,landed:false,warning:true,wave,index:i,
 }));
}
export function advanceKwonMoon(g,dt,onPlayerHit=()=>{}){
 const m=g?.kwonMoon;if(!m||!['cinematic','storm'].includes(m.mode))return false;
 m.time+=clamp(dt,0,1/30);
 if(m.mode==='cinematic'){
  g.boss.t=m.time;
  while(m.slashes<KWON_MOON.slashTimes.length&&m.time>=KWON_MOON.slashTimes[m.slashes]){
   g.events.push({type:'kwon-moon-slash',index:m.slashes++});
  }
  if(m.time>=KWON_MOON.cinematic){
   m.mode='storm';m.time=0;g.boss.state='moonStorm';g.boss.t=0;
   g.events.push({type:'kwon-moon-fall'});
  }
  return true;
 }
 while(m.waveIndex<KWON_MOON.waveTimes.length&&m.time>=KWON_MOON.waveTimes[m.waveIndex]){
  const wave=m.waveIndex++;
  const falling=meteorLocations(g,wave);
  m.meteors.push(...falling);
  g.events.push({type:'kwon-meteor-warning',wave});
 }
 for(const h of m.meteors){
  h.age+=dt;
  if(!h.landed&&h.age>=h.impact){
   h.landed=true;
   g.events.push({type:'kwon-meteor-impact',x:h.x,z:h.z,radius:h.radius});
   if(Math.hypot(g.player.x-h.x,g.player.z-h.z)<=h.radius){
    h.hit=true;
    onPlayerHit(h.damage);
   }
  }
 }
 m.meteors=m.meteors.filter(h=>h.age<h.impact+1.15);
 if(m.time>=KWON_MOON.stormEnd&&m.waveIndex===KWON_MOON.waveTimes.length&&!m.meteors.length){
  m.mode='done';m.completed=true;g.boss.state='idle';g.boss.t=0;g.boss.wait=1.2;
  g.events.push({type:'kwon-moon-storm-end'});
 }
 return true;
}
