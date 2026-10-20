import * as THREE from 'three';
import {createGame,act,step,rolling,swordPose,skillView,SWORD,WEAPONS,PATTERNS} from './combat.mjs';
import {createAudio} from './audio.mjs';
import {BOSS_FACE} from './boss-face.mjs';
import {faceSize,bladeSize,drawFace,drawBlade} from './face.mjs';
import {buildPlayer,buildBoss,poseLegs,posePlayer,swayCape} from './models.mjs';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
const WEAPON_KEYS=['sword','hammer','bow','cards'];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
const canvas=$('world');

const cache={};
const setText=(id,v)=>{if(cache['t'+id]!==v){cache['t'+id]=v;$(id).textContent=v;}};
const setBar=(id,ratio,now,max)=>{
  const r=clamp(ratio,0,1),k='b'+id;
  if(cache[k]!==r){cache[k]=r;const el=$(id);el.style.transform='scaleX('+r+')';el.parentElement.setAttribute('aria-valuenow',String(Math.round(now)));el.parentElement.setAttribute('aria-valuemax',String(max));}
};

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x121814);
scene.fog=new THREE.Fog(0x121814,30,75);
const camera=new THREE.PerspectiveCamera(58,1,.1,120);
scene.add(new THREE.HemisphereLight(0xbac6b4,0x1b221b,1.05));
const sun=new THREE.DirectionalLight(0xffe0ac,2.1);
sun.position.set(14,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:70});
sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;scene.add(sun);

