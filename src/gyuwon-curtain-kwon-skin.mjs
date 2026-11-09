import * as T from 'three';
import {BOSS_FACE} from './boss-face.mjs';
import {faceSize,bladeSize,drawFace,drawBlade} from './face.mjs';
import {SWORD} from './combat.mjs';

// Same portrait projection and jaw blade as the first boss. Install before
// createBossStance so its real neck rig can detach this photographed head.
export function createCurtainKwonSkin(boss){
 const width=1.9,r=1.15,px=width/BOSS_FACE.w,stretch=SWORD.length/((BOSS_FACE.h-BOSS_FACE.chin)*px);
 const face=new T.MeshStandardMaterial({alphaTest:.5,roughness:.7}),blade=new T.MeshStandardMaterial({alphaTest:.5,roughness:.55,side:T.DoubleSide});
 const mesh=new T.Mesh(new T.SphereGeometry(r,40,28,Math.PI/2-width/r/2,width/r,.2,BOSS_FACE.chin*px/r),face);
 mesh.name='curtain-original-kwon-photo';mesh.position.set(boss.HEAD.x,boss.HEAD.y,boss.HEAD.z);mesh.visible=false;boss.model.add(mesh);
 const textures=[];let disposed=false,finish=()=>{},img=new Image();
 const texture=(draw,size)=>{const canvas=document.createElement('canvas');canvas.width=size.w;canvas.height=size.h;draw(canvas.getContext('2d'));const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;textures.push(tex);return tex;};
 const ready=new Promise(resolve=>{finish=resolve;img.onload=()=>{if(disposed)return resolve(false);try{
  face.map=texture(c=>drawFace(c,img,BOSS_FACE),faceSize(BOSS_FACE));blade.map=texture(c=>drawBlade(c,img,BOSS_FACE,stretch),bladeSize(BOSS_FACE,stretch));face.needsUpdate=blade.needsUpdate=true;
  const geometry=new T.PlaneGeometry(width,SWORD.length).rotateX(Math.PI/2).translate(0,0,SWORD.length/2),a=new T.Mesh(geometry,blade),b=new T.Mesh(geometry,blade);b.rotation.z=Math.PI/2;boss.swordGroup.add(a,b);boss.fallbackBlade.visible=false;mesh.visible=true;resolve(true);
 }catch(error){console.warn('Curtain Kwon portrait unavailable',error);resolve(false);}};img.onerror=()=>resolve(false);img.src='data:image/jpeg;base64,'+BOSS_FACE.jpeg;});
 return {ready,dispose(){if(disposed)return;disposed=true;img.onload=img.onerror=null;img=null;finish(false);textures.forEach(t=>t.dispose());}};
}
