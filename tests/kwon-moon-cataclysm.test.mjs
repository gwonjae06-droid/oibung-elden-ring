import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createGame,step,act} from '../src/combat.mjs';
import {damageArenaBoss} from '../src/arena-damage.mjs';
import {KWON_MOON,moonPosition,moonCinematicPose,beginKwonMoonCinematic,
 advanceKwonMoon,makeKwonMoonState,moonMeteorHeight,moonMeteorProgress,moonStormTremor} from '../src/kwon-moon-cataclysm.mjs';
import {createKwonMoonCataclysmView} from '../src/kwon-moon-cataclysm-view.mjs';
import {createFracturedMeteorGeometry,createSplitMoonBandGeometry,createCelestialJawBladeGeometry} from '../src/kwon-lunar-sculpture.mjs';
import {createKwonShatteredWorld} from '../src/kwon-shattered-world.mjs';
import {makeKwonFractures,KWON_THIRD_PATTERNS} from '../src/kwon-third-phase.mjs';
const tick=(game,t)=>{for(let i=0;i<Math.ceil(t*120);i++)step(game,1/120);};
const atPhaseThree=()=>{const g=createGame('sword',{register:false,seed:17});g.boss.phase=3;g.boss.hp=KWON_MOON.threshold+1;
 g.boss.state='recovery';g.boss.recovery=1;g.boss.t=0;return g;};
