import * as THREE from 'three';
import {createCameraVisibility} from './camera-visibility.mjs';
import {GYUWON_YEAR_WORLDS,annualWorldLayers,annualWorldBlend,worldEase,omrFloorAngle,OMR_FLOOR_PANELS} from './gyuwon-year-world-data.mjs';

// One reusable architectural kit, instanced by material. All scenery outside
// the shared arena is decorative; real cover, poison and OMR hits stay in combat.
export function createGyuwonYearWorld(scene,{coarse=false,artMaterials=[],fragment=()=>null}={}){
 const root=new THREE.Group();root.name='gyuwon-eleven-lived-worlds';scene.add(root);
 const entries=new Map(),geometries=[],materials=[],textures=[],instances=[];
 const geo=g=>(geometries.push(g),g),mats=new Map(),dummy=new THREE.Object3D(),tint=new THREE.Color();
 const shape=new THREE.Shape();shape.moveTo(-.48,-.5);shape.lineTo(.48,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.48);shape.lineTo(.5,.48);shape.quadraticCurveTo(.5,.5,.48,.5);shape.lineTo(-.48,.5);shape.quadraticCurveTo(-.5,.5,-.5,.48);shape.lineTo(-.5,-.48);shape.quadraticCurveTo(-.5,-.5,-.48,-.5);
 const box=geo(new THREE.ExtrudeGeometry(shape,{depth:.96,bevelEnabled:true,bevelSize:.015,bevelThickness:.02,bevelSegments:1,steps:1}).translate(0,0,-.48));
 const smallBox=geo(new THREE.BoxGeometry(1,1,1)),track=geo(new THREE.RingGeometry(.998,1,128)),field=geo(new THREE.CircleGeometry(1,96));
 const tube=geo(new THREE.CylinderGeometry(1,1,1,coarse?10:16)),ball=geo(new THREE.SphereGeometry(1,coarse?10:16,coarse?8:12)),ring=geo(new THREE.TorusGeometry(1,.035,6,48)),plane=geo(new THREE.PlaneGeometry(1,1));
 const noise=new Uint8Array(64*64*4);for(let i=0;i<64*64;i++){const n=165+((i*73+(i>>6)*37)%61);noise.set([n,n,n,255],i*4);}
 const grain=new THREE.DataTexture(noise,64,64);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(7,7);grain.needsUpdate=true;textures.push(grain);
 function mat(color,metal=0,glow=0){const key=[color,metal,glow].join(':');if(!mats.has(key)){const m=new THREE.MeshStandardMaterial({color,roughness:metal?.4:.86,metalness:metal,roughnessMap:grain,emissive:color,emissiveIntensity:glow});mats.set(key,m);materials.push(m);}return mats.get(key);}
 const concrete=mat(0x8a867b),wood=mat(0x6a4434),ivory=mat(0xded9c9),iron=mat(0x313c43,.65),gold=mat(0xc99d55,.64),glass=mat(0x77989c,.25,.12),ink=mat(0x252c32),paper=mat(0xe8e1cc),green=mat(0x315142),blue=mat(0x416b7a,.3),violet=mat(0x7e6a95,.22),lamp=mat(0xd5efdd,0,.9);
 const floorMaterial=mat(0x9d7252),floor=new THREE.Mesh(geo(new THREE.PlaneGeometry(900,900)),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.receiveShadow=true;floor.userData.cameraOcclusion=false;root.add(floor);
 // GPU batches live under a movable sector. Books/desks never become hundreds
 // of separate draw calls and no batch is rebuilt at a year transition.
 function kit(parent){const batches=new Map();return {
  put(g,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){if(g===box&&Math.max(Math.abs(sx),Math.abs(sy),Math.abs(sz))<=5)g=smallBox;const key=g.uuid+':'+m.uuid;if(!batches.has(key))batches.set(key,{g,m,poses:[]});batches.get(key).poses.push([x,y,z,sx,sy,sz,rx,ry,rz]);},
  finish(){for(const {g,m,poses}of batches.values()){const mesh=new THREE.InstancedMesh(g,m,poses.length);mesh.name='gyuwon-world-batch';poses.forEach((v,i)=>{dummy.position.set(...v.slice(0,3));dummy.scale.set(...v.slice(3,6));dummy.rotation.set(...v.slice(6,9));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);instances.push(mesh);}}
 };}
 const sector=(parent,name)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
 function desks(k,x,z,rows=3,columns=5){for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const dx=x+c*3.1,dz=z+r*3.8;if(Math.hypot(dx,dz)<33)continue;k.put(box,wood,dx,1.55,dz,2.4,.14,1.6);for(const side of [-1,1]){k.put(tube,iron,dx+side*.9,.75,dz,.04,1.5,.04);k.put(box,iron,dx+side*.9,.14,dz+.2,.09,.1,1.4);}k.put(box,paper,dx,1.69,dz,.95,.08,.75);k.put(box,wood,dx,.8,dz+1.5,1.4,.13,1.1);k.put(box,wood,dx,1.4,dz+1.95,1.4,1,.1);}}
 function school(k,{ruined=false,submerged=false}={}){
  for(const wing of [-1,0,1]){const x=wing*47,z=wing?0:-47,w=wing?10:94,d=wing?84:9,h=ruined?14:22;
   k.put(box,submerged?blue:concrete,x,h/2,z,w,h,d);
   for(let row=0;row<4;row++)for(let col=0;col<(wing?10:14);col++){
    if(ruined&&(col+row)%3===0)continue;
    const px=wing?x-wing*5.1:-43+col*6.6,pz=wing?-35+col*7.3:z+4.6;
    k.put(box,iron,px,3.1+row*4.8,pz,wing?.15:3.7,3.2,wing?3.7:.15);
    k.put(box,glass,px+(wing?-wing*.1:0),3.1+row*4.8,pz+(wing?0:.1),wing?.12:3.25,2.8,wing?3.25:.12);
   }
   for(let row=0;row<5;row++)k.put(box,ivory,x,1+row*4.8,z,w+.35,.26,d+.35);
  }
  k.put(box,ivory,0,7.5,-40.9,18,15,1.4);k.put(box,ink,0,4.2,-40,6.2,8.4,.3);
  k.put(ring,ivory,0,16,-40,2.25,2.25,1);k.put(box,ink,0,16.7,-39.9,.1,1.4,.08);k.put(box,ink,.5,16,-39.9,1.1,.1,.08);
 }
 function library(k,parent,moving){
  for(let i=0;i<12;i++){const a=i*Math.PI/6,r=36,g=moving&&i%4===0?sector(parent,'gyuwon-sliding-bookcase'):null,b=g?kit(g):k;
   if(g){g.position.set(Math.sin(a)*r,0,Math.cos(a)*r);g.rotation.y=a;moving.push({group:g,baseX:g.position.x,baseZ:g.position.z,a});}
   const transform=(x,y,z,sx,sy,sz,m)=>{if(g)b.put(box,m,x,y,z,sx,sy,sz);else b.put(box,m,Math.sin(a)*r+Math.cos(a)*x+Math.sin(a)*z,y,Math.cos(a)*r-Math.sin(a)*x+Math.cos(a)*z,sx,sy,sz,0,a);};
   for(const x of [-4.4,4.4])transform(x,13,0,.35,26,2.5,wood);
   for(let shelf=0;shelf<8;shelf++){const y=1.3+shelf*3.1;transform(0,y,0,9,.25,2.6,wood);for(let book=0;book<(coarse?10:18);book++)transform(-4+book*(coarse?.82:.46),y+1.2,0,coarse?.62:.34,1.8+(book%3)*.25,1.7,book%3?paper:violet);}
   if(g)b.finish();
  }
 }
 function prepare(year){
  if(entries.has(year))return entries.get(year);
  const group=sector(root,'gyuwon-year-world-'+year),k=kit(group),entry={year,group,movers:[],wards:[],dead:Array(6).fill(false),tentacles:[],fragments:[],folds:[],lamps:[]};
  group.visible=false;entries.set(year,entry);
  if(year===1){
   school(k);k.put(box,green,0,-.13,0,180,.12,160);
   k.put(box,iron,0,-.025,-21,120,.045,8);for(let x=-50;x<=50;x+=5)k.put(box,ivory,x,.006,-21,2,.02,.2);
   k.put(field,green,0,-.04,0,22,22,22,-Math.PI/2);
   for(const r of [23.2,24.7,26.2])k.put(track,ivory,0,.012,0,r,r,r,-Math.PI/2);
   for(const x of [-32,32]){k.put(tube,ivory,x,1.5,0,.06,3,.06);k.put(box,ivory,x,3,0,.12,.12,7);for(let z=-3;z<=3;z+=1)k.put(tube,ivory,x,1.5,z,.015,3,.015);}
   const sun=new THREE.Mesh(ball,mat(0xffcd92,0,1));sun.scale.setScalar(13);sun.position.set(-95,39,-160);group.add(sun);
  }
  if(year===2){
   school(k);for(const x of [-39,27])desks(k,x,-29,17,5);desks(k,-25,-39,2,17);
   for(let x=-35;x<=35;x+=14)for(let z=-35;z<=35;z+=14){k.put(box,iron,x,15,z,6,.35,1.3);k.put(box,lamp,x,14.8,z,5.5,.08,.9);}
   k.put(box,green,0,5,-36,23,7,.3);for(let i=0;i<11;i++)k.put(box,ivory,-10+i*2,4+(i%3)*.9,-35.8,1,.06,.03);
  }
  if(year===3){library(k,group,entry.movers);for(let i=0;i<26;i++){const a=i*2.39996,r=33+i%4*2;k.put(box,paper,Math.sin(a)*r,.5+(i%4)*.27,Math.cos(a)*r,3,.4,2,0,i*.3);} }
  if(year===4){
   school(k,{ruined:true});k.put(box,concrete,0,-.02,0,16,.03,58);
   for(let i=0;i<45;i++){const a=i*2.39996,r=34+i%8*2;k.put(box,concrete,Math.sin(a)*r,.3+i%3*.3,Math.cos(a)*r,2+i%3,.5+i%2,1.5,0,i*.7,i%3*.2);k.put(tube,iron,Math.sin(a)*r,2.5,Math.cos(a)*r,.04,4,.04,i*.3,0,.4);}
   for(const x of [-35,35])for(let z=-32;z<=28;z+=12)for(let row=0;row<3;row++)for(let j=0;j<4;j++)k.put(ball,mat(0x73715d),x+(j%2)*1.1,.4+row*.55,z+j*1.6,1.2,.38,.65);
  }
  if(year===5){
   for(const x of [-37,37]){k.put(box,green,x,5,0,4,10,120);for(let z=-48;z<=48;z+=12){k.put(tube,iron,x*.91,6,z,1.2,10,1.2);k.put(ring,iron,x*.88,5,z,1.7,1.7,1,0,Math.PI/2);}}
   for(let i=0;i<7;i++)k.put(tube,iron,-37,2.5+i*1.25,0,.33,112,.33,Math.PI/2);
   for(let x=-16;x<=16;x+=16)for(let z=-16;z<=16;z+=16){k.put(tube,iron,x,-.01,z,2,.06,2);for(let j=-2;j<=2;j++)k.put(box,ink,x+j*.55,.025,z,.16,.025,3.2);}
   for(let i=0;i<22;i++){const a=i*2.39996,r=34+i%5;k.put(ball,green,Math.sin(a)*r,.12,Math.cos(a)*r,3.5,.12,2.5);}
  }
  if(year===6){
   for(let i=0;i<6;i++){const a=i*Math.PI/3,g=sector(group,'gyuwon-shrine-shop-wing-'+i);g.position.set(Math.sin(a)*39,0,Math.cos(a)*39);g.rotation.y=a+Math.PI;const b=kit(g);
    b.put(box,ivory,0,7,0,17,14,2);b.put(box,violet,0,14,0,18,1.2,4);for(const side of [-1,1]){b.put(tube,gold,side*7,7,2,.5,14,.5);b.put(box,gold,side*7,14.4,2,1.6,.4,1.6);}
    for(let row=0;row<4;row++)for(let col=-2;col<=2;col++){b.put(box,gold,col*2.4,1.7+row*2.8,1.5,2,.12,1.3);b.put(ball,col%2?blue:violet,col*2.4,2.4+row*2.8,1.5,.36,.65,.3);}
    b.finish();if(artMaterials[i]){const stand=new THREE.Mesh(plane,artMaterials[i]);stand.name='gyuwon-world-acrylic-character-'+i;stand.position.set(0,8,2.2);stand.scale.set(7.5,12,1);g.add(stand);}
    entry.wards.push({group:g,y:0,a,fall:0});
   }
  }
  if(year===7){
   k.put(box,iron,0,8,-40,25,16,8);k.put(box,gold,0,16.5,-40,27,1,9);k.put(ball,glass,0,15,-39,8,8,5);k.put(box,ink,0,5,-35.8,13,8,.3);k.put(ring,gold,0,15,-33.8,6,6,1);
   for(let i=0;i<14;i++){const a=i*2.39996;k.put(ball,i%2?violet:gold,Math.sin(a)*5,13+(i%4)*2,-38+Math.cos(a)*2,.9,.9,.9);}
   for(const side of [-1,1])for(const z of [-30,8,35]){const g=sector(group,'gyuwon-moving-studio-camera');g.position.set(side*35,0,z);const b=kit(g);b.put(tube,iron,0,2,0,.14,4,.14);for(const leg of [-1,1])b.put(tube,iron,leg*.7,1,0,.08,2.5,.08,0,0,leg*.55);b.put(box,iron,0,4.6,0,2,1.3,1.7);b.put(tube,glass,0,4.6,1.1,.4,1,.4,Math.PI/2);b.finish();entry.lamps.push(g);}
   for(let z=-30;z<=30;z+=15){k.put(tube,iron,-33,9,z,.16,18,.16);k.put(tube,iron,33,9,z,.16,18,.16);k.put(tube,iron,0,18,z,.16,66,.16,0,0,Math.PI/2);for(const x of [-22,0,22]){k.put(box,iron,x,17,z,2,2,2);k.put(tube,lamp,x,15.8,z,.7,.4,.7);}}
  }
  if(year===8){
   school(k,{ruined:true,submerged:true});
   for(let i=0;i<8;i++){const a=i*Math.PI/4,g=sector(group,'gyuwon-building-gripping-tentacle-'+i);const r=37;
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.sin(a)*r,0,Math.cos(a)*r),new THREE.Vector3(Math.sin(a+.1)*r,7,Math.cos(a+.1)*r),new THREE.Vector3(Math.sin(a-.08)*(r+2),17,Math.cos(a-.08)*(r+2)),new THREE.Vector3(Math.sin(a+.1)*(r-2),25,Math.cos(a+.1)*(r-2))]);
    const body=new THREE.Mesh(geo(new THREE.TubeGeometry(curve,coarse?18:28,1.1,coarse?7:10,false)),violet);body.name='gyuwon-school-bound-soft-tentacle';g.add(body);entry.tentacles.push(g);
    for(let j=0;j<8;j++){const p=curve.getPoint((j+.3)/9);k.put(ball,blue,p.x,p.y,p.z,.65,.25,.7);}
   }
   for(let i=0;i<17;i++){const a=i*2.39996;k.put(box,blue,Math.sin(a)*35,2+i%3,Math.cos(a)*35,4,.4,2,0,i*.2,.12);}
  }
  if(year===9||year===10){
   for(const [i,id]of ['sword','circus','gamble','tsunami'].entries()){
    const g=fragment(id);if(g){group.add(g);g.name='gyuwon-original-map-fragment-'+id;g.position.set(Math.sin(year===10?Math.PI+(i-1.5)*.5:i*Math.PI/2+.4)*43,year===10?8+(i%2)*2:10+(i%2)*2,Math.cos(year===10?Math.PI+(i-1.5)*.5:i*Math.PI/2+.4)*43);g.rotation.set(year===10?.12*(i-1):0,Math.atan2(-g.position.x,14-g.position.z),year===10?(i%2?.13:-.13):0);const foundation=new THREE.Mesh(box,id==='gamble'?gold:concrete);foundation.position.y=(g.userData.minY||-1)-.5;foundation.scale.set(16,.8,10);g.add(foundation);entry.fragments.push({group:g,id,baseY:g.position.y,baseZ:g.rotation.z});}
   }
   for(let i=0;i<22;i++){const a=i*2.39996,r=36+i%4*3;k.put(box,i%2?ivory:gold,Math.sin(a)*r,1+i%7,Math.cos(a)*r,6,.4,4,.12*Math.sin(i),a,.2*Math.cos(i));}
   if(year===10){const channel=sector(group,'gyuwon-sword-opened-blood-channel');channel.visible=false;entry.channel=channel;entry.channelParts=[];for(let i=0;i<8;i++){const piece=new THREE.Mesh(smallBox,mat(0x70202d,.18));piece.position.y=-.015;channel.add(piece);entry.channelParts.push(piece);}}
   if(year===10)for(let i=0;i<4;i++){const a=i*Math.PI/2;k.put(tube,gold,Math.sin(a)*36,13,Math.cos(a)*36,.6,28,.6,0,0,(i%2?1:-1)*.23);}
  }
  if(year===11){
   // The platform extends beyond the shared collision disk. Its visible edge
   // never becomes an invisible wall or an accidental unwalkable hole.
   k.put(box,ivory,0,-.28,0,64,.5,64);for(let x=-30;x<=30;x+=6)k.put(box,ink,x,.002,0,.025,.012,64);for(let z=-30;z<=30;z+=6)k.put(box,ink,0,.003,z,64,.012,.025);
   for(const p of OMR_FLOOR_PANELS){const g=sector(group,'gyuwon-omr-floor-hinge-'+p.side);g.position.x=p.hingeX;const mesh=new THREE.Mesh(box,ivory);mesh.position.set(-p.side*p.width/2,-.04,0);mesh.scale.set(p.width,.12,p.length);mesh.receiveShadow=true;mesh.userData.cameraOcclusion=false;g.add(mesh);entry.folds.push({group:g,panel:p});}
   for(const x of [-29,26])desks(k,x,-28,15,2);
  }
  k.finish();return entry;
 }
 const playerTarget=new THREE.Vector3(),bossTarget=new THREE.Vector3();
 let viewCamera=null;
 const visibility=createCameraVisibility(scene,{roots:()=>!root.visible||warmed&&viewCamera&&Math.hypot(viewCamera.position.x,viewCamera.position.z)<31?[]:[...entries.values()].filter(e=>e.group.visible).map(e=>e.group),targets:()=>[playerTarget,bossTarget],margin:1.6});
 let owner=null,disposed=false,active=[],warmed=false,warming=null,audit={totalMs:0,maxChunkMs:0,chunks:0};
 prepare(1);
 function clear(){active=[];owner=null;root.visible=false;for(const e of entries.values()){e.group.visible=false;e.dead.fill(false);e.lastCut=null;for(const w of e.wards)w.fall=0;}}
 function update(g,dt=0){
  if(disposed)return;
  if(!g.gyuwon?.years||g.status==='won'){root.visible=false;return;}
  if(owner!==g){clear();owner=g;}root.visible=true;
  const e=g.gyuwon.years,blend=annualWorldBlend(g),from=annualWorldLayers(blend.from,e.worldSeed),to=annualWorldLayers(blend.to,e.worldSeed);
  active=blend.from===blend.to?[...to]:[...new Set([...from,...to])];if(e.year>11&&e.cast==='nightmare365'&&!active.includes(11))active.push(11);
  for(const entry of entries.values())entry.group.visible=false;
  for(const id of active){const entry=prepare(id),out=blend.from!==blend.to&&from.includes(id)&&!to.includes(id),incoming=blend.from!==blend.to&&to.includes(id)&&!from.includes(id);
   entry.group.visible=out?blend.t<.995:incoming?blend.t>.005:true;
   entry.group.position.y=out?-15*blend.t*blend.t:incoming?-10*(1-blend.t):0;
   entry.group.rotation.z=out?-.11*blend.t:incoming?.08*(1-blend.t):0;
   entry.group.rotation.y=e.year>11&&id!==11?(active.indexOf(id)?-2:1)*Math.min(.65,.12+(e.year-12)*.035):0;
   for(const m of entry.movers){const d=Math.sin(g.time*.48+m.a)*1.1;m.group.position.x=m.baseX+Math.cos(m.a)*d;m.group.position.z=m.baseZ-Math.sin(m.a)*d;}
   if(id===6){for(const w of e.wards||[])if(w.hp<=0)entry.dead[w.index]=true;entry.wards.forEach((w,i)=>{w.fall+=((entry.dead[i]?1:0)-w.fall)*Math.min(1,dt*2.4);w.group.position.y=-7*w.fall;w.group.rotation.z=(i%2?1:-1)*w.fall*.25;});}
   entry.lamps.forEach((lamp,i)=>{const target=Math.atan2(g.player.x-lamp.position.x,g.player.z-lamp.position.z)+Math.sin(e.castT*2+i)*.08;lamp.rotation.y+=Math.atan2(Math.sin(target-lamp.rotation.y),Math.cos(target-lamp.rotation.y))*Math.min(1,dt*4);});
   entry.tentacles.forEach((limb,i)=>{const h=g.gyuwon.hazards.find(h=>h.armIndex===i),force=h?worldEase(1-(h.warn-h.age)/1.05):0;limb.position.y=Math.sin(g.time*.8+i)*.12+force*.3;limb.rotation.z=Math.sin(g.time+i)*.002+force*(i%2?1:-1)*.006;});
   entry.fragments.forEach(f=>{f.group.position.y=f.baseY+Math.sin(g.time*.45+f.baseY)*.4;const hit=g.gyuwon.hazards.find(h=>h.visual==='dice'&&h.age>=h.warn);const quake=hit?Math.sin((hit.age-hit.warn)*24)*.025:0;f.group.rotation.z+=(f.baseZ+quake-f.group.rotation.z)*Math.min(1,dt*8);f.group.scale.setScalar(f.group.scale.x+((f.id===g.gyuwon.stageMemory?1.08:1)-f.group.scale.x)*Math.min(1,dt*3));});
   if(entry.channel){const cut=g.gyuwon.hazards.find(h=>h.opensWave&&h.age>=h.warn);if(cut)entry.lastCut={...cut,at:g.time-(cut.age-cut.warn)};const c=entry.lastCut;entry.channel.visible=!!c&&g.time-c.at<6;if(entry.channel.visible){entry.channel.position.set(c.x,0,c.z);entry.channel.rotation.y=c.yaw;entry.channelParts.forEach((part,i)=>{part.scale.set(.25,.06,c.length/8*.94);part.position.z=(i-3.5)*c.length/8;});}}
   for(const {group,panel}of entry.folds)group.rotation.z=panel.side===1?-omrFloorAngle(g):omrFloorAngle(g);
  }
  const a=GYUWON_YEAR_WORLDS[from[0]-1],b=GYUWON_YEAR_WORLDS[to[0]-1],t=blend.from===blend.to?1:blend.t;
  floor.visible=!(to[0]===11&&t>.7);floor.material.color.setHex(a.floor).lerp(tint.setHex(b.floor),t);
  if(scene.background?.isColor)scene.background.setHex(a.sky).lerp(tint.setHex(b.sky),t);
  if(scene.fog){scene.fog.color.copy(scene.background);scene.fog.density=g.gyuwon.hazards.some(h=>h.shape==='wave')?Math.min(.0035,a.fog+(b.fog-a.fog)*t):a.fog+(b.fog-a.fog)*t;}
  playerTarget.set(g.player.x,1.4+(g.player.floorY||0),g.player.z);bossTarget.set(g.boss.x,2.1,g.boss.z);
  const sun=scene.children.find(o=>o.isDirectionalLight);if(sun){sun.color.setHex(a.sun).lerp(tint.setHex(b.sun),t);sun.intensity=a.light+(b.light-a.light)*t;}
 }
 async function warm(renderer,camera,{yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
  if(warming)return warming;if(disposed||warmed)return;
  warming=(async()=>{const now=()=>globalThis.performance?.now?.()??Date.now(),start=now(),target=renderer.setRenderTarget?new THREE.WebGLRenderTarget(16,16):null;if(target)target.texture.colorSpace=renderer.outputColorSpace||THREE.SRGBColorSpace;
   try{for(let year=1;year<=11;year++){
    if(disposed)return;const before=now(),entry=prepare(year);audit.maxChunkMs=Math.max(audit.maxChunkMs,now()-before);await yieldFrame();
    const meshes=[];entry.group.traverse(o=>{if(o.geometry)meshes.push(o);});
    for(let i=0;i<meshes.length;i+=12){if(disposed)return;
     const culling=meshes.map(o=>o.frustumCulled);
     const prior=renderer.getRenderTarget?.(),visible=root.visible,sceneVisibility=scene.children.filter(o=>o!==root&&!o.isLight).map(o=>[o,o.visible]),at=now();
     try{root.visible=true;entry.group.visible=true;for(const [o]of sceneVisibility)o.visible=false;meshes.forEach((o,n)=>{o.visible=n>=i&&n<i+12;o.frustumCulled=false;});renderer.compile?.(scene,camera);visibility.prepare(camera);try{renderer.compile?.(scene,camera);}finally{visibility.restore();}if(target){renderer.setRenderTarget(target);renderer.render(scene,camera);}}
     finally{visibility.restore();if(target)renderer.setRenderTarget(prior);root.visible=visible;entry.group.visible=false;meshes.forEach((o,n)=>{o.visible=true;o.frustumCulled=culling[n];});for(const [o,v]of sceneVisibility)o.visible=v;audit.maxChunkMs=Math.max(audit.maxChunkMs,now()-at);audit.chunks++;}
     await yieldFrame();
    }
   }if(!disposed)warmed=true;}finally{target?.dispose();audit.totalMs=now()-start;}
  })();return warming;
 }
 function dispose(){if(disposed)return;disposed=true;visibility.dispose();for(const e of entries.values())for(const f of e.fragments)f.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const m of instances)m.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.removeFromParent();entries.clear();}
 return {root,update,clear,prepare,precompileVisibility:(renderer,camera)=>{visibility.prepare(camera);try{renderer.compile?.(scene,camera);}finally{visibility.restore();}},createWarmCompanion:()=>{const proxy=new THREE.InstancedMesh(box,concrete,1);proxy.setMatrixAt(0,new THREE.Matrix4());proxy.name='gyuwon-world-lighting-preparation';return proxy;},setCamera:camera=>{viewCamera=camera;},prewarmProgressive:warm,dispose,stats:()=>({active:active.map(id=>GYUWON_YEAR_WORLDS[id-1].name),layers:[...active],fragmentSources:active.flatMap(id=>(entries.get(id)?.fragments||[]).map(f=>f.id)),built:entries.size,prewarmed:warmed,warmAudit:{...audit},batches:instances.length,instances:instances.reduce((n,o)=>n+o.count,0),cutaway:visibility.stats})};
}