const ground=new THREE.Mesh(new THREE.CircleGeometry(26,64),new THREE.MeshStandardMaterial({color:0x3a403a,roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const ring=new THREE.Mesh(new THREE.RingGeometry(22.7,23.3,64),new THREE.MeshStandardMaterial({color:0x8a7448,roughness:.6,metalness:.2,side:THREE.DoubleSide}));
ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
const stoneMat=new THREE.MeshStandardMaterial({color:0x5a5f56,roughness:.9});
for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2,h=3.5+((i*37)%5)*1.1;
  const m=new THREE.Mesh(new THREE.BoxGeometry(1.5,h,1.5),stoneMat);
  m.position.set(Math.sin(a)*26,h/2,Math.cos(a)*26);m.rotation.y=a+.3;m.castShadow=true;m.receiveShadow=true;scene.add(m);
}
import('./environment.mjs').then(({buildEnvironment})=>buildEnvironment(scene,ground)).catch(e=>console.error('environment failed',e));

const P=buildPlayer(WEAPON_KEYS);
const {rig,body,pivot,weaponRigs}=P;scene.add(rig);
const B=buildBoss();
const {root:bossRoot,model:bossModel,HEAD,boneMat,swordGroup,fallbackBlade}=B;scene.add(bossRoot);
let stance=null;
import('./boss-stance.mjs').then(({createBossStance})=>{stance=createBossStance(B);}).catch(e=>console.error('boss stance failed',e));
let effects=null;
import('./effects.mjs').then(({createEffects})=>{effects=createEffects(scene,swordGroup,reduceMotion);}).catch(e=>console.error('effects failed',e));
let skillFx=null;
import('./skill-fx.mjs').then(({createSkillFx})=>{skillFx=createSkillFx(scene,reduceMotion);}).catch(e=>console.error('skill effects failed',e));
let skillAudio=null;
import('./skill-audio.mjs').then(({createSkillAudio})=>{skillAudio=createSkillAudio();}).catch(e=>console.error('skill audio failed',e));

const FACE_WORLD_W=1.9,FACE_R=1.15,FACE_THETA0=.2;
const PX=FACE_WORLD_W/BOSS_FACE.w;
const BLADE_STRETCH=SWORD.length/((BOSS_FACE.h-BOSS_FACE.chin)*PX);
const faceMat=new THREE.MeshStandardMaterial({alphaTest:.5,roughness:.7,emissive:0x000000});
const bladeMat=new THREE.MeshStandardMaterial({alphaTest:.5,roughness:.55,side:THREE.DoubleSide,emissive:0x000000});
const facePhi=FACE_WORLD_W/FACE_R,faceTheta=BOSS_FACE.chin*PX/FACE_R;
const faceMesh=new THREE.Mesh(new THREE.SphereGeometry(FACE_R,40,28,Math.PI/2-facePhi/2,facePhi,FACE_THETA0,faceTheta),faceMat);
faceMesh.position.set(HEAD.x,HEAD.y,HEAD.z);faceMesh.visible=false;bossModel.add(faceMesh);
function canvasTexture(draw,size){
  const c=document.createElement('canvas');c.width=size.w;c.height=size.h;
  draw(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  return t;
}
function loadBossSkin(){
  const img=new Image();
  img.onload=()=>{
    try{
      faceMat.map=canvasTexture(ctx=>drawFace(ctx,img,BOSS_FACE),faceSize(BOSS_FACE));
      bladeMat.map=canvasTexture(ctx=>drawBlade(ctx,img,BOSS_FACE,BLADE_STRETCH),bladeSize(BOSS_FACE,BLADE_STRETCH));
      faceMat.needsUpdate=true;bladeMat.needsUpdate=true;
      const geo=new THREE.PlaneGeometry(FACE_WORLD_W,SWORD.length).rotateX(Math.PI/2).translate(0,0,SWORD.length/2);
      const a=new THREE.Mesh(geo,bladeMat),b=new THREE.Mesh(geo,bladeMat);b.rotation.z=Math.PI/2;
      swordGroup.add(a,b);fallbackBlade.visible=false;faceMesh.visible=true;
    }catch(e){console.error('boss skin failed',e);}
  };
  img.onerror=()=>console.error('boss face image failed to load');
  img.src='data:image/jpeg;base64,'+BOSS_FACE.jpeg;
}
loadBossSkin();

const projMeshes=new Map();
const arrowGeo=new THREE.CylinderGeometry(.04,.04,1.3,6).rotateX(Math.PI/2);
const cardGeo=new THREE.BoxGeometry(.5,.03,.7);
const arrowMat=new THREE.MeshStandardMaterial({color:0xe9dcb0,emissive:0x443820});
const pierceMat=new THREE.MeshStandardMaterial({color:0xe8ffd8,emissive:0x44ff66,emissiveIntensity:1.2});
const cardMat=new THREE.MeshStandardMaterial({color:0xf2ecdc,emissive:0x332a22});
const shotMeshes=new Map();
const shotGeo=new THREE.TorusGeometry(1.4,.16,6,20,Math.PI).rotateX(Math.PI/2);
const shotMat=new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.9});

const bursts=[];
const burstGeo=new THREE.SphereGeometry(.09,6,4);
function burst(x,y,z,color,n){
  if(effects)return;
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(burstGeo,new THREE.MeshBasicMaterial({color,transparent:true}));
    m.position.set(x,y,z);scene.add(m);
    const a=Math.random()*Math.PI*2,s=2+Math.random()*3;
    bursts.push({m,vx:Math.cos(a)*s,vy:2+Math.random()*3,vz:Math.sin(a)*s,life:.45});
  }
}
function updateBursts(dt){
  for(let i=bursts.length-1;i>=0;i--){
    const b=bursts[i];b.life-=dt;
    if(b.life<=0){scene.remove(b.m);b.m.material.dispose();bursts.splice(i,1);continue;}
    b.vy-=14*dt;b.m.position.x+=b.vx*dt;b.m.position.y+=b.vy*dt;b.m.position.z+=b.vz*dt;b.m.material.opacity=b.life/.45;
  }
}
function clearFx(){
  effects?.clear();skillFx?.clear();
  for(const b of bursts){scene.remove(b.m);b.m.material.dispose();}
  bursts.length=0;
  for(const m of projMeshes.values())scene.remove(m);
  projMeshes.clear();
  for(const m of shotMeshes.values())scene.remove(m);
  shotMeshes.clear();
  $('damage-layer').replaceChildren();
}

const tmpV=new THREE.Vector3();
function toScreen(x,y,z){
  tmpV.set(x,y,z).project(camera);
  if(tmpV.z>1||tmpV.z<-1)return null;
  return {x:(tmpV.x*.5+.5)*canvas.clientWidth,y:(-tmpV.y*.5+.5)*canvas.clientHeight};
}
function floatText(text,x,y,z,cls){
  const s=toScreen(x,y,z);if(!s)return;
  const el=document.createElement('span');
  el.className='damage-number '+(cls||'');el.textContent=text;
  el.style.left=s.x+'px';el.style.top=s.y+'px';
  $('damage-layer').appendChild(el);setTimeout(()=>el.remove(),850);
}
let noticeTimer=0;
function notice(text){
  const el=$('notice');el.textContent=text;el.classList.add('visible');
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('visible'),1700);
}

