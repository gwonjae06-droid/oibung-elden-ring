import * as THREE from 'three';
import {DICE_ROULETTE,rouletteFiringAngle} from './dice-roulette-attack.mjs';

// Pooled 3D casino props. No dynamic lights, random per-frame geometry or post-processing.
export function createDiceRouletteView(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='dice-roulette-fate';scene.add(root);
 const marker=new THREE.Group();root.add(marker);
 const materials=[],geometries=[],owned=[];
 const geo=(x)=>{geometries.push(x);return x;};
 const mat=(x)=>{materials.push(x);return x;};
 const gold=mat(new THREE.MeshStandardMaterial({color:0xe9ba55,metalness:.85,roughness:.18,emissive:0x5a3008,emissiveIntensity:.65}));
 const ruby=mat(new THREE.MeshStandardMaterial({color:0xcf2845,metalness:.78,roughness:.21,emissive:0x580a19,emissiveIntensity:.55}));
 const pale=mat(new THREE.MeshBasicMaterial({color:0xffeac1,transparent:true,opacity:.75,depthWrite:false}));
 const line=mat(new THREE.MeshBasicMaterial({color:0xf6c77b,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));
 const disc=geo(new THREE.CylinderGeometry(.86,.86,.19,16));
 const ring=new THREE.Mesh(geo(new THREE.TorusGeometry(3.6,.18,6,48)),gold);
 ring.rotation.x=Math.PI/2;marker.add(ring);
 const needle=new THREE.Mesh(geo(new THREE.BoxGeometry(.16,.28,3.15)),ruby);
 needle.position.set(0,.27,1.4);marker.add(needle);
 const beads=[];
 for(let i=0;i<6;i++){const b=new THREE.Mesh(geo(new THREE.SphereGeometry(.29,8,6)),pale);
  const a=i*Math.PI/3;b.position.set(Math.sin(a)*3.6,.2,Math.cos(a)*3.6);marker.add(b);beads.push(b);}
 const textSprites=[];
 for(let n=2;n<=6;n++){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,128,128);ctx.fillStyle='#201116';ctx.beginPath();ctx.arc(64,64,55,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d8b069';ctx.lineWidth=6;ctx.stroke();
  ctx.font='bold 80px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff6cf';ctx.fillText(String(n),64,69);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;owned.push(tx);
  const spriteMat=mat(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));
  const sprite=new THREE.Sprite(spriteMat);sprite.scale.set(5,5,1);sprite.position.y=5.2;marker.add(sprite);textSprites.push(sprite);
 }
 const warningGeo=geo(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),lanes=[];
 for(let i=0;i<6;i++){const mesh=new THREE.Mesh(warningGeo,line);marker.add(mesh);lanes.push(mesh);}
 const shots=Array.from({length:12},()=>{const group=new THREE.Group();
  const coin=new THREE.Mesh(disc,gold);group.add(coin);root.add(group);return {group,coin};});
 let disposed=false;
 return {root,update(g,dt=0){
  if(disposed)return;const d=g.dice,s=d.roulette,show=Boolean(s&&!d.giant&&g.status==='playing');
  ring.visible=needle.visible=show;ring.material=gold;
  for(let i=0;i<beads.length;i++)beads[i].visible=show&&i<(s?.count||0);
  for(let i=0;i<textSprites.length;i++)textSprites[i].visible=show&&i===s.count-2;
  if(show){
   const time=s.t,spin=Math.max(0,1-time/DICE_ROULETTE.spin);
   marker.position.set(s.origin.x,12,s.origin.z);
   needle.rotation.y+=Math.max(0,dt)*(.9+spin*16);
   ring.rotation.z=0;
   for(let i=0;i<lanes.length;i++){
    const mesh=lanes[i],enabled=i<s.count&&s.stage==='spin';mesh.visible=enabled;
    if(!enabled)continue;const yaw=rouletteFiringAngle(s,i),reach=43;
    mesh.position.set(Math.sin(yaw)*reach/2,-11.9,Math.cos(yaw)*reach/2);
    mesh.rotation.y=yaw;mesh.scale.set(1.15,1,reach);
   }
  }else{for(const mesh of lanes)mesh.visible=false;}
  const live=d.rouletteShots||[];
  for(let i=0;i<shots.length;i++){
   const shot=live[i],o=shots[i];o.group.visible=Boolean(shot&&!d.giant&&g.status==='playing');
   if(!o.group.visible)continue;
   o.coin.material=shot.kind==='jackpot'?ruby:gold;
   o.group.position.set(shot.x,2.5+.35*Math.sin(shot.age*8),shot.z);
   o.group.rotation.z=shot.age*13;o.group.rotation.y=shot.yaw;
  }
 },dispose(){if(disposed)return;disposed=true;root.parent?.remove(root);
   for(const m of materials)m.dispose();for(const g of geometries)g.dispose();for(const t of owned)t.dispose();
 }};
}
