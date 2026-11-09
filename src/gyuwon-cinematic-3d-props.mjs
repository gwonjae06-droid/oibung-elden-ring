// Authored hero props for the original musical. These are actual connected
// 3D set pieces (not coloured cubes standing in for objects): carved hinged
// doors, metal crown/sword/trumpets, mirrored frames, model worlds, rain/sea,
// articulated chorus, feathers, curtains and an illuminated final home.
// All geometry and materials are built once, animated from audio time and
// disposed with the boss. No collision, damage or invisible attack overlay.
import * as T from 'three';
import {gyuwonLyricStagePose} from './gyuwon-lyric-3d-art.mjs';
import {gyuwonCinematicMotionAt} from './gyuwon-cinematic-motion-score.mjs';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const ease=v=>{const x=clamp(v);return x*x*(3-2*x);};
const mix=(a,b,q)=>a+(b-a)*q;
export function createGyuwonCinematicProps(parent,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-cinematic-hero-props';parent.add(root);
 const geo=new Set(),mats=new Set(),groups=new Map(),rigs={};
 const g=x=>(geo.add(x),x),m=x=>(mats.add(x),x);
 const gold=m(new T.MeshStandardMaterial({color:0xc8a060,metalness:.82,roughness:.29,emissive:0x60401c,emissiveIntensity:.18}));
 const ivory=m(new T.MeshStandardMaterial({color:0xf1e3c9,roughness:.69}));
 const velvet=m(new T.MeshStandardMaterial({color:0x6e2a49,roughness:.94,side:T.DoubleSide}));
 const ink=m(new T.MeshStandardMaterial({color:0x302d43,roughness:.88}));
 const rose=m(new T.MeshStandardMaterial({color:0xb26d81,metalness:.18,roughness:.62}));
 const stone=m(new T.MeshStandardMaterial({color:0x8a96a5,roughness:.88}));
 const wood=m(new T.MeshStandardMaterial({color:0x806044,roughness:.77}));
 const leaf=m(new T.MeshStandardMaterial({color:0x548872,roughness:.89,side:T.DoubleSide}));
 const glass=m(new T.MeshPhysicalMaterial({color:0xc8d9e9,metalness:.24,roughness:.16,
   transparent:true,opacity:.47,depthWrite:false,side:T.DoubleSide}));
 const glow=m(new T.MeshBasicMaterial({color:0xffe6a5,transparent:true,opacity:.77,depthWrite:false,side:T.DoubleSide}));
 const metal=m(new T.MeshStandardMaterial({color:0xc0cbd8,metalness:.91,roughness:.23}));
 const box=g(new T.BoxGeometry(1,1,1));
 const orb=g(new T.SphereGeometry(1,coarse?10:20,coarse?8:14));
 const cone=g(new T.ConeGeometry(1,1,coarse?8:14));
 const cylinder=g(new T.CylinderGeometry(1,1,1,coarse?8:16));
 const tube=g(new T.TorusGeometry(1,.11,coarse?6:10,coarse?16:28));
 const blade=g(new T.ConeGeometry(1,1,4));
 const petal=g(new T.SphereGeometry(1,8,8));
 function mesh(par,geometry,material,{name='',pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]}={}){
  const o=new T.Mesh(geometry,material);o.name=name;
  o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rot);
  o.castShadow=false;o.receiveShadow=false;par.add(o);return o;
 }
 function group(key,pos=[0,0,-13]){
  const o=new T.Group();o.name='cinematic-'+key;o.position.set(...pos);
  root.add(o);groups.set(key,o);return o;
 }
 function bar(par,material,x,y,z,w,h,d){return mesh(par,box,material,{pos:[x,y,z],scale:[w,h,d]});}
 function ell(par,material,x,y,z,r=1){return mesh(par,orb,material,{pos:[x,y,z],scale:[r,r,r]});}
 function ring(par,material,x,y,z,sx=1,sy=1,sz=1){
  return mesh(par,tube,material,{pos:[x,y,z],scale:[sx,sy,sz]});
 }
 // Door set: curved glass transoms, hinged slabs, real jambs and handles.
 const doors=group('doors',[0,0,-17]),doorLeaves=[];
 for(let i=0;i<7;i++){
  const x=(i-3)*4.2,z=-Math.abs(i-3)*.5;
  const pair=new T.Group();pair.position.set(x,0,z);doors.add(pair);
  bar(pair,gold,-1.24,3.1,0,.24,6.2,.47);
  bar(pair,gold,1.24,3.1,0,.24,6.2,.47);
  bar(pair,gold,0,6.24,0,2.75,.36,.52);
  const sash=new T.Group();sash.position.set(-1.1,0,0);pair.add(sash);
  bar(sash,wood,1.1,3.05,0,2.12,5.89,.18);
  bar(sash,ink,1.1,4.15,.13,1.54,2.25,.06);
  ring(sash,gold,1.1,4.2,.2,.59,1.06,.1);
  ell(sash,gold,1.87,2.83,.19,.09);
  for(let j=0;j<3;j++)bar(sash,gold,1.11,1.5+j*.55,.12,1.55,.05,.06);
  doorLeaves.push(sash);
 }
 // Crown: actual hammered circular band, seven conical spires and gemstones.
 const crown=group('crown',[0,4,-11]);
 const band=ring(crown,gold,0,0,0,1.27,1.18,1.05);band.rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){
  const a=i*T.MathUtils.degToRad(40),x=Math.cos(a)*1.24,z=Math.sin(a)*1.24;
  const p=mesh(crown,cone,gold,{pos:[x,.65,z],scale:[.34,1.5,.34]});
  p.rotation.z=-Math.sin(a)*.13;p.rotation.x=Math.cos(a)*.13;
  ell(crown,i%3===0?glass:rose,x,.16,z,.2);
 }
 for(let i=0;i<22;i++){const a=i*Math.PI/11;ell(crown,ivory,Math.cos(a)*1.35,-.02,Math.sin(a)*1.35,.06);}
 // Sword: tapered forged blade, split hilt, cross-guard and a round pommel.
 const sword=group('sword',[0,4,-13]);
 const longBlade=mesh(sword,blade,metal,{pos:[0,3.5,0],scale:[.49,6.8,.20]});longBlade.rotation.y=Math.PI/4;
 bar(sword,gold,0,.05,0,3.3,.32,.48);bar(sword,ink,0,-.88,0,.38,2.06,.41);
 ell(sword,gold,0,-2.08,0,.37);ell(sword,rose,0,.19,.37,.21);
 for(const side of [-1,1]){const quillon=mesh(sword,cone,gold,{pos:[side*1.71,.15,0],scale:[.24,.72,.23]});quillon.rotation.z=side*Math.PI/2;}
 // Brass trumpets with actual bells and mouthpieces.
 const trumpets=group('trumpet',[0,4,-12]);
 for(let i=0;i<5;i++){
  const x=(i-2)*5,brass=new T.Group();brass.position.set(x,.5,0);brass.rotation.y=i%2?.18:-.18;trumpets.add(brass);
  const neck=mesh(brass,cylinder,gold,{pos:[0,0,1.2],scale:[.20,.20,3.4],rot:[Math.PI/2,0,0]});
  const bell=mesh(brass,cone,gold,{pos:[0,.01,3.15],scale:[.9,1.3,.9],rot:[Math.PI/2,0,0]});
  bar(brass,gold,.17,-.32,1.16,.08,.8,.06);
  for(let j=0;j<3;j++){bar(brass,ivory,-.32+j*.3,.15,1.3,.08,.42,.12);}
  ring(brass,metal,0,0,3.82,.74,.74,.74);
 }
 // Four tall glass mirrors: the interior contains silhouettes instead of
 // an expensive and inaccurate fake reflection render-to-texture.
 const mirrors=group('mirror',[0,0,-16]),mirrorPanels=[];
 for(let i=0;i<5;i++){
  const x=(i-2)*5.0,z=-Math.abs(i-2)*.7;
  bar(mirrors,gold,x-1.45,3.7,z,.23,7.6,.4);
  bar(mirrors,gold,x+1.45,3.7,z,.23,7.6,.4);
  bar(mirrors,gold,x,7.54,z,3.12,.24,.43);
  bar(mirrors,gold,x,.05,z,3.12,.24,.43);
  const panel=mesh(mirrors,box,glass,{pos:[x,3.75,z+.02],scale:[2.6,7.0,.065]});
  const shadow=mesh(mirrors,box,ink,{pos:[x,2.62,z+.06],scale:[.75,3.8,.12]});
  ell(mirrors,ivory,x,5.38,z+.12,.49);
  mirrorPanels.push({panel,shadow});
 }
 // A fully geometric animated sea: original vertex positions remain stable,
 // low-cost waves update their height/normals without per-frame mesh creation.
 const sea=group('sea',[0,0,-15]);
 const seaGeom=g(new T.PlaneGeometry(29,13,coarse?14:26,coarse?8:14));
 const seaBase=Float32Array.from(seaGeom.attributes.position.array);
 const seaSurf=m(new T.MeshStandardMaterial({color:0x438fb5,metalness:.39,roughness:.32,
  transparent:true,opacity:.78,side:T.DoubleSide,emissive:0x8e6847,emissiveIntensity:.18}));
 const seaSheet=mesh(sea,seaGeom,seaSurf,{pos:[0,1,0],rot:[-Math.PI/2,0,0]});
 const foam=[];
 for(let i=0;i<18;i++){
  const x=-12+(i%9)*3,y=i<9?-3:2.6;
  const crest=mesh(sea,orb,ivory,{pos:[x,1.36,y],scale:[.31,.085,.21]});
  foam.push({crest,x,y,i});
 }
 // A miniature town and forest float over a sculpted terrain plinth.
 const world=group('world',[0,3,-13]),worldIslands=[];
 for(let i=0;i<4;i++){
  const island=new T.Group();island.position.set((i-1.5)*5.7,0,-Math.abs(i-1.5)*.8);world.add(island);
  mesh(island,cylinder,stone,{pos:[0,0,0],scale:[2.1,.55,2.1]});
  if(i%2===0){
   for(let j=0;j<3;j++){const x=(j-1)*1.05;
    bar(island,ivory,x,.87,0,.6,1.55,.56);
    mesh(island,cone,rose,{pos:[x,1.97,0],scale:[.63,.83,.63]});}
  }else{
   for(let j=0;j<4;j++){const x=(j-1.5)*.8,z=(j%2-.5);
    bar(island,wood,x,.73,z,.17,.94,.18);
    mesh(island,cone,leaf,{pos:[x,1.62,z],scale:[.63,1.33,.63]});}
  }
  worldIslands.push(island);
 }
 // Final cottage: complete roof, door frame, steps, chimney and warm windows.
 const home=group('home',[0,0,-18]);
 bar(home,wood,0,2.55,0,8.4,5.05,5.2);
 for(const side of [-1,1]){
  const roof=mesh(home,box,rose,{pos:[side*2.32,5.95,0],scale:[5.48,.43,6.45]});
  roof.rotation.z=side*.58;
 }
 bar(home,stone,2.75,7.25,-1.4,1.02,3.4,1.3);
 bar(home,ink,0,1.78,2.66,2.1,3.58,.18);
 bar(home,gold,0,1.78,2.8,2.31,3.77,.08);
 ell(home,gold,.71,1.65,2.93,.12);
 for(const x of [-2.9,2.9]){
  bar(home,gold,x,3.15,2.69,1.52,1.62,.1);
  bar(home,glow,x,3.15,2.78,1.26,1.36,.06);
  bar(home,wood,x,3.15,2.85,.10,1.6,.1);
  bar(home,wood,x,3.15,2.85,1.52,.1,.1);
 }
 for(let i=0;i<4;i++)bar(home,stone,0,.18+i*.12,4.1+i*.54,3.9+i*.28,.25,.55);
 const porchLight=new T.PointLight(0xffdb9a,2,14,2);porchLight.position.set(0,3.1,4);home.add(porchLight);
 // Backlit velvet drapes have three separate cloth folds per wing.
 const curtain=group('curtain',[0,0,-14]),curtainWings=[];
 const clothGeo=g(new T.PlaneGeometry(7,13,coarse?12:28,9));
 const verts=clothGeo.attributes.position;
 for(let i=0;i<verts.count;i++)verts.setZ(i,Math.sin(verts.getX(i)*2.7)*.38);clothGeo.computeVertexNormals();
 for(const side of [-1,1]){
  const wing=mesh(curtain,clothGeo,velvet,{pos:[side*7.1,7,0]});
  curtainWings.push({wing,side});
  for(let i=0;i<5;i++)ell(curtain,gold,side*(3.8+i*1.1),13.3,.15,.10);
 }
 // Paired sculpted feathers.
 const wings=group('wings',[0,6,-12]),feathers=[];
 for(const side of [-1,1])for(let i=0;i<14;i++){
  const u=i/13,feather=mesh(wings,orb,i%3?ivory:gold,{
   pos:[side*(1.1+i*.74),Math.sin(u*Math.PI)*2.2-u*1.9,Math.cos(u*3)*.24],
   scale:[.36,1.65-u*.9,.18],rot:[0,0,side*(-.35-u*.3)]
  });feathers.push({feather,side,u});
 }
 // Mechanical theater platforms and lighting-rim studs.
 const stage=group('stage',[0,0,-13]);
 mesh(stage,cylinder,stone,{pos:[0,.5,0],scale:[8.3,.7,5.8]});
 mesh(stage,cylinder,wood,{pos:[0,.94,0],scale:[8.0,.23,5.6]});
 for(let i=0;i<32;i++){const a=i*Math.PI/16;
  ell(stage,gold,Math.sin(a)*8,.76,Math.cos(a)*5.5,.13);}
 // Five dancing/singing figurines with independently articulated arms.
 const ensemble=group('ensemble',[0,0,-15]),ensembleArms=[];
 for(let i=0;i<5;i++){
  const actor=new T.Group();actor.position.set((i-2)*4.9,0,-Math.abs(i-2)*.5);ensemble.add(actor);
  const chest=mesh(actor,cylinder,i%2?rose:ink,{pos:[0,2.65,0],scale:[.79,2.55,.66]});
  ell(actor,ivory,0,4.36,0,.57);
  for(const side of [-1,1]){bar(actor,ink,side*.39,.79,0,.39,1.5,.48);
   const shoulder=new T.Group();shoulder.position.set(side*.91,3.3,0);actor.add(shoulder);
   bar(shoulder,i%2?rose:ink,side*.35,-.66,0,.44,1.38,.38);
   ensembleArms.push({shoulder,side,index:i});}
 }
 // Weather particles: a batched instance call, not 60 standalone draw calls.
 const drops=group('rain',[0,0,-11]);
 const dropGeo=g(new T.CylinderGeometry(.028,.028,1,4));
 const rainBatch=new T.InstancedMesh(dropGeo,glass,coarse?32:64);
 rainBatch.instanceMatrix.setUsage(T.DynamicDrawUsage);rainBatch.frustumCulled=false;drops.add(rainBatch);
 const dust=group('stars',[0,0,-11]);
 const dustGeo=g(new T.IcosahedronGeometry(.15,0));
 const dustBatch=new T.InstancedMesh(dustGeo,gold,coarse?24:48);
 dustBatch.instanceMatrix.setUsage(T.DynamicDrawUsage);dustBatch.frustumCulled=false;dust.add(dustBatch);
 const dummy=new T.Object3D();
 // Heart-and-star finale objects; visible as a stage prop, not a flat HUD.
 const heart=group('heart',[0,4,-12]);
 for(const side of [-1,1]){
  const arc=new T.CatmullRomCurve3([
   new T.Vector3(0,-1.7,0),new T.Vector3(side*2.9,.8,0),
   new T.Vector3(side*1.7,2.3,0),new T.Vector3(0,1.2,0)]);
  mesh(heart,g(new T.TubeGeometry(arc,26,.15,6,false)),gold);
 }
 const flower=group('flower',[0,.5,-14]);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*5,z=Math.sin(a)*3;
  bar(flower,leaf,x,.75,z,.09,1.2,.09);
  for(let j=0;j<5;j++){const aa=j*Math.PI*2/5;
   const p=ell(flower,rose,x+Math.cos(aa)*.36,1.52+Math.sin(aa)*.36,z,.3);p.scale.set(.25,.32,.1);}
  ell(flower,gold,x,1.52,z,.19);
 }
 const aliases=Object.freeze({windows:'mirror',question:'mirror',clones:'ensemble',masks:'ensemble',
  dancers:'ensemble',choir:'ensemble',child:'ensemble',roads:'stage',road:'stage',
  steps:'stage',floor:'stage',ring:'stage',pulse:'stage',shield:'heart',arc:'heart',
  fog:'rain',elements:'rain',sky:'stars',sun:'stars',moon:'stars',star:'stars',
  hand:'heart',spotlight:'stage',dark:'mirror',ribbons:'stars'});
 const heroMaterials={doors:wood,crown:gold,sword:metal,trumpet:gold,mirror:glass,world:stone,
  home:wood,curtain:velvet,wings:ivory,stage:wood,ensemble:rose,rain:glass,stars:gold,heart:gold,flower:rose};
 let prevYear='',disposed=false,drawn=0,activeName=null;
 function update(m){
  if(disposed)return;
  const key=String(m?.finishing?'ending':m?.year);
  if(!['5','11','ending'].includes(key)){root.visible=false;return;}
  root.visible=true;
  for(const o of groups.values())o.visible=false;
  const cue=gyuwonLyricStagePose(key,m.time);
  if(!cue){activeName=null;return;}
  const phase=cue.phase,visual=cue.visual,t=m.time,
   active=groups.has(visual)?visual:aliases[visual]||'stage';
  activeName=active;
  const o=groups.get(active);o.visible=true;
  const lead=cue.instrumental?.68:ease(phase/.17)*(1-.17*ease((phase-.85)/.15));
  // Mechanical scenery eases its way in. No teleporting models or new meshes.
  const scale=.01+lead*.99;
  o.scale.set(scale,scale,scale);
  o.rotation.set(0,0,0);o.position.y=0;
  const move=gyuwonCinematicMotionAt(key,t),sway=move?.pose?.bank||0;
  if(active==='doors'){
   for(let i=0;i<doorLeaves.length;i++){
    const side=i%2?-1:1;
    doorLeaves[i].rotation.y=side*1.08*ease((phase-i*.045)/.7);
   }
  }else if(active==='sea'){
   const verts=seaGeom.attributes.position;
   for(let i=0;i<verts.count;i++){
    const j=i*3,x=seaBase[j],y=seaBase[j+1];
    verts.array[j+2]=Math.sin(x*.61+t*2.1+y*.25)*.35+
      Math.cos(y*.79+t*1.5-x*.13)*.22+
      Math.sin(x*.25-y*.34+t*.9)*.16;
   }
   verts.needsUpdate=true;seaGeom.computeVertexNormals();
   for(const {crest,x,y,i} of foam){
    const height=Math.sin(x*.61+t*2.1+y*.25)*.35+
     Math.cos(y*.79+t*1.5-x*.13)*.22+.95;
    crest.position.y=height+.18;crest.scale.x=.25+(i%4)*.06;
   }
  }else if(active==='crown'){
   o.position.y=key==='5'?32.5:4.2;o.position.z=key==='5'?-27:-11;
   o.rotation.y=Math.sin(t*.62)*.18; // follows the sung royal reveal
  }else if(active==='sword'){
   o.position.y=key==='5'?10:4.5;
   o.rotation.z=-.36+Math.sin(phase*Math.PI)*.72;
  }else if(active==='trumpet'){
   o.position.y=3+Math.sin(t*4)*.23;
   o.rotation.y=.24*Math.sin(t*.8);
  }else if(active==='mirror'){
   for(let i=0;i<mirrorPanels.length;i++){
    const p=mirrorPanels[i];
    p.shadow.rotation.y=Math.sin(t*.8+i)*.15;
    p.panel.material=glass;
   }
  }else if(active==='world'){
   for(let i=0;i<worldIslands.length;i++){
    const island=worldIslands[i];island.rotation.y=t*.17+(i-1)*.32;
    island.position.y=.5*Math.sin(t*.82+i*.9);
   }
  }else if(active==='home'){
   porchLight.intensity=.85+.45*Math.sin(t*1.1);
   o.position.y=-.04*Math.sin(t*.6);
  }else if(active==='curtain'){
   for(const {wing,side} of curtainWings){
    wing.position.x=side*(7.1+ease(phase)*3);
    wing.rotation.y=side*.05*Math.sin(t*2.1);
   }
  }else if(active==='wings'){
   for(const {feather,side,u}of feathers){
    feather.rotation.z=side*(-.35-u*.3+Math.sin(t*1.7-u*3)*.16);
   }
  }else if(active==='ensemble'){
   for(const {shoulder,side,index} of ensembleArms){
    shoulder.rotation.z=side*(.2+.48*Math.sin(t*2.8+index*.74)+sway*.6);
   }
  }else if(active==='rain'||active==='stars'){
   const isRain=active==='rain',batch=isRain?rainBatch:dustBatch;
   for(let i=0;i<batch.count;i++){
    const x=Math.sin(i*21.41)*15,z=-12+Math.cos(i*12.73)*6;
    const y=isRain?((11-(t*4+i*1.11)%12)+1.4):2+(i%8)+Math.sin(t*.78+i)*.3;
    dummy.position.set(x,y,z);
    dummy.scale.set(isRain?1:.6+(i%3)*.2,isRain?1:.7,1);
    dummy.rotation.set(isRain?.1:0,t*.1+i,0);
    dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
   }
   batch.instanceMatrix.needsUpdate=true;
  }else if(active==='heart'){
   o.rotation.y=Math.sin(t*.6)*.14;o.position.y=1+Math.sin(t*1.4)*.3;
  }else if(active==='flower'){
   o.rotation.y=Math.sin(t*.31)*.12;
  }else if(active==='stage'){
   o.position.y=-.3+ease(phase)*.4;
  }
  drawn=o.children.length;prevYear=key;
 }
 function dispose(){
  if(disposed)return;disposed=true;root.removeFromParent();
  for(const material of mats)material.dispose();
  for(const geometry of geo)geometry.dispose();
 }
 return {root,update,dispose,stats:()=>({active:activeName,meshChildren:drawn,groups:groups.size,geometries:geo.size,materials:mats.size})};
}
