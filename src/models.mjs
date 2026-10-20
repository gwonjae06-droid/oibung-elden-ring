import * as THREE from 'three';
import {SWORD} from './combat.mjs';
import {legPlan,gait,walkPose,capeSway,ellipsoidPoint,ringAt,onSphere} from './model-data.mjs';

const V=a=>new THREE.Vector3(a[0],a[1],a[2]);

function noiseTexture(base,spots,size,seed){
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

function tube(points,r0,r1,mat,seg){
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

export function buildPlayer(weaponKeys){
  const rig=new THREE.Group();
  const body=new THREE.Group();body.position.y=1;rig.add(body);
  const skin=new THREE.MeshStandardMaterial({color:0xe0c7a5,roughness:.8});
  const cloth=new THREE.MeshStandardMaterial({color:0x4f7da6,roughness:.7,transparent:true,map:noiseTexture('#4f7da6',160,128,3)});
  const dark=new THREE.MeshStandardMaterial({color:0x2a3340,roughness:.85,transparent:true,side:THREE.DoubleSide});
  const leather=new THREE.MeshStandardMaterial({color:0x4a3526,roughness:.8,transparent:true});
  const hair=new THREE.MeshStandardMaterial({color:0x1b1a1f,roughness:.6});
  const gold=new THREE.MeshStandardMaterial({color:0xc9a85a,roughness:.35,metalness:.7});
  const mats=[cloth,dark,leather];

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.62,6,14),cloth);torso.scale.set(1.08,1,.84);torso.position.y=.3;torso.castShadow=true;body.add(torso);
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(.38,.4,.1,16),leather);belt.position.y=-.05;belt.scale.z=.86;body.add(belt);
  const buckle=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.04),gold);buckle.position.set(0,-.05,.33);body.add(buckle);
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.38,.52,.42,16,1,true),dark);skirt.position.y=-.28;skirt.scale.z=.86;body.add(skirt);
  for(const side of [-1,1]){
    const pad=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),dark);pad.position.set(side*.5,.72,0);pad.scale.set(1.1,.7,1);pad.castShadow=true;body.add(pad);
  }
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.14,10),skin);neck.position.y=.9;body.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,20,16),skin);head.position.y=1.12;head.castShadow=true;body.add(head);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.275,20,14,0,Math.PI*2,0,Math.PI*.55),hair);cap.position.y=1.14;cap.rotation.x=-.18;body.add(cap);
  const fringe=new THREE.Mesh(new THREE.BoxGeometry(.4,.07,.1),hair);fringe.position.set(0,1.27,.2);fringe.rotation.x=.4;body.add(fringe);
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),new THREE.MeshStandardMaterial({color:0x111111}));eye.position.set(side*.095,1.14,.235);body.add(eye);
  }

  const legs={};
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.18,-.42,0);body.add(hip);
    const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.38,4,10),dark);thigh.position.y=-.22;thigh.castShadow=true;hip.add(thigh);
    const knee=new THREE.Group();knee.position.y=-.45;hip.add(knee);
    const shin=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.34,4,10),leather);shin.position.y=-.2;shin.castShadow=true;knee.add(shin);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.34),dark);boot.position.set(0,-.42,.06);knee.add(boot);
    legs[side<0?'L':'R']=hip;
  }
  const arms={};
  for(const side of [-1,1]){
    const sh=new THREE.Group();sh.position.set(side*.52,.7,0);body.add(sh);
    const up=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.3,4,10),cloth);up.position.y=-.2;up.castShadow=true;sh.add(up);
    const el=new THREE.Group();el.position.y=-.38;sh.add(el);
    const lo=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.28,4,10),leather);lo.position.y=-.18;lo.castShadow=true;el.add(lo);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),skin);hand.position.y=-.38;el.add(hand);
    arms[side<0?'L':'R']=sh;
  }

  const capeParts=[];
  {
    const root=new THREE.Group();root.position.set(0,.8,-.3);body.add(root);
    let parent=root;
    for(let i=0;i<3;i++){
      const seg=new THREE.Group();parent.add(seg);
      const m=new THREE.Mesh(new THREE.BoxGeometry(.8-i*.08,.4,.05),new THREE.MeshStandardMaterial({color:0x6a2f36,roughness:.9,side:THREE.DoubleSide}));
      m.position.y=-.2;m.castShadow=true;seg.add(m);
      const next=new THREE.Group();next.position.y=-.4;seg.add(next);
      capeParts.push(seg);parent=next;
    }
  }

  const pivot=new THREE.Group();pivot.position.set(0,-.78,.05);arms.R.add(pivot);
  const metal=new THREE.MeshStandardMaterial({color:0xcfd4d8,metalness:.8,roughness:.28});
  const wood=new THREE.MeshStandardMaterial({color:0x6b4a2a,roughness:.8});
  const weaponRigs={};
  {
    const sword=new THREE.Group();
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.07,.12,1.5),metal);blade.position.z=1.05;
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.06,.3,4).rotateX(Math.PI/2),metal);tip.position.z=1.9;tip.scale.y=1.6;
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.5,.07,.09),gold);guard.position.z=.3;
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.3,8).rotateX(Math.PI/2),leather);grip.position.z=.1;
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),gold);pommel.position.z=-.06;
    sword.add(blade,tip,guard,grip,pommel);weaponRigs.sword=sword;
    const hammer=new THREE.Group();
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.6,8).rotateX(Math.PI/2),wood);shaft.position.z=.7;
    const mass=new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.55),metal);mass.position.z=1.6;
    for(const s of [-1,1]){const sp=new THREE.Mesh(new THREE.ConeGeometry(.08,.2,6).rotateZ(-s*Math.PI/2),metal);sp.position.set(s*.38,0,1.6);hammer.add(sp);}
    hammer.add(shaft,mass);weaponRigs.hammer=hammer;
    const bow=new THREE.Group();
    const arc=new THREE.Mesh(new THREE.TorusGeometry(.62,.04,6,22,Math.PI),wood);arc.rotation.z=Math.PI/2;arc.position.z=.5;
    const str=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,1.24,4),new THREE.MeshStandardMaterial({color:0xe9e2cc}));str.position.z=.5;
    bow.add(arc,str);weaponRigs.bow=bow;
    const cards=new THREE.Group();
    for(let i=0;i<4;i++){
      const c=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.46),new THREE.MeshStandardMaterial({color:i===1?0xb94a48:i===2?0x2a2a35:0xf2ecdc,roughness:.5}));
      c.position.set((i-1.5)*.17,0,.55);c.rotation.y=(i-1.5)*.3;cards.add(c);
    }
    weaponRigs.cards=cards;
    for(const k of weaponKeys){weaponRigs[k].visible=false;pivot.add(weaponRigs[k]);}
  }
  return {rig,body,mats,pivot,weaponRigs,legs,arms,capeParts,cloth};
}