const audio=createAudio();
const TELEGRAPH_SOUND={sweep:'tele-slash',reverse:'tele-slash',cross:'tele-slash',thrust:'tele-thrust',slam:'tele-slam',leap:'tele-slam',whirl:'tele-whirl',rise:'tele-slash',jab:'tele-thrust',rush:'tele-thrust',retreat:'tele-whirl',wave:'tele-slam',stomp:'tele-slam',backsweep:'tele-slash',shove:'tele-thrust'};
const SWING_SOUND={sweep:'boss-slash',reverse:'boss-slash',cross:'boss-slash',thrust:'boss-thrust',slam:'boss-slam',leap:'boss-slam',whirl:'boss-whirl',rise:'boss-slash',jab:'boss-thrust',rush:'boss-thrust',retreat:'boss-whirl',wave:'boss-whirl',stomp:'boss-slam',backsweep:'boss-slash',shove:'boss-thrust'};
const CARD_NOTICE={blue:'파랑 카드 · 이동 속도 +50%',red:'빨강 카드 · 다음 공격 +50%',yellow:'노랑 카드 · 다음 적중 시 기절'};
const patternKey=name=>Object.keys(PATTERNS).find(k=>PATTERNS[k].name===name);
function playSkillSound(name){
  if(!skillAudio)return;
  if(skillAudio.enabled!==audio.enabled)skillAudio.setEnabled(audio.enabled);
  skillAudio.play(name);
}
function playEvent(ev,g){
  switch(ev.type){
    case 'swing':if(g.weapon==='sword'||g.weapon==='hammer')audio.play('swing-'+g.weapon);break;
    case 'shot':audio.play('swing-'+g.weapon);break;
    case 'roll':audio.play('roll');break;
    case 'dodge':audio.play('dodge');break;
    case 'healed':audio.play('healed');break;
    case 'boss-hit':audio.play('hit-boss',{amount:ev.amount});break;
    case 'player-hit':audio.play('hit-player');break;
    case 'telegraph':{const k=patternKey(ev.name);if(k)audio.play(TELEGRAPH_SOUND[k]);break;}
    case 'boss-swing':audio.play(SWING_SOUND[g.boss.pattern]||'boss-slash');break;
    case 'boss-shot':audio.play('boss-thrust');break;
    case 'phase':audio.play('phase');break;
    case 'stagger':audio.play('stagger');break;
    case 'victory':audio.play('victory');break;
    case 'death':audio.play('death');break;
    case 'skill-cast':playSkillSound('skill-'+ev.flavor);break;
    case 'skill-stun':playSkillSound('skill-stun');break;
    case 'skill-heal':playSkillSound('skill-heal');break;
    case 'skill-ready':playSkillSound('skill-ready');break;
    case 'skill-pierce':playSkillSound('skill-pierce');break;
  }
}

let selectedWeapon='sword';
let game=createGame(selectedWeapon);
let mode='menu';
let lock=true;
let queued=null;
let endAt=0;
let shake=0;
const view={yaw:Math.PI,pitch:.4,dist:9.5};
const vis={pyaw:Math.PI,time:0,legPhase:0,bx:0,bz:0,px:0,pz:13,pphase:0,cast:0};
const keys=new Set();
const stick={x:0,y:0};

function setWeaponVisual(){
  for(const k of WEAPON_KEYS)weaponRigs[k].visible=k===game.weapon;
  setText('weapon-label',WEAPONS[game.weapon].name);
}
function selectWeapon(key){
  if(!WEAPONS[key])return;
  selectedWeapon=key;
  document.querySelectorAll('.weapon').forEach(btn=>{
    const on=btn.dataset.weapon===key;
    btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));
  });
  if(mode==='menu'){game=createGame(key);setWeaponVisual();}
}

