import {resizeBattleViewport} from './battle-viewport.mjs';
import {createEncounterQuality} from './battle-quality-governor.mjs';
import {createFreeLookCamera} from './free-look-camera.mjs';
import {createBattleVisualWarmup} from './runtime/battle-visual-warmup.mjs';
import {createBossHitTraitView} from './boss-hit-trait-view.mjs';
import * as THREE from 'three';
import {createCinematicWorld} from './cinematic-graphics.mjs';
import {createCinematicImpactFx} from './cinematic-impact-fx.mjs';
import {createBossAtmosphere} from './boss-atmosphere.mjs';
import {createBloodGame,actBlood,stepBlood} from './blood-combat.mjs';
import {BLOOD_RULES as R} from './blood-data.mjs';
import {createBloodUi} from './blood-ui.mjs';
import {buildBloodView} from './blood-view.mjs';
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
import {syncWeaponSpecializationVisuals} from './player-weapons.mjs';
import {actPlayer} from './player-combat.mjs';
import {reducedMotion} from './display-preferences.mjs';
import {createBossIntroGate} from './boss-intro-gate.mjs';
import {runBattleStartup} from './runtime/battle-startup.mjs';
import {createBattleCleanup} from './runtime/battle-cleanup.mjs';
import {createBattleLoop} from './runtime/battle-loop.mjs';
import {createEventScope} from './runtime/event-scope.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {createBloodTransformationAudio} from './blood-transformation-audio.mjs';
import {createBossSfx} from './boss-sfx.mjs';
import {poseBloodCamera} from './blood-transformation.mjs';

