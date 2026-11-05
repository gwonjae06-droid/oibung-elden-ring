// Physical (x,y,z) hit silhouettes for Kwon. The root is a locomotion pivot;
// his tilted abdomen, armour, and detached head do not follow that pivot's circle.
// Collision is resolved against swept weapon/projectile segments, not proximity.
const EPS=1e-8;
const DEFAULT_SKIN=.12;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function toWorld(b,local){
 const yaw=finite(b.yaw)?b.yaw:0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:b.x+local.x*c+local.z*s,y:local.y,z:b.z+local.z*c-local.x*s};
}
export function kwonHurtShapes(b,{point,angle=0,scale=1.4,headAttached=true}={}){
 const ellipsoid=(id,local,rx,ry,rz)=>{
  const w=toWorld(b,point(local));
  return {id,x:w.x,y:w.y,z:w.z,rx,ry,rz,yaw:b.yaw};
 };
 const c=Math.cos(angle),s=Math.sin(angle);
 // The abdomen's actual authored mesh is scaled .82/.90/.72 by the knight
 // armour pass. Previous hitbox ignored this and extended into empty space.
 const abdomenY=1.785*.9,abdomenZ=2.625*.72;
 const chestY=1.2*.88,chestZ=1.5*.85;
 const tilt=(y,z)=>({
  ry:Math.hypot(y*c,z*s)*scale,
  rz:Math.hypot(z*c,y*s)*scale
 });
 const abdomen=tilt(abdomenY,abdomenZ),chest=tilt(chestY,chestZ);
 const shapes=[
  ellipsoid('abdomen',{x:0,y:2.1,z:-1.5},2.1*.82*scale,abdomen.ry,abdomen.rz),
  ellipsoid('chest',{x:0,y:2.1,z:.8},1.5*scale,chest.ry,chest.rz)
 ];
 if(headAttached)shapes.push(ellipsoid('head',{x:0,y:2.75,z:1.75},1.12*scale,1.12*scale,1.12*scale));
 return shapes;
}
function localDelta(shape,p){
 const dx=p.x-shape.x,dz=p.z-shape.z,yaw=finite(shape.yaw)?shape.yaw:0,
  c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:dx*c-dz*s,y:p.y-shape.y,z:dx*s+dz*c};
}
function normalizedPoint(shape,p,pad=0){
 const d=localDelta(shape,p);
 return {x:d.x/(shape.rx+pad),y:d.y/(shape.ry+pad),z:d.z/(shape.rz+pad)};
}
function segmentEllipsoidEntry(a,b){
 const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,
  A=dx*dx+dy*dy+dz*dz,
  B=2*(a.x*dx+a.y*dy+a.z*dz),
  C=a.x*a.x+a.y*a.y+a.z*a.z-1;
 if(C<=0)return {t:0,depth:Math.sqrt(Math.max(0,C+1))};
 if(A<EPS)return null;
 const delta=B*B-4*A*C;if(delta<0)return null;
 const t=(-B-Math.sqrt(delta))/(2*A);
 if(t<0||t>1)return null;
 return {t,depth:1};
}
function toShapeContact(shape,p){
 // Project a ray from the ellipsoid centre through the impact onto its skin.
 const d=localDelta(shape,p),u=Math.hypot(d.x/shape.rx,d.y/shape.ry,d.z/shape.rz);
 const factor=u>EPS?1/u:0,x=d.x*factor,y=d.y*factor,z=d.z*factor,
  yaw=finite(shape.yaw)?shape.yaw:0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:shape.x+x*c+z*s,y:shape.y+y,z:shape.z+z*c-x*s,part:shape.id};
}
export function kwonProjectileContact(shapes,from,to,{padding=DEFAULT_SKIN}={}){
 if(!Array.isArray(shapes)||!from||!to||!['x','z'].every(k=>finite(from[k])&&finite(to[k])))return null;
 let best=null,first=Infinity,bestDepth=Infinity;
 for(const shape of shapes){
  // Legacy shape-only probes without a y coordinate use the shape's own
  // midsection. All real projectiles pass explicit physical flight height.
  const a=normalizedPoint(shape,{...from,y:finite(from.y)?from.y:shape.y},padding);
  const b=normalizedPoint(shape,{...to,y:finite(to.y)?to.y:shape.y},padding);
  const hit=segmentEllipsoidEntry(a,b);if(!hit)continue;
  if(hit.t>first+EPS||Math.abs(hit.t-first)<=EPS&&hit.depth>=bestDepth)continue;
  first=hit.t;bestDepth=hit.depth;
  const point={x:from.x+(to.x-from.x)*hit.t,y:finite(from.y)&&finite(to.y)?from.y+(to.y-from.y)*hit.t:shape.y,
   z:from.z+(to.z-from.z)*hit.t};
  best=toShapeContact(shape,point);
 }
 return best;
}
export function kwonMeleeContact(shapes,p,{reach=0,yaw=0,height=1.55,bladeRadius=.20}={}){
 if(!finite(reach)||reach<=0||!finite(yaw)||!finite(p?.x)||!finite(p?.z))return null;
 // The player's rendered blade spans ~2m beyond the grip. Its horizontal
 // swing is a NARROW swept corridor in the facing direction, not a full
 // radius around the player or a 143-degree aim cone.
 const dx=Math.sin(yaw),dz=Math.cos(yaw);
 const start={x:p.x+dx*.18,y:height,z:p.z+dz*.18},
  tip={x:p.x+dx*reach,y:height,z:p.z+dz*reach};
 return kwonProjectileContact(shapes,start,tip,{padding:bladeRadius});
}
// Legacy helper kept for existing diagnostic callers; gameplay uses
// kwonMeleeContact with a directional blade segment.
export function kwonHurtContact(shapes,p,{reach=0,yaw=null}={}){
 if(yaw!==null)return kwonMeleeContact(shapes,p,{reach,yaw});
 let best=null,closest=Infinity;
 for(const shape of shapes){
  const aim=Math.atan2(shape.x-p.x,shape.z-p.z);
  const hit=kwonMeleeContact([shape],p,{reach,yaw:aim});
  if(hit){const d=distance(hit,p);if(d<closest){closest=d;best=hit;}}
 }
 return best;
}
