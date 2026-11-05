import * as THREE from 'three';

// An entirely visual/silent layer shared by the four implemented bosses.
// No movement, targeting, hitbox, damage, physics collision or audio is changed.
export const BOSS_ATMOSPHERE_PROFILES=Object.freeze({
 kwon:Object.freeze({
  name:'moonlit-sword-grave',radius:32,playRadius:23,plaques:12,
  base:0x526377,accent:0xb8c6d3,phase:0xb73e60,particle:0xbcc5d0,
  accentHeight:7.2,particleStyle:'ash',scale:1
 }),
 clown:Object.freeze({
  name:'deranged-big-top',radius:33.4,playRadius:23,plaques:14,
  base:0xa73e53,accent:0xffd38b,phase:0xc854ba,particle:0xf3bc82,
  accentHeight:12.5,particleStyle:'confetti',scale:1
 }),
 dice:Object.freeze({
  name:'falling-golden-casino',radius:112,playRadius:67.5,plaques:18,
  base:0x4b2836,accent:0xf3ce81,phase:0xd03754,particle:0xe4ba71,
  accentHeight:24,particleStyle:'chips',scale:3
 }),
 blood:Object.freeze({
  name:'profaned-white-cathedral',radius:34.2,playRadius:28,plaques:12,
  base:0xe3d8d0,accent:0xf4ddd1,phase:0xb53256,particle:0xbc3651,
  accentHeight:13.8,particleStyle:'petals',scale:1
 })
});
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const hash=(a,b=1)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
const vPolar=(r,a,y)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
const EVENT_TAGS=new Set([
 'phase','clown-phase2','clown-blast','clown-bounce','clown-clap','clown-dash',
 'dice-impact','dice-giant-head-impact','dice-giant-neck-impact',
 'dice-giant-hand-destroyed','dice-giant-feral','dice-possessed',
 'blood-impact','blood-hit','boss-hit','player-hit'
]);
function bannerGeometry(profile){
 if(profile==='clown')return new THREE.PlaneGeometry(2.4,5.4);
 if(profile==='blood')return new THREE.PlaneGeometry(2.2,5.3);
 if(profile==='dice')return new THREE.PlaneGeometry(2.6,4.3);
 return new THREE.PlaneGeometry(2,4.9);
}
function particleGeometry(profile,coarse){
 switch(profile){
  case 'clown':return new THREE.PlaneGeometry(.21,.39);
  case 'dice':return new THREE.CylinderGeometry(.17,.17,.055,coarse?7:10);
  case 'blood':return new THREE.SphereGeometry(.12,coarse?6:8,5);
  default:return new THREE.PlaneGeometry(.17,.25);
 }
}
export function createBossAtmosphere(scene,{
 profile='kwon',coarse=false,reduced=false
}={}){
 const cfg=BOSS_ATMOSPHERE_PROFILES[profile];
 if(!cfg)throw new RangeError('Unknown boss atmosphere: '+profile);
 const root=new THREE.Group();
 root.name='boss-atmosphere-'+cfg.name;
 root.userData.decorativeOnly=true;
 scene.add(root);

 const palette=new THREE.Color(cfg.base),accent=new THREE.Color(cfg.accent),
   corrupted=new THREE.Color(cfg.phase),working=new THREE.Color();
 const bannerMat=new THREE.MeshStandardMaterial({
  color:0xffffff,roughness:profile==='blood'?.44:.86,metalness:profile==='dice'?.28:0,
  side:THREE.DoubleSide,transparent:profile==='blood',opacity:profile==='blood'?.74:1,
  emissive:cfg.accent,emissiveIntensity:.035
 });
 const bannerGeo=bannerGeometry(profile);
 const standards=new THREE.InstancedMesh(bannerGeo,bannerMat,cfg.plaques);
 standards.name='boss-atmosphere-silent-standards';
 standards.frustumCulled=false;
 root.add(standards);
 const trimMat=new THREE.MeshStandardMaterial({color:profile==='blood'?0xd5c9b6:0xb89b6c,
  metalness:.57,roughness:.48,emissive:0x251716,emissiveIntensity:.12});
 const pillarGeo=new THREE.BoxGeometry(.13,1,.12);
 const supports=new THREE.InstancedMesh(pillarGeo,trimMat,cfg.plaques*2);
 supports.name='boss-atmosphere-gilded-banner-rails';supports.frustumCulled=false;root.add(supports);
 const emblemMat=new THREE.MeshStandardMaterial({
  color:cfg.accent,roughness:profile==='blood'?.18:.38,metalness:profile==='blood'?.07:.51,
  emissive:cfg.phase,emissiveIntensity:0
 });
 const emblemGeo=profile==='kwon'?new THREE.OctahedronGeometry(.7,0)
  :profile==='clown'?new THREE.SphereGeometry(.74,12,9)
  :profile==='dice'?new THREE.BoxGeometry(1.15,1.15,.15)
  :new THREE.OctahedronGeometry(.73,0);
 const emblems=new THREE.InstancedMesh(emblemGeo,emblemMat,cfg.plaques);
 emblems.name='boss-atmosphere-phase-emblems';emblems.frustumCulled=false;root.add(emblems);
 const dummy=new THREE.Object3D(),basePanels=[],railMatrices=[],baseEmblems=[];
 for(let i=0;i<cfg.plaques;i++){
  const a=TAU*i/cfg.plaques,r=cfg.radius+(i%3)*cfg.scale*.36,
    height=cfg.accentHeight+((i%3)-1)*.38*cfg.scale;
  const bannerPos=vPolar(r,a,height);
  basePanels.push({a,r,height});
  dummy.position.copy(bannerPos);dummy.rotation.set(0,a+Math.PI,0);
  dummy.scale.setScalar(cfg.scale);dummy.updateMatrix();
  standards.setMatrixAt(i,dummy.matrix);standards.setColorAt(i,working.copy(palette).lerp(accent,i%3===0?.26:.07));
  dummy.position.copy(vPolar(r,a,height+cfg.scale*3.2));
  dummy.scale.set(cfg.scale*20,1,cfg.scale);dummy.rotation.set(0,a+Math.PI,0);
  dummy.updateMatrix();supports.setMatrixAt(i*2,dummy.matrix);
  dummy.position.copy(vPolar(r,a,height-cfg.scale*3.15));dummy.updateMatrix();supports.setMatrixAt(i*2+1,dummy.matrix);
  const emblemPos=vPolar(r-.2*cfg.scale,a,height+.15*cfg.scale);
  baseEmblems.push(emblemPos);
  dummy.position.copy(emblemPos);dummy.scale.setScalar(cfg.scale*.65);dummy.rotation.set(0,a,0);
  dummy.updateMatrix();emblems.setMatrixAt(i,dummy.matrix);
 }
 standards.instanceMatrix.needsUpdate=true;supports.instanceMatrix.needsUpdate=true;
 emblems.instanceMatrix.needsUpdate=true;
 if(standards.instanceColor)standards.instanceColor.needsUpdate=true;

 const quantity=coarse?32:88,geo=particleGeometry(profile,coarse);
 const dustMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.64,
  metalness:profile==='dice'?.56:.03,side:THREE.DoubleSide,
  transparent:true,opacity:coarse?.32:.48,depthWrite:false,
  emissive:profile==='blood'?0x24050a:0x0b0808,emissiveIntensity:.12});
 const dust=new THREE.InstancedMesh(geo,dustMat,quantity);
 dust.name='boss-atmosphere-ambient-'+cfg.particleStyle;
 dust.frustumCulled=false;root.add(dust);
 const particles=Array.from({length:quantity},(_,i)=>{
  const a=hash(i,13)*TAU,inner=profile==='dice'?25:profile==='blood'?17:9,
    outer=profile==='dice'?90:profile==='blood'?39:profile==='clown'?29:34,
    r=inner+hash(i,31)*(outer-inner);
  return {x:Math.sin(a)*r,z:Math.cos(a)*r,
   y:(.35+hash(i,17)*(profile==='dice'?22:profile==='clown'?13:10)),
   seed:hash(i,5),spin:hash(i,29)*TAU};
 });
 for(let i=0;i<quantity;i++){
  dust.setColorAt(i,working.copy(new THREE.Color(cfg.particle))
   .lerp(profile==='blood'?new THREE.Color(0xeac3c4):accent,hash(i,9)*.36));
 }
 if(dust.instanceColor)dust.instanceColor.needsUpdate=true;
 const pulseGeometry=new THREE.RingGeometry(.83,1,32).rotateX(-Math.PI/2);
 const pulses=Array.from({length:coarse?2:4},(_,i)=>{
  const mat=new THREE.MeshBasicMaterial({
   color:cfg.phase,transparent:true,opacity:0,side:THREE.DoubleSide,
   depthWrite:false,depthTest:true
  });
  const mesh=new THREE.Mesh(pulseGeometry,mat);
  mesh.name='boss-atmosphere-contact-wave';mesh.visible=false;mesh.position.y=.14+i*.003;
  root.add(mesh);
  return {mesh,life:0,maxLife:1,originX:0,originZ:0,big:false};
 });
 let phase=1,time=0,phaseMix=0,phaseFlash=0,impactCount=0,pulseCursor=0,disposed=false,lastMatrixTime=-1,lastCameraTime=-1,frameActive=false;
 function reset(){
  phase=1;phaseMix=0;phaseFlash=0;time=0;impactCount=0;pulseCursor=0;lastMatrixTime=-1;lastCameraTime=-1;frameActive=false;
  for(const p of pulses){p.life=0;p.mesh.visible=false;p.mesh.material.opacity=0;}
  bannerMat.emissiveIntensity=.035;emblemMat.emissiveIntensity=0;
  for(let i=0;i<cfg.plaques;i++)standards.setColorAt(i,working.copy(palette).lerp(accent,i%3===0?.26:.07));
  if(standards.instanceColor)standards.instanceColor.needsUpdate=true;
 }
 function pulse(x,z,big=false){
  if(disposed||reduced)return;
  const p=pulses[pulseCursor++%pulses.length];
  p.life=p.maxLife=big?.82:.48;p.big=big;
  p.originX=clamp(x,-cfg.playRadius,cfg.playRadius);
  p.originZ=clamp(z,-cfg.playRadius,cfg.playRadius);
  p.mesh.position.set(p.originX,.14,p.originZ);
  p.mesh.scale.setScalar(big?2.8:.85);
  p.mesh.material.opacity=big?.18:.12;p.mesh.visible=true;
 }
 function event(e,g){
  if(disposed||!e||!EVENT_TAGS.has(e.type))return;
  const type=e.type,isPhase=type==='phase'||type==='clown-phase2'||type==='dice-possessed'||type==='dice-giant-feral',
    hit=type==='boss-hit'||type==='player-hit'||/impact|clown-blast|clown-bounce|clown-dash/.test(type);
  if(isPhase)phaseFlash=Math.max(phaseFlash,1);
  if(hit){
   phaseFlash=Math.max(phaseFlash,.36);impactCount++;
   const target=type==='player-hit'?g?.player:g?.boss;
   const x=Number.isFinite(e.x)?e.x:target?.x??0,z=Number.isFinite(e.z)?e.z:target?.z??0;
   pulse(x,z,(!coarse&&/giant|blast|dash|neck|head/.test(type)));
  }
 }
 function update(g,dt=0){
  if(disposed)return;
  const h=clamp(Number.isFinite(dt)?dt:0,0,.05);
  frameActive=h>0;
  time+=h;
  // A new attempt must restore clean scenery; visual phase never edits g.
  const wanted=Math.max(1,Math.min(profile==='dice'?3:2,g?.boss?.phase||1));
  if(wanted!==phase){phase=wanted;phaseFlash=1;}
  const target=phase>1?1:0;
  const blend=1-Math.exp(-h*(reduced?3.1:1.4));
  phaseMix+=(target-phaseMix)*blend;
  phaseFlash=Math.max(0,phaseFlash-h*1.45);
  const intensity=smooth(phaseMix),redness=profile==='dice'&&phase===3?1:intensity*.8;
  bannerMat.emissiveIntensity=.035+intensity*.11+phaseFlash*.09;
  emblemMat.emissiveIntensity=intensity*.45+phaseFlash*.18;
  dustMat.opacity=(coarse?.29:.44)+(profile==='blood'?intensity*.08:phaseFlash*.05);
  for(let i=0;i<cfg.plaques;i++){
   standards.setColorAt(i,working.copy(palette).lerp(accent,i%3===0?.26:.07).lerp(corrupted,redness*(.44+(i%3)*.13)));
  }
  if(standards.instanceColor)standards.instanceColor.needsUpdate=true;
  for(const p of pulses){
   if(p.life<=0)continue;
   p.life=Math.max(0,p.life-h);
   const elapsed=1-p.life/p.maxLife;
   p.mesh.scale.setScalar((p.big?2.8:.85)+(p.big?5.2:2.2)*elapsed);
   p.mesh.material.opacity=(p.big?.18:.12)*Math.pow(1-elapsed,2);
   p.mesh.visible=p.life>0;
  }
  if(h===0)return;
  // A single draw call for every particle; no new objects each frame.
  const updateParticles=reduced?time-lastMatrixTime>1/15:true;
  if(updateParticles){
   lastMatrixTime=time;
   for(let i=0;i<quantity;i++){
    const p=particles[i],speed=reduced?.05:1,drift=time*speed,
       rise=(time*.12+ p.seed)%1;
    dummy.position.set(p.x+Math.sin(drift*.32+p.spin)*(.45+cfg.scale*.12),
      .4+((p.y+rise*(profile==='dice'?5:2))%(profile==='dice'?25:14)),
      p.z+Math.cos(drift*.24+p.spin)*(.3+cfg.scale*.17));
    dummy.rotation.set(Math.sin(drift*.3+i)*.55,drift*.14+p.spin,drift*.45+i);
    const size=(.55+.35*p.seed)*cfg.scale;
    dummy.scale.setScalar(size);
    dummy.updateMatrix();dust.setMatrixAt(i,dummy.matrix);
   }
   dust.instanceMatrix.needsUpdate=true;
  }
  if(!reduced){
   for(let i=0;i<cfg.plaques;i++){
    const {a,r,height}=basePanels[i],bend=(phase>1?.11:.035)*Math.sin(time*(phase>1?1.6:.48)+i*.64);
    dummy.position.copy(vPolar(r,a,height));dummy.rotation.set(0,a+Math.PI,bend);
    dummy.scale.setScalar(cfg.scale);dummy.updateMatrix();standards.setMatrixAt(i,dummy.matrix);
    dummy.position.copy(baseEmblems[i]);dummy.position.y+=intensity*.35*cfg.scale*Math.sin(time*.9+i);
    dummy.rotation.set(0,a+time*(phase>1?.32:.05),Math.sin(time*.44+i)*.09);
    dummy.scale.setScalar(cfg.scale*.65);dummy.updateMatrix();emblems.setMatrixAt(i,dummy.matrix);
   }
   standards.instanceMatrix.needsUpdate=true;emblems.instanceMatrix.needsUpdate=true;
  }
 }
 // Small, bounded camera response AFTER each battle sets its own camera.
 // One offset per rendered frame; never changes FOV, targeting or combat logic.
 function cameraReaction(camera){
  if(disposed||reduced||!frameActive||!camera||phaseFlash<=.06||lastCameraTime===time)return 0;
  lastCameraTime=time;
  const displacement=Math.sin(time*21.7)*Math.min(.115,phaseFlash*.07);
  camera.position.y+=displacement;
  return displacement;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{
   if(o.geometry)geometries.add(o.geometry);
   const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
   for(const m of mm)materials.add(m);
  });
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
  root.parent?.remove(root);
 }
 reset();
 return {root,reset,event,update,cameraReaction,dispose,
  stats:()=>({profile,theme:cfg.name,playRadius:cfg.playRadius,decorRadius:cfg.radius,
   standards:cfg.plaques,particles:quantity,contactWaves:pulses.length,
   phase,phaseMix,impactCount,realLights:0,soundGenerators:0,collidableProps:0})};
}
