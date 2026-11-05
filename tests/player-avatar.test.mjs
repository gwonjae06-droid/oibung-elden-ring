import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildPlayer} from '../src/models.mjs';
import {samplePlayerMotion} from '../src/player-motion-data.mjs';
import {applyPlayerMotion} from '../src/player-motion.mjs';
import {createPlayerPolish} from '../src/player-polish.mjs';
import {createPlayerProjectileView} from '../src/player-projectile-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
const weapons=['sword','hammer','bow','cards'];
const game=weapon=>({weapon,status:'playing',time:0,player:{x:0,z:0,yaw:0,action:null,skill:{}},boss:{state:'idle',x:0,z:4}});
test('hero has authored closed profiles, real hand mounts, finite geometry and a bounded polygon budget',()=>{
 const p=buildPlayer(weapons);let triangles=0;
 p.rig.traverse(o=>{if(o.isMesh){assert.equal(o.geometry.type,'BufferGeometry');const a=o.geometry.attributes.position;triangles+=(o.geometry.index?.count??a.count)/3;for(const n of a.array)assert.ok(Number.isFinite(n));assert.ok(o.geometry.attributes.normal);assert.ok(o.geometry.attributes.uv);}});
 assert.ok(triangles>4000&&triangles<10000);assert.equal(p.pivot.parent,p.hands.R);assert.equal(p.hands.R.parent,p.elbows.R);assert.equal(p.rig.userData.playerQuality,'oathwarden-v1');
 const bounds=new THREE.Box3().setFromObject(p.rig);assert.ok(bounds.min.y>=-.03);assert.ok(bounds.max.y>2.5&&bounds.max.y<3);
 disposeScene(p.rig);
});
test('hammer support hand remains attached throughout preparation, impact and recovery',()=>{
 const p=buildPlayer(weapons),parts=p.presentationParts,scene=new THREE.Scene();scene.add(p.rig);const g=game('hammer'),a={kind:'attack',t:0,total:1.13,wind:.43,active:.18};g.player.action=a;
 for(let i=0;i<=100;i++){a.t=i/100*a.total;g.time=i/60;const before=JSON.stringify(g);applyPlayerMotion(parts,samplePlayerMotion(g),'hammer',g.time);const hand=new THREE.Vector3(0,-.10,.07),haft=new THREE.Vector3(0,0,.28);parts.hands[0].localToWorld(hand);parts.pivot.localToWorld(haft);assert.ok(hand.distanceTo(haft)<.025);assert.equal(JSON.stringify(g),before);}
 disposeScene(scene);
});
test('bow grip changes hand and the draw hand actually meets the drawn string',()=>{
 const p=buildPlayer(weapons),s=new THREE.Scene();s.add(p.rig);const g=game('bow');g.player.action={kind:'attack',t:.299,wind:.3,active:.08,total:.66};const pose=samplePlayerMotion(g);applyPlayerMotion(p.presentationParts,pose,'bow',0);
 assert.equal(p.pivot.parent,p.hands.L);const hand=new THREE.Vector3(0,-.1,.07),string=new THREE.Vector3(0,0,p.presentationParts.weaponDetails.bow.tips[0][2]-pose.draw*.46);p.hands.R.localToWorld(hand);p.weaponRigs.bow.localToWorld(string);assert.ok(hand.distanceTo(string)<.025);assert.equal(p.presentationParts.weaponDetails.bow.arrow.visible,true);
 disposeScene(s);
});
test('attack endpoints return to each weapon stance and ribbons only open during the hit window',()=>{
 for(const weapon of weapons){const g=game(weapon),rest=samplePlayerMotion(g),a={kind:'attack',t:0,total:1,wind:.3,active:.2};g.player.action=a;
  for(const t of [0,.299,.3,.4,.501,1]){a.t=t;const p=samplePlayerMotion(g);assert.equal(p.trail,['sword','hammer'].includes(weapon)&&t>=.3&&t<=.5);for(const n of Object.values(p))if(typeof n==='number')assert.ok(Number.isFinite(n));}
  a.t=1;const end=samplePlayerMotion(g);for(const k of ['pivotX','pivotY','pivotZ','armL','armR','elbowL','elbowR','twist','lean'])assert.ok(Math.abs(end[k]-rest[k])<1e-6,weapon+' endpoint '+k);
 }
});
test('cloth, contact effects and player resources stay bounded across repeated attacks and clears',async()=>{
 const scene=new THREE.Scene(),p=buildPlayer(weapons);scene.add(p.rig);const fx=createPlayerPolish(scene,{makeSound:()=>({update(){},clear(){},play(){},dispose(){return {errors:[]};}})}),g=game('sword');
 fx.update(1/60,g);const resources=()=>{const r=new Set();scene.traverse(o=>{if(o.geometry)r.add(o.geometry);if(o.material)r.add(o.material);});return r.size;},baseline=resources();
 for(let repeat=0;repeat<8;repeat++){g.player.action={kind:'attack',t:0,total:.63,wind:.17,active:.14};for(let i=0;i<44;i++){g.time+=1/60;g.player.action.t=i/60;if(i===12)fx.event({type:'boss-hit',amount:72},g);fx.update(1/60,g);}fx.clear();assert.equal(resources(),baseline);}
 const height=p.body.position.y;for(let i=0;i<10;i++)fx.update(0,g);assert.equal(p.body.position.y,height);await fx.dispose();assert.equal(scene.children.length,1);assert.deepEqual(disposeScene(scene).errors,[]);
});
test('crafted projectiles reuse resources across retries and never change simulation projectiles',()=>{
 const scene=new THREE.Scene(),view=createPlayerProjectileView(scene);let allocated=0;
 for(let r=0;r<8;r++){const list=Array.from({length:20},(_,i)=>({id:i+r*20,kind:i%2?'cards':'bow',x:i,z:4,y:1.2,yaw:.1,life:1})),before=JSON.stringify(list);view.update(list,1/60);assert.equal(JSON.stringify(list),before);assert.equal(view.stats().active,20);if(r)assert.equal(view.stats().allocated,allocated);allocated=view.stats().allocated;view.clear();assert.equal(view.stats().active,0);}
 assert.ok(allocated<=view.stats().capacity);view.dispose();view.dispose();assert.equal(scene.children.length,0);
});