function setUi(){
  const inFight=mode==='playing'||mode==='paused'||mode==='ending'||mode==='result';
  $('menu').hidden=mode!=='menu';
  $('pause-screen').hidden=mode!=='paused';
  $('result').hidden=mode!=='result';
  $('player-hud').hidden=!inFight;
  $('boss-hud').hidden=!inFight;
  $('controls').hidden=!inFight;
  $('touch').hidden=!(coarse&&(mode==='playing'||mode==='ending'));
  $('pause').disabled=!(mode==='playing'||mode==='paused');
}

function startBattle(weapon){
  game=createGame(weapon);selectedWeapon=weapon;
  setWeaponVisual();clearFx();
  queued=null;lock=true;shake=0;vis.cast=0;
  view.yaw=Math.atan2(game.boss.x-game.player.x,game.boss.z-game.player.z);view.pitch=.4;
  vis.pyaw=game.player.yaw;vis.bx=game.boss.x;vis.bz=game.boss.z;vis.px=game.player.x;vis.pz=game.player.z;
  mode='playing';setUi();audio.ambience(true);
  canvas.focus({preventScroll:true});
  notice('이권재가 모습을 드러냅니다');
}
function backToMenu(){
  mode='menu';queued=null;clearFx();audio.ambience(false);
  game=createGame(selectedWeapon);setWeaponVisual();setUi();
  vis.px=game.player.x;vis.pz=game.player.z;
  $('start').focus();
}
function pauseGame(){if(mode==='playing'){mode='paused';keys.clear();stick.x=stick.y=0;audio.ambience(false);setUi();$('resume').focus();}}
function resumeGame(){if(mode==='paused'){mode='playing';audio.ambience(true);setUi();canvas.focus({preventScroll:true});}}

function showResult(){
  const won=game.status==='won';
  mode='result';audio.ambience(false);
  setText('result-kicker',won?'승리':'패배');
  setText('result-title',won?'이권재 격파':'쓰러졌습니다');
  setText('result-text',won?'긴턱이 땅에 내려앉았습니다. 오슬우의 첫 번째 시련이 끝났습니다.':'긴턱이 지나간 자리에 다시 기회가 남아 있습니다.');
  const s=game.stats;
  setText('result-stats','적중 '+s.hits+'회 · 회피 '+s.dodges+'회 · 누적 피해 '+fmt(s.damage)+' · '+game.time.toFixed(1)+'초');
  setUi();$('retry').focus();
}

function camBasis(){
  const sx=Math.sin(view.yaw),cz=Math.cos(view.yaw);
  return {fx:sx,fz:cz,rx:-cz,rz:sx};
}
function readInput(){
  let sx=0,sy=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))sy+=1;
  if(keys.has('KeyS')||keys.has('ArrowDown'))sy-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight'))sx+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))sx-=1;
  sx+=stick.x;sy+=stick.y;
  const m=Math.hypot(sx,sy);
  if(m>1){sx/=m;sy/=m;}
  const b=camBasis();
  return {x:b.fx*sy+b.rx*sx,z:b.fz*sy+b.rz*sx,lock};
}

function prepareAim(input){
  const p=game.player,b=game.boss;
  if(p.action)return;
  const d=Math.hypot(b.x-p.x,b.z-p.z),toB=Math.atan2(b.x-p.x,b.z-p.z);
  if(lock||d<7)p.yaw=toB;
  else if(!(input.x||input.z))p.yaw=view.yaw;
}
function tryQueued(input){
  if(!queued)return;
  if(performance.now()>queued.until){queued=null;return;}
  const p=game.player,type=queued.type;
  if(p.action)return;
  if(type==='light')prepareAim(input);
  const moving=Boolean(input.x||input.z);
  if(act(game,type)){
    if(type==='roll'&&!moving)game.player.action.yaw=game.player.yaw+Math.PI;
    queued=null;
  }
}
function castSkill(){
  const input=readInput();
  prepareAim(input);
  if(act(game,'skill')){vis.cast=.3;return;}
  const v=skillView(game);
  if(!v.ready)notice(game.weapon==='hammer'?'기본 공격을 4회 적중시켜야 합니다':game.weapon==='bow'?'화살 충전이 없습니다':'재사용 대기 중입니다');
}
function request(type){
  if(mode!=='playing')return;
  if(type==='lock'){lock=!lock;notice(lock?'록온 켜짐':'록온 꺼짐');return;}
  if(type==='skill'){castSkill();return;}
  queued={type,until:performance.now()+300};
}

