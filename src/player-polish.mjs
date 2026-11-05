import {applyPlayerMotion} from './player-motion.mjs';
import {createPlayerBalance} from './player-balance.mjs';
import {createPlayerCombatVfx} from './player-combat-vfx.mjs';
import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {findPlayerParts,playerPose,PLAYER_COLORS} from './player-presentation.mjs';
import {createPlayerSound} from './player-sound.mjs';
export function createPlayerPolish(scene,{reduced=false,mobile=false,emit,ring,makeSound=createPlayerSound,soundOptions}={}){
 return runThreeStartup(THREE,(THREE,own)=>{

 let disposed=false,completion=null;const nodes=new Set(),geometries=new Set(),materials=new Set(),errors=[];
 const safe=fn=>{try{return fn();}catch(error){errors.push(error);}},geometry=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m),owned=n=>(nodes.add(n),n);
 const balance=createPlayerBalance({reduced});
 let modernFx=null,lastAction=null,variant=0,deathTime=0,castLeft=0;const castAction={kind:'attack',t:0,total:.38,wind:.16,active:.08};
 let parts=null,lastGame=null,lastTime=null,lastPos=null,speed=0,phase=0,walked=0,trailLife=0,nock=null;const sound=own(makeSound(soundOptions)),samples=[],mats=[],v0=new THREE.Vector3(),v1=new THREE.Vector3();
 const a=new Float32Array(9*18),geo=geometry(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(a,3));geo.setDrawRange(0,0);const material=mat(new THREE.MeshBasicMaterial({color:0x8cdeff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})),trail=owned(new THREE.Mesh(geo,material));trail.frustumCulled=false;trail.renderOrder=9;scene.add(trail);
 function decorate(){
  if(disposed)return false;if(parts)return true;parts=findPlayerParts(scene);if(!parts)return false;
  if(parts.quality==='oathwarden-v1'){trail.visible=false;modernFx=createPlayerCombatVfx(scene,{mobile,reduced});nock=parts.weaponDetails.bow.arrow;return true;}
  const metal=mat(new THREE.MeshStandardMaterial({color:0x829cad,metalness:.6,roughness:.4,transparent:true})),gold=mat(new THREE.MeshStandardMaterial({color:0xd3b36c,metalness:.65,roughness:.4,transparent:true})),gem=mat(new THREE.MeshStandardMaterial({color:0x72b3c6,emissive:0x163b4b,roughness:.3,transparent:true}));mats.push(metal,gold,gem);
  const sphere=geometry(new THREE.SphereGeometry(1,10,8)),box=geometry(new THREE.BoxGeometry(1,1,1)),bead=(parent,material,x,y,z,sx,sy,sz)=>{const m=owned(new THREE.Mesh(sphere,material));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=!mobile;parent.add(m);return m;},plate=(parent,material,x,y,z,sx,sy,sz)=>{const m=owned(new THREE.Mesh(box,material));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
  bead(parts.body,metal,0,.35,.28,.31,.38,.13);bead(parts.body,gem,0,.7,.34,.075,.075,.04);
  for(const side of[-1,1]){const strap=plate(parts.body,gold,side*.14,.32,.4,.045,.6,.025);strap.rotation.z=side*.42;bead(parts.body,metal,side*.54,.76,0,.24,.12,.21);}
  for(let i=0;i<2;i++){const el=parts.elbows[i],knee=parts.knees[i];if(el)plate(el,metal,0,-.2,.075,.13,.22,.05);if(knee){bead(knee,metal,0,-.02,.12,.13,.13,.07);plate(knee,gold,0,-.32,.06,.2,.035,.3);}}
  let seg=parts.cape?.children.find(o=>o.isGroup);for(let i=0;i<3&&seg;i++){plate(seg,gold,0,-.37,0,.77-i*.08,.025,.06);const link=seg.children.find(o=>o.isGroup);seg=link?.children.find(o=>o.isGroup);}
  plate(parts.weapons.sword,gem,.045,0,1.05,.018,.13,1.4);bead(parts.weapons.hammer,gem,0,.27,1.6,.12,.045,.12);
  const shaft=owned(new THREE.Mesh(geometry(new THREE.CylinderGeometry(.012,.012,1.1,6).rotateX(Math.PI/2)),gold));shaft.position.z=1;nock=owned(new THREE.Group());nock.add(shaft);parts.weapons.bow.add(nock);
  for(const card of [...parts.weapons.cards.children]){const mark=plate(card,gold,0,.022,0,.1,.012,.12);mark.rotation.y=Math.PI/4;}return true;
 }
 const rgb=hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255];
 function clear(){if(disposed)return;balance.reset();samples.length=0;geo.setDrawRange(0,0);material.opacity=0;walked=phase=speed=trailLife=0;lastTime=lastPos=lastGame=null;lastAction=null;deathTime=castLeft=variant=0;modernFx?.clear();sound.clear();}
 function event(e,g){if(disposed)return;if(lastGame!==g){clear();lastGame=g;}modernFx?.event(e,g);const p=g.player,c=rgb(PLAYER_COLORS[g.weapon]||0xffffff),n=k=>reduced?Math.ceil(k/3):k;
  if(e.type==='phase'){clear();lastGame=g;return;}
  if(e.type==='skill-cast'&&g.weapon==='cards')castLeft=.38;
  if(e.type==='roll'){sound.play('roll',g.weapon);emit?.(p.x,.1,p.z,n(14),[.5,.47,.4],true);ring?.(p.x,p.z,.9,0x93c8d5,.3);}
  if(e.type==='swing'&&['sword','hammer'].includes(g.weapon)){emit?.(p.x+Math.sin(p.yaw),1,p.z+Math.cos(p.yaw),n(7),c);}
  if(e.type==='shot'){emit?.(p.x+Math.sin(p.yaw)*2,1.2,p.z+Math.cos(p.yaw)*2,n(12),c);}
  if(e.type==='boss-hit'){const b=g.boss,d=Math.max(.01,Math.hypot(p.x-b.x,p.z-b.z));emit?.(b.x+(p.x-b.x)/d*1.2,1.8,b.z+(p.z-b.z)/d*1.2,n(g.weapon==='hammer'?28:16),c,g.weapon==='hammer');}
  if(e.type==='healed'){emit?.(p.x,.7,p.z,n(18),[.5,.95,.65]);ring?.(p.x,p.z,1.4,0x9becad,.6);}
 }
 function update(dt,g){
  if(disposed)return;if(lastGame!==g){clear();lastGame=g;}sound.update();if(dt<=0)sound.clear();if(!decorate())return;
  const p=g.player,h=dt>0?Math.max(0,Math.min(.05,lastTime===null?dt:g.time-lastTime)):0;lastTime=g.time;
  if(!lastPos)lastPos={x:p.x,z:p.z};const vx=p.x-lastPos.x,vz=p.z-lastPos.z,distance=Math.hypot(vx,vz),localX=distance?(vx*Math.cos(p.yaw)-vz*Math.sin(p.yaw))/distance:0,localZ=distance?(vx*Math.sin(p.yaw)+vz*Math.cos(p.yaw))/distance:1;lastPos.x=p.x;lastPos.z=p.z;
  if(h>0){speed+=(Math.min(9,distance/h)-speed)*(1-Math.exp(-12*h));phase+=speed*h*2.3*(localZ<-.25?-1:1);if(!p.action&&g.status==='playing'){walked+=distance;const stride=parts.quality==='oathwarden-v1'?1.36:1.55;if(walked>=stride){walked%=stride;sound.play('step',g.weapon);modernFx?.step(p.x,p.z);emit?.(p.x,.05,p.z,reduced?2:5,[.42,.39,.32],true);}}}
  if(parts.quality==='oathwarden-v1'){
   const action=p.action;if(action!==lastAction){if(action&&['attack','skill'].includes(action.kind))variant=(variant+1)%3;lastAction=action;}
   castLeft=Math.max(0,castLeft-h);castAction.t=.38-castLeft;
   const pose=playerPose(g,phase,g.boss.state==='transition'?0:speed,{variant,time:g.time||0,moveX:localX,moveZ:localZ,cast:castLeft>0?castAction:null});
   if(g.status==='lost'){deathTime+=Math.max(0,dt);const u=Math.min(1,deathTime/.85),k=u*u*(3-2*u);pose.lean=1.45*k;pose.lift=-.52*k;pose.kneeL=pose.kneeR=.85*k;pose.legL=pose.legR=-.30*k;pose.armL=pose.armR=-.5*k;pose.spin=pose.bob=0;pose.headX=.30*k;pose.trail=false;}
   if(g.status==='playing')balance.apply(pose,{dt:h,clock:g.time||0,phase,speed,moveX:localX,moveZ:localZ,action});
   parts.rig.scale.y=1;applyPlayerMotion(parts,pose,g.weapon,(g.time||0)+deathTime,speed);modernFx.update(h,g,parts,pose);
   const skill=p.skill||{},hurt=action?.kind==='hurt';
   const enchant=action?.stun||skill.nextYellow?0xf6d36e:skill.nextRed?0xe56c79:skill.blue>0?0x79bdf2:0;
   const gemColor=pose.heal>.05?0x95e9ba:enchant||PLAYER_COLORS[g.weapon]||0x90d8e1;
   parts.materials.cardRed.color.setHex(g.weapon==='cards'&&enchant?enchant:0x842a3d);
   for(const [key,m]of Object.entries(parts.materials))if(m.emissive){m.opacity=1;if(key==='gem')m.color.setHex(gemColor);m.emissive.setHex(key==='gem'?hurt?0x802f36:gemColor:hurt?0x2e080b:p.invuln>0?0x0b242c:0x000000);m.emissiveIntensity=key==='gem'?.32+pose.charge*1.2+(skill.haste>0||skill.hammerHits>=4?.35:0):hurt?.25:p.invuln>0?.22:0;}
   return;
  }
  if(g.status!=='playing'){samples.length=0;geo.setDrawRange(0,0);for(const m of mats){m.opacity=1;m.emissive.setHex(0x061016);}return;}
  const pose=playerPose(g,phase,g.boss.state==='transition'?0:speed),act=p.action;
  parts.legs[0].rotation.x=pose.legL;parts.legs[1].rotation.x=pose.legR;parts.knees[0].rotation.x=pose.kneeL;parts.knees[1].rotation.x=pose.kneeR;parts.arms[0].rotation.x=pose.armL;parts.arms[1].rotation.x=pose.armR;parts.elbows[0].rotation.x=pose.elbowL;parts.elbows[1].rotation.x=pose.elbowR;parts.pivot.rotation.x=pose.pivotX;parts.pivot.rotation.z=pose.pivotZ;parts.body.rotation.y=pose.twist;parts.body.rotation.z=reduced?pose.sway*.3:pose.sway;parts.body.rotation.x=act?.kind==='roll'?act.t/act.total*Math.PI*2:pose.lean;parts.body.position.y+=pose.lift;
  nock.visible=g.weapon==='bow'&&['attack','skill'].includes(act?.kind)&&act.t<act.wind;nock.position.z=-pose.pull*.35;
  for(const m of mats){m.opacity=act?.kind==='roll'&&act.t>=.075&&act.t<=.35?.65:1;m.emissive.setHex(act?.kind==='hurt'?0x401814:0x061016);}
  if(act?.kind==='charging'){parts.pivot.rotation.x=-1.45;parts.body.rotation.x=-.12;for(const m of mats)m.emissive.setHex(0x294e70);}
  if(pose.trail&&h>0&&!reduced){v0.set(0,0,.45);v1.set(0,0,g.weapon==='hammer'?1.8:1.95);parts.pivot.localToWorld(v0);parts.pivot.localToWorld(v1);samples.push({a:v0.clone(),b:v1.clone()});if(samples.length>(mobile?6:10))samples.shift();trailLife=.14;}else if(h>0){trailLife=Math.max(0,trailLife-h);if(!trailLife)samples.length=0;}
  let k=0;for(let i=1;i<samples.length;i++){const x=samples[i-1],y=samples[i];for(const v of[x.a,x.b,y.a,y.a,x.b,y.b]){a[k++]=v.x;a[k++]=v.y;a[k++]=v.z;}}geo.setDrawRange(0,k/3);geo.attributes.position.needsUpdate=true;material.color.setHex(PLAYER_COLORS[g.weapon]||0xffffff);material.opacity=trailLife/.14*.36;
 }
 function finishDispose(delegated){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;let audio;
  try{audio=sound.dispose();}catch(error){errors.push(error);}
  safe(()=>modernFx?.dispose(delegated));modernFx=null;safe(()=>geo.removeEventListener('dispose',onOwnerDispose));samples.length=0;lastTime=lastPos=lastGame=parts=nock=null;
  if(!delegated){for(const node of nodes)safe(()=>node.parent?.remove(node));for(const g of geometries)safe(()=>g.dispose());for(const m of materials)safe(()=>m.dispose());}
  nodes.clear();geometries.clear();materials.clear();mats.length=0;
  Promise.resolve(audio).then(report=>finish({errors:[...errors,...(report?.errors||[])]}),error=>{errors.push(error);finish({errors:[...errors]});});return completion;
 }
 function dispose(){return finishDispose(false);}
 const onOwnerDispose=()=>{finishDispose(true);};geo.addEventListener('dispose',onOwnerDispose);
 return {event,update,clear,dispose,get disposed(){return disposed;}};

 });
}
