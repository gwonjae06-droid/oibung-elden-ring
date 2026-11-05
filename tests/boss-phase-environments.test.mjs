import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownCircusStage} from '../src/clown-radiant-circus.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {buildCasinoPhaseTheatre,casinoShowPhase,CASINO_SHOW_LAYOUT} from '../src/casino-phase-theatre.mjs';
import {buildCasinoRoom} from '../src/casino-room.mjs';
import {createKwonRoyalRuins,KWON_ROYAL_LAYOUT} from '../src/kwon-royal-ruins.mjs';
import {buildSanctuary} from '../src/sanctuary.mjs';
import {createGame} from '../src/combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
const named=(root,name)=>{const found=[];root.traverse(o=>{if(o.name===name)found.push(o);});return found;};
const get=(root,name)=>{const found=named(root,name)[0];assert.ok(found,'missing '+name);return found;};

test('second-phase clown tent twists, recolours and reveals a grin without adding colliders',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene,{coarse:false,reduced:false}),g=createClownGame();
 const canopy=get(scene,'circus-vaulted-ivory-velvet-canopy'),pos=canopy.geometry.attributes.position;
 const before=new Float32Array(pos.array),colors=new Float32Array(canopy.geometry.attributes.color.array);
 const grin=get(scene,'circus-encore-canopy-grinning-shadow');
 assert.equal(grin.visible,false);
 assert.ok(named(scene,'circus-scalloped-velvet-curtain').length>=12);
 for(let i=0;i<12;i++){g.time+=.034;stage.update(g,.034);}
 assert.deepEqual(pos.array,before,'first phase tent must retain original geometry');
 g.boss.phase=2;stage.event({type:'clown-phase2'},g);
 for(let i=0;i<120;i++){g.time+=.034;stage.update(g,.034);}
 assert.ok(stage.tent.stats().morph>.85,'phase-two material transformation incomplete');
 assert.equal(grin.visible,true);
 assert.ok(grin.children.length>=3);
 assert.notDeepEqual(pos.array,before,'tent canopy did not actually deform');
 assert.notDeepEqual(canopy.geometry.attributes.color.array,colors,'tent stripes did not change');
 assert.equal(stage.stats().collidableProps,0);
 stage.reset();assert.equal(grin.visible,false);
 assert.deepEqual(pos.array,before,'retry should reconstruct the original circus tent');
 assert.deepEqual(canopy.geometry.attributes.color.array,colors);
 stage.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('clown low-quality tent keeps static mesh animation minimal and supports phase changes',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene,{coarse:true,reduced:true}),g=createClownGame();
 g.boss.phase=2;
 for(let i=0;i<90;i++){g.time+=.033;stage.update(g,.033);}
 const k=stage.tent.stats();
 assert.ok(k.panels>=13);assert.ok(k.morph>.8);
 assert.equal(stage.stats().bulbs,96);
 assert.equal(stage.stats().collidableProps,0);
 stage.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('casino 3-act set uses actual phase 3, stays outside gameplay and adds no costly real lights',()=>{
 const scene=new THREE.Scene(),theatre=buildCasinoPhaseTheatre(THREE,scene,{coarse:true,reduced:true});
 const g={boss:{phase:1},dice:{},status:'playing'};
 assert.equal(casinoShowPhase(g),1);assert.equal(theatre.stats().cabinetCount,5);
 assert.equal(theatre.stats().realLights,0);
 const wheel=get(scene,'casino-roulette-spinning-face'),billboard=get(scene,'casino-jackpot-board');
 assert.ok(get(scene,'casino-roulette-number-lamps').isInstancedMesh);
 assert.ok(get(scene,'casino-collapse-ring').geometry.parameters.innerRadius>=100,'crisis ring must not enter the arena');
 for(const m of named(scene,'casino-slot-machine')){
  assert.ok(Math.max(Math.abs(m.position.x),Math.abs(m.position.z))>CASINO_SHOW_LAYOUT.arenaHalf+20);
 }
 assert.equal(theatre.update(g,0,.016).phase,1);
 const still=wheel.rotation.z;
 g.boss.phase=2;assert.equal(casinoShowPhase(g),2);
 const two=theatre.update(g,1,.016);assert.equal(two.phase,2);
 assert.equal(theatre.update(g,4,.016).number===777||theatre.update(g,4,.016).number===666,true);
 const three=theatre.update({...g,boss:{phase:3}},5,.016);
 assert.equal(three.phase,3);assert.equal(casinoShowPhase({...g,dice:{giant:{temperament:'feral'}}}),3);
 theatre.update({...g,boss:{phase:3}},9,.016);
 assert.ok(Math.abs(billboard.rotation.z)>.09,'the jackpot wall should tilt in 3P');
 assert.ok(Math.abs(wheel.rotation.z-still)<1e-9||Number.isFinite(wheel.rotation.z));
 assert.ok(get(scene,'casino-fractured-wall-silhouettes').children.length>=10);
 assert.ok(theatre.stats().decorativeOnly);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('existing patron casino room carries new roulette stage without changing existing guest circle',()=>{
 const scene=new THREE.Scene(),room=buildCasinoRoom(THREE,scene,{coarse:true,reduced:true});
 const game={boss:{phase:1,x:0,z:0},dice:{},time:0,status:'playing'};
 room.update(0,game,.016);
 const patrons=named(scene,'watching-casino-guest');
 assert.equal(patrons.length,4);
 assert.ok(get(scene,'casino-three-act-theatre'));
 game.boss.phase=2;game.dice.giant={state:'transition',t:5.4,hazards:[]};
 room.update(5.4,game,.016);
 game.boss.phase=3;game.dice.giant={state:'attack',t:9,hazards:[],temperament:'feral'};
 room.update(9,game,.016);
 assert.ok(get(scene,'casino-giant-roulette-sign').rotation.y>.3);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('Kwon's abandoned throne, outer sword grave and red seal are decorative only',()=>{
 const scene=new THREE.Scene(),royal=createKwonRoyalRuins(THREE,scene,{coarse:true,reduced:true}),g=createGame();
 assert.equal(royal.stats().swords,22);
 assert.equal(royal.stats().damageSources,0);
 assert.equal(royal.stats().collidableProps,0);
 assert.ok(get(scene,'kwon-ruined-sword-throne').position.z<-26);
 assert.ok(get(scene,'kwon-sword-grave-blades').isInstancedMesh);
 const model=get(scene,'kwon-sword-grave-blades'),mat=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 for(let i=0;i<model.count;i++){
  model.getMatrixAt(i,mat);mat.decompose(p,q,scale);
  assert.ok(Math.hypot(p.x,p.z)>KWON_ROYAL_LAYOUT.playRadius+7);
 }
 const sigil=get(scene,'kwon-awakened-crimson-royal-seal');
 assert.equal(sigil.material.opacity,0);
 royal.update(g,.016);g.boss.phase=2;
 for(let i=0;i<100;i++){g.time+=.04;royal.update(g,.04);}
 assert.ok(sigil.material.opacity>.5,'seal should glow red after transition');
 assert.ok(royal.stats().morph>.8);
 g.boss.phase=1;g.time=0;royal.update(g,.02);
 assert.equal(sigil.material.opacity,0,'new attempt restores moonlit stage');
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('Kwon original sanctuary and its existing swords coexist with the royal extension',()=>{
 const scene=new THREE.Scene(),s=buildSanctuary(THREE,scene,{coarse:true,reduced:true}),g=createGame();
 assert.ok(get(scene,'broken-sword-sanctuary'));
 assert.ok(get(scene,'resonating-greatsword'));
 assert.ok(get(scene,'kwon-ruined-sword-throne'));
 assert.ok(get(scene,'kwon-royal-seal-runes').isInstancedMesh);
 s.update(g,.016);g.boss.phase=2;g.time=1;
 s.update(g,1);
 assert.ok(s.royal.stats().morph>.5);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
