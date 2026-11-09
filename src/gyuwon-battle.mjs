import {createDanceCueAudio} from './gyuwon-dance-cues.mjs';
import {referenceKeyAction,usesReference2d} from './gyuwon-reference-rules.mjs';
import {createGyuwon2dView} from './gyuwon-2d-view.mjs';
import {createGyuwonTurnStage} from './gyuwon-turn-stage.mjs';
import {createGyuwonLivingDoodle,isGyuwonLivingDoodleAct} from './gyuwon-living-doodle.mjs';
import {createPlayerProjectileView} from './player-projectile-view.mjs';
import {gyuwonMemoryFraming} from './gyuwon-horizon-camera.mjs';
import {resizeBattleViewport,viewportRenderScale} from './battle-viewport.mjs';
import {createFramePerformanceAudit} from './runtime/performance-audit.mjs';
import {createBossHitTraitView} from './boss-hit-trait-view.mjs';
import * as THREE from 'three';
import {KWON_CAMERA_REFERENCE,matchedBossCamera} from './boss-camera-framing.mjs';
import {createGyuwonGame,actGyuwon,stepGyuwon} from './gyuwon-combat.mjs';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';
import {createGyuwonUi} from './gyuwon-ui.mjs';
import {createGyuwonMusicalStage} from './gyuwon-musical-stage.mjs';
import {createGyuwonMusicalScore} from './gyuwon-musical-score.mjs';
import {createGyuwonFoley} from './gyuwon-foley.mjs';
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
import {createFreeLookCamera} from './free-look-camera.mjs';
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
   const doodle=createGyuwonLivingDoodle(renderer,{coarse,reducedMotion:reduced});startup.own('Act V living doodle',()=>doodle.dispose());
  const scope=createEventScope(window);startup.own('Gyuwon callbacks',()=>scope.dispose());const scene=new THREE.Scene();startup.own('Gyuwon scene',()=>disposeScene(scene));scene.background=new THREE.Color(0x111b28);scene.fog=new THREE.FogExp2(0x111b28,.009);
  scene.add(new THREE.HemisphereLight(0xcbe1ff,0x263446,1.9));const sun=new THREE.DirectionalLight(0xd5eaff,2);sun.position.set(19,38,16);sun.castShadow=!coarse;
   if(!coarse){sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:110});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.028;}
   scene.add(sun);
  const study=buildGyuwonView(scene,{coarse,reduced});startup.own('Gyuwon view',()=>study.dispose());
  const musicalStage=createGyuwonMusicalStage(scene,{coarse});startup.own('Gyuwon musical stage',()=>musicalStage.dispose());
