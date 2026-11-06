import * as THREE from 'three';
import {bloodTransformation} from './blood-transformation.mjs';
import {createBloodInstancedRain} from './blood-storm-rain.mjs';

// The storm is decorative: it has no colliders, damage, RNG consumption or
// timers independent of combat time. It can be replayed after a retry/skip.
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const hash=n=>{const x=Math.sin(n*127.19+19.31)*43758.5453;return x-Math.floor(x);};
const pulse=(x,center,width)=>Math.exp(-Math.pow((x-center)/width,2));
export function bloodStormEnvelope(game,transformation=bloodTransformation(game)){
 const reveal=clamp(transformation.sky??(game?.boss?.phase===2?1:0));
 const storm=clamp(transformation.storm??reveal),t=Number.isFinite(game?.time)?game.time:0;
 const slot=Math.floor(t/9),strike=slot*9+4.3+hash(slot+82)*2.2;
 const age=t-strike;
 const flash=storm*(pulse(age,.02,.075)*.95+pulse(age,.19,.065)*.62+
   pulse(age,.34,.09)*.19);
 return {reveal,storm,flash:clamp(flash),rain:storm};
}

export function createBloodApocalypseSky(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='blood-apocalypse-horizon-and-storm';scene.add(root);
 root.userData.decorativeOnly=true;
 const uniforms={uTime:{value:0},uReveal:{value:0},uFlash:{value:0},uDetail:{value:coarse||reduced?0:1}};
 // Huge inside-out gradient sphere, with drifting, layered hematite clouds.
 // No textures, raymarching, extra framebuffers or per-frame geometries.
 const skyMat=new THREE.ShaderMaterial({
  uniforms,side:THREE.BackSide,depthWrite:false,depthTest:false,
  vertexShader:[
   'varying vec3 vDirection;',
   'void main(){vDirection=normalize(position);',
   'gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
   'gl_Position.z=gl_Position.w*0.99999;}'
  ].join('\n'),
  fragmentShader:[
   'precision highp float;',
   'uniform float uTime,uReveal,uFlash,uDetail;',
   'varying vec3 vDirection;',
   'void main(){',
   'vec3 d=normalize(vDirection);',
   'float horizon=smoothstep(-.12,.63,d.y);',
   'float n=sin(d.x*24.+d.z*16.+uTime*.028)*.33;',
   'n+=sin(d.x*46.-d.z*25.-uTime*.016)*.19;',
   'n+=uDetail*sin(d.x*76.+d.z*58.+uTime*.009)*.12;',
   'n+=sin(d.x*13.-d.z*33.+sin(d.x*18.)*.8)*.36;',
   'float clouds=smoothstep(.01,.66,n+.26+smoothstep(.04,.58,d.y)*.2);',
   'float folds=.5+.5*sin(d.x*91.+d.z*52.+uTime*.024+n*2.7);',
   'vec3 low=vec3(.36,.065,.095);',
   'vec3 high=vec3(.095,.008,.038);',
   'vec3 sky=mix(low,high,horizon);',
   'sky=mix(sky,vec3(.088,.009,.031)+folds*vec3(.12,.025,.04),clouds*.78);',
   'sky+=vec3(.37,.17,.18)*uFlash*(.48+.52*clouds);',
   'gl_FragColor=vec4(sky,1.0);}'
  ].join('\n')
 });
 const dome=new THREE.Mesh(new THREE.SphereGeometry(760,coarse?20:32,coarse?12:18),skyMat);
 dome.name='blood-crimson-sky-beyond-horizon';dome.renderOrder=-100;dome.frustumCulled=false;root.add(dome);
 // A few distant forks strike only during the irregular double-flash.
 const boltPositions=[];
 const branches=coarse?2:4;
 for(let j=0;j<branches;j++){
  const side=j%2?1:-1,x=side*(75+j*21),z=-105+j*29;
  let last=[x,103,z];
  for(let k=0;k<8;k++){
   const next=[x+Math.sin(k*2.1+j)*8,103-(k+1)*8,z+Math.cos(k*1.65+j)*3];
   boltPositions.push(...last,...next);last=next;
   if(k>2&&k<7){boltPositions.push(...next,next[0]+side*(5+k*.7),next[1]-5,next[2]+3);}
  }
 }
 const boltGeometry=new THREE.BufferGeometry();
 boltGeometry.setAttribute('position',new THREE.Float32BufferAttribute(boltPositions,3));
 const boltMaterial=new THREE.LineBasicMaterial({color:0xffd7db,transparent:true,opacity:0,depthWrite:false});
 const lightning=new THREE.LineSegments(boltGeometry,boltMaterial);
 lightning.name='blood-distant-branching-lightning';lightning.frustumCulled=false;root.add(lightning);
 // A single GPU-instanced cross-section ribbon batch falls continuously;
 // only the time and storm-alpha uniforms change each frame.
 const rainFx=createBloodInstancedRain(root,{coarse,reduced});
 const rain=rainFx.mesh;
 let disposed=false;
 function update(game,c=bloodTransformation(game)){
  if(disposed)return;
  const e=bloodStormEnvelope(game,c),t=Math.max(0,game?.time||0);
  root.visible=e.reveal>.01&&game?.status!=='won';
  if(!root.visible){rain.visible=lightning.visible=false;return e;}
  root.position.set(game.player?.x||0,0,game.player?.z||0);
  uniforms.uTime.value=reduced?0:t;
  uniforms.uReveal.value=e.reveal;uniforms.uFlash.value=e.flash;
  lightning.visible=e.flash>.06;
  boltMaterial.opacity=Math.min(.95,e.flash*.9);
  rainFx.update(t,(coarse?.38:.54)*e.rain*(1+e.flash*.28));
  return e;;
 }
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  rainFx.dispose();for(const item of [dome,lightning]){item.geometry.dispose();item.material.dispose();}
 }
 root.visible=false;
 return {root,update,dispose,stats:()=>({
  ...rainFx.stats(),lightningSegments:boltPositions.length/6,
  hasSky:true,decorativeOnly:true,damageSources:0
 })};
}
