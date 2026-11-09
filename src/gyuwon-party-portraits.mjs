import * as THREE from 'three';
import {buildBoss} from './models.mjs';
import {createClownActor} from './clown-actor.mjs';
import {createDiceActor} from './dice-actor.mjs';
import {createBloodHead} from './blood-head.mjs';

// Borrow the actual source bosses' authored geometries and portrait materials,
// rather than using four recolored player avatars. Each is an independent,
// small stage instance: do not mutate the original bosses in their own fights.
export function createGyuwonBossParty({coarse=false}={}){
 const kwon=buildBoss({coarse:true});
 const clown=createClownActor({coarse:true});
 const dice=createDiceActor();
 const blood=createBloodHead({coarse:true,reduced:coarse,portrait:'baeseojun.png'});
 const sources=[kwon,clown,dice,blood];
 const roles=sources.map((src,i)=>{
  const wrapper=new THREE.Group();wrapper.name=['party-kwon-jaw-blade','party-oslu-circus','party-sungwon-dice','party-baeseojun-blood'][i];
  const rig=i===3?src.group:src.root;
  // Explicit authored size calibration. Keep the cast within the turn arena,
  // but preserve their very different silhouettes and materials.
  const scales=[.53,.48,.31,.98],lift=[.20,.2,2.15,0];
  rig.scale.setScalar(scales[i]);rig.position.y=lift[i];
  wrapper.add(rig);
  if(i===3){
   // The actual photographic head sits on a sculpted blood-seraph outfit.
   const velvet=new THREE.MeshStandardMaterial({color:0x661e33,roughness:.62,metalness:.16});
   const rim=new THREE.MeshStandardMaterial({color:0xb07a65,roughness:.44,metalness:.3});
   const torso=new THREE.Mesh(new THREE.CylinderGeometry(.68,.43,1.55,coarse?10:20),velvet);
   torso.position.y=1.55;torso.scale.z=.65;wrapper.add(torso);
   for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.2,.11,1.48,12),velvet);
    arm.position.set(side*.75,1.54,0);arm.rotation.z=side*.22;wrapper.add(arm);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.21,.16,1.12,12),velvet);
    leg.position.set(side*.27,.48,0);wrapper.add(leg);
    const wing=new THREE.Group();
    for(let k=0;k<7;k++){
     const feather=new THREE.Mesh(new THREE.ConeGeometry(.21,1.65-k*.115,6),k%2?rim:velvet);
     feather.position.set(side*(.66+k*.27),2.0-k*.08,-.24+k*.06);
     feather.rotation.z=side*(.52+k*.12);
     wing.add(feather);
    }
    wing.name=side<0?'blood-wing-left':'blood-wing-right';wrapper.add(wing);
   }
   src.group.position.set(0,3.1,.08);
  }
  return wrapper;
 });
 let disposed=false;
 function update(m){
  if(disposed||!m?.party)return;
  for(let i=0;i<roles.length;i++){
   const p=m.party[i],role=roles[i],motion=m.actorMotion?.actorId===p.id?m.actorMotion:null;
   role.visible=p.hp>0;
   const to=m.enemies?.find(e=>e.id===motion?.targetId)||m.enemies?.[m.targetIndex];
   const swing=motion?Math.sin(Math.min(1,motion.age/motion.duration)*Math.PI):0;
   const dash=motion&&to?.hp>0?Math.min(3.3,Math.hypot(to.x-p.x,to.z-p.z)*.32)*swing:0;
   const angle=Math.atan2((to?.x||0)-p.x,(to?.z||-10)-p.z);
   role.position.set(p.x+Math.sin(angle)*dash,.16+(swing*.28),p.z+Math.cos(angle)*dash);
   role.rotation.y=angle;
   role.rotation.z=i===2?swing*.23:i===1?Math.sin(m.time*2+i)*.035+swing*.12:0;
   if(i===0){
    kwon.swordGroup.rotation.x=-.22-1.35*swing;
    kwon.model.rotation.x=-.18*swing;
   }else if(i===1){
    clown.body.rotation.x=.04*Math.sin(m.time*1.7)-.25*swing;
    clown.head.group.rotation.z=.04*Math.sin(m.time*1.8)+.17*swing;
   }else if(i===2){
    dice.root.rotation.set(m.time*.25+swing*5,m.time*.35+swing*2,swing*3);
    dice.root.position.y=2.15+.19*Math.sin(m.time*1.6);
   }else{
    blood.group.rotation.y=.03*Math.sin(m.time*1.7);
    role.getObjectByName('blood-wing-left').rotation.y=.08+Math.sin(m.time*2)*.08+swing*.4;
    role.getObjectByName('blood-wing-right').rotation.y=-.08-Math.sin(m.time*2)*.08-swing*.4;
   }
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(let i=0;i<sources.length;i++){
   const src=sources[i];roles[i].removeFromParent();
   if(typeof src.dispose==='function'){src.dispose();continue;}
   const geos=new Set(),mats=new Set(),textures=new Set();
   (src.root||src.group)?.traverse(o=>{
    if(o.geometry)geos.add(o.geometry);
    for(const mat of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){
     mats.add(mat);for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);
    }
   });
   for(const t of textures)t.dispose();for(const g of geos)g.dispose();for(const mat of mats)mat.dispose();
  }
  // Extra armor and wings on the blood costume belong to this module.
  const bloodWear=roles[3];bloodWear.traverse(o=>{
   if(o===blood.group||blood.group.getObjectById?.(o.id))return;
   o.geometry?.dispose?.();o.material?.dispose?.();
  });
 }
 return {roles,update,dispose,actors:sources};
}
