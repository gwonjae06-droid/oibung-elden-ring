import * as THREE from 'three';
import {PLAYER_COLORS} from './player-presentation.mjs';
import {runThreeStartup} from './runtime/three-startup.mjs';

// Two bounded draws: a short blade ribbon and one batch of contact fragments.
// No ambient emitters, dynamic lights, per-frame geometries or combat writes.
export function createPlayerCombatVfx(scene,{mobile=false,reduced=false}={}){
 return runThreeStartup(THREE,THREE=>{
 const root=new THREE.Group();root.name='player-contact-vfx';scene.add(root);
 const max=reduced?20:mobile?40:80,states=Array.from({length:max},()=>({life:0,maxLife:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,spin:0}));
 const positions=[0,.55,0,-.14,0,0,0,0,.14,.14,0,0,0,0,-.14,0,-.55,0],index=[0,1,2,0,2,3,0,3,4,0,4,1,5,2,1,5,3,2,5,4,3,5,1,4];
 const sparkGeo=new THREE.BufferGeometry();sparkGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));sparkGeo.setIndex(index);sparkGeo.computeVertexNormals();
 const sparkMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending});
 const sparks=new THREE.InstancedMesh(sparkGeo,sparkMat,max);sparks.frustumCulled=false;sparks.count=0;sparks.visible=false;root.add(sparks);
 const samples=Array.from({length:14},()=>({a:new THREE.Vector3(),b:new THREE.Vector3()})),history=[];
 const ribbonGeo=new THREE.BufferGeometry(),ribbonPos=new Float32Array(13*18),ribbonColor=new Float32Array(13*24);
 ribbonGeo.setAttribute('position',new THREE.BufferAttribute(ribbonPos,3));ribbonGeo.setAttribute('color',new THREE.BufferAttribute(ribbonColor,4));ribbonGeo.setDrawRange(0,0);
 const ribbonMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const ribbon=new THREE.Mesh(ribbonGeo,ribbonMat);ribbon.frustumCulled=false;ribbon.renderOrder=8;ribbon.visible=false;root.add(ribbon);
 const dummy=new THREE.Object3D(),tint=new THREE.Color(),near=new THREE.Vector3(),far=new THREE.Vector3();
 let cursor=0,sampleCursor=0,life=0,disposed=false;
 function burst(x,y,z,color,number=12,power=3,ground=false){
  if(reduced)number=Math.ceil(number/3);
  for(let i=0;i<number;i++){
   const q=states[cursor],a=i*2.399963+(cursor%7),r=.3+(i%5)*.16;
   Object.assign(q,{x,y,z,vx:Math.cos(a)*power*r,vy:ground?.4+(i%3)*.3:1+(i%4)*.6,vz:Math.sin(a)*power*r,life:ground?.24:.18+(i%5)*.045,maxLife:ground?.24:.18+(i%5)*.045,size:ground?.07:.075+(i%3)*.025,spin:a});
   sparks.setColorAt(cursor,tint.setHex(color));cursor=(cursor+1)%max;
  }
  if(sparks.instanceColor)sparks.instanceColor.needsUpdate=true;
 }
 function event(e,g){if(disposed)return;
  const p=g.player,c=PLAYER_COLORS[g.weapon]||0xffffff,b=g.boss,dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz)||1;
  if(e.type==='boss-hit'||e.type==='dice-giant-hand-hit'){
   const melee=['sword','hammer'].includes(g.weapon)&&d<5.5,reach=Math.min(2.5,d*.65),x=melee?p.x+dx/d*reach:b.x-dx/d*1.2,z=melee?p.z+dz/d*reach:b.z-dz/d*1.2;
   const y=melee?1.1:g.dice?.giant?g.dice.pose.y:g.blood?2.1+g.blood.elevation:2.0;
   burst(x,y,z,c,g.weapon==='hammer'?22:12,g.weapon==='hammer'?5:3.5);if(g.weapon==='hammer')burst(x,.10,z,0xbba17b,10,4,true);
  }else if(e.type==='skill-cast')burst(p.x,1.55,p.z,({yellow:0xf6d36e,red:0xe56c79,blue:0x79bdf2})[e.flavor]||c,8,1.0);
  else if(e.type==='shot')burst(p.x+Math.sin(p.yaw)*.8,1.55,p.z+Math.cos(p.yaw)*.8,c,5,1.2);
  else if(e.type==='roll')burst(p.x,.13,p.z,0x9c947e,7,1.8,true);
  else if(e.type==='healed'||e.type==='skill-heal')burst(p.x,1.2,p.z,0x95e9ba,10,1.2);
 }
 function step(x,z){if(!disposed)burst(x,.04,z,0x938674,3,1,true);}
 function update(dt,g,parts,pose){if(disposed)return;const h=Math.max(0,Math.min(.05,dt));
  if(h>0){let active=false;
   for(let i=0;i<max;i++){
    const q=states[i];if(q.life>0){q.life-=h;q.vy-=h*7;q.x+=q.vx*h;q.y+=q.vy*h;q.z+=q.vz*h;}
    const size=q.life>0?q.size*Math.min(1,q.life/q.maxLife*2):0;active||=size>0;
    dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(q.spin+h*9,0,q.spin);dummy.scale.set(size,size*(1.6+Math.abs(q.vy)*.3),size);dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);
   }
   sparks.count=active?max:0;sparks.visible=active;if(active)sparks.instanceMatrix.needsUpdate=true;
   life=Math.max(0,life-h);
   if(pose.trail&&!reduced&&g.status==='playing'){
    near.set(0,0,g.weapon==='hammer'?1.48:1.56);far.set(0,0,g.weapon==='hammer'?1.72:1.92);parts.pivot.localToWorld(near);parts.pivot.localToWorld(far);
    const sample=samples[sampleCursor++%samples.length];sample.a.copy(near);sample.b.copy(far);history.push(sample);if(history.length>samples.length)history.shift();life=.11;
   }else if(!life)history.length=0;
  }
  tint.setHex(PLAYER_COLORS[g.weapon]||0xffffff);let k=0,c=0;
  for(let i=1;i<history.length;i++){
   const a=history[i-1],b=history[i],fade=i/history.length*Math.min(1,life/.11);
   for(const[v,edge]of [[a.a,0],[a.b,1],[b.a,0],[b.a,0],[a.b,1],[b.b,1]]){
    ribbonPos[k++]=v.x;ribbonPos[k++]=v.y;ribbonPos[k++]=v.z;
    ribbonColor[c++]=tint.r;ribbonColor[c++]=tint.g;ribbonColor[c++]=tint.b;ribbonColor[c++]=fade*(edge?.42:.035);
   }
  }
  ribbon.visible=k>0;ribbonGeo.setDrawRange(0,k/3);if(k){ribbonGeo.attributes.position.needsUpdate=true;ribbonGeo.attributes.color.needsUpdate=true;}
 }
 function clear(){history.length=0;life=0;sparks.count=0;sparks.visible=ribbon.visible=false;ribbonGeo.setDrawRange(0,0);for(const q of states)q.life=0;}
 function dispose(delegated=false){if(disposed)return;disposed=true;clear();if(!delegated){root.parent?.remove(root);for(const r of [sparkGeo,sparkMat,ribbonGeo,ribbonMat])r.dispose();}}
 return {event,step,update,clear,dispose,stats:()=>({capacity:max,particles:states.filter(q=>q.life>0).length,ribbonVertices:ribbonGeo.drawRange.count})};
 });
}