// Gyuwon already simulates ranged hits; the shared 3D projectile renderer
// used by the other bosses was never attached to this battle scene.
const playerProjectiles=createPlayerProjectileView(scene);
startup.own('Gyuwon player projectiles',()=>playerProjectiles.dispose());
  const player=buildPlayer(Object.keys(WEAPONS));scene.add(player.rig);const traitView=createBossHitTraitView(scene,player.body,shell,{reduced});startup.own('Gyuwon trait view',()=>traitView.dispose());const camera=new THREE.PerspectiveCamera(KWON_CAMERA_REFERENCE.fov,1,.1,1000);
  const turnStage=createGyuwonTurnStage(scene,{player,boss:study.root,coarse});startup.own('Gyuwon reference turn stage',()=>turnStage.dispose());musicalStage.setEnsemble(turnStage.ensembleRoles);
  const flatView=createGyuwon2dView(document,shell,{onPointer:point=>{const m=g.gyuwon.years?.musical;if(m)m.pointerTarget=point;},focus:()=>{if(ready&&mode==='playing')sound();}});startup.own('Gyuwon true 2D view',()=>flatView.dispose());
  const contexts=[],makeAudio=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;const ctx=new C();contexts.push(ctx);if(startup.pending)startup.own('Gyuwon audio context',()=>ctx.close?.());return ctx;};
  const musicalScore=createGyuwonMusicalScore();
  const danceCues=createDanceCueAudio();startup.own('Gyuwon dancer cue sounds',()=>danceCues.dispose());
  const foley=createGyuwonFoley();startup.own('Gyuwon foley',()=>foley.dispose());
  startup.own('Gyuwon original musical score',()=>musicalScore.dispose());
  const bellAudio=new Audio(new URL('../assets/sfx/bell.mp3',import.meta.url).href);bellAudio.preload='auto';bellAudio.volume=.44;
  startup.own('Gyuwon school bell',()=>{bellAudio.pause();bellAudio.removeAttribute('src');bellAudio.load?.();});
  const audio=createAudio(makeAudio),skillAudio=createSkillAudio(makeAudio),weaponSfx=createPlayerWeaponSfx(),fx=createPlayerPolish(scene,{mobile:coarse,reduced}),recoverySfx=createRecoverySfx(),damageFeedback=createPlayerHitFeedback(shell),impact=createCombatImpact({shell,root,boss:'gyuwon',reduced});startup.own('Gyuwon heal sfx',()=>recoverySfx.dispose());startup.own('Gyuwon damage flash',()=>damageFeedback.dispose());startup.own('Gyuwon impacts',()=>impact.dispose());startup.own('Gyuwon effects',()=>fx.dispose());startup.own('Gyuwon weapon sounds',()=>weaponSfx.dispose());startup.own('Gyuwon sounds',()=>{audio.setEnabled(false);skillAudio.setEnabled(false);});
  let g=createGyuwonGame(weapon,{yearMode:true}),mode='playing',closed=false,ready=false,ending=0,yaw=0,pitch=KWON_CAMERA_REFERENCE.pitch,lock=true,zoom=0,dragPointer=null,stickPointer=null,w=0,h=0;
  const keys=new Set(),stick={x:0,z:0},desired=new THREE.Vector3(),target=new THREE.Vector3();configure(g);camera.position.set(0,7,20);
   const introGate=createBossIntroGate(document,shell,'gyuwon',{ready:()=>ready&&!closed,focus:()=>{canvas.focus({preventScroll:true});if(document.hidden||!document.hasFocus())pause.pause();},reduced});
   startup.own('Invalidate gyuwon battle',()=>{closed=true;introGate.cancel();});
  const musicalInput=()=>({x:Math.max(-1,Math.min(1,(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x)),z:Math.max(-1,Math.min(1,(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+stick.z)),guard:keys.has('KeyI')});
  const input=()=>cameraMovement(keys,stick,yaw,lock),muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}};
  const freeLook=createFreeLookCamera({canvas,coarse,
   enabled:()=>ready&&!introGate.blocked&&mode==='playing'&&!closed&&!lock&&!g.gyuwon.years?.musical,
   getAngles:()=>({yaw,pitch}),setAngles:next=>{yaw=next.yaw;pitch=next.pitch;},
   minPitch:.08,maxPitch:1.18});
  startup.own('Gyuwon free-look camera',()=>freeLook.dispose());
  const sound=()=>{audio.setEnabled(!muted());skillAudio.setEnabled(!muted());};
  function clearInput(){flatView.clearInput?.();const mini=g.gyuwon.years?.musical;if(mini){mini.guardHeld=false;mini.slideHeld=false;mini.slide=0;mini.pointerTarget=null;}clearMovement(keys,stick);releaseCapturedPointer(canvas,dragPointer);releaseCapturedPointer($('stick'),stickPointer);dragPointer=stickPointer=null;$('thumb').style.transform='';if(g.player.action?.kind==='charging')g.player.action=null;}
  function setMode(value){if(value!=='playing')freeLook.release();mode=value;hud.mode(value);clearInput();}
  function request(type){
   if(!ready||introGate.blocked||mode!=='playing')return;
   if(type==='retry-audio'){musicalScore.retry();return;}
   sound();
   if(type==='lock'){lock=!lock;if(lock)freeLook.release();else freeLook.capture();return;}
   const v=g.gyuwon.years?.musical?musicalInput():input(),accepted=actGyuwon(g,type,{...v,lock,cameraYaw:yaw});
   if(type==='roll'&&accepted&&g.player.action){
    const moving=Math.hypot(v.x,v.z)>.05;
    g.player.action.yaw=moving?Math.atan2(v.x,v.z):g.player.yaw+Math.PI;
   }
   if(type==='heal'&&accepted)recoverySfx.event({type:'heal-start'});
  }
  hud.onMusicalAction(request);
  const pause=createBattlePause({isPlaying:()=>ready&&!closed&&mode==='playing',isPaused:()=>!closed&&mode==='paused',setPaused:value=>setMode(value?'paused':'playing'),clearInput,onPause:()=>{foley.clear();musicalScore.stop();bellAudio.pause();recoverySfx.clear();damageFeedback.clear();audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.clear();fx.clear();$('resume').focus();},onResume:()=>{sound();canvas.focus();if(!lock)freeLook.capture();}});
  function reset(){musicalScore.stop();introGate.arm();playerProjectiles.clear();traitView.clear();study.clear();recoverySfx.clear();damageFeedback.clear();impact.reset();g=createGyuwonGame(weapon,{yearMode:true});configure(g);freeLook.release();lock=true;yaw=0;pitch=KWON_CAMERA_REFERENCE.pitch;zoom=0;ending=0;fx.clear();weaponSfx.clear();setMode('playing');sound();canvas.focus();introGate.begin();}
  const close=createBattleCleanup(()=>[
   ['Gyuwon dancer cues',()=>danceCues.dispose()],
   ['Gyuwon reference graphics',()=>{flatView.dispose();turnStage.dispose();musicalStage.dispose();}],
   ['Gyuwon physical foley',()=>foley.dispose()],
   ['Stop gyuwon battle',()=>{closed=true;freeLook.dispose();introGate.cancel();loop.dispose();unbind();}],['Gyuwon callbacks',()=>scope.dispose()],['Gyuwon input',clearInput],['Gyuwon effects',()=>fx.dispose()],['Gyuwon sounds',()=>{musicalScore.dispose();audio.setEnabled(false);skillAudio.setEnabled(false);weaponSfx.dispose();recoverySfx.dispose();damageFeedback.dispose();bellAudio.pause();}],
   ...contexts.map((ctx,i)=>['Gyuwon audio context '+i,()=>ctx.close?.()]),['Gyuwon trait view',()=>traitView.dispose()],['Gyuwon player projectiles',()=>playerProjectiles.dispose()],['Gyuwon view',()=>study.dispose()],['Gyuwon scene',()=>disposeScene(scene)],['Gyuwon renderer',()=>renderer.dispose()],['Gyuwon HUD',()=>hud.dispose()],['Gyuwon close callback',()=>onClose({weapon:g.weapon,status:g.status})]
  ]);
  scope.listen(window,'blur',()=>pause.pause());scope.listen(document,'visibilitychange',()=>{if(document.hidden)pause.pause();});scope.listen(window,'pagehide',e=>{if(!e.persisted)close();});
  scope.listen(d,'cancel',e=>{e.preventDefault();if(mode==='playing'||mode==='paused')pause.toggle();else close();});
  scope.listen(d,'keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();pause.toggle();return;}if(e.composedPath().some(n=>['BUTTON','SELECT','INPUT'].includes(n.tagName)))return;if(mode!=='playing')return;const type=referenceKeyAction(g.gyuwon.years?.musical,e.code)||{KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal',KeyQ:'lock'}[e.code];if(type){e.preventDefault();if(!e.repeat){keys.add(e.code);request(type);}}else{if(e.code.startsWith('Arrow'))e.preventDefault();keys.add(e.code);}});
  scope.listen(d,'keyup',e=>{e.stopPropagation();keys.delete(e.code);if(e.code==='KeyI')request('guard-end');if(['KeyL','KeyS','ArrowDown'].includes(e.code)&&g.gyuwon.years?.musical?.year===6)request('slide-end');});
  canvas.oncontextmenu=e=>e.preventDefault();canvas.onpointerdown=e=>{if(e.pointerType!=='mouse')return;if(e.button===0)request('light');if(e.button===2)request('skill');if(e.button===1){e.preventDefault();dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}};canvas.onpointermove=e=>{if(dragPointer!==e.pointerId)return;if(lock)pitch=Math.max(.2,Math.min(.9,pitch+e.movementY*.004));};canvas.onpointerup=canvas.onpointercancel=()=>{releaseCapturedPointer(canvas,dragPointer);dragPointer=null;};canvas.onwheel=e=>{zoom=Math.max(-5,Math.min(12,zoom+Math.sign(e.deltaY)));};
  for(const b of shell.querySelectorAll('[data-act]'))b.onpointerdown=e=>{e.preventDefault();request(b.dataset.act);};$('pause').onclick=$('resume').onclick=()=>pause.toggle();$('retry').onclick=reset;$('change').onclick=$('quit').onclick=close;
  const home=shell.querySelector('.brand');home.setAttribute('role','button');home.setAttribute('tabindex','0');home.setAttribute('aria-label','메인으로');home.onclick=()=>close();scope.listen(home,'keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();close();}});
  $('sound').onclick=()=>{document.getElementById('sound')?.click();sound();};$('theme').onclick=()=>document.getElementById('theme')?.click();
  function move(e){const r=$('stick').getBoundingClientRect();let x=e.clientX-r.left-r.width/2,z=r.top+r.height/2-e.clientY;const n=Math.max(1,Math.hypot(x,z)/40);x/=n;z/=n;stick.x=x/40;stick.z=z/40;$('thumb').style.transform=`translate(${x}px,${-z}px)`;}
  $('stick').onpointerdown=e=>{e.preventDefault();stickPointer=e.pointerId;$('stick').setPointerCapture(stickPointer);move(e);};$('stick').onpointermove=e=>{if(e.pointerId===stickPointer)move(e);};$('stick').onpointerup=$('stick').onpointercancel=()=>{releaseCapturedPointer($('stick'),stickPointer);stickPointer=null;stick.x=stick.z=0;$('thumb').style.transform='';};
  installChargeInput(shell,{getGame:()=>g,isActive:()=>ready&&!introGate.blocked&&mode==='playing'&&!g.gyuwon.years?.musical,listen:(...args)=>scope.listen(...args),act:actPlayer});scope.ownHandlers(shell);
  hud.ready.then(async ok=>{if(closed)return;if(!ok)$('load-status').textContent='스타일을 불러오지 못했습니다. 새로고침해 주세요.';
    // First-use GPU shader compilation belongs behind the initial loading
    // gate, never in the middle of a phase-three memory map transition.
    try{study.update(g,0);await study.prewarmProgressive(renderer,camera,{companions:[player.rig],openingOnly:!g.gyuwon.years?.legacyAnnual});if(!g.gyuwon.years?.legacyAnnual)await turnStage.prewarm(renderer,camera);doodle.prewarm();}catch(error){console.warn('Gyuwon memory prewarm unavailable',error);}
    if(closed)return;hud.loading(false);ready=true;introGate.whenReady(!g.introControlled);sound();}).catch(error=>{console.error('Gyuwon UI startup failed',error);close();});
  const samples=[];let frameAt=0;
  function frame(now,dt,realDt=dt){if(diagnostics){if(frameAt&&mode==='playing'){samples.push(now-frameAt);if(samples.length>240)samples.shift();}frameAt=now;}
   // Keep the modal's containing block in sync with browser viewport resizes.
   if(d.style.width!==innerWidth+'px')d.style.width=innerWidth+'px';if(d.style.height!==innerHeight+'px')d.style.height=innerHeight+'px';
   if(!ready){frameAt=0;return;}
   danceCues.update(g,{active:!introGate.blocked&&mode==='playing'&&!document.hidden,muted:muted()});
   foley.update(g,{active:!introGate.blocked&&mode==='playing'&&!document.hidden,muted:muted()});
   const visualDt=!document.hidden&&mode!=='paused'?dt:0;

   musicalScore.update(g,{enabled:ready&&!introGate.blocked&&!document.hidden&&mode==='playing'&&!g.startGrace,muted:muted()});
   if(ready&&!introGate.blocked&&mode==='playing'&&!document.hidden&&!consumeBattleGrace(g,dt)){stepGyuwon(g,dt,{...(g.gyuwon.years?.musical?musicalInput():input()),lock,cameraYaw:yaw});if(g.status!=='playing')setMode('ending');}
   if(mode==='ending'){ending+=visualDt;if(ending>=(g.status==='won'?(g.gyuwon.years?.musical?1.5:8):1)){$('result-kicker').textContent=g.status==='won'?'승리':'패배';$('result-title').textContent=g.status==='won'?'최규원 토벌':'마지막 문제 앞에 쓰러졌습니다';$('result-text').textContent=g.status==='won'?'정답이 없는 밤에도, 그는 처음으로 문제집을 덮었다.':'';$('result-stats').textContent=`적중 ${g.stats.hits}회 · 누적 피해 ${Math.round(g.stats.damage)} · ${g.time.toFixed(1)}초`;setMode('result');$('retry').focus();}}
   for(const e of g.events){if(e.type==='victory')playBossCue('die');
    danceCues.event(e,g);study.event(e,g);recoverySfx.event(e);damageFeedback.hit(e);impact.event(e,g);fx.event(e,g);weaponSfx.event(e,g);
    if(e.type==='gyuwon-exam-bell'&&!muted()){bellAudio.pause();bellAudio.currentTime=0;bellAudio.play()?.catch(()=>{});}
    if(e.type==='gyuwon-exam-grade'&&!muted()){audio.play(e.result==='great'?'phase':e.result==='normal'?'healed':'hit-boss',{minGap:.1});}
    if(!muted()){if(e.type==='skill-cast')skillAudio.play('skill-'+e.flavor);else if(e.type==='skill-heal'){}else{const cue={ 'boss-hit':'hit-boss','gyuwon-calendar-hit':'hit-boss',hurt:'hit-player',death:'death',victory:'victory',phase:'phase','gyuwon-warning':'tele-slam','gyuwon-impact':'boss-slam',space:'tele-whirl','memory-stage':'tele-thrust'}[e.type];if(cue)audio.play(cue,{amount:e.amount,minGap:.12});}}}g.events.length=0;impact.update(visualDt);
   const referenceMini=g.gyuwon.years?.musical;
   if(usesReference2d(referenceMini)){flatView.render(g);turnStage.root.visible=false;hud.render(g,skillView(g),WEAPONS[g.weapon].name,lock);return;}
   flatView.canvas.hidden=true;
   study.update(g,impact.frozen?0:visualDt);musicalStage.update(g);musicalStage.root.visible=musicalStage.root.visible&&!referenceMini?.reference;turnStage.update(g);player.rig.visible=!(referenceMini?.reference&&referenceMini.year===5);study.root.visible=!(referenceMini?.giantRaid);impact.bossPose(study.root);const p=g.player,a=p.action;player.rig.position.set(p.x,p.floorY||0,p.z);player.rig.rotation.y=a?.yaw??p.yaw;player.rig.scale.y=g.status==='lost'?.12:g.gyuwon.years?.musical?.slide>0?.48:1;const walk=posePlayer(player,(g.gyuwon.years?.musical?.time??g.time)*7,a?0:g.gyuwon.years?.musical?.kind==='runner'?7:Math.hypot(input().x,input().z)*5);player.body.position.y=1+walk.bob;swayCape(player,g.time,0);player.body.rotation.x=a?.kind==='roll'?a.t/a.total*Math.PI*2:a?.kind==='hurt'?-.3:0;player.pivot.rotation.x=g.gyuwon.years?.musical?.playerStrike?-1.2+Math.sin(Math.min(1,g.gyuwon.years.musical.playerStrike.age/.6)*Math.PI)*2.5:a&&['attack','skill'].includes(a.kind)?-1.5+Math.sin(Math.min(1,a.t/a.total)*Math.PI)*2.9:0;for(const[key,rig]of Object.entries(player.weaponRigs))rig.visible=key===g.weapon;player.rig.rotation.x=player.rig.rotation.z=0;impact.playerPose(player.rig);fx.update(visualDt,g);
   // Real positions are shared with collision for arrows, cards, sword
   // waves and returning hammers, including the annual map's raised floors.
   playerProjectiles.update(g,visualDt);
   quality.sample(realDt,ready&&!introGate.blocked&&mode==='playing'&&!document.hidden);const viewport=resizeBattleViewport(renderer,camera,canvas,quality.scale);w=viewport.width;h=viewport.height;
   if(mode!=='paused'){
   const musical=g.gyuwon.years?.musical;
   if(musical){
    const genre=musical.kind,closing=musical.finishing;
    const fov=closing?40:genre==='army'?58:genre==='shooter'?61:52;
    if(Math.abs(camera.fov-fov)>.02){
     camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*3.2));
     camera.updateProjectionMatrix();
    }
    if(closing){
     // No cutscene skip or camera snap: from broad musical to small,
     // exhausted human, with the same rig still on the white stage.
     desired.set(g.boss.x+5.8,3.4,g.boss.z+10.5);
     target.set(g.boss.x,1.15,g.boss.z);
    }else if(musical.reference&&musical.year===5){
     const frame=turnStage.cameraFrame(musical,camera.aspect);desired.set(frame.position.x,frame.position.y,frame.position.z);target.set(frame.target.x,frame.target.y,frame.target.z);
    }else if(genre==='shooter'){
     desired.set(0,34,5);
     target.set(0,0,0);
    }else if(genre==='army'){
     desired.set(0,18,48);
     target.set(0,1,0);
    }else if(genre==='runner'){
     desired.set(1,7.6,30);
     target.set(1,1,0);
    }else if(genre==='rhythm'||genre==='finale'){
     desired.set(0,8.5,29);
     target.set(0,1,0);
    }else{
     desired.set(0,7.7,29);
     target.set(0,1,0);
    }
    camera.position.lerp(desired,1-Math.exp(-Math.min(.05,dt)*3.5));
   }else{
   const dx=g.boss.x-p.x,dz=g.boss.z-p.z;if(lock)yaw+=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw))*Math.min(1,dt*5);const fov=KWON_CAMERA_REFERENCE.fov+(g.gyuwon.years?.cast==='nightmare365'?5:0);if(Math.abs(camera.fov-fov)>.02){camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*3));camera.updateProjectionMatrix();}const memoryCamera=lock?gyuwonMemoryFraming(g):{pitch:0,distance:0,height:0},
  frame=matchedBossCamera('gyuwon',{
  player:p,boss:g.boss,yaw,pitch:Math.max(pitch,memoryCamera.pitch),zoom,
  aspect:camera.aspect,locked:lock,extraDistance:memoryCamera.distance+(g.gyuwon.years?.cast==='nightmare365'?6:0),
  headHeight:3+Math.max(0,g.gyuwon.elevation||0)*.35
 });
 desired.set(frame.position.x,frame.position.y+memoryCamera.height+(p.floorY||0),frame.position.z);
 target.set(frame.focus.x,frame.focus.y+memoryCamera.height*.18+(p.floorY||0)*.45,frame.focus.z);
 if(g.gyuwon.years?.mode==='result'){
  // Diegetic result cinematic: focus on the human boss and the real score sheet.
  const a=g.boss.yaw||0,b=g.boss,t=g.gyuwon.years.gradeT;
  const travel=12-3.8*Math.min(1,Math.max(0,t/2));
  desired.set(b.x+Math.sin(a)*travel,4.4+Math.sin(t*2)*.13,
   b.z+Math.cos(a)*travel);
  target.set(b.x,2.05,b.z);
 }
 camera.position.lerp(desired,1-Math.exp(-4.6*dt));
   }
 study.shake(camera);camera.lookAt(target);impact.camera(camera);}turnStage.projectTargets(g,camera,canvas,shell);$('reticle').hidden=true;hud.render(g,skillView(g),WEAPONS[g.weapon].name,lock);study.occlude(camera,g);traitView.update(g,camera);doodle.render(scene,camera,{active:isGyuwonLivingDoodleAct(referenceMini),time:referenceMini?.time??0});audit.sample(dt,{timestamp:now,active:ready&&!introGate.blocked&&mode==='playing'&&!document.hidden,phase:g.boss.phase,pattern:g.gyuwon.pattern,scale:viewportRenderScale(innerWidth,innerHeight,quality.scale)});
  }
  const loop=createBattleLoop({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),update:frame,onError:error=>{console.error('Gyuwon frame failed',error);close();}});startup.own('Gyuwon loop',()=>loop.dispose());const unbind=bindBattleSession(root,()=>({game:g,active:ready&&!introGate.blocked&&mode==='playing',intro:introGate.begin,pause:()=>pause.pause(),resume:()=>pause.resume(),close,...(diagnostics?{diagnostics:()=>({graphics:{...renderer.info.memory},calls:usesReference2d(g.gyuwon.years?.musical)?0:renderer.info.render.calls,triangles:usesReference2d(g.gyuwon.years?.musical)?0:renderer.info.render.triangles,
 camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,fov:camera.fov},
 view:study.stats(),reference2d:flatView.stats(),reference3d:turnStage.stats(),livingDoodle:doodle.stats(),renderMode:usesReference2d(g.gyuwon.years?.musical)?'canvas2d':'webgl',projectiles:playerProjectiles.stats(),quality:study.quality,frameMs:[...samples]})}:{})}));startup.own('Gyuwon session',unbind);hud.mode(mode);loop.start();return {close,dispose:close,get closed(){return closed;}};
 });
}
