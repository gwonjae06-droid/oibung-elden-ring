import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {createBossChip} from './boss-chip.mjs';
import {createPlayerPolish} from './player-polish.mjs';
import {createClownImpactFx} from './clown-impact-fx.mjs';
import {buildCircus} from './circus-environment.mjs';
import {createMobileCombatUi} from './mobile-combat-ui.mjs';
import {createBossSfx} from './boss-sfx.mjs';
import {createPhaseDialogue} from './phase-dialogue.mjs';
import {createParticlePool,FX_LIMIT} from './effects-data.mjs';
import {SKILL_COLORS,SKILL_HEX} from './skills.mjs';
import {AMBIENT_LIMIT,atmosphereMood,createAmbientField,stepAmbientField} from './atmosphere-data.mjs';
export function createSkillFx(scene,reduced=false,{makeBossSfx=createBossSfx,makePlayerFx=createPlayerPolish,bossSoundOptions,playerSoundOptions}={}){
 return runThreeStartup(THREE,(THREE,own)=>{

 let disposed=false,completion=null;const errors=[];
 const bossSfx=own(makeBossSfx(bossSoundOptions)),phaseDialogue=own(createPhaseDialogue()),mobileUi=own(createMobileCombatUi()),bossChip=own(createBossChip(),'clear');
 const mobile=Boolean(globalThis.matchMedia?.('(pointer:coarse)').matches);let circus=null,clownFx=null;
 const limit=reduced?70:Math.min(FX_LIMIT,260),pool=createParticlePool(limit),root=new THREE.Group();root.name='skill-effects';scene.add(root);
 const geo=new THREE.BufferGeometry(),positions=new Float32Array(limit*3),colors=new Float32Array(limit*3);geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setDrawRange(0,0);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d'),gradient=c.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.35,'#ffffffaa');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.fillRect(0,0,32,32);
 const material=new THREE.PointsMaterial({size:.34,map:new THREE.CanvasTexture(canvas),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),points=new THREE.Points(geo,material);points.frustumCulled=false;root.add(points);
 const ambientLimit=reduced?36:mobile?80:AMBIENT_LIMIT,field=createAmbientField({count:ambientLimit}),aGeo=new THREE.BufferGeometry(),aPos=new Float32Array(ambientLimit*3),aCol=new Float32Array(ambientLimit*3);aGeo.setAttribute('position',new THREE.BufferAttribute(aPos,3));aGeo.setAttribute('color',new THREE.BufferAttribute(aCol,3));aGeo.setDrawRange(0,0);
 const ambient=new THREE.Points(aGeo,new THREE.PointsMaterial({size:.2,map:material.map,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));ambient.frustumCulled=false;root.add(ambient);let ambientTime=0;
 const rings=[],ringGeo=new THREE.RingGeometry(.9,1,64);for(let i=0;i<6;i++){const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;root.add(m);rings.push({m,life:0,max:.7,radius:2});}
 let acc=0,lastGame=null;const n=k=>reduced?Math.ceil(k/3):k;
 function ring(x,z,radius,hex,max=.7){if(disposed)return;const r=rings.find(q=>q.life<=0)||rings[0];r.life=r.max=max;r.radius=radius;r.m.position.set(x,.05,z);r.m.material.color.setHex(hex);r.m.visible=true;r.m.scale.setScalar(.1);}
 const playerFx=own(makePlayerFx(scene,{reduced,mobile,soundOptions:playerSoundOptions,emit:(...args)=>{if(!disposed)pool.emit(...args);},ring}));
 function clear(){if(disposed)return;bossChip.clear();playerFx.clear();clownFx?.clear();mobileUi.clear();phaseDialogue.clear();bossSfx.clear();pool.clear();geo.setDrawRange(0,0);for(const r of rings){r.life=0;r.m.visible=false;}acc=0;}
 function event(ev,g){
  if(disposed)return;if(lastGame!==g){clear();lastGame=g;}bossSfx.event(ev,g);playerFx.event(ev,g);if(g.clown){clownFx||=createClownImpactFx(scene,{mobile,reduced});clownFx.event(ev,g);}
  const p=g.player,b=g.boss,f=ev.flavor,col=SKILL_COLORS[f]||SKILL_COLORS.white;
  if(ev.type==='skill-cast'){const fx=p.x+Math.sin(p.yaw)*3.2,fz=p.z+Math.cos(p.yaw)*3.2;if(f==='sword'){ring(p.x,p.z,2.6,SKILL_HEX.sword);pool.emit(p.x,1.2,p.z,n(34),col);}else if(f==='hammer'){ring(fx,fz,5,SKILL_HEX.hammer,.9);pool.emit(fx,.2,fz,n(42),[.7,.4,.22],true);pool.emit(fx,.5,fz,n(26),col);}else if(f==='bow'){ring(p.x,p.z,1.4,SKILL_HEX.bow,.5);pool.emit(p.x+Math.sin(p.yaw)*2,1.2,p.z+Math.cos(p.yaw)*2,n(24),col);}else{ring(p.x,p.z,f==='yellow'?3:2.2,SKILL_HEX[f]);pool.emit(p.x,1.4,p.z,n(f==='blue'?30:38),col);}}
  else if(ev.type==='card-sigil-mark'){ring(b.x,b.z,1.2+ev.count*.3,0xf8d085,.4);pool.emit(b.x,2.2,b.z,n(9),[1,.72,.3]);}
  else if(ev.type==='card-sigil-burst'){ring(b.x,b.z,4,0xfce1a1,.9);pool.emit(b.x,2.4,b.z,n(28),[1,.86,.44]);}
  else if(ev.type==='hammer-absorbed'){pool.emit(p.x,1.25,p.z,n(4),SKILL_COLORS.hammer);}
  else if(ev.type==='hammer-stored-release'){ring(p.x,p.z,2.0,0xe79b56,.42);}
  else if(ev.type==='bow-burn-applied'){pool.emit(b.x,2.2,b.z,n(12),[1,.34,.08]);}
  else if(ev.type==='skill-stun'){ring(b.x,b.z,3.8,SKILL_HEX.yellow,.8);pool.emit(b.x,3,b.z,n(36),SKILL_COLORS.yellow);}
  else if(ev.type==='skill-heal'){ring(p.x,p.z,1.8,SKILL_HEX.heal);pool.emit(p.x,.6,p.z,n(24),SKILL_COLORS.heal);}
  else if(ev.type==='skill-ready'){ring(p.x,p.z,1.6,SKILL_HEX[f]||0xffffff,.55);pool.emit(p.x,1,p.z,n(14),col);}
  else if(ev.type==='skill-pierce')pool.emit(p.x+Math.sin(p.yaw)*5,1.3,p.z+Math.cos(p.yaw)*5,n(14),SKILL_COLORS.bow);
  else if(ev.type==='phase'){ring(b.x,b.z,9,0xff3a2e,1.1);ring(b.x,b.z,5,0xffb35f,.8);pool.emit(b.x,2.2,b.z,n(46),[1,.35,.2]);}
  else if(ev.type==='stagger'){ring(b.x,b.z,4,0xffdc9a,.6);pool.emit(b.x,2.4,b.z,n(24),[1,.82,.5]);}
  else if(ev.type==='victory'){ring(b.x,b.z,12,0xffdc40,1.4);pool.emit(b.x,2.5,b.z,n(60),[1,.86,.3]);}
  else if(ev.type==='boss-swing'&&!g.clown){const k=b.pattern,fx=b.x+Math.sin(b.yaw)*5,fz=b.z+Math.cos(b.yaw)*5;if(k==='rush'){ring(b.x,b.z,3.2,0xff6a3a,.45);pool.emit(b.x,1.1,b.z,n(26),[1,.45,.25]);}else if(k==='retreat'){pool.emit(b.x,.3,b.z,n(24),[.7,.7,.65],true);ring(b.x,b.z,2.4,0xcfd6c8,.5);}else if(k==='thrust'||k==='jab')pool.emit(fx,1.3,fz,n(k==='jab'?10:20),[1,.85,.55]);else if(k==='whirl'){ring(b.x,b.z,7.5,0xffc34a,.7);pool.emit(b.x,1.6,b.z,n(30),[1,.75,.35]);}else if(k==='stomp'){pool.emit(b.x,.2,b.z,n(13),[.7,.62,.5],true); /* ground shock ring appears at actual impact, not attack startup */}else if(['sweep','reverse','cross','rise','backsweep'].includes(k))pool.emit(fx,1.6,fz,n(14),[1,.8,.5]);}
  else if(ev.type==='clown-impact'&&g.clown){if(ev.key==='fireHoop')pool.emit(ev.x,.4,ev.z,n(5),[1,.5,.12]);else if(ev.key==='dash'){ring(ev.x,ev.z,3.5,0xffdc9a,.5);pool.emit(ev.x,2.4,ev.z,n(22),[1,.85,.5]);}else if(ev.key==='drumMarch')ring(ev.x,ev.z,2.8,0xfff0b0,.45);}
 }
 function update(dt,g){
  if(disposed)return;if(lastGame!==g){clear();lastGame=g;}bossSfx.update(dt,g);phaseDialogue.update(g);mobileUi.update(g);bossChip.update(dt,g);if(g.clown){circus||=buildCircus(scene,{mobile,reduced});circus.update(g.time,g.boss.phase,g,dt);}else circus?.hide();
  const h=Math.max(0,Math.min(dt,.05));playerFx.update(h,g);clownFx?.update(h);pool.step(h);acc+=h;ambientTime+=h;const mood=atmosphereMood(g);stepAmbientField(field,h,ambientTime,mood);
  const na=field.particles.length;for(let k=0;k<na;k++){const q=field.particles[k];aPos[k*3]=q.x;aPos[k*3+1]=q.y;aPos[k*3+2]=q.z;for(let j=0;j<3;j++)aCol[k*3+j]=(mood.a[j]*(1-q.tint)+mood.b[j]*q.tint)*q.alpha;}aGeo.setDrawRange(0,na);aGeo.attributes.position.needsUpdate=true;aGeo.attributes.color.needsUpdate=true;
  const every=reduced?.2:.07;if(h>0&&acc>=every){acc=0;const p=g.player,s=p.skill,jx=()=>(Math.random()-.5)*1.2;if(s.haste>0)pool.emit(p.x+jx(),1.1+Math.random()*.8,p.z+jx(),n(3),SKILL_COLORS.sword);if(s.blue>0)pool.emit(p.x+jx(),.2,p.z+jx(),n(3),SKILL_COLORS.blue);if(s.nextRed)pool.emit(p.x+jx()*.6,1.7+Math.random()*.4,p.z+jx()*.6,n(2),SKILL_COLORS.red);if(s.nextYellow)pool.emit(p.x+jx()*.6,1.8+Math.random()*.4,p.z+jx()*.6,n(2),SKILL_COLORS.yellow);if(g.weapon==='hammer'&&s.hammerHits>=4)pool.emit(p.x+jx(),.4,p.z+jx(),n(2),SKILL_COLORS.hammer);for(const q of g.projectiles)if(q.skill)pool.emit(q.x,q.y,q.z,n(2),SKILL_COLORS.bow);}
  let i=0;for(const q of pool.particles){const fade=Math.max(0,q.life/q.max);positions[i*3]=q.x;positions[i*3+1]=q.y;positions[i*3+2]=q.z;for(let j=0;j<3;j++)colors[i*3+j]=q.color[j]*fade*(q.dust?.4:1);i++;}geo.setDrawRange(0,i);geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
  for(const r of rings){if(r.life<=0)continue;r.life-=h;r.m.visible=r.life>0;const t=1-Math.max(0,r.life/r.max);r.m.scale.setScalar(.1+r.radius*t);r.m.material.opacity=(1-t)*.6;}
 }
 function finishDispose(delegated){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;const waits=[];
  function run(fn){try{const result=fn();if(result?.then)waits.push(Promise.resolve(result).then(report=>{if(Array.isArray(report?.errors))errors.push(...report.errors);}).catch(error=>{errors.push(error);}));}catch(error){errors.push(error);}}
  run(()=>geo.removeEventListener('dispose',onOwnerDispose));run(()=>bossSfx.dispose());
  for(const [child,fallback] of [[playerFx,'clear'],[clownFx,'clear'],[circus,'hide'],[bossChip,'clear'],[mobileUi,'clear'],[phaseDialogue,'clear']])if(child)run(()=>!delegated&&typeof child.dispose==='function'?child.dispose():child[fallback]?.());
  run(()=>pool.clear());
  if(!delegated){const resources=new Set();for(const node of [root,clownFx?.root,circus?.root].filter(Boolean)){run(()=>node.traverse(object=>{if(object.geometry)resources.add(object.geometry);for(const m of Array.isArray(object.material)?object.material:[object.material])if(m){resources.add(m);for(const value of Object.values(m))if(value?.isTexture)resources.add(value);}if(object.shadow?.map)resources.add(object.shadow.map);}));run(()=>node.parent?.remove(node));}for(const resource of resources)run(()=>resource.dispose?.());}
  circus=null;clownFx=null;lastGame=null;rings.length=0;acc=0;
  Promise.all(waits).then(()=>finish({errors:[...errors]}));return completion;
 }
 function dispose(){return finishDispose(false);}
 const onOwnerDispose=()=>{finishDispose(true);};geo.addEventListener('dispose',onOwnerDispose);
 return {event,update,clear,dispose,get disposed(){return disposed;}};

 });
}
