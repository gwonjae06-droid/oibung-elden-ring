import {buildPlayerAvatar} from './player-avatar.mjs';
import {runThreeStartup} from './runtime/three-startup.mjs';
import * as BASE_THREE from 'three';
const THREE=BASE_THREE;
import {SWORD} from './combat.mjs';
import {legPlan,gait,walkPose,capeSway,ellipsoidPoint,ringAt,onSphere} from './model-data.mjs';
import {buildKwonLeg,poseKwonLeg} from './kwon-leg-rig.mjs';

const V=a=>new THREE.Vector3(a[0],a[1],a[2]);

function noiseTexture(base,spots,size,seed,namespace=BASE_THREE){
  const THREE=namespace;
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,size,size);
  let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<spots;i++){
    const x=rnd()*size,y=rnd()*size,r=1+rnd()*5,a=.05+rnd()*.16;
    g.fillStyle=(rnd()<.5?'rgba(0,0,0,':'rgba(255,255,255,')+a+')';
    g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

function tube(points,r0,r1,mat,seg,namespace=BASE_THREE){
  const THREE=namespace;
  const curve=new THREE.CatmullRomCurve3(points.map(V),false,'catmullrom',.5);
  const geo=new THREE.TubeGeometry(curve,seg,1,8,false);
  const pos=geo.attributes.position,n=seg+1,ring=pos.count/n;
  const centers=curve.getSpacedPoints(seg);
  for(let i=0;i<n;i++){
    const r=r0+(r1-r0)*(i/seg);
    for(let j=0;j<ring;j++){
      const idx=i*ring+j;
      pos.setXYZ(idx,centers[i].x+(pos.getX(idx)-centers[i].x)*r,centers[i].y+(pos.getY(idx)-centers[i].y)*r,centers[i].z+(pos.getZ(idx)-centers[i].z)*r);
    }
  }
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;return m;
}

export function buildPlayer(weaponKeys){return buildPlayerAvatar(weaponKeys,THREE);}

export function buildBoss(){
 return runThreeStartup(THREE,(THREE,own)=>{

  const root=new THREE.Group();
  const model=new THREE.Group();root.add(model);
  const carapace=new THREE.MeshStandardMaterial({color:0x4b3a33,roughness:.55,metalness:.15,map:noiseTexture('#4b3a33',420,256,11,THREE)});
  const joint=new THREE.MeshStandardMaterial({color:0x2b211d,roughness:.7});
  const hairMat=new THREE.MeshStandardMaterial({color:0x211a17,roughness:.95});
  const markMat=new THREE.MeshStandardMaterial({color:0x8a2b1f,roughness:.5,emissive:0x2a0804,emissiveIntensity:.6});
  const AB={c:[0,2.1,-1.5],r:[2.1,1.785,2.625]};
  const abdomen=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),carapace);
  abdomen.scale.set(AB.r[0],AB.r[1],AB.r[2]);abdomen.position.set(...AB.c);abdomen.castShadow=true;model.add(abdomen);
  for(let i=0;i<5;i++){
    const rg=ringAt(AB.c,AB.r,-.2-i*.78);
    const band=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,36),joint);
    band.position.set(0,rg.y,rg.z);band.scale.set(rg.rx*1.01,rg.ry*1.01,1);model.add(band);
  }
  for(const [x,z,s] of [[0,-2.6,1],[.8,-3.2,.7],[-.8,-3.2,.7],[0,-3.6,.6]]){
    const e=ellipsoidPoint(AB.c,AB.r,x,z);
    const mark=new THREE.Mesh(new THREE.SphereGeometry(.2*s,12,8),markMat);
    mark.scale.set(1,.35,1.5);mark.position.set(e.point[0],e.point[1]-.02,e.point[2]);
    mark.lookAt(e.point[0]+e.normal[0],e.point[1]+e.normal[1],e.point[2]+e.normal[2]);model.add(mark);
  }
  const hairCount=90;
  const hairs=new THREE.InstancedMesh(new THREE.ConeGeometry(.045,.55,5),hairMat,hairCount);
  const dummy=new THREE.Object3D();let sd=19;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  for(let i=0;i<hairCount;i++){
    const x=(rnd()*2-1)*AB.r[0]*.85,z=AB.c[2]+(rnd()*2-1)*AB.r[2]*.85;
    const e=ellipsoidPoint(AB.c,AB.r,x,z);
    if(!e.inside){dummy.position.set(0,-50,0);dummy.scale.setScalar(.0001);}
    else{dummy.position.set(e.point[0]+e.normal[0]*.1,e.point[1]+e.normal[1]*.1,e.point[2]+e.normal[2]*.1);dummy.lookAt(dummy.position.x+e.normal[0],dummy.position.y+e.normal[1],dummy.position.z+e.normal[2]);dummy.rotateX(Math.PI/2);dummy.scale.setScalar(.7+rnd()*.8);}
    dummy.updateMatrix();hairs.setMatrixAt(i,dummy.matrix);
  }
  hairs.instanceMatrix.needsUpdate=true;model.add(hairs);
  const spinePlan=[[0,-.2,1],[0,-1,1.1],[0,-1.8,1.2],[0,-2.6,1.1],[0,-3.4,.9],[.9,-1.4,.9],[-.9,-1.4,.9],[1,-2.4,.8],[-1,-2.4,.8]];
  const spines=new THREE.InstancedMesh(new THREE.ConeGeometry(.12,.7,6),joint,spinePlan.length);
  spinePlan.forEach(([x,z,s],i)=>{const e=ellipsoidPoint(AB.c,AB.r,x,z);if(!e.inside){dummy.position.set(0,-50,0);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.0001);}else{dummy.position.set(e.point[0]+e.normal[0]*.2,e.point[1]+e.normal[1]*.2,e.point[2]+e.normal[2]*.2);dummy.lookAt(dummy.position.x+e.normal[0],dummy.position.y+e.normal[1],dummy.position.z+e.normal[2]);dummy.rotateX(Math.PI/2);dummy.scale.setScalar(s);}dummy.updateMatrix();spines.setMatrixAt(i,dummy.matrix);});
  spines.instanceMatrix.needsUpdate=true;spines.castShadow=true;model.add(spines);
  const thorax=new THREE.Mesh(new THREE.SphereGeometry(1.5,28,20),carapace);
  thorax.scale.set(1,.8,1);thorax.position.set(0,2.1,.8);thorax.castShadow=true;model.add(thorax);
  const waist=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,.9,14).rotateX(Math.PI/2),joint);waist.position.set(0,2.1,-.35);model.add(waist);
  const HEAD={x:0,y:2.75,z:1.75,r:1.12};
  const bossHead=new THREE.Mesh(new THREE.SphereGeometry(HEAD.r,32,24),carapace);
  bossHead.position.set(HEAD.x,HEAD.y,HEAD.z);bossHead.castShadow=true;model.add(bossHead);
  const glowMat=new THREE.MeshStandardMaterial({color:0x2a0606,emissive:0xcc2a1a,emissiveIntensity:.9,roughness:.2});
  const eyes=[];
  for(const [d,rr] of [[[.55,.72,.3],.1],[[-.55,.72,.3],.1],[[.78,.5,.1],.07],[[-.78,.5,.1],.07],[[.3,.9,.08],.06],[[-.3,.9,.08],.06]]){
    const p=onSphere([HEAD.x,HEAD.y,HEAD.z],HEAD.r*.99,d);
    const e=new THREE.Mesh(new THREE.SphereGeometry(rr,10,8),glowMat);e.position.set(...p);model.add(e);eyes.push(e);
  }
  for(const side of [-1,1]){
    const fang=new THREE.Mesh(new THREE.ConeGeometry(.12,.7,8),new THREE.MeshStandardMaterial({color:0xd8d0b6,roughness:.4}));
    fang.position.set(side*.78,2.0,2.35);fang.rotation.x=Math.PI*.92;model.add(fang);
    model.add(tube([[side*.9,2.5,2.5],[side*1.35,2.2,3.0],[side*1.5,1.6,3.4]],.1,.06,joint,10,THREE));
    model.add(tube([[side*.55,2.6,2.55],[side*.75,2.25,3.0],[side*.6,1.95,3.3]],.085,.05,joint,8,THREE));
  }
  const clawMat=new THREE.MeshStandardMaterial({color:0xd8d0b6,roughness:.4});
  const legs=[];
  for(const plan of legPlan()){const L=buildKwonLeg(THREE,plan,carapace,joint,clawMat);model.add(L.g);legs.push(L);}
  const boneMat=new THREE.MeshStandardMaterial({color:0xd8d0b6,roughness:.45,emissive:0x000000});
  const swordGroup=new THREE.Group();swordGroup.rotation.order='YXZ';model.add(swordGroup);
  const fallbackBlade=new THREE.Mesh(new THREE.ConeGeometry(.5,SWORD.length,4).rotateX(Math.PI/2).translate(0,0,SWORD.length/2),boneMat);
  fallbackBlade.scale.y=.45;fallbackBlade.castShadow=true;swordGroup.add(fallbackBlade);
  return {root,model,carapace,joint,glowMat,eyes,legs,HEAD,swordGroup,fallbackBlade,boneMat};

 });
}
export function poseLegs(legs,phase,speed){for(const L of legs){if(L.articulated){poseKwonLeg(L,phase,speed);continue;}const g=gait(L.plan,phase,speed);L.g.rotation.y=L.baseYaw+g.yaw;L.g.position.y=L.baseY+g.lift;}}
export function posePlayer(parts,phase,speed){const w=walkPose(phase,speed);parts.legs.L.rotation.x=w.legL;parts.legs.R.rotation.x=w.legR;parts.arms.L.rotation.x=w.armL;parts.arms.R.rotation.x=w.armR;return w;}
export function swayCape(parts,time,speed){parts.capeParts.forEach((seg,i)=>{seg.rotation.x=-capeSway(i,time,speed);});}
