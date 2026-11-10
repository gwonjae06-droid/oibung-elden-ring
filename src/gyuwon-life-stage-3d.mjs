import * as THREE from 'three';
import {createReverieActor} from './gyuwon-reverie-actor.mjs';
import {createReverieSets} from './gyuwon-reverie-sets.mjs';

const ease=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const vec=(a,b,t)=>new THREE.Vector3(...a).lerp(new THREE.Vector3(...b),t);

// Each room is a real spatial set. This makes the last song's 3D actor,
// physical props and cinematic depth persist into the life-film epilogue.
export const GYUWON_LIFE_SCENE=Object.freeze({
 realization:'afterglow',youth:'park',study:'school',work:'office',
 parttime:'shop',love:'riverside',wedding:'wedding',
 family:'home',child:'home',answer:'home',phone:'home',
 portal:'portal',title:'portal'
});
const SHOTS=Object.freeze({
 realization:{p0:[5.1,3.8,9.8],p1:[2.5,3.4,5.4],l0:[0,2.4,0],l1:[0,2.8,0],fov:41},
 youth:{p0:[-6.5,4.5,9.7],p1:[-2.8,3.1,6.7],l0:[0,1.8,0],l1:[.8,2.2,0],fov:45},
 study:{p0:[4.4,4.3,7.3],p1:[2.0,3.2,4.6],l0:[0,2.0,0],l1:[0,2.2,.1],fov:42},
 work:{p0:[-4.5,4.3,8.5],p1:[2.8,3.3,6.4],l0:[0,1.9,0],l1:[0,2.3,.1],fov:45},
 parttime:{p0:[5,3.8,7],p1:[2.7,3.1,5.1],l0:[0,2.1,0],l1:[0,2.25,.25],fov:43},
 love:{p0:[-5.9,4.2,8.7],p1:[2.5,2.9,6.7],l0:[0,2.0,0],l1:[.25,2.1,0],fov:45},
 wedding:{p0:[-3.2,4.3,11.8],p1:[1.8,3.25,7.1],l0:[0,2.2,0],l1:[0,2.4,0],fov:40},
 family:{p0:[-4.8,3.8,8.4],p1:[2.8,3.4,6.2],l0:[0,2.2,.2],l1:[0,2.1,.2],fov:44},
 child:{p0:[3.1,3.1,6.1],p1:[1.65,2.85,4.3],l0:[1.0,1.75,.7],l1:[1.1,1.65,.8],fov:43},
 answer:{p0:[-3.0,3.0,5.9],p1:[1.85,2.45,3.9],l0:[0,2.3,.2],l1:[.9,1.75,1.15],fov:42},
 phone:{p0:[2.7,2.5,5.5],p1:[1.03,1.87,2.11],l0:[1.0,1.62,1.3],l1:[1.03,1.86,1.57],fov:38}
});
export function gyuwonLifeCameraAt(shot,progress,portrait=false){
 const s=SHOTS[shot]||SHOTS.realization,q=ease(progress),pos=vec(s.p0,s.p1,q),target=vec(s.l0,s.l1,q);
 if(portrait&&shot!=='phone')pos.z+=2.3;
 return {position:pos.toArray(),target:target.toArray(),fov:s.fov-(shot==='phone'?7*q:3*q)};
}
const url=name=>new URL('../assets/art/'+name,import.meta.url).href;

function phoneMural(doc){
 const c=doc.createElement('canvas');c.width=512;c.height=896;
 const ctx=c.getContext('2d');
 const paint=()=>{if(!ctx)return;
  ctx.fillStyle='#12141a';ctx.fillRect(0,0,512,896);
  const gradient=ctx.createLinearGradient(0,0,0,896);
  gradient.addColorStop(0,'#111a25');gradient.addColorStop(1,'#3e2a22');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,512,896);
  ctx.fillStyle='#e5c38b';ctx.textAlign='center';
  ctx.font='bold 62px Georgia,serif';ctx.fillText('ODEN RING',256,382);
  ctx.font='bold 28px sans-serif';ctx.fillText('오든링',256,433);
  ctx.font='18px sans-serif';ctx.fillText('다섯 소망. 하나의 서약.',256,493);
 };
 paint();
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 const Win=doc.defaultView,Img=Win?.Image;
 if(Img&&ctx){
  const background=new Img();
  background.onload=()=>{
   ctx.drawImage(background,0,0,512,896);
   ctx.fillStyle='#0a0d14bb';ctx.fillRect(0,0,512,896);
   paintTitle();texture.needsUpdate=true;
  };
  function paintTitle(){
   ctx.fillStyle='#ebd2a2';ctx.textAlign='center';
   ctx.font='bold 58px Georgia,serif';ctx.fillText('ODEN RING',256,382);
   ctx.font='bold 27px sans-serif';ctx.fillText('오든링',256,432);
   ctx.fillStyle='#c3a47e';ctx.font='18px sans-serif';ctx.fillText('다섯 소망. 하나의 서약.',256,490);
  }
  background.src=url('temple-wall-v1.jpg');
 }
 return texture;
}