const KEY_ACTIONS={KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal',KeyQ:'lock'};
addEventListener('keydown',e=>{
  if(e.repeat&&(e.code in KEY_ACTIONS))return;
  if(mode==='menu'){
    const idx=Number(e.key)-1;
    if(idx>=0&&idx<4&&WEAPON_KEYS[idx])selectWeapon(WEAPON_KEYS[idx]);
    return;
  }
  if(e.code==='Escape'){if(mode==='playing')pauseGame();else if(mode==='paused')resumeGame();return;}
  if(mode!=='playing')return;
  if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();
  if(e.code in KEY_ACTIONS)request(KEY_ACTIONS[e.code]);
  else keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});

let dragging=false;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('auxclick',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse')return;
  if(e.button===0)request('light');
  if(e.button===2)request('skill');
  if(e.button===1){e.preventDefault();dragging=true;canvas.setPointerCapture(e.pointerId);}
});
canvas.addEventListener('pointermove',e=>{
  if(!dragging)return;
  if(!lock)view.yaw-=e.movementX*.005;
  view.pitch=clamp(view.pitch+e.movementY*.004,.12,.85);
});
const endDrag=e=>{dragging=false;if(canvas.hasPointerCapture&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
canvas.addEventListener('pointerup',endDrag);
canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',e=>{view.dist=clamp(view.dist+Math.sign(e.deltaY)*.7,6,13);},{passive:true});

{
  const el=$('stick'),thumb=$('thumb'),R=40;
  let id=null,cx=0,cy=0;
  const move=e=>{
    let dx=e.clientX-cx,dy=e.clientY-cy;const m=Math.hypot(dx,dy);
    if(m>R){dx=dx/m*R;dy=dy/m*R;}
    stick.x=dx/R;stick.y=-dy/R;
    thumb.style.transform='translate('+dx+'px,'+dy+'px)';
  };
  el.addEventListener('pointerdown',e=>{
    id=e.pointerId;el.setPointerCapture(id);
    const r=el.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;move(e);
  });
  el.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e);});
  const up=e=>{if(e.pointerId!==id)return;id=null;stick.x=stick.y=0;thumb.style.transform='';};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}
document.querySelectorAll('[data-act]').forEach(btn=>{
  btn.addEventListener('pointerdown',e=>{e.preventDefault();request(btn.dataset.act);});
});

document.querySelectorAll('.weapon').forEach(btn=>btn.addEventListener('click',()=>selectWeapon(btn.dataset.weapon)));
$('start').addEventListener('click',()=>startBattle(selectedWeapon));
$('pause').addEventListener('click',()=>{if(mode==='playing')pauseGame();else resumeGame();});
$('resume').addEventListener('click',resumeGame);
$('quit').addEventListener('click',backToMenu);
$('retry').addEventListener('click',()=>startBattle(game.weapon));
$('change').addEventListener('click',backToMenu);
$('theme').addEventListener('click',()=>{
  const root=document.documentElement;
  root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
});
let muted=false;
try{muted=localStorage.getItem('oibung-muted')==='1';}catch(e){/* storage unavailable */}
function renderSound(){
  const on=audio.enabled;
  $('sound').setAttribute('aria-pressed',String(on||!muted));
  $('sound').textContent=on?'소리 켜짐':muted?'소리 꺼짐':'소리 자동';
}
function setMuted(v){muted=v;try{localStorage.setItem('oibung-muted',v?'1':'0');}catch(e){/* ignore */}}
function unlockAudio(e){
  if(muted||audio.enabled)return;
  if(e&&e.target&&e.target.closest&&e.target.closest('#sound'))return;
  if(audio.setEnabled(true)){renderSound();if(mode==='playing'||mode==='ending')audio.ambience(true);}
}
['pointerdown','keydown','touchstart'].forEach(t=>addEventListener(t,unlockAudio,{passive:true}));
$('sound').addEventListener('click',()=>{
  if(audio.enabled){audio.setEnabled(false);setMuted(true);}
  else{setMuted(false);if(audio.setEnabled(true)){audio.play('ui',{minGap:0});if(mode==='playing'||mode==='ending')audio.ambience(true);}}
  renderSound();
});
renderSound();
document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';

