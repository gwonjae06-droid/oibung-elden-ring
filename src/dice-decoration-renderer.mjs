import {diceDecorations} from './dice-decoration-data.mjs';
import {DICE_PHOTO_FACE} from './dice-photo-data.mjs';
export function buildDiceDecorations(THREE,root,edge,style){
 const dark=new THREE.MeshStandardMaterial({color:0x050507,roughness:.95,metalness:.1}),disc=new THREE.CircleGeometry(1,24);
 for(const plan of diceDecorations(edge)){const face=new THREE.Group(),normal=new THREE.Vector3(...plan.normal);face.name='dice-decoration-face-'+plan.face;face.position.copy(normal).multiplyScalar(edge/2);face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);root.add(face);
 if(plan.face!==DICE_PHOTO_FACE)for(const [x,y]of plan.points){const pip=new THREE.Mesh(disc,dark);pip.name='recessed-dice-pip';pip.position.set(x,y,.008);pip.scale.set(plan.radius*.7,plan.radius*.7,1);pip.receiveShadow=true;face.add(pip);}}
 return {update(){}};
}
export function diceFireAnchors(edge){const h=edge*.52,a=[];for(const x of [-h,h])for(const y of [-h,h])for(const z of [-h,h])a.push([x,y,z]);for(let axis=0;axis<3;axis++)for(const s of [-h,h])for(const t of [-h,h]){const p=[0,0,0],keys=[0,1,2].filter(k=>k!==axis);p[keys[0]]=s;p[keys[1]]=t;a.push(p);}return a;}
export function buildDiceFire(THREE,root,edge){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,40,1,32,34,30);gradient.addColorStop(0,'rgba(255,255,180,1)');gradient.addColorStop(.25,'rgba(255,190,30,.95)');gradient.addColorStop(.6,'rgba(255,55,5,.65)');gradient.addColorStop(1,'rgba(130,10,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.SpriteMaterial({map:texture,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}),flames=diceFireAnchors(edge).map((a,i)=>{const sprite=new THREE.Sprite(material);sprite.name='hellfire-flame';sprite.position.set(...a);root.add(sprite);return {sprite,a,seed:i*.73};}),light=new THREE.PointLight(0xff4a0c,3,edge*3,2);root.add(light);let disposed=false;
 return {update(time=0){const t=Number.isFinite(time)?time:0;for(const {sprite,a,seed}of flames){const u=(t*.8+seed)%1;sprite.position.set(a[0]+Math.sin(t*5+seed)*.12,a[1]+u*1.4,a[2]);sprite.scale.set(1.2+.35*Math.sin(t*7+seed),2.2+u*1.8,1);}light.intensity=2.8+.5*Math.sin(t*9);},dispose(){if(disposed)return;disposed=true;texture.dispose();}};
}
