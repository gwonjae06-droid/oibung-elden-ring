import * as THREE from 'three';
import {environmentPlan} from './environment-data.mjs';

function pavingTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');c.fillStyle='#252a27';c.fillRect(0,0,1024,1024);
  let state=41;const rand=()=>{state=state*16807%2147483647;return state/2147483647;};
  for(let y=0;y<8;y++)for(let x=-1;x<8;x++){
    const px=x*128+(y%2)*64,py=y*128,v=62+Math.floor(rand()*25);
    c.fillStyle=`rgb(${v},${v+3},${v-2})`;c.fillRect(px+3,py+3,122,122);
    c.strokeStyle='#73766b';c.lineWidth=2;c.strokeRect(px+6,py+6,116,116);
    for(let j=0;j<55;j++){
      c.fillStyle=rand()<.5?'#ffffff09':'#00000019';c.fillRect(px+rand()*120,py+rand()*120,2+rand()*6,1+rand()*3);
    }
    if(rand()<.45){c.strokeStyle='#222a25';c.lineWidth=2;c.beginPath();c.moveTo(px+18,py+10);c.lineTo(px+35+rand()*55,py+62);c.lineTo(px+84,py+122);c.stroke();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(6,6);return texture;
}

export function buildEnvironment(scene,ground){
  if(scene.getObjectByName('ruined-courtyard'))return;
  const plan=environmentPlan(),root=new THREE.Group();root.name='ruined-courtyard';
  const stone=new THREE.MeshStandardMaterial({color:0x62645b,roughness:.98});
  const dark=new THREE.MeshStandardMaterial({color:0x3e443b,roughness:1});
  const vegetation=new THREE.MeshStandardMaterial({color:0x4b5540,roughness:1,side:THREE.DoubleSide});
  const dummy=new THREE.Object3D();
  const wall=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),stone,plan.walls.length);
  plan.walls.forEach((p,i)=>{dummy.position.set(p.x,p.h/2,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.set(p.w,p.h,p.d);dummy.updateMatrix();wall.setMatrixAt(i,dummy.matrix);});
  wall.instanceMatrix.needsUpdate=true;wall.receiveShadow=true;root.add(wall);
  const rubble=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),dark,plan.rubble.length);
  plan.rubble.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.tilt,p.yaw,p.tilt);dummy.scale.set(p.s,p.s*.5,p.s*.8);dummy.updateMatrix();rubble.setMatrixAt(i,dummy.matrix);});
  rubble.instanceMatrix.needsUpdate=true;rubble.receiveShadow=true;root.add(rubble);
  const tuftGeo=new THREE.BufferGeometry();
  tuftGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.15,0,0,.15,0,0,0,1,0,0,0,-.15,0,0,.15,0,1,0],3));tuftGeo.computeVertexNormals();
  const grass=new THREE.InstancedMesh(tuftGeo,vegetation,plan.grass.length);
  plan.grass.forEach((p,i)=>{dummy.position.set(p.x,.01,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.set(p.h*2,p.h,p.h*2);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);});
  grass.instanceMatrix.needsUpdate=true;root.add(grass);
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  function block(parent,x,y,z,sx,sy,sz,mat=stone){const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.receiveShadow=true;parent.add(m);return m;}
  for(const p of plan.arches){
    const arch=new THREE.Group();arch.position.set(p.x,0,p.z);arch.rotation.y=p.yaw;
    for(const side of [-1,1]){
      block(arch,side*3,2.5,0,1.2,5,2);
      block(arch,side*3,.3,0,1.8,.6,2.5);
      block(arch,side*3,4.9,0,1.6,.45,2.2);
    }
    for(let j=0;j<11;j++){
      if(p.broken&&j>=4&&j<=7)continue;
      const a=j*Math.PI/10;
      const m=block(arch,Math.cos(a)*3,5+Math.sin(a)*3,0,1.05,.7,2);
      m.rotation.z=a+Math.PI/2;
    }
    root.add(arch);
  }
  const coords=[];
  for(const p of plan.cracks)coords.push(p.a.x,.012,p.a.z,p.b.x,.012,p.b.z);
  const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
  root.add(new THREE.LineSegments(lines,new THREE.LineBasicMaterial({color:0x20251f})));
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,r=30;
    block(root,Math.sin(a)*r,.75,Math.cos(a)*r,.6,1.5,.6,dark);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.15,.6,7),new THREE.MeshBasicMaterial({color:0xffb35f}));
    flame.position.set(Math.sin(a)*r,1.7,Math.cos(a)*r);root.add(flame);
  }
  const map=pavingTexture();ground.material.map=map;ground.material.color.setHex(0xffffff);ground.material.needsUpdate=true;
  root.userData.decorativeOnly=true;scene.add(root);
  return root;
}