function handleEvents(){
  const g=game,p=g.player,b=g.boss;
  for(const ev of g.events){
    playEvent(ev,g);
    effects?.event(ev,g);
    skillFx?.event(ev,g);
    if(ev.type==='boss-hit'){
      floatText(String(ev.amount),b.x,4.2,b.z,'');
      burst(b.x+(p.x-b.x)*.4,2.2,b.z+(p.z-b.z)*.4,0xf0d9a0,8);
    }else if(ev.type==='player-hit'){
      floatText('-'+ev.amount,p.x,2.6,p.z,'player');
      burst(p.x,1.3,p.z,0xc04a40,10);
      if(!reduceMotion)shake=.35;
      const f=$('hit-flash');f.classList.add('visible');setTimeout(()=>f.classList.remove('visible'),140);
    }else if(ev.type==='dodge'){
      floatText('회피',p.x,2.6,p.z,'');
    }else if(ev.type==='phase'){
      notice('이권재가 두 발로 일어섭니다');
    }else if(ev.type==='stagger'){
      notice('경직! 지금이 기회입니다');
    }else if(ev.type==='skill-cast'){
      if(CARD_NOTICE[ev.flavor])notice(CARD_NOTICE[ev.flavor]);
      else if(ev.flavor==='sword')notice('질풍검 · 공격 속도 대폭 증가');
      else if(ev.flavor==='hammer')notice('흡혈 강타');
      else if(ev.flavor==='bow')notice('관통 화살');
    }else if(ev.type==='skill-stun'){
      floatText('기절',b.x,5,b.z,'');notice('이권재 기절 · 1초');
    }else if(ev.type==='skill-heal'){
      floatText('+'+Math.round(ev.amount),p.x,2.9,p.z,'');
    }else if(ev.type==='skill-ready'){
      notice(ev.flavor==='hammer'?'흡혈 강타 준비 완료':'화살 1발 충전');
    }
  }
  g.events.length=0;
}

function weaponAngle(a){
  const rest=a.total-a.wind-a.active;
  if(a.t<a.wind)return -1.5*(a.t/a.wind);
  const k=clamp((a.t-a.wind)/a.active,0,1);
  if(k<1)return -1.5+2.9*k;
  return 1.4*(1-clamp((a.t-a.wind-a.active)/Math.max(rest,.01),0,1));
}
function syncPlayer(dt){
  const p=game.player,a=p.action;
  const sp=Math.min(12,Math.hypot(p.x-vis.px,p.z-vis.pz)/Math.max(dt,.001));
  vis.px=p.x;vis.pz=p.z;vis.pphase+=dt*(4+sp*1.2);
  vis.cast=Math.max(0,vis.cast-dt);
  rig.position.set(p.x,0,p.z);
  const ty=a&&a.yaw!==undefined?a.yaw:p.yaw;
  vis.pyaw+=angleDelta(vis.pyaw,ty)*Math.min(1,dt*20);
  rig.rotation.y=vis.pyaw;
  pivot.rotation.set(0,0,0);body.rotation.set(0,0,0);
  const w=posePlayer(P,vis.pphase,a?0:sp);
  swayCape(P,vis.time,sp);
  body.position.y=1+w.bob;body.rotation.x=w.lean;
  let emissive=0,opacity=1;
  if(game.status==='lost'){
    body.rotation.x=-1.4;body.position.y=.45;
  }else if(a&&(a.kind==='attack'||a.kind==='skill')){
    const k=game.weapon==='hammer'?1.25:game.weapon==='sword'?1:.25;
    P.arms.R.rotation.x=0;
    pivot.rotation.x=weaponAngle(a)*k;
    if(a.kind==='attack'&&game.weapon==='sword')pivot.rotation.z=-.3;
    body.rotation.x=.12*Math.sin(clamp(a.t/a.total,0,1)*Math.PI);
  }else if(a&&a.kind==='roll'){
    body.rotation.x=(a.t/a.total)*Math.PI*2;body.position.y=.8;
    if(rolling(p))opacity=.55;
  }else if(a&&a.kind==='hurt'){
    body.rotation.x=-.3;emissive=0x661a1a;
  }else if(a&&a.kind==='heal'){
    emissive=0x1a5a2a;P.arms.R.rotation.x=0;pivot.rotation.x=-.8;
  }else if(vis.cast>0){
    P.arms.R.rotation.x=0;pivot.rotation.x=-1.1*(vis.cast/.3);
  }
  if(!emissive&&game.status==='playing'){
    const s=p.skill;
    if(s.haste>0)emissive=0x1a4a66;else if(s.blue>0)emissive=0x14316a;else if(s.nextRed)emissive=0x5a1410;else if(s.nextYellow)emissive=0x5a4a10;
  }
  for(const m of P.mats){m.emissive.setHex(emissive);m.opacity=opacity;}
}

