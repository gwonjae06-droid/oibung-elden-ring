import * as THREE from 'three';
import {disposeScene} from './runtime/scene-resources.mjs';
// Sculptural porcelain theatre masks replace the old photograph-projectiles.
export function createRingmasterMask({projectile=false}={}){
 const group=new THREE.Group();group.name='porcelain-marionette-mask';
 const porcelain=new THREE.MeshStandardMaterial({color:0xc9baad,roughness:.71,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:0x160e15,roughness:.48});
 const wine=new THREE.MeshStandardMaterial({color:0x7c2934,roughness:.82});
 const cheek=new THREE.Mesh(new THREE.SphereGeometry(1,projectile?12:24,projectile?10:18),porcelain);
 cheek.scale.set(.76,1.03,.30);group.add(cheek);cheek.castShadow=true;
 for(const s of [-1,1]){
  const socket=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),dark);
  socket.position.set(s*.32,.23,.28);socket.scale.set(.20,.25,.07);group.add(socket);
  const brow=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,7,17,Math.PI),wine);
  brow.position.set(s*.32,.42,.31);brow.rotation.z=s*.24;group.add(brow);
 }
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.36,.065,8,22,Math.PI),wine);
 mouth.position.set(0,-.39,.285);mouth.rotation.z=Math.PI;group.add(mouth);
 const ready=Promise.resolve(true);
 function setMorph(p={}){const n=Math.max(.6,Math.min(1.65,(p.inflate||1)/2));group.scale.setScalar(n);mouth.scale.y=1+Math.min(1,p.jaw||0)*.5;}
 function setPose(){setMorph({inflate:2});}
 function dispose(){disposeScene(group);}
 return {group,setMorph,setPose,ready,dispose,prewarmTexture:()=>ready};
}
