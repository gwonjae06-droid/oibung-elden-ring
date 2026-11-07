import * as THREE from 'three';
import {moonPosition,moonCinematicPose,KWON_MOON} from './kwon-moon-cataclysm.mjs';
const sat=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=sat(v);return v*v*(3-2*v);};
// All meteors and moon wounds are 3D, prebuilt and pooled; the gameplay module
// owns the only hitbox, and every rendered contact uses its fixed x/z and time.
export function createKwonMoonCataclysmView(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-moon-3d-meteor-cataclysm';scene.add(root);
 const moon=moonPosition(),geo=new THREE.DodecahedronGeometry(3.0,coarse?0:2);
 const chipGeo=new THREE.TetrahedronGeometry(.67,coarse?0:1);
 const stone=new THREE.MeshStandardMaterial({color:0x999ca3,roughness:.96,metalness:.04,flatShading:true,
  emissive:0x3a2733,emissiveIntensity:.10});
 const inner=new THREE.MeshStandardMaterial({color:0x414148,roughness:.91,emissive:0x552b42,emissiveIntensity:.28});
 const burn=new THREE.MeshBasicMaterial({color:0xce746c,transparent:true,opacity:.68,depthWrite:false});
 const shadowMat=new THREE.MeshBasicMaterial({color:0x180e19,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
 const scarGeo=new THREE.TorusGeometry(3.45,.16,6,coarse?14:30);
 const shadeGeo=new THREE.CircleGeometry(4.0,coarse?20:44).rotateX(-Math.PI/2);
 const meteorPool=[];
 for(let i=0;i<KWON_MOON.maxMeteors;i++){
  const group=new THREE.Group();group.name='kwon-moon-falling-3d-piece';root.add(group);
  const body=new THREE.Mesh(geo,stone);body.name='kwon-lunar-3d-faceted-meteor';group.add(body);
  const cortex=new THREE.Mesh(chipGeo,inner);cortex.name='kwon-moon-3d-exposed-crust';
  cortex.position.set(.96,.8,2.4);cortex.scale.set(1.5,1.4,.8);body.add(cortex);
  for(let k=0;k<4;k++){const shard=new THREE.Mesh(chipGeo,inner);
   shard.position.set(Math.sin(k*1.97)*2.2,Math.cos(k*2.4)*1.55,Math.cos(k*1.97)*1.7);
   shard.rotation.set(k*.38,k*.29,k*.56);shard.scale.set(.7,.9,.8);body.add(shard);}
  const shadow=new THREE.Mesh(shadeGeo,shadowMat);shadow.name='kwon-natural-growing-meteor-shadow';
  root.add(shadow);
  const scar=new THREE.Mesh(scarGeo,burn);scar.name='kwon-3d-impact-scar';scar.rotation.x=Math.PI/2;
  root.add(scar);
  const rubble=[];
  for(let k=0;k<(coarse?3:6);k++){
   const rock=new THREE.Mesh(chipGeo,stone);rock.name='kwon-meteor-ground-3d-fragments';root.add(rock);rubble.push(rock);
  }
  meteorPool.push({group,body,shadow,scar,rubble});
 }
 // Slashes cut the distant moon itself, not the screen. Each blade is aligned
 // with one of the three authored timing beats.
 const slashGeo=new THREE.BoxGeometry(23,.24,.24);
 const slashMat=new THREE.MeshStandardMaterial({color:0xd2b5b3,emissive:0xbc6278,emissiveIntensity:2.6,
  transparent:true,opacity:.68,depthWrite:false});
 const slashes=[];
 for(let i=0;i<3;i++){
  const mesh=new THREE.Mesh(slashGeo,slashMat.clone());
  mesh.name='kwon-distant-moon-thrice-sliced-3d-blade-scar';
  mesh.position.set(moon.x,moon.y+(i-1)*2.4,moon.z);
  mesh.rotation.set(.24+(i%2)*.2,-.15,i%2===0?.48:-.42);
  root.add(mesh);slashes.push(mesh);
 }
 // A few persistent detached lunar slabs show what becomes the falling rocks.
 const detached=[];
 for(let i=0;i<7;i++){
  const mesh=new THREE.Mesh(chipGeo,stone);mesh.name='kwon-lunar-3d-cut-fragment';
  mesh.scale.setScalar(2+(i%3)*.65);root.add(mesh);detached.push(mesh);
 }
 let lastGame=null,disposed=false;
 function reset(){
  for(const o of meteorPool){o.group.visible=o.shadow.visible=o.scar.visible=false;
   for(const rock of o.rubble)rock.visible=false;}
  for(const obj of [...slashes,...detached])obj.visible=false;
 }
 function update(g){
  if(disposed)return;
  if(g!==lastGame){reset();lastGame=g;}
  const m=g?.kwonMoon;
  root.visible=Boolean(g?.boss?.phase===3&&m?.triggered);
  if(!root.visible)return;
  const cuts=moonCinematicPose(m.mode==='cinematic'?m.time:KWON_MOON.cinematic);
  for(let i=0;i<slashes.length;i++){
   const s=cuts.cuts[i],mesh=slashes[i];mesh.visible=s.wind>.005;
   mesh.scale.x=.1+.9*s.stroke;mesh.material.opacity=.16+.76*s.intensity;
  }
  for(let i=0;i<detached.length;i++){
   const part=detached[i],u=(i*2.399963),t=cuts.fragmentRelease;
   part.visible=t>.001;
   part.position.set(moon.x+Math.sin(u)*(4+8*t),
    moon.y+Math.cos(u*1.43)*4+Math.sin(t*Math.PI)*4*t-t*t*(i%3)*4,
    moon.z+Math.cos(u)*4*t);
   part.rotation.set(t*i*.41,t*i*.63,t*i*.35);
  }
  const list=m.meteors||[];
  for(let i=0;i<meteorPool.length;i++){
   const o=meteorPool[i],h=list[i];o.group.visible=o.shadow.visible=o.scar.visible=false;
   for(const stone of o.rubble)stone.visible=false;
   if(!h)continue;
   const p=sat(h.age/h.impact),fall=smooth(p),landed=h.landed;
   // The moon fragment travels from the visible celestial fracture to the
   // warned landing site, using the same impact time as the collision test.
   const x=moon.x+(h.x-moon.x)*fall,z=moon.z+(h.z-moon.z)*fall;
   const y=moon.y+5*(1-p)-moon.y*fall+2.4*fall;
   o.group.visible=!landed;o.group.position.set(x,y,z);
   o.body.rotation.set(h.age*.45+i*.31,h.age*.39,i*.3+h.age*.53);
   o.body.scale.setScalar(1.05+(h.index%3)*.11);
   o.shadow.visible=!landed;
   o.shadow.position.set(h.x,.075,h.z);
   o.shadow.scale.setScalar(.38+.57*smooth(p));
   o.shadow.material.opacity=.18+.44*p;
   const impactAge=h.age-h.impact;
   o.scar.visible=landed&&impactAge<1.13;
   o.scar.position.set(h.x,.17,h.z);
   o.scar.scale.setScalar(1+.26*smooth(impactAge));
   o.scar.material.opacity=.65*(1-sat(impactAge/1.1));
   for(let k=0;k<o.rubble.length;k++){
    const rock=o.rubble[k],theta=k*2.399963+i*.6,age=Math.max(0,impactAge);
    rock.visible=landed&&age<1;
    rock.position.set(h.x+Math.sin(theta)*(1.6+age*7),
     .4+Math.sin(age*Math.PI)*2.7-age*age*3,
     h.z+Math.cos(theta)*(1.6+age*7));
    rock.rotation.set(age*(k+1)*2.1,age*(k+2),age*k);
    rock.scale.setScalar(.7+(k%3)*.34);
   }
  }
 }
 function dispose(){if(disposed)return;disposed=true;reset();root.removeFromParent();
  for(const g of [geo,chipGeo,scarGeo,shadeGeo,slashGeo])g.dispose();
  for(const m of [stone,inner,burn,shadowMat,slashMat,...slashes.map(s=>s.material)])m.dispose();
 }
 reset();return {root,update,reset,dispose,stats:()=>({pooled:meteorPool.length,
  maxRocks:KWON_MOON.maxMeteors*(coarse?3:6),slashBeats:slashes.length,collisionSources:0})};
}