function syncBoss(dt){
  const b=game.boss;
  bossRoot.position.set(b.x,0,b.z);bossRoot.rotation.y=b.yaw;
  const speed=Math.hypot(b.x-vis.bx,b.z-vis.bz)/Math.max(dt,.001);
  vis.bx=b.x;vis.bz=b.z;
  vis.legPhase+=dt*(2+Math.min(speed,14)*1.1);
  poseLegs(B.legs,vis.legPhase,speed);
  const pose=swordPose(b);
  swordGroup.position.set(pose.x,pose.y,pose.z);swordGroup.rotation.x=pose.pitch;swordGroup.rotation.y=pose.yaw;
  let glow=0;
  if(b.state==='windup')glow=.15+.45*clamp(b.t*(b.speed||1)/PATTERNS[b.pattern].wind,0,1);
  else if(b.state==='active')glow=1;
  boneMat.emissive.setHex(0xaa2222);boneMat.emissiveIntensity=glow;
  bladeMat.emissive.setHex(0xaa2222);bladeMat.emissiveIntensity=glow*.8;
  faceMat.emissive.setHex(0x992222);faceMat.emissiveIntensity=(b.phase===2?.18:0)+glow*.12;
  B.glowMat.emissiveIntensity=b.phase===2?1.7:.9;
  bossModel.rotation.set(0,0,0);bossModel.position.y=Math.sin(vis.time*1.6)*.05;
  if(b.state==='stagger'){bossModel.rotation.x=-.12;bossModel.rotation.z=Math.sin(vis.time*30)*.03;}
  else if(b.stun>0){bossModel.rotation.z=Math.sin(vis.time*40)*.05;boneMat.emissive.setHex(0xffcc22);boneMat.emissiveIntensity=.6;}
  else if(b.state==='transition'){const s=1+Math.sin(vis.time*14)*.03;bossModel.scale.setScalar(s);}
  if(b.state!=='transition')bossModel.scale.setScalar(1);
  if(b.state==='dead'){bossModel.rotation.z=.9;bossModel.position.y=-.6;boneMat.emissiveIntensity=0;bladeMat.emissiveIntensity=0;faceMat.emissiveIntensity=0;B.glowMat.emissiveIntensity=0;}
}

function syncProjectiles(dt){
  const seen=new Set();
  for(const q of game.projectiles){
    seen.add(q.id);
    let m=projMeshes.get(q.id);
    if(!m){
      m=new THREE.Mesh(q.kind==='bow'?arrowGeo:cardGeo,q.kind==='bow'?(q.skill?pierceMat:arrowMat):cardMat);
      if(q.skill)m.scale.set(3.4,3.4,2);
      scene.add(m);projMeshes.set(q.id,m);
    }
    m.position.set(q.x,q.y,q.z);
    m.rotation.y=q.yaw;
    if(q.kind==='cards')m.rotation.z+=dt*18;
  }
  for(const [id,m] of projMeshes){
    if(!seen.has(id)){scene.remove(m);projMeshes.delete(id);}
  }
  const seenShots=new Set();
  for(const s of game.bossShots){
    seenShots.add(s.id);
    let m=shotMeshes.get(s.id);
    if(!m){m=new THREE.Mesh(shotGeo,shotMat);scene.add(m);shotMeshes.set(s.id,m);}
    m.position.set(s.x,1.5,s.z);m.rotation.y=s.yaw;
  }
  for(const [id,m] of shotMeshes){
    if(!seenShots.has(id)){scene.remove(m);shotMeshes.delete(id);}
  }
}

