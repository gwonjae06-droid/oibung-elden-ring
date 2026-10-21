import * as THREE from 'three';
import {createClownGame,stepClown,clownView} from './clown-combat.mjs';
import {act,skillView,WEAPONS,clamp} from './combat.mjs';
import {buildPlayer,posePlayer,swayCape} from './models.mjs';
import {createClownActor,disposeScene} from './clown-actor.mjs';
import {createClownHead} from './clown-head.mjs';
import {bombPose,selectedWeapon} from './clown-visual-data.mjs';
import {createAudio} from './audio.mjs';
import {createSkillFx} from './skill-fx.mjs';
import {createSkillAudio} from './skill-audio.mjs';

export function launchClownBattle({weapon='sword',practice=false,onClose=()=>{}}={}){
 if(document.getElementById('clown-battle'))return;
 weapon=selectedWeapon(weapon);
 const d=document.createElement('dialog');d.id='clown-battle';d.setAttribute('aria-label','광대 오슬우 1·2페이즈 전투');
 d.innerHTML='<style>#clown-battle{inset:0;margin:0;padding:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;background:#100b12;color:#ffe9cc;font:14px system-ui;overflow:hidden}#clown-battle canvas{width:100%;height:100%;display:block;touch-action:none}#clown-battle [hidden]{display:none!important}#clown-battle button{padding:9px;background:#291d29;color:#ffe9cc;border:1px solid #b88b58}#clown-battle .cb-player{position:absolute;top:3%;left:3%;max-width:70%;background:#17121ad0}#clown-battle .cb-pause{position:absolute;right:3%;top:3%}#clown-battle .cb-boss{position:absolute;left:8%;right:8%;bottom:6%;text-align:center}.cb-meter{height:12px;background:#241b21}.cb-fill{height:100%;background:#be3144;transform-origin:left}#clown-battle .cb-end{position:absolute;inset:0;display:grid;place-content:center;text-align:center;background:#0b070ce8;gap:12px}#clown-battle .cb-touch{position:absolute;bottom:25%;left:2%;right:2%;display:none;justify-content:space-between;pointer-events:none}#clown-battle .cb-touch div{pointer-events:auto;display:grid;grid-template-columns:repeat(3,42px)}#clown-battle .cb-touch button{touch-action:none;padding:10px 2px}@media(pointer:coarse){#clown-battle .cb-touch{display:flex}#clown-battle .cb-player{font-size:11px}}</style><canvas tabindex="0" aria-label="WASD 이동 J 공격 L 또는 우클릭 스킬 Space 회피 E 회복 Q 록온 Esc 일시정지"></canvas><div class="cb-player"></div><button class="cb-pause">일시정지</button><section class="cb-boss"><small class="cb-sub"></small><h2>광대 오슬우</h2><div class="cb-meter" role="progressbar" aria-label="보스 생명" aria-valuemin="0" aria-valuemax="2000"><div class="cb-fill"></div></div><p class="cb-action"></p></section><div class="cb-touch"><div></div><div></div></div><section class="cb-end" hidden><h2></h2><p></p><button class="cb-retry">광대전 재도전</button><button class="cb-choice">광대전 무기 재선택</button></section>';
 document.body.appendChild(d);
 const $=s=>d.querySelector(s),canvas=$('canvas'),ui=Object.fromEntries(['player','pause','sub','action','fill','meter','end','retry','choice'].map(k=>[k,$('.cb-'+k)])),endTitle=$('.cb-end h2'),endText=$('.cb-end p');let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));d.showModal();}catch(e){renderer?.dispose();d.remove();throw e;}
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x100b12);scene.fog=new THREE.Fog(0x100b12,35,80);
 const camera=new THREE.PerspectiveCamera(58,1,.1,120);scene.add(new THREE.HemisphereLight(0xffead2,0x211424,1.3));const sun=new THREE.DirectionalLight(0xffd1a0,2.5);sun.position.set(8,20,15);scene.add(sun);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(25,64),new THREE.MeshStandardMaterial({color:0x312833,roughness:.85}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 const border=new THREE.Mesh(new THREE.RingGeometry(22.8,23,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xa27e49,side:THREE.DoubleSide}));border.position.y=.02;scene.add(border);
 const actor=createClownActor();scene.add(actor.root);
 const P=buildPlayer(Object.keys(WEAPONS));scene.add(P.rig);for(const k of Object.keys(P.weaponRigs))P.weaponRigs[k].visible=k===weapon;
 const mark=new THREE.Mesh(new THREE.RingGeometry(.45,.55,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x89ffd0,depthTest:false,transparent:true,opacity:.8}));mark.renderOrder=102;scene.add(mark);
 const contexts=[],makeAudio=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;const c=new C();contexts.push(c);return c;},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,fx=createSkillFx(scene,reduced),audio=createAudio(makeAudio),skillAudio=createSkillAudio(makeAudio);
 const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch(e){return false;}};
 const unlock=()=>{if(!muted()){audio.setEnabled(true);skillAudio.setEnabled(true);}};unlock();
 const zones=new Map(),bombs=new Map(),shots=new Map(),particles=[],mats=[0xffcc50,0xc12e49,0x75c9ec,0x1a121a,0x8a0c12].map(color=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9})),confettiGeo=new THREE.BoxGeometry(.12,.04,.25),smokeGeo=new THREE.SphereGeometry(.4,8,6),bloodGeo=new THREE.SphereGeometry(.07,5,4);
 const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.08:.2,x=Math.sin(a)*r,y=Math.cos(a)*r;if(i)starShape.lineTo(x,y);else starShape.moveTo(x,y);}starShape.closePath();const starGeo=new THREE.ShapeGeometry(starShape);
 function burst(x,z,black=false){for(let i=0;i<24;i++){if(particles.length>=180){const old=particles.shift();scene.remove(old.m);}const m=new THREE.Mesh(i>19?smokeGeo:i%3===0?starGeo:confettiGeo,mats[black?3:i%4]);m.position.set(x,.5+Math.random()*2,z);scene.add(m);particles.push({m,vx:(Math.random()-.5)*9,vy:2+Math.random()*7,vz:(Math.random()-.5)*9,life:1.5});}}
 function clearMap(map){for(const m of map.values()){scene.remove(m.group||m);disposeScene(m.group||m);}map.clear();}
 function impact(x,y,z){for(let i=0;i<10;i++){if(particles.length>=180)scene.remove(particles.shift().m);const m=new THREE.Mesh(bloodGeo,mats[4]);m.position.set(x,y,z);scene.add(m);particles.push({m,vx:(Math.random()-.5)*6,vy:Math.random()*5,vz:(Math.random()-.5)*6,life:.7});}}
 const cameraAim=new THREE.Vector3(0,4,5),cameraPos=new THREE.Vector3(),cameraTarget=new THREE.Vector3();
 let g=createClownGame(weapon),paused=false,closed=false,last=performance.now(),raf=0,lock=true,zoom=0,queued=null,width=0,height=0,transitionBurst=false,shake=0;
 const keys=new Set();
 function reset(){g=createClownGame(weapon);queued=null;paused=false;keys.clear();clearMap(zones);clearMap(bombs);clearMap(shots);fx.clear();for(const p of particles)scene.remove(p.m);particles.length=0;transitionBurst=false;ui.end.hidden=true;ui.pause.textContent='일시정지';camera.position.set(0,10,29);cameraAim.set(0,4,5);canvas.focus();}
 function input(){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);const n=Math.max(1,Math.hypot(x,z));return {x:x/n,z:z/n,lock};}
 function request(type){if(paused||g.status!=='playing')return;unlock();const p=g.player,b=g.boss;if(!p.action&&(lock||!input().x&&!input().z))p.yaw=Math.atan2(b.x-p.x,b.z-p.z);if(type==='skill'){act(g,type);return;}queued={type,until:performance.now()+250};}
 function toggle(){if(g.status!=='playing')return;paused=!paused;keys.clear();ui.pause.textContent=paused?'전투 계속':'일시정지';}
 d.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();toggle();return;}if(e.code==='KeyQ'){if(!e.repeat)lock=!lock;return;}const a={KeyJ:'light',KeyL:'skill',Space:'roll',KeyE:'heal'}[e.code];if(a){e.preventDefault();if(!e.repeat)request(a);}else keys.add(e.code);});
 d.addEventListener('keyup',e=>{e.stopPropagation();keys.delete(e.code);});d.addEventListener('cancel',e=>{e.preventDefault();toggle();});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){if(e.button===0)request('light');if(e.button===2)request('skill');}});canvas.addEventListener('wheel',e=>{zoom=clamp(zoom+Math.sign(e.deltaY),-4,10);},{passive:true});
 for(const[k,label]of Object.entries({KeyA:'←',KeyW:'↑',KeyD:'→',KeyS:'↓'})){const b=document.createElement('button');b.dataset.key=k;b.textContent=label;$('.cb-touch div').appendChild(b);}
 for(const[k,label]of Object.entries({light:'공격',roll:'회피',skill:'스킬',heal:'회복'})){const b=document.createElement('button');b.dataset.act=k;b.textContent=label;$('.cb-touch div:last-child').appendChild(b);}
 for(const b of d.querySelectorAll('[data-act]'))b.onpointerdown=e=>{e.preventDefault();request(b.dataset.act);};
 for(const b of d.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);}
 const pauseOnBlur=()=>{keys.clear();if(g.status==='playing'){paused=true;ui.pause.textContent='전투 계속';}};window.addEventListener('blur',pauseOnBlur);const visibility=()=>{if(document.hidden)pauseOnBlur();};document.addEventListener('visibilitychange',visibility);
 ui.pause.onclick=()=>{unlock();toggle();};ui.retry.onclick=()=>{unlock();reset();};ui.choice.onclick=close;
 function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);window.removeEventListener('blur',pauseOnBlur);document.removeEventListener('visibilitychange',visibility);audio.setEnabled(false);skillAudio.setEnabled(false);for(const c of contexts)c.close?.();clearMap(zones);clearMap(bombs);clearMap(shots);disposeScene(scene);confettiGeo.dispose();smokeGeo.dispose();bloodGeo.dispose();starGeo.dispose();for(const m of mats)m.dispose();renderer.dispose();d.close();d.remove();onClose({weapon,status:g.status,practice});}
 function zoneMesh(z){const mat=new THREE.MeshBasicMaterial({color:z.kind==='push'?0x4da6ff:z.visual?0xffc34a:0xff3929,transparent:true,opacity:.2,depthTest:false,depthWrite:false,side:THREE.DoubleSide});let geo;
 if(z.shape==='lane')geo=new THREE.BoxGeometry(z.w,.02,z.len).translate(0,0,z.len/2);
 else if(z.shape==='cone'){const s=new THREE.Shape();s.moveTo(0,0);for(let i=0;i<=40;i++){const a=-z.half+z.half*2*i/40;s.lineTo(Math.sin(a)*z.r,Math.cos(a)*z.r);}s.lineTo(0,0);geo=new THREE.ShapeGeometry(s).rotateX(Math.PI/2);}
 else geo=new THREE.CircleGeometry(z.r,48).rotateX(-Math.PI/2);
 const m=new THREE.Mesh(geo,mat);m.renderOrder=100;scene.add(m);return m;
 }
 function sync(dt){
  const b=g.boss,p=g.player,c=g.clown;actor.update(g);
  P.rig.position.set(p.x,0,p.z);P.rig.rotation.y=p.action?.yaw??p.yaw;const move=input(),w=posePlayer(P,g.time*7,p.action?0:Math.hypot(move.x,move.z)*4.7);swayCape(P,g.time,0);P.body.position.y=1+w.bob;P.body.rotation.x=0;P.pivot.rotation.x=0;
  const a=p.action;if(a&&(a.kind==='attack'||a.kind==='skill')){P.arms.R.rotation.x=0;P.pivot.rotation.x=-1.5+Math.sin(clamp(a.t/a.total,0,1)*Math.PI)*2.9;}else if(a?.kind==='roll'){P.body.rotation.x=a.t/a.total*Math.PI*2;}else if(a?.kind==='hurt')P.body.rotation.x=-.3;
  mark.position.set(p.x,.06,p.z);
  const live=new Set();for(const z of c.zones){live.add(z.id);let m=zones.get(z.id);if(!m){m=zoneMesh(z);zones.set(z.id,m);}m.position.set(z.x,.05,z.z);m.rotation.y=z.yaw||0;m.material.opacity=z.state==='burst'?.85:.16+.5*clamp(z.age/z.warn,0,1);}
  for(const[id,m]of zones)if(!live.has(id)){scene.remove(m);disposeScene(m);zones.delete(id);}
  const ids=new Set();for(const q of c.bombs){ids.add(q.id);let o=bombs.get(q.id);if(!o){if(q.kind==='ball'){o={group:new THREE.Mesh(new THREE.SphereGeometry(.45,14,10),new THREE.MeshStandardMaterial({color:0xe8c44d}))};}else{o=createClownHead();o.group.traverse(m=>{if(m.material){m.material.transparent=true;m.material.depthWrite=false;}});}scene.add(o.group);bombs.set(q.id,o);}const v=bombPose(q,b.phase);o.group.visible=q.t<q.warn;o.group.position.set(v.x,v.y,v.z);o.group.rotation.z=v.spin;if(o.setMorph)o.setMorph({inflate:v.inflate,stretch:v.stretch,jaw:v.final,bulge:.2,wobble:.2},g.time);}
  for(const[id,o]of bombs)if(!ids.has(id)){scene.remove(o.group);disposeScene(o.group);bombs.delete(id);}
  const sids=new Set();for(const q of g.projectiles){sids.add(q.id);let m=shots.get(q.id);if(!m){m=new THREE.Mesh(q.kind==='bow'?new THREE.CylinderGeometry(.05,.05,q.skill?2:1,6).rotateX(Math.PI/2):new THREE.BoxGeometry(.4,.03,.55),new THREE.MeshBasicMaterial({color:q.skill?0x9dff80:0xf8e5bc}));scene.add(m);shots.set(q.id,m);}m.position.set(q.x,q.y,q.z);m.rotation.y=q.yaw;}
  for(const[id,m]of shots)if(!sids.has(id)){scene.remove(m);disposeScene(m);shots.delete(id);}
  const h=skillView(g),V=clownView(g);ui.player.textContent=WEAPONS[weapon].name+' · 생명 '+Math.ceil(p.hp)+'/120 · 기력 '+Math.floor(p.stamina)+' · 회복약 '+p.potions+' · '+h.name+': '+h.text+(h.card?' ['+({blue:'파랑',red:'빨강',yellow:'노랑'})[h.card]+']':'')+(practice?' · 연습전':'');ui.sub.textContent=V.sub;ui.action.textContent=paused?'일시정지':V.action;ui.fill.style.transform='scaleX('+Math.max(0,b.hp/b.maxHp)+')';ui.meter.setAttribute('aria-valuenow',String(Math.ceil(b.hp)));
  const big=b.state==='transition'?b.t<3.2?b.t:1:c.vis.pose==='inflate'?c.vis.k*2.4:0;
  const extra=Math.max(0,1/camera.aspect-1)*9,alpha=1-Math.exp(-5*dt);cameraPos.set(p.x,9+big*.8+extra*.3,p.z+14+zoom+big+extra);cameraTarget.set(p.x+(b.x-p.x)*.42,3.7+big*.5,p.z+(b.z-p.z)*.42);camera.position.lerp(cameraPos,alpha);cameraAim.lerp(cameraTarget,alpha);if(!reduced&&dt>0){shake=Math.max(0,shake-dt);camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;}camera.lookAt(cameraAim);
 }
 function events(){for(const e of g.events){fx.event(e,g);if(e.type==='boss-hit'){impact(g.boss.x,1.8,g.boss.z);g.clown.flash=.12;shake=e.big?.2:.06;}else if(e.type==='player-hit'){impact(g.player.x,1.2,g.player.z);shake=.2;}if(muted())continue;const sounds={roll:'roll',dodge:'dodge',healed:'healed',phase:'phase',victory:'victory',death:'death','player-hit':'hit-player','clown-blast':'boss-slam','clown-clap':'boss-slam','clown-dash':'boss-thrust','clown-inflate':'tele-whirl','clown-throw':'swing-cards','clown-juggle':'swing-cards','clown-roll':'boss-whirl','clown-shove':'roll','clown-bounce':'boss-slam'};if(e.type==='boss-hit')audio.play('hit-boss',{amount:e.amount});else if(e.type==='swing'&&!['bow','cards'].includes(weapon)||e.type==='shot')audio.play('swing-'+weapon);else if(e.type==='skill-cast')skillAudio.play('skill-'+e.flavor);else if(e.type==='skill-heal')skillAudio.play('skill-heal');else if(e.type==='skill-stun')skillAudio.play('skill-stun');else if(e.type==='clown-silence')audio.ambience(false);else if(sounds[e.type])audio.play(sounds[e.type]);}
  for(const e of g.events)if(e.type==='clown-blast')burst(e.x,e.z);g.events.length=0;
 }
 function frame(now){if(closed)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!paused&&g.status==='playing'){const v=input();if(queued){if(now>queued.until)queued=null;else if(!g.player.action){const a=queued.type;if(act(g,a)){if(a==='roll'&&!v.x&&!v.z)g.player.action.yaw=g.player.yaw+Math.PI;queued=null;}}}for(let left=dt;left>1e-6;){const h=Math.min(left,1/60);stepClown(g,h,v);left-=h;}}
  events();if(g.boss.state==='transition'&&g.boss.t>=3.2&&!transitionBurst){transitionBurst=true;burst(g.boss.x,g.boss.z,true);}
  const h=paused?0:dt;g.clown.flash=Math.max(0,(g.clown.flash||0)-h);for(let i=particles.length-1;i>=0;i--){const o=particles[i];o.life-=h;o.vy-=9*h;o.m.position.x+=o.vx*h;o.m.position.y+=o.vy*h;o.m.position.z+=o.vz*h;o.m.rotation.x+=h*4;if(o.life<=0){scene.remove(o.m);particles.splice(i,1);}}
  sync(h);fx.update(h,g);
  if(g.status!=='playing'&&ui.end.hidden){ui.end.hidden=false;endTitle.textContent=g.status==='won'?'광대 오슬우가 토벌되었다':'공연은 아직 끝나지 않았다';endText.textContent='적중 '+g.stats.hits+'회 · 회피 '+g.stats.dodges+'회 · '+g.time.toFixed(1)+'초';ui.retry.focus();if(g.status==='won'&&!practice){try{sessionStorage.setItem('oibung.clown.clear','1');}catch(e){}}}
  const w=canvas.clientWidth||innerWidth,hc=canvas.clientHeight||innerHeight;if(w!==width||hc!==height){width=w;height=hc;renderer.setSize(w,hc,false);camera.aspect=w/hc;camera.updateProjectionMatrix();}renderer.render(scene,camera);raf=requestAnimationFrame(frame);
 }
 reset();raf=requestAnimationFrame(frame);return {close};
}
