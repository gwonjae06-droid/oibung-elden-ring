import {resizeBattleViewport} from './battle-viewport.mjs';
import {createFramePerformanceAudit} from './runtime/performance-audit.mjs';
import {createBossHitTraitView} from './boss-hit-trait-view.mjs';
import * as THREE from 'three';
import {KWON_CAMERA_REFERENCE,matchedBossCamera} from './boss-camera-framing.mjs';
import {createGyuwonGame,actGyuwon,stepGyuwon} from './gyuwon-combat.mjs';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';
import {createGyuwonUi} from './gyuwon-ui.mjs';
import {createEncounterQuality} from './battle-quality-governor.mjs';
import {buildGyuwonView} from './gyuwon-view.mjs';
import {WEAPONS,skillView} from './combat.mjs';
import {buildPlayer,posePlayer,swayCape} from './models.mjs';
import {createAudio} from './audio.mjs';
import {createRecoverySfx} from './recovery-sfx.mjs';
import {createPlayerHitFeedback} from './player-hit-feedback.mjs';
import {createCombatImpact} from './combat-impact.mjs';
import {playBossCue} from './boss-cues.mjs';
import {createSkillAudio} from './skill-audio.mjs';
import {createPlayerWeaponSfx} from './player-weapon-sfx.mjs';
import {createPlayerPolish} from './player-polish.mjs';
import {bindBattleSession} from './battle-session.mjs';
import {cameraMovement} from './battle-input.mjs';
import {createBattlePause,clearMovement,releaseCapturedPointer} from './battle-pause.mjs';
import {consumeBattleGrace,installChargeInput} from './weapon-evolution.mjs';
import {actPlayer} from './player-combat.mjs';
import {reducedMotion} from './display-preferences.mjs';
import {createBossIntroGate} from './boss-intro-gate.mjs';
import {runBattleStartup} from './runtime/battle-startup.mjs';
import {createBattleCleanup} from './runtime/battle-cleanup.mjs';
import {createBattleLoop} from './runtime/battle-loop.mjs';
import {createEventScope} from './runtime/event-scope.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

