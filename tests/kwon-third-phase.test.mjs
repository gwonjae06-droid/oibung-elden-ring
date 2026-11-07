import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGame,step,beginSequence,chooseOpening,PHASE_ONE,SEQUENCES,PHASE_THREE,
 PATTERNS,CINEMATIC,cinematicPose,KWON_RANGE_PRESSURE,patternConfig} from '../src/combat.mjs';
import {damageArenaBoss} from '../src/arena-damage.mjs';
import {KWON_THREE,KWON_THIRD_FAR,KWON_THIRD_PATTERNS,makeKwonFractures,
 kwonFractureFront,kwonFractureContact,advanceKwonFractures,
 kwonThirdTransition,kwonThirdSwordDrive} from '../src/kwon-third-phase.mjs';
import {createKwonThirdPhaseView} from '../src/kwon-third-phase-view.mjs';

const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)step(g,1/120);};
test('Kwon owns 100-66.7 / 66.7-33.3 / 33.3-0 HP acts, without changing Clown',()=>{
 const g=createGame('sword',{register:false});
 const threshold1=g.boss.maxHp*KWON_THREE.first;
 const threshold2=g.boss.maxHp*KWON_THREE.second;
 const w=()=>{
  g.boss.state='idle';g.boss.t=0;g.boss.wait=1;
  g.player.invuln=100;
 };
 w();damageArenaBoss(g,g.boss.hp-threshold1+1,0,{developer:true});
 assert.equal(g.boss.phase,2);assert.equal(g.boss.state,'transition');
 assert.ok(g.boss.hp<threshold1);
 tick(g,CINEMATIC+.1);assert.equal(g.boss.state,'idle');
 w();damageArenaBoss(g,g.boss.hp-threshold2+1,0,{developer:true});
 assert.equal(g.boss.phase,3);assert.equal(g.boss.state,'transition');
 assert.ok(g.boss.hp<threshold2);
 assert.deepEqual(g.kwonFractures,[]);
 assert.equal(cinematicPose(g.boss).detach,1,'jaw must remain sword in third-act transition');
 tick(g,CINEMATIC+.1);assert.equal(g.boss.state,'idle');
 w();damageArenaBoss(g,g.boss.hp+1,0,{developer:true});
 assert.equal(g.status,'won');assert.equal(g.boss.phase,3);
 const c=createGame('sword',{register:false});
 c.clown={zones:[],bombs:[],waves:[]};
 damageArenaBoss(c,c.boss.hp*.5,0,{developer:true});
 assert.equal(c.boss.phase,2,'Clown keeps original half-health transformation');
});

test('phase three has its own complete, legal move deck with authored, readable cues',()=>{
 assert.ok(Object.keys(PHASE_THREE).length>=8);
 assert.ok(Object.keys(KWON_THIRD_PATTERNS).length>=6);
 for(const [name,sequence] of Object.entries(PHASE_THREE)){
  assert.ok(sequence.length>0,name);
  for(const move of sequence)assert.ok(PATTERNS[move],move);
 }
 assert.deepEqual(Object.keys(PHASE_ONE).includes('skyRend'),false);
 assert.deepEqual(Object.keys(SEQUENCES).includes('skyRend'),false);
 for(let seed=1;seed<=20;seed++){
  const g=createGame('sword',{register:false,seed});g.boss.phase=3;
  g.player.z=20;
  const names=new Set();
  for(let i=0;i<Object.keys(PHASE_THREE).length*2;i++){
   const opening=chooseOpening(g);
   assert.ok(PHASE_THREE[opening],opening);
   names.add(opening);
   beginSequence(g,opening);assert.ok(PATTERNS[g.boss.pattern]);
   g.boss.state='idle';
  }
  assert.equal(names.size,Object.keys(PHASE_THREE).length);
 }
});

