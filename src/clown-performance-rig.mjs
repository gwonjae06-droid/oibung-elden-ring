// Stable geometric rig helpers shared by the ringmaster and his performers.
// Bone lengths are fixed; targets are projected into reachable space instead
// of making elbows or shins grow when the attack pose extends too far.
const valid=(v,d=0)=>Number.isFinite(v)?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,valid(v,a)));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,k)=>a.map(v=>v*k);
export function solveFixedLimb(start,desired,{upper=1.25,lower=1.20,pole=[1,-.25,.45],previous=null}={}){
 if(![start,desired,pole].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))throw new TypeError('Finite 3D limb coordinates required');
 const u=Math.max(.05,valid(upper,1.25)),v=Math.max(.05,valid(lower,1.20)),
  difference=sub(desired,start),actual=len(difference),
  direction=actual>1e-8?mul(difference,1/actual):[0,-1,0],
  distance=clamp(actual,Math.abs(u-v)+.001,u+v-.004),
  target=add(start,mul(direction,distance));
 // Prefer the anatomically authored elbow pole, use previous only to prevent
 // knee popping at the singularity. The solver never lengthens either bone.
 let tangent=sub(pole,mul(direction,dot(pole,direction)));
 if(len(tangent)<.0001&&previous)tangent=sub(sub(previous,start),mul(direction,dot(sub(previous,start),direction)));
 if(len(tangent)<.0001){
  const fallback=Math.abs(direction[1])<.94?[0,1,0]:[1,0,0];
  tangent=sub(fallback,mul(direction,dot(fallback,direction)));
 }
 tangent=mul(tangent,1/len(tangent));
 const forward=(distance*distance+u*u-v*v)/(2*distance),
  side=Math.sqrt(Math.max(0,u*u-forward*forward)),
  elbow=add(start,add(mul(direction,forward),mul(tangent,side)));
 return {start:[...start],joint:elbow,end:target,upper:u,lower:v,clamped:Math.abs(distance-actual)>.004};
}
export function smoothYaw(current,target,dt,frequency=12){
 if(!Number.isFinite(current))return valid(target);
 const angle=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+angle*(1-Math.exp(-clamp(dt,0,.05)*Math.max(.1,frequency)));
}
export function stageFootTarget(localFoot,localToWorld,worldToLocal,{floor=0,soleRadius=.29,worldScale=1,plant=false}={}){
 // Caller supplies genuine THREE local/world transforms. Make contact
 // against the *underside* of the volume, not the mesh centre.
 const point=localToWorld([...localFoot]);
 point[1]=plant?floor+soleRadius*worldScale:Math.max(floor+soleRadius*worldScale,point[1]);
 return worldToLocal(point);
}
export function circusFootPhasing(stride,activity,side){
 const wave=stride+(side>0?Math.PI:0),motion=clamp(activity,0,1),
  travel=Math.sin(wave)*.31*motion,lift=Math.max(0,Math.cos(wave))*.23*motion;
 return {travel,lift,support:lift<.012};
}
