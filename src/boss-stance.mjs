import * as THREE from 'three';
import {bodyPose,bodyPoint,cinematicPose,handPoint,BOSS_SCALE,SWORD} from './combat.mjs';
import {createCollapseClock} from './boss-collapse.mjs';
import {bossMotion} from './boss-motion-data.mjs';
import {createPoseContinuity} from './boss-animation-continuity.mjs';
import {kwonStanceWeights,finishKwonLeg,advanceKwonGaitClock} from './kwon-leg-rig.mjs';
import {kwonTorsoRegion,createKwonTorsoRig} from './kwon-torso-rig.mjs';
import {collectKwonMouthParts,createKwonNeckRig} from './kwon-neck-rig.mjs';
import {installKwonKnight} from './kwon-knight-regalia.mjs';
import {createKwonLivingBlade} from './kwon-living-blade.mjs';
import {createKwonTargetView} from './kwon-target-view.mjs';
import {kwonThirdTransition,kwonThirdSwordDrive,kwonThirdBodyDrag} from './kwon-third-phase.mjs';
export function createBossStance(B){
 const S=BOSS_SCALE,headRig=new THREE.Group();headRig.position.set(B.HEAD.x,B.HEAD.y,B.HEAD.z);headRig.name='detachable-royal-head';
 const atHead=B.model.children.filter(c=>c.geometry?.type==='SphereGeometry'&&Math.abs(c.position.y-B.HEAD.y)<.001&&Math.abs(c.position.z-B.HEAD.z)<.001);if(!atHead.length)throw new Error('Boss head mesh missing');const mouth=collectKwonMouthParts(THREE,B.model.children);B.model.add(headRig);
 for(const c of new Set([...atHead,...B.eyes,...mouth])){B.model.remove(c);c.position.x-=B.HEAD.x;c.position.y-=B.HEAD.y;c.position.z-=B.HEAD.z;headRig.add(c);}
 const pivot=new THREE.Group();pivot.position.set(0,1.5*S,-1.5*S);pivot.scale.setScalar(S);
 const legSet=new Set(B.legs.map(L=>L.g)),parts=B.model.children.filter(c=>!legSet.has(c)&&c!==B.swordGroup),regions=new Map(parts.map(c=>[c,kwonTorsoRegion(THREE,c,headRig,B.joint)]));B.model.add(pivot);const torso=createKwonTorsoRig(THREE,pivot,B.model);
 for(const c of parts){B.model.remove(c);c.position.y-=1.5;c.position.z+=1.5;torso.mount(c,regions.get(c));}
 const neck=createKwonNeckRig(THREE,torso,headRig,B.HEAD,B.model);
 for(const L of B.legs){L.deferKwonLeg=true;L.state=null;}
 installKwonKnight(THREE,B,torso,headRig);
 const jawBlade=createKwonLivingBlade(THREE,B.swordGroup,{length:SWORD.length,coarse:Boolean(globalThis.matchMedia?.('(pointer:coarse)').matches)});
 const cinema=document.createElement('div');cinema.setAttribute('aria-live','polite');Object.assign(cinema.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'15',display:'none',borderTop:'7vh solid #000',borderBottom:'7vh solid #000'});
 const caption=document.createElement('p');Object.assign(caption.style,{position:'absolute',bottom:'8%',width:'100%',maxWidth:'none',textAlign:'center',fontSize:'24px',color:'#e9d3a0',textShadow:'0 2px 5px #000'});cinema.appendChild(caption);document.getElementById('arena').appendChild(cinema);
 const targetView=createKwonTargetView(THREE,B,torso,document.getElementById('arena'));
 let detached=false,lastFrame=null,lastLegClock=null;const softMotion=createPoseContinuity(),collapse=createCollapseClock(),legClock={raw:null,phase:0},lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 return {
  projectTarget(camera,locked,canvas){return targetView.project(camera,locked,canvas);},
  cameraFocus(player){return targetView.cameraFocus(player);},
  dispose(){targetView.dispose();jawBlade.dispose();cinema.remove();},
  update(b){
  targetView.update(b);
  const now=performance.now(),dt=lastFrame===null?0:(now-lastFrame)/1000;lastFrame=now;
  const death=collapse.step(b,dt,document.hidden),q=bodyPose(b),
   c=cinematicPose(b),m=bossMotion(b),drive=kwonThirdSwordDrive(b),drag=kwonThirdBodyDrag(b);
  // Keep the blade, damage markers, foot IK and head detach on the exact
  // authored timeline. Only the torso's secondary mass eases between phases.
  const soft=softMotion.step({lean:m.lean,sink:m.sink,sway:m.sway},document.hidden?0:dt,
   {owner:b,rate:m.strike>.25?28:12}),display={...m,...soft};
  // In the final act the blade leads, then the chest, waist and supporting
  // feet catch up. This is a bounded secondary rotation (never a teleport).
  display.lean=(display.lean||0)-.16*drive.pull-drag.slump*.22;
  display.sink=(display.sink||0)-.10*drive.weight-drag.slump*.17;
  display.sway=(display.sway||0)+.07*drive.lead;
  const weights=kwonStanceWeights(q.standing,c.reach,c.detach,Boolean(death));
  const stamp=[b.phase,b.state,b.pattern,b.t,b.wait,b.x,b.z,b.yaw,b.stun],frozen=Boolean(lastLegClock&&stamp.every((v,i)=>Object.is(v,lastLegClock[i])));lastLegClock=stamp;const gaitPhase=advanceKwonGaitClock(legClock,B.legs[0]?.pending?.phase,frozen);
  pivot.rotation.x=q.angle-.10*drive.pull-drag.tilt;
  pivot.position.y=(1.5+q.lift+display.sink)*S;
  B.model.position.set(drag.x,death?death.sink:drag.y,drag.z);
  B.model.scale.setScalar(1);
  B.model.rotation.set(drag.tilt*.28,0,(death?death.roll:0)+display.sway+drag.slump*.09);torso.update(b,display,dt);neck.update(b,display,dt,frozen);jawBlade.update(b,m);
  const shouldDetach=c.detach>0;if(shouldDetach&&!detached){headRig.parent?.remove(headRig);B.swordGroup.add(headRig);detached=true;}else if(!shouldDetach&&detached){B.swordGroup.remove(headRig);neck.joint.add(headRig);detached=false;}
  if(detached){headRig.scale.setScalar(S);headRig.position.set(0,-S,-.5*S);headRig.rotation.set(-Math.PI/2,0,0);}else{headRig.scale.setScalar(1);headRig.rotation.set(0,0,0);headRig.position.set(...neck.headOffset);}
  cinema.style.display=b.state==='transition'?'block':'none';
  if(b.state==='transition'){
   if(b.phase===3){
    // Image and motion alone communicate betrayal. No explanatory captions.
    caption.textContent='';
   }else caption.textContent=b.t<1.8?'부서진 검의 계승자':b.t<2.9?
    '내게 검을 쥘 손이 없었다면…':b.t<3.8?'내 머리로라도 베겠다.':'검의 현현';
  }
  const head=detached?bodyPoint(b,B.HEAD):neck.point();
  for(const L of B.legs){
   const side=L.plan.side,front=L.plan.k===0,rear=L.plan.k===3,weight=rear?weights.rear:front?weights.front:0,shoulder=front?torso.point({x:side*1.4,y:2.6,z:1.1},'chest'):null,region=front?'chest':L.plan.k===1?'waist':'abdomen';
   let p=torso.point({x:L.plan.root[0],y:L.plan.root[1],z:L.plan.root[2]},region);if(front)p=lerp(p,shoulder,weight);
   L.g.visible=true;L.g.position.set(p.x,p.y,p.z);L.g.scale.setScalar(S);L.g.rotation.x=0;L.g.rotation.z=0;L.g.rotation.y=rear?L.baseYaw:L.baseYaw*(1-q.standing)+side*.65*q.standing;L.gaitPhase=gaitPhase;
   let target=rear&&weight>0?[side*1.8,.06,-3.5]:null,gripMode=false;
   if(front&&weight>0){const grip=handPoint(b,side),reach={x:head.x+side*.55,y:head.y-.3,z:head.z+.4},rest={x:shoulder.x+side*.8,y:shoulder.y-1.2,z:shoulder.z+.5},t=death?{x:side*.8,y:1.1,z:3.6}:lerp(lerp(rest,reach,c.reach),grip,c.detach);if(b.phase===3){
      target=[side*(.75+.13*drag.slump),Math.max(.18,1.1-drag.slump*.72),
       -.8-1.7*drag.slump];gripMode=false;
     }else{target=[t.x,t.y,t.z];gripMode=true;}
    }
   finishKwonLeg(L,target,weight,gripMode,frozen);
  }
 }};
}
