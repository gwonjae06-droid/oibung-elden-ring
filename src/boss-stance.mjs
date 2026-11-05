import * as THREE from 'three';
import {bodyPose,bodyPoint,cinematicPose,handPoint,BOSS_SCALE} from './combat.mjs';
import {createCollapseClock} from './boss-collapse.mjs';
import {bossMotion} from './boss-motion-data.mjs';
import {kwonStanceWeights,poseKwonLegTarget} from './kwon-leg-rig.mjs';

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
  const cinema=document.createElement('div');cinema.setAttribute('aria-live','polite');
  Object.assign(cinema.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'15',display:'none',borderTop:'7vh solid #000',borderBottom:'7vh solid #000'});
  const caption=document.createElement('p');Object.assign(caption.style,{position:'absolute',bottom:'8%',width:'100%',maxWidth:'none',textAlign:'center',fontSize:'24px',color:'#e9d3a0',textShadow:'0 2px 5px #000'});cinema.appendChild(caption);document.getElementById('arena').appendChild(cinema);
  let detached=false,lastFrame=null;const collapse=createCollapseClock();
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  return {update(b){
    const now=performance.now(),dt=lastFrame===null?0:(now-lastFrame)/1000;lastFrame=now;
    const death=collapse.step(b,dt,document.hidden);
    const q=bodyPose(b),c=cinematicPose(b),m=bossMotion(b),weights=kwonStanceWeights(q.standing,c.reach,c.detach,Boolean(death));pivot.rotation.x=q.angle+m.lean;pivot.position.y=(1.5+q.lift+m.sink)*S;
    B.model.position.y=death?death.sink:0;B.model.scale.setScalar(1);B.model.rotation.set(0,0,(death?death.roll:0)+m.sway);
    const shouldDetach=c.detach>0;
    if(shouldDetach&&!detached){pivot.remove(headRig);B.swordGroup.add(headRig);detached=true;}
    else if(!shouldDetach&&detached){B.swordGroup.remove(headRig);pivot.add(headRig);detached=false;}
    if(detached){headRig.scale.setScalar(S);headRig.position.set(0,-1.0*S,-.5*S);headRig.rotation.set(-Math.PI/2,0,0);}
    else{headRig.scale.setScalar(1);headRig.rotation.set(0,0,0);headRig.position.set(B.HEAD.x,B.HEAD.y-1.5,B.HEAD.z+1.5);}
    cinema.style.display=b.state==='transition'?'block':'none';
    if(b.state==='transition')caption.textContent=b.t<1.8?'부서진 검의 계승자':b.t<2.9?'내게 검을 쥘 손이 없었다면…':b.t<3.8?'내 머리로라도 베겠다.':'검의 현현';
    const head=bodyPoint(b,B.HEAD);
    for(const L of B.legs){
      const side=L.plan.side,front=L.plan.k===0,rear=L.plan.k===3,weight=rear?weights.rear:front?weights.front:0,shoulder=front?bodyPoint(b,{x:side*1.4,y:2.6,z:1.1}):null;
      let p=bodyPoint(b,{x:L.plan.root[0],y:L.plan.root[1],z:L.plan.root[2]});if(front)p=lerp(p,shoulder,weight);
      L.g.visible=true;L.g.position.set(p.x,p.y,p.z);L.g.scale.setScalar(S);L.g.rotation.x=-.45*q.standing*(1-weight);L.g.rotation.z=-side*1.15*q.standing*(1-weight);
      L.g.rotation.y=rear?L.baseYaw:L.baseYaw*(1-q.standing)+side*.65*q.standing;
      if(rear&&weight>0)poseKwonLegTarget(L,[side*1.8,.06,-3.5],weight);
      if(front&&weight>0){
        const grip=handPoint(b,side),reach={x:head.x+side*.55,y:head.y-.3,z:head.z+.4},rest={x:shoulder.x+side*.8,y:shoulder.y-1.2,z:shoulder.z+.5};
        const target=death?{x:side*.8,y:1.1,z:3.6}:lerp(lerp(rest,reach,c.reach),grip,c.detach);
        poseKwonLegTarget(L,[target.x,target.y,target.z],weight);
      }
    }
  }};
}
