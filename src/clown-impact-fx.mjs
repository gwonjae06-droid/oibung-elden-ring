import * as THREE from 'three';
import {blastTheme,blastParticles,writeWave} from './clown-impact-data.mjs';
export function createClownImpactFx(scene,{mobile=false,reduced=false}={}){
 const root=new THREE.Group();root.name='clown-impact-effects';scene.add(root);const limit=reduced?70:mobile?160:360,positions=new Float32Array(limit*3),colors=new Float32Array(limit*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setDrawRange(0,0);
 const points=new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?.23:.3,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));points.frustumCulled=false;points.renderOrder=11;root.add(points);
 const waves=[],particles=[],color=new THREE.Color();let serial=0;
 for(let i=0;i<(reduced?3:8);i++){const a=new Float32Array(32*18),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(a,3));const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));m.visible=false;m.frustumCulled=false;m.renderOrder=10;root.add(m);waves.push({m,a,life:0});}
 function wave(x,z,r,hex,{half=Math.PI,yaw=0,life=.65,y=.12,jagged=0}={}){const w=waves.find(w=>w.life<=0)||waves.reduce((a,b)=>a.life<b.life?a:b);Object.assign(w,{x,z,r,half,yaw,life,max:life,y,jagged});w.m.material.color.setHex(hex);w.m.visible=true;}
 function burst(x,z,index){const list=blastParticles(index,reduced?10:mobile?28:56);for(const p of list){if(particles.length>=limit)particles.shift();color.setHex(p.color);particles.push({...p,x,y:.5,z,max:p.life,r:color.r,g:color.g,b:color.b});}}
 function clear(){particles.length=0;geo.setDrawRange(0,0);for(const w of waves){w.life=0;w.m.visible=false;}serial=0;}
 function event(e,g){
  if(!g.clown)return;
  if(e.type==='phase'||e.type==='victory'){clear();return;}
  const b=g.boss,c=g.clown;
  if(e.type==='clown-blast'){const index=serial++,theme=blastTheme(index);burst(e.x,e.z,index);wave(e.x,e.z,e.r||3.2,theme.colors[0],{jagged:theme.jagged});if(!reduced)wave(e.x,e.z,(e.r||3.2)*.8,theme.colors[1],{life:.9,y:.4,jagged:theme.jagged});}
  if(e.type==='clown-clap'){const z=c.zones.find(z=>z.sound==='clap')||{r:5,yaw:c.yaw,half:.873};wave(b.x,b.z,z.r,0xffda61,{half:z.half,yaw:z.yaw,life:.45,y:.18});wave(b.x,b.z,z.r,0xff8352,{half:z.half,yaw:z.yaw,life:.62,y:.65});burst(b.x,b.z,3);}
  if(e.type==='clown-horn'){const z=[...c.zones].reverse().find(z=>z.shape==='cone'&&['hornFan','curtainCall'].includes(z.sound));if(z){wave(z.x,z.z,z.r,0x5fdcff,{half:z.half,yaw:z.yaw,life:z.warn,y:.18});if(!reduced)wave(z.x,z.z,z.r*.85,0xe0fbff,{half:z.half,yaw:z.yaw,life:z.warn,y:.9});}}
  if(e.type==='clown-impact'&&['clap','hornFan','carousel','drumMarch'].includes(e.key)){const z=c.zones.find(z=>z.state==='burst'&&z.x===e.x&&z.z===e.z&&z.sound===e.key);if(z)wave(e.x,e.z,z.r||5,e.key==='hornFan'?0x9cf6ff:0xffe296,{half:z.half||Math.PI,yaw:z.yaw||0,life:.4,y:.2});}
  if(e.type==='clown-bounce'||e.type==='clown-finale'){wave(b.x,b.z,e.type==='clown-finale'?7:4.8,0xffe6a1,{life:.7});burst(b.x,b.z,serial++);}
 }
 function update(dt){const h=Math.max(0,Math.min(dt,.05));for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=h;if(p.life<=0){particles.splice(i,1);continue;}if(p.curl){const a=p.curl*h,vx=p.vx;p.vx=vx*Math.cos(a)-p.vz*Math.sin(a);p.vz=vx*Math.sin(a)+p.vz*Math.cos(a);}p.vy-=p.gravity*h;p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;}
  let i=0;for(const p of particles){const f=p.life/p.max;positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;colors[i*3]=p.r*f;colors[i*3+1]=p.g*f;colors[i*3+2]=p.b*f;i++;}geo.setDrawRange(0,i);geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;
  for(const w of waves){if(w.life<=0)continue;w.life=Math.max(0,w.life-h);const t=1-w.life/w.max;writeWave(w.a,Math.max(.05,w.r*t),w.half,w.yaw,w.x,w.z,w.y,w.jagged);w.m.geometry.attributes.position.needsUpdate=true;w.m.material.opacity=(1-t)*(reduced?.35:.65);w.m.visible=w.life>0;}
 }
 return {event,update,clear,root};
}
