import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {CLOWN_FACE,applyFaceAlpha} from './clown-face.mjs';
import {mountPose} from './clown-visual-data.mjs';
import {clownCameraPropPose,photoCardFrame} from './clown-stage-prop-data.mjs';
import {updateClownShowLabel} from './clown-shows.mjs';
export function createClownStageProps(parent){
 return runThreeStartup(THREE,(THREE,own)=>{
 const root=new THREE.Group();root.name='clown-stage-props';parent.add(root);
 const camera=new THREE.Group();camera.name='clown-antique-camera';root.add(camera);camera.visible=false;
 const leather=new THREE.MeshStandardMaterial({color:0x25121d,roughness:.84}),brass=new THREE.MeshStandardMaterial({color:0xbd9351,metalness:.72,roughness:.31}),black=new THREE.MeshStandardMaterial({color:0x080b10,roughness:.35}),glass=new THREE.MeshStandardMaterial({color:0x46758b,metalness:.55,roughness:.12,emissive:0x102e44});
 const add=(geo,mat,x,y,z,target=camera)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);target.add(m);return m;};
 add(new THREE.BoxGeometry(2.1,1.45,.8),leather,0,0,0);
 for(const s of[-1,1]){add(new THREE.BoxGeometry(.08,1.5,.86),brass,s*1.07,0,0);add(new THREE.BoxGeometry(2.15,.08,.86),brass,0,s*.75,0);}
 for(let i=0;i<8;i++){const k=1-.16*Math.sin(i*Math.PI/7);add(new THREE.BoxGeometry(1.35*k,1.1*k,.045),i%2?leather:black,0,0,.42+i*.055);}
 for(let i=0;i<3;i++){const m=add(new THREE.CylinderGeometry(.54-i*.055,.54-i*.055,.15,28),i===1?black:brass,0,0,.9+i*.14);m.rotation.x=Math.PI/2;}
 const lens=add(new THREE.CircleGeometry(.39,32),glass,0,0,1.2);lens.name='clown-camera-lens';
 for(const s of[-1,1])for(const y of[-.57,.57])add(new THREE.SphereGeometry(.055,10,8),brass,s*.9,y,.43);
 const crank=add(new THREE.TorusGeometry(.24,.045,8,20),brass,1.2,.1,0);crank.rotation.y=Math.PI/2;
 add(new THREE.BoxGeometry(.08,.5,.08),brass,1.2,.35,0);add(new THREE.SphereGeometry(.12,12,8),black,1.2,.62,0);
 const flashMat=new THREE.MeshBasicMaterial({color:0xfff4d4,transparent:true,opacity:0});add(new THREE.SphereGeometry(.17,16,10),flashMat,.7,.98,.22);add(new THREE.CylinderGeometry(.04,.06,.35,12),brass,.7,.82,.22);
 const paper=new THREE.MeshStandardMaterial({color:0xf6e9cf,roughness:.95,side:THREE.DoubleSide}),paperGeo=new THREE.PlaneGeometry(2.2,2.7),imageGeo=new THREE.PlaneGeometry(1.8,1.85),cards=[];
 for(let i=0;i<4;i++){const group=new THREE.Group();group.name='clown-portrait-card';group.rotation.x=-Math.PI/2;group.visible=false;root.add(group);add(paperGeo,paper,0,0,0,group);const mat=new THREE.MeshBasicMaterial({color:0x30323b,transparent:true,side:THREE.DoubleSide});add(imageGeo,mat,0,.22,.015,group);cards.push({group,mat,zone:null});}
 let disposed=false,ownerDisposed=false,texture=null,game=null,flash=0,portraitState='pending';const released=new WeakSet();
 function assets(){const all=new Set();root.traverse(o=>{if(o.geometry)all.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){all.add(m);if(m.map)all.add(m.map);}});return all;}
 const watch=a=>a.addEventListener?.('dispose',()=>released.add(a));for(const a of assets())watch(a);
 const image=new Image();const cancelImage=()=>{image.onload=image.onerror=null;if(portraitState==='pending')portraitState='cancelled';};
 leather.addEventListener('dispose',()=>{ownerDisposed=true;cancelImage();});own({dispose:cancelImage});
 image.onload=()=>{if(disposed||ownerDisposed)return;try{const canvas=document.createElement('canvas');canvas.width=CLOWN_FACE.w;canvas.height=CLOWN_FACE.h;const ctx=canvas.getContext('2d');if(!ctx){portraitState='failed';return;}ctx.drawImage(image,0,0);ctx.putImageData(applyFaceAlpha(ctx.getImageData(0,0,canvas.width,canvas.height)),0,0);texture=new THREE.CanvasTexture(canvas);watch(texture);texture.colorSpace=THREE.SRGBColorSpace;for(const c of cards){c.mat.map=texture;c.mat.color.setHex(0xffffff);c.mat.needsUpdate=true;}portraitState='ready';}catch{portraitState='failed';}};
 image.onerror=()=>{if(!disposed&&!ownerDisposed)portraitState='failed';};image.src='data:image/jpeg;base64,'+CLOWN_FACE.jpeg;
 function clear(){game=null;flash=0;flashMat.opacity=0;camera.visible=false;for(const c of cards){c.group.visible=false;c.zone=null;}}
 function event(e,g){if(disposed||ownerDisposed)return;if(game!==g){clear();game=g;}if(['phase','victory','death'].includes(e.type)){clear();return;}if(e.type!=='clown-shutter'||!Number.isFinite(e.x)||!Number.isFinite(e.z))return;flash=.12;const zone=[...(g.clown?.zones||[])].reverse().find(z=>z.major&&Math.abs(z.x-e.x)<.01&&Math.abs(z.z-e.z)<.01);if(!zone)return;const card=cards.find(c=>!c.group.visible)||cards[0];card.zone=zone;card.group.position.set(e.x,.18,e.z);card.group.rotation.z=(g.time%1-.5)*.25;card.group.visible=true;}
 function update(dt,g){if(disposed||ownerDisposed)return;if(game!==g){clear();game=g;}updateClownShowLabel(g);const h=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;flash=Math.max(0,flash-h);flashMat.opacity=flash/.12;
  const bodyY=g.boss.phase===2?mountPose(0,false).bodyY:5.2,p=clownCameraPropPose(g,bodyY);camera.visible=Boolean(p);if(p){camera.position.set(p.x,p.y,p.z);camera.rotation.y=p.yaw;camera.scale.setScalar(p.scale);}
  for(const card of cards){const attached=g.status==='playing'&&g.boss.state!=='transition'&&g.clown?.zones?.includes(card.zone),v=photoCardFrame(attached?card.zone:null);card.group.visible=v.visible;if(!v.visible)continue;card.group.scale.setScalar(v.scale);card.mat.color.setScalar(.22+.78*v.develop);}
 }
 function dispose(){if(disposed)return;clear();disposed=true;cancelImage();for(const a of assets())if(!released.has(a))a.dispose?.();root.parent?.remove(root);texture=null;}
 return {root,event,update,clear,dispose,get portraitState(){return portraitState;}};
 });
}
