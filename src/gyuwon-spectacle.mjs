import * as THREE from 'three';
import {hazardPosition} from './gyuwon-data.mjs';
export function createGyuwonSpectacle(stage,{coarse=false}={}){
 const root=new THREE.Group();stage.add(root);const groups=new Map(),attacks=new Map();
 const gold=new THREE.MeshPhysicalMaterial({color:0xdca339,metalness:.66,roughness:.32,clearcoat:.38,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false});
 const dust=new THREE.PointsMaterial({color:0xffcf65,size:coarse?.32:.2,transparent:true,opacity:.9,depthWrite:false});
 function solid(parent,geo,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,gold);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);const p=new THREE.Points(geo,dust);p.position.copy(m.position);p.scale.copy(m.scale);parent.add(p);return m;}
 const cube=new THREE.BoxGeometry(1,1,1,4,4,4),sphere=new THREE.SphereGeometry(1,20,14),cylinder=new THREE.CylinderGeometry(1,1,1,16,3),ring=new THREE.TorusGeometry(1,.035,6,80);
 for(const name of ['sword','circus','gamble','tsunami','chalk']){const g=new THREE.Group();g.name='gold-memory-'+name;root.add(g);groups.set(name,g);

 }
 const blackboard=document.createElement('canvas');blackboard.width=blackboard.height=1024;const ctx=blackboard.getContext('2d');ctx.fillStyle='#09211c';ctx.fillRect(0,0,1024,1024);ctx.strokeStyle='#d8b75e';ctx.lineWidth=3;ctx.font='48px serif';
 for(let i=0;i<9;i++){ctx.fillStyle='#d8b75e';ctx.fillText(['∑ x² + y² = ∞','∫ f(x) dx = ?','∀x ∃y : x ≠ y','lim n → ∞'][i%4],30,80+i*110);ctx.strokeRect(720,30+i*110,60,60);ctx.beginPath();ctx.moveTo(830,30+i*110);ctx.lineTo(900,90+i*110);ctx.moveTo(900,30+i*110);ctx.lineTo(830,90+i*110);ctx.stroke();}
 const tex=new THREE.CanvasTexture(blackboard),chalk=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({map:tex}));chalk.rotation.x=-Math.PI/2;chalk.position.y=.016;groups.get('chalk').add(chalk);
 for(const group of groups.values())group.traverse(o=>{if(o.material&&(o.material===gold||o.material===dust)){o.material=o.material.clone();o.userData.baseOpacity=o.material.opacity;}});
 let writingShader=null;chalk.material.onBeforeCompile=shader=>{shader.uniforms.writing={value:1};shader.fragmentShader='uniform float writing;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n if(vMapUv.x > writing) diffuseColor.rgb=vec3(0.035,0.12,0.09);');writingShader=shader;};
 const roll=new THREE.Group();groups.get('gamble').add(roll);const roulette=solid(roll,ring,0,.15,0,21,21,21);roulette.rotation.x=Math.PI/2;
 const streamGeo=new THREE.BufferGeometry(),stream=[];for(let i=0;i<(coarse?900:2400);i++){const a=i*2.39996,r=25+(i%113);stream.push(Math.sin(a)*r,(i%97)*.8,Math.cos(a)*r);}streamGeo.setAttribute('position',new THREE.Float32BufferAttribute(stream,3));const streamPoints=new THREE.Points(streamGeo,dust);root.add(streamPoints);
 function make(h){const g=new THREE.Group();root.add(g);
  if(h.visual==='sword'){solid(g,cube,0,85,0,5,170,1);solid(g,cube,0,165,0,26,3,3);solid(g,cylinder,0,181,0,1.4,28,1.4);}
  if(h.visual==='ball')solid(g,sphere,0,0,0,h.r,h.r,h.r);
  if(h.visual==='dice'){solid(g,cube,0,0,0,7,7,7);for(let i=0;i<5;i++)solid(g,sphere,(i%2-.5)*3,0,3.6,.4,.4,.2);}
  if(h.visual==='spotlight'){const m=solid(g,new THREE.ConeGeometry(h.r,55,20,1,true),0,27,0);m.rotation.z=Math.PI;}
  if(h.visual==='crowd')for(let i=0;i<5;i++){solid(g,cylinder,(i%2-.5)*2,1.5,-i*1.4,.5,3,.5);solid(g,sphere,(i%2-.5)*2,3.4,-i*1.4,.7,.7,.7);}
  if(h.visual==='wave'){
   const vertices=[],indices=[],nx=120,ny=35;
   for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const y=j/ny*95,x=(i/nx-.5)*360;vertices.push(x,y,Math.sin(j/ny*Math.PI)*14-j/ny*j/ny*30);}
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=((i+.5)/nx-.5)*360,y=(j+.5)/ny*95;if(Math.abs(x-h.gap)<h.opening&&y<6)continue;const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));// Close the back and every exposed boundary, including the escape tunnel.
   const n=vertices.length/3,front=[...indices],edges=new Map();for(let i=0;i<front.length;i+=3)for(const [a,b]of [[front[i],front[i+1]],[front[i+1],front[i+2]],[front[i+2],front[i]]]){const key=Math.min(a,b)+':'+Math.max(a,b);const e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1});}
   for(let i=0;i<n;i++)vertices.push(vertices[i*3],vertices[i*3+1],vertices[i*3+2]-10);
   for(let i=0;i<front.length;i+=3)indices.push(front[i+2]+n,front[i+1]+n,front[i]+n);
   for(const {a,b,count}of edges.values())if(count===1)indices.push(a,b,a+n,b,b+n,a+n);
   geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
   // Render the full 3D wave as a surface; vertex point-cloud overdraw cost
   // thousands of fragments and obscured the physically recognizable crest.
   const water=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:0x85122b,metalness:0,roughness:.21,clearcoat:.8,clearcoatRoughness:.12,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:true}));water.name='gyuwon-gold-wave-surface';g.add(water);const opening=solid(g,ring,h.gap,2.5,0,h.opening,2.7,1);opening.material=new THREE.MeshBasicMaterial({color:0xffedab});
  }
  attacks.set(h.id,g);return g;
 }
 const sharedGeometries=new Set([cube,sphere,cylinder,ring]),sharedMaterials=new Set([gold,dust]);
 function releaseAttack(id,group){
  group.removeFromParent();
  const geometries=new Set(),materials=new Set();
  group.traverse(o=>{
   if(o.geometry&&!sharedGeometries.has(o.geometry))geometries.add(o.geometry);
   if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material])
    if(!sharedMaterials.has(mat))materials.add(mat);
  });
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
  attacks.delete(id);
 }
 function clear(){
  for(const [id,group] of attacks)releaseAttack(id,group);
 }
 return {update(g,dt,death){const s=g.gyuwon,b=g.boss,won=g.status==='won';root.visible=b.phase===3||won;for(const[name,v]of groups){v.visible=!won&&name===s.stageMemory;if(v.visible){const build=Math.min(1,Math.max(.08,s.stageTime)/.35);v.position.y=(1-build)*-5;v.traverse(o=>{if(o.userData.baseOpacity!==undefined)o.material.opacity=o.userData.baseOpacity*build;});}};if(writingShader)writingShader.uniforms.writing.value=Math.min(1,Math.max(.05,s.t/3));roll.rotation.y=g.time*.6;streamPoints.rotation.y=g.time*.04;streamPoints.position.y=won?death*10:0;streamPoints.visible=b.phase===3||won;
  const live=new Set();for(const h of s.hazards){if(!h.visual)continue;live.add(h.id);const v=attacks.get(h.id)||make(h),p=hazardPosition(h),active=h.age>=h.warn;v.visible=b.phase===3;
   v.position.set(p.x,0,p.z);v.rotation.y=h.yaw||0;
   if(h.visual==='sword'){v.position.set(h.x,0,h.z);v.rotation.set(0,h.yaw||0,Math.max(0,1-h.age/h.warn)*-.9);}
   if(h.visual==='ball'){v.position.y=h.r;v.rotation.x=-g.time*3;}
   if(h.visual==='dice'){v.position.y=active?3.5:3.5+Math.max(0,1-h.age/h.warn)*100;v.rotation.set(g.time,g.time*.7,0);}
   if(h.visual==='wave'){v.position.set(0,0,h.z+Math.max(0,h.age-h.warn)*h.speed);}
  }
  // Expired hazards must release geometry immediately, even while another
  // patterned strike is still active. Otherwise each pattern grows GPU memory.
  for(const[id,v]of attacks)if(!live.has(id))releaseAttack(id,v);
 },clear,stats:()=>({liveAttackGroups:attacks.size}),dispose(){clear();tex.dispose();}};
}