export function buildBoss(){
  const root=new THREE.Group();
  const model=new THREE.Group();root.add(model);
  const carapace=new THREE.MeshStandardMaterial({color:0x4b3a33,roughness:.55,metalness:.15,map:noiseTexture('#4b3a33',420,256,11)});
  const joint=new THREE.MeshStandardMaterial({color:0x2b211d,roughness:.7});
  const hairMat=new THREE.MeshStandardMaterial({color:0x211a17,roughness:.95});
  const markMat=new THREE.MeshStandardMaterial({color:0x8a2b1f,roughness:.5,emissive:0x2a0804,emissiveIntensity:.6});

  const AB={c:[0,2.1,-1.5],r:[2.1,1.785,2.625]};
  const abdomen=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),carapace);
  abdomen.scale.set(AB.r[0],AB.r[1],AB.r[2]);abdomen.position.set(...AB.c);abdomen.castShadow=true;model.add(abdomen);
  for(let i=0;i<5;i++){
    const rg=ringAt(AB.c,AB.r,-.2-i*.78);
    const band=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,36),joint);
    band.position.set(0,rg.y,rg.z);band.scale.set(rg.rx*1.01,rg.ry*1.01,1);
    model.add(band);
  }
  for(const [x,z,s] of [[0,-2.6,1],[.8,-3.2,.7],[-.8,-3.2,.7],[0,-3.6,.6]]){
    const e=ellipsoidPoint(AB.c,AB.r,x,z);
    const mark=new THREE.Mesh(new THREE.SphereGeometry(.2*s,12,8),markMat);
    mark.scale.set(1,.35,1.5);mark.position.set(e.point[0],e.point[1]-.02,e.point[2]);
    mark.lookAt(e.point[0]+e.normal[0],e.point[1]+e.normal[1],e.point[2]+e.normal[2]);
    model.add(mark);
  }
  const hairCount=90;
  const hairs=new THREE.InstancedMesh(new THREE.ConeGeometry(.045,.55,5),hairMat,hairCount);
  const dummy=new THREE.Object3D();let sd=19;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  for(let i=0;i<hairCount;i++){
    const x=(rnd()*2-1)*AB.r[0]*.85,z=AB.c[2]+(rnd()*2-1)*AB.r[2]*.85;
    const e=ellipsoidPoint(AB.c,AB.r,x,z);
    if(!e.inside){dummy.position.set(0,-50,0);dummy.scale.setScalar(.0001);}
    else{
      dummy.position.set(e.point[0]+e.normal[0]*.1,e.point[1]+e.normal[1]*.1,e.point[2]+e.normal[2]*.1);
      dummy.lookAt(dummy.position.x+e.normal[0],dummy.position.y+e.normal[1],dummy.position.z+e.normal[2]);
      dummy.rotateX(Math.PI/2);dummy.scale.setScalar(.7+rnd()*.8);
    }
    dummy.updateMatrix();hairs.setMatrixAt(i,dummy.matrix);
  }
  hairs.instanceMatrix.needsUpdate=true;model.add(hairs);

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
    model.add(tube([[side*.9,2.5,2.5],[side*1.35,2.2,3.0],[side*1.5,1.6,3.4]],.1,.06,joint,10));
  }

  const legs=[];
  for(const plan of legPlan()){
    const g=new THREE.Group();g.position.set(...plan.root);g.rotation.y=plan.yaw;
    g.add(tube(plan.points,.22,.07,carapace,28));
    for(let i=1;i<4;i++){
      const j=new THREE.Mesh(new THREE.SphereGeometry(i===3?.07:.17-.03*i,10,8),joint);j.position.set(...plan.points[i]);j.castShadow=true;g.add(j);
    }
    model.add(g);legs.push({g,plan,baseYaw:plan.yaw,baseY:plan.root[1]});
  }

  const boneMat=new THREE.MeshStandardMaterial({color:0xd8d0b6,roughness:.45,emissive:0x000000});
  const swordGroup=new THREE.Group();swordGroup.rotation.order='YXZ';model.add(swordGroup);
  const fallbackBlade=new THREE.Mesh(new THREE.ConeGeometry(.5,SWORD.length,4).rotateX(Math.PI/2).translate(0,0,SWORD.length/2),boneMat);
  fallbackBlade.scale.y=.45;fallbackBlade.castShadow=true;swordGroup.add(fallbackBlade);
  return {root,model,carapace,joint,glowMat,eyes,legs,HEAD,swordGroup,fallbackBlade,boneMat};
}

export function poseLegs(legs,phase,speed){
  for(const L of legs){
    const g=gait(L.plan,phase,speed);
    L.g.rotation.y=L.baseYaw+g.yaw;
    L.g.position.y=L.baseY+g.lift;
  }
}
export function posePlayer(parts,phase,speed){
  const w=walkPose(phase,speed);
  parts.legs.L.rotation.x=w.legL;parts.legs.R.rotation.x=w.legR;
  parts.arms.L.rotation.x=w.armL;parts.arms.R.rotation.x=w.armR;
  return w;
}
export function swayCape(parts,time,speed){
  parts.capeParts.forEach((seg,i)=>{seg.rotation.x=-capeSway(i,time,speed);});
}
