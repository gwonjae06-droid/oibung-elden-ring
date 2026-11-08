import * as THREE from 'three';
import {buildPlayerWeapons} from './player-weapons.mjs';
import {arsenalKind} from './gyuwon-arsenal.mjs';
import {hazardPosition} from './gyuwon-data.mjs';
export function createArsenalHands(wrists){
 const colors={steel:0x7b838c,gold:0xb89a58,leather:0x312a28,etched:0x303844,gem:0x8e332d,ivory:0xeee3cc,wood:0x705039,cardRed:0x9e302c};
 const mats=Object.fromEntries(Object.entries(colors).map(([id,color])=>[id,new THREE.MeshStandardMaterial({color,metalness:['steel','gold'].includes(id)?.78:.05,roughness:.44})]));
 mats.string=new THREE.LineBasicMaterial({color:0xe9dbbd});
 const {weapons}=buildPlayerWeapons(THREE,mats),geos=new Set();
 for(const [id,rig]of Object.entries(weapons)){rig.name='gyuwon-arsenal-'+id;rig.traverse(o=>{if(o.geometry)geos.add(o.geometry);});wrists[1].add(rig);rig.scale.setScalar(id==='hammer'?1.8:1.6);rig.position.set(0,-.1,.12);rig.visible=false;}
 return {update(g){const kind=g.gyuwon?.years?.mode==='combat'?arsenalKind(g.gyuwon.years.year):null;for(const [id,rig]of Object.entries(weapons))rig.visible=id===kind&&id!=='bow';},dispose(){for(const rig of Object.values(weapons))rig.removeFromParent();for(const geo of geos)geo.dispose();for(const mat of Object.values(mats))mat.dispose();}};
}
export function createArsenalFx(stage){
 const root=new THREE.Group();root.name='gyuwon-arsenal-projectiles';stage.add(root);
 const steel=new THREE.MeshStandardMaterial({color:0x9da7b0,metalness:.8,roughness:.3}),wood=new THREE.MeshStandardMaterial({color:0x805b37,roughness:.7}),ivory=new THREE.MeshStandardMaterial({color:0xf1e5cd,roughness:.48}),red=new THREE.MeshStandardMaterial({color:0xa9322f,roughness:.4}),dust=new THREE.MeshStandardMaterial({color:0x8b7b66,roughness:1});
 const shaft=new THREE.CylinderGeometry(.035,.035,1.7,8),tip=new THREE.ConeGeometry(.13,.36,8),card=new THREE.BoxGeometry(.7,.025,1.05),seal=new THREE.OctahedronGeometry(.14),ring=new THREE.TorusGeometry(1,.09,6,72),feather=new THREE.BoxGeometry(.25,.025,.32);
 const slots=[];let disposed=false;
 function slot(){const g=new THREE.Group(),arrow=new THREE.Group(),deck=new THREE.Group(),quake=new THREE.Mesh(ring,dust);
  const body=new THREE.Mesh(shaft,wood);body.rotation.x=Math.PI/2;arrow.add(body);
  const point=new THREE.Mesh(tip,steel);point.rotation.x=Math.PI/2;point.position.z=1;arrow.add(point);
  const tail=new THREE.Mesh(feather,ivory);tail.position.z=-.65;arrow.add(tail);
  deck.add(new THREE.Mesh(card,ivory));const mark=new THREE.Mesh(seal,red);mark.scale.set(1,.12,1.5);mark.position.y=.045;deck.add(mark);
  quake.rotation.x=Math.PI/2;g.add(arrow,deck,quake);root.add(g);const s={g,arrow,deck,quake};slots.push(s);return s;
 }
 return {root,update(g){if(disposed)return;let n=0;
  for(const h of g.gyuwon.hazards){if(!h.arsenal||h.weaponStrike||h.age<h.warn-1.1)continue;
   const s=slots[n++]||slot(),p=hazardPosition(h),fall=h.visual==='arsenal-falling-arrow',q=Math.max(0,Math.min(1,1-(h.warn-h.age)/1.1));
   s.g.visible=true;s.arrow.visible=h.visual.includes('arrow');s.deck.visible=h.visual==='arsenal-card';s.quake.visible=h.visual==='arsenal-quake';
   s.g.position.set(p.x,fall?.2+(1-q)*18:2.35,p.z);s.g.rotation.set(0,h.yaw||0,0);s.g.scale.setScalar(1);
   s.arrow.rotation.x=fall?Math.PI/2:0;
   if(s.deck.visible){s.deck.rotation.y=h.age*5;s.g.position.y=2.1;}
   if(s.quake.visible){const radius=(h.r||0)+Math.max(0,h.age-h.warn)*(h.grow||0);s.g.position.y=.12;s.g.scale.set(radius,1,radius);}
  }
  for(let i=n;i<slots.length;i++)slots[i].g.visible=false;
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const geo of [shaft,tip,card,seal,ring,feather])geo.dispose();for(const mat of [steel,wood,ivory,red,dust])mat.dispose();},stats:()=>({pooled:slots.length,visible:slots.filter(s=>s.g.visible).length})};
}