export function launchGyuwonBattle({weapon='sword',configure=()=>{},onClose=()=>{},diagnostics=false}={}){
 return runBattleStartup(startup=>{
  if(document.getElementById('gyuwon-battle'))return null;
  const coarse=matchMedia('(pointer:coarse)').matches,reduced=reducedMotion(),hud=createGyuwonUi({coarse}),{d,root,shell,$,canvas}=hud;startup.own('Gyuwon HUD',()=>hud.dispose());
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse});const quality=createEncounterQuality({coarse}),audit=createFramePerformanceAudit({renderer,boss:'gyuwon'});startup.own('Gyuwon renderer',()=>renderer.dispose());renderer.setPixelRatio(1);renderer.shadowMap.enabled=!coarse;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.outputColorSpace=THREE.SRGBColorSpace;d.showModal();
  const scope=createEventScope(window);startup.own('Gyuwon callbacks',()=>scope.dispose());const scene=new THREE.Scene();startup.own('Gyuwon scene',()=>disposeScene(scene));scene.background=new THREE.Color(0x111b28);scene.fog=new THREE.FogExp2(0x111b28,.009);
  scene.add(new THREE.HemisphereLight(0xcbe1ff,0x263446,1.9));const sun=new THREE.DirectionalLight(0xd5eaff,2);sun.position.set(19,38,16);sun.castShadow=!coarse;
   if(!coarse){sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:110});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.028;}
   scene.add(sun);
  const study=buildGyuwonView(scene,{coarse,reduced});startup.own('Gyuwon view',()=>study.dispose());
  const player=buildPlayer(Object.keys(WEAPONS));scene.add(player.rig);const traitView=createBossHitTraitView(scene,player.body,shell,{reduced});startup.own('Gyuwon trait view',()=>traitView.dispose());const camera=new THREE.PerspectiveCamera(KWON_CAMERA_REFERENCE.fov,1,.1,1000);
  const contexts=[],makeAudio=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;const ctx=new C();contexts.push(ctx);if(startup.pending)startup.own('Gyuwon audio context',()=>ctx.close?.());return ctx;};
  const audio=createAudio(makeAudio),skillAudio=createSkillAudio(makeAudio),weaponSfx=createPlayerWeaponSfx(),fx=createPlayerPolish(scene,{mobile:coarse,reduced}),recoverySfx=createRecoverySfx(),damageFeedback=createPlayerHitFeedback(shell),impact=createCombatImpact({shell,root,boss:'gyuwon',reduced});startup.own('Gyuwon heal sfx',()=>recoverySfx.dispose());startup.own('Gyuwon damage flash',()=>damageFeedback.dispose());startup.own('Gyuwon impacts',()=>impact.dispose());startup.own('Gyuwon effects',()=>fx.dispose());startup.own('Gyuwon weapon sounds',()=>weaponSfx.dispose());startup.own('Gyuwon sounds',()=>{audio.setEnabled(false);skillAudio.setEnabled(false);});
  let g=createGyuwonGame(weapon),mode='playing',closed=false,ready=false,ending=0,yaw=0,pitch=KWON_CAMERA_REFERENCE.pitch,lock=true,zoom=0,dragPointer=null,stickPointer=null,w=0,h=0;
  const keys=new Set(),stick={x:0,z:0},desired=new THREE.Vector3(),target=new THREE.Vector3();configure(g);camera.position.set(0,7,20);
   const introGate=createBossIntroGate(document,shell,'gyuwon',{ready:()=>ready&&!closed,focus:()=>{canvas.focus({preventScroll:true});if(document.hidden||!document.hasFocus())pause.pause();},reduced});
   startup.own('Invalidate gyuwon battle',()=>{closed=true;introGate.cancel();});
  const input=()=>cameraMovement(keys,stick,yaw,lock),muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}};
  const sound=()=>{audio.setEnabled(!muted());skillAudio.setEnabled(!muted());};
  function clearInput(){clearMovement(keys,stick);releaseCapturedPointer(canvas,dragPointer);releaseCapturedPointer($('stick'),stickPointer);dragPointer=stickPointer=null;$('thumb').style.transform='';if(g.player.action?.kind==='charging')g.player.action=null;}
  function setMode(value){mode=value;hud.mode(value);clearInput();}
  function request(type){if(!ready||introGate.blocked||mode!=='playing')return;sound();if(type==='lock'){lock=!lock;return;}const accepted=actGyuwon(g,type,input());if(type==='heal'&&accepted)recoverySfx.event({type:'heal-start'});}
  const pause=createBattlePause({isPlaying:()=>ready&&!closed&&mode==='playing',isPaused:()=>!closed&&mode==='paused',setPaused:value=>setMode(value?'paused':'playing'),clearInput,onPause:()=>{recoverySfx.clear();damageFeedback.clear();audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.clear();fx.clear();$('resume').focus();},onResume:()=>{sound();canvas.focus();}});
  function reset(){introGate.arm();traitView.clear();study.clear();recoverySfx.clear();damageFeedback.clear();impact.reset();g=createGyuwonGame(weapon);configure(g);pitch=KWON_CAMERA_REFERENCE.pitch;zoom=0;ending=0;fx.clear();weaponSfx.clear();setMode('playing');sound();canvas.focus();introGate.begin();}
  const close=createBattleCleanup(()=>[
   ['Stop gyuwon battle',()=>{closed=true;introGate.cancel();loop.dispose();unbind();}],['Gyuwon callbacks',()=>scope.dispose()],['Gyuwon input',clearInput],['Gyuwon effects',()=>fx.dispose()],['Gyuwon sounds',()=>{audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.dispose();recoverySfx.dispose();damageFeedback.dispose();}],
   ...contexts.map((ctx,i)=>['Gyuwon audio context '+i,()=>ctx.close?.()]),['Gyuwon trait view',()=>traitView.dispose()],['Gyuwon view',()=>study.dispose()],['Gyuwon scene',()=>disposeScene(scene)],['Gyuwon renderer',()=>renderer.dispose()],['Gyuwon HUD',()=>hud.dispose()],['Gyuwon close callback',()=>onClose({weapon:g.weapon,status:g.status})]
  ]);
  scope.listen(window,'blur',()=>pause.pause());scope.listen(document,'visibilitychange',()=>{if(document.hidden)pause.pause();});scope.listen(window,'pagehide',e=>{if(!e.persisted)close();});
  scope.listen(d,'cancel',e=>{e.preventDefault();if(mode==='playing'||mode==='paused')pause.toggle();else close();});
  scope.listen(d,'keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();pause.toggle();return;}if(e.composedPath().some(n=>['BUTTON','SELECT','INPUT'].includes(n.tagName)))return;if(mode!=='playing')return;const type={KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal',KeyQ:'lock'}[e.code];if(type){e.preventDefault();if(!e.repeat)request(type);}else{if(e.code.startsWith('Arrow'))e.preventDefault();keys.add(e.code);}});
  scope.listen(d,'keyup',e=>{e.stopPropagation();keys.delete(e.code);});
  canvas.oncontextmenu=e=>e.preventDefault();canvas.onpointerdown=e=>{if(e.pointerType!=='mouse')return;if(e.button===0)request('light');if(e.button===2)request('skill');if(e.button===1){e.preventDefault();dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}};canvas.onpointermove=e=>{if(dragPointer!==e.pointerId)return;if(!lock)yaw-=e.movementX*.005;pitch=Math.max(.2,Math.min(.9,pitch+e.movementY*.004));};canvas.onpointerup=canvas.onpointercancel=()=>{releaseCapturedPointer(canvas,dragPointer);dragPointer=null;};canvas.onwheel=e=>{zoom=Math.max(-5,Math.min(12,zoom+Math.sign(e.deltaY)));};
  for(const b of shell.querySelectorAll('[data-act]'))b.onpointerdown=e=>{e.preventDefault();request(b.dataset.act);};$('pause').onclick=$('resume').onclick=()=>pause.toggle();$('retry').onclick=reset;$('change').onclick=$('quit').onclick=close;
  const home=shell.querySelector('.brand');home.setAttribute('role','button');home.setAttribute('tabindex','0');home.setAttribute('aria-label','메인으로');home.onclick=()=>close();scope.listen(home,'keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();close();}});
  $('sound').onclick=()=>{document.getElementById('sound')?.click();sound();};$('theme').onclick=()=>document.getElementById('theme')?.click();
  function move(e){const r=$('stick').getBoundingClientRect();let x=e.clientX-r.left-r.width/2,z=r.top+r.height/2-e.clientY;const n=Math.max(1,Math.hypot(x,z)/40);x/=n;z/=n;stick.x=x/40;stick.z=z/40;$('thumb').style.transform=`translate(${x}px,${-z}px)`;}
  $('stick').onpointerdown=e=>{e.preventDefault();stickPointer=e.pointerId;$('stick').setPointerCapture(stickPointer);move(e);};$('stick').onpointermove=e=>{if(e.pointerId===stickPointer)move(e);};$('stick').onpointerup=$('stick').onpointercancel=()=>{releaseCapturedPointer($('stick'),stickPointer);stickPointer=null;stick.x=stick.z=0;$('thumb').style.transform='';};
  installChargeInput(shell,{getGame:()=>g,isActive:()=>ready&&!introGate.blocked&&mode==='playing',listen:(...args)=>scope.listen(...args),act:actPlayer});scope.ownHandlers(shell);
  hud.ready.then(ok=>{if(closed)return;if(!ok)$('load-status').textContent='스타일을 불러오지 못했습니다. 새로고침해 주세요.';ready=true;introGate.whenReady(!g.introControlled);sound();}).catch(error=>{console.error('Gyuwon UI startup failed',error);close();});
  const samples=[];let frameAt=0;
  function frame(now,dt){if(diagnostics){if(frameAt&&mode==='playing'){samples.push(now-frameAt);if(samples.length>240)samples.shift();}frameAt=now;}
   // Keep the modal's containing block in sync with browser viewport resizes.
   if(d.style.width!==innerWidth+'px')d.style.width=innerWidth+'px';if(d.style.height!==innerHeight+'px')d.style.height=innerHeight+'px';
   const visualDt=ready&&!document.hidden&&mode!=='paused'?dt:0;

   if(ready&&!introGate.blocked&&mode==='playing'&&!document.hidden&&!consumeBattleGrace(g,dt)){stepGyuwon(g,dt,input());if(g.status!=='playing')setMode('ending');}
   if(mode==='ending'){ending+=visualDt;if(ending>=(g.status==='won'?8:1)){$('result-kicker').textContent=g.status==='won'?'승리':'패배';$('result-title').textContent=g.status==='won'?'최규원 토벌':'마지막 문제 앞에 쓰러졌습니다';$('result-text').textContent=g.status==='won'?'정답이 없는 밤에도, 그는 처음으로 문제집을 덮었다.':'';$('result-stats').textContent=`적중 ${g.stats.hits}회 · 누적 피해 ${Math.round(g.stats.damage)} · ${g.time.toFixed(1)}초`;setMode('result');$('retry').focus();}}
   for(const e of g.events){if(e.type==='victory')playBossCue('die');study.event(e,g);recoverySfx.event(e);damageFeedback.hit(e);impact.event(e,g);fx.event(e,g);weaponSfx.event(e,g);if(!muted()){if(e.type==='skill-cast')skillAudio.play('skill-'+e.flavor);else if(e.type==='skill-heal'){}else{const cue={ 'boss-hit':'hit-boss',hurt:'hit-player',death:'death',victory:'victory',phase:'phase','gyuwon-warning':'tele-slam','gyuwon-impact':'boss-slam',space:'tele-whirl','memory-stage':'tele-thrust'}[e.type];if(cue)audio.play(cue,{amount:e.amount,minGap:.12});}}}g.events.length=0;impact.update(visualDt);
   study.update(g,impact.frozen?0:visualDt);study.root.rotation.x=study.root.rotation.z=0;impact.bossPose(study.root);const p=g.player,a=p.action;player.rig.position.set(p.x,0,p.z);player.rig.rotation.y=a?.yaw??p.yaw;player.rig.scale.y=g.status==='lost'?.12:1;const walk=posePlayer(player,g.time*7,a?0:Math.hypot(input().x,input().z)*5);player.body.position.y=1+walk.bob;swayCape(player,g.time,0);player.body.rotation.x=a?.kind==='roll'?a.t/a.total*Math.PI*2:0;player.pivot.rotation.x=a&&['attack','skill'].includes(a.kind)?-1.5+Math.sin(Math.min(1,a.t/a.total)*Math.PI)*2.9:0;for(const[key,rig]of Object.entries(player.weaponRigs))rig.visible=key===g.weapon;player.rig.rotation.x=player.rig.rotation.z=0;impact.playerPose(player.rig);fx.update(visualDt,g);
   quality.sample(dt,ready&&!introGate.blocked&&mode==='playing'&&!document.hidden);const viewport=resizeBattleViewport(renderer,camera,canvas,quality.scale);w=viewport.width;h=viewport.height;
   if(mode!=='paused'){const dx=g.boss.x-p.x,dz=g.boss.z-p.z;if(lock)yaw+=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw))*Math.min(1,dt*5);const fov=KWON_CAMERA_REFERENCE.fov;if(Math.abs(camera.fov-fov)>.02){camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*3));camera.updateProjectionMatrix();}const frame=matchedBossCamera('gyuwon',{
  player:p,boss:g.boss,yaw,pitch,zoom,aspect:camera.aspect,locked:lock,
  headHeight:3+Math.max(0,g.gyuwon.elevation||0)*.35
 });
 desired.set(frame.position.x,frame.position.y,frame.position.z);
 camera.position.lerp(desired,1-Math.exp(-6*dt));
 target.set(frame.focus.x,frame.focus.y,frame.focus.z);study.shake(camera);camera.lookAt(target);impact.camera(camera);}$('reticle').hidden=true;hud.render(g,skillView(g),WEAPONS[g.weapon].name,lock);study.occlude(camera,g);traitView.update(g,camera);renderer.render(scene,camera);audit.sample(dt,{active:ready&&!introGate.blocked&&mode==='playing'&&!document.hidden,phase:g.boss.phase,pattern:g.gyuwon.pattern,scale:quality.scale});
  }
  const loop=createBattleLoop({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),update:frame,onError:error=>{console.error('Gyuwon frame failed',error);close();}});startup.own('Gyuwon loop',()=>loop.dispose());const unbind=bindBattleSession(root,()=>({game:g,active:ready&&!introGate.blocked&&mode==='playing',intro:introGate.begin,pause:()=>pause.pause(),resume:()=>pause.resume(),close,...(diagnostics?{diagnostics:()=>({graphics:{...renderer.info.memory},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,view:study.stats(),quality:study.quality,frameMs:[...samples]})}:{})}));startup.own('Gyuwon session',unbind);hud.mode(mode);loop.start();return {close,dispose:close,get closed(){return closed;}};
 });
}
