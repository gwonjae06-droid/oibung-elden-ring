import * as THREE from 'three';
import {BLOOD_TSUNAMI,bloodTsunamiWave,bloodTsunamiApproach} from './blood-tsunami.mjs';
import {createBloodTsunamiSafeFill} from './blood-tsunami-safe-blood.mjs';

const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};

/**
 * Persistent, non-collidable presentation of the SAME four flanks that
 * damageBlood evaluates. The water wall travels from the skyline across the
 * arena. The real gap remains safe, but translucent rose-pink blood flows
 * through the aperture itself (never projected onto the combat floor).
 * Two instanced batches, four shared membrane skins and one batched spray: no per-wave
 * geometry creation, no physics or unpredictable random particle emissions.
 */
export function createBloodHorizonDisaster(scene,waveRoot,{
 coarse=false,reduced=false,crestGeo,undertowGeo,crestMaterial,undertowMaterial
}={}){
 const root=new THREE.Group();root.name='blood-tsunami-horizon-disaster';
 root.userData.decorativeOnly=true;waveRoot.add(root);root.visible=false;
 const crest=new THREE.InstancedMesh(crestGeo,crestMaterial,4);
 crest.name='blood-tsunami-split-thirty-metre-crest';
 crest.frustumCulled=false;crest.castShadow=false;crest.receiveShadow=false;root.add(crest);
 const undertow=new THREE.InstancedMesh(undertowGeo,undertowMaterial,4);
 undertow.name='blood-tsunami-massive-rolling-undertow';
 undertow.frustumCulled=false;undertow.castShadow=false;root.add(undertow);
 const safeFill=createBloodTsunamiSafeFill(root,{coarse,reduced});
 const mistCount=coarse?10:reduced?8:36;
 const mistGeo=new THREE.IcosahedronGeometry(.32,0);
 const mistMat=new THREE.MeshBasicMaterial({color:0xd45a68,transparent:true,opacity:.55,depthWrite:false});
 const spray=new THREE.InstancedMesh(mistGeo,mistMat,mistCount);
 spray.name='blood-tsunami-recycled-crest-spray';spray.frustumCulled=false;
 spray.count=0;root.add(spray);
 const helper=new THREE.Object3D(),droplet=new THREE.Object3D();
 const liquidTime={value:0},liquidEnergy={value:1};
 const fluid=shader=>{
  shader.uniforms.uTsunamiTime=liquidTime;
  shader.uniforms.uTsunamiEnergy=liquidEnergy;
  shader.vertexShader='uniform float uTsunamiTime,uTsunamiEnergy;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float line=sin(position.x*6.1-uTsunamiTime*.74+
     .4*sin(position.y*7.3+uTsunamiTime*.33));
   transformed.y+=line*.046*uTsunamiEnergy;
   transformed.z+=.055*sin(position.y*9.2-position.x*4.1-uTsunamiTime*.92)*uTsunamiEnergy;
  `);
 };
 crestMaterial.onBeforeCompile=fluid;
 undertowMaterial.onBeforeCompile=fluid;
 let disposed=false;
 function reset(){root.visible=false;safeFill.reset();spray.count=0;}
 function update(game){
  if(disposed)return null;
  const front=bloodTsunamiWave(game,0);
  const follower=bloodTsunamiWave(game,1);
  if(!front?.visible&&!follower?.visible){reset();return null;}
  root.visible=true;
  const s=game.blood;
  const hazards=s.hazards.filter(h=>h.tsunami).slice(0,4);
  const intensity=bloodTsunamiApproach(game).intensity;
  for(let i=0;i<hazards.length;i++){
   const h=hazards[i],wave=bloodTsunamiWave(game,h.row);
   if(!wave)continue;
   const z=(wave.x-front.x)*front.forwardX+(wave.z-front.z)*front.forwardZ;
   const x=h.side*(BLOOD_TSUNAMI.safeHalfWidth+BLOOD_TSUNAMI.flankHalfWidth+BLOOD_TSUNAMI.margin);
   const closeness=smooth((BLOOD_TSUNAMI.horizonDistance-Math.max(0,wave.distance))/390);
   const height=23+7*closeness;
   helper.position.set(x,0,z);helper.rotation.set(0,0,0);
   helper.scale.set(BLOOD_TSUNAMI.flankHalfWidth+BLOOD_TSUNAMI.margin,height,4.2);
   helper.updateMatrix();crest.setMatrixAt(i,helper.matrix);
   helper.position.set(x,.03,z-1);
   helper.scale.set(BLOOD_TSUNAMI.flankHalfWidth+BLOOD_TSUNAMI.margin,height*.64,5.1);
   helper.updateMatrix();undertow.setMatrixAt(i,helper.matrix);
  }
  crest.count=undertow.count=hazards.length;
  crest.instanceMatrix.needsUpdate=true;undertow.instanceMatrix.needsUpdate=true;
  for(let row=0;row<2;row++){
   const wave=row===0?front:follower;
   const offset=wave?(wave.x-front.x)*front.forwardX+(wave.z-front.z)*front.forwardZ:0;
   const approaching=wave?smooth((BLOOD_TSUNAMI.horizonDistance-
    Math.max(0,wave.distance))/390):0;
   safeFill.setRow(row,offset,Boolean(wave?.visible),approaching);
  }
  safeFill.update(game.time||0,intensity);
  liquidTime.value=game.time||0;liquidEnergy.value=.6+intensity*.8;
  spray.count=intensity>.15?mistCount:0;
  if(spray.count){
   for(let i=0;i<mistCount;i++){
    const phase=i*2.399963+(game.time||0)*2.5;
    const side=i%2?1:-1;
    droplet.position.set(side*(BLOOD_TSUNAMI.safeHalfWidth+1+i*.77%34),
     22+7*Math.abs(Math.sin(phase)),1.5+2.2*Math.cos(phase));
    droplet.scale.setScalar(.4+.7*Math.abs(Math.sin(phase*.63)));
    droplet.rotation.set(0,phase,phase*.25);
    droplet.updateMatrix();spray.setMatrixAt(i,droplet.matrix);
   }
   spray.instanceMatrix.needsUpdate=true;
  }
  return front;
 }
 function dispose(){
  if(disposed)return;disposed=true;reset();
  safeFill.dispose();root.parent?.remove(root);
  mistGeo.dispose();mistMat.dispose();
 }
 return {root,safeFill,update,reset,dispose,stats:()=>({
  flanks:4,crestDrawCalls:1,undertowDrawCalls:1,refugeHalfWidth:BLOOD_TSUNAMI.safeHalfWidth,
  safeFill:safeFill.stats(),floorMarker:false,
  cappedSpray:mistCount,decorativeOnly:true,damageSources:0
 })};
}
