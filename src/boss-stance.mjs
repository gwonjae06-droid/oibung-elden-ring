import * as THREE from 'three';
import {bodyPose,bodyPoint,cinematicPose,handPoint,BOSS_SCALE} from './combat.mjs';
import {createCollapseClock} from './boss-collapse.mjs';
import {bossMotion} from './boss-motion-data.mjs';
import {kwonStanceWeights,finishKwonLeg,advanceKwonGaitClock} from './kwon-leg-rig.mjs';
import {kwonTorsoRegion,createKwonTorsoRig} from './kwon-torso-rig.mjs';
export function createBossStance(B){
 const S=BOSS_SCALE,headRig=new THREE.Group();headRig.position.set(B.HEAD.x,B.HEAD.y,B.HEAD.z);headRig.name='detachable-royal-head';
 const atHead=B.model.children.filter(c=>c.geometry?.type==='SphereGeometry'&&Math.abs(c.position.y-B.HEAD.y)<.001&&Math.abs(c.position.z-B.HEAD.z)<.001);if(!atHead.length)throw new Error('Boss head mesh missing');B.model.add(headRig);
 for(const c of [...atHead,...B.eyes]){B.model.remove(c);c.position.x-=B.HEAD.x;c.position.y-=B.HEAD.y;c.position.z-=B.HEAD.z;headRig.add(c);}
 const pivot=new THREE.Group();pivot.position.set(0,1.5*S,-1.5*S);pivot.scale.setScalar(S);
 const legSet=new Set(B.legs.map(L=>L.g)),parts=B.model.children.filter(c=>!legSet.has(c)&&c!==B.swordGroup),regions=new Map(parts.map(c=>[c,kwonTorsoRegion(THREE,c,headRig,B.joint)]));B.model.add(pivot);const torso=createKwonTorsoRig(THREE,pivot,B.model);
 for(const c of parts){B.model.remove(c);c.position.y-=1.5;c.position.z+=1.5;torso.mount(c,regions.get(c));}
 for(const L of B.legs){L.deferKwonLeg=true;L.state=null;}
 const armour=new THREE.MeshStandardMaterial({color:0x272a32,roughness:.48,metalness:.65}),gold=new THREE.MeshStandardMaterial({color:0xb99653,roughness:.4,metalness:.75}),cloth=new THREE.MeshStandardMaterial({color:0x4d1521,roughness:.95,side:THREE.DoubleSide});
 const add=(geo,mat,x,y,z,region='chest')=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);torso.mount(m,region);return m;};
 for(const side of [-1,1]){add(new THREE.SphereGeometry(1,18,12),armour,side*1.5,1.15,2.25).scale.set(1.1,.65,1.3);add(new THREE.TorusGeometry(.9,.07,6,24),gold,side*1.5,1.15,2.25).rotation.y=side*.7;add(new THREE.BoxGeometry(1.15,2.7,.12),cloth,side*.65,-.25,-.45,'waist').rotation.z=side*.12;}
 for(let i=0;i<4;i++){add(new THREE.BoxGeometry(1.75-i*.15,.42,.32),armour,0,1-i*.43,3.15);add(new THREE.BoxGeometry(.1,.4,.37),gold,0,1-i*.43,3.15);}
 for(let i=0;i<5;i++){const tooth=new THREE.Mesh(new THREE.ConeGeometry(.08,.45+(i%2)*.15,5),gold);tooth.position.set((i-2)*.22,.9,.1);headRig.add(tooth);}
 const cinema=document.createElement('div');cinema.setAttribute('aria-live','polite');Object.assign(cinema.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'15',display:'none',borderTop:'7vh solid #000',borderBottom:'7vh solid #000'});
 const caption=document.createElement('p');Object.assign(caption.style,{position:'absolute',bottom:'8%',width:'100%',maxWidth:'none',textAlign:'center',fontSize:'24px',color:'#e9d3a0',textShadow:'0 2px 5px #000'});cinema.appendChild(caption);document.getElementById('arena').appendChild(cinema);
 let detached=false,lastFrame=null,lastLegClock=null;const collapse=createCollapseClock(),legClock={raw:null,phase:0},lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 return {update(b){
  const now=performance.now(),dt=lastFrame===null?0:(now-lastFrame)/1000;lastFrame=now;const death=collapse.step(b,dt,document.hidden),q=bodyPose(b),c=cinematicPose(b),m=bossMotion(b),weights=kwonStanceWeights(q.standing,c.reach,c.detach,Boolean(death));
  const stamp=[b.phase,b.state,b.pattern,b.t,b.wait,b.x,b.z,b.yaw,b.stun],frozen=Boolean(lastLegClock&&stamp.every((v,i)=>Object.is(v,lastLegClock[i])));lastLegClock=stamp;const gaitPhase=advanceKwonGaitClock(legClock,B.legs[0]?.pending?.phase,frozen);
  pivot.rotation.x=q.angle;pivot.position.y=(1.5+q.lift+m.sink)*S;B.model.position.y=death?death.sink:0;B.model.scale.setScalar(1);B.model.rotation.set(0,0,(death?death.roll:0)+m.sway);torso.update(b,m,dt);
  const shouldDetach=c.detach>0;if(shouldDetach&&!detached){headRig.parent?.remove(headRig);B.swordGroup.add(headRig);detached=true;}else if(!shouldDetach&&detached){B.swordGroup.remove(headRig);torso.chest.add(headRig);detached=false;}
  if(detached){headRig.scale.setScalar(S);headRig.position.set(0,-S,-.5*S);headRig.rotation.set(-Math.PI/2,0,0);}else{headRig.scale.setScalar(1);headRig.rotation.set(0,0,0);headRig.position.set(...torso.headPosition(B.HEAD));}
  cinema.style.display=b.state==='transition'?'block':'none';if(b.state==='transition')caption.textContent=b.t<1.8?'부서진 검의 계승자':b.t<2.9?'내게 검을 쥘 손이 없었다면…':b.t<3.8?'내 머리로라도 베겠다.':'검의 현현';
  const head=detached?bodyPoint(b,B.HEAD):torso.point(B.HEAD,'chest');
  for(const L of B.legs){
   const side=L.plan.side,front=L.plan.k===0,rear=L.plan.k===3,weight=rear?weights.rear:front?weights.front:0,shoulder=front?torso.point({x:side*1.4,y:2.6,z:1.1},'chest'):null,region=front?'chest':L.plan.k===1?'waist':'abdomen';
   let p=torso.point({x:L.plan.root[0],y:L.plan.root[1],z:L.plan.root[2]},region);if(front)p=lerp(p,shoulder,weight);
   L.g.visible=true;L.g.position.set(p.x,p.y,p.z);L.g.scale.setScalar(S);L.g.rotation.x=0;L.g.rotation.z=0;L.g.rotation.y=rear?L.baseYaw:L.baseYaw*(1-q.standing)+side*.65*q.standing;L.gaitPhase=gaitPhase;
   let target=rear&&weight>0?[side*1.8,.06,-3.5]:null,gripMode=false;
   if(front&&weight>0){const grip=handPoint(b,side),reach={x:head.x+side*.55,y:head.y-.3,z:head.z+.4},rest={x:shoulder.x+side*.8,y:shoulder.y-1.2,z:shoulder.z+.5},t=death?{x:side*.8,y:1.1,z:3.6}:lerp(lerp(rest,reach,c.reach),grip,c.detach);target=[t.x,t.y,t.z];gripMode=true;}
   finishKwonLeg(L,target,weight,gripMode,frozen);
  }
 }};
}