export function createGyuwonLifeStage3d({doc,source,coarse=false}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x141d2b);
 scene.fog=new THREE.FogExp2(0x141d2b,.015);
 const camera=new THREE.PerspectiveCamera(42,1,.08,260);
 const stage=new THREE.Group();scene.add(stage);
 const geos=new Set(),mats=new Set(),tex=new Set();
 const geo=g=>(geos.add(g),g);
 const mat=(hex,opts={})=>{const m=new THREE.MeshStandardMaterial({color:hex,roughness:.78,...opts});mats.add(m);return m;};
 const boxGeo=geo(new THREE.BoxGeometry(1,1,1)),ballGeo=geo(new THREE.SphereGeometry(1,coarse?12:20,coarse?10:16)),cylGeo=geo(new THREE.CylinderGeometry(1,1,1,coarse?12:20));
 const dark=mat(0x1e2933),pale=mat(0xe1d6be),wood=mat(0x76543c),metal=mat(0x536271,{metalness:.68,roughness:.3}),glass=mat(0xabcfe0,{transparent:true,opacity:.22,depthWrite:false}),leaf=mat(0x39715e),cloth=mat(0x526d87),pink=mat(0xb77a83),gold=mat(0xf5c58d,{metalness:.4,roughness:.35,emissive:0x503519,emissiveIntensity:.3}),paper=mat(0xf2ead9),skin=mat(0xcda48b),coffee=mat(0x3d2e2b);
 function mesh(parent,g,m,pos,sc,name){
  const o=new THREE.Mesh(g,m);o.position.set(...pos);o.scale.set(...sc);o.castShadow=!coarse;o.receiveShadow=true;o.name=name||'';parent.add(o);return o;
 }
 const b=(p,m,x,y,z,w,h,d,n)=>mesh(p,boxGeo,m,[x,y,z],[w,h,d],n);
 const ball=(p,m,x,y,z,w,h=w,d=w,n)=>mesh(p,ballGeo,m,[x,y,z],[w,h,d],n);
 const cyl=(p,m,x,y,z,w,h,d=w,n)=>mesh(p,cylGeo,m,[x,y,z],[w,h,d],n);
 function floor(p,m=dark){const f=mesh(p,geo(new THREE.PlaneGeometry(30,24)),m,[0,-.08,0],[1,1,1],'floor');f.rotation.x=-Math.PI/2;}
 const groups=new Map(),makeSet=(name,color=dark)=>{
  const p=new THREE.Group();p.name='gyuwon-life-set-'+name;p.visible=false;stage.add(p);groups.set(name,p);floor(p,color);return p;
 };
 const afterglow=makeSet('afterglow',mat(0x141c29));
 b(afterglow,metal,0,1.0,-3.6,11,.14,.7);for(let x=-5;x<=5;x+=2.5){cyl(afterglow,metal,x,.6,-3.6,.10,1.3);ball(afterglow,gold,x,1.5,-3.6,.14,.14,.14);}
 const halo=mesh(afterglow,geo(new THREE.TorusGeometry(3,.03,8,96)),gold,[0,3.5,-4],[1,1,1]);halo.rotation.z=.15;
 const park=makeSet('park',mat(0x3b5947));
 function tree(p,x,z,s=1){cyl(p,wood,x,1.2*s,z,.3*s,2.6*s);for(const y of [2.5,3.1,3.7])ball(p,leaf,x,y*s,z,1.2*s,.65*s,1.2*s);}
 for(const [x,z,s] of [[-5,-3,1],[4,-4,1.3],[-6,2,.8],[6,1,1.1]])tree(park,x,z,s);
 b(park,wood,-1,.95,-2,2.6,.2,.65);for(const x of [-2,0]){b(park,metal,x,.5,-2,.15,.9,.5);b(park,wood,x,1.45,-2,.16,1.1,.19);}
 const school=makeSet('school'),office=makeSet('office'),shop=makeSet('shop'),riverside=makeSet('riverside',mat(0x40554c)),wedding=makeSet('wedding',mat(0xd9bfad)),home=makeSet('home',mat(0x8b7360));
 const legacy=createReverieSets(stage,{coarse});
 legacy.school.visible=legacy.shop.visible=legacy.room.visible=false;
 // The same physical classroom and shop from IV->V now appear in the life film.
 school.add(legacy.school);shop.add(legacy.shop);
 // Add a detailed office with typing desk, PC monitors, overhead fixtures and windows.
 b(office,pale,0,3.1,-4,12,6,.25);b(office,metal,-5,3,0,.17,6,10);
 for(let x=-3.5;x<=3.5;x+=2.35){b(office,glass,x,3,-3.82,1.5,3.5,.06);b(office,metal,x,3,-3.74,.08,3.7,.08);}
 b(office,wood,0,1.1,.8,4.2,.17,2.3);for(const x of [-1.8,1.8])b(office,metal,x,.55,.8,.08,1.1,1.7);
 b(office,metal,1.0,1.75,.18,1.9,1.3,.15);b(office,glass,1,1.8,.285,1.7,1.1,.03);
 b(office,dark,-.6,1.29,1.05,1.7,.05,.65);for(let i=0;i<15;i++)b(office,metal,-1.3+(i%5)*.3,1.32,.8+Math.floor(i/5)*.17,.21,.018,.08);
 cyl(office,metal,-3.8,2.4,-2,.26,4.6);ball(office,gold,-3.8,4.65,-2,.5,.12,.5);
 // Real river water sheets and moving glints beyond the embankment.
 const river=mesh(riverside,geo(new THREE.PlaneGeometry(30,12,20,8)),mat(0x3e8396,{metalness:.55,roughness:.25}),[0,-.02,-5],[1,1,1]);river.rotation.x=-Math.PI/2;
 for(let i=0;i<8;i++){b(riverside,wood,-7+i*2,.36,0,.14,.72,.14);b(riverside,wood,-7+i*2,.69,0,2.04,.08,.09);}
 for(const x of [-4,4]){cyl(riverside,metal,x,1.5,-.6,.1,3);ball(riverside,gold,x,3,-.6,.3,.32,.3);}
 // A volumetric 3D wedding arch, flowers, altar, benches and guests.
 for(const x of [-2,2]){cyl(wedding,pale,x,2,-2,.21,4.2);for(let i=0;i<5;i++)ball(wedding,i%2?pink:leaf,x+(i%2?-.2:.2),3.1+i*.18,-2,.25);}
 const arch=mesh(wedding,geo(new THREE.TorusGeometry(2.1,.17,12,60,Math.PI)),gold,[0,4.1,-2],[1,1,1]);arch.rotation.z=0;
 b(wedding,wood,0,.12,-1,5.2,.2,3);
 for(const x of [-5,5])for(const z of [-2,1,4]){b(wedding,wood,x,.53,z,1.5,.12,.72);b(wedding,pale,x,1.0,z-.4,1.5,.92,.12);}
 // A household interior with an actual sofa, dinner table, lamp and toy blocks.
 b(home,pale,0,3,-4.5,12,6,.2);
 for(const x of [-4,4]){b(home,glass,x,3.1,-4.36,2.2,2.7,.06);b(home,wood,x,3.1,-4.27,.08,3,.1);}
 b(home,wood,-3,.58,-1.6,3,.9,1.5);b(home,pink,-3,1.3,-2.1,3,1.3,.42);
 for(let i=0;i<3;i++)b(home,cloth,-3.9+i*.86,1.13,-1.22,.76,.28,.5);
 b(home,wood,1,.98,1.5,3.6,.2,2.2);for(const x of [-.45,2.45])for(const z of [.65,2.35])b(home,wood,x,.49,z,.13,.95,.13);
 for(let i=0;i<5;i++)b(home,i%2?pink:cloth,-2+i*.43,.15,1.6+i%2*.35,.32,.3,.32);
 cyl(home,metal,-5.1,2.5,1.2,.07,4.8);ball(home,gold,-5.1,4.7,1.2,.5,.3,.5);
 const phoneFrame=mat(0x0d1016,{metalness:.7,roughness:.23}),phoneGlass=mat(0xffffff,{roughness:.08,metalness:.1});
 const phone=new THREE.Group();phone.name='gyuwon-child-phone';phone.position.set(1.0,1.55,1.5);home.add(phone);
 b(phone,phoneFrame,0,0,0,1.0,1.76,.1);b(phone,phoneGlass,0,0,.058,.92,1.68,.013);
 const phoneTexture=phoneMural(doc);tex.add(phoneTexture);
 const screenMat=new THREE.MeshBasicMaterial({map:phoneTexture,toneMapped:false});mats.add(screenMat);
 b(phone,screenMat,0,.005,.069,.87,1.57,.012);
 ball(phone,metal,0,-.81,.082,.034,.034,.034);
 phone.rotation.x=-.18;
 // Preserve the actual rigged, photographed Gyuwon from the earlier 3D film.
 const actor=createReverieActor(stage,source);
 // Supporting characters have their own joints rather than flat paper silhouettes.
 function person(name,coat,hairColor,{scale=1,small=false}={}){
  const root=new THREE.Group();root.name=name;root.scale.setScalar(scale);stage.add(root);
  const clothing=mat(coat),hair=mat(hairColor),eyes=mat(0x1b1b21),shoe=mat(0x272b35);
  const trunk=cyl(root,clothing,0,1.72,0,.36,.96,.30);trunk.scale.x=.37;trunk.scale.z=.29;
  cyl(root,skin,0,2.27,0,.14,.3,.14);
  ball(root,skin,0,2.72,0,.32,.42,.29);
  ball(root,hair,0,3.01,-.09,.34,.23,.32);
  if(!small){for(const s of [-1,1])ball(root,hair,s*.31,2.82,-.08,.10,.3,.18);}
  for(const s of [-1,1]){ball(root,eyes,s*.125,2.73,.28,.025,.029,.02);}
  const shoulders=[],elbows=[],hips=[];
  for(const s of [-1,1]){
   const arm=new THREE.Group();arm.position.set(s*.4,2.08,0);root.add(arm);
   cyl(arm,clothing,0,-.33,0,.14,.72,.14);const elbow=new THREE.Group();elbow.position.y=-.69;arm.add(elbow);
   cyl(elbow,skin,0,-.21,0,.11,.44,.11);ball(elbow,skin,0,-.47,0,.13,.15,.12);
   shoulders.push(arm);elbows.push(elbow);
   const hip=new THREE.Group();hip.position.set(s*.2,1.28,0);root.add(hip);
   cyl(hip,clothing,0,-.48,0,.16,.95,.16);ball(hip,shoe,0,-1.02,.15,.19,.12,.31);hips.push(hip);
  }
  return {root,shoulders,elbows,hips,update(time,kind){
   const walk=kind==='walk'||kind==='dance',swing=walk?.26:.035;
   shoulders.forEach((o,i)=>{o.rotation.x=-.08+Math.sin(time*(walk?4.7:1)+i*Math.PI)*swing;o.rotation.z=(i?1:-1)*.08;});
   elbows.forEach((o,i)=>{o.rotation.x=kind==='point'&&i===0?-.94:kind==='embrace'?-.8:-.12;});
   hips.forEach((o,i)=>{o.rotation.x=Math.sin(time*4.7+i*Math.PI)*(walk?.29:.015);});
   root.position.y=walk?Math.sin(time*9)*.03:Math.sin(time*1.6)*.008;
  }};
 }
 const partner=person('gyuwon-life-partner',0xb67f8b,0x3c302e);
 const child=person('gyuwon-life-child',0x7598ab,0x302e30,{scale:.57,small:true});
 const fill=new THREE.HemisphereLight(0xd8e4f0,0x2b3443,1.9);scene.add(fill);
 const sun=new THREE.DirectionalLight(0xffe0bd,2.4);sun.position.set(4,8,5);scene.add(sun);
 const rim=new THREE.PointLight(0xf9bb82,20,22,1.8);rim.position.set(-3,3,-2);scene.add(rim);
 const particlesGeo=geo(new THREE.BufferGeometry()),positions=[];
 for(let i=0;i<(coarse?70:150);i++){const k=i*1.91;positions.push(Math.sin(k)*8,1+(i%13)*.51,Math.cos(k*1.37)*4);}
 particlesGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const particlesMat=new THREE.PointsMaterial({color:0xffe8c0,size:.038,transparent:true,opacity:.5});
 mats.add(particlesMat);
 const motes=new THREE.Points(particlesGeo,particlesMat);stage.add(motes);
 let current=null,disposed=false,lastFrame=null;
 function update(frame,width=1280,height=720){
  if(disposed)return;
  lastFrame=frame;
  const sceneKey=GYUWON_LIFE_SCENE[frame.shot]||'afterglow';
  current=sceneKey;
  for(const [key,p] of groups)p.visible=key===sceneKey;
  if(sceneKey==='portal'){camera.position.set(0,2,5);return;}
  actor.root.visible=true;partner.root.visible=['love','wedding','family','child','answer','phone'].includes(frame.shot);
  child.root.visible=['family','child','answer','phone'].includes(frame.shot);
  const family=['family','child','answer','phone'].includes(frame.shot),t=frame.time;
  const place=frame.shot==='study'?'school':frame.shot==='parttime'?'shop':family?'room':'aftermath';
  actor.update({time:t,place,local:frame.time%9,shot:frame.shot}, {x:0,y:0,z:0});
  // Every major shot is animated by the real hip/torso/arm joints.
  actor.root.position.set(0,0,0);
  actor.root.rotation.y=frame.shot==='study'?.28:frame.shot==='work'?-.16:frame.shot==='parttime'?.13:frame.shot==='love'?.07:frame.shot==='phone'?-.17:0;
  const head=actor.root.getObjectByName('gyuwon-head');
  const left=actor.root.getObjectByName('gyuwon-left-shoulder-rig'),right=actor.root.getObjectByName('gyuwon-right-shoulder-rig');
  if(head)head.rotation.x+=frame.shot==='realization'?(1-ease(frame.progress))*.16:frame.shot==='child'?.15:frame.shot==='answer'?-.07:0;
  if(right)right.rotation.x+=frame.shot==='youth'?Math.sin(t*3)*.38:frame.shot==='work'?-.45:frame.shot==='answer'?-0.7:frame.shot==='family'?-.28:0;
  if(left)left.rotation.x+=frame.shot==='love'?-.57:frame.shot==='wedding'?-.72:frame.shot==='family'?-.48:0;
  partner.root.position.set(family?-1.45:frame.shot==='wedding'?1.04:1.15,0,frame.shot==='wedding'?.0:family?-.4:.3);
  partner.root.rotation.y=frame.shot==='love'?-.25:0;
  partner.update(t,frame.shot==='love'?'walk':frame.shot==='wedding'?'embrace':'rest');
  child.root.position.set(family?1.65:1.65,0,family?.1:.6);child.update(t,frame.shot==='child'?'point':'walk');
  if(frame.shot==='child'||frame.shot==='answer')child.shoulders[0].rotation.x=-1.17;
  const p=gyuwonLifeCameraAt(frame.shot,frame.progress,width<height);
  camera.aspect=Math.max(.1,width/Math.max(1,height));camera.fov=p.fov;camera.position.set(...p.position);camera.lookAt(...p.target);camera.updateProjectionMatrix();
  phone.rotation.x=lerp(-.18,0,ease(frame.shot==='phone'?frame.progress:0));
  phone.position.y=1.55+.25*ease(frame.shot==='phone'?frame.progress:0);
  const evening=['realization','parttime','family','child','answer','phone'].includes(frame.shot);
  const bg=evening?0x1a2536:frame.shot==='wedding'?0xa88b91:frame.shot==='love'?0x687b88:0x617d89;
  scene.background.setHex(bg);scene.fog.color.copy(scene.background);scene.fog.density=.015;
  sun.color.setHex(evening?0xffc9a4:0xfff2da);sun.intensity=evening?2:2.6;
  rim.intensity=frame.shot==='wedding'?35:frame.shot==='realization'?25:13;
  motes.visible=['realization','youth','love','wedding'].includes(frame.shot);
  motes.rotation.y=t*.012;
 }
 function render(renderer){
  if(disposed||!lastFrame||current==='portal')return;
  renderer.setRenderTarget(null);
  renderer.clear(true,true,true);
  renderer.render(scene,camera);
 }
 function dispose(){
  if(disposed)return;disposed=true;
  actor.dispose();legacy.dispose();
  for(const g of geos)g.dispose();
  for(const m of mats)m.dispose();
  for(const t of tex)t.dispose();
  stage.removeFromParent();
 }
 return {scene,camera,update,render,dispose,get sceneKey(){return current;}};
}