test('the distant phase-three boss cannot issue ordinary melee in empty air',()=>{
 const g=createGame('sword',{register:false,seed:17});g.boss.phase=3;
 g.boss.state='idle';g.boss.wait=0;
 g.player.z=g.boss.z+9;g.player.invuln=100;
 tick(g,.16);
 assert.equal(g.boss.state,'idle','must chase at medium distance');
 for(let i=0;i<900&&g.boss.state==='idle';i++)step(g,1/120);
 assert.ok(g.boss.state==='windup');
 assert.ok(Math.hypot(g.player.x-g.boss.x,g.player.z-g.boss.z)<KWON_RANGE_PRESSURE.engageDistance+.2);
});

test('third-act sky rifts are emitted only at the sword contact beat, never on windup',()=>{
 for(const attack of ['skyRend','earthRend','heavenSplit']){
  const g=createGame('sword',{register:false});g.boss.phase=3;
  g.player.x=0;g.player.z=20;g.player.invuln=100;
  beginSequence(g,attack);
  const cfg=patternConfig(g.boss);
  tick(g,cfg.wind-.09);
  assert.equal(g.kwonFractures.length,0,'no invisible early damage');
  tick(g,.09+cfg.active*.9);
  assert.ok(g.kwonFractures.length>=1,'real cracks appear during animated cut');
  assert.ok(g.kwonFractures.every(q=>q.age<=cfg.active&&q.kind==='kwon-earth-sky-rift'));
 }
});

test('travelling ground/sky front has predictable delayed hit and safe side lanes',()=>{
 const b={x:0,z:0,yaw:0};
 const [q]=makeKwonFractures(b,'skyRend',8);
 assert.equal(q.age,0);assert.equal(q.id,8);
 const player={x:0,z:10};
 assert.equal(kwonFractureContact(q,player,0),false);
 const g={player,kwonFractures:[q]};
 let hits=0;for(let i=0;i<160;i++)advanceKwonFractures(g,1/120,()=>hits++);
 assert.equal(hits,1,'passing fracture contacts exactly once');
 const [safe]=makeKwonFractures(b,'skyRend',9);
 const s={player:{x:3,z:10},kwonFractures:[safe]};
 hits=0;for(let i=0;i<160;i++)advanceKwonFractures(s,1/120,()=>hits++);
 assert.equal(hits,0,'one sideways dodge clears the whole lane');
 assert.ok(kwonFractureFront(safe)>0);
});

test('possession waits for the blade to wake then pulls the body before the sky rupture',()=>{
 const a=kwonThirdTransition(.6),b=kwonThirdTransition(2),c=kwonThirdTransition(3.4),d=kwonThirdTransition(4.5);
 assert.equal(a.bladeWake,0);assert.ok(b.bladeWake>0);assert.ok(c.bodyPulled>.8);
 assert.equal(c.skyScar,0);assert.equal(d.skyScar,1);
 const t=kwonThirdSwordDrive({phase:3,state:'transition',t:2.5});
 assert.ok(t.lead>t.pull,'blade starts before the body');
});

test('pooled 3D ground fractures and sky wounds share rift positions and release all resources',()=>{
 const scene=new THREE.Scene(),view=createKwonThirdPhaseView(scene);
 const boss={phase:3,state:'active',t:.2,x:1,z:-2};
 const q=makeKwonFractures({x:1,z:-2,yaw:.7},'skyRend',22)[0];
 const g={boss,kwonFractures:[q]};
 view.update(g);
 assert.equal(view.stats().live,1);
 assert.ok(view.root.getObjectByName('kwon-torn-sky'));
 q.age=1.4;view.update(g);
 assert.ok(view.root.getObjectByName('kwon-torn-sky').visible);
 g.kwonFractures=[];view.update(g);assert.equal(view.stats().live,0);
 boss.state='transition';boss.t=4.2;view.update(g);
 assert.ok(view.root.getObjectByName('kwon-sword-possession-sky-wound').visible);
 view.dispose();assert.equal(scene.children.length,0);
 view.dispose();
});
