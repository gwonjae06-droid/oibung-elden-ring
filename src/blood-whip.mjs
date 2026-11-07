// Interstitial range pressure for the blood monarch. Never replaces a
// full pattern or hijacks the camera; all contact shares this fixed cable.
export const BLOOD_WHIP=Object.freeze({
 minRange:13.5,maxRange:38,warning:.94,extension:.34,linger:.15,
 width:.56,cooldown:5.4,phaseOneDamage:17,phaseTwoDamage:23
});
export const bloodWhipDuration=BLOOD_WHIP.warning+BLOOD_WHIP.extension+BLOOD_WHIP.linger;
const clamp=x=>Math.max(0,Math.min(1,x));
const finite=x=>Number.isFinite(x);
export function bloodWhipPath(whip,progress=1){
 const f=clamp(progress);
 return {x:whip.x+whip.dx*f,z:whip.z+whip.dz*f};
}
export function bloodWhipExtension(whip){
 return .19+.81*clamp((whip.age-BLOOD_WHIP.warning)/BLOOD_WHIP.extension);
}
export function bloodWhipContact(whip,player){
 if(!whip||!player||whip.age<BLOOD_WHIP.warning||
   whip.age>BLOOD_WHIP.warning+BLOOD_WHIP.extension+BLOOD_WHIP.linger)return false;
 const dx=whip.dx,dz=whip.dz,dist=Math.hypot(dx,dz);
 if(dist<.001)return false;
 const ux=dx/dist,uz=dz/dist,px=player.x-whip.x,pz=player.z-whip.z;
 const along=px*ux+pz*uz,side=Math.abs(px*uz-pz*ux);
 // The visible cable extends from the boss to this exact progress value.
 return along>=Math.min(4.2,dist*.23)&&along<=dist*bloodWhipExtension(whip)+.5&&side<=BLOOD_WHIP.width+.42;
}
export function bloodWhipCanStart(g){
 const s=g?.blood,b=g?.boss,p=g?.player;
 if(g?.status!=='playing'||!s||!b||!p||s.whip||s.stun>0||
  (s.whipCooldown||0)>0||b.state==='transition'||b.state==='dead'||s.phasePending||
  (s.elevation||0)>.45)return false;
 const dist=Math.hypot(b.x-p.x,b.z-p.z);
 if(!finite(dist)||dist<BLOOD_WHIP.minRange||dist>BLOOD_WHIP.maxRange+3)return false;
 if(b.state==='recovery')return (s.recover||0)>=bloodWhipDuration+.35;
 if(b.state!=='pattern')return false;
 // No extra attack under a monumental camera shot or a simultaneous impact.
 if(b.phase===2&&['requiem','tide','eclipse','judgement','ritual','wingGenesis'].includes(s.pattern))return false;
 if(s.t<.75||s.t>(s.patternDuration||5)-bloodWhipDuration-.3)return false;
 return (s.hazards||[]).every(h=>
  h.age+bloodWhipDuration+.28<h.warn ||
  h.age>h.warn+h.life+.35);
}
export function beginBloodWhip(g){
 if(!bloodWhipCanStart(g))return false;
 const b=g.boss,p=g.player,s=g.blood;
 const angle=Math.atan2(p.x-b.x,p.z-b.z);
 const length=Math.min(BLOOD_WHIP.maxRange,Math.hypot(p.x-b.x,p.z-b.z));
 s.whip={age:0,x:b.x,z:b.z,dx:Math.sin(angle)*length,dz:Math.cos(angle)*length,
  yaw:angle,damage:b.phase===2?BLOOD_WHIP.phaseTwoDamage:BLOOD_WHIP.phaseOneDamage,
  resolved:false};
 s.whipCooldown=BLOOD_WHIP.cooldown;
 g.events.push({type:'blood-whip-warning',x:b.x,z:b.z,aim:angle,duration:BLOOD_WHIP.warning});
 return true;
}
export function stepBloodWhip(g,dt,onContact=()=>{}){
 const s=g.blood;
 s.whipCooldown=Math.max(0,(s.whipCooldown||0)-dt);
 const w=s.whip;
 if(!w)return;
 if(g.status!=='playing'||g.boss.state==='transition'||g.boss.state==='dead'||s.stun>0){
  s.whip=null;return;
 }
 w.age+=Math.max(0,dt);
 if(!w.resolved&&bloodWhipContact(w,g.player)){
  w.resolved=true;onContact({damage:w.damage,slow:0,hit:false,source:'blood-whip'});
  if(g.status==='playing')g.events.push({type:'blood-whip-contact',x:g.player.x,z:g.player.z});
 }
 if(w.age>=bloodWhipDuration)s.whip=null;
}
