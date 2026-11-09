import * as T from 'three';
import {reverieEase as ease} from './gyuwon-reverie.mjs';
export function createReverieActor(parent,source){
 const root=source.clone(true);root.name='gyuwon-reverie-everyday-student';root.visible=true;root.scale.setScalar(1);root.rotation.set(0,0,0);parent.add(root);
 const retired=[];root.traverse(o=>{if(/^gyuwon-year-/.test(o.name)||/^gyuwon-(fourth-year-|cigarette-handheld-|rifle-left-support-)/.test(o.name)||/arsenal|accumulated-nightmare|divine-portrait|final-halo|floating-page/.test(o.name))retired.push(o);});
 const cover=root.getObjectByName('gyuwon-book-cover');if(cover)retired.push(cover.parent);for(const o of retired)o.removeFromParent();
 const materials=new Map(),owned=new Set();root.traverse(o=>{if(!o.material||!/torso|sleeve|forearm|tailored-leg|rigged-shin/.test(o.name))return;const src=o.material;if(!materials.has(src)){const m=src.clone();m.color?.setHex(/leg|shin/.test(o.name)?0x283445:0xa2adb6);materials.set(src,m);owned.add(m);}o.material=materials.get(src);});
 root.traverse(o=>{if(materials.has(o.material))o.material=materials.get(o.material);});
 const torso=root.getObjectByName('gyuwon-tailored-torso'),head=root.getObjectByName('gyuwon-head');
 const arms=['left','right'].map(side=>{const shoulder=root.getObjectByName(`gyuwon-${side}-shoulder-rig`);return {shoulder,elbow:shoulder.getObjectByName('gyuwon-elbow-pivot'),wrist:shoulder.getObjectByName('gyuwon-wrist-pivot')};});
 const thighs=[],shins=[],knees=[],shoes=[];root.traverse(o=>{if(o.name==='gyuwon-tailored-leg')thighs.push(o);if(o.name==='gyuwon-rigged-shin')shins.push(o);if(o.name==='gyuwon-rigged-knee')knees.push(o);if(o.name==='gyuwon-leather-shoe')shoes.push(o);});
 const cloth=new T.MeshStandardMaterial({color:0x284d43,roughness:.96,side:T.DoubleSide}),paper=new T.MeshStandardMaterial({color:0xe9e1c8,roughness:.88});owned.add(cloth);owned.add(paper);
 const apronGeo=new T.PlaneGeometry(.86,1.18,8,12),a=apronGeo.attributes.position;
 for(let i=0;i<a.count;i++)a.setZ(i,.045*Math.cos(a.getX(i)*9)+Math.pow(a.getY(i),2)*.04);apronGeo.computeVertexNormals();
 const apron=new T.Mesh(apronGeo,cloth);apron.name='gyuwon-part-time-apron';apron.position.set(0,-.12,.5);torso.add(apron);
 const strapGeo=new T.BoxGeometry(.06,.6,.04),straps=[];for(const side of [-1,1]){const s=new T.Mesh(strapGeo,cloth);s.position.set(side*.28,.59,.43);s.rotation.z=side*.25;torso.add(s);straps.push(s);}
 const cartonGeo=new T.BoxGeometry(.22,.35,.22),carton=new T.Mesh(cartonGeo,paper);carton.position.set(0,-.23,.07);arms[1].wrist.add(carton);
 const axis=new T.Vector3(0,1,0),direction=new T.Vector3(),mid=new T.Vector3();
 const link=(mesh,from,to)=>{direction.subVectors(to,from);mesh.position.copy(mid.copy(from).add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(axis,direction.clone().normalize());mesh.scale.y=direction.length();};
 const hip=new T.Vector3(),knee=new T.Vector3(),ankle=new T.Vector3();
 function update(frame,origin){
  const t=frame.time,shop=frame.place==='shop',school=frame.place==='school',room=frame.place==='room';
  const walking=school?1-ease((frame.local-1.8)/1.1):0,sit=room?1:school?ease((frame.local-2.5)/1):0;
  root.position.set(frame.place==='aftermath'?origin.x:school?-4*(1-ease(frame.local/3)):0,frame.place==='aftermath'?origin.y:0,frame.place==='aftermath'?origin.z:0);
  root.rotation.y=school?Math.PI*.5*walking:0;root.rotation.x=root.rotation.z=0;
  torso.position.y=1.95-.25*sit+Math.sin(t*1.5)*.012;
  torso.rotation.set(shop?.06:room?.10*(1-ease((t-39)/4)):.05,Math.sin(t*.7)*.012,0);
  head.rotation.set(room?.17-.28*ease((t-39)/5):shop?.10:.10,room?-.08*ease((t-40)/4):Math.sin(t*.45)*.035,Math.sin(t*.7)*.012);
  const question=room?ease((t-39)/3):0;
  for(let i=0;i<arms.length;i++){
   const arm=arms[i];arm.shoulder.rotation.set(shop?-.94+(i?Math.sin(t*2.6)*.12:0):sit?-.86+.32*question:-.18+Math.sin(t*9+i*Math.PI)*.34*walking,0,(i?1:-1)*(shop?.06:.04));
   arm.elbow.rotation.x=shop?-.3:sit?-.5+.28*question:-.12;arm.wrist.rotation.set(shop?-.18:sit?-.36:0,0,i?.08:-.08);
  }
  apron.visible=carton.visible=shop;straps.forEach(s=>s.visible=shop);
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,swing=Math.sin(t*9+i*Math.PI)*walking;
   hip.set(side*.31,1.27-.27*sit,0);knee.set(side*.31,.72-.05*sit,.08+.38*sit+swing*.13);
   ankle.set(side*.32,.17+Math.max(0,swing)*.2,.10+.62*sit+swing*.28);
   link(thighs[i],knee,hip);link(shins[i],ankle,knee);knees[i].position.copy(knee);shoes[i].position.set(ankle.x,ankle.y,ankle.z+.07);shoes[i].rotation.x=-swing*.07;
  }
 }
 return {root,head,update,dispose(){root.removeFromParent();for(const m of owned)m.dispose();apronGeo.dispose();strapGeo.dispose();cartonGeo.dispose();}};
}
