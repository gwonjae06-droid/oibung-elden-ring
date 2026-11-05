import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {blastTheme,blastParticles,writeWave} from './clown-impact-data.mjs';
import {clownDebris,stepClownDebris} from './clown-debris-data.mjs';
import {applyClownTelegraphs} from './clown-telegraph-policy.mjs';
import {createClownStageProps} from './clown-stage-props.mjs';
export function createClownImpactFx(scene,{mobile=false,reduced=false}={}){
 return runThreeStartup(THREE,(THREE,own)=>{
 const root=new THREE.Group();root.name='clown-impact-effects';scene.add(root);const stageProps=own(createClownStageProps(root));const limit=reduced?70:mobile?160:360,pos=new Float32Array(limit*3),rgb=new Float32Array(limit*3),geo=new THREE.BufferGeometry(),color=new THREE.Color();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));geo.setDrawRange(0,0);
 const points=new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?.23:.3,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));points.frustumCulled=false;points.renderOrder=11;root.add(points);const particles=[],decor=[],live=[],fragments=[];let serial=0,game=null,trailTime=0,lightLife=0;
 const capacity=reduced?24:mobile?64:128,dummy=new THREE.Object3D();
 const paperGeo=new THREE.BufferGeometry();paperGeo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.5,0,.25,-.5,0,.25,.5,-1,0,-.5,0,.25,.5,-1,0,.5,0,.25,-.5,1,0,-.5,1,0,.5,0,.25,-.5,1,0,.5,0,.25,.5],3));paperGeo.computeVertexNormals();
 const rubberGeo=new THREE.TorusGeometry(.8,.17,5,12,Math.PI*1.4),makeFragments=geometry=>{const m=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6,metalness:.05,side:THREE.DoubleSide}),capacity);m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(m);return m;},paper=makeFragments(paperGeo),rubber=makeFragments(rubberGeo);
 const light=new THREE.PointLight(0xffd38a,0,16,2);root.add(light);
 function slot(){const a=new Float32Array(32*18),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));m.frustumCulled=false;m.visible=false;m.renderOrder=10;root.add(m);return {a,m,life:0};}
 for(let i=0;i<(reduced?3:12);i++)decor.push(slot());for(let i=0;i<12;i++)live.push(slot());
 function wave(x,z,r,hex,jagged=0){const w=decor.find(w=>w.life<=0)||decor.reduce((a,b)=>a.life<b.life?a:b);Object.assign(w,{x,z,r,life:.7,max:.7,jagged});w.m.material.color.setHex(hex);w.m.visible=true;}
 function burst(x,z,index){for(const p of blastParticles(index,reduced?10:mobile?28:56)){if(particles.length>=limit)particles.shift();color.setHex(p.color);particles.push({...p,x,y:.5,z,max:p.life,r:color.r,g:color.g,b:color.b});}}
 function debris(x,z,index,count=48){const theme=blastTheme(index);for(const p of clownDebris(index,reduced?12:mobile?24:count)){if(fragments.length>=capacity)fragments.shift();fragments.push({...p,x:p.x+x,z:p.z+z,hex:theme.colors[p.color%theme.colors.length]});}}
 function clear(){stageProps.clear();game=null;particles.length=fragments.length=0;geo.setDrawRange(0,0);paper.count=rubber.count=0;light.intensity=lightLife=trailTime=0;for(const w of[...decor,...live]){w.life=0;w.m.visible=false;}serial=0;}
 function event(e,g){
  if(!g.clown)return;game=g;stageProps.event(e,g);if(['phase','victory','death'].includes(e.type)){clear();return;}
  if(e.type==='clown-shutter'){wave(e.x,e.z,1.4,0xffffff);light.position.set(e.x,2,e.z);light.color.setHex(0xffffff);lightLife=.08;light.intensity=45;}
  if(e.type==='clown-blast'){
   const index=serial++,theme=blastTheme(index),r=e.r||3.2;burst(e.x,e.z,index);debris(e.x,e.z,index);wave(e.x,e.z,r,theme.colors[0],theme.jagged);if(!reduced){wave(e.x,e.z,r*.7,theme.colors[1],theme.jagged);wave(e.x,e.z,r*1.15,theme.colors[0],0);}
   light.position.set(e.x,2,e.z);light.color.setHex(theme.colors[0]);lightLife=.16;light.intensity=180;
  }
  if(['clown-clap','clown-bounce','clown-finale'].includes(e.type)){const i=serial++;burst(g.boss.x,g.boss.z,i);debris(g.boss.x,g.boss.z,i,e.type==='clown-finale'?64:24);}
  if(e.type==='clown-bounce'||e.type==='clown-finale')wave(g.boss.x,g.boss.z,e.type==='clown-finale'?7:4.8,0xffe6a1);
 }
 function update(dt){
  const h=Number.isFinite(dt)?Math.max(0,Math.min(dt,.05)):0;
  if(game)stageProps.update(h,game);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=h;if(p.life<=0){particles.splice(i,1);continue;}const a=p.curl*h,x=p.vx;p.vx=x*Math.cos(a)-p.vz*Math.sin(a);p.vz=x*Math.sin(a)+p.vz*Math.cos(a);p.vy-=p.gravity*h;p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;}
  let i=0;for(const p of particles){const f=p.life/p.max;pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;rgb[i*3]=p.r*f;rgb[i*3+1]=p.g*f;rgb[i*3+2]=p.b*f;i++;}geo.setDrawRange(0,i);geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;
  let pi=0,ri=0;
  for(let j=fragments.length-1;j>=0;j--){const p=fragments[j];stepClownDebris(p,h);if(p.life<=0){fragments.splice(j,1);continue;}const mesh=p.kind==='paper'?paper:rubber,index=p.kind==='paper'?pi++:ri++,fade=Math.min(1,p.life/.3);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,p.rz);const s=p.scale*fade;dummy.scale.set(s*(p.kind==='paper'?2:1),s,s);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);color.setHex(p.hex);mesh.setColorAt(index,color);}
  paper.count=pi;rubber.count=ri;for(const m of[paper,rubber]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
  lightLife=Math.max(0,lightLife-h);light.intensity=180*(lightLife/.16)**2;
  trailTime+=h;if(h>0&&trailTime>=.05){trailTime=0;for(const q of game?.clown?.bombs||[])if(q.kind==='roll'&&q.t<q.travel&&Number.isFinite(q.px)&&Number.isFinite(q.pz)){for(const p of blastParticles(0,2)){if(particles.length>=limit)particles.shift();particles.push({...p,x:q.px,y:.12,z:q.pz,vx:p.vx*.12,vy:.35,vz:p.vz*.12,life:.24,max:.24,r:.7,g:.54,b:.3});}}}
  for(const w of decor){if(w.life<=0)continue;w.life=Math.max(0,w.life-h);const t=1-w.life/w.max;writeWave(w.a,Math.max(.05,w.r*t),Math.PI,0,w.x,w.z,.15,w.jagged);w.m.geometry.attributes.position.needsUpdate=true;w.m.material.opacity=(1-t)*(reduced?.35:.65);w.m.visible=w.life>0;}
  const waves=game?.clown?.waves||[];for(let j=0;j<live.length;j++){const s=live[j],w=waves[j];s.m.visible=Boolean(w);if(!w)continue;writeWave(s.a,w.r,w.half,w.yaw,w.x,w.z,.18,0,w.width);s.m.geometry.attributes.position.needsUpdate=true;s.m.material.color.setHex(w.kind==='clap'?0xffce59:0x65e5ff);s.m.material.opacity=.85-.25*w.r/w.range;}
  applyClownTelegraphs(scene,game);
 }
 return {event,update,clear,root};
 });
}
