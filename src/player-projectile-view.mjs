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
  const p=[],uv=[],indices=[];
  for(let i=0;i<=28;i++){const a=-Math.PI*.70+i/28*Math.PI*1.4;for(const r of [.88,1.0]){p.push(Math.sin(a)*r,Math.cos(a)*r,0);uv.push(i/28,r);}if(i){const k=i*2;indices.push(k-2,k-1,k,k,k-1,k+1);}}
  const waveGeo=new T.BufferGeometry();waveGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));waveGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));waveGeo.setIndex(indices);waveGeo.computeVertexNormals();const wave=new T.Mesh(waveGeo,waveMat);
  const fireMat=new T.MeshStandardMaterial({vertexColors:true,color:0xffa553,metalness:.12,roughness:.48,emissive:0xe84b08,emissiveIntensity:.85});
  const active=new Map(),pools=new Map(),resources=new Set([wood,metal,gold,ivory,ink,flightMat,glow,fireMat,waveMat]);
  for(const template of [arrow,card,wave])template.traverse(o=>{if(o.geometry)resources.add(o.geometry);});
  let disposed=false,time=0,allocated=0,owner=null;
  function clear(){for(const entry of active.values()){root.remove(entry.node);const pool=pools.get(entry.key)||[];pool.push(entry.node);pools.set(entry.key,pool);}active.clear();time=0;owner=null;}
  function update(input,dt=0){if(disposed)return;const game=Array.isArray(input)?null:input,list=game?.projectiles??input??[];if(game&&owner!==game){clear();owner=game;}time=game?game.time||0:time+Math.max(0,dt);const seen=new Set();
   for(const q of list){
    if(q.life!==undefined&&!(q.life>0))continue;
    seen.add(q.id);let e=active.get(q.id);const key=q.kind==='wave'?'wave':q.kind==='cards'?'cards':q.fireRank>0?'fire-arrow':q.piercing||q.skill?'piercing':'bow';
    if(e&&e.key!==key){root.remove(e.node);const pool=pools.get(e.key)||[];pool.push(e.node);pools.set(e.key,pool);active.delete(q.id);e=null;}
    if(!e){const pool=pools.get(key);let node=pool?.pop();if(!node){if(allocated>=128){let recycled=false;for(const spare of pools.values())if(spare.length){spare.pop();allocated--;recycled=true;break;}if(!recycled)continue;}node=(key==='cards'?card:key==='wave'?wave:arrow).clone(true);allocated++;if(key==='piercing'||key==='fire-arrow')node.traverse(o=>{if(o.isMesh)o.material=key==='fire-arrow'?fireMat:glow;});}e={key,node};active.set(q.id,e);root.add(node);}
    const node=e.node;node.position.set(q.x,Number.isFinite(q.y)?q.y:q.kind==='wave'?.25:1.2,q.z);node.rotation.set(key==='wave'&&(q.y??.25)<.4?-Math.PI/2:0,q.yaw||0,key==='cards'?time*10+(q.id||0):0);node.scale.setScalar(q.skill?1.20:q.fireRank>0?1.14:q.piercing?1.10:1);
   }
   for(const[id,e]of active)if(!seen.has(id)){root.remove(e.node);const pool=pools.get(e.key)||[];pool.push(e.node);pools.set(e.key,pool);active.delete(id);}
  }
  function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);pools.clear();for(const r of resources)r.dispose();resources.clear();}
  return {root,update,clear,dispose,stats:()=>({active:active.size,allocated,capacity:128})};
 });
}