test('shared boss projectile API respects floor height, expiry and a fresh game with reused IDs',()=>{
 const scene=new THREE.Scene(),view=createPlayerProjectileView(THREE,scene),g={time:4,projectiles:[{id:1,kind:'bow',x:2,y:1.2,z:3,yaw:.4,life:1},{id:2,kind:'wave',x:0,y:.25,z:0,life:1}]},before=JSON.stringify(g);
 view.update(g);assert.equal(view.stats().active,2);assert.equal(view.root.children[0].position.y,1.2);assert.equal(view.root.children[1].position.y,.25);assert.equal(JSON.stringify(g),before);
 g.projectiles[0].life=0;view.update(g);assert.equal(view.stats().active,1);
 view.update({time:0,projectiles:[{id:1,kind:'cards',x:0,y:1.2,z:1,life:1}]});assert.equal(view.stats().active,1);assert.equal(view.root.children[0].rotation.z,1);view.dispose();
});
test('locomotion plants a sole on the floor without changing world movement or collision',()=>{
 const scene=new THREE.Scene(),p=buildPlayer(weapons);scene.add(p.rig);const g=game('sword');
 p.rig.position.set(3,0,-5);p.rig.rotation.y=1.2;
 for(let i=0;i<48;i++){const pose=samplePlayerMotion(g,i/48*Math.PI*2,4.7,{moveZ:1});applyPlayerMotion(p.presentationParts,pose,'sword',i/60,4.7);let lowest=Infinity;for(const ankle of p.presentationParts.ankles)for(const z of[-.1,.26]){const v=new THREE.Vector3(0,-.1,z);ankle.localToWorld(v);lowest=Math.min(lowest,v.y);}assert.ok(Math.abs(lowest-.012)<1e-6);assert.deepEqual(p.rig.position.toArray(),[3,0,-5]);}
 disposeScene(scene);
});
test('card buff flourish is presentation-only and the model returns to a stable idle after clear',async()=>{
 const scene=new THREE.Scene(),p=buildPlayer(weapons);scene.add(p.rig);const g=game('cards'),fx=createPlayerPolish(scene,{makeSound:()=>({update(){},clear(){},play(){},dispose(){return {errors:[]};}})});
 fx.update(.016,g);const before=JSON.stringify(g);fx.event({type:'skill-cast',flavor:'yellow'},g);assert.equal(JSON.stringify(g),before);
 g.time=.16;fx.update(.16,g);assert.equal(g.player.action,null);assert.ok(Math.abs(p.arms.R.rotation.x)>.3);fx.clear();fx.update(0,g);assert.equal(g.player.action,null);await fx.dispose();disposeScene(scene);
});
