import * as THREE from 'three';

// Cathedral-sized theatrics around / above the existing arena. NO extra
// hazards, attacks, damage, lights, shaders or new geometry after construction.
export const GRAND_BLOOD_PATTERNS=Object.freeze({
 wave:'awakening',fountain:'font',burst:'heartbeat',vortex:'whirlpool',
 lances:'martyrs',cross:'cross',pulse:'heartbeat',tide:'cataclysm',
 eclipse:'eclipse',rain:'downpour',judgement:'judgement',ritual:'mass',
 heartCage:'heartbeat',rosary:'procession',bloodScissors:'cross',
 reverseFlow:'whirlpool',bloodStatues:'martyrs',wingGenesis:'cataclysm',heartFeast:'mass'
});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
export function grandBloodRiteEnvelope(game,dt=0,last=null){
 const b=game?.boss,s=game?.blood,pattern=s?.pattern,
  kind=GRAND_BLOOD_PATTERNS[pattern],running=b?.state==='pattern'&&
  game?.status==='playing'&&Boolean(kind);
 if(running){
  const w=s.hazards?.length?Math.min(...s.hazards.map(h=>h.warn)):1.3,
   charge=smooth((s.t||0)/Math.max(.2,w)),
   excitement=clamp(((s.t||0)-w)/.6),
   lift=.12+.88*(charge*.45+excitement*.55),
   swell=clamp(lift,.035,1);
  return {kind,pattern,phase:b.phase||1,active:true,lift:swell,fade:1,t:s.t||0,linger:1.2};
 }
 if(!last?.kind||!last.linger)return {kind:null,active:false,lift:0,fade:0,linger:0};
 const remain=Math.max(0,last.linger-Math.max(0,dt));
 return {kind:remain?last.kind:null,pattern:last.pattern,phase:last.phase||1,
  active:false,lift:last.lift,fade:smooth(remain/1.2),t:last.t||0,linger:remain};
}
export function createGrandBloodRites(parent,fluid,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='cathedral-blood-grand-rites';
 root.userData.decorativeOnly=true;parent.add(root);
 const make=(geometry,name)=>{
  const m=new THREE.Mesh(geometry,fluid.material);m.name=name;m.visible=false;root.add(m);return m;
 };
 const crown=make(fluid.sphere,'cathedral-massive-suspended-blood-core');
 const rings=Array.from({length:coarse?2:3},(_,i)=>make(fluid.torus,'cathedral-levitating-blood-halo-'+i));
 const pillars=Array.from({length:coarse?4:8},(_,i)=>make(fluid.column,'cathedral-rise-of-blood-pillar-'+i));
 const streams=Array.from({length:coarse?2:4},(_,i)=>make(fluid.surge,'cathedral-hanging-blood-curtain-'+i));
 const fingers=Array.from({length:coarse?3:6},(_,i)=>make(fluid.spiral,'cathedral-blood-vault-tendril-'+i));
 const all=[crown,...rings,...pillars,...streams,...fingers];let state=null,disposed=false;
 function update(game,dt=0){
  if(disposed)return;
  state=grandBloodRiteEnvelope(game,dt,state);
  const kind=state.kind;
  if(!kind){root.visible=false;return;}
  root.visible=true;
  const scale=state.lift*state.fade,t=state.t,phase=state.phase,
   direction=kind==='mass'||kind==='cataclysm'||kind==='downpour',
   overhead=kind==='eclipse'||kind==='judgement'||kind==='mass'||kind==='downpour';
  const slow=reduced?0:t*.35;
  const intensity=1+Math.sin(t*2.4)*(!reduced?.055:0);
  crown.visible=scale>.04&&['eclipse','heartbeat','mass','judgement','downpour','whirlpool'].includes(kind);
  crown.position.set(0,kind==='heartbeat'?22:kind==='eclipse'?30:28,0);
  crown.scale.setScalar(Math.max(.001,(kind==='eclipse'?8.2:kind==='mass'?6.3:4.8)*scale*intensity));
  rings.forEach((m,i)=>{
   m.visible=scale>.03&&(overhead||direction||kind==='heartbeat'||kind==='whirlpool');
   const height=(kind==='heartbeat'?18:27)+(i-1)*2.25;
   m.position.set(0,height,0);m.rotation.set(Math.PI/2+i*.14,.12+i*.25,slow*(i%2?-1:1));
   m.scale.setScalar(Math.max(.001,(10.5+i*2.5)*scale));
  });
  pillars.forEach((m,i)=>{
   const a=i*Math.PI*2/pillars.length+slow*.12,
    radius=kind==='cataclysm'?29.2:30.7;
   m.visible=scale>.11&&(direction||kind==='font'||kind==='martyrs'||kind==='cross'||kind==='procession');
   m.position.set(Math.sin(a)*radius,8.5+scale*2.5,Math.cos(a)*radius);
   m.rotation.set(0,a+(reduced?0:Math.sin(t*1.2+i)*.09),0);
   const tall=(kind==='mass'?19:kind==='cataclysm'?15:13.5);
   m.scale.set(1.35*scale,Math.max(.01,tall*scale),1.35*scale);
  });
  streams.forEach((m,i)=>{
   const a=(i+.35)*Math.PI*2/streams.length+slow*.08;
   m.visible=scale>.1&&(direction||kind==='cross'||kind==='judgement'||kind==='whirlpool');
   m.position.set(Math.sin(a)*31,17.5+scale*1.2,Math.cos(a)*31);
   m.rotation.set(0,a,Math.sin(t*.9+i)*(!reduced?.075:0));
   m.scale.set(3.0*scale,15.5*scale,2.9*scale);
  });
  fingers.forEach((m,i)=>{
   const a=i*Math.PI*2/fingers.length,orbit=kind==='heartbeat'?9.5:15;
   m.visible=scale>.1&&(overhead||kind==='whirlpool'||kind==='heartbeat');
   m.position.set(Math.sin(a+slow)*orbit,kind==='heartbeat'?20:25,Math.cos(a+slow)*orbit);
   m.rotation.set(.34*Math.sin(a),a+slow,.4*Math.cos(a));
   m.scale.set(4.5*scale,6*scale,4.5*scale);
  });
 }
 function clear(){state=null;root.visible=false;all.forEach(m=>m.visible=false);}
 function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);}
 clear();
 return {root,update,clear,dispose,stats:()=>({active:root.visible,visible:root.visible?all.filter(x=>x.visible).length:0,
  maximumMeshes:all.length,collidable:false,damageSources:0})};
}
