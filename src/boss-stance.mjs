import * as THREE from 'three';
import {bodyPose,bodyPoint,cinematicPose,handPoint,BOSS_SCALE,CINEMATIC} from './combat.mjs';

export function createBossStance(B){
  const S=BOSS_SCALE,headRig=new THREE.Group();headRig.position.set(B.HEAD.x,B.HEAD.y,B.HEAD.z);headRig.name='detachable-royal-head';
  const atHead=B.model.children.filter(c=>c.geometry?.type==='SphereGeometry'&&Math.abs(c.position.y-B.HEAD.y)<.001&&Math.abs(c.position.z-B.HEAD.z)<.001);
  if(atHead.length<1)throw new Error('Boss head mesh missing');
  B.model.add(headRig);
  for(const c of [...atHead,...B.eyes]){B.model.remove(c);c.position.x-=B.HEAD.x;c.position.y-=B.HEAD.y;c.position.z-=B.HEAD.z;headRig.add(c);}
  const pivot=new THREE.Group();pivot.position.set(0,1.5*S,-1.5*S);pivot.scale.setScalar(S);
  const legSet=new Set(B.legs.map(L=>L.g));const parts=B.model.children.filter(c=>!legSet.has(c)&&c!==B.swordGroup);
  B.model.add(pivot);
  for(const c of parts){B.model.remove(c);c.position.y-=1.5;c.position.z+=1.5;pivot.add(c);}
  const armour=new THREE.MeshStandardMaterial({color:0x272a32,roughness:.48,metalness:.65});
  const gold=new THREE.MeshStandardMaterial({color:0xb99653,roughness:.4,metalness:.75});
  const cloth=new THREE.MeshStandardMaterial({color:0x4d1521,roughness:.95,side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const p=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),armour);p.position.set(side*1.5,1.15,2.25);p.scale.set(1.1,.65,1.3);pivot.add(p);
    const trim=new THREE.Mesh(new THREE.TorusGeometry(.9,.07,6,24),gold);trim.position.copy(p.position);trim.rotation.y=side*.7;pivot.add(trim);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(1.15,2.7,.12),cloth);panel.position.set(side*.65,-.25,-.45);panel.rotation.z=side*.12;pivot.add(panel);
  }
  for(let i=0;i<4;i++){
    const plate=new THREE.Mesh(new THREE.BoxGeometry(1.75-i*.15,.42,.32),armour);plate.position.set(0,1.0-i*.43,3.15);pivot.add(plate);
    const ridge=new THREE.Mesh(new THREE.BoxGeometry(.1,.4,.37),gold);ridge.position.copy(plate.position);pivot.add(ridge);
  }
  for(let i=0;i<5;i++){
    const tooth=new THREE.Mesh(new THREE.ConeGeometry(.08,.45+(i%2)*.15,5),gold);tooth.position.set((i-2)*.22,.9,.1);headRig.add(tooth);
  }
  const unit=new THREE.CylinderGeometry(1,1,1,10),jointGeo=new THREE.SphereGeometry(.18,10,8),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3();
  function chain(count,material,radii){
    const g=new THREE.Group();B.model.add(g);
    const bones=radii.map(r=>{const m=new THREE.Mesh(unit,material);m.userData.r=r;g.add(m);return m;});
    const joints=Array.from({length:count},()=>{const m=new THREE.Mesh(jointGeo,gold);g.add(m);return m;});return {g,bones,joints};
  }
  function solve(c,points){for(let i=0;i<c.bones.length;i++){const a=points[i],b=points[i+1],m=c.bones[i];v.set(b.x-a.x,b.y-a.y,b.z-a.z);m.position.set(a.x+v.x/2,a.y+v.y/2,a.z+v.z/2);m.scale.set(m.userData.r,v.length(),m.userData.r);m.quaternion.setFromUnitVectors(up,v.normalize());c.joints[i].position.set(b.x,b.y,b.z);}}
  const supports=B.legs.filter(L=>L.plan.k===3).map(L=>({L,...chain(3,armour,[.34,.28,.2])}));
  const arms=B.legs.filter(L=>L.plan.k===0).map(L=>({L,...chain(2,armour,[.28,.23])}));
  const cinema=document.createElement('div');cinema.setAttribute('aria-live','polite');
  Object.assign(cinema.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'15',display:'none',borderTop:'7vh solid #000',borderBottom:'7vh solid #000'});
  const caption=document.createElement('p');Object.assign(caption.style,{position:'absolute',bottom:'8%',width:'100%',maxWidth:'none',textAlign:'center',fontSize:'24px',color:'#e9d3a0',textShadow:'0 2px 5px #000'});cinema.appendChild(caption);document.getElementById('arena').appendChild(cinema);
  let detached=false;
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  return {update(b){
    const q=bodyPose(b),c=cinematicPose(b);pivot.rotation.x=q.angle;pivot.position.y=(1.5+q.lift)*S;
    B.model.position.y=0;B.model.scale.setScalar(1);if(b.state!=='dead')B.model.rotation.set(0,0,0);
    const shouldDetach=c.detach>0;
    if(shouldDetach&&!detached){pivot.remove(headRig);B.swordGroup.add(headRig);detached=true;}
    else if(!shouldDetach&&detached){B.swordGroup.remove(headRig);pivot.add(headRig);detached=false;}
    if(detached){headRig.scale.setScalar(S);headRig.position.set(0,-1.0*S,-.5*S);headRig.rotation.set(-Math.PI/2,0,0);}
    else{headRig.scale.setScalar(1);headRig.rotation.set(0,0,0);headRig.position.set(B.HEAD.x,B.HEAD.y-1.5,B.HEAD.z+1.5);}
    cinema.style.display=b.state==='transition'?'block':'none';
    if(b.state==='transition')caption.textContent=b.t<1.8?'긴턱의 왕, 이권재':b.t<2.9?'왕이 자신의 검을 취한다':b.t<3.8?'머리는 검이 되고':'두 번째 시련 — 왕검';
    for(const L of B.legs){const p=bodyPoint(b,{x:L.plan.root[0],y:L.plan.root[1],z:L.plan.root[2]});L.g.position.set(p.x,p.y,p.z);L.g.scale.setScalar(S);L.g.rotation.x=-.45*q.standing;L.g.rotation.z=-L.plan.side*1.15*q.standing;if(L.plan.k!==3)L.g.rotation.y=L.baseYaw*(1-q.standing)+L.plan.side*.65*q.standing;}
    for(const R of supports){const s=q.standing,side=R.L.plan.side;R.g.visible=s>0;R.L.g.visible=s===0;const root=bodyPoint(b,{x:side*1.15,y:2,z:-1.6});solve(R,[root,{x:side*2.2,y:2.2,z:-1.4},{x:side*1.9,y:.9,z:-2.8},{x:side*1.8,y:.06,z:-3.5}]);}
    const head=bodyPoint(b,B.HEAD);
    for(const R of arms){const side=R.L.plan.side;R.g.visible=c.reach>0;R.L.g.visible=c.reach===0;
      const shoulder=bodyPoint(b,{x:side*1.4,y:2.6,z:1.1}),grip=handPoint(b,side);
      const reach={x:head.x+side*.55,y:head.y-.3,z:head.z+.4},rest={x:shoulder.x+side*.8,y:shoulder.y-1.2,z:shoulder.z+.5};
      const target=lerp(lerp(rest,reach,c.reach),grip,c.detach);
      solve(R,[shoulder,{x:shoulder.x+side*1.0,y:(shoulder.y+target.y)/2-.55,z:(shoulder.z+target.z)/2-.5},target]);
    }
  }};
}
