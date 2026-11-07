// Shared, deterministic hurt regions derived from each boss' authored model
// dimensions and the same phase/pose data used by its visual rig. No Three.js
// dependency: combat and browser draw the same simulation-time silhouette.
import {headFrame} from './clown-visual-data.mjs';
import {clownBeastPose} from './clown-beast-pose.mjs';
import {clownSpectaclePose} from './clown-spectacle-pose.mjs';
import {cartoonPose} from './clown-cartoon.mjs';
import {bloodTransformation} from './blood-transformation.mjs';

const CLOWN_SCALE=1.25;
const PHASE_MOUNT_SCALE=Math.cbrt(2)*1.5;
const finite=x=>Number.isFinite(x);
const rotate=(b,p)=>{
 const a=finite(b.yaw)?b.yaw:0,c=Math.cos(a),s=Math.sin(a);
 return {x:b.x+p.x*c+p.z*s,z:b.z+p.z*c-p.x*s,y:p.y};
};
const ellipsoid=(b,id,p,rx,ry,rz)=>{
 const q=rotate(b,p);return {...q,id,rx,ry,rz,yaw:b.yaw||0};
};
export function clownHurtShapes(g){
 if(!g?.clown||!g.boss)return [];
 const b=g.boss,v=g.clown.vis||{},F=headFrame(g),M=F.mount,Q=clownBeastPose(g),
  A=clownSpectaclePose(g,cartoonPose(g.clown.name,g.clown.pt,b.phase,g.clown.state==='pattern'&&b.state!=='transition'&&g.status==='playing')),
  jump=(v.jump||0)*1.1,shapes=[];
 if(b.phase===2){
  // Upright by default, briefly pitched for the authored crawl attacks.
  // The old spherical mount is now an independently grounded stage prop.
  const sy=Math.cos(Q.pitch),sz=Math.sin(Q.pitch),base=Q.bodyHeight;
  shapes.push(ellipsoid(b,'torso',{x:0,y:(base+2.25*sy+jump)*CLOWN_SCALE,z:2.25*sz*CLOWN_SCALE},
   1.12*CLOWN_SCALE,1.02*CLOWN_SCALE,1.33*CLOWN_SCALE));
  shapes.push(ellipsoid(b,'head',{x:0,y:(base+4.7*sy+jump)*CLOWN_SCALE,z:4.7*sz*CLOWN_SCALE},
   .96*CLOWN_SCALE,1.05*CLOWN_SCALE,.94*CLOWN_SCALE));
  if(Q.entry>.16)for(const side of [-1,1]){
   const z=1.95*Math.cos(Q.pitch)+2.7*Math.sin(Q.pitch);
   shapes.push(ellipsoid(b,side<0?'left-paw':'right-paw',
    {x:side*1.65*CLOWN_SCALE,y:(.9+jump)*CLOWN_SCALE,z:z*CLOWN_SCALE},
    .52*CLOWN_SCALE*Q.entry,.48*CLOWN_SCALE,.63*CLOWN_SCALE*Q.entry));
  }
  return shapes;
 }
 if(b.phase===1){
  // Original balance ball: radius 2.6, centred 2.6m above the ground.
  shapes.push(ellipsoid(b,'ball',{x:0,y:(2.6+jump)*CLOWN_SCALE,z:M?.ballZ||0},
   2.6*CLOWN_SCALE,2.6*CLOWN_SCALE,2.6*CLOWN_SCALE));
 }
 if(M?.visible){
  // Inflated, rideable detached clown head, using the same morph and scale
  // that actor.update applies. Body parts stay above it; no phantom ground torso.
  const scale=PHASE_MOUNT_SCALE*CLOWN_SCALE*2.6*(A.headScale||1);
  const lift=2.6*PHASE_MOUNT_SCALE*((A.headScale||1)-1);
  shapes.push(ellipsoid(b,'mount-head',
   {x:0,y:(M.y+lift+jump)*CLOWN_SCALE,z:M.z||0},
   .84*scale,1.02*scale,.88*scale*(1+Math.max(0,v.neck||0)*.25)));
 }
 // The clown's actual shoulders and head rise well above the ground ball.
 // Modifiers affect the torso rather than inflating the entire ground hitbox.
 const rise=M?2.6*M.scale*((A.headScale||1)-1):0;
 const bodyBase=(M?M.bodyY+M.lift:5.2)+rise+(A.lift||0);
 const bodyY=(bodyBase+2.25-(v.crouch||0)*.25)*CLOWN_SCALE;
 const bodyS=A.bodyX||1,vertical=A.bodyY||1,depth=A.bodyZ||1;
 shapes.push(ellipsoid(b,'torso',{x:0,y:bodyY+jump*CLOWN_SCALE,z:0},
  1.05*CLOWN_SCALE*bodyS,1.28*CLOWN_SCALE*vertical,.83*CLOWN_SCALE*depth));
 if(F.bodyHead){
  const p={...F},inflate=F.inflate??1;
  const size=(inflate||1)*(A.headScale||1);
  const neckY=4.7+(size-1)*.8-(v.crouch||0)*.25;
  const headY=(bodyBase+neckY*vertical+jump)*CLOWN_SCALE;
  shapes.push(ellipsoid(b,'head',{x:0,y:headY,z:0},
   .84*CLOWN_SCALE*size*bodyS,1*CLOWN_SCALE*size*vertical,.88*CLOWN_SCALE*size*depth));
 }
 return shapes;
}
export function clownAimPart(g){
 const parts=clownHurtShapes(g);
 return parts.find(s=>s.id==='mount-head')||parts.find(s=>s.id==='ball')||parts[0]||g?.boss;
}

export function bloodHurtShapes(g){
 if(!g?.blood||!g.boss)return [];
 const b=g.boss,scale=1.25,elevation=g.blood.elevation||0,
  postureY=(b.state==='pattern'?.08:0),headDissolve=bloodTransformation(g).dissolve;
 const at=(id,x,y,z,rx,ry,rz)=>ellipsoid(b,id,{x:x*scale,y:elevation+y*scale,z:z*scale},rx*scale,ry*scale,rz*scale);
 // Actual tailored robe is a lathe reaching the ground, with a narrow waist,
 // chest pauldron, and distinct face. They aren't one ground-level circle.
 const parts=[
  at('robe',0,1.15,0,1.31,1.18,1.22),
  at('abdomen',0,2.25,0,1.06,.88,.86),
  at('chest',0,3.09+postureY,0,1.0,.82,.78),
  at('left-arm',-1.12,2.65,.05,.58,.9,.55),
  at('right-arm',1.12,2.65,.05,.58,.9,.55),
  at('left-leg',-.46,.65,.12,.3,.67,.32),
  at('right-leg',.46,.65,.12,.3,.67,.32)
 ];
 if(headDissolve<.85)parts.push(at('head',0,4.6,0,.74,.99,.72));
 if(headDissolve>.02){
  // The phase-two crimson core is small and high, not an invisible
  // ground cylinder; low attacks cannot hit it while airborne.
  parts.push(at('blood-core',0,4.7,0,.53,.53,.53));
 }
 return parts;
}
export const bloodAimPart=g=>bloodHurtShapes(g).find(x=>x.id==='chest')||g?.boss;
