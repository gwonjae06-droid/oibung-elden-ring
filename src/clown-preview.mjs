// The old photograph-head lab is retired. This preview actually uses the same
// living PBR ringmaster and independently moving troupe as the playable fight.
import * as THREE from 'three';
import {createClownActor} from './clown-ringmaster-actor.mjs';
import {createCircusTroupeView} from './clown-troupe-view.mjs';
import {createClownGame,startClownPattern,stepClown,PATTERNS} from './clown-combat.mjs';
import {setCircusAct} from './clown-troupe.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
const $=id=>document.getElementById(id);
const canvas=$('world'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x121018);scene.fog=new THREE.Fog(0x21121d,36,110);
const camera=new THREE.PerspectiveCamera(48,1,.1,140);
scene.add(new THREE.HemisphereLight(0xffddbb,0x211721,2));
const spot=new THREE.SpotLight(0xffd6a0,120,75,Math.PI/5,.85,1.5);
spot.position.set(12,21,12);spot.target.position.set(0,0,0);scene.add(spot,spot.target);
const back=new THREE.SpotLight(0x962b61,90,70,Math.PI/4,.8,1.6);
back.position.set(-12,17,-16);scene.add(back,back.target);
const floor=new THREE.Mesh(new THREE.CircleGeometry(25,96).rotateX(-Math.PI/2),
 new THREE.MeshStandardMaterial({color:0x211b22,roughness:.91,metalness:.06}));
scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(10,10.25,96).rotateX(-Math.PI/2),
 new THREE.MeshStandardMaterial({color:0xa67a4d,metalness:.69,roughness:.35}));
ring.position.y=.035;scene.add(ring);
const actor=createClownActor({coarse:false});actor.root.scale.setScalar(1.25);scene.add(actor.root);
const troupe=createCircusTroupeView(scene,{coarse:false,reduced:false});
const samples=[
 ['기본 단장',null,1],['분신 행진','ghostProcession',1],
 ['인형극','puppetOverture',1],['화염 고리','infernalHoops',1],
 ['악단 합창','choirOfAshes',2],['전원 피날레','midnightGrandFinale',3]
];
let game=null,selected=-1,last=performance.now(),yaw=.5,pitch=.17,dist=22,drag=false;
function select(i){
 selected=i;const [label,name,act]=samples[i];
 game=createClownGame('sword',{register:false,seed:1017+i});
 game.boss.phase=act>1?2:1;game.boss.state='clown';game.boss.x=0;game.boss.z=0;
 game.player.x=0;game.player.z=9;game.player.hp=game.player.maxHp=100000;game.player.invuln=100000;
 game.clown.horrorStage=act;game.clown.wait=999;
 setCircusAct(game,act);
 if(name){startClownPattern(game,name);}
 $('label').textContent=label+' · 드래그로 관찰 / 휠로 확대';
 for(const b of $('buttons').querySelectorAll('button'))b.setAttribute('aria-pressed',String(Number(b.dataset.index)===i));
}
for(const [i,item] of samples.entries()){
 const b=document.createElement('button');b.textContent=item[0];b.dataset.index=i;b.onclick=()=>select(i);
 $('buttons').appendChild(b);
}
function render(now){
 requestAnimationFrame(render);
 const dt=Math.max(0,Math.min((now-last)/1000,.04));last=now;
 if(game){
  stepClown(game,dt);game.events.length=0;
  if(game.clown.state==='idle'&&samples[selected][1]&&game.clown.wait<999){
   startClownPattern(game,samples[selected][1]);}
  actor.update(game,dt);troupe.update(game,dt);
 }
 camera.position.set(Math.sin(yaw)*dist*Math.cos(pitch),5.2+Math.sin(pitch)*dist,Math.cos(yaw)*dist*Math.cos(pitch));
 camera.lookAt(0,3.4,0);
 renderer.render(scene,camera);
}
canvas.onpointerdown=e=>{drag=true;canvas.setPointerCapture(e.pointerId);};
canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
canvas.onpointermove=e=>{if(drag){yaw-=e.movementX*.007;pitch=Math.max(-.18,Math.min(.65,pitch+e.movementY*.004));}};
canvas.addEventListener('wheel',e=>{dist=Math.max(11,Math.min(38,dist+Math.sign(e.deltaY)*1.5));},{passive:true});
function resize(){
 const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
select(0);resize();requestAnimationFrame(render);
