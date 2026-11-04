import * as THREE from 'three';
import {disposeScene} from './runtime/scene-resources.mjs';
import {giantHandPose} from './dice-giant.mjs';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const GOLD=[0xfce6ac,0xe7ad55,0x8c4b30];
const CONTROLLED=[0xffe6b2,0xe3b35e,0x60434a];
const FERAL=[0xffb6a2,0xf0444d,0x8c173b];
const MIN_LIFE=.16;

// All cues are post-impact particles or 3D energy around the boss; none reveal a collider's outline.
// Their coordinates come from the same simulation events as actual blows.
export function diceBossFxCue(event,game){
 if(!event||!game?.dice)return null;
 const g=game,p=g.dice.pose||{x:0,y:4,z:0},phase=g.dice.giant?.temperament==='feral'?3:g.dice.giant?2:1;
 const position=(x=p.x,z=p.z,y=.7)=>({x,z,y});
 switch(event.type){
  case 'dice-impact':return {kind:'landing',phase:1,...position(event.x,event.z),power:1};
  case 'dice-stomp':return {kind:'stomp',phase:1,...position(event.x,event.z),power:1.4};
  case 'dice-pip-burst':return {kind:'pips',phase:1,...position(p.x,p.z),power:.7};
  case 'dice-possession':return {kind:'possession',phase:2,...position(p.x,p.z,Math.max(3,p.y-2)),power:1.6};
  case 'dice-possessed':return {kind:'possessed',phase:2,...position(p.x,p.z,Math.max(3,p.y-5)),power:1.3};
  case 'dice-giant-hand-hit':
  case 'dice-giant-hand-destroyed':
  case 'dice-giant-hand-recovered':{
   if(!g.dice.giant||(event.index!==0&&event.index!==1))return null;
   const hand=giantHandPose(g,event.index);
   return {kind:event.type==='dice-giant-hand-hit'?'hand-hit':event.type==='dice-giant-hand-destroyed'?'hand-break':'hand-reform',
    phase,...position(hand.x,hand.z,Math.max(1,hand.y+1)),power:event.type==='dice-giant-hand-destroyed'?1.9:.65};
  }
  case 'dice-giant-head-impact':return {kind:'head-slam',phase:3,...position(event.x,event.z,1.1),power:event.rapid?.83:1.6};
  case 'dice-giant-feral':return {kind:'feral',phase:3,...position(p.x,p.z,Math.max(5,p.y-3)),power:2.2};
  case 'boss-hit':return {kind:'boss-hit',phase,...position(p.x,p.z,Math.max(2,p.y)),power:.45};
  case 'player-hit':return {kind:'player-hit',phase,...position(g.player?.x,g.player?.z,1.1),power:.55};
  case 'victory':return {kind:'death',phase,...position(p.x,p.z,Math.max(3,p.y)),power:2.5};
  default:return null;
 }
}

function glowTexture(){
 const size=32,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x-(size-1)/2)/(size*.5),v=(y-(size-1)/2)/(size*.5),d=Math.sqrt(u*u+v*v);
  const alpha=clamp(Math.pow(Math.max(0,1-d),1.8))*255,index=(y*size+x)*4;
  pixels[index]=255;pixels[index+1]=252;pixels[index+2]=240;pixels[index+3]=alpha;
 }
 const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;
 texture.needsUpdate=true;return texture;
}

