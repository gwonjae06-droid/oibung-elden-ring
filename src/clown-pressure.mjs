export const ROLL=Object.freeze({wind:.8,travel:.6,fuse:.45,radius:2.1,damage:31});
export const PRESSURE=Object.freeze({hp:2400,wait:[.35,.2],chase:[4.8,6],damage:[1.08,1.15]});
export function segmentGap(p,a,b){const x=b.x-a.x,z=b.z-a.z,d=x*x+z*z,k=d?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/d)):0;return Math.hypot(p.x-a.x-k*x,p.z-a.z-k*z);}
export function waveCrosses(w,oldR,newR,a,b,playerR=.45){
 const da=Math.hypot(a.x-w.x,a.z-w.z),db=Math.hypot(b.x-w.x,b.z-w.z),sa=da-oldR,sb=db-newR,pad=w.width/2+playerR;
 if(Math.min(da,db)>w.range+playerR||Math.min(sa,sb)>pad||Math.max(sa,sb)<-pad)return false;
 for(const p of[a,b,{x:(a.x+b.x)/2,z:(a.z+b.z)/2}]){const dx=p.x-w.x,dz=p.z-w.z,d=Math.hypot(dx,dz),angle=Math.atan2(dx,dz)-w.yaw,delta=Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));if(delta<=w.half+Math.asin(Math.min(1,playerR/Math.max(.001,d))))return true;}return false;
}
export function rollPosition(q){const k=Math.max(0,Math.min(1,q.t/(q.travel||ROLL.travel)));return {x:q.from.x+(q.x-q.from.x)*k,z:q.from.z+(q.z-q.from.z)*k};}
