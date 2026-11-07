import * as THREE from 'three';
import {eightBallPosition} from './dice-eight-ball.mjs';
// One prebuilt set of billiard-ball meshes. Physics never depends on rendering.
export function createDiceEightBallView(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='sungwon-physical-eight-balls';scene.add(root);
 const black=new THREE.MeshPhysicalMaterial({color:0x111015,metalness:.22,roughness:.23,clearcoat:.93,clearcoatRoughness:.08});
 const white=new THREE.MeshStandardMaterial({color:0xf1eade,roughness:.36,metalness:.03});
 const chip=new THREE.MeshStandardMaterial({color:0x423b38,roughness:.9});
 const geometry=new THREE.SphereGeometry(3.4,coarse?16:32,coarse?12:24);
 const mark=new THREE.SphereGeometry(.74,coarse?12:24,coarse?8:18);
 const numberGeo=new THREE.TorusGeometry(.15,.048,6,coarse?10:18);
 const crack=new THREE.DodecahedronGeometry(.72,coarse?0:1);
 const balls=[];
 for(let i=0;i<4;i++){
  const group=new THREE.Group();group.name='eight-ball-physical-object-'+i;root.add(group);
  const body=new THREE.Mesh(geometry,black);body.castShadow=!coarse;group.add(body);
  const number=new THREE.Mesh(mark,white);number.name='eight-ball-ivory-mark';
  number.position.set(0,1.5,2.65);number.scale.set(1.15,1,.29);body.add(number);
  for(const h of [-.19,.10]){const loop=new THREE.Mesh(numberGeo,black);loop.position.set(0,h,.64);loop.scale.set(.8,.9,.75);number.add(loop);}
  const debris=new THREE.Group();debris.name='eight-ball-ground-embed-impact';group.add(debris);
  for(let k=0;k<5;k++){const stone=new THREE.Mesh(crack,chip);stone.scale.setScalar(.33+(k%3)*.23);
    stone.position.set(Math.sin(k*2.4)*4,-3.4,Math.cos(k*2.4)*4);debris.add(stone);}
  balls.push({group,body,debris});group.visible=false;
 }
 function update(g){
  const s=g?.dice?.giant;
  const active=s?.state==='attack'?s.hazards.filter(h=>h.eightBall&&!h.cancelled):[];
  for(let i=0;i<balls.length;i++){
   const {group,body,debris}=balls[i],h=active[i];
   group.visible=Boolean(h);
   if(!h)continue;
   const time=s.t-h.start;
   if(time<0){group.visible=false;continue;}
   const p=eightBallPosition(h,Math.max(0,time-h.warn));
   group.position.set(p.x,h.skyfall?(time<h.warn?65:Math.max(0,p.y)):3.4,p.z);
   group.visible=time<=h.warn+h.active;
   body.rotation.set(h.skyfall?time*1.5:time*5,0,h.skyfall?time*1.1:time*4);
   debris.visible=Boolean(h.skyfall&&time-h.warn>=.32);
   if(h.skyfall&&time-h.warn>=.32)group.position.y=2.45;
  }
 }
 function dispose(){root.removeFromParent();for(const geo of [geometry,mark,crack,numberGeo])geo.dispose();for(const mat of [black,white,chip])mat.dispose();}
 return {root,update,dispose,stats:()=>({pooled:balls.length})};
}