test('configured HP cutscene triggers once, only during a legal phase-three opening',()=>{
 const g=atPhaseThree();
 assert.equal(beginKwonMoonCinematic(g),false);
 g.boss.hp=KWON_MOON.threshold;
 assert.equal(beginKwonMoonCinematic(g),true);
 assert.equal(g.boss.state,'moonCinematic');
 assert.equal(act(g,'light'),false,'unskippable cinematic cannot be attacked through');
 assert.equal(damageArenaBoss(g,40,0,{developer:true}),0,'boss has no temporary death during the cut');
 assert.equal(beginKwonMoonCinematic(g),false);
 const original=makeKwonMoonState();
 assert.equal(original.triggered,false);
});
test('three separate visible sword cuts are focused on one fixed distant moon',()=>{
 const g=atPhaseThree();g.boss.hp=500;
 assert.equal(beginKwonMoonCinematic(g),true);
 let previous=0;
 for(const t of KWON_MOON.slashTimes){
  while(g.kwonMoon.time<t+.03)advanceKwonMoon(g,1/120);
  assert.ok(g.kwonMoon.slashes>previous);
  previous=g.kwonMoon.slashes;
 }
 assert.equal(previous,3);
 const p=moonPosition();assert.deepEqual(p,{x:-38,y:34,z:-58});
 assert.ok(moonCinematicPose(2.8).focus>.8,'camera focuses celestial target before slashes');
 while(g.kwonMoon.mode==='cinematic')advanceKwonMoon(g,1/120);
 assert.equal(g.boss.state,'moonStorm');
 assert.equal(g.kwonMoon.mode,'storm');
 assert.equal(g.events.filter(e=>e.type==='kwon-moon-slash').length,3);
});
test('each enormous meteor falls slowly with 6.2+ seconds of warning and damages only at its actual coordinates',()=>{
 const g=atPhaseThree();g.boss.hp=500;beginKwonMoonCinematic(g);
 for(let i=0;i<1050;i++)advanceKwonMoon(g,1/120);
 assert.equal(g.kwonMoon.mode,'storm');
 advanceKwonMoon(g,1/120);
 const rocks=g.kwonMoon.meteors;assert.equal(rocks.length,3);
 assert.ok(rocks.every(r=>r.impact>=6.2&&r.radius<=5.1&&r.x<=17&&r.x>=-17));
 let hits=0;g.player.x=rocks[0].x;g.player.z=rocks[0].z;
 while(rocks[0].age<rocks[0].impact-.04)advanceKwonMoon(g,1/120,()=>hits++);
 assert.equal(hits,0,'warning is not instant damage');
 for(let i=0;i<90;i++)advanceKwonMoon(g,1/120,()=>hits++);
 assert.ok(rocks[0].landed);
 assert.ok(hits<=3,'no repeat damage from one landing');
 for(let i=0;i<2000&&g.kwonMoon.mode==='storm';i++)advanceKwonMoon(g,1/120,()=>hits++);
 assert.equal(g.kwonMoon.mode,'done');assert.equal(g.boss.state,'idle');
 assert.equal(g.kwonMoon.waveIndex,KWON_MOON.waveTimes.length);
 assert.equal(g.events.filter(e=>e.type==='kwon-meteor-impact').length,9);
 assert.equal(beginKwonMoonCinematic(g),false,'meteor cinematic never loops');
});
test('third phase now produces multiple staggered slash fronts with safe off-axis paths',()=>{
 const p={x:0,z:0,yaw:0};
 for(const [name,expected] of [['skyRend',3],['earthRend',4],['heavenSplit',5]]){
  const fractures=makeKwonFractures(p,name,100);
  assert.equal(fractures.length,expected);
  assert.ok(fractures.every((f,i)=>f.delay>=.34&&f.width<=1.1&&
   (i===0||f.delay>fractures[i-1].delay)));
  assert.ok(KWON_THIRD_PATTERNS[name].wind>1.6);
 }
});
test('actual 3D ground halves and background architecture separate together; fixed-sized fragments',()=>{
 const scene=new THREE.Scene(),view=createKwonShatteredWorld(scene,{coarse:true});
 const g=createGame('sword',{register:false});g.boss.phase=3;g.boss.state='transition';g.boss.t=4.8;
 view.update(g,.5);
 assert.ok(view.root.visible);
 const left=view.root.getObjectByName('kwon-real-left-continent');
 const right=view.root.getObjectByName('kwon-real-right-continent');
 assert.ok(left&&right&&left.position.x<right.position.x);
 assert.equal(view.root.getObjectByName('kwon-physically-separated-world'),view.root);
 assert.ok(view.root.getObjectByName('kwon-background-torn-wall'));
 assert.ok(view.root.getObjectByName('kwon-shattered-ground-instanced-stone-chunks'));
 assert.equal(view.stats().collisionSources,0);
 view.dispose();assert.equal(scene.children.length,0);
});
test('moon and 3D meteors are pooled and do not invent damage or overlay UI',()=>{
 const scene=new THREE.Scene(),view=createKwonMoonCataclysmView(scene,{coarse:true});
 const g=atPhaseThree();g.boss.hp=500;beginKwonMoonCinematic(g);
 advanceKwonMoon(g,1/120);view.update(g);
 assert.equal(view.stats().pooled,KWON_MOON.maxMeteors);
 assert.equal(view.stats().slashBeats,3);
 for(let i=0;i<1030;i++)advanceKwonMoon(g,1/120);
 advanceKwonMoon(g,1/120);
 view.update(g);
 assert.ok(view.root.getObjectByName('kwon-lunar-3d-faceted-meteor'));
 assert.ok(view.root.getObjectByName('kwon-natural-growing-meteor-shadow'));
 assert.equal(view.stats().collisionSources,0);
 view.dispose();assert.equal(scene.children.length,0);
});
test('production no longer uses screen-space half filter; camera tracks stable moon and stage is physical',()=>{
 const arena=readFileSync(new URL('../src/arena.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(arena,/createKwonWorldCleave|worldCleave\.update/);
 assert.match(arena,/createKwonShatteredWorld/);
 assert.match(arena,/createKwonMoonCataclysmView/);
 assert.match(arena,/ground\.visible=ring\.visible=game\.boss\.phase!==3/);
 assert.match(arena,/moonPosition\(\)/);
 assert.match(arena,/moonCinematicPose\(game\.kwonMoon\.time\)/);
 const environment=readFileSync(new URL('../src/environment.mjs',import.meta.url),'utf8');
 assert.ok(environment.includes("moon.visible=game.boss.phase!==3"));
 assert.ok(environment.includes("kwon-sky-moon-billboard"));
});

test('moon actually consists of four capped rocky sections and a three-strike jagged blade',()=>{
 const scene=new THREE.Scene(),view=createKwonMoonCataclysmView(scene,{coarse:true});
 assert.equal(view.stats().moonSections,4);
 const sections=[];
 view.root.traverse(o=>{if(o.name==='kwon-actual-separated-moon-rock-section')sections.push(o);});
 assert.equal(sections.length,4);
 assert.ok(sections.every(o=>o.geometry.groups.length===2));
 const stage=view.root.getObjectByName('kwon-celestial-blade-three-cut-cinematic');
 assert.ok(stage?.getObjectByName('kwon-real-3d-moon-slicing-sword'));
 assert.ok(view.root.getObjectByName('kwon-lunar-physical-fracture-edge'));
 const geometry=createSplitMoonBandGeometry(THREE,{bottom:-3,top:1.5,coarse:true});
 assert.equal(geometry.userData.sculpture,'solid-section-of-sliced-moon');
 assert.ok(geometry.attributes.position.count>400);
 geometry.dispose();
 const blade=createCelestialJawBladeGeometry(THREE);
 assert.match(blade.userData.sculpture,/jaw-shaped/);
 blade.dispose();
 view.dispose();
 assert.equal(scene.children.length,0);
});
test('meteor is a genuinely angular gigantic slab, never a spherical dodecahedron',()=>{
 const shard=createFracturedMeteorGeometry(THREE,{variant:2,coarse:true});
 assert.equal(shard.userData.sculpture,'asymmetric-cracked-lunar-slab');
 assert.ok(shard.userData.facets>=8&&shard.attributes.position.count>=90);
 assert.equal(shard.groups.length,2);
 shard.dispose();
 const scene=new THREE.Scene(),view=createKwonMoonCataclysmView(scene,{coarse:true});
 const body=view.root.getObjectByName('kwon-lunar-3d-faceted-meteor');
 assert.equal(body.geometry.userData.sculpture,'asymmetric-cracked-lunar-slab');
 const g=atPhaseThree();g.boss.hp=KWON_MOON.threshold;beginKwonMoonCinematic(g);
 while(g.kwonMoon.mode==='cinematic')advanceKwonMoon(g,1/120);
 advanceKwonMoon(g,1/120);view.update(g);
 const h=g.kwonMoon.meteors[0],shadow=view.root.getObjectByName('kwon-natural-growing-meteor-shadow');
 assert.ok(h&&shadow.visible);
 assert.equal(shadow.position.x,h.x);assert.equal(shadow.position.z,h.z);
 assert.equal(shadow.userData.collisionRadius,h.radius,'visible shadow edge and collision radius must match');
 assert.ok(body.scale.x>=h.radius&&body.scale.y>=3.4,'rocks are much taller than the old sphere');
 const fallStart=moonMeteorHeight({...h,age:0}),fallEnd=moonMeteorHeight({...h,age:h.impact});
 assert.equal(fallStart,KWON_MOON.startHeight);
 assert.equal(fallEnd,KWON_MOON.landHeight);
 assert.ok(KWON_MOON.fall>6);
 assert.equal(moonMeteorProgress({...h,age:h.impact/2}),.5);
 view.dispose();
});
test('meteor camera tremor follows falling chunks and dies away after the storm',()=>{
 const h={id:0,x:0,z:0,age:KWON_MOON.fall*.88,impact:KWON_MOON.fall,landed:false};
 const state={mode:'storm',meteors:[h]};
 const player={x:0,z:0};
 assert.ok(moonStormTremor(state,player)>.08);
 assert.equal(moonStormTremor({...state,mode:'done'},player),0);
 assert.equal(moonStormTremor(state,{x:90,z:90}),0);
 const arena=readFileSync(new URL('../src/arena.mjs',import.meta.url),'utf8');
 assert.match(arena,/updateBossGhost/);
 assert.match(arena,/moonStormTremor/);
 assert.match(arena,/kwon-meteor-impact/);
});
