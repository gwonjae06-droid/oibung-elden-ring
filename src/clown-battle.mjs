import {createPlayerProjectileView} from './player-projectile-view.mjs';
import {createCameraVisibility} from './camera-visibility.mjs';
import {resizeBattleViewport,viewportRenderScale} from './battle-viewport.mjs';
import {createFramePerformanceAudit} from './runtime/performance-audit.mjs';
import {createEncounterQuality} from './battle-quality-governor.mjs';
import {createFreeLookCamera} from './free-look-camera.mjs';
import {KWON_CAMERA_REFERENCE,matchedBossCamera} from './boss-camera-framing.mjs';
import {createBattleVisualWarmup} from './runtime/battle-visual-warmup.mjs';
import {createBossHitTraitView} from './boss-hit-trait-view.mjs';
import {consumeBattleGrace,installChargeInput} from './weapon-evolution.mjs';
import {actPlayer} from './player-combat.mjs';
import {reducedMotion} from './display-preferences.mjs';
import {runBattleStartup} from './runtime/battle-startup.mjs';
import {renderSharedHud} from './battle-hud.mjs';
import {createEventScope} from './runtime/event-scope.mjs';
import {createBattlePause,clearMovement,releaseCapturedPointer} from './battle-pause.mjs';
import {createBattleLoop} from './runtime/battle-loop.mjs';
import * as THREE from 'three';
import {createCinematicWorld} from './cinematic-graphics.mjs';
import {createCinematicImpactFx} from './cinematic-impact-fx.mjs';
import {createBossAtmosphere} from './boss-atmosphere.mjs';
import {createClownGame,clownView} from './clown-combat.mjs';
import {stepLargeClown as stepClown,CLOWN_SIZE,CLOWN_CAMERA} from './clown-size.mjs';
import {act,skillView,WEAPONS,clamp} from './combat.mjs';
import {buildPlayer,posePlayer,swayCape} from './models.mjs';
import {createClownActor} from './clown-ringmaster-actor.mjs';
import {createRingmasterMask} from './clown-ringmaster-mask.mjs';
import {createCircusTroupeView} from './clown-troupe-view.mjs';
import {clownBeastPose} from './clown-beast-pose.mjs';
import {createClownNightmareTheatre} from './clown-nightmare-theatre.mjs';
import {createClownLivingWorld} from './clown-nightmare-world.mjs';
import {createClownCircusStage} from './clown-radiant-circus.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {createClownHeadPool} from './clown-photo-performance.mjs';
import {bombPose,selectedWeapon} from './clown-visual-data.mjs';
import {createAudio} from './audio.mjs';
import {createRecoverySfx} from './recovery-sfx.mjs';
import {createPlayerHitFeedback} from './player-hit-feedback.mjs';
import {createCombatImpact} from './combat-impact.mjs';
import {clownDangerSpotlightCue,createClownDangerSpotlight} from './clown-danger-spotlight.mjs';
import {playBossCue} from './boss-cues.mjs';
import {createPlayerWeaponSfx} from './player-weapon-sfx.mjs';
import {bossFoleySpec} from './boss-foley-map.mjs';
import {createClownRecordedFoley} from './clown-stage-recordings.mjs';
import {bindBossName} from './boss-ui-chain.mjs';
import {createSkillFx} from './skill-fx.mjs';
import {createSkillAudio} from './skill-audio.mjs';
import {bindBattleSession} from './battle-session.mjs';
import {createBossIntroGate} from './boss-intro-gate.mjs';
import {cameraMovement} from './battle-input.mjs';
import {createBattleCleanup} from './runtime/battle-cleanup.mjs';
export function launchClownBattle({weapon='sword',practice=false,configure=()=>{},onClose=()=>{}}={}){
 return runBattleStartup(startup=>{
 if(document.getElementById('clown-battle'))return;weapon=selectedWeapon(weapon);
 const source=document.getElementById('arena'),originalBoss=document.getElementById('boss-hud');if(!source||!originalBoss)throw new Error('Missing original game UI');
 const d=document.createElement('dialog');startup.own('Clown dialog',()=>d.remove());d.id='clown-battle';d.style.cssText='position:fixed;inset:0;margin:0;padding:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;background:#050608;color:inherit';d.setAttribute('aria-label','광대 오슬우 전투');
 const host=document.createElement('div');host.style.height='100%';d.appendChild(host);
 const shadow=host.attachShadow({mode:'open'}),shell=source.cloneNode(true);shell.setAttribute('aria-label','플레이어와 광대 오슬우의 전투');shell.style.visibility='hidden';shell.querySelector('#menu')?.remove();shell.querySelectorAll('script,.bt-chain,.boss-name-bind').forEach(x=>x.remove());
 if(!shell.querySelector('#boss-hud'))shell.appendChild(originalBoss.cloneNode(true));shell.querySelectorAll('.bt-chain,.boss-name-bind').forEach(x=>x.remove());
 let ready=false;const base=document.createElement('link');startup.own('Clown stylesheet callback',()=>{base.onload=base.onerror=null;});base.rel='stylesheet';base.href=new URL('../style.css?v=ui-refine-20261107',import.meta.url).href;base.onload=()=>{ready=true;shell.style.visibility='';introGate.whenReady(!g.introControlled);};const skills=document.createElement('link');skills.rel='stylesheet';skills.href=new URL('../skills.css?v=ui-refine-20261107',import.meta.url).href;shadow.append(base,skills,shell);document.body.appendChild(d);
 const shutterFlash=document.createElement('div');shutterFlash.setAttribute('aria-hidden','true');shutterFlash.style.cssText='position:fixed;inset:0;z-index:12000;pointer-events:none;background:white;opacity:0';shell.appendChild(shutterFlash);let shutterLeft=0;
 const $=id=>shadow.getElementById(id),canvas=$('world');$('damage-layer').replaceChildren();$('notice').textContent='';$('notice').classList.remove('visible');$('hit-flash').classList.remove('visible');
 for(const id of['player-hud','boss-hud','controls'])$(id).hidden=false;const coarse=matchMedia('(pointer:coarse)').matches,reduced=reducedMotion();$('touch').hidden=!coarse;$('pause-screen').hidden=$('result').hidden=true;$('pause').disabled=false;
 $('boss-hud').querySelector('h2').textContent='광대 오슬우';$('boss-hud').setAttribute('aria-label','광대 오슬우 상태');shell.querySelector('.brand span').textContent='전투 실험실 · 02';$('quit').textContent='광대전 무기 선택으로';$('change').textContent='광대전 무기 재선택';$('retry').textContent='같은 무기로 광대전 재도전';
 let warmup=null;const renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse});const quality=createEncounterQuality({coarse}),audit=createFramePerformanceAudit({renderer,boss:'clown'});startup.own('Clown renderer',()=>renderer.dispose());renderer.setPixelRatio(1);renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.outputColorSpace=THREE.SRGBColorSpace;d.showModal();
 const eventScope=createEventScope(window);startup.own('Battle callbacks',()=>eventScope.dispose());
 const scene=new THREE.Scene();startup.own('Battle scene',()=>disposeScene(scene));scene.background=new THREE.Color(0x1e1a23);scene.fog=new THREE.Fog(0x2d2731,45,120);const camera=new THREE.PerspectiveCamera(KWON_CAMERA_REFERENCE.fov,1,.1,145);const hemisphere=new THREE.HemisphereLight(0xe6d6c4,0x282028,1.32);scene.add(hemisphere);
 const sun=new THREE.DirectionalLight(0xffdbbb,1.85);sun.position.set(8,20,15);sun.castShadow=!coarse;sun.shadow.mapSize.set(coarse?512:1024,coarse?512:1024);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:80});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;scene.add(sun);
 const circus=createClownCircusStage(scene,{coarse,reduced});startup.own('Clown radiant circus',()=>circus.dispose());
 const nightmare=createClownNightmareTheatre(scene,{coarse,reduced});startup.own('Clown impossible theatre',()=>nightmare.dispose());
 const livingWorld=createClownLivingWorld(scene,{coarse,reduced,keyLight:sun,ambientLight:hemisphere});startup.own('Clown living world',()=>livingWorld.dispose());
  const atmosphere=createBossAtmosphere(scene,{profile:'clown',coarse,reduced});startup.own('Clown silent atmosphere',()=>atmosphere.dispose());
 const actor=createClownActor({coarse});scene.add(actor.root);actor.root.scale.setScalar(CLOWN_SIZE);
 const troupeView=createCircusTroupeView(scene,{coarse,reduced,
  onActorCreated:performer=>cinematic.apply(performer,{actor:true})});startup.own('Living circus troupe',()=>troupeView.dispose());
 const P=buildPlayer(Object.keys(WEAPONS));scene.add(P.rig);
  const cinematic=createCinematicWorld(scene,renderer,{profile:'clown',coarse,reduced});startup.own('Clown cinematic PBR',()=>cinematic.dispose());
  cinematic.apply(circus.root);cinematic.apply(actor.root,{actor:true});cinematic.apply(P.rig,{actor:true});
  const contactFx=createCinematicImpactFx(scene,{profile:'clown',coarse,reduced});startup.own('Clown physical hit fragments',()=>contactFx.dispose());const traitView=createBossHitTraitView(scene,P.body,shell,{reduced});startup.own('Clown trait view',()=>traitView.dispose());for(const k of Object.keys(P.weaponRigs))P.weaponRigs[k].visible=k===weapon;
 const mark=new THREE.Mesh(new THREE.RingGeometry(.45,.55,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x89ffd0,depthTest:false,transparent:true,opacity:.8}));mark.renderOrder=102;scene.add(mark);
 const contexts=[],makeAudio=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;const c=new C();contexts.push(c);if(startup.pending)startup.own('Battle audio context',()=>c.close?.());return c;};
 const playerProjectiles=createPlayerProjectileView(scene);startup.own('Clown crafted projectiles',()=>playerProjectiles.dispose());
 const fx=createSkillFx(scene,reduced);startup.own('Clown effects',()=>fx.dispose());
 const audio=createAudio(makeAudio);startup.own('Clown audio',()=>audio.setEnabled(false));const recoverySfx=createRecoverySfx();startup.own('Clown heal sfx',()=>recoverySfx.dispose());const damageFeedback=createPlayerHitFeedback(shell);startup.own('Clown hit visuals',()=>damageFeedback.dispose());const impact=createCombatImpact({shell,root:shadow,boss:'clown',reduced});startup.own('Clown impacts',()=>impact.dispose());const playerWeaponSfx=createPlayerWeaponSfx();startup.own('Clown player weapon SFX',()=>playerWeaponSfx.dispose());const skillAudio=createSkillAudio(makeAudio);startup.own('Clown skill audio',()=>skillAudio.setEnabled(false));
 const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch(e){return false;}};
 const recordedFoley=createClownRecordedFoley({muted});startup.own('Recorded circus Foley',()=>recordedFoley.dispose());
 function soundState(){const on=!muted();audio.setEnabled(on);skillAudio.setEnabled(on);$('sound').textContent=on?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(on));}soundState();
 $('theme').onclick=()=>document.getElementById('theme')?.click();$('sound').onclick=()=>{document.getElementById('sound')?.click();soundState();};
 // Prewarm small photo-head meshes and faces before the first shutter.
 // Head bombs reuse these instances across attacks and retries.
 const headPool=createClownHeadPool(()=>{
  const head=createRingmasterMask({projectile:true});
  head.prewarmTexture(renderer).catch(()=>{});
  return head;
 },{prewarm:2});
 startup.own('Clown photo head pool',()=>headPool.dispose());
 const zones=new Map(),bombs=new Map(),shots=new Map(),particles=[],mats=[0xffcc50,0xc12e49,0x75c9ec,0x1a121a,0x8a0c12].map(color=>startup.resource('Particle material',new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}))),confettiGeo=startup.resource('Confetti geometry',new THREE.BoxGeometry(.12,.04,.25)),smokeGeo=startup.resource('Smoke geometry',new THREE.SphereGeometry(.4,8,6)),bloodGeo=startup.resource('Blood geometry',new THREE.SphereGeometry(.07,5,4));
 const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.08:.2;if(i)star.lineTo(Math.sin(a)*r,Math.cos(a)*r);else star.moveTo(Math.sin(a)*r,Math.cos(a)*r);}star.closePath();const starGeo=startup.resource('Star geometry',new THREE.ShapeGeometry(star));
 function burst(x,y,z,blood=false){for(let i=0;i<(reduced?8:blood?10:24);i++){if(particles.length>=160)scene.remove(particles.shift().m);const m=new THREE.Mesh(blood?bloodGeo:i>19?smokeGeo:i%3===0?starGeo:confettiGeo,mats[blood?4:i%4]);m.position.set(x,y,z);scene.add(m);particles.push({m,vx:(Math.random()-.5)*8,vy:2+Math.random()*6,vz:(Math.random()-.5)*8,life:blood?.7:1.4});}}
 function clearMap(map){for(const o of map.values()){scene.remove(o.group||o);disposeScene(o.group||o);}map.clear();}
 function releaseBombVisual(o){scene.remove(o.group);if(o.setMorph)headPool.release(o);else disposeScene(o.group);}
 function clearBombs(){for(const o of bombs.values())releaseBombVisual(o);bombs.clear();}
 let g=createClownGame(weapon,{register:false}),paused=false,closed=false,lock=true,yaw=Math.PI,pitch=KWON_CAMERA_REFERENCE.pitch,zoom=0,queued=null,width=0,height=0,shake=0,noticeTimer=0,drag=false,winAt=null,winBinding=null;
  const introGate=createBossIntroGate(document,shell,'clown',{ready:()=>ready&&!closed&&warmup.ready,focus:()=>canvas.focus({preventScroll:true}),reduced});
 startup.own('Invalidate battle',()=>{closed=true;});
 const aim=new THREE.Vector3(),camPos=new THREE.Vector3(),camTarget=new THREE.Vector3(),screen=new THREE.Vector3(),keys=new Set(),stick={x:0,z:0};
 function notice(_text){/* In-fight instructions and pattern names are forbidden. */}
 function floatText(text,x,y,z,player=false){screen.set(x,y,z).project(camera);if(Math.abs(screen.z)>1)return;const el=document.createElement('span');el.className='damage-number'+(player?' player':'');el.textContent=text;el.style.left=(screen.x*.5+.5)*canvas.clientWidth+'px';el.style.top=(-screen.y*.5+.5)*canvas.clientHeight+'px';$('damage-layer').appendChild(el);eventScope.setTimeout(()=>el.remove(),850);}
 function reset(replayIntro=false){recordedFoley.stop();nightmare.reset();livingWorld.reset();shutterLeft=0;shutterFlash.style.opacity='0';introGate.arm();playerProjectiles.clear();atmosphere.reset();contactFx.reset();circus.reset();traitView.clear();recoverySfx.clear();damageFeedback.clear();impact.reset();playerWeaponSfx.clear();winBinding?.restore();winBinding=null;winAt=null;$('boss-hud').hidden=false;g=createClownGame(weapon,{register:false});configure(g);queued=null;paused=false;keys.clear();stick.x=stick.z=0;clearMap(zones);clearBombs();clearMap(shots);fx.clear();for(const p of particles)scene.remove(p.m);particles.length=0;$('result').hidden=$('pause-screen').hidden=true;$('pause').textContent='일시정지';$('damage-layer').replaceChildren();camera.position.set(0,8,21);aim.set(0,CLOWN_CAMERA.target,5);freeLook.release();lock=true;yaw=Math.PI;pitch=KWON_CAMERA_REFERENCE.pitch;zoom=0;canvas.focus();if(replayIntro)introGate.begin();}
 let dragPointer=null;
 const freeLook=createFreeLookCamera({canvas,coarse,enabled:()=>ready&&!introGate.blocked&&!paused&&!closed&&g.status==='playing'&&!lock,
  getAngles:()=>({yaw,pitch}),setAngles:next=>{yaw=next.yaw;pitch=next.pitch;},minPitch:.08,maxPitch:1.18});
 startup.own('Clown free-look mouse input',()=>freeLook.dispose());
 function input(){return cameraMovement(keys,stick,yaw,lock);}
 function request(type){if(!ready||introGate.blocked||paused||g.status!=='playing')return;if(type==='lock'){lock=!lock;if(lock)freeLook.release();else freeLook.capture();return;}soundState();const p=g.player,b=g.boss,v=input();if(!p.action){if(lock||Math.hypot(b.x-p.x,b.z-p.z)<7)p.yaw=Math.atan2(b.x-p.x,b.z-p.z);else if(!v.x&&!v.z)p.yaw=yaw;}if(type==='skill'){act(g,type);return;}if(type==='heal'){if(act(g,type))recoverySfx.event({type:'heal-start'});return;}if(type==='roll'){const moving=Math.hypot(v.x,v.z)>.05;if(act(g,'roll')){g.player.action.yaw=moving?Math.atan2(v.x,v.z):p.yaw+Math.PI;queued=null;}return;}queued={type,until:performance.now()+250};}
 const pauseControl=createBattlePause({isPlaying:()=>!closed&&!paused&&g.status==='playing',isPaused:()=>!closed&&paused&&g.status==='playing',setPaused:value=>{paused=value;$('pause-screen').hidden=!value;$('pause').textContent=value?'전투 계속':'일시정지';},clearInput:()=>{clearMovement(keys,stick);if(g.player.action?.kind==='charging')g.player.action=null;queued=null;freeLook.release();drag=false;releaseCapturedPointer(canvas,dragPointer);dragPointer=null;releaseCapturedPointer($('stick'),stickId);stickId=null;$('thumb').style.transform='';},onPause:()=>{recoverySfx.clear();damageFeedback.clear();playerWeaponSfx.clear();$('resume').focus();},onResume:()=>{canvas.focus();if(!lock)freeLook.capture();}});
 function toggle(){return pauseControl.toggle();}
 eventScope.listen(d,'keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();if(!ready)close();else toggle();return;}if(e.code==='KeyQ'){if(!e.repeat)request('lock');return;}const a={KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal'}[e.code];if(a){e.preventDefault();if(!e.repeat)request(a);}else keys.add(e.code);});eventScope.listen(d,'keyup',e=>{e.stopPropagation();keys.delete(e.code);});eventScope.listen(d,'cancel',e=>{e.preventDefault();toggle();});
 eventScope.listen(canvas,'contextmenu',e=>e.preventDefault());eventScope.listen(canvas,'auxclick',e=>e.preventDefault());eventScope.listen(canvas,'pointerdown',e=>{if(e.pointerType!=='mouse')return;if(e.button===0)request('light');if(e.button===2)request('skill');if(e.button===1){e.preventDefault();drag=true;dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}});eventScope.listen(canvas,'pointermove',e=>{if(drag&&lock)pitch=clamp(pitch+e.movementY*.004,.15,.85);});eventScope.listen(canvas,'pointerup',()=>{drag=false;});eventScope.listen(canvas,'pointercancel',()=>{drag=false;});eventScope.listen(canvas,'wheel',e=>{zoom=clamp(zoom+Math.sign(e.deltaY),-4,10);},{passive:true});
 for(const b of shadow.querySelectorAll('[data-act]'))b.onpointerdown=e=>{e.preventDefault();request(b.dataset.act);};
 let stickId=null,cx=0,cy=0;const moveStick=e=>{let x=e.clientX-cx,z=cy-e.clientY;const n=Math.max(1,Math.hypot(x,z)/40);x/=n;z/=n;stick.x=x/40;stick.z=z/40;$('thumb').style.transform='translate('+x+'px,'+(-z)+'px)';};$('stick').onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;$('stick').setPointerCapture(stickId);const r=$('stick').getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;moveStick(e);};$('stick').onpointermove=e=>{if(e.pointerId===stickId)moveStick(e);};$('stick').onpointerup=$('stick').onpointercancel=()=>{stickId=null;stick.x=stick.z=0;$('thumb').style.transform='';};
 const pauseOnBlur=()=>{if(!paused&&g.status==='playing')toggle();};eventScope.listen(window,'blur',pauseOnBlur);const visibility=()=>{if(document.hidden)pauseOnBlur();};eventScope.listen(document,'visibilitychange',visibility);
 $('pause').onclick=toggle;$('resume').onclick=toggle;$('quit').onclick=close;$('retry').onclick=()=>{soundState();reset(true);};$('change').onclick=close;
 base.onerror=()=>{
  // No CSS means no in-battle messaging: show a standalone, inline-styled exit.
  ready=false;introGate.cancel();shell.style.visibility='hidden';
  const failure=document.createElement('section');failure.setAttribute('role','alert');
  failure.style.cssText='position:fixed;inset:0;z-index:15000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#090b12;color:#fff3df;padding:24px;text-align:center;font:600 18px sans-serif';
  const message=document.createElement('p');message.textContent='오슬우 전투 화면을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.';
  const backButton=document.createElement('button');backButton.type='button';backButton.textContent='전투 화면 닫기';
  backButton.style.cssText='cursor:pointer;background:#d9ae67;color:#141015;border:0;border-radius:8px;padding:14px 28px;font:700 16px sans-serif';
  failure.append(message,backButton);shadow.appendChild(failure);
  eventScope.listen(backButton,'click',()=>close());backButton.focus();
 };
 function close(){return cleanupClose();}
 const cleanupClose=createBattleCleanup(()=>[
  ['Stop clown battle',()=>{closed=true;freeLook.dispose();warmup?.dispose();introGate.cancel();unbindSession();base.onload=base.onerror=null;winBinding?.restore();battleLoop.dispose();eventScope.clearTimeout(noticeTimer);}],
  ['Clown callbacks',()=>eventScope.dispose()],['Clown trait view',()=>traitView.dispose()],
  ['Clown effects',()=>fx.dispose()],['Clown crafted projectiles',()=>playerProjectiles.dispose()],
  ['Clown audio',()=>{recordedFoley.dispose();playerWeaponSfx.dispose();audio.setEnabled(false);skillAudio.setEnabled(false);}],
  ...contexts.map((context,i)=>['Clown audio context '+i,()=>context.close?.()]),
  ['Clown transient meshes',()=>{clearMap(zones);clearBombs();clearMap(shots);headPool.dispose();}],
  ['Living circus troupe',()=>troupeView.dispose()],['Clown radiant circus',()=>circus.dispose()],['Clown living world',()=>livingWorld.dispose()],['Clown scene',()=>disposeScene(scene)],
  ['Clown particles',()=>{confettiGeo.dispose();smokeGeo.dispose();bloodGeo.dispose();starGeo.dispose();for(const m of mats)m.dispose();}],
  ['Clown renderer',()=>renderer.dispose()],
  ['Clown dialog',()=>{d.close();d.remove();}],
  ['Clown close callback',()=>onClose({weapon,status:g.status,practice})]
 ]);
 function releaseZone(group){scene.remove(group);disposeScene(group);}
 function sync(dt){
  const b=g.boss,p=g.player,c=g.clown;actor.update(g,impact.frozen?0:dt);troupeView.update(g,dt);actor.root.scale.setScalar(CLOWN_SIZE);actor.root.position.y*=CLOWN_SIZE;actor.root.rotation.x=actor.root.rotation.z=0;impact.bossPose(actor.root);P.rig.position.set(p.x,0,p.z);P.rig.rotation.y=p.action?.yaw??p.yaw;const v=input(),walk=posePlayer(P,g.time*7,p.action?0:Math.hypot(v.x,v.z)*4.7);swayCape(P,g.time,0);P.body.position.y=1+walk.bob;P.body.rotation.x=0;P.pivot.rotation.x=0;const a=p.action;if(a&&(a.kind==='attack'||a.kind==='skill')){P.arms.R.rotation.x=0;P.pivot.rotation.x=-1.5+Math.sin(clamp(a.t/a.total,0,1)*Math.PI)*2.9;}else if(a?.kind==='charging'){P.pivot.rotation.x=-1.4;P.body.rotation.x=-.12;}else if(a?.kind==='roll')P.body.rotation.x=a.t/a.total*Math.PI*2;else if(a?.kind==='hurt')P.body.rotation.x=-.3;P.rig.rotation.x=P.rig.rotation.z=0;impact.playerPose(P.rig);mark.position.set(p.x,.06,p.z);
  const live=new Set();for(const z of c.zones){
    if(!clownDangerSpotlightCue(z))continue;
    live.add(z.id);let m=zones.get(z.id);
    if(!m){m=createClownDangerSpotlight(THREE,scene,z,{reduced});zones.set(z.id,m);}
    m.userData.spotlightUpdate(z);
   }for(const[id,m]of zones)if(!live.has(id)){releaseZone(m);zones.delete(id);}
  const ids=new Set();for(const q of c.bombs){ids.add(q.id);let o=bombs.get(q.id);if(!o){o=q.kind==='ball'?{group:new THREE.Mesh(new THREE.SphereGeometry(.45,14,10),new THREE.MeshStandardMaterial({color:0xe8c44d}))}:headPool.acquire();scene.add(o.group);bombs.set(q.id,o);}const v=bombPose(q,b.phase);o.group.visible=q.t<q.warn;o.group.position.set(v.x,v.y,v.z);o.group.rotation.z=v.spin;if(o.setMorph&&o.group.visible)o.setMorph({inflate:v.inflate,stretch:v.stretch,jaw:v.final,bulge:.2,wobble:.2},g.time);}for(const[id,o]of bombs)if(!ids.has(id)){releaseBombVisual(o);bombs.delete(id);}
  playerProjectiles.update(g);
  nightmare.update(g,dt);livingWorld.update(g,dt);circus.update(g,dt);const s=skillView(g),V=clownView(g);renderSharedHud(shadow,g,s,{weaponName:WEAPONS[weapon].name,lockLabel:lock?'록온 켜짐 · Q':'록온 꺼짐 · Q'});$('phase-label').textContent=V.sub;$('boss-action').textContent='';
  // The huge-ball transformation is retired: do not pull camera away
   // from the new grounded human-scale horror performance.
   const big=(b.state==='transition'?.55:0)*CLOWN_SIZE,alpha=1-Math.exp(-5*dt);
   if(lock)yaw+=Math.atan2(Math.sin(Math.atan2(b.x-p.x,b.z-p.z)-yaw),Math.cos(Math.atan2(b.x-p.x,b.z-p.z)-yaw))*Math.min(1,dt*7);
   const frame=matchedBossCamera('clown',{
    player:p,boss:b,yaw,pitch,zoom,aspect:camera.aspect,locked:lock,
    headHeight:clownBeastPose(g).active?2.8:4.5,
    extraDistance:big // Maintain the transformation/inflation reveal.
   });
   camPos.set(frame.position.x,frame.position.y+big*.2,frame.position.z);
   camTarget.set(frame.focus.x,frame.focus.y+big*.2,frame.focus.z);camera.position.lerp(camPos,alpha);aim.lerp(camTarget,alpha);if(!reduced&&dt>0){shake=Math.max(0,shake-dt);camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;}camera.lookAt(aim);impact.camera(camera);screen.set(b.x,clownBeastPose(g).active?2.9:4.8,b.z).project(camera);$('reticle').hidden=!lock||Math.abs(screen.z)>1||g.status!=='playing';$('reticle').style.left=((screen.x*.5+.5)*canvas.clientWidth-6)+'px';$('reticle').style.top=((-screen.y*.5+.5)*canvas.clientHeight-6)+'px';
 }
 function events(){for(const e of g.events){nightmare.event(e);livingWorld.event(e);atmosphere.event(e,g);circus.event(e,g);contactFx.event(e,g);if(e.type==='victory')playBossCue('die');if(e.type==='clown-shutter')shutterLeft=.19;recoverySfx.event(e);damageFeedback.hit(e);impact.event(e,g);playerWeaponSfx.event(e,g);if(['heal-start','healed','skill-heal','death'].includes(e.type))playerWeaponSfx.clear();fx.event(e,g);if(e.type==='boss-hit'){burst(g.boss.x,1.8,g.boss.z,true);floatText(String(e.amount),g.boss.x,3,g.boss.z);g.clown.flash=.12;shake=e.big?.2:.06;}else if(e.type==='player-hit'){burst(g.player.x,1.2,g.player.z,true);floatText('-'+e.amount,g.player.x,2.6,g.player.z,true);shake=.2;$('hit-flash').classList.add('visible');eventScope.setTimeout(()=>$('hit-flash')?.classList.remove('visible'),140);}else if(e.type==='clown-blast')burst(e.x,.8,e.z);else if(e.type==='clown-troupe-hit')burst(e.x,1.2,e.z,false);
   const recorded=bossFoleySpec(e,g);
    if(recorded&&!muted())recordedFoley.play(recorded);
    if(muted()||recorded)continue;const names={roll:'roll',dodge:'dodge',phase:'phase',victory:'victory',death:'death','player-hit':'hit-player','clown-blast':'boss-slam','clown-clap':'boss-slam','clown-dash':'boss-thrust','clown-inflate':'tele-whirl','clown-throw':'swing-cards','clown-juggle':'swing-cards','clown-roll':'boss-whirl','clown-shove':'roll','clown-bounce':'boss-slam'};if(e.type==='skill-heal'||e.type==='heal-start'){}else if(!['boss-hit','shot','swing','skill-cast','skill-stun','skill-ready','skill-pierce'].includes(e.type)&&names[e.type])audio.play(names[e.type]);
  }g.events.length=0;
 }
 function frame(now,dt,realDt=dt){if(closed||!warmup.ready)return;if(ready&&!introGate.blocked&&!paused&&g.status==='playing'&&!consumeBattleGrace(g,dt)){const v=input();if(queued){if(now>queued.until)queued=null;else if(!g.player.action&&act(g,queued.type)){if(queued.type==='roll'&&!v.x&&!v.z)g.player.action.yaw=g.player.yaw+Math.PI;queued=null;}}for(let left=dt;left>1e-6;){const h=Math.min(left,1/60);stepClown(g,h,v);left-=h;}}events();const h=ready&&!paused?dt:0;shutterLeft=Math.max(0,shutterLeft-h);shutterFlash.style.opacity=shutterLeft>0?String(Math.min(1,shutterLeft/.19)*.96):'0';impact.update(h);recordedFoley.update(h);cinematic.update(g,h);contactFx.update(h);atmosphere.update(g,h);g.clown.flash=Math.max(0,(g.clown.flash||0)-h);for(let i=particles.length-1;i>=0;i--){const o=particles[i];o.life-=h;o.vy-=9*h;o.m.position.x+=o.vx*h;o.m.position.y+=o.vy*h;o.m.position.z+=o.vz*h;o.m.rotation.x+=h*4;if(o.life<=0){scene.remove(o.m);particles.splice(i,1);}}sync(h);fx.update(h,g);
  if(g.status!=='playing')freeLook.release();
   if(g.status==='won'){if(winAt===null){winAt=now;winBinding=bindBossName($('boss-hud'));}winBinding?.update(clamp((now-winAt)/900,0,1),clamp((now-winAt-900)/900,0,1));}
  if(g.status!=='playing'&&$('result').hidden&&(g.status!=='won'||now-winAt>=1800)){$('result').hidden=false;$('result-kicker').textContent=g.status==='won'?'승리':'패배';$('result-title').textContent=g.status==='won'?'광대 오슬우 토벌':'쓰러졌습니다';$('result-text').textContent=g.status==='won'?'끝나지 않던 공연이 마침내 끝났습니다.':'광대전부터 다시 도전할 수 있습니다.';$('result-stats').textContent='적중 '+g.stats.hits+'회 · 회피 '+g.stats.dodges+'회 · '+g.time.toFixed(1)+'초';$('retry').focus();if(g.status==='won'&&!practice){try{sessionStorage.setItem('oibung.clown.clear','1');}catch(e){}}$('result').dispatchEvent(new Event('oibung:result-ready'));}
  quality.sample(realDt,ready&&!introGate.blocked&&!paused&&g.status==='playing'&&!document.hidden);const viewport=resizeBattleViewport(renderer,camera,canvas,quality.scale);width=viewport.width;height=viewport.height;atmosphere.cameraReaction(camera);traitView.update(g,camera);renderer.render(scene,camera);audit.sample(dt,{timestamp:now,active:ready&&!introGate.blocked&&!paused&&g.status==='playing'&&!document.hidden,phase:g.boss.phase,pattern:g.clown.name,scale:viewportRenderScale(innerWidth,innerHeight,quality.scale)});
 }
 const cameraVisibility=createCameraVisibility(scene,{roots:[circus.root,atmosphere.root,livingWorld.root],targets:()=>[{x:g.player.x,y:1.4,z:g.player.z},{x:g.boss.x,y:clownBeastPose(g).active?2.8:4.5,z:g.boss.z,radius:5}]});startup.own('Clown camera visibility',()=>cameraVisibility.dispose());eventScope.add(()=>cameraVisibility.dispose());
 installChargeInput(shadow,{getGame:()=>g,isActive:()=>ready&&!introGate.blocked&&!paused&&g.status==='playing',listen:(...args)=>eventScope.listen(...args),act:actPlayer});eventScope.ownHandlers(shadow);eventScope.add(()=>{clearMovement(keys,stick);queued=null;drag=false;releaseCapturedPointer(canvas,dragPointer);releaseCapturedPointer($('stick'),stickId);});eventScope.listen(window,'pagehide',event=>{if(!event.persisted)close();});reset();warmup=createBattleVisualWarmup({renderer,scene,camera,assets:[actor.head.ready,headPool.ready],container:d});startup.own('Clown visual warmup',()=>warmup.dispose());const battleLoop=createBattleLoop({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),update:frame,onError:error=>{console.error('Battle frame failed',error);close();}});startup.own('Battle loop',()=>battleLoop.dispose());const unbindSession=bindBattleSession(shadow,()=>({game:g,active:ready&&!introGate.blocked&&!paused&&g.status==='playing',intro:introGate.begin,pause:()=>pauseControl.pause(),resume:()=>pauseControl.resume(),close}));startup.own('Battle session',unbindSession);battleLoop.start();resizeBattleViewport(renderer,camera,canvas,quality.scale);warmup.start().then(()=>{if(!closed)introGate.whenReady(!g.introControlled);});return {close,dispose:close,get closed(){return closed;}};
 });
}
