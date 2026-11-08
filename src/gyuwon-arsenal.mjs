// Weapon years share one simulation clock with their joint poses and effects.
const sat=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=sat(x);return x*x*(3-2*x);};
export const arsenalKind=year=>({5:'hammer',6:'sword',7:'bow',8:'cards'})[year]||null;
export const ARSENAL_ROSTERS=Object.freeze({
 5:['hammerCrush','hammerSweep','hammerQuake'],
 6:['swordAdvance','swordDelayed','swordDraw'],
 7:['bowPierce','bowFan','bowVolley'],
 8:['cardsCurve','cardsReturn','cardsDeal']
});
export const ARSENAL_SIGNATURES=Object.freeze({5:'hammerStorm',6:'swordCross',7:'bowRain',8:'cardsCage'});
export const ARSENAL_PATTERNS=Object.freeze(Object.fromEntries([
 ...Object.values(ARSENAL_ROSTERS).flat().map(id=>[id,[id.startsWith('hammer')?4.8:4.5,id.startsWith('hammer')?1.8:1.4]]),
 ['hammerStorm',[7.2,2.3]],['swordCross',[6.3,2]],['bowRain',[7.3,2]],['cardsCage',[7.5,2]]
]));
export function spawnArsenal(g,id,add){
 if(!ARSENAL_PATTERNS[id])return false;
 const b=g.boss,p=g.player,e=g.gyuwon.years,kind=arsenalKind(e.year);
 const yaw=Math.atan2(p.x-b.x,p.z-b.z),dx=Math.sin(yaw),dz=Math.cos(yaw),distance=Math.hypot(p.x-b.x,p.z-b.z);
 const melee=kind==='hammer'||kind==='sword',travel=melee?Math.max(0,Math.min(distance-3,13)):0;
 const to={x:b.x+dx*travel,z:b.z+dz*travel};
 e.weaponPlan={id,kind,yaw,from:{x:b.x,z:b.z},to,moveEnd:.8,beats:[]};b.yaw=yaw;
 const hit=(shape,opts)=>{const h=add(g,shape,{visual:'arsenal-'+kind,arsenal:true,signature:Object.values(ARSENAL_SIGNATURES).includes(id)?id:undefined,...opts});if(opts.weaponStrike||!melee)e.weaponPlan.beats.push(h.warn);return h;};
 const strike=(warn,angle=0,wide=false)=>hit('cone',{x:to.x,z:to.z,yaw:yaw+angle,r:kind==='hammer'?4.6:5.2,innerR:0,arc:wide?1.25:.65,warn,life:.24,damage:kind==='hammer'?33:25,weaponStrike:true});
 const shot=(angle,warn,{returning=false,curve=0,from=null}={})=>{
  const a=yaw+angle,speed=kind==='bow'?29:19,origin=from||{x:b.x+dx*1.8,z:b.z+dz*1.8};
  hit('circle',{...origin,yaw:a,r:kind==='bow'?.48:.62,vx:Math.sin(a)*speed,vz:Math.cos(a)*speed,
   warn,life:kind==='bow'?2.05:3.15,damage:kind==='bow'?25:21,visual:kind==='bow'?'arsenal-arrow':'arsenal-card',returning,curve});
 };
 if(id==='hammerCrush')strike(1.9);
 if(id==='hammerSweep'){strike(1.85,-.4,true);strike(3.15,.3);}
 if(id==='hammerQuake'||id==='hammerStorm'){
  const count=id==='hammerStorm'?3:1;
  for(let i=0;i<count;i++){const t=1.8+i*1.55;strike(t);hit('ring',{x:to.x,z:to.z,r:.7,width:.58,grow:10,warn:t+.5,life:1.05,damage:25,visual:'arsenal-quake'});}
 }
 if(id==='swordAdvance'){strike(1.75,-.35);strike(2.7,.4);}
 if(id==='swordDelayed'){strike(2.35,.25,true);strike(3.55,-.3);}
 if(id==='swordDraw')strike(2.1,0,false);
 if(id==='swordCross')for(let i=0;i<4;i++)strike(1.6+i*.85,i%2?.4:-.4);
 if(id==='bowPierce'){shot(0,1.6);shot(0,2.9);}
 if(id==='bowFan')for(const a of [-.28,0,.28])shot(a,1.8);
 if(id==='bowVolley')for(let i=0;i<3;i++)for(const a of [-.15,.15])shot(a,1.55+i*.85);
 if(id==='bowRain')for(let i=0;i<12;i++){
  const a=i*2.39996,r=3+(i%3)*3;
  hit('circle',{x:Math.max(-27,Math.min(27,p.x+Math.sin(a)*r)),z:Math.max(-27,Math.min(27,p.z+Math.cos(a)*r)),r:.9,warn:2+i*.28,life:.32,damage:26,visual:'arsenal-falling-arrow'});
 }
 if(id==='cardsCurve')for(const a of [-.32,0,.32])shot(a,1.65,{curve:a<0?.7:-.7});
 if(id==='cardsReturn')for(const a of [-.18,.18])shot(a,1.7,{returning:true});
 if(id==='cardsDeal')for(let i=0;i<5;i++)shot((i-2)*.14,1.5+i*.32);
 if(id==='cardsCage')for(let i=0;i<8;i++){
  const a=i*Math.PI/4,origin={x:p.x+Math.sin(a)*12,z:p.z+Math.cos(a)*12},angle=Math.atan2(p.x-origin.x,p.z-origin.z);
  const h=hit('circle',{...origin,yaw:angle,r:.62,vx:Math.sin(angle)*15,vz:Math.cos(angle)*15,warn:2+i*.3,life:1.65,damage:23,visual:'arsenal-card'});
  h.returning=false;
 }
 e.weaponPlan.beats=[...new Set(e.weaponPlan.beats)].sort((a,b)=>a-b);return true;
}
export function tickArsenal(g){
 const e=g.gyuwon.years,plan=e.weaponPlan;
 if(!plan||plan.id!==e.cast)return;
 const q=ease(e.castT/plan.moveEnd);g.boss.x=plan.from.x+(plan.to.x-plan.from.x)*q;g.boss.z=plan.from.z+(plan.to.z-plan.from.z)*q;g.boss.yaw=plan.yaw;
}
export function arsenalProjectile(h){
 const t=Math.max(0,h.age-h.warn),speed=Math.hypot(h.vx,h.vz),yaw=h.yaw||0;
 const d=h.returning?speed*(t<=1.45?t:Math.max(0,2.9-t)):speed*t;
 const sideways=(h.curve||0)*Math.sin(Math.PI*Math.min(1,t/2.5))*5;
 return {x:h.x+Math.sin(yaw)*d+Math.cos(yaw)*sideways,z:h.z+Math.cos(yaw)*d-Math.sin(yaw)*sideways,r:h.r};
}
export function arsenalMotion(g){
 const e=g.gyuwon.years,kind=arsenalKind(e?.year);if(!kind||e.mode!=='combat')return null;
 const plan=e.weaponPlan?.id===e.cast?e.weaponPlan:null,t=e.castT||0;
 const beat=plan?.beats.find(x=>x+.42>=t),lead=beat===undefined?0:sat(1-(beat-t)/.95);
 const raised=ease(lead),swing=beat===undefined?0:ease((t-beat+.30)/.25);
 if(kind==='hammer'||kind==='sword')return {lean:-.12-raised*.22+swing*.53,twist:kind==='sword'?-.45*raised+.9*swing:0,headPitch:.14,headYaw:0,
  leftArm:kind==='hammer'?-1.2-raised*.9+swing*1.1:-.4,rightArm:-.65-raised*1.95+swing*2.05,
  leftElbow:-.4,rightElbow:-.25-raised*.5+swing*.4,leftWrist:0,rightWrist:0,weightShift:.2*raised,book:-.7};
 return {lean:kind==='bow'?-.1:.1,twist:kind==='bow'?-.15:.25*raised,headPitch:.05,headYaw:0,
  leftArm:kind==='bow'?-1.55:-.7,rightArm:kind==='bow'?-1.4:-.7-raised*.8+swing*.9,
  leftElbow:-.12,rightElbow:kind==='bow'?-.8*raised:-.3,leftWrist:0,rightWrist:0,weightShift:0,book:-.7};
}
