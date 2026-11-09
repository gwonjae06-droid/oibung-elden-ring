import * as THREE from 'three';
import {buildBoss} from './models.mjs';
import {createClownActor} from './clown-ringmaster-actor.mjs';
import {createClownGame} from './clown-combat.mjs';
import {createDiceActor} from './dice-actor.mjs';
import {createBloodHead} from './blood-head.mjs';
import {createBloodRegalia} from './blood-regalia.mjs';
import {createBloodGame} from './blood-combat.mjs';

// These are the same builders used by the current boss fights. In particular,
// Seulwoo uses the rebuilt phase-one ringmaster, and Blood uses the actual
// phase-one articulated regalia/legs/head, without a replacement cone body.
export function createGyuwonBossParty({coarse=false}={}){
 const kwon=buildBoss({coarse}),clown=createClownActor({coarse}),dice=createDiceActor();
 const bloodRoot=new THREE.Group();bloodRoot.name='party-blood-phase-one-source';
 const bloodRegalia=createBloodRegalia(bloodRoot,{coarse,reduced:coarse});
 const bloodHead=createBloodHead({coarse,reduced:coarse});bloodHead.group.position.set(0,4.6,0);bloodRegalia.torso.add(bloodHead.group);
 const blood={root:bloodRoot,regalia:bloodRegalia,head:bloodHead};
 const sources=[kwon,clown,dice,blood],clownGame=createClownGame(),bloodGame=createBloodGame();
 clownGame.boss.phase=1;clownGame.boss.x=clownGame.boss.z=0;clownGame.boss.yaw=0;clownGame.boss.state='clown';clownGame.player.x=0;clownGame.player.z=12;clownGame.clown.state='idle';
 bloodGame.boss.phase=1;bloodGame.boss.x=bloodGame.boss.z=0;bloodGame.boss.yaw=0;bloodGame.blood.elevation=0;
 const scales=[.53,.73,.31,.82],roles=sources.map((src,i)=>{
  const wrapper=new THREE.Group();wrapper.name=['party-kwon-jaw-blade','party-oslu-phase-one','party-sungwon-dice','party-baeseojun-phase-one'][i];
  const rig=src.root;rig.scale.setScalar(scales[i]);rig.position.y=i===2?2.15:.08;wrapper.add(rig);return wrapper;
 });
 // Wings are a temporary ultimate effect. Blood's idle phase-one body is kept
 // exactly as authored; these do not replace the original coat, legs or hands.
 const wingMaterial=new THREE.MeshStandardMaterial({color:0x7c163a,roughness:.32,metalness:.25,emissive:0x420c22,emissiveIntensity:.35,side:THREE.DoubleSide});
 const wingGeo=new THREE.ConeGeometry(.21,1.8,8),wingRoots=[];
 for(const side of [-1,1]){const wing=new THREE.Group();wing.name='party-blood-ultimate-wing';wing.position.set(side*.6,3,-.35);wing.visible=false;
  for(let i=0;i<10;i++){const feather=new THREE.Mesh(wingGeo,wingMaterial);feather.position.set(side*(i*.28),-.08*i,-.02*i);feather.rotation.z=-side*(.6+i*.085);feather.scale.y=1-i*.04;wing.add(feather);}roles[3].add(wing);wingRoots.push(wing);}
 let disposed=false,lastTime=0;
 function update(m){
  if(disposed||!m?.party)return;const dt=Math.max(0,Math.min(.05,m.time-lastTime));lastTime=m.time;
  for(let i=0;i<roles.length;i++){
   const p=m.party[i],role=roles[i],motion=m.actorMotion?.actorId===p.id?m.actorMotion:null;
   role.visible=true;const to=m.enemies?.find(e=>e.id===motion?.targetId)||m.enemies?.[m.targetIndex];
   const swing=motion?Math.sin(Math.min(1,motion.age/motion.duration)*Math.PI):0;
   const entrance=THREE.MathUtils.smoothstep(m.time,.6+i*.55,3.2+i*.55);
   const ensemble=(m.ensembleJump||0)*(1+i*.035);
   role.position.set(p.x+(1-entrance)*(i%2?23:-23),.16+(p.y||0)+ensemble,p.z);
   role.rotation.y=Math.atan2((to?.x||0)-p.x,(to?.z||-10)-p.z);role.rotation.x=p.hp<=0?-.8:0;
   role.rotation.z=i===2?swing*.23:0;
   if(i===0){kwon.swordGroup.rotation.x=-.22-1.9*swing;kwon.model.rotation.x=-.18*swing;}
   if(i===1){
    clownGame.time=m.time;clownGame.clown.time=m.time;clown.update(clownGame,dt);
    const body=clown.root.getObjectByName('seulwoo-grounded-physical-rig');if(body)body.rotation.x-=swing*.24;
    const hand=clown.root.getObjectByName('ringmaster-right-hand');if(hand)hand.rotation.x-=swing;
   }
   if(i===2){dice.root.rotation.set(m.time*.15+swing*5,m.time*.25+swing*2,swing*3);dice.root.position.y=2.15+.12*Math.sin(m.time*1.6);}
   if(i===3){
    bloodGame.time=m.time;bloodGame.boss.hp=p.hp;bloodGame.blood.veins=swing*.2;
    const pose={anticipation:motion&&motion.age<.5?swing:0,release:motion&&motion.age>.6?swing:0,body:{lean:swing*.4},arms:[{raise:swing*.9,open:swing},{raise:swing,open:swing}]};
    bloodRegalia.update(bloodGame,bloodGame.blood,dt,swing,pose);bloodHead.update(bloodGame,bloodGame.blood,dt,{cast:swing,pose});
    wingRoots.forEach((w,k)=>{w.visible=motion?.type==='ultimate'||m.finishProgress>0;w.rotation.y=(k?1:-1)*(.15+swing*.55);});
   }
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(let i=0;i<4;i++){
   roles[i].removeFromParent();
   if(i===2){dice.dispose();continue;}
   if(i===1)clown.disposePortrait();
   if(i===3){bloodRegalia.dispose();bloodHead.dispose();bloodHead.group.removeFromParent();}
   const geos=new Set(),mats=new Set(),textures=new Set();sources[i].root.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const mat of [].concat(o.material||[])){mats.add(mat);for(const v of Object.values(mat))if(v?.isTexture)textures.add(v);}});
   for(const t of textures)t.dispose();for(const geo of geos)geo.dispose();for(const mat of mats)mat.dispose();
  }
  wingGeo.dispose();wingMaterial.dispose();
 }
 return {roles,update,dispose,actors:sources,ready:Promise.all([clown.head.ready,dice.ready]),sourcePhases:[1,1,1,1]};
}
