// Visual-only contact and coalescence; never call from combat hit detection.
// Cathedral geometry is static. This small analytic proxy deliberately avoids
// raycasts against every high-poly stained-glass pane and wall mesh.
export const BLOOD_CONTACT=Object.freeze({
  sideX:41.5,backZ:-47.15,columnX:35.4,
  columnZ:Object.freeze([-35,-21,-7,7,21,35]),columnRadius:1.2,
  maxWallMarks:24, maxMergePairs:8
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const hypot3=(x,y,z)=>Math.hypot(x,y,z);

export function sweepBloodWall(previous,next,options=BLOOD_CONTACT){
 if(!previous||!next||![previous.x,previous.y,previous.z,next.x,next.y,next.z].every(Number.isFinite))return null;
 const dx=next.x-previous.x,dy=next.y-previous.y,dz=next.z-previous.z,
  r=clamp(next.size||previous.size||.1,.02,.4);
 let first=null;
 const offer=(t,nx,nz,type,cx=null,cz=null)=>{
  if(t<0||t>1||(first&&t>=first.t))return;
  const y=previous.y+dy*t;
  if(y<.08||y>(type==='column'?25:10.5))return;
  const x=previous.x+dx*t,z=previous.z+dz*t;
  if(type==='wall'&&Math.abs(z)>45.2)return;
  if(type==='back'&&Math.abs(x)>41.5)return;
  first={t,x,y,z,nx,nz,type,cx,cz};
 };
 for(const sign of [-1,1]){
  const face=sign*(options.sideX-r);
  if(dx*sign>0&&(previous.x-face)*sign<0&&(next.x-face)*sign>=0)offer((face-previous.x)/dx,-sign,0,'wall');
 }
 const back=options.backZ+r;
 if(dz<0&&previous.z>back&&next.z<=back)offer((back-previous.z)/dz,0,1,'back');
 // Small number of nave columns, only when a droplet actually reaches them.
 for(const sign of [-1,1])for(const cz of options.columnZ){
  const cx=sign*options.columnX,px=previous.x-cx,pz=previous.z-cz,rad=options.columnRadius+r,
    a=dx*dx+dz*dz,c=px*px+pz*pz-rad*rad;
  if(a<1e-9||c<=0)continue;
  const b=2*(px*dx+pz*dz),disc=b*b-4*a*c;
  if(disc<0)continue;
  const t=(-b-Math.sqrt(disc))/(2*a);
  if(t<0||t>1)continue;
  const nx=(px+dx*t)/rad,nz=(pz+dz*t)/rad;
  offer(t,nx,nz,'column',cx,cz);
 }
 return first;
}
export function deflectBloodAtWall(drop,hit,restitution=.22){
 if(!drop||!hit)return drop;
 const impact=drop.vx*hit.nx+drop.vz*hit.nz;
 if(impact<0){
  drop.vx=(drop.vx-(1+restitution)*impact*hit.nx)*.48;
  drop.vz=(drop.vz-(1+restitution)*impact*hit.nz)*.48;
 }
 drop.vy=Math.min(drop.vy*.38,.5);
 drop.x=hit.x+hit.nx*.035;drop.z=hit.z+hit.nz*.035;drop.y=hit.y;
 return drop;
}
// Preserve approximate volume and linear momentum when two nearby beads join.
export function mergeBloodBeads(a,b){
 if(!a||!b||a===b||a.life<=0||b.life<=0)return false;
 const massA=Math.max(.00001,a.size**3),massB=Math.max(.00001,b.size**3),total=massA+massB;
 if(Math.cbrt(total)>.37)return false;
 for(const key of ['x','y','z','vx','vy','vz']){
  a[key]=(a[key]*massA+b[key]*massB)/total;
 }
 a.size=Math.cbrt(total);
 a.life=Math.max(a.life,b.life);
 a.mergePulse=1;
 b.life=0;return true;
}
export function coalesceBloodBeads(beads,{limit=BLOOD_CONTACT.maxMergePairs,offset=0}={}){
 if(!Array.isArray(beads)||beads.length<2||limit<=0)return 0;
 const length=beads.length;let merged=0;
 for(let n=0;n<length&&merged<limit;n++){
  const i=(n+offset)%length,p=beads[i];
  if(p.life<=.2||p.quiet||p.total-p.life<.11||p.size>=.33)continue;
  for(let k=1;k<=3;k++){
   const other=beads[(i+k)%length];
   if(other.life<=.2||other.quiet||other.emitter!==p.emitter||other.total-other.life<.11)continue;
   const distance=hypot3(p.x-other.x,p.y-other.y,p.z-other.z);
   if(distance>Math.max(.08,(p.size+other.size)*1.2))continue;
   if(mergeBloodBeads(p,other)){merged++;break;}
  }
 }
 return merged;
}
