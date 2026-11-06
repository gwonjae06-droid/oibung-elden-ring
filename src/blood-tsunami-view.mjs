import * as THREE from 'three';
import {BLOOD_TSUNAMI,bloodTsunamiWave,bloodTsunamiApproach} from './blood-tsunami.mjs';

const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};

/**
 * Persistent, non-collidable presentation of the SAME four flanks that
 * damageBlood evaluates. The water wall travels from the skyline across the
 * arena. The boss's central gap has open air all the way to the ground; the
 * boss is standing at the mouth of the gap. A blood-red hint marks its lane.
 * Two instanced batches, two aperture rims and one batched spray: no per-wave
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
 const ringGeo=new THREE.TorusGeometry(1,.082,coarse?5:8,coarse?24:48);
 const ringMat=new THREE.MeshBasicMaterial({
  color:0xf09ba2,transparent:true,opacity:.62,depthWrite:false
 });
 const portals=[0,1].map(row=>{
  const m=new THREE.Mesh(ringGeo,ringMat);
  m.name='blood-tsunami-visible-refuge-aperture-'+row;
  m.position.y=8.7;
  m.scale.set(BLOOD_TSUNAMI.safeHalfWidth,8.7,1);
  root.add(m);return m;
 });
 const pathMat=new THREE.MeshBasicMaterial({
  color:0xe86f7a,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide
 });
 const corridor=new THREE.Mesh(
  new THREE.PlaneGeometry(BLOOD_TSUNAMI.safeHalfWidth*2,56).rotateX(-Math.PI/2),pathMat);
 corridor.name='blood-tsunami-boss-refuge-on-the-floor';corridor.renderOrder=2;
 corridor.position.y=.115;corridor.visible=false;scene.add(corridor);
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
 function reset(){root.visible=false;corridor.visible=false;spray.count=0;}
 function update(game){
  if(disposed)return null;
  const front=bloodTsunamiWave(game,0);
  if(!front?.visible){reset();return null;}
  root.visible=true;
  const s=game.blood,b=game.boss;
  corridor.visible=true;corridor.position.set(s.origin?.x??b.x,.115,s.origin?.z??b.z);
  corridor.rotation.y=front.yaw;pathMat.opacity=.11+.07*(.5+.5*Math.sin(front.time*2.6));
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
   const wave=bloodTsunamiWave(game,row);
   portals[row].visible=Boolean(wave?.visible);
   if(wave)portals[row].position.z=(wave.x-front.x)*front.forwardX+
     (wave.z-front.z)*front.forwardZ;
  }
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
  root.parent?.remove(root);corridor.parent?.remove(corridor);
  for(const geo of [ringGeo,corridor.geometry,mistGeo])geo.dispose();
  for(const mat of [ringMat,pathMat,mistMat])mat.dispose();
 }
 return {root,corridor,update,reset,dispose,stats:()=>({
  flanks:4,crestDrawCalls:1,undertowDrawCalls:1,refugeHalfWidth:BLOOD_TSUNAMI.safeHalfWidth,
  cappedSpray:mistCount,decorativeOnly:true,damageSources:0
 })};
}
