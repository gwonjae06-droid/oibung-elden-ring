import {clownMutationPose} from './clown-nightmare-mutation.mjs';
// Anatomical uncanny-valley additions to the existing articulated clown.
// The photograph-covered face remains visible; these are thin deformable
// brow sockets, teeth, split makeup and ragged shadow appendages, not armor.
export function createClownNightmareAnatomy(T,{body,head,mount}){
 const skin=new T.MeshStandardMaterial({color:0x38252c,roughness:.93,transparent:true,opacity:0,side:T.DoubleSide});
 const scar=new T.MeshStandardMaterial({color:0x7d2439,roughness:.81,transparent:true,opacity:0,emissive:0x280309});
 const pearl=new T.MeshStandardMaterial({color:0xd0c1a7,roughness:.5,transparent:true,opacity:0});
 const pupil=new T.MeshStandardMaterial({color:0x09080e,roughness:.16,transparent:true,opacity:0});
 const porcelain=new T.MeshStandardMaterial({color:0xbfb7b4,roughness:.69,metalness:.03,transparent:true,opacity:0,side:T.DoubleSide});
 const groups=[],eyes=[],teeth=[],fingers=[],faceRigs=[];
 function mesh(parent,geometry,mat,name,x=0,y=0,z=0){
  const m=new T.Mesh(geometry,mat);m.name=name;m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
 }
 function face(root,name){
  const g=new T.Group();g.name=name;root.add(g);groups.push(g);
  const eyeGeo=new T.TorusGeometry(.175,.034,6,22),pupilGeo=new T.SphereGeometry(.1,10,8);
  for(const s of [-1,1]){
   const eye=mesh(g,eyeGeo,skin,'unblinking-unequal-eye',s*.34,.18,.868);
   eye.scale.set(s<0?1:1.18,s<0?.82:1.48,1);eye.rotation.z=s*.19;eyes.push(eye);
   const dot=mesh(g,pupilGeo,pupil,'independent-lifeless-pupil',s*.34,.17,.897);
   dot.scale.set(.65,.88,.23);eyes.push(dot);
  }
  const mouth=mesh(g,new T.TorusGeometry(.35,.025,5,28,Math.PI),scar,'too-wide-silent-smile',0,-.43,.84);
  mouth.scale.set(1.1,.65,.75);mouth.rotation.z=Math.PI;
  const toothGeo=new T.ConeGeometry(.037,.18,5);
  for(let i=0;i<9;i++){
   const x=(i-4)*.072;
   const t=mesh(g,toothGeo,pearl,'porcelain-teeth-'+i,x,-.49+Math.abs(i-4)*.016,.884);
   t.rotation.z=i%2?.18:-.18;t.rotation.x=Math.PI/8;teeth.push(t);
  }
  const tear=mesh(g,new T.PlaneGeometry(.043,.33),scar,'paint-soaked-flesh-tear',.47,-.12,.75);
  tear.rotation.z=.23;
  // The peeling porcelain layer exposes the original textured face beneath.
  const cheeks=[],maskGeo=new T.SphereGeometry(.5,12,8);
  for(const sign of[-1,1]){
   const hinge=new T.Group();hinge.name='peeling-porcelain-cheek';hinge.position.set(sign*.48,-.08,.68);g.add(hinge);
   const plate=mesh(hinge,maskGeo,porcelain,'detached-hollow-mask-half',sign*.1,0,0);
   plate.scale.set(.58,.95,.21);
   const crack=mesh(hinge,new T.BoxGeometry(.025,.58,.025),scar,'moving-face-fissure',-sign*.26,-.08,.16);
   crack.rotation.z=sign*.17;cheeks.push(hinge);
  }
  const jaw=new T.Group();jaw.name='unhinging-jaw';jaw.position.set(0,-.55,.82);g.add(jaw);
  const lip=mesh(jaw,maskGeo,skin,'moving-unnatural-lower-lip',0,-.08,0);
  lip.scale.set(1.04,.27,.18);
  const jawLine=mesh(jaw,new T.TorusGeometry(.43,.032,5,22,Math.PI),scar,'mouth-curvature',0,.05,.1);
  jawLine.rotation.z=Math.PI;
  faceRigs.push({group:g,cheeks,jaw,mouth});
 }
 face(head.group,'clown-original-face-anomaly');
 face(mount.group,'clown-enlarged-face-anomaly');
 // A moving split costume resembles black puppet limbs only in the silhouette;
 // these never extend the gameplay hurtboxes.
 const ragMat=new T.MeshStandardMaterial({color:0x351923,roughness:.98,side:T.DoubleSide,transparent:true,opacity:0});
 const twistGeo=new T.CylinderGeometry(.10,.04,2.1,6);
 for(let i=0;i<4;i++){
  const base=new T.Group();base.name='puppet-shadow-appendage';base.position.set((i-1.5)*.32,2.45,-.68);body.add(base);
  const strip=mesh(base,twistGeo,ragMat,'ribbon-not-a-collision-limb',0,-.76,-.47);
  strip.rotation.z=(i-1.5)*.39;strip.rotation.x=-.28;
  const tip=mesh(base,new T.ConeGeometry(.17,.62,5),skin,'bent-finger-silhouette',0,-1.76,-.65);
  tip.rotation.z=i%2?.28:-.22;
  fingers.push(base);
 }
 let blend=0,lastClock=null;
 function update(g,time=0,reduced=false){
  const t=Number.isFinite(time)?time:0,active=g?.status==='playing',pose=clownMutationPose(g,t),
   stage=pose.stage,attack=pose.pattern;
  if(lastClock===null||t<lastClock)blend=pose.anger;
  else blend+=(pose.anger-blend)*(1-Math.exp(-Math.min(.06,t-lastClock)*8));
  lastClock=t;
  const amount=active?(stage===3?1:stage===2?.69:.2):0,morph=active?blend:0;
  skin.opacity=.77*amount;scar.opacity=.84*amount;
  pupil.opacity=.75*amount;pearl.opacity=.94*amount;ragMat.opacity=.67*amount;
  porcelain.opacity=pose.maskSplit*.74*amount;
  const grotesque=pose.skeletalFold>.32||attack==='livingShadow'||attack==='wrongTwin';
  for(let i=0;i<eyes.length;i++){
   const e=eyes[i],side=i%4<2?-1:1,pupilPoint=i%2===1;
   e.position.y=(pupilPoint?.17:.18)+(reduced?0:.02*Math.sin(t*(pupilPoint?2.1:1.6)+i))*amount;
   e.position.x=side*.34+(pupilPoint?pose.gaze*.2:0)*amount;
   if(!pupilPoint)e.scale.y=(side<0?.82:1.48)*(1+pose.eyeAsymmetry*(side<0?-.17:.37));
   if(pupilPoint)e.scale.y=.88*(1+pose.eyeAsymmetry*(side<0?.15:-.28));
   e.rotation.z=pupilPoint?0:(grotesque&&!reduced?Math.sin(t*16+i)*.07*amount:side*.19);
  }
  for(const f of faceRigs){
   const opening=pose.jaw*amount;
   f.jaw.position.y=-.55-opening*.4;f.jaw.rotation.x=opening*.28;
   f.jaw.scale.y=1+opening*.35;
   f.mouth.scale.set(1.1+pose.smile*.85,.65+opening*.66,.75);
   for(const [i,cheek] of f.cheeks.entries()){
    const sign=i===0?-1:1;
    cheek.rotation.y=sign*(.05+pose.maskSplit*.68);
    cheek.rotation.z=sign*pose.maskSplit*.25;
    cheek.position.x=sign*(.48+pose.maskSplit*.09);
   }
   f.group.rotation.z=(reduced?0:Math.sin(t*2.4)*.028)*morph;
  }
  for(let i=0;i<teeth.length;i++){
   const ti=i%9,twist=reduced?0:Math.sin(t*3+ti)*.09;
   teeth[i].rotation.z=(ti%2?.18:-.18)+twist*amount;
   teeth[i].position.y=-.49+Math.abs(ti-4)*.016-pose.jaw*.16;
   teeth[i].scale.y=1+pose.smile*(ti%2?.43:.11);
  }
  for(let i=0;i<fingers.length;i++){
   const f=fingers[i],sign=i%2?1:-1;
   f.rotation.z=(i-1.5)*.13+sign*pose.shadowArms*.62+(reduced?0:Math.sin(t*1.4+i)*.13)*amount;
   f.rotation.x=(stage===3?.24:.05)+pose.skeletalFold*.8+(reduced?0:Math.sin(t*.9+i)*.12)*amount;
   f.scale.set(1+pose.skeletalFold*.22,1+pose.skeletalFold*.65,1);
  }
 }

 return {update,groupNames:groups.map(g=>g.name)};
}
