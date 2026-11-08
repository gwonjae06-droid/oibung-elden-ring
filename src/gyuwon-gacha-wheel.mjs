import * as THREE from 'three';
// The physical 3D roulette is inspired by ochams-3d-battle's Choi wheel:
// six coloured outcomes, a fixed needle and independently flashing bulbs.
// A cast snapshots its result once and the attack's real hitboxes remain in
// gyuwon-years.mjs. This wheel is only the visible cause of those attacks.
export const GYUWON_GACHA_OUTCOMES=Object.freeze(['대박','평타','꽝','역전','불합격','만점']);
const TAU=2*Math.PI;
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function gyuwonGachaResultAngle(result){
 const i=Math.max(0,Math.min(5,Number.isFinite(result)?Math.floor(result):0));
 return Math.PI/2-(i+.5)*TAU/6;
}
export function createGyuwonGachaWheel(parent,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-seven-year-suneung-gacha-roulette';
 parent.add(root);
 const materials=[],geos=[],textures=[],add=(p,g,m,name)=>{const o=new THREE.Mesh(g,m);o.name=name;p.add(o);return o;};
 const ownGeo=g=>{geos.push(g);return g;};
 const ownMat=m=>{materials.push(m);return m;};
 const mat=(c,opts={})=>ownMat(new THREE.MeshStandardMaterial({color:c,metalness:.24,roughness:.45,...opts}));
 const gold=mat(0xffc56a,{metalness:.85,roughness:.17,emissive:0x4a2c0f});
 const dark=mat(0x171c33,{metalness:.54,roughness:.4});
 const rim=add(root,ownGeo(new THREE.TorusGeometry(2.05,.17,coarse?8:12,coarse?32:56)),gold,'gyuwon-gacha-solid-metal-rim');
 rim.position.z=.15;
 const back=add(root,ownGeo(new THREE.CylinderGeometry(2.05,2.05,.19,coarse?32:56)),dark,'gyuwon-gacha-backboard');
 back.rotation.x=Math.PI/2;back.position.z=-.12;
 const rotor=new THREE.Group();rotor.name='gyuwon-six-segment-rotating-suneung-wheel';
 root.add(rotor);
 const shades=[0xeb5f89,0x6dbbbf,0xf1b95c,0x9181bf,0x86b76c,0xd46c5e];
 for(let i=0;i<6;i++){
  const a=i*TAU/6;
  const sector=add(rotor,ownGeo(new THREE.CircleGeometry(1.86,coarse?9:20,a,TAU/6)),
   mat(shades[i],{metalness:.25,roughness:.52}), 'gyuwon-gacha-real-roulette-sector');
  sector.position.z=.10;
  const x=Math.cos(a+TAU/12)*1.27,y=Math.sin(a+TAU/12)*1.27;
  const labelG=new THREE.Group();labelG.position.set(x,y,.16);labelG.rotation.z=a+TAU/12-Math.PI/2;
  rotor.add(labelG);
  // Text is a result printed on an object, not a combat-pattern tutorial.
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
   const canvas=document.createElement('canvas');canvas.width=180;canvas.height=100;
   const c=canvas.getContext('2d');if(c){
    c.fillStyle='#fffaf1';c.strokeStyle='#32213d';c.lineWidth=8;
    c.font='bold 51px sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.strokeText(GYUWON_GACHA_OUTCOMES[i],90,50,172);
    c.fillText(GYUWON_GACHA_OUTCOMES[i],90,50,172);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    add(labelG,ownGeo(new THREE.PlaneGeometry(1.15,.55)),ownMat(new THREE.MeshBasicMaterial({
     map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide})),
     'gyuwon-gacha-physical-result-label');
   }
  }
 }
 const center=add(root,ownGeo(new THREE.CylinderGeometry(.34,.34,.38,coarse?12:24)),gold,'gyuwon-gacha-axle');
 center.rotation.x=Math.PI/2;center.position.z=.26;
 const pointer=add(root,ownGeo(new THREE.ConeGeometry(.25,.67,coarse?9:16)),mat(0xf6dddd,{emissive:0x4b0c23}),
  'gyuwon-gacha-fixed-arrow-pointer');
 pointer.position.set(0,2.49,.35);pointer.rotation.z=Math.PI;
 const bulbMat=[mat(0xffe5b4,{emissive:0xffd279,emissiveIntensity:1.9}),
  mat(0xee526f,{emissive:0xea3668,emissiveIntensity:1.2})];
 for(let i=0;i<(coarse?18:30);i++){
  const a=i/(coarse?18:30)*TAU;
  const bulb=add(root,ownGeo(new THREE.SphereGeometry(.085,coarse?6:8,coarse?4:6)),
   bulbMat[i%2],'gyuwon-live-donation-light-bulb');
  bulb.position.set(Math.cos(a)*2.06,Math.sin(a)*2.06,.23);
 }
 const beacons=new THREE.Group();beacons.name='gyuwon-gacha-winning-burst';root.add(beacons);
 for(let i=0;i<(coarse?14:26);i++){
  const goldChip=add(beacons,ownGeo(new THREE.OctahedronGeometry(.12,0)),i%2?gold:bulbMat[1],
   'gyuwon-gacha-physical-jackpot-spark');
  goldChip.userData.number=i;
 }
 let disposed=false;
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,active=e?.year===7&&e?.mode==='combat'&&e?.cast==='donation';
  root.visible=!!active;
  if(!active)return;
  root.position.set(g.boss.x,4.2,g.boss.z+3.0);
  root.rotation.y=g.boss.yaw||0;
  const t=e.castT||0,turn=ease(t/3.05);
  rotor.rotation.z=TAU*8*turn+gyuwonGachaResultAngle(e.gachaResult||0)*turn;
  pointer.rotation.z=Math.PI+Math.sin(Math.min(3,t)*22)*.075*(1-turn);
  beacons.visible=t>=3.05;
  beacons.children.forEach((part,i)=>{
   const a=i*2.399963+g.time*(.65+(i%4)*.19),r=2.35+((i%3)*.28)+Math.sin(t*4+i)*.19;
   part.position.set(Math.cos(a)*r,Math.sin(a)*r,Math.sin(t*3+i)*.6);
   part.rotation.set(g.time*1.4+i,g.time*.7-i,i*.4);
   part.scale.setScalar(.65+.7*Math.abs(Math.sin(g.time*7+i)));
  });
 }
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();
  for(const obj of materials)obj.dispose();for(const obj of geos)obj.dispose();
  for(const obj of textures)obj.dispose();
 }
 return {root,rotor,update,dispose,stats:()=>({sectors:6,outcomes:GYUWON_GACHA_OUTCOMES.length})};
}
