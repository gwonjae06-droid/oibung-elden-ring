import * as THREE from 'three';
import {createGyuwonLifeActor,gyuwonLifeAge} from './gyuwon-life-actor.mjs';
import {createGyuwonLifeSets} from './gyuwon-life-sets.mjs';
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const mix=(a,b,q)=>a.map((n,i)=>n+(b[i]-n)*q);
export const GYUWON_LIFE_SCENE=Object.freeze({
 realization:'room',youth:'park',study:'school',work:'office',parttime:'shop',
 love:'riverside',wedding:'wedding',family:'home',child:'home',answer:'home',phone:'home',
 portal:'portal',corridor:'portal',title:'portal'
});
const SHOTS=Object.freeze({
 youth:{p0:[-4.8,2.8,7.8],p1:[3.0,2.8,6.6],l0:[-1,2.1,0],l1:[1,2.2,0],fov:43},
 study:{p0:[-3.9,3.4,5.6],p1:[1.9,2.8,4.0],l0:[0,2.0,.3],l1:[0,2.3,.2],fov:40},
 work:{p0:[-4.1,3.4,5.6],p1:[-2.3,2.9,3.7],l0:[0,2.0,.5],l1:[0,2.15,.5],fov:41},
 parttime:{p0:[4.7,3.3,6.0],p1:[2.8,2.8,4.5],l0:[0,2.1,.7],l1:[.25,2.2,.9],fov:42},
 love:{p0:[-4.9,2.8,6.3],p1:[3.0,2.7,6.0],l0:[-1,2.0,.7],l1:[1,2.15,.7],fov:43},
 wedding:{p0:[-3.6,3.0,8.8],p1:[1.8,2.65,5.4],l0:[0,2.2,.2],l1:[0,2.2,.5],fov:40},
 family:{p0:[-4.0,3.4,6.4],p1:[2.9,2.9,5.3],l0:[0,2.05,-.1],l1:[.1,1.95,0],fov:42},
 child:{p0:[3.0,2.6,5.2],p1:[1.6,1.9,3.3],l0:[.0,1.5,.0],l1:[.15,1.4,.15],fov:40},
 answer:{p0:[-3.5,3.1,4.6],p1:[.1,2.7,3.5],l0:[-1.5,2.7,-1.2],l1:[-.5,2.0,-.5],fov:40},
 phone:{p0:[1.5,2.0,3.3],p1:[.28,1.4,.7],l0:[.2,1.3,.1],l1:[.2,1.3,.25],fov:38}
});
export function gyuwonLifeCameraAt(shot,progress,portrait=false){
 const q=ease(progress);let position,target,fov;
 if(shot==='realization'){
  const seconds=Math.max(0,Math.min(1,progress))*18;
  if(seconds<6){const p=ease(seconds/6);position=mix([0,4.75,-.35],[.4,4.2,5.4],p);target=mix([0,4.75,-1.8],[0,4,-.15],p);}
  else if(seconds<11){const p=ease((seconds-6)/5);position=mix([.4,4.2,5.4],[1.1,3.25,3.8],p);target=mix([0,4,-.15],[0,2.70,.1],p);}
  else{const p=ease((seconds-11)/7);position=mix([1.1,3.25,3.8],[1.8,3.05,4.3],p);target=mix([0,2.70,.1],[0,2.76,0],p);}
  fov=42;
 }else{
  const s=SHOTS[shot]||SHOTS.answer;position=mix(s.p0,s.p1,q);target=mix(s.l0,s.l1,q);fov=s.fov-(shot==='phone'?8:2)*q;
 }
 if(portrait&&shot!=='phone')position[2]+=2.2;
 return {position,target,fov};
}
function createPhoneTexture(doc){
 const canvas=doc.createElement('canvas');canvas.width=512;canvas.height=896;const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 let disposed=false;
 const paint=image=>{
  if(disposed||!ctx)return;ctx.fillStyle='#171820';ctx.fillRect(0,0,512,896);
  if(image)ctx.drawImage(image,0,0,512,896);
  ctx.fillStyle='#06090b66';ctx.fillRect(0,0,512,896);
  ctx.textAlign='center';ctx.fillStyle='#e5cda3';ctx.font='600 57px Georgia';ctx.fillText('ODEN RING',256,380);
  ctx.font='28px sans-serif';ctx.fillText('두상의 서약',256,435);ctx.font='18px sans-serif';ctx.fillText('다섯 소망. 하나의 서약.',256,494);texture.needsUpdate=true;
 };
 paint();const ImageCtor=doc.defaultView?.Image;let image=null;
 if(ImageCtor){image=new ImageCtor();image.onload=()=>paint(image);image.src=new URL('../assets/art/temple-wall-v1.jpg',import.meta.url).href;}
 return {texture,dispose(){disposed=true;if(image)image.onload=null;texture.dispose();}};
}
export function createGyuwonLifeStage3d({doc,source,coarse=false}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x1a2432);scene.fog=new THREE.FogExp2(0x1a2432,.012);
 const camera=new THREE.PerspectiveCamera(42,1,.035,180),root=new THREE.Group();root.name='gyuwon-life-cinema';scene.add(root);
 const sets=createGyuwonLifeSets(root,{doc,coarse});
 const actor=createGyuwonLifeActor(root,source,{coarse}),partner=createGyuwonLifeActor(root,source,{role:'partner',coarse}),child=createGyuwonLifeActor(root,source,{role:'child',coarse});
 const fill=new THREE.HemisphereLight(0xe1e8ee,0x36333b,1.65),key=new THREE.DirectionalLight(0xffe2c4,2.6);
 key.position.set(4,7,5);key.castShadow=!coarse;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:35});key.shadow.camera.updateProjectionMatrix();key.shadow.normalBias=.025;
 const windowLight=new THREE.SpotLight(0xabc9ec,18,24,Math.PI/5,.75,1.7);windowLight.position.set(4,5,-3);windowLight.target.position.set(-1,1.3,1);scene.add(fill,key,windowLight,windowLight.target);
 const ownedGeo=[],ownedMat=[];
 const mat=(color,options={})=>{const m=new THREE.MeshPhysicalMaterial({color,roughness:.75,...options});ownedMat.push(m);return m;};
 const mesh=(parent,geometry,material,name)=>{ownedGeo.push(geometry);const o=new THREE.Mesh(geometry,material);o.name=name;parent.add(o);return o;};
 const pencil=mesh(actor.arms[1].wrist,new THREE.CylinderGeometry(.016,.018,.45,12),mat(0xbaa16b),'life-studying-pencil');pencil.rotation.x=.5;pencil.position.set(0,-.17,.1);
 const nib=mesh(pencil,new THREE.ConeGeometry(.018,.06,12),mat(0x35312e),'life-writing-pencil-tip');nib.position.y=-.255;nib.rotation.z=Math.PI;
 const baby=new THREE.Group();baby.name='life-newborn-in-parent-arms';root.add(baby);
 const blanket=mesh(baby,new THREE.LatheGeometry([[.07,-.38],[.24,-.30],[.28,0],[.24,.30],[.10,.34]].map(p=>new THREE.Vector2(...p)),coarse?24:40),mat(0xe3cebb,{roughness:.95}),'life-folded-baby-blanket');blanket.rotation.z=Math.PI/2;
 const babyFace=mesh(baby,new THREE.SphereGeometry(.16,24,18),mat(0xd7af97),'life-newborn-face');babyFace.position.set(.27,.04,.12);babyFace.scale.z=.75;
 const ring=mesh(root,new THREE.TorusGeometry(.048,.009,8,24),mat(0xd2b47c,{metalness:.88,roughness:.28}),'life-exchanged-wedding-ring');
 const phone=new THREE.Group();phone.name='gyuwon-child-phone';root.add(phone);phone.scale.setScalar(.57);phone.rotation.set(-.13,0,0);
 mesh(phone,new THREE.BoxGeometry(.55,.97,.065,2,2,1),mat(0x17191d,{metalness:.7,roughness:.26}),'life-handheld-phone-case');
 const display=createPhoneTexture(doc),screenMat=new THREE.MeshBasicMaterial({map:display.texture,toneMapped:false});ownedMat.push(screenMat);
 const screen=mesh(phone,new THREE.PlaneGeometry(.51,.90),screenMat,'life-phone-original-home-mural');screen.position.z=.037;
 const handsetPoint=new THREE.Vector3(),normal=new THREE.Vector3(),target=new THREE.Vector3(),hand=new THREE.Vector3();
 let current=null,lastFrame=null,disposed=false;
 function update(frame,width=1280,height=720){
  if(disposed)return;lastFrame=frame;current=GYUWON_LIFE_SCENE[frame.shot]||'room';
  if(current==='portal')return;
  const id=frame.shot,t=frame.time,q=ease(frame.progress),age=gyuwonLifeAge(id,frame.progress);
  actor.root.visible=true;partner.root.visible=['love','wedding','family','child','answer','phone'].includes(id);
  child.root.visible=['child','answer','phone'].includes(id)||id==='family'&&frame.progress>.48;
  partner.root.scale.setScalar(.96);child.root.scale.setScalar(id==='family'?.43:.57);
  const sit=['realization','study','work','child','answer','phone'].includes(id)?1:0;
  const kind=id==='study'?'write':id==='work'?'type':id==='parttime'?'cashier':['youth','love'].includes(id)?'walk':'stand';
  const distance=['youth','love'].includes(id)?frame.progress*2.2:0;
  actor.root.position.set(id==='youth'?-1.1+distance:id==='love'?-1.1+distance:['child','answer','phone'].includes(id)?-1.5:id==='wedding'?-.65:id==='family'?-.8:0,0,['child','answer','phone'].includes(id)?-1.35:id==='love'?1.35:0);
  actor.root.rotation.set(0,['youth','love'].includes(id)?Math.PI/2:id==='wedding'?.2:id==='child'||id==='answer'?.20:0,0);
  actor.pose({time:t,age,kind,distance,sit,look:id==='realization'?.20-.25*ease((t-6)/10):id==='study'?.28:['child','answer'].includes(id)?.18:.03,
   colour:id==='wedding'?0x293944:id==='work'?0x778589:id==='parttime'?0x9ca5a7:id==='youth'?0x789597:0x6c7f85});
  partner.root.position.set(id==='love'?-1.1+distance:id==='wedding'?.65:['child','answer','phone'].includes(id)?-3.4:.65,0,id==='love'?.10:['child','answer','phone'].includes(id)?-1.35:-.15);
  partner.root.rotation.set(0,id==='love'?Math.PI/2:id==='wedding'?-.20:0,0);
  partner.pose({time:t,age:age-2,kind:id==='love'?'walk':'stand',distance,sit:['child','answer','phone'].includes(id)?1:0,colour:id==='wedding'?0xded7c7:0x9a7b80});
  child.root.position.set(id==='family'?1.2:.30,0,id==='family'?.35:-.10);child.root.rotation.set(0,-.1,0);
  child.pose({time:t,age:9,kind:'stand',look:.05,colour:0x7c9ba8});
  phone.visible=['child','answer','phone'].includes(id);pencil.visible=id==='study';baby.visible=id==='family'&&frame.progress<.48;ring.visible=id==='wedding';
  if(id==='study'){
   actor.reach(1,target.set(.10+Math.sin(t*3)*.025,1.91, .90+Math.sin(t*4)*.02));actor.orientHand(1,-.5);
   actor.reach(0,target.set(-.35,1.73,1.03));actor.orientHand(0,.75);
  }
  if(id==='work'){actor.reach(0,target.set(-.30,1.58,.95));actor.reach(1,target.set(.30,1.58,.95));}
  if(id==='love'){hand.set(actor.root.position.x,2.13,.72);actor.reach(0,hand);partner.reach(1,hand);}
  if(id==='wedding'){hand.set(0,2.20,.66);actor.reach(1,hand,ease(frame.progress*4));partner.reach(0,hand,ease(frame.progress*4));ring.position.copy(hand);ring.rotation.y=t*.03;}
  if(baby.visible){baby.position.set(.60,1.92,.46);baby.rotation.z=.12;partner.reach(0,target.set(.32,1.84,.45));partner.reach(1,target.set(.88,1.84,.45));actor.reach(1,target.set(.22,2.0,.45));}
  if(phone.visible){
   child.reach(0,target.set(.28,1.28,.28));child.orientHand(0,0);child.root.updateWorldMatrix(true,true);
   child.arms[0].wrist.getWorldPosition(hand);phone.position.copy(hand).add(new THREE.Vector3(.01,-.07,.09));
   child.reach(1,target.copy(phone.position).add(new THREE.Vector3(.10,-.10,-.10)));child.orientHand(1,-.1,0,-.3);
   if(id==='answer')actor.head.rotation.y=.32;
  }
  const shot=gyuwonLifeCameraAt(id,frame.progress,width<height);
  camera.aspect=Math.max(.1,width/Math.max(1,height));camera.fov=shot.fov;camera.position.set(...shot.position);camera.lookAt(...shot.target);
  if(id==='phone'){
   phone.updateWorldMatrix(true,false);screen.getWorldPosition(handsetPoint);normal.set(0,0,1).transformDirection(screen.matrixWorld);
   const distance=3.15+(.47-3.15)*ease(frame.progress);
   camera.position.copy(handsetPoint).addScaledVector(normal,distance);camera.lookAt(handsetPoint);camera.fov=38-10*q;
  }
  camera.updateProjectionMatrix();
  const evening=['realization','parttime','family','child','answer','phone'].includes(id),bg=evening?0x283342:id==='wedding'?0xa6b0ad:0x819899;
  scene.background.setHex(bg);scene.fog.color.copy(scene.background);scene.fog.density=['park','riverside'].includes(current)?.012:.002;
  fill.intensity=evening?1.3:1.9;key.intensity=evening?1.8:2.6;key.color.setHex(evening?0xffd5af:0xffedda);
  windowLight.visible=['room','home','office','school'].includes(current);windowLight.intensity=current==='room'?12:current==='home'?9:15;
  sets.update({...frame,sceneKey:current},camera);
 }
 function render(renderer){if(disposed||!lastFrame||current==='portal')return;renderer.setRenderTarget(null);renderer.clear(true,true,true);renderer.render(scene,camera);}
 function dispose(){if(disposed)return;disposed=true;actor.dispose();partner.dispose();child.dispose();sets.dispose();display.dispose();for(const g of ownedGeo)g.dispose();for(const m of ownedMat)m.dispose();key.shadow.map?.dispose();root.removeFromParent();}
 return {scene,camera,update,render,dispose,get sceneKey(){return current;},stats:()=>({scene:current,age:actor.stats().age,sets:sets.stats(),cast:3})};
}