function updateCamera(dt){
  const p=game.player,b=game.boss;
  const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz);
  if(mode==='menu'){
    const t=vis.time*.12;
    camera.position.set(Math.sin(t)*20,8.5,Math.cos(t)*20-2);
    camera.lookAt(0,2.2,-2);return;
  }
  if(lock&&d>.5&&game.status==='playing')view.yaw+=angleDelta(view.yaw,Math.atan2(dx,dz))*Math.min(1,dt*7);
  const fx=Math.sin(view.yaw),fz=Math.cos(view.yaw),hd=view.dist*Math.cos(view.pitch);
  const elevation=b.phase===2?1.3:0;
  let ox=0,oy=0;
  if(shake>0){shake=Math.max(0,shake-dt);ox=(Math.random()-.5)*shake*.6;oy=(Math.random()-.5)*shake*.6;}
  camera.position.set(p.x-fx*hd+ox,Math.max(.9,1.5+Math.sin(view.pitch)*view.dist)+oy+elevation,p.z-fz*hd);
  const k=lock?clamp(d*.12,0,.45):0;
  camera.lookAt(p.x+dx*k,1.6+elevation,p.z+dz*k);
}

function updateHud(){
  const p=game.player,b=game.boss;
  setBar('hp-fill',p.hp/p.maxHp,p.hp,p.maxHp);setText('hp-value',String(Math.ceil(p.hp)));
  setBar('stamina-fill',p.stamina/100,p.stamina,100);setText('stamina-value',String(Math.floor(p.stamina)));
  setText('flasks',String(p.potions));
  setText('lock-label',lock?'록온 켜짐 · Q':'록온 꺼짐 · Q');
  const sv=skillView(game),hud=$('skill-hud');
  setText('skill-name',sv.name);setText('skill-text',sv.text);setBar('skill-fill',sv.ratio,sv.ratio*100,100);
  if(hud.dataset.card!==sv.card)hud.dataset.card=sv.card;
  if(hud.dataset.ready!==String(sv.ready))hud.dataset.ready=String(sv.ready);
  if(hud.dataset.weapon!==game.weapon)hud.dataset.weapon=game.weapon;
  setBar('boss-fill',b.hp/b.maxHp,b.hp,b.maxHp);
  setText('boss-value',fmt(b.hp)+' / '+fmt(b.maxHp));
  setText('phase-label',b.phase===2?'두 번째 단계 · 직립 검객':'첫 번째 단계 · 사냥꾼');
  let line='틈을 읽고, 대검을 피해 파고드세요.';
  if(b.stun>0)line='기절! 지금이 기회입니다';
  else if(b.punishable)line='빈틈 — 지금 반격하세요';
  else if(b.state==='windup'||b.state==='active')line=PATTERNS[b.pattern].name;
  else if(b.state==='stagger')line='경직! 지금이 기회입니다.';
  else if(b.state==='transition')line='이권재가 두 발로 일어섭니다.';
  else if(b.state==='dead')line='긴턱이 멈추었습니다.';
  setText('boss-action',line);
  const ret=$('reticle');
  const show=mode==='playing'&&lock&&b.state!=='dead';
  if(show){
    const s=toScreen(b.x,b.phase===2?5:2.8,b.z);
    if(s){ret.hidden=false;ret.style.left=(s.x-6)+'px';ret.style.top=(s.y-6)+'px';}else ret.hidden=true;
  }else ret.hidden=true;
}

let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  vis.time+=dt;
  if(mode==='playing'){
    const input=readInput();
    tryQueued(input);
    let left=dt;
    while(left>1e-6){const h=Math.min(left,1/60);step(game,h,input);left-=h;}
    if(game.status!=='playing'){mode='ending';endAt=now+1200;setUi();}
  }else if(mode==='ending'&&now>=endAt){
    showResult();
  }
  handleEvents();
  syncPlayer(dt);syncBoss(dt);syncProjectiles(dt);updateBursts(dt);
  stance?.update(game.boss);
  effects?.update(mode==='paused'?0:dt,game);
  skillFx?.update(mode==='paused'?0:dt,game);
  updateCamera(dt);updateHud();
  renderer.render(scene,camera);
}

function resize(){
  const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();
setWeaponVisual();
setUi();
$('start').disabled=false;
$('start').textContent='전투 시작';
$('load-status').textContent='준비 완료. 시작 무기를 고른 뒤 전투를 시작하세요.';
requestAnimationFrame(frame);
