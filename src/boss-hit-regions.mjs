// Shared, deterministic hurt regions derived from each boss' authored model
// dimensions and the same phase/pose data used by its visual rig. No Three.js
// dependency: combat and browser draw the same simulation-time silhouette.
import {clownBeastPose,clownBeastPaw} from './clown-beast-pose.mjs';
import {clownContactFrame} from './clown-grounded-physics.mjs';
import {ringmasterPerformance} from './clown-ringmaster-pose.mjs';
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
 if(!g?.clown||!g?.boss)return [];
 const b=g.boss,v=g.clown.vis||{},Q=clownBeastPose(g),A=ringmasterPerformance(g),
  frame=clownContactFrame(g,A,Q),sy=Math.cos(frame.pitch),sz=Math.sin(frame.pitch),
  vertical=A.bodyY||1,lift=frame.height+Math.max(0,v.jump||0)*1.1,
  shapes=[];
 const at=(id,x,y,z,rx,ry,rz)=>{
  const py=y*vertical,wy=(lift+py*sy-z*sz)*CLOWN_SCALE,
    wz=(py*sz+z*sy)*CLOWN_SCALE;
  shapes.push(ellipsoid(b,id,{x:x*CLOWN_SCALE,y:wy,z:wz},
   rx*CLOWN_SCALE,ry*vertical*CLOWN_SCALE,rz*CLOWN_SCALE));
 };
 // Contact volumes follow actual coat, upright torso and face. The retired
 // circus sphere and photo-head are not invisible targets after removal.
 at('coat',0,1.25,0,.72,1.09,.66);
 at('torso',0,2.56,0,1.0,1.32,.73);
 const size=A.headScale||1;
 at('head',0,4.73,0,.77*size,.94*size,.63*size);
 for(const side of[-1,1])at(side<0?'left-leg':'right-leg',side*.50,.83,.08,.31,.73,.39);
 if(Q.entry>.75)for(const side of[-1,1]){
  const paw=clownBeastPaw(Q,side,0);
  at(side<0?'left-paw':'right-paw',paw[0],paw[1],paw[2],.38,.37,.43);
 }
 return shapes;
}
export function clownAimPart(g){
 const parts=clownHurtShapes(g);
 return parts.find(p=>p.id==='torso')||parts.find(p=>p.id==='coat')||parts[0]||g?.boss;
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

// Gyuwon's hit volume follows his authored suit/limbs rather than the old
// arbitrary 1.6m invisible circle. The absent second-phase head is *never*
// targetable; actual rig proportions are the source of these dimensions.
export function gyuwonHurtShapes(g){
 if(!g?.gyuwon||!g?.boss)return [];
 const b=g.boss,at=(id,x,y,z,rx,ry,rz)=>
  ellipsoid(b,id,{x,y,z},rx,ry,rz);
 const parts=[
  at('tailored-torso',0,1.96,0,.63,.88,.53),
  at('left-upper-arm',-.74,2.17,.01,.29,.53,.29),
  at('right-upper-arm',.74,2.17,.01,.29,.53,.29),
  at('left-leg',-.32,.76,0,.30,.75,.33),
  at('right-leg',.32,.76,0,.30,.75,.33)
 ];
 if(b.phase===1||(b.state==='transition'&&(g.gyuwon.t||0)<2.65))
  parts.push(at('anatomical-head',0,3.15,0,.47,.55,.48));
 return parts;
}
export const gyuwonAimPart=g=>gyuwonHurtShapes(g).find(p=>p.id==='tailored-torso')||g?.boss;
