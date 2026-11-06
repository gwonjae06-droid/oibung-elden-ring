import * as THREE from 'three';

// Radial circus fly-system. All mechanisms are outside the playable 26m stage;
// the metal gears, suspended bars and counterweights are pure scenery.
const sat=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const TAU=Math.PI*2;
export function clownMechanismPose(g,clock=0,impact=0,reduced=false){
 const c=g?.clown||{},phase=g?.boss?.phase||1,tilt=Math.max(-1,Math.min(1,c.vis?.tilt||0)),
  stomping=sat(c.vis?.stomp||0),feral=phase===2,sceneActive=g?.status==='playing';
 const speed=feral?1.5:.47,periodic=reduced||!sceneActive?0:Math.sin(clock*speed)*(.045+(feral?.055:0));
 return {
  swing:Math.max(-.32,Math.min(.32,periodic+tilt*.15+impact*.11)),
  gear:reduced?0:clock*(feral?.85:.26),
  chain:sat(stomping*.12+impact*.18),engaged:feral,collidable:false
 };
}
export function createClownStageMachinery(parent,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='circus-articulated-rig-machinery';root.userData.decorativeOnly=true;parent.add(root);
 const brass=new THREE.MeshStandardMaterial({color:0xb18a4e,roughness:.31,metalness:.81}),
  iron=new THREE.MeshStandardMaterial({color:0x25222b,roughness:.45,metalness:.7}),
  porcelain=new THREE.MeshStandardMaterial({color:0xdfc69b,roughness:.51,metalness:.15}),
  jewel=new THREE.MeshStandardMaterial({color:0xb43b55,roughness:.28,metalness:.35,emissive:0x3f0c21,emissiveIntensity:.23});
 const geometries=[],rigs=[],count=coarse?4:6;
 const geo=(g)=>{geometries.push(g);return g;};
 const ring=geo(new THREE.TorusGeometry(1.42,.16,coarse?6:10,coarse?20:36)),
  spoke=geo(new THREE.BoxGeometry(.15,2.6,.19)),
  barrel=geo(new THREE.CylinderGeometry(.24,.29,4.7,coarse?7:12)),
  pulley=geo(new THREE.CylinderGeometry(.72,.72,.32,coarse?10:16)),
  weight=geo(new THREE.DodecahedronGeometry(.7,0)),
  chain=geo(new THREE.CylinderGeometry(.035,.035,6.3,6));
 function make(parent,geometry,material,name,x=0,y=0,z=0){
  const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);parent.add(m);return m;
 }
 for(let i=0;i<count;i++){
  const a=(i+.5)*TAU/count,x=Math.sin(a)*31,z=Math.cos(a)*31;
  const arm=new THREE.Group();arm.name='circus-flywheel-suspension';arm.position.set(x,20.3,z);arm.rotation.y=a;root.add(arm);
  make(arm,chain,iron,'circus-tension-cable',0,2.7,0).scale.y=.8;
  const pivot=new THREE.Group();pivot.name='circus-suspended-counterweight-hinge';arm.add(pivot);
  const gear=new THREE.Group();gear.name='circus-operating-gears';pivot.add(gear);
  make(gear,ring,brass,'circus-machinery-gilded-gear',0,0,0);
  make(gear,pulley,iron,'circus-machinery-bearing',0,0,0).rotation.x=Math.PI/2;
  for(let k=0;k<6;k++){
   const tooth=make(gear,spoke,k%2?porcelain:brass,'circus-machinery-spoke');
   tooth.rotation.z=k*Math.PI/3;
  }
  for(const side of [-1,1]){
   const chainPart=make(pivot,barrel,iron,'circus-counterweight-rod',side*.9,-2.75,.14);
   chainPart.rotation.z=side*.08;
   make(pivot,weight,jewel,'circus-crimson-counterweight',side*1.14,-5.02,.17);
  }
  rigs.push({arm,pivot,gear,index:i});
 }
 let owner=null,lastTime=-Infinity,clock=0,impulse=0,disposed=false;
 function reset(){clock=0;impulse=0;for(const r of rigs){r.pivot.rotation.set(0,0,0);r.gear.rotation.set(0,0,0);}}
 function event(e){if(disposed)return;
  if(['clown-blast','clown-clap','clown-bounce','clown-dash'].includes(e?.type))impulse=Math.min(1,impulse+.34);
 }
 function update(g,dt=0){
  if(disposed||!g)return;
  const t=Number.isFinite(g.time)?g.time:0;
  if(owner!==g||t<lastTime-.05){owner=g;reset();}
  lastTime=t;
  const h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  clock+=h;
  impulse*=Math.exp(-7*h);
  const p=clownMechanismPose(g,clock,impulse,reduced);
  for(const r of rigs){
   const side=r.index%2?-1:1,scale=.65+(.35*Math.sin(r.index*2.1+clock*.6)**2);
   r.pivot.rotation.z=side*p.swing*scale;
   r.pivot.rotation.x=(reduced?0:Math.sin(clock*(p.engaged?1.6:.6)+r.index))*.025;
   r.gear.rotation.z=side*p.gear*(.8+r.index*.07);
   r.pivot.position.y=-p.chain;
  }
  jewel.emissiveIntensity=p.engaged?.4:.23;
 }
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  for(const g of geometries)g.dispose();for(const m of [brass,iron,porcelain,jewel])m.dispose();
 }
 return {root,update,event,reset,dispose,
  stats:()=>({rigs:count,collidable:false,decorativeOnly:true,additionalLights:0})};
}
