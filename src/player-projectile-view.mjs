import * as THREE from 'three';
import {runThreeStartup} from './runtime/three-startup.mjs';
import {loft,plate,beam,addMesh,mergeRigid,mergeTinted} from './player-geometry.mjs';

export function createPlayerProjectileView(sceneOrNamespace,parent=null){
 const scene=parent||sceneOrNamespace,namespace=parent?sceneOrNamespace:THREE;
 return runThreeStartup(namespace,T=>{
  const root=new T.Group();root.name='shared-player-projectiles';scene.add(root);
  const wood=new T.MeshStandardMaterial({color:0x78502e,roughness:.72}),metal=new T.MeshStandardMaterial({color:0xe2e7e9,metalness:.67,roughness:.30}),gold=new T.MeshStandardMaterial({color:0xc7a461,metalness:.68,roughness:.40});
  const ivory=new T.MeshStandardMaterial({color:0xf0e8cd,roughness:.65,side:T.DoubleSide}),ink=new T.MeshStandardMaterial({color:0x61293a,roughness:.55});
  const flightMat=new T.MeshStandardMaterial({vertexColors:true,color:0xffffff,metalness:.26,roughness:.5}),glow=new T.MeshStandardMaterial({vertexColors:true,color:0xffffff,metalness:.26,roughness:.38,emissive:0x337966,emissiveIntensity:.7}),waveMat=new T.MeshBasicMaterial({color:0xa4dcf4,transparent:true,opacity:.64,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
  const arrow=new T.Group();
  addMesh(T,arrow,loft(T,[[-.48,.018,.018],[.43,.018,.018]],6,'z'),wood,'player-arrow-shaft');
  addMesh(T,arrow,loft(T,[[.43,.065,.032],[.65,.001,.001]],4,'z'),metal,'player-arrow-forged-head');
  for(let i=0;i<3;i++){const g=plate(T,[[0,0],[.075,.07],[.06,.23],[0,.27]],.007);g.rotateX(Math.PI/2);g.rotateZ(i*Math.PI*2/3);addMesh(T,arrow,g,ivory,'player-arrow-fletching',0,0,-.46);}
  mergeRigid(T,arrow);
  const card=new T.Group(),face=plate(T,[[-.15,-.22],[.15,-.22],[.15,.22],[-.15,.22]],.018);face.rotateX(-Math.PI/2);addMesh(T,card,face,ivory,'player-flying-card');
  const suit=plate(T,[[0,.10],[.07,0],[0,-.10],[-.07,0]],.008);suit.rotateX(-Math.PI/2);addMesh(T,card,suit,ink,'player-card-suit',0,.02,0);
  addMesh(T,card,beam(T,[[-.13,.016,-.20,.007],[-.13,.016,.20,.007],[.13,.016,.20,.007],[.13,.016,-.20,.007],[-.13,.016,-.20,.007]],4),gold,'player-card-inlaid-border');
  mergeTinted(T,arrow,flightMat);mergeTinted(T,card,flightMat);
  // The projectile really is a returning 3D hammer, never an arrow proxy.
  const flyingHammer=new T.Group();flyingHammer.name='player-returning-hammer';
  const hHandle=new T.Mesh(new T.CylinderGeometry(.065,.073,1.55,10),wood);
  hHandle.rotation.x=Math.PI/2;flyingHammer.add(hHandle);
  const hHead=new T.Mesh(new T.BoxGeometry(.84,.45,.48),metal);
  hHead.position.z=.67;flyingHammer.add(hHead);
  for(const side of [-1,1]){
   const band=new T.Mesh(new T.BoxGeometry(.075,.47,.51),gold);
   band.position.set(side*.30,0,.67);flyingHammer.add(band);
  }
  // Markers follow the boss' visible position, with fixed geometry budgets.
  const sigilRoot=new T.Group();sigilRoot.name='card-three-hit-sigil';scene.add(sigilRoot);
  const sigilMat=new T.MeshBasicMaterial({color:0xf5d28f,transparent:true,opacity:.86,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
  const sigilPieces=[];
  for(let i=0;i<3;i++){
   const marker=new T.Mesh(new T.RingGeometry(.6,.73,18,1,i*Math.PI*2/3,1.83),sigilMat);
   marker.visible=false;sigilRoot.add(marker);sigilPieces.push(marker);
  }
  sigilRoot.visible=false;
  const burnRoot=new T.Group();burnRoot.name='player-bow-ignition';scene.add(burnRoot);
  const burnMat=new T.MeshBasicMaterial({color:0xff6d20,transparent:true,opacity:.66,depthWrite:false});
  for(let i=0;i<4;i++){const flame=new T.Mesh(new T.ConeGeometry(.20,.9,7),burnMat);
   flame.position.set(Math.sin(i*1.57)*.65,0,Math.cos(i*1.57)*.65);burnRoot.add(flame);}
  burnRoot.visible=false;
  const p=[],uv=[],indices=[];
  for(let i=0;i<=28;i++){const a=-Math.PI*.70+i/28*Math.PI*1.4;for(const r of [.88,1.0]){p.push(Math.sin(a)*r,Math.cos(a)*r,0);uv.push(i/28,r);}if(i){const k=i*2;indices.push(k-2,k-1,k,k,k-1,k+1);}}
  const waveGeo=new T.BufferGeometry();waveGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));waveGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));waveGeo.setIndex(indices);waveGeo.computeVertexNormals();const wave=new T.Mesh(waveGeo,waveMat);
  const flameShape=new T.ConeGeometry(.12,.62,6),
    flameMaterial=new T.MeshBasicMaterial({color:0xff9a25,transparent:true,opacity:.88,depthWrite:false});
  const fireMat=new T.MeshStandardMaterial({vertexColors:true,color:0xffa553,metalness:.12,roughness:.48,emissive:0xe84b08,emissiveIntensity:.85});
  const active=new Map(),pools=new Map(),resources=new Set([wood,metal,gold,ivory,ink,flightMat,glow,fireMat,flameShape,flameMaterial,waveMat,sigilMat,burnMat]);
  for(const template of [arrow,card,wave,flyingHammer,sigilRoot,burnRoot])template.traverse(o=>{if(o.geometry)resources.add(o.geometry);});
  let disposed=false,time=0,allocated=0,owner=null;
  function clear(){sigilRoot.visible=false;burnRoot.visible=false;for(const entry of active.values()){root.remove(entry.node);const pool=pools.get(entry.key)||[];pool.push(entry.node);pools.set(entry.key,pool);}active.clear();time=0;owner=null;}
  function update(input,dt=0){if(disposed)return;const game=Array.isArray(input)?null:input,list=game?.projectiles??input??[];if(game&&owner!==game){clear();owner=game;}time=game?game.time||0:time+Math.max(0,dt);const seen=new Set();
   for(const q of list){
    if(q.life!==undefined&&!(q.life>0))continue;
    seen.add(q.id);let e=active.get(q.id);const key=q.kind==='hammer-throw'?'hammer-throw':q.kind==='wave'?'wave':q.kind==='cards'?'cards':q.fireRank>0?'fire-arrow':q.piercing||q.skill?'piercing':'bow';
    if(e&&e.key!==key){root.remove(e.node);const pool=pools.get(e.key)||[];pool.push(e.node);pools.set(e.key,pool);active.delete(q.id);e=null;}
    if(!e){const pool=pools.get(key);let node=pool?.pop();if(!node){if(allocated>=128){let recycled=false;for(const spare of pools.values())if(spare.length){spare.pop();allocated--;recycled=true;break;}if(!recycled)continue;}node=(key==='hammer-throw'?flyingHammer:key==='cards'?card:key==='wave'?wave:arrow).clone(true);allocated++;if(key==='piercing'||key==='fire-arrow')node.traverse(o=>{if(o.isMesh)o.material=key==='fire-arrow'?fireMat:glow;});if(key==='fire-arrow')for(const side of[-1,1]){const flame=new T.Mesh(flameShape,flameMaterial);flame.name='player-fire-arrow-flame';flame.position.set(side*.13,.16,-.28);flame.rotation.x=Math.PI/2;node.add(flame);}}e={key,node};active.set(q.id,e);root.add(node);}
    const node=e.node;node.position.set(q.x,Number.isFinite(q.y)?q.y:q.kind==='wave'?.25:1.2,q.z);node.rotation.set(key==='hammer-throw'?time*16:key==='wave'&&(q.y??.25)<.4?-Math.PI/2:0,q.yaw||0,key==='cards'?time*10+(q.id||0):0);node.scale.setScalar(key==='hammer-throw'?1.25:q.skill?1.20:q.fireRank>0?1.14:q.piercing?1.10:1);
   }
   sigilRoot.visible=Boolean(game?.weapon==='cards'&&game?.status==='playing'&&game.player?.skill?.sigilMarks>0);
   if(sigilRoot.visible){
    const n=game.player.skill.sigilMarks;
    sigilRoot.position.set(game.boss.x,game.dice?.giant?(game.dice.pose?.y||5)+2:game.blood?2.5:3.4,game.boss.z);
    sigilRoot.rotation.y=time*.4;
    for(let i=0;i<3;i++)sigilPieces[i].visible=i<n;
   }
   burnRoot.visible=Boolean(game?.weapon==='bow'&&game?.status==='playing'&&game.weaponBurnStacks?.length);
   if(burnRoot.visible){
    burnRoot.position.set(game.boss.x,game.dice?.giant?(game.dice.pose?.y||5)+1:game.blood?1.8:2.5,game.boss.z);
    burnRoot.scale.y=.85+.18*Math.sin(time*11);
   }
   for(const[id,e]of active)if(!seen.has(id)){root.remove(e.node);const pool=pools.get(e.key)||[];pool.push(e.node);pools.set(e.key,pool);active.delete(id);}
  }
  function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);sigilRoot.parent?.remove(sigilRoot);burnRoot.parent?.remove(burnRoot);pools.clear();for(const r of resources)r.dispose();resources.clear();}
  return {root,update,clear,dispose,stats:()=>({active:active.size,allocated,capacity:128})};
 });
}
