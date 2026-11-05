// Arena-space silhouettes for Kwon's transforming model. The boss's root
// is at his locomotion pivot, NOT at his abdomen or the face visible to players.
// The horizontal projection is a union of anatomical ellipses, not one giant
// circular area centred on the root.
const RAD=1e-8, MARGIN=.12;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

function toWorld(b,local){
 const yaw=Number.isFinite(b.yaw)?b.yaw:0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:b.x+local.x*c+local.z*s,y:local.y,z:b.z+local.z*c-local.x*s};
}
export function kwonHurtShapes(b,{point,angle=0,scale=1.4,headAttached=true}){
 const ellipsoid=(id,local,rx,rz)=>{
  const w=toWorld(b,point(local));
  return {id,x:w.x,y:w.y,z:w.z,rx,rz,yaw:b.yaw};
 };
 // The abdomen is a large, forward-facing ellipsoid with its physical centre
 // behind the motion root. Tilting in phase 2 compresses its horizontal depth.
 const c=Math.cos(angle),s=Math.sin(angle);
 const shapes=[
  ellipsoid('abdomen',{x:0,y:2.1,z:-1.5},
   2.1*scale,Math.hypot(2.625*c,1.785*s)*scale),
  ellipsoid('chest',{x:0,y:2.1,z:.8},
   1.5*scale,Math.hypot(1.5*c,1.2*s)*scale)
 ];
 if(headAttached)shapes.push(ellipsoid('head',{x:0,y:2.75,z:1.75},1.12*scale,1.12*scale));
 return shapes;
}
function localDelta(shape,p){
 const dx=p.x-shape.x,dz=p.z-shape.z,yaw=Number.isFinite(shape.yaw)?shape.yaw:0;
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:dx*c-dz*s,z:dx*s+dz*c};
}
function ellipseDistance(shape,p,radius=0){
 const d=localDelta(shape,p),rx=shape.rx+radius,rz=shape.rz+radius;
 return Math.hypot(d.x/rx,d.z/rz);
}
function nearestSurface(shape,p){
 const d=localDelta(shape,p),u=Math.hypot(d.x/shape.rx,d.z/shape.rz);
 // Return the nearest point on the visible silhouette along the incoming ray.
 const factor=u>RAD?1/u:0;
 const x=d.x*factor,z=d.z*factor,yaw=Number.isFinite(shape.yaw)?shape.yaw:0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:shape.x+x*c+z*s,y:shape.y,z:shape.z+z*c-x*s};
}
export function kwonHurtContact(shapes,p,{reach=0,yaw=null}={}){
 let best=null,score=Infinity;
 for(const shape of shapes){
  const metric=ellipseDistance(shape,p,reach);
  if(metric>1+MARGIN/Math.max(shape.rx,shape.rz))continue;
  // Attacks have a facing requirement; this is evaluated against the actual
  // silhouette, not the locomotion pivot far behind the chest.
  const heading=Math.atan2(shape.x-p.x,shape.z-p.z);
  const aiming=yaw===null||Math.abs(Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw)))<1.25;
  if(!aiming)continue;
  const contact=nearestSurface(shape,p);
  const d=distance(contact,p);
  if(d<score){score=d;best={...contact,part:shape.id};}
 }
 return best;
}
function normalizedPoint(shape,p,extra=0){
 const d=localDelta(shape,p);return {x:d.x/(shape.rx+extra),z:d.z/(shape.rz+extra)};
}
function segmentEllipseEntry(a,b){
 const dx=b.x-a.x,dz=b.z-a.z,aa=dx*dx+dz*dz,bb=2*(a.x*dx+a.z*dz),
  cc=a.x*a.x+a.z*a.z-1;
 if(cc<=0)return {t:0,depth:Math.hypot(a.x,a.z)};
 if(aa<RAD)return null;
 const delta=bb*bb-4*aa*cc;if(delta<0)return null;
 const t=(-bb-Math.sqrt(delta))/(2*aa);
 if(t<0||t>1)return null;
 return {t,depth:1};
}
export function kwonProjectileContact(shapes,from,to){
 let best=null,first=Infinity,bestDepth=Infinity;
 for(const shape of shapes){
  const a=normalizedPoint(shape,from,MARGIN),b=normalizedPoint(shape,to,MARGIN);
  const entry=segmentEllipseEntry(a,b);
  if(!entry)continue;
  // The first intersected physical part wins. If a shot begins inside
  // overlapping parts, report the more central body part, not whichever
  // primitive happens to be first in the array.
  if(entry.t>first+RAD||Math.abs(entry.t-first)<RAD&&entry.depth>=bestDepth)continue;
  first=entry.t;bestDepth=entry.depth;
  const p={x:from.x+(to.x-from.x)*entry.t,z:from.z+(to.z-from.z)*entry.t};
  best={...nearestSurface(shape,p),part:shape.id};
 }
 return best;
}