export function createDiceBossFx(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='sungwon-boss-impact-fx';scene.add(root);
 const capacity=reduced?55:coarse?140:270,parts=Array.from({length:capacity},()=>({
  x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:0,r:1,g:1,b:1
 }));
 const positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3);
 const trails=new Float32Array(capacity*6),trailColors=new Float32Array(capacity*6);
 const pointsGeometry=new THREE.BufferGeometry();
 pointsGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 pointsGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
 pointsGeometry.setDrawRange(0,0);
 const trailGeometry=new THREE.BufferGeometry();
 trailGeometry.setAttribute('position',new THREE.BufferAttribute(trails,3).setUsage(THREE.DynamicDrawUsage));
 trailGeometry.setAttribute('color',new THREE.BufferAttribute(trailColors,3).setUsage(THREE.DynamicDrawUsage));
 trailGeometry.setDrawRange(0,0);
 const sprite=glowTexture();
 const points=new THREE.Points(pointsGeometry,new THREE.PointsMaterial({
  size:coarse?.64:.83,map:sprite,vertexColors:true,transparent:true,depthWrite:false,
  blending:THREE.AdditiveBlending,sizeAttenuation:true
 }));
 points.frustumCulled=false;points.name='sungwon-glowing-shards';points.renderOrder=12;root.add(points);
 const lines=new THREE.LineSegments(trailGeometry,new THREE.LineBasicMaterial({
  vertexColors:true,transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending
 }));
 lines.frustumCulled=false;lines.name='sungwon-impact-streaks';lines.renderOrder=11;root.add(lines);
 const waveGeometry=new THREE.RingGeometry(.84,1,48).rotateX(-Math.PI/2);
 const waves=Array.from({length:reduced?6:coarse?10:18},(_,i)=>{
  const mesh=new THREE.Mesh(waveGeometry,new THREE.MeshBasicMaterial({
   color:0xffd7ac,transparent:true,opacity:0,depthWrite:false,
   side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  }));
  mesh.name='sungwon-impact-wave-'+i;mesh.visible=false;mesh.renderOrder=8;root.add(mesh);
  return {mesh,life:0,max:1,radius:1,baseY:.12};
 });
 const light=new THREE.PointLight(0xffc279,0,27,2);light.name='sungwon-impact-flash';root.add(light);
 const palette=[null,GOLD,CONTROLLED,FERAL].map(a=>a?.map(hex=>new THREE.Color(hex))||null);
 let serial=0,next=0,clock=0,chargeClock=0,lightLife=0,lightDuration=.1,lastGame=null,disposed=false;
 const scratch=new THREE.Color();
 function emitParticle(x,y,z,color,speed=1,life=.5,rise=1){
  const p=parts[next];next=(next+1)%capacity;
  serial++;const angle=serial*2.399963229728653,spread=Math.sqrt((serial*17)%97/97);
  const burst=(.8+spread*5.8)*speed;
  p.x=x;p.y=Math.max(.15,y);p.z=z;p.vx=Math.cos(angle)*burst;
  p.vz=Math.sin(angle)*burst;p.vy=(1.5+spread*7.5)*speed*rise;
  p.life=Math.max(MIN_LIFE,life);p.age=0;
  scratch.setHex(color);p.r=scratch.r;p.g=scratch.g;p.b=scratch.b;
 }
 function burst(x,y,z,phase,count,force=1,style='impact'){
  const colors=palette[phase]||GOLD,limit=Math.min(count,reduced?18:coarse?54:100);
  for(let i=0;i<limit;i++){
   const col=colors[(i+Math.floor(serial/3))%colors.length];
   const tint=col instanceof THREE.Color?col.getHex():col;
   emitParticle(x,y,z,tint,(style==='aura'?.65:1)*force,.34+((i*7)%11)*.055,
    style==='aura'?.45:style==='shatter'?1.2:1);
  }
 }
 function wave(x,z,phase,radius=10,duration=.65,y=.12){
  const slot=waves.find(w=>w.life<=0)||waves.reduce((a,b)=>a.life<b.life?a:b);
  slot.life=slot.max=duration;slot.radius=radius;slot.baseY=y;
  slot.mesh.position.set(x,y,z);slot.mesh.material.color.copy(palette[phase][1]);
  slot.mesh.visible=true;slot.mesh.scale.setScalar(.1);
 }
 function flash(x,y,z,phase,power){
  light.color.copy(palette[phase][0]);light.position.set(x,y,z);
  lightLife=lightDuration=.11+Math.min(.17,power*.06);
  light.intensity=reduced?3:Math.min(50,20+power*9);
  light.distance=15+power*12;
 }
 function clear(){
  next=0;serial=0;chargeClock=0;lightLife=0;light.intensity=0;lastGame=null;
  for(const p of parts)p.life=0;
  for(const w of waves){w.life=0;w.mesh.visible=false;}
  pointsGeometry.setDrawRange(0,0);trailGeometry.setDrawRange(0,0);
 }
 function event(e,g){
  if(disposed)return null;
  if(lastGame!==g){clear();lastGame=g;}
  const cue=diceBossFxCue(e,g);if(!cue)return null;
  const {x,y,z,phase,power,kind}=cue;
  if(![x,y,z].every(Number.isFinite))return null;
  switch(kind){
   case 'landing':
    burst(x,.5,z,1,coarse?10:18,power);wave(x,z,1,6,.48);flash(x,1,z,1,.65);break;
   case 'stomp':
    burst(x,.6,z,1,coarse?16:32,power,'shatter');
    wave(x,z,1,8,.55);wave(x,z,1,14,.75);flash(x,2,z,1,1.3);break;
   case 'pips':
    burst(x,2,z,1,coarse?9:16,power,'aura');break;
   case 'possession':
    burst(x,y,z,2,coarse?28:60,power,'shatter');
    wave(x,z,2,18,1.1,Math.max(3,y-5));flash(x,y,z,2,2);break;
   case 'possessed':
    burst(x,y,z,2,coarse?30:55,power,'aura');
    flash(x,y,z,2,1.6);break;
   case 'hand-hit':
    burst(x,y,z,phase,9,power,'shatter');flash(x,y,z,phase,.3);break;
   case 'hand-break':
    burst(x,y,z,phase,coarse?36:76,power,'shatter');
    wave(x,z,phase,9,.8);wave(x,z,phase,14,1,.2);
    flash(x,y,z,phase,2);break;
   case 'hand-reform':
    burst(x,y,z,phase,coarse?18:30,power,'aura');flash(x,y,z,phase,.6);break;
   case 'head-slam':
    burst(x,y,z,3,coarse?42:90,power,'shatter');
    wave(x,z,3,14,.56);wave(x,z,3,23,.85);wave(x,z,3,34,1.04);
    flash(x,y,z,3,2.4);break;
   case 'feral':
    burst(x,y,z,3,coarse?46:100,power,'aura');
    wave(x,z,3,25,1.15,y);wave(x,z,3,37,1.5,y+1.4);
    flash(x,y,z,3,2.7);break;
   case 'boss-hit':
    burst(x,y,z,phase,8,power,'shatter');break;
   case 'player-hit':
    burst(x,y,z,phase,15,power,'shatter');break;
   case 'death':
    burst(x,y,z,phase,coarse?50:110,power,'shatter');
    wave(x,z,phase,30,1.4,Math.min(y,3));flash(x,y,z,phase,3);break;
  }
  return cue;
 }
 function charge(g,dt){
  if(reduced||!g||g.status!=='playing')return;
  const s=g.dice?.giant,d=g.dice;let at=null,phase=1;
  if(s?.state==='attack'){
   const h=s.hazards?.find(h=>!h.cancelled&&s.t>=h.start&&s.t<h.start+h.warn);
   if(h){
    phase=s.temperament==='feral'?3:2;
    if(h.headSlam){const p=d.pose;at=p?{x:p.x,y:Math.max(2,p.y),z:p.z}:null;}
    else if(h.handIndex===0||h.handIndex===1){
     const p=giantHandPose(g,h.handIndex);at={x:p.x,y:Math.max(2,p.y+3),z:p.z};
    }else at={x:h.x,y:2,z:h.z};
   }
  }else if(!s&&['charge-warning','jump-warning','frenzy-windup'].includes(d.state)){
   const p=d.pose;at=p&&{x:p.x,y:Math.max(2,p.y),z:p.z};
  }
  if(!at){chargeClock=0;return;}
  chargeClock+=Math.max(0,Math.min(.05,dt));
  if(chargeClock<.09)return;
  chargeClock=0;
  const v=serial*2.39996323,t=clock;
  const r=phase===3?7:phase===2?4.5:3.3;
  const color=palette[phase][serial%3].getHex();
  emitParticle(at.x+Math.sin(v+t)*r,at.y+Math.sin(t*4+v)*2,
   at.z+Math.cos(v+t)*r,color,phase===3?.7:.42,.28+(serial%5)*.1,.48);
 }
 function update(dt,g){
  if(disposed)return;
  if(lastGame!==g){clear();lastGame=g;}
  const h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  clock+=h;
  if(h>0)charge(g,h);
  let n=0;
  for(const p of parts){
   if(p.life<=0)continue;
   p.age+=h;const left=p.life-p.age;
   if(left<=0){p.life=0;continue;}
   p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;
   p.vy-=h*8.5;p.vx*=Math.exp(-h*.75);p.vz*=Math.exp(-h*.75);
   if(p.y<.1){p.y=.1;p.vy=Math.abs(p.vy)*.18;}
   const fade=clamp(left/p.life),k=n*3,b=n*6;
   positions[k]=p.x;positions[k+1]=p.y;positions[k+2]=p.z;
   colors[k]=p.r*fade;colors[k+1]=p.g*fade;colors[k+2]=p.b*fade;
   trails[b]=p.x;trails[b+1]=p.y;trails[b+2]=p.z;
   trails[b+3]=p.x-p.vx*.047;trails[b+4]=p.y-p.vy*.047;trails[b+5]=p.z-p.vz*.047;
   for(let c=0;c<3;c++){trailColors[b+c]=colors[k+c];trailColors[b+3+c]=colors[k+c]*.05;}
   n++;
  }
  pointsGeometry.setDrawRange(0,n);trailGeometry.setDrawRange(0,n*2);
  if(n){pointsGeometry.attributes.position.needsUpdate=true;pointsGeometry.attributes.color.needsUpdate=true;
   trailGeometry.attributes.position.needsUpdate=true;trailGeometry.attributes.color.needsUpdate=true;}
  for(const w of waves){
   if(w.life<=0)continue;
   w.life=Math.max(0,w.life-h);w.mesh.visible=w.life>0;
   const t=1-w.life/w.max;
   w.mesh.scale.setScalar(.08+w.radius*(.1+.9*(1-(1-t)*(1-t))));
   w.mesh.position.y=w.baseY+t*.18;
   w.mesh.material.opacity=clamp((1-t)*.58);
  }
  lightLife=Math.max(0,lightLife-h);light.intensity*=lightLife>0?Math.exp(-h*13):0;
 }
 function dispose(){
  if(disposed)return {errors:[]};disposed=true;clear();
  const report=disposeScene(root,{extras:[sprite]});root.parent?.remove(root);return report;
 }
 return {root,event,update,clear,dispose,stats:()=>({particles:pointsGeometry.drawRange.count,waves:waves.filter(w=>w.mesh.visible).length,capacity,flash:light.intensity})};
}
