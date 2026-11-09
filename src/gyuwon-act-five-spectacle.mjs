import * as T from 'three';
// Broad lyrical spectacle is separate from the rigid hitbox simulation.
// All materials and geometry are pooled: no new meshes in the animation loop.
export const ACT_FIVE_SPECTACLE_SCENES=Object.freeze({
 doors:'threshold',choose:'threshold',roads:'threshold',beginning:'threshold',
 sea:'ocean',sky:'sky',flight:'sky',dream:'sky',roles:'sky',
 king:'royal',crowns:'royal',knight:'hero',
 heart:'heart',self:'heart',hand:'heart',together:'heart',
 dance:'ballroom',stage:'ballroom',run:'ballroom',
 curtain:'fanfare',brass:'fanfare',welcome:'fanfare',greet:'fanfare',
 costume:'royal',adventure:'threshold',laugh:'fireworks',friends:'fireworks',
 conduct:'fireworks'
});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export function createActFiveSpectacle(parent,{coarse=false}={}){
 const root=new T.Group();root.name='act-five-grand-original-lyric-spectacle';parent.add(root);
 root.userData.decorativeOnly=true;
 const geos=new Set(),mats=new Set(),geo=g=>(geos.add(g),g),
  mat=(color,options={})=>{const m=new T.MeshBasicMaterial({color,transparent:true,opacity:.58,depthWrite:false,side:T.DoubleSide,...options});mats.add(m);return m;};
 const amber=mat(0xffc76c),cyan=mat(0x8adcf4),pink=mat(0xff9abc),ivory=mat(0xfff0cf),blue=mat(0x73aaf9);
 const box=geo(new T.BoxGeometry(1,1,1)),ball=geo(new T.IcosahedronGeometry(1,1)),
  ring=geo(new T.TorusGeometry(1,.09,7,coarse?32:64));
 const sceneNames=['threshold','ocean','sky','royal','hero','heart','ballroom','fanfare','fireworks'];
 const groups=Object.fromEntries(sceneNames.map(name=>{const g=new T.Group();g.name='act-five-vfx-'+name;root.add(g);return [name,g];}));
 const add=(group,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;group.add(o);return o;};
 const doors=[];
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const door=add(groups.threshold,box,i%2?amber:ivory,'giant-portal-leaf');
  door.position.set(side*(16+i*9),13,-34-i*2);door.scale.set(7,26,.5);doors.push({door,side,i});
 }
 const road=new Array(16).fill().map((_,i)=>{const o=add(groups.threshold,box,i%2?cyan:amber,'grand-unexplored-road-piece');o.position.set(Math.sin(i*.4)*2,.3,-30+i*3.3);o.scale.set(9,.15,2.8);return o;});
 const waves=[];
 for(let j=0;j<8;j++){
  const ribbon=add(groups.ocean,geo(new T.TorusGeometry(1,.27,9,coarse?24:56,Math.PI)),j%3===0?ivory:j%2?cyan:amber,'volumetric-sung-sea-wave');
  ribbon.scale.set(16+j*1.9,4+j*.75,1);ribbon.rotation.z=j%2?Math.PI:0;
  ribbon.position.set(j%2?-8:8,6+j*.9,-28-j*1.6);waves.push(ribbon);
 }
 const seaOrbs=Array.from({length:14},(_,i)=>{const o=add(groups.ocean,ball,i%3?cyan:amber,'sea-spray-orb');o.scale.setScalar(.35+i%4*.15);return o;});
 const skyStars=new T.InstancedMesh(ball,ivory,coarse?54:110);
 skyStars.name='giant-aurora-star-swarm';groups.sky.add(skyStars);
 const aurora=Array.from({length:7},(_,i)=>{const o=add(groups.sky,ring,i%2?cyan:amber,'dream-sky-planetary-orbit');
  o.scale.set(18+i*3,8+i*2.3,1);o.position.set(0,31,-37-i*.4);return o;});
 const royal=Array.from({length:14},(_,i)=>{const o=add(groups.royal,geo(new T.ConeGeometry(.48,12,8)),i%3?amber:ivory,'colossal-crown-light-ray');return o;});
 const hero=Array.from({length:5},(_,i)=>{const o=add(groups.hero,box,i%2?ivory:cyan,'hero-sword-afterimage');
  o.scale.set(.55,20-i*2,.4);return o;});
 const hearts=Array.from({length:7},(_,i)=>{const o=add(groups.heart,ring,i%2?pink:amber,'giant-heart-pulse-wave');o.position.set(0,19,-30-i*.3);return o;});
 const spots=Array.from({length:7},(_,i)=>{const o=add(groups.ballroom,
  geo(new T.ConeGeometry(3+i*.6,33,coarse?8:14,1,true)),i%3===0?pink:i%2?cyan:amber,'musical-spotlight-column');
  o.position.set((i-3)*11,23,-26);return o;});
 const brass=Array.from({length:12},(_,i)=>{const o=add(groups.fanfare,ring,i%2?ivory:amber,'trumpet-fanfare-wave');return o;});
 const confetti=new T.InstancedMesh(box,pink,coarse?40:90);confetti.name='layered-physical-star-confetti';groups.fireworks.add(confetti);
 const matrix=new T.Matrix4(),pos=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),axis=new T.Vector3(0,1,0);
 function update(m){
  const cue=m?.songPerformance||{},t=m?.time||0,k=clamp(cue.weight||0),
   name=ACT_FIVE_SPECTACLE_SCENES[cue.gesture]||'fireworks',beat=t*2*Math.PI*(m?.bpm||136)/60;
  for(const [id,g]of Object.entries(groups))g.visible=id===name&&k>.03;
  if(k<=.03)return;
  groups[name].scale.setScalar(.82+.42*smooth(k));
  doors.forEach(({door,side,i})=>{door.rotation.y=side*(.12+Math.sin(t*.6+i)*.55)*k;door.position.y=13+Math.sin(beat*.18+i)*.8;});
  road.forEach((o,i)=>{o.position.y=.25+Math.sin(t*.9-i*.55)*.3*k;o.rotation.y=Math.sin(t*.35+i)*.04;});
  waves.forEach((o,i)=>{o.position.y=6+i*.85+Math.sin(t*(1.1+i*.07)+i)*1.65;
   o.rotation.x=Math.sin(t*.52+i)*.22;o.rotation.y=Math.sin(t*.36+i)*.10;});
  seaOrbs.forEach((o,i)=>{o.position.set(Math.sin(i*2.4+t*.9)*28,12+((i*4+t*2)%17),-36+(i%5)*2);});
  if(groups.sky.visible){
   for(let i=0;i<skyStars.count;i++){const a=i*2.399+t*.09,alt=(i*37%41);
    pos.set(Math.sin(a)*(11+(i%9)*3.2),17+alt+Math.sin(t*.6+i)*2.5,-39-Math.cos(a)*10);
    q.setFromAxisAngle(axis,a+t*.38);scale.setScalar((.28+(i%6)*.18)*(1+.25*Math.sin(t*2+i)));
    matrix.compose(pos,q,scale);skyStars.setMatrixAt(i,matrix);}
   skyStars.instanceMatrix.needsUpdate=true;
  }
  aurora.forEach((o,i)=>{o.rotation.set(Math.sin(t*.18+i)*.14,t*.11+i*.3,Math.sin(t*.24+i*.6)*.26);});
  royal.forEach((o,i)=>{const a=i*Math.PI*2/14+t*.04; o.position.set(Math.sin(a)*17,32+Math.cos(t*.8+i)*1.3,-31+Math.cos(a)*3);
   o.rotation.z=-a;o.scale.y=.8+.2*Math.sin(beat*.21+i);});
  hero.forEach((o,i)=>{const a=t*.76+i*.21;o.position.set(-12+Math.sin(a)*13,16+Math.cos(a)*6,-27-i*.5);
   o.rotation.z=-.9+Math.sin(a)*.8;});
  hearts.forEach((o,i)=>{const pulse=1+.20*Math.sin(beat*.45-i*.7);
   o.scale.setScalar((5+i*2.3)*pulse*k);
   o.rotation.y=Math.sin(t*.4+i)*.28;});
  spots.forEach((o,i)=>{o.rotation.z=Math.sin(t*.7+i*2.1)*.28;
   o.rotation.x=Math.cos(t*.42+i)*.11;});
  brass.forEach((o,i)=>{const side=i%2?-1:1,depth=Math.floor(i/2);
   o.position.set(side*(8+depth*7),14+depth*3,-29-depth);
   o.rotation.y=Math.sin(t*.65+i)*.22;
   o.scale.setScalar((3+depth*1.5)*(1+.28*Math.sin(beat*.5+i*.8)));});
  if(groups.fireworks.visible){
   for(let i=0;i<confetti.count;i++){
    const a=i*2.4,phase=(t*.36+i*.27)%1;
    pos.set(Math.sin(a)*(9+26*phase),12+40*phase-13*phase*phase,-25+Math.cos(a)*(8+16*phase));
    q.setFromAxisAngle(axis,beat*.24+i);scale.set(.16,.45+.36*phase,.12);
    matrix.compose(pos,q,scale);confetti.setMatrixAt(i,matrix);
   }
   confetti.instanceMatrix.needsUpdate=true;
  }
 }
 return {root,groups,update,dispose(){root.removeFromParent();skyStars.dispose();confetti.dispose();for(const m of mats)m.dispose();for(const g of geos)g.dispose();}};
}
