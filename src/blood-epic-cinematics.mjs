import * as THREE from 'three';
import {bloodVolumetricWaveGeometry} from './blood-volumetric-wave.mjs';
import {BLOOD_EPIC_CUTS,bloodEpicShotState} from './blood-epic-script.mjs';

// Deterministic, presentation-only giant attack sequence. World geometry is
// authored once; the attacking hitboxes remain blood-combat's real hazards.
// Neither skipped camera framing nor reduced motion alters gameplay clocks.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function createBloodEpicCinematics(scene,{coarse=false,reduced=false}={}){
 const waveRoot=new THREE.Group();
 waveRoot.name='blood-horizon-approaching-tsunami';
 waveRoot.userData.decorativeOnly=true;
 scene.add(waveRoot);
 const crestGeo=bloodVolumetricWaveGeometry(coarse?12:24);
 const undertowGeo=bloodVolumetricWaveGeometry(coarse?12:20,{undertow:true});
 const bloodMaterial=new THREE.MeshStandardMaterial({
  color:0x730c24,emissive:0x2d030c,emissiveIntensity:.46,
  roughness:.28,metalness:.12,side:THREE.DoubleSide,
  transparent:true,opacity:.96,depthWrite:true
 });
 const undertowMaterial=new THREE.MeshStandardMaterial({
  color:0x350610,emissive:0x210307,emissiveIntensity:.31,
  roughness:.3,metalness:.06,side:THREE.DoubleSide
 });
 const crest=new THREE.Mesh(crestGeo,bloodMaterial);
 crest.name='blood-distant-mountainous-tsunami-crest';
 waveRoot.add(crest);
 const undertow=new THREE.Mesh(undertowGeo,undertowMaterial);
 undertow.name='blood-distant-tsunami-heavy-undertow';
 waveRoot.add(undertow);
 const foamGeo=new THREE.BufferGeometry();
 // Sparse rippling crimson highlight at the curling lip. This is NOT a
 // targeting indicator; only the arena's light/dark telegraph marks danger.
 const foamArray=[];
 for(let j=0;j<(coarse?18:40);j++){
  const x=-1+j*2/(coarse?17:39);
  const y=.79+.07*Math.sin(j*.56);
  foamArray.push(x,y,-.1,x+.043,y+.036,.02);
 }
 foamGeo.setAttribute('position',new THREE.Float32BufferAttribute(foamArray,3));
 const foamMat=new THREE.LineBasicMaterial({color:0xb95167,transparent:true,
  opacity:.58,depthWrite:false});
 const foam=new THREE.LineSegments(foamGeo,foamMat);foam.name='blood-distant-tsunami-crest-foam';
 waveRoot.add(foam);
 waveRoot.visible=false;
 const shotCamera=new THREE.Vector3(),shotTarget=new THREE.Vector3();
 let disposed=false,skippedKey=null;
 const state=game=>bloodEpicShotState(game,{reduced,skipKey:skippedKey});
 const isFraming=game=>state(game).blocking;
 function skip(game){
  if(!isFraming(game))return false;
  skippedKey=state(game).key;
  return true;
 }
 function reset(){
  skippedKey=null;waveRoot.visible=false;
 }
 function update(game){
  if(disposed)return;
  const s=game?.blood,b=game?.boss,def=BLOOD_EPIC_CUTS[s?.pattern];
  const visible=game?.status==='playing'&&b?.state==='pattern'&&
   def?.type==='horizon'&&s?.hazards?.length;
  if(!visible){waveRoot.visible=false;return;}
  const firstHit=Math.min(...s.hazards.map(h=>h.warn));
  const t=Math.max(0,s.t||0);
  if(t>=firstHit-.08){waveRoot.visible=false;return;}
  // Place the first hint hundreds of metres out. It then comes closer as
  // the true hazard windup advances, remaining non-damaging until the real
  // attack reaches the arena after the shot has ended.
  const ox=s.origin?.x??b.x,oz=s.origin?.z??b.z;
  const dx=(s.target?.x??game.player.x)-ox;
  const dz=(s.target?.z??game.player.z)-oz;
  const len=Math.hypot(dx,dz)||1,forwardX=dx/len,forwardZ=dz/len;
  const progress=smooth(t/Math.max(.1,firstHit-.25));
  const distance=310-260*progress;
  waveRoot.position.set(ox-forwardX*distance,.09,oz-forwardZ*distance);
  waveRoot.rotation.set(0,Math.atan2(forwardX,forwardZ),0);
  const swell=.73+.27*progress,breath=reduced?1:1+.025*Math.sin(game.time*1.24);
  crest.scale.set(67*swell,25*swell*breath,19*swell);
  undertow.scale.set(75*swell,18*swell,25*swell);
  undertow.position.set(0,-.1,-2.4);
  foam.scale.copy(crest.scale);foam.position.y=.06;
  // The near-field real wave replaces this distant illustration at impact.
  bloodMaterial.opacity=.96*(1-smooth((t-(firstHit-.52))/.44));
  foamMat.opacity=.5*bloodMaterial.opacity;
  waveRoot.visible=bloodMaterial.opacity>.012;
 }
 function pose(camera,target,game){
  const s=state(game);
  if(!s.active||disposed)return s;
  const b=game.boss,bs=game.blood,p=game.player;
  const ox=bs.origin?.x??b.x,oz=bs.origin?.z??b.z;
  const dx=(bs.target?.x??p.x)-ox,dz=(bs.target?.z??p.z)-oz;
  const len=Math.hypot(dx,dz)||1,nx=dx/len,nz=dz/len;
  if(s.type==='horizon'){
   // Camera faces away from the arena, toward the tiny distant crest. The
   // returned arena shot begins before the first possible hit frame.
   shotCamera.set(p.x+nx*12+nz*6,9.5,p.z+nz*12-nx*6);
   shotTarget.set(waveRoot.position.x,10+8*smooth(s.t/s.firstHit),
    waveRoot.position.z);
  }else if(s.type==='sky'){
   shotCamera.set(p.x+nz*17,10,p.z-nx*17+10);
   shotTarget.set(b.x,27,b.z);
  }else{
   shotCamera.set(b.x+nz*38,17,b.z-nx*38);
   shotTarget.set(b.x,12,b.z);
  }
  camera.position.lerp(shotCamera,s.weight);
  target.lerp(shotTarget,s.weight);
  const fov=s.type==='horizon'?56:60;
  if(Math.abs(camera.fov-fov)>.03){
   camera.fov+=(fov-camera.fov)*s.weight*.6;camera.updateProjectionMatrix();
  }
  return s;
 }
 function dispose(){
  if(disposed)return;disposed=true;reset();
  waveRoot.parent?.remove(waveRoot);
  for(const geo of [crestGeo,undertowGeo,foamGeo])geo.dispose();
  for(const mat of [bloodMaterial,undertowMaterial,foamMat])mat.dispose();
 }
 return {state,isFraming,skip,reset,update,pose,dispose,waveRoot,
  stats:()=>({meshCount:3,decorativeOnly:true,damageSources:0,skippedKey})};
}