export function launchBloodBattle({weapon='sword',configure=()=>{},onClose=()=>{},diagnostics=false}={}){
 return runBattleStartup(startup=>{
  if(document.getElementById('blood-battle'))return null;
  const coarse=matchMedia('(pointer:coarse)').matches,reduced=reducedMotion(),hud=createBloodUi({coarse}),{d,root,shell,$,canvas}=hud;startup.own('Blood HUD',()=>hud.dispose());
  let warmup=null;const renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse});const quality=createEncounterQuality({coarse});startup.own('Blood renderer',()=>renderer.dispose());renderer.setPixelRatio(1);renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.outputColorSpace=THREE.SRGBColorSpace;d.showModal();
  const scope=createEventScope(window);startup.own('Blood callbacks',()=>scope.dispose());const scene=new THREE.Scene();startup.own('Blood scene',()=>disposeScene(scene));scene.background=new THREE.Color(0xf1f1ee);scene.fog=new THREE.Fog(0xf0efeb,54,123);
  scene.add(new THREE.HemisphereLight(0xfffbf1,0xbbb7b0,1.7));const sun=new THREE.DirectionalLight(0xfff3df,2.25);sun.position.set(19,38,16);sun.castShadow=!coarse;
   if(!coarse){sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:110});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.028;}
   scene.add(sun);
  const chapel=buildBloodView(scene,{coarse,reduced});startup.own('Blood view',()=>chapel.dispose());
   const atmosphere=createBossAtmosphere(scene,{profile:'blood',coarse,reduced});startup.own('Blood silent atmosphere',()=>atmosphere.dispose());const player=buildPlayer(Object.keys(WEAPONS));scene.add(player.rig);
   const cinematic=createCinematicWorld(scene,renderer,{profile:'blood',coarse,reduced});startup.own('Blood cinematic PBR',()=>cinematic.dispose());
   cinematic.apply(scene.getObjectByName('blood-white-cathedral'));
   cinematic.apply(chapel.root,{actor:true});cinematic.apply(player.rig,{actor:true});
   const contactFx=createCinematicImpactFx(scene,{profile:'blood',coarse,reduced});startup.own('Blood physical hit fragments',()=>contactFx.dispose());const traitView=createBossHitTraitView(scene,player.body,shell,{reduced});startup.own('Blood trait view',()=>traitView.dispose());const camera=new THREE.PerspectiveCamera(62,1,.1,160);
  const contexts=[],makeAudio=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;const ctx=new C();contexts.push(ctx);if(startup.pending)startup.own('Blood audio context',()=>ctx.close?.());return ctx;};
  const bloodSfx=createBossSfx();startup.own('Blood foley',()=>bloodSfx.dispose());
  const transformationAudio=createBloodTransformationAudio({makeContext:()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;}});startup.own('Blood transformation audio',()=>transformationAudio.dispose());
  const audio=createAudio(makeAudio),skillAudio=createSkillAudio(makeAudio),weaponSfx=createPlayerWeaponSfx(),fx=createPlayerPolish(scene,{mobile:coarse,reduced}),recoverySfx=createRecoverySfx(),damageFeedback=createPlayerHitFeedback(shell),impact=createCombatImpact({shell,root,boss:'blood',reduced});startup.own('Blood heal sfx',()=>recoverySfx.dispose());startup.own('Blood damage flash',()=>damageFeedback.dispose());startup.own('Blood impacts',()=>impact.dispose());startup.own('Blood effects',()=>fx.dispose());startup.own('Blood weapon sounds',()=>weaponSfx.dispose());startup.own('Blood sounds',()=>{audio.setEnabled(false);skillAudio.setEnabled(false);});
  let g=createBloodGame(weapon),mode='playing',closed=false,ready=false,ending=0,yaw=0,pitch=.48,lock=true,zoom=0,dragPointer=null,stickPointer=null,w=0,h=0;
  const keys=new Set(),stick={x:0,z:0},desired=new THREE.Vector3(),target=new THREE.Vector3();configure(g);camera.position.set(0,17,32);
   const introGate=createBossIntroGate(document,shell,'blood',{ready:()=>ready&&!closed&&warmup.ready,focus:()=>{canvas.focus({preventScroll:true});if(document.hidden||!document.hasFocus())pause.pause();},reduced});
   startup.own('Invalidate blood battle',()=>{closed=true;introGate.cancel();});
  const freeLook=createFreeLookCamera({canvas,coarse,enabled:()=>ready&&!introGate.blocked&&mode==='playing'&&!closed&&!lock,
   getAngles:()=>({yaw,pitch}),setAngles:next=>{yaw=next.yaw;pitch=next.pitch;},minPitch:.08,maxPitch:1.18});
  startup.own('Blood free-look mouse input',()=>freeLook.dispose());
  const input=()=>cameraMovement(keys,stick,yaw,lock),muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}};
  const sound=()=>{audio.setEnabled(!muted());skillAudio.setEnabled(!muted());transformationAudio.unlock();};
  function clearInput(){clearMovement(keys,stick);releaseCapturedPointer(canvas,dragPointer);releaseCapturedPointer($('stick'),stickPointer);dragPointer=stickPointer=null;$('thumb').style.transform='';if(g.player.action?.kind==='charging')g.player.action=null;}
  function setMode(value){if(value!=='playing'){bloodSfx.clear();freeLook.release();}mode=value;hud.mode(value);clearInput();transformationAudio.update(g,{running:value==='playing',muted:muted()});}
  function request(type){if(!ready||introGate.blocked||mode!=='playing')return;sound();if(type==='lock'){lock=!lock;if(lock)freeLook.release();else freeLook.capture();return;}const v=input(),accepted=actBlood(g,type,v);if(type==='roll'&&accepted){const moving=Math.hypot(v.x,v.z)>.05;g.player.action.yaw=moving?Math.atan2(v.x,v.z):g.player.yaw+Math.PI;}if(type==='heal'&&accepted)recoverySfx.event({type:'heal-start'});}
  const pause=createBattlePause({isPlaying:()=>ready&&!closed&&mode==='playing',isPaused:()=>!closed&&mode==='paused',setPaused:value=>setMode(value?'paused':'playing'),clearInput,onPause:()=>{recoverySfx.clear();damageFeedback.clear();audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.clear();fx.clear();$('resume').focus();},onResume:()=>{sound();canvas.focus();if(!lock)freeLook.capture();}});
  function reset(){introGate.arm();atmosphere.reset();contactFx.reset();traitView.clear();bloodSfx.clear();transformationAudio.reset();chapel.clear();recoverySfx.clear();damageFeedback.clear();impact.reset();g=createBloodGame(weapon);configure(g);freeLook.release();lock=true;yaw=0;pitch=.48;ending=0;fx.clear();weaponSfx.clear();setMode('playing');sound();canvas.focus();introGate.begin();}
  const close=createBattleCleanup(()=>[
   ['Stop blood battle',()=>{closed=true;freeLook.dispose();warmup?.dispose();introGate.cancel();loop.dispose();unbind();}],['Blood callbacks',()=>scope.dispose()],['Blood input',clearInput],['Blood effects',()=>fx.dispose()],['Blood sounds',()=>{audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.dispose();recoverySfx.dispose();damageFeedback.dispose();}],
   ['Blood foley',()=>bloodSfx.dispose()],['Blood transformation audio',()=>transformationAudio.dispose()],...contexts.map((ctx,i)=>['Blood audio context '+i,()=>ctx.close?.()]),['Blood trait view',()=>traitView.dispose()],['Blood view',()=>chapel.dispose()],['Blood scene',()=>disposeScene(scene)],['Blood renderer',()=>renderer.dispose()],['Blood HUD',()=>hud.dispose()],['Blood close callback',()=>onClose({weapon:g.weapon,status:g.status})]
  ]);
  scope.listen(window,'blur',()=>pause.pause());scope.listen(document,'visibilitychange',()=>{if(document.hidden)pause.pause();});scope.listen(window,'pagehide',e=>{if(!e.persisted)close();});
  scope.listen(d,'cancel',e=>{e.preventDefault();if(mode==='playing'||mode==='paused')pause.toggle();else close();});
  scope.listen(d,'keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();pause.toggle();return;}if(e.composedPath().some(n=>['BUTTON','SELECT','INPUT'].includes(n.tagName)))return;if(mode!=='playing')return;const type={KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal',KeyQ:'lock'}[e.code];if(type){e.preventDefault();if(!e.repeat)request(type);}else{if(e.code.startsWith('Arrow'))e.preventDefault();keys.add(e.code);}});
  scope.listen(d,'keyup',e=>{e.stopPropagation();keys.delete(e.code);});
  canvas.oncontextmenu=e=>e.preventDefault();canvas.onpointerdown=e=>{if(e.pointerType!=='mouse')return;if(e.button===0)request('light');if(e.button===2)request('skill');if(e.button===1){e.preventDefault();dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}};canvas.onpointermove=e=>{if(dragPointer===e.pointerId&&lock)pitch=Math.max(.2,Math.min(.9,pitch+e.movementY*.004));};canvas.onpointerup=canvas.onpointercancel=()=>{releaseCapturedPointer(canvas,dragPointer);dragPointer=null;};canvas.onwheel=e=>{zoom=Math.max(-5,Math.min(12,zoom+Math.sign(e.deltaY)));};
  for(const b of shell.querySelectorAll('[data-act]'))b.onpointerdown=e=>{e.preventDefault();request(b.dataset.act);};$('pause').onclick=$('resume').onclick=()=>pause.toggle();$('retry').onclick=reset;$('change').onclick=$('quit').onclick=close;
  const home=shell.querySelector('.brand');home.setAttribute('role','button');home.setAttribute('tabindex','0');home.setAttribute('aria-label','메인으로');home.onclick=()=>close();scope.listen(home,'keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();close();}});
  $('sound').onclick=()=>{document.getElementById('sound')?.click();sound();};$('theme').onclick=()=>document.getElementById('theme')?.click();
  function move(e){const r=$('stick').getBoundingClientRect();let x=e.clientX-r.left-r.width/2,z=r.top+r.height/2-e.clientY;const n=Math.max(1,Math.hypot(x,z)/40);x/=n;z/=n;stick.x=x/40;stick.z=z/40;$('thumb').style.transform=`translate(${x}px,${-z}px)`;}
  $('stick').onpointerdown=e=>{e.preventDefault();stickPointer=e.pointerId;$('stick').setPointerCapture(stickPointer);move(e);};$('stick').onpointermove=e=>{if(e.pointerId===stickPointer)move(e);};$('stick').onpointerup=$('stick').onpointercancel=()=>{releaseCapturedPointer($('stick'),stickPointer);stickPointer=null;stick.x=stick.z=0;$('thumb').style.transform='';};
  installChargeInput(shell,{getGame:()=>g,isActive:()=>ready&&!introGate.blocked&&mode==='playing',listen:(...args)=>scope.listen(...args),act:actPlayer});scope.ownHandlers(shell);
  hud.ready.then(ok=>{if(closed)return;if(!ok)$('load-status').textContent='스타일을 불러오지 못했습니다. 새로고침해 주세요.';ready=true;introGate.whenReady(!g.introControlled);sound();}).catch(error=>{console.error('Blood UI startup failed',error);close();});
  const samples=[];let frameAt=0;
  function frame(now,dt){if(closed||!warmup.ready)return;if(diagnostics){if(frameAt&&mode==='playing'){samples.push(now-frameAt);if(samples.length>240)samples.shift();}frameAt=now;}
   // Keep the modal's containing block in sync with browser viewport resizes.
   if(d.style.width!==innerWidth+'px')d.style.width=innerWidth+'px';if(d.style.height!==innerHeight+'px')d.style.height=innerHeight+'px';
   const visualDt=ready&&!document.hidden&&mode!=='paused'?dt:0;
   transformationAudio.update(g,{running:ready&&mode==='playing'&&!document.hidden,muted:muted()});
   if(ready&&!introGate.blocked&&mode==='playing'&&!document.hidden&&!consumeBattleGrace(g,dt)){stepBlood(g,dt,input());if(g.status!=='playing')setMode('ending');}
   if(mode==='ending'){ending+=visualDt;if(ending>=(g.status==='won'?3.2:1)){$('result-kicker').textContent=g.status==='won'?'승리':'패배';$('result-title').textContent=g.status==='won'?'배서준 토벌':'피의 서약에 쓰러졌습니다';$('result-text').textContent=g.status==='won'?'죽음을 거부한 자는 끝내 살아 있었지만, 살아 있는 자신은 어디에도 없었다.':'';$('result-stats').textContent=`적중 ${g.stats.hits}회 · 누적 피해 ${Math.round(g.stats.damage)} · ${g.time.toFixed(1)}초`;setMode('result');$('retry').focus();}}
   bloodSfx.update(mode==='playing'?visualDt:0,g);for(const e of g.events){if(e.type==='victory')playBossCue('die');bloodSfx.event(e,g);chapel.event(e,g);atmosphere.event(e,g);contactFx.event(e,g);recoverySfx.event(e);damageFeedback.hit(e);impact.event(e,g);fx.event(e,g);weaponSfx.event(e,g);if(!muted()){if(e.type==='skill-cast')skillAudio.play('skill-'+e.flavor);else if(e.type==='skill-heal'){}else{const cue={ 'boss-hit':'hit-boss',death:'death',victory:'victory'}[e.type];if(cue)audio.play(cue,{amount:e.amount,minGap:.12});}}}g.events.length=0;impact.update(visualDt);cinematic.update(g,visualDt);contactFx.update(visualDt);atmosphere.update(g,visualDt);
   chapel.update(g,impact.frozen?0:visualDt);chapel.root.rotation.x=chapel.root.rotation.z=0;impact.bossPose(chapel.root);const p=g.player,a=p.action;player.rig.position.set(p.x,0,p.z);player.rig.rotation.y=a?.yaw??p.yaw;player.rig.scale.y=g.status==='lost'?.12:1;const walk=posePlayer(player,g.time*7,a?0:Math.hypot(input().x,input().z)*4.7);player.body.position.y=1+walk.bob;swayCape(player,g.time,0);player.body.rotation.x=a?.kind==='roll'?a.t/a.total*Math.PI*2:0;player.pivot.rotation.x=a&&['attack','skill'].includes(a.kind)?-1.5+Math.sin(Math.min(1,a.t/a.total)*Math.PI)*2.9:0;for(const[key,rig]of Object.entries(player.weaponRigs))rig.visible=key===g.weapon;player.rig.rotation.x=player.rig.rotation.z=0;impact.playerPose(player.rig);fx.update(visualDt,g);syncWeaponSpecializationVisuals(player,g);
   quality.sample(dt,ready&&!introGate.blocked&&mode==='playing'&&!document.hidden);const viewport=resizeBattleViewport(renderer,camera,canvas,quality.scale);w=viewport.width;h=viewport.height;
   if(mode!=='paused'){const dx=g.boss.x-p.x,dz=g.boss.z-p.z;if(lock)yaw+=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw))*Math.min(1,dt*5);const grand=g.boss.state==='pattern'&&['wave','eclipse','tide','cross','judgement','ritual'].includes(g.blood.pattern);const fov=grand?70:62;if(Math.abs(camera.fov-fov)>.02){camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*3));camera.updateProjectionMatrix();}const dist=24+(grand?4:0)+zoom+Math.max(0,1/camera.aspect-1)*8;desired.set(p.x-Math.sin(yaw)*Math.cos(pitch)*dist,5+Math.sin(pitch)*dist,p.z-Math.cos(yaw)*Math.cos(pitch)*dist);camera.position.lerp(desired,1-Math.exp(-6*dt));target.set(p.x+(lock?Math.max(-7,Math.min(7,dx*.3)):Math.sin(yaw)*3),3+(lock?g.blood.elevation*.35:0),p.z+(lock?Math.max(-7,Math.min(7,dz*.3)):Math.cos(yaw)*3));poseBloodCamera(camera,target,g,{reduced});chapel.shake(camera);camera.lookAt(target);impact.camera(camera);}$('reticle').hidden=true;hud.render(g,skillView(g),WEAPONS[g.weapon].name,lock);chapel.occlude(camera,g);atmosphere.cameraReaction(camera);traitView.update(g,camera);renderer.render(scene,camera);
  }
  warmup=createBattleVisualWarmup({renderer,scene,camera,container:d});startup.own('Blood visual warmup',()=>warmup.dispose());const loop=createBattleLoop({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),update:frame,onError:error=>{console.error('Blood frame failed',error);close();}});startup.own('Blood loop',()=>loop.dispose());const unbind=bindBattleSession(root,()=>({game:g,active:ready&&!introGate.blocked&&mode==='playing',intro:introGate.begin,pause:()=>pause.pause(),resume:()=>pause.resume(),close,...(diagnostics?{diagnostics:()=>({graphics:{...renderer.info.memory},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,view:chapel.stats(),quality:chapel.quality,audio:transformationAudio.fired,audioState:transformationAudio.state,frameMs:[...samples]})}:{})}));startup.own('Blood session',unbind);hud.mode(mode);loop.start();resizeBattleViewport(renderer,camera,canvas,quality.scale);warmup.start().then(()=>{if(!closed)introGate.whenReady(!g.introControlled);});return {close,dispose:close,get closed(){return closed;}};
 });
}
