import {reducedMotion} from './display-preferences.mjs';
import {buildSanctuary} from './sanctuary.mjs';
import {runThreeStartup} from './runtime/three-startup.mjs';
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

const media=q=>typeof matchMedia==='function'&&matchMedia(q).matches;
function makeCanvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function asTexture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
function skyTexture(){
  const c=makeCanvas(16,256),g=c.getContext('2d'),grad=g.createLinearGradient(0,0,0,256);
  for(const [p,col] of [[0,'#05080b'],[.3,'#0b1418'],[.46,'#253440'],[.5,'#384452'],[.54,'#1e2832'],[.75,'#121814'],[1,'#0d120f']])grad.addColorStop(p,col);
  g.fillStyle=grad;g.fillRect(0,0,16,256);return asTexture(c);
}
function moonTexture(){
  const c=makeCanvas(256),g=c.getContext('2d'),halo=g.createRadialGradient(128,128,20,128,128,128);
  halo.addColorStop(0,'rgba(190,213,240,.4)');halo.addColorStop(1,'rgba(150,190,230,0)');g.fillStyle=halo;g.fillRect(0,0,256,256);
  g.fillStyle='#d8e5f2';g.beginPath();g.arc(128,128,52,0,Math.PI*2);g.fill();
  g.fillStyle='rgba(120,98,66,.32)';
  for(const [x,y,r] of [[110,112,12],[146,130,16],[126,150,9],[150,100,7]]){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
  return asTexture(c);
}
function sigilTexture(){
  const c=makeCanvas(1024),g=c.getContext('2d');g.translate(512,512);
  let s=77;const rand=()=>{s=s*16807%2147483647;return s/2147483647;};
  g.strokeStyle='rgba(214,178,98,.9)';
  for(const [r,w] of [[469,3],[455,1.5],[299,2],[285,1.5],[150,1.5]]){g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
  g.lineWidth=1.5;
  for(let i=0;i<6;i++){const a=i*Math.PI/3,b=(i+2)*Math.PI/3;g.beginPath();g.moveTo(Math.sin(a)*299,Math.cos(a)*299);g.lineTo(Math.sin(b)*299,Math.cos(b)*299);g.stroke();}
  for(let i=0;i<24;i++){
    g.save();g.rotate(i/24*Math.PI*2);
    g.lineWidth=i%2?1.5:3;g.beginPath();g.moveTo(0,i%2?440:430);g.lineTo(0,455);g.stroke();
    if(i%2===0){g.lineWidth=2;g.beginPath();let y=320;g.moveTo(0,y);for(let k=0;k<4;k++){const dy=18+rand()*16;g.lineTo((rand()-.5)*34,y+dy);y+=dy;if(y>410)break;}g.stroke();}
    g.restore();
  }
  return asTexture(c);
}
function mistTexture(){
  const c=makeCanvas(512),g=c.getContext('2d');let s=913;const rand=()=>{s=s*16807%2147483647;return s/2147483647;};
  for(let i=0;i<90;i++){
    const x=rand()*512,y=rand()*512,r=30+rand()*70,grad=g.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,'rgba(175,190,175,'+(.1+rand()*.14).toFixed(3)+')');grad.addColorStop(1,'rgba(175,190,175,0)');
    g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
  }
  return asTexture(c);
}

export function buildEnvironment(scene,ground){
 return runThreeStartup(THREE,(THREE,own)=>{

  if(scene.getObjectByName('ruined-courtyard'))return;
  const plan=environmentPlan(),root=new THREE.Group();root.name='ruined-courtyard';
  const coarse=media('(pointer:coarse)'),reduced=reducedMotion(),flames=[],lights=[],banners=[];
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
  const bannerMat=new THREE.MeshStandardMaterial({color:0x6e1f26,roughness:.95,side:THREE.DoubleSide}),bannerGeo=new THREE.PlaneGeometry(1.5,3.4).translate(0,-1.7,0);
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
    if(!p.broken){const banner=new THREE.Mesh(bannerGeo,bannerMat);banner.position.set(0,7.6,0);arch.add(banner);banners.push(banner);}
    root.add(arch);
  }
  const coords=[];
  for(const p of plan.cracks)coords.push(p.a.x,.012,p.a.z,p.b.x,.012,p.b.z);
  const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
  root.add(new THREE.LineSegments(lines,new THREE.LineBasicMaterial({color:0x20251f})));
  const outerMat=new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.85,depthWrite:false}),innerMat=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,depthWrite:false}),lit=coarse?[0,6]:[0,3,6,9];
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,r=30,x=Math.sin(a)*r,z=Math.cos(a)*r;
    block(root,x,.75,z,.6,1.5,.6,dark);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.42,.28,.28,10),dark);cup.position.set(x,1.62,z);root.add(cup);
    const fire=new THREE.Group();fire.position.set(x,1.76,z);
    const outer=new THREE.Mesh(new THREE.ConeGeometry(.24,.95,8),outerMat);outer.position.y=.47;
    const inner=new THREE.Mesh(new THREE.ConeGeometry(.12,.55,8),innerMat);inner.position.y=.28;
    fire.add(outer,inner);root.add(fire);flames.push(fire);
    if(lit.includes(i)){const light=new THREE.PointLight(0xff9650,coarse?70:95,34,2);light.position.set(x,2.6,z);light.userData.base=light.intensity;root.add(light);lights.push(light);}
  }
  const sky=new THREE.Mesh(new THREE.SphereGeometry(80,32,16),new THREE.MeshBasicMaterial({map:skyTexture(),side:THREE.BackSide,fog:false,depthWrite:false}));
  sky.renderOrder=-10;sky.frustumCulled=false;root.add(sky);
  const moon=new THREE.Mesh(new THREE.PlaneGeometry(22,22),new THREE.MeshBasicMaterial({map:moonTexture(),transparent:true,fog:false,depthWrite:false}));
  moon.position.set(-38,34,-58);moon.lookAt(0,0,0);moon.renderOrder=-9;moon.frustumCulled=false;root.add(moon);
  const sigil=new THREE.Mesh(new THREE.CircleGeometry(24,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:sigilTexture(),transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending}));
  sigil.position.y=.016;sigil.renderOrder=1;root.add(sigil);
  const mistTex=mistTexture(),mistGeo=new THREE.RingGeometry(13,38,72).rotateX(-Math.PI/2);
  const mistA=new THREE.Mesh(mistGeo,new THREE.MeshBasicMaterial({map:mistTex,transparent:true,opacity:coarse?.16:.22,depthWrite:false}));mistA.position.y=.35;
  const mistB=new THREE.Mesh(mistGeo,new THREE.MeshBasicMaterial({map:mistTex,transparent:true,opacity:coarse?.1:.15,depthWrite:false}));mistB.position.y=1;mistB.rotation.y=1.7;
  for(const m of [mistA,mistB]){m.frustumCulled=false;m.renderOrder=2;root.add(m);}
  let lastT=-1,silenced=false,visualTime=0;
  mistA.onBeforeRender=()=>{
    const t=visualTime;if(t===lastT)return;lastT=t;
    if(!silenced){mistA.rotation.y=t*.012;mistB.rotation.y=1.7-t*.008;}
    const amp=reduced?.03:.14;
    lights.forEach((L,i)=>{L.intensity=L.userData.base*(silenced?.12:1)*(1+(silenced?0:amp)*(Math.sin(t*9.1+i*1.7)*.5+Math.sin(t*15.3+i*3.1)*.3+Math.sin(t*23+i)*.2));});
    if(!reduced&&!silenced)flames.forEach((F,i)=>{F.scale.set(1,1+.18*Math.sin(t*11+i*2.3)+.1*Math.sin(t*19+i),1);});
    banners.forEach((B,i)=>{B.rotation.z=Math.sin(t*.9+i)*(silenced?0:reduced?.01:.05);});
  };
  const map=pavingTexture();ground.material.map=map;ground.material.color.setHex(0xffffff);ground.material.needsUpdate=true;
  const sanctuary=buildSanctuary(THREE,root);root.userData.updateSanctuary=(game,dt)=>{if(game.time<.1&&game.boss.phase===1)visualTime=0;visualTime+=Math.max(0,dt);const p=sanctuary.update(game,dt);silenced=!!p.silence;sigil.material.opacity=p.silence?.05:.2+p.gold*.3;};
  grass.visible=false;root.userData.decorativeOnly=true;scene.add(root);
  return root;

 });
}
