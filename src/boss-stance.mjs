import * as THREE from 'three';
import {bodyPose,bodyPoint} from './combat.mjs';

export function createBossStance(B){
  const pivot=new THREE.Group();pivot.position.set(0,1.5,-1.5);
  const legSet=new Set(B.legs.map(L=>L.g));
  const parts=B.model.children.filter(c=>!legSet.has(c)&&c!==B.swordGroup);
  B.model.add(pivot);
  for(const c of parts){B.model.remove(c);c.position.y-=1.5;c.position.z+=1.5;pivot.add(c);}
  const unit=new THREE.CylinderGeometry(1,1,1,8),jointGeo=new THREE.SphereGeometry(.17,10,8);
  const rear=B.legs.filter(L=>L.plan.k===3).map(L=>{
    const group=new THREE.Group();B.model.add(group);
    const bones=[.23,.18,.12].map(r=>{const m=new THREE.Mesh(unit,B.carapace);m.userData.r=r;group.add(m);return m;});
    const joints=[0,1,2].map(()=>{const m=new THREE.Mesh(jointGeo,B.joint);group.add(m);return m;});
    return {L,group,bones,joints};
  });
  const up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),mid=new THREE.Vector3();
  return {update(b){
    const q=bodyPose(b);pivot.rotation.x=q.angle;pivot.position.y=1.5+q.lift;
    B.model.position.y=0;B.model.scale.setScalar(1);if(b.state!=='dead')B.model.rotation.set(0,0,0);
    for(const L of B.legs){
      const p=bodyPoint(b,{x:L.plan.root[0],y:L.plan.root[1],z:L.plan.root[2]});
      L.g.position.set(p.x,p.y,p.z);L.g.rotation.x=-.45*q.standing;L.g.rotation.z=-L.plan.side*1.15*q.standing;
      if(L.plan.k!==3)L.g.rotation.y=L.baseYaw*(1-q.standing)+L.plan.side*.65*q.standing;
    }
    for(const R of rear){
      const s=q.standing,side=R.L.plan.side;
      R.group.visible=s>0;R.L.g.visible=s===0;
      const root=bodyPoint(b,{x:side*1.15,y:2,z:-1.6});
      const points=[root,{x:side*(2.0-.35*s),y:1.5,z:-1.0},{x:side*1.35,y:.65,z:-1.9},{x:side*1.3,y:.04,z:-2.5}];
      for(let i=0;i<3;i++){
        const a=points[i],p=points[i+1],m=R.bones[i];v.set(p.x-a.x,p.y-a.y,p.z-a.z);
        mid.set(a.x+v.x/2,a.y+v.y/2,a.z+v.z/2);m.position.copy(mid);m.scale.set(m.userData.r,v.length(),m.userData.r);m.quaternion.setFromUnitVectors(up,v.normalize());
        R.joints[i].position.set(p.x,p.y,p.z);
      }
    }
  }};
}
