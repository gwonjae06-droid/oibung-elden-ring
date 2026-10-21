import * as THREE from 'three';
import {findPlayerParts,playerPose,PLAYER_COLORS} from './player-presentation.mjs';
import {createPlayerSound} from './player-sound.mjs';
export function createPlayerPolish(scene,{reduced=false,mobile=false,emit,ring}={}){
 let parts=null,lastGame=null,lastTime=null,lastPos=null,speed=0,phase=0,walked=0,trailLife=0,nock=null;const sound=createPlayerSound(),samples=[],mats=[],v0=new THREE.Vector3(),v1=new THREE.Vector3();
 const a=new Float32Array(9*18),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(a,3));geo.setDrawRange(0,0);const material=new THREE.MeshBasicMaterial({color:0x8cdeff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}),trail=new THREE.Mesh(geo,material);trail.frustumCulled=false;trail.renderOrder=9;scene.add(trail);
 function decorate(){
  if(parts)return true;parts=findPlayerParts(scene);if(!parts)return false;
  const metal=new THREE.MeshStandardMaterial({color:0x829cad,metalness:.6,roughness:.4,transparent:true}),gold=new THREE.MeshStandardMaterial({color:0xd3b36c,metalness:.65,roughness:.4,transparent:true}),gem=new THREE.MeshStandardMaterial({color:0x72b3c6,emissive:0x163b4b,roughness:.3,transparent:true});mats.push(metal,gold,gem);
  const sphere=new THREE.SphereGeometry(1,10,8),box=new THREE.BoxGeometry(1,1,1),bead=(parent,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=!mobile;parent.add(m);return m;},plate=(parent,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
  bead(parts.body,metal,0,.35,.28,.31,.38,.13);bead(parts.body,gem,0,.7,.34,.075,.075,.04);
  for(const side of[-1,1]){const strap=plate(parts.body,gold,side*.14,.32,.4,.045,.6,.025);strap.rotation.z=side*.42;bead(parts.body,metal,side*.54,.76,0,.24,.12,.21);}
  for(let i=0;i<2;i++){const el=parts.elbows[i],knee=parts.knees[i];if(el)plate(el,metal,0,-.2,.075,.13,.22,.05);if(knee){bead(knee,metal,0,-.02,.12,.13,.13,.07);plate(knee,gold,0,-.32,.06,.2,.035,.3);}}
  let seg=parts.cape?.children.find(o=>o.isGroup);for(let i=0;i<3&&seg;i++){plate(seg,gold,0,-.37,0,.77-i*.08,.025,.06);const link=seg.children.find(o=>o.isGroup);seg=link?.children.find(o=>o.isGroup);}
  plate(parts.weapons.sword,gem,.045,0,1.05,.018,.13,1.4);bead(parts.weapons.hammer,gem,0,.27,1.6,.12,.045,.12);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.1,6).rotateX(Math.PI/2),gold);shaft.position.z=1;nock=new THREE.Group();nock.add(shaft);parts.weapons.bow.add(nock);
  for(const card of [...parts.weapons.cards.children]){const mark=plate(card,gold,0,.022,0,.1,.012,.12);mark.rotation.y=Math.PI/4;}
  return true;
 }
 const rgb=hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255];
 function clear(){samples.length=0;geo.setDrawRange(0,0);material.opacity=0;walked=phase=speed=trailLife=0;lastTime=lastPos=lastGame=null;sound.clear();}
 function event(e,g){if(lastGame!==g){clear();lastGame=g;}const p=g.player,c=rgb(PLAYER_COLORS[g.weapon]||0xffffff),n=k=>reduced?Math.ceil(k/3):k;
  if(e.type==='phase'){clear();lastGame=g;return;}
  if(e.type==='roll'){sound.play('roll',g.weapon);emit?.(p.x,.1,p.z,n(14),[.5,.47,.4],true);ring?.(p.x,p.z,.9,0x93c8d5,.3);}
  if(e.type==='swing'&&['sword','hammer'].includes(g.weapon)){sound.play('swing',g.weapon);emit?.(p.x+Math.sin(p.yaw),1,p.z+Math.cos(p.yaw),n(7),c);}
  if(e.type==='shot'){sound.play('shot',g.weapon);emit?.(p.x+Math.sin(p.yaw),1.2,p.z+Math.cos(p.yaw),n(12),c);}
  if(e.type==='boss-hit'){sound.play('hit',g.weapon);const b=g.boss,d=Math.max(.01,Math.hypot(p.x-b.x,p.z-b.z));emit?.(b.x+(p.x-b.x)/d*1.2,1.8,b.z+(p.z-b.z)/d*1.2,n(g.weapon==='hammer'?28:16),c,g.weapon==='hammer');}
  if(e.type==='healed'){sound.play('heal',g.weapon);emit?.(p.x,.7,p.z,n(18),[.5,.95,.65]);ring?.(p.x,p.z,1.4,0x9becad,.6);}
 }
 function update(dt,g){
  if(lastGame!==g){clear();lastGame=g;}sound.update();if(dt<=0)sound.clear();if(!decorate())return;
  const p=g.player,h=dt>0?Math.max(0,Math.min(.05,lastTime===null?dt:g.time-lastTime)):0;lastTime=g.time;
  if(!lastPos)lastPos={x:p.x,z:p.z};const distance=Math.hypot(p.x-lastPos.x,p.z-lastPos.z);lastPos={x:p.x,z:p.z};
  if(h>0){speed+=(Math.min(9,distance/h)-speed)*(1-Math.exp(-12*h));phase+=speed*h*2.3;if(!p.action&&g.status==='playing'){walked+=distance;if(walked>=1.55){walked%=1.55;sound.play('step',g.weapon);emit?.(p.x,.05,p.z,reduced?2:5,[.42,.39,.32],true);}}}
  if(g.status!=='playing'){samples.length=0;geo.setDrawRange(0,0);for(const m of mats){m.opacity=1;m.emissive.setHex(0x061016);}return;}
  const pose=playerPose(g,phase,g.boss.state==='transition'?0:speed),act=p.action;
  parts.legs[0].rotation.x=pose.legL;parts.legs[1].rotation.x=pose.legR;parts.knees[0].rotation.x=pose.kneeL;parts.knees[1].rotation.x=pose.kneeR;parts.arms[0].rotation.x=pose.armL;parts.arms[1].rotation.x=pose.armR;parts.elbows[0].rotation.x=pose.elbowL;parts.elbows[1].rotation.x=pose.elbowR;parts.pivot.rotation.x=pose.pivotX;parts.pivot.rotation.z=pose.pivotZ;parts.body.rotation.y=pose.twist;parts.body.rotation.z=reduced?pose.sway*.3:pose.sway;parts.body.rotation.x=act?.kind==='roll'?act.t/act.total*Math.PI*2:pose.lean;parts.body.position.y+=pose.lift;
  nock.visible=g.weapon==='bow'&&['attack','skill'].includes(act?.kind)&&act.t<act.wind;nock.position.z=-pose.pull*.35;
  for(const m of mats){m.opacity=act?.kind==='roll'&&act.t>=.075&&act.t<=.35?.65:1;m.emissive.setHex(act?.kind==='hurt'?0x401814:0x061016);}
  if(pose.trail&&h>0&&!reduced){v0.set(0,0,.45);v1.set(0,0,g.weapon==='hammer'?1.8:1.95);parts.pivot.localToWorld(v0);parts.pivot.localToWorld(v1);samples.push({a:v0.clone(),b:v1.clone()});if(samples.length>(mobile?6:10))samples.shift();trailLife=.14;}else if(h>0){trailLife=Math.max(0,trailLife-h);if(!trailLife)samples.length=0;}
  let k=0;for(let i=1;i<samples.length;i++){const x=samples[i-1],y=samples[i];for(const v of[x.a,x.b,y.a,y.a,x.b,y.b]){a[k++]=v.x;a[k++]=v.y;a[k++]=v.z;}}geo.setDrawRange(0,k/3);geo.attributes.position.needsUpdate=true;material.color.setHex(PLAYER_COLORS[g.weapon]||0xffffff);material.opacity=trailLife/.14*.36;
 }
 return {event,update,clear};
}
