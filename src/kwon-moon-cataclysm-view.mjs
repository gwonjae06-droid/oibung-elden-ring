import * as THREE from 'three';
import {moonPosition,moonCinematicPose,moonMeteorProgress,moonMeteorHeight,KWON_MOON} from './kwon-moon-cataclysm.mjs';
import {createFracturedMeteorGeometry,createSplitMoonBandGeometry,createCelestialJawBladeGeometry} from './kwon-lunar-sculpture.mjs';
const sat=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=sat(n);return n*n*(3-2*n);};
const TAU=Math.PI*2;

// All visible stones are pooled, intentionally asymmetric solid 3D slabs.
// The gameplay-owned target position, hit radius and impact timestamp also
// drive the growing *natural shadow*. No secondary collider is ever created.
export function createKwonMoonCataclysmView(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-moon-3d-meteor-cataclysm';scene.add(root);
 const lunar=moonPosition(),geometries=[],materials=[];
 const ownGeo=g=>{geometries.push(g);return g;};
 const ownMat=m=>{materials.push(m);return m;};
 const surface=ownMat(new THREE.MeshStandardMaterial({color:0xa6a7ab,roughness:.99,metalness:.025,flatShading:true,side:THREE.DoubleSide}));
 const incision=ownMat(new THREE.MeshStandardMaterial({color:0x46424c,roughness:.96,metalness:.05,flatShading:true,side:THREE.DoubleSide,
  emissive:0x392631,emissiveIntensity:.20}));
 const meteorStone=ownMat(new THREE.MeshStandardMaterial({color:0x8e9198,roughness:.96,flatShading:true,side:THREE.DoubleSide}));
 const meteorInside=ownMat(new THREE.MeshStandardMaterial({color:0x4a4650,roughness:.98,flatShading:true,side:THREE.DoubleSide,
  emissive:0x512e3b,emissiveIntensity:.32}));
 const dustMat=ownMat(new THREE.MeshBasicMaterial({color:0x9d797c,transparent:true,opacity:.68,depthWrite:false}));
 const ember=ownMat(new THREE.MeshBasicMaterial({color:0xe1aaa5,transparent:true,opacity:.82,depthWrite:false,
  blending:THREE.AdditiveBlending}));
 const coronaMat=ownMat(new THREE.MeshBasicMaterial({color:0x9d829c,transparent:true,opacity:.15,depthWrite:false,
  blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 const cutMat=ownMat(new THREE.MeshBasicMaterial({color:0xffd4ce,transparent:true,opacity:.52,depthWrite:false,
  blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 const craterMat=ownMat(new THREE.MeshBasicMaterial({color:0x68636d,transparent:true,opacity:.34,depthWrite:false,
  side:THREE.DoubleSide}));
 const shadowBase=ownMat(new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{strength:{value:.5}},
  vertexShader:'varying vec2 tex; void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 tex;uniform float strength;void main(){float r=length((tex-.5)*2.0);float core=1.0-smoothstep(.77,.83,r);float soft=1.0-smoothstep(.82,1.0,r);float alpha=(.73*core+.27*soft)*strength;gl_FragColor=vec4(.055,.037,.041,alpha);}'
 }));
 const scarMat=ownMat(new THREE.MeshBasicMaterial({color:0x917074,transparent:true,opacity:.5,depthWrite:false,
  side:THREE.DoubleSide}));
 const bladeMetal=ownMat(new THREE.MeshPhysicalMaterial({color:0xc6c2ca,metalness:.91,roughness:.23,
  emissive:0x5d3447,emissiveIntensity:.62,clearcoat:.64,flatShading:true,side:THREE.DoubleSide}));
 const bladeInterior=ownMat(new THREE.MeshStandardMaterial({color:0x3e3542,metalness:.72,roughness:.38,
  emissive:0x70465a,emissiveIntensity:.7,side:THREE.DoubleSide}));

 // The original third-act moon billboard is deliberately hidden by the
 // environment, so these FOUR SOLID sections replace it in exactly that spot.
 const moonAssembly=new THREE.Group();moonAssembly.name='kwon-sliced-solid-cratered-moon';
 moonAssembly.position.set(lunar.x,lunar.y,lunar.z);
 moonAssembly.rotation.set(-.08,-.19,.14);root.add(moonAssembly);
 const bounds=[-9.2,-3.2,1.5,5.4,9.2],moonSections=[];
 for(let i=0;i<4;i++){
  const geometry=ownGeo(createSplitMoonBandGeometry(THREE,{radius:9.2,bottom:bounds[i],top:bounds[i+1],coarse,variant:i}));
  const mesh=new THREE.Mesh(geometry,[surface,incision]);mesh.name='kwon-actual-separated-moon-rock-section';
  mesh.castShadow=!coarse;mesh.receiveShadow=true;moonAssembly.add(mesh);moonSections.push(mesh);
 }
 const craterGeo=ownGeo(new THREE.CircleGeometry(1,coarse?10:18));
 const front=new THREE.Vector3(0,0,1);
 for(let i=0;i<4;i++)for(let j=0;j<(coarse?2:4);j++){
  const y=bounds[i]+(bounds[i+1]-bounds[i])*(.27+.52*((j+.25)/4));
  const x=Math.sin((i*5+j+1)*2.13)*Math.sqrt(Math.max(0,9.2*9.2-y*y))*.52;
  const z=Math.sqrt(Math.max(1,9.2*9.2-y*y-x*x));
  const crater=new THREE.Mesh(craterGeo,craterMat);
  crater.name='kwon-moon-real-surface-crater';crater.position.set(x,y,z+.06);
  crater.quaternion.setFromUnitVectors(front,new THREE.Vector3(x,y,z).normalize());
  crater.scale.setScalar(.4+((i+j)%4)*.26);
  moonSections[i].add(crater);
 }
 const corona=new THREE.Mesh(ownGeo(new THREE.RingGeometry(9.65,12.7,coarse?32:64)),coronaMat);
 corona.name='kwon-moon-backlit-atmospheric-corona';corona.position.z=-3;
 moonAssembly.add(corona);
 const cutRims=[];
 for(let i=0;i<3;i++){
  const r=Math.sqrt(9.2*9.2-bounds[i+1]*bounds[i+1]);
  const glow=new THREE.Mesh(ownGeo(new THREE.TorusGeometry(r,.11,4,coarse?22:42)),cutMat.clone());
  ownMat(glow.material);glow.rotation.x=Math.PI/2;glow.position.y=bounds[i+1];
  glow.name='kwon-lunar-physical-fracture-edge';moonAssembly.add(glow);cutRims.push(glow);
 }
 // A blunt, tapered, asymmetric heavy jaw-sword: it has a real blade,
 // split facets and an actual hilt instead of a cone gliding across a line.
 const celestial=new THREE.Group();celestial.name='kwon-celestial-blade-three-cut-cinematic';
 const blade=new THREE.Mesh(ownGeo(createCelestialJawBladeGeometry(THREE)),[bladeMetal,bladeInterior]);
 blade.name='kwon-real-3d-moon-slicing-sword';blade.castShadow=true;celestial.add(blade);
 const handle=new THREE.Mesh(ownGeo(new THREE.CylinderGeometry(.63,.9,9.8,7)),bladeInterior);
 handle.rotation.z=Math.PI/2;handle.position.x=-17.7;celestial.add(handle);
 const cross=new THREE.Mesh(ownGeo(new THREE.BoxGeometry(1.5,8.5,2.1)),bladeMetal);
 cross.position.x=-13.2;cross.rotation.z=.13;celestial.add(cross);
 root.add(celestial);
 const debrisGeo=ownGeo(new THREE.TetrahedronGeometry(.85,0));
 const debris=[];
 for(let i=0;i<(coarse?11:23);i++){
  const chip=new THREE.Mesh(debrisGeo,i%4?surface:meteorInside);
  chip.name='kwon-three-cuts-celestial-moon-debris';moonAssembly.add(chip);
  debris.push(chip);
 }
 const flash=new THREE.PointLight(0xf4c5bc,0,36,2);flash.name='kwon-moon-sword-contact-light';
 moonAssembly.add(flash);

 // Massive, fractured and elongated 3D meteor slabs; the impact radius is
 // NOT scaled independently of their silhouette or their cast shadow.
 const meteorGeometry=[0,1,2].map(i=>ownGeo(createFracturedMeteorGeometry(THREE,{variant:i,coarse})));
 const shadowGeo=ownGeo(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2));
 const shockGeo=ownGeo(new THREE.RingGeometry(1,1.18,coarse?20:36).rotateX(-Math.PI/2));
 const rubbleGeo=ownGeo(new THREE.TetrahedronGeometry(.87,0));
 const meteorPool=[];
 for(let i=0;i<KWON_MOON.maxMeteors;i++){
  const group=new THREE.Group();group.name='kwon-moon-falling-3d-piece';root.add(group);
  const body=new THREE.Mesh(meteorGeometry[i%3],[meteorStone,meteorInside]);
  body.name='kwon-lunar-3d-faceted-meteor';body.castShadow=!coarse;body.receiveShadow=true;group.add(body);
  const fault=new THREE.Mesh(debrisGeo,meteorInside);fault.name='kwon-meteor-real-cleaved-rock-core';
  fault.position.set(.75,2.0,.5);fault.scale.set(2.1,2.4,1.1);body.add(fault);
  const scraps=[];
  for(let j=0;j<(coarse?2:5);j++){
   const fragment=new THREE.Mesh(rubbleGeo,j%3?meteorInside:meteorStone);
   fragment.name='kwon-meteor-3d-loose-plates';group.add(fragment);scraps.push(fragment);
  }
  const shadow=new THREE.Mesh(shadowGeo,shadowBase.clone());
  ownMat(shadow.material);shadow.name='kwon-natural-growing-meteor-shadow';shadow.renderOrder=4;root.add(shadow);
  const scar=new THREE.Mesh(shockGeo,scarMat.clone());ownMat(scar.material);
  scar.name='kwon-physical-3d-impact-dust-ring';scar.renderOrder=5;root.add(scar);
  const rubble=[];
  for(let j=0;j<(coarse?5:9);j++){
   const piece=new THREE.Mesh(rubbleGeo,j%3===0?meteorInside:meteorStone);
   piece.name='kwon-meteor-ground-3d-fragments';root.add(piece);rubble.push(piece);
  }
  meteorPool.push({group,body,scraps,shadow,scar,rubble});
 }
 let lastGame=null,disposed=false;
 function reset(){
  for(const o of meteorPool){
   o.group.visible=o.shadow.visible=o.scar.visible=false;
   for(const q of o.rubble)q.visible=false;
  }
  celestial.visible=false;flash.intensity=0;
  for(const d of debris)d.visible=false;
  for(const c of cutRims)c.visible=false;
 }
 function update(g){
  if(disposed)return;
  if(g!==lastGame){reset();lastGame=g;}
  const state=g?.kwonMoon;
  root.visible=Boolean(g?.boss?.phase===3&&state?.triggered);
  if(!root.visible)return;
  const t=state.mode==='cinematic'?state.time:KWON_MOON.cinematic;
  const pose=moonCinematicPose(t);
  const cut=pose.cuts.map(q=>q.stroke);
  moonSections.forEach((section,i)=>{
   const first=cut[0],second=cut[1],third=cut[2],release=pose.fragmentRelease;
   const y=[-2.0*first,-.65*first-.7*second,.4*second+.65*third,1.9*third][i];
   section.position.set((i-1.5)*release*.75,y,release*(i-1.5)*.4);
   section.rotation.set((i-1.5)*release*.021,0,(i-1.5)*release*.038);
  });
  flash.intensity=reduced?pose.lightPulse*24:pose.lightPulse*95;
  coronaMat.opacity=.13+pose.fracture*.17+pose.lightPulse*.25;
  incision.emissiveIntensity=.18+pose.lightPulse*1.45;
  cutRims.forEach((ring,i)=>{
   ring.visible=pose.cuts[i].stroke>.005;
   ring.material.opacity=.22+.47*pose.cuts[i].intensity+.22*pose.fragmentRelease;
   ring.scale.setScalar(1+.014*Math.sin(t*8+i));
  });
  celestial.visible=state.mode==='cinematic'&&pose.cuts.some(c=>c.wind>.015&&c.stroke<1);
  if(celestial.visible){
   const active=pose.cuts.find(c=>c.wind>.015&&c.stroke<1)||pose.cuts.at(-1);
   const index=active.index;
   celestial.position.set(lunar.x-11,lunar.y+(index-1)*4.1,lunar.z+6.4);
   celestial.rotation.set(.04,index%2?.11:-.09,(index%2?-1:1)*(-.64+active.stroke*2.12));
   celestial.scale.setScalar(.94+.12*active.wind);
  }
  debris.forEach((piece,i)=>{
   const p=pose.fragmentRelease,angle=i*2.399963;
   piece.visible=p>.004;
   const rad=3+(i%4)*.6+14*p;
   piece.position.set(Math.sin(angle)*rad,
    Math.cos(angle*1.2)*3.3+(i%3-1)*2.1+Math.sin(p*Math.PI)*2.7,
    Math.cos(angle)*rad*.58+4*p);
   piece.rotation.set(i*.23+p*i*.41,p*i*.32,i*.18+p*i*.65);
   piece.scale.setScalar(.32+(i%5)*.21+p*.25);
  });
  const list=state.meteors||[];
  for(let i=0;i<meteorPool.length;i++){
   const o=meteorPool[i],h=list[i];
   o.group.visible=o.shadow.visible=o.scar.visible=false;
   for(const stone of o.rubble)stone.visible=false;
   if(!h)continue;
   const p=moonMeteorProgress(h),landed=h.landed,impactAge=h.age-h.impact;
   o.group.visible=!landed;
   // Descend slowly while drifting gently into the EXACT warned x/z site.
   const drift=(1-smooth(p));
   o.group.position.set(h.x+Math.sin(h.id*2.1)*4.5*drift,
    moonMeteorHeight(h),
    h.z+Math.cos(h.id*1.7)*3.7*drift);
   o.body.scale.set(h.radius*1.02,3.4,h.radius*1.02);
   o.body.rotation.set(.045*Math.sin(h.id+2*p),i*.7+p*.25,.035*Math.cos(i+3*p));
   o.scraps.forEach((plate,j)=>{
    plate.visible=!landed;
    plate.position.set(Math.sin(j*2.1+i)*h.radius*.68,5.8+j*.56,
     Math.cos(j*2.1+i)*h.radius*.56);
    plate.rotation.set(i*.4+j*.63,p*.9+j*.4,j*.5);
    plate.scale.setScalar(.68+(j%3)*.32);
   });
   o.shadow.visible=!landed;
   o.shadow.position.set(h.x,.14,h.z);
   // The inner dark edge is radius h.radius, identical to the hitbox.
   o.shadow.scale.set(h.radius*1.25,1,h.radius*1.25);
   o.shadow.userData.collisionRadius=h.radius;
   o.shadow.material.uniforms.strength.value=(.58+.34*smooth(p))*(reduced?.9:1);
   o.scar.visible=landed&&impactAge<1.15;
   o.scar.position.set(h.x,.21,h.z);
   o.scar.scale.setScalar(h.radius*(1+.42*smooth(impactAge/1.1)));
   o.scar.material.opacity=.64*(1-sat(impactAge/1.15));
   o.rubble.forEach((rock,j)=>{
    const a=j*2.399963+i*.62,age=Math.max(0,impactAge);
    rock.visible=landed&&age<1.15;
    const spread=h.radius*.65+age*10;
    rock.position.set(h.x+Math.sin(a)*spread,
     .46+Math.sin(sat(age/1.15)*Math.PI)*3.5-age*age*2.7,
     h.z+Math.cos(a)*spread);
    rock.rotation.set(age*(j+1)*2.1,age*(j+2),age*j);
    rock.scale.setScalar(.9+(j%3)*.56);
   });
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;reset();root.removeFromParent();
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
 }
 reset();
 return {root,update,reset,dispose,stats:()=>({
  pooled:meteorPool.length,maxRocks:KWON_MOON.maxMeteors*(coarse?5:9),
  slashBeats:3,moonSections:moonSections.length,collisionSources:0
 })};
}
