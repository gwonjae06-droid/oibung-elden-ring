// All geometry here is scenery. The actual expanding shockwave collision
// comes solely from dice-giant.mjs and uses the same authored radius/time.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const TABLE_RUIN_SLOTS=Object.freeze([13,14,15]);
export function tableRuinState(game){
 const s=game?.dice?.giant,feral=s?.temperament==='feral';
 if(!feral)return {feral:false,slot:-1,spin:0,breakPower:0,waves:[]};
 const slot=s?.state==='attack'&&TABLE_RUIN_SLOTS.includes(s.slot)?s.slot:-1;
 const age=Math.max(0,s?.t||0),strength=slot<0?0:ease(age/.65);
 const spin=slot===13?2.5*strength:slot===15?3.4*strength:slot===14?.48*strength:0;
 const waves=slot<0?[]:(s.hazards||[]).filter(h=>h.tableShock&&!h.cancelled)
  .map(h=>{
   const time=age-h.start,charge=clamp(time/Math.max(.1,h.warn)),
    live=time>=h.warn&&time<=h.warn+h.active,progress=clamp((time-h.warn)/h.active);
   return {id:h.id,visible:time>=0&&time<=h.warn+h.active,
    live,r:live?(h.reverse?1-progress:progress)*62:(h.reverse?62:2),
    opacity:live?.78:.14+.22*charge,progress,reverse:Boolean(h.reverse)};
  });
 const breakTime=slot===14?1.45:slot===15?2.65:slot===13?3.10:0;
 const elapsed=age-breakTime,burst=slot>=0&&elapsed>=0&&elapsed<2.2?
  Math.sin(Math.PI*elapsed/2.2)**2:0;
 return {feral:true,slot,spin,breakPower:burst,waves};
}
export function buildDiceTableRuin(T,root,deck,{coarse=false,reduced=false}={}){
 const baseCrack=new T.BoxGeometry(1,.075,1),shardGeo=new T.BoxGeometry(1,1,1);
 const slitMat=new T.MeshBasicMaterial({color:0xef4258,transparent:true,opacity:.4,depthWrite:false});
 const shardsMat=new T.MeshStandardMaterial({color:0x9d613d,roughness:.6,metalness:.26,
  emissive:0x8c1525,emissiveIntensity:.38});
 const ringGeo=new T.RingGeometry(.94,1,64).rotateX(-Math.PI/2);
 const goldMat=new T.MeshBasicMaterial({color:0xffb96b,transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide});
 const dangerMat=new T.MeshBasicMaterial({color:0xf04449,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});
 const fissures=new T.Group();fissures.name='sungwon-table-breaking-fissures';root.add(fissures);
 const cracks=Array.from({length:coarse?12:20},(_,i)=>{
   const angle=i*2.39996323,reach=16+i%5*8;
   const m=new T.Mesh(baseCrack,slitMat);m.name='sungwon-table-crack';m.position.set(Math.sin(angle)*reach*.53,.21,Math.cos(angle)*reach*.53);
   m.scale.set(.18+(i%3)*.12,.08,reach);m.rotation.y=angle;fissures.add(m);return m;
 });
 const waves=Array.from({length:3},(_,i)=>{
  const m=new T.Mesh(ringGeo.clone(),i===0?dangerMat:goldMat);m.name='sungwon-table-visible-shockwave';m.position.y=.29+i*.018;m.visible=false;root.add(m);return m;
 });
 const shards=Array.from({length:coarse?16:36},(_,i)=>{
  const a=i*2.39996323,r=8+(i%7)*7,m=new T.Mesh(shardGeo,shardsMat);
  m.name='sungwon-casino-wood-shard';m.visible=false;root.add(m);
  return {m,a,r,vel:9+(i%6)*3,up:9+i%7*3,spin:2+i%5};
 });
 let angle=0,velocity=0,previousTime=0,owner=null;
 function update(g,dt=0){
  if(owner!==g||(g?.time||0)<previousTime){owner=g;angle=0;velocity=0;}
  previousTime=g?.time||0;
  const s=tableRuinState(g),h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  const target=s.feral?(s.spin+.16):(g?.boss?.phase===2 ? .008 : 0);
  velocity+=(target-velocity)*(1-Math.exp(-h*(s.feral?2.6:3.4)));
  angle+=velocity*h;deck.rotation.y=angle;
  // The table's playable plane stays level. The rotating felt is circular,
  // so visual motion never moves or invalidates a player's real hit position.
  deck.position.y=0;
  fissures.visible=s.feral;slitMat.opacity=s.feral?.30+s.breakPower*.56:0;
  cracks.forEach((m,i)=>{m.scale.x=(.17+(i%3)*.12)*(1+s.breakPower*.7);m.position.y=.21+.025*s.breakPower;});
  waves.forEach((m,i)=>{const w=s.waves[i];m.visible=Boolean(w?.visible);if(!w)return;
   // Regenerate only 130 pooled vertices: the visible 3.8m-wide band must
   // follow the EXACT 3.4m + player radius collision ring, even at r=0.
   const inner=Math.max(0,w.r-3.82),outer=w.r+3.82,N=65,pos=m.geometry.attributes.position;
   for(let j=0;j<N;j++){const theta=j*Math.PI*2/(N-1),sn=Math.sin(theta),cs=Math.cos(theta);
    pos.setXYZ(j,cs*inner,0,sn*inner);pos.setXYZ(N+j,cs*outer,0,sn*outer);}
   pos.needsUpdate=true;m.geometry.computeBoundingSphere();m.material.opacity=w.opacity;});
  const burst=s.breakPower;shards.forEach((o,i)=>{
    const m=o.m;const show=burst>.025&&!(reduced&&i%2);
    m.visible=show;if(!show)return;
    const t=1-Math.sqrt(Math.max(0,1-burst)),r=o.r+o.vel*t,
      lift=Math.max(.2,o.up*Math.sin(Math.PI*t));
    m.position.set(Math.sin(o.a)*r,lift,Math.cos(o.a)*r);
    m.rotation.set(o.spin*t,o.a+o.spin*t*.37,o.spin*t*.7);
    m.scale.set(1.6+i%3*.65,.38+i%2*.23,2.8+i%5*.7);
  });
  return s;
 }
 function reset(){owner=null;angle=velocity=previousTime=0;deck.rotation.y=0;waves.forEach(m=>m.visible=false);shards.forEach(o=>o.m.visible=false);fissures.visible=false;}
 reset();return {update,reset,stats:()=>({fissures:cracks.length,shards:shards.length,waves:waves.length,extraLights:0})};
}
