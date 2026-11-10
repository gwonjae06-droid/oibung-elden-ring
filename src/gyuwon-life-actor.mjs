import * as T from 'three';
import {createReverieActor} from './gyuwon-reverie-actor.mjs';
import {gyuwonPhotoGeometry} from './gyuwon-photo-face.mjs';
import {batchLifeSet} from './gyuwon-life-set-batch.mjs';
const sat=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=sat(x);return x*x*(3-2*x);};
export function gyuwonLifeAge(shot,progress=0){
 const ages={realization:[26,26],youth:[26,28],study:[28,30],work:[30,33],parttime:[33,35],
  love:[35,38],wedding:[38,40],family:[40,55],child:[55,58],answer:[58,58],phone:[58,58]};
 const [a,b]=ages[shot]||[58,58];return a+(b-a)*smooth(progress);
}
// The photographed protagonist keeps his likeness. Every film instance owns
// its face deformation/materials; the battle actor is never aged or recoloured.
export function createGyuwonLifeActor(parent,source,{role='gyuwon',coarse=false}={}){
 const clone=createReverieActor(parent,source),root=clone.root;
 root.name='gyuwon-life-'+role;
 const head=root.getObjectByName('gyuwon-head'),torso=root.getObjectByName('gyuwon-tailored-torso');
 const ownedGeo=new Set(),ownedMat=new Set(),materialCopies=new Map();
 const ownGeo=g=>(ownedGeo.add(g),g),ownMat=m=>(ownedMat.add(m),m);
 root.traverse(o=>{
  if(!o.isMesh||!o.material)return;
  const sourceMat=o.material;
  if(!materialCopies.has(sourceMat))materialCopies.set(sourceMat,ownMat(sourceMat.clone()));
  o.material=materialCopies.get(sourceMat);
  if(o.name==='gyuwon-shoe-sole')o.geometry=ownGeo(new T.BoxGeometry(.42,.07,.47,3,1,3));
 });
 const face=root.getObjectByName('gyuwon-anatomical-face');
 const originalFace=face.geometry;
 face.geometry=ownGeo(gyuwonPhotoGeometry(.5,{coarse}));
 const positions=face.geometry.attributes.position,base=Float32Array.from(positions.array);
 const skin=ownMat(new T.MeshPhysicalMaterial({color:role==='gyuwon'?0xf0ddca:0xcba58f,
  map:role==='gyuwon'?face.material.map:null,roughness:.83,metalness:0,clearcoat:.025}));
 face.material=skin;
 const hair=ownMat(new T.MeshStandardMaterial({color:role==='partner'?0x332723:0x24252a,roughness:.91}));
 const creases=ownMat(new T.MeshStandardMaterial({color:0x765748,roughness:1,transparent:true,opacity:0,depthWrite:false}));
 const brow=ownMat(new T.MeshStandardMaterial({color:0x312c2c,roughness:.9}));
 const add=(p,g,m,name,x=0,y=0,z=0)=>{const o=new T.Mesh(ownGeo(g),m);o.name=name;o.position.set(x,y,z);p.add(o);o.castShadow=!coarse;return o;};
 const tube=(p,points,r,m,name)=>add(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),coarse?10:22,r,coarse?5:8,false),m,name);
 const surface=(x,y)=>Math.sqrt(Math.max(.002,.25-x*x-y*y))+.009;
 const scalp=add(head,new T.SphereGeometry(.515,coarse?24:48,coarse?16:28,0,Math.PI*2,0,Math.PI*.32),hair,'life-anatomical-hair-cap',0,0,0);
 const hairVertices=scalp.geometry.attributes.position;
 for(let i=0;i<hairVertices.count;i++){
  const x=hairVertices.getX(i),y=hairVertices.getY(i),z=hairVertices.getZ(i),azimuth=Math.atan2(z,x);
  const groove=1+.0007*Math.sin(azimuth*34+y*8);
  hairVertices.setXYZ(i,x*groove,y,z*groove);
 }scalp.geometry.computeVertexNormals();
 if(role!=='gyuwon')head.scale.set(.88,1.08,.94);
 const temples=[];
 for(const side of [-1,1]){
  const part=tube(head,[[side*.38,.22,.18],[side*.438,.10,.16],[side*.46,-.08,.12]],.022,hair,'life-greying-temple');temples.push(part);
  if(role!=='gyuwon'){
   const white=ownMat(new T.MeshPhysicalMaterial({color:0xd9d2c4,roughness:.35}));
   add(head,new T.SphereGeometry(.058,20,14),white,'life-eye',side*.17,.025,.468).scale.set(1,.48,.23);
   add(head,new T.SphereGeometry(.024,18,12),brow,'life-iris',side*.17,.025,.482).scale.set(.9,1,.23);
   tube(head,[[side*.11,.045,.48],[side*.17,.057,.482],[side*.23,.042,.46]],.007,skin,'life-upper-eyelid');
   tube(head,[[side*.09,.125,.47],[side*.18,.15,.45],[side*.26,.11,.41]],.014,brow,'life-sculpted-brow');
   add(head,new T.SphereGeometry(.07,18,14),skin,'life-sculpted-nose',0,-.04,.49).scale.set(.62,1.2,.8);
   add(head,new T.SphereGeometry(.09,20,16),skin,'life-sculpted-ear',side*.46,-.025,0).scale.set(.55,1.4,.65);
  }
  for(let i=0;i<3;i++){
   const xs=[side*.25,side*.31,side*.355],ys=[.025-i*.015,.025-i*.026,.022-i*.04];
   tube(head,xs.map((x,j)=>[x,ys[j],surface(x,ys[j])]),.0028,creases,'life-crows-feet');
  }
  tube(head,[[side*.11,-.12,surface(side*.11,-.12)],[side*.16,-.22,surface(side*.16,-.22)],[side*.19,-.29,surface(side*.19,-.29)]],.003,creases,'life-smile-fold');
 }
 if(role!=='gyuwon')tube(head,[[-.10,-.225,.445],[0,-.237,.459],[.10,-.225,.445]],.010,ownMat(new T.MeshStandardMaterial({color:0x946d64,roughness:.9})),'life-natural-lip-line');
 for(let row=0;row<3;row++){
  const y=.19+row*.055;
  tube(head,[-.23,-.12,0,.12,.23].map(x=>[x,y+Math.abs(x)*.035,surface(x,y+Math.abs(x)*.035)]),.0027,creases,'life-forehead-wrinkle');
 }
 const cloth=root.getObjectByName('gyuwon-tailored-torso').material;
 const darkHair=new T.Color(role==='partner'?0x332723:0x24252a),silver=new T.Color(0xb4b3af);
 if(role==='partner'){
  for(const side of [-1,1])for(let i=0;i<(coarse?3:6);i++)tube(head,
   [[side*(.27+i*.026),.28,-.12],[side*(.43+i*.016),-.05,-.12],[side*(.36+i*.025),-.52,-.08]],.045,hair,'life-partner-layered-hair');
  const skirt=add(root,new T.LatheGeometry([[.78,-1.12],[.67,-.64],[.58,-.22],[.56,0]].map(p=>new T.Vector2(...p)),coarse?24:48),cloth,'life-tailored-skirt',0,1.42,0);
  skirt.scale.z=.73;
 }
 const remove=[];root.traverse(o=>{if(/song-photo-mouth|expression-bones|gyuwon-tailored-lapel|gyuwon-tie|gyuwon-jacket-button|gyuwon-jacket-seam/.test(o.name))remove.push(o);});remove.forEach(o=>o.removeFromParent());
 // These details move rigidly with the head. Merge their geometry per material,
 // retaining the deforming face, scalp and one diagnostic wrinkle separately.
 const details=new T.Group();details.name='life-rigid-head-details';head.add(details);
 const firstWrinkle=head.getObjectByName('life-forehead-wrinkle');
 for(const o of [...head.children])if(o.isMesh&&o!==face&&o!==scalp&&o!==firstWrinkle&&/^life-/.test(o.name))details.add(o);
 const headBatches=batchLifeSet(details,{includeTransparent:true});
 const arms=['left','right'].map(side=>{const shoulder=root.getObjectByName('gyuwon-'+side+'-shoulder-rig');return {shoulder,elbow:shoulder.getObjectByName('gyuwon-elbow-pivot'),wrist:shoulder.getObjectByName('gyuwon-wrist-pivot')};});
 const thighs=[],shins=[],knees=[],shoes=[];
 root.traverse(o=>{if(o.name==='gyuwon-tailored-leg')thighs.push(o);if(o.name==='gyuwon-rigged-shin')shins.push(o);if(o.name==='gyuwon-rigged-knee')knees.push(o);if(o.name==='gyuwon-leather-shoe')shoes.push(o);});
 if(role==='partner')for(const o of [...thighs,...shins,...knees])o.visible=false;
 const up=new T.Vector3(0,1,0),down=new T.Vector3(0,-1,0),direction=new T.Vector3(),mid=new T.Vector3(),hip=new T.Vector3(),knee=new T.Vector3(),ankle=new T.Vector3();
 const link=(o,a,b)=>{direction.subVectors(b,a);const len=direction.length();o.position.copy(mid.copy(a).addScaledVector(direction,.5));o.quaternion.setFromUnitVectors(up,direction.normalize());o.scale.y=len;};
 let ageBucket=-1,disposed=false;
 const apron=root.getObjectByName('gyuwon-part-time-apron');
 function pose({time=0,age=26,kind='stand',distance=0,sit=0,look=.02,colour=0x70828b}={}){
  if(disposed)return;
  const ageing=smooth((age-31)/29),bucket=Math.floor(age*2);
  hair.color.copy(darkHair).lerp(silver,ageing*.75);creases.opacity=ageing*.56;
  temples.forEach(o=>o.material=hair);scalp.scale.y=1;
  if(bucket!==ageBucket){
   ageBucket=bucket;
   for(let i=0;i<positions.count;i++){
    const j=i*3,x=base[j],y=base[j+1],z=base[j+2],front=Math.max(0,z/.5);
    const cheek=Math.exp(-(((Math.abs(x)-.25)/.13)**2)-(((y+.11)/.18)**2));
    const bridge=Math.exp(-((x/.085)**2)-(((y-.01)/.21)**2));
    positions.setXYZ(i,x*(1-ageing*.025),y-ageing*cheek*.018,z+front*(bridge*.027-ageing*cheek*.022));
   }
   positions.needsUpdate=true;face.geometry.computeVertexNormals();
  }
  cloth.color.setHex(colour);cloth.roughness=.91;
  const walking=kind==='walk',shop=kind==='cashier',typing=kind==='type'||kind==='write';
  const breath=Math.sin(time*1.55)*.006;
  torso.position.y=1.95-.28*sit-ageing*.08+breath;
  torso.rotation.set(.025+ageing*.075+(typing?.10:0),0,0);
  head.rotation.set(look+ageing*.035,Math.sin(time*.52)*.018,0);
  for(let i=0;i<2;i++){
   const a=arms[i],phase=(distance/.94+i*.5)%1,cycle=Math.sin(phase*Math.PI*2);
   a.shoulder.rotation.set(walking?-cycle*.25:shop?-.95:typing?-1.13:-.14,0,(i?1:-1)*.055);
   a.elbow.rotation.set(typing?-.7:shop?-.34:-.16,0,0);a.wrist.rotation.set(typing?-.16:0,0,0);
   if(typing){a.wrist.rotation.x+=Math.sin(time*(kind==='write'?9:6)+i)*.035;}
   const side=i?1:-1,stance=phase<.6;
   const forward=stance?.94*(.3-phase):-.282+.564*smooth((phase-.6)/.4);
   const lift=walking&&!stance?.15*Math.sin((phase-.6)/.4*Math.PI):0;
   hip.set(side*.31,1.27-.28*sit-ageing*.05,0);
   knee.set(side*.31,.72-.07*sit,.08+.40*sit+(walking?forward*.45:0));
   ankle.set(side*.32,.17+lift,.10+.65*sit+(walking?forward:0));
   link(thighs[i],knee,hip);link(shins[i],ankle,knee);knees[i].position.copy(knee);
   shoes[i].position.set(ankle.x,ankle.y,ankle.z+.07);shoes[i].rotation.set(walking&&!stance?cycle*.12:0,0,0);
  }
  if(apron)apron.visible=shop;
  root.traverse(o=>{if(o.name==='gyuwon-articulated-finger'||o.name==='gyuwon-rigged-thumb')o.parent.rotation.x=typing?.44:shop?.35:.12;});
  torso.children.forEach(o=>{const p=o.geometry?.parameters;if(p?.width===.06&&p?.height===.6)o.visible=shop;});
  root.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry'&&o.parent===arms[1].wrist)o.visible=shop;});
 }
 // A target is solved through both arm links rather than moving a detached hand.
 const target=new T.Vector3(),origin=new T.Vector3(),dir=new T.Vector3(),bend=new T.Vector3(),joint=new T.Vector3(),lower=new T.Vector3();
 const qa=new T.Quaternion(),qb=new T.Quaternion(),inverse=new T.Quaternion(),axis=new T.Vector3();
 function orientHand(index,x=0,y=0,z=0){
  const wrist=arms[index].wrist;wrist.parent.updateWorldMatrix(true,false);
  wrist.parent.getWorldQuaternion(inverse).invert();qa.setFromEuler(new T.Euler(x,y,z));wrist.quaternion.copy(inverse).multiply(qa);
 }
 function reach(index,worldPoint,blend=1){
  root.updateWorldMatrix(true,true);torso.updateWorldMatrix(true,false);
  target.copy(worldPoint);torso.worldToLocal(target);const a=arms[index];origin.copy(a.shoulder.position);
  dir.subVectors(target,origin);const length=Math.min(1.285,Math.max(.01,dir.length()));dir.normalize();
  const along=(.67067**2+length**2-.62**2)/(2*length);
  bend.set(index?.6:-.6,-1,0).addScaledVector(dir,-bend.dot(dir)).normalize();
  joint.copy(origin).addScaledVector(dir,along).addScaledVector(bend,Math.sqrt(Math.max(0,.67067**2-along**2)));
  axis.copy(a.elbow.position).normalize();qa.setFromUnitVectors(axis,direction.subVectors(joint,origin).normalize());
  qb.setFromUnitVectors(down,lower.subVectors(target,joint).normalize());inverse.copy(qa).invert();qb.premultiply(inverse);
  a.shoulder.quaternion.slerp(qa,blend);a.elbow.quaternion.slerp(qb,blend);
 }
 function dispose(){if(disposed)return;disposed=true;face.geometry=originalFace;headBatches.dispose();clone.dispose();for(const g of ownedGeo)g.dispose();for(const m of ownedMat)m.dispose();}
 return {root,head,torso,arms,pose,reach,orientHand,dispose,face,stats:()=>({age:ageBucket/2,role,ownedFace:true})};
}
