import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownActor} from '../src/clown-ringmaster-actor.mjs';
import {CLOWN_FACE} from '../src/clown-face.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
import {createClownGame,choosePattern,startClownPattern,stepClown,PATTERNS,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {RINGMASTER_ATTACK_DEFINITIONS,RINGMASTER_ATTACK_RUN} from '../src/clown-ringmaster-attacks.mjs';
import {HORROR_RUN,horrorMinStage} from '../src/clown-horror-patterns.mjs';
import {clownTheatreCueKind,createClownTheatreCues} from '../src/clown-theatre-cues.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';
import {circusPerformanceMode} from '../src/clown-ensemble-poses.mjs';

test('the rebuilt director wears the repository original human face wrapped on curved animated skin, not a paper plane',async()=>{
 assert.ok(CLOWN_FACE.jpeg.length>9000);
 const a=createClownActor({coarse:true});
 assert.equal(a.isRebuiltRingmaster,true);
 assert.equal(a.head.source,'clown-face.mjs');
 const surface=a.root.getObjectByName('o-seulwoo-original-face-curved-uv-skin');
 assert.ok(surface);
 assert.equal(surface.geometry.type,'SphereGeometry');
 assert.ok(surface.geometry.attributes.uv.count>400,'curved face has UVs over 3D skin');
 assert.ok(a.root.getObjectByName('hand-sculpted-porcelain-face'),'porcelain remains as fallback');
 const loaded=await a.head.ready;
 assert.equal(typeof loaded,'boolean');
 disposeScene(a.root);
});

test('all seven personal attacks are registered with phase eligibility, motion and a real attack routine',()=>{
 assert.equal(RINGMASTER_ATTACK_DEFINITIONS.length,7);
 const poses=['baton','veil','cackle','lash','hoop','hunt','verdict'];
 RINGMASTER_ATTACK_DEFINITIONS.forEach(([id,,dur,recover,phases,stage],i)=>{
  assert.ok(LIVE_REPERTOIRE.includes(id),id);
  assert.deepEqual(PATTERNS[id].phases,phases,id);
  assert.equal(horrorMinStage(id),stage,id);
  assert.equal(typeof RINGMASTER_ATTACK_RUN[id],'function');
  assert.equal(typeof HORROR_RUN[id],'function');
  assert.equal(circusPerformanceMode(id),poses[i],id);
  assert.ok(dur-recover>3.5,id);
 });
});

for(const [id,,duration,recovery,phases,stage] of RINGMASTER_ATTACK_DEFINITIONS)
 test(id+' uses a visible authored windup, actually fights, and finishes with counterattack space',()=>{
  const g=createClownGame('sword',{register:false,seed:91});
  g.boss.phase=phases[0];g.boss.hp=g.boss.maxHp*(stage===3?.20:stage===2?.55:1);
  g.clown.horrorStage=stage;g.player.invuln=1e5;
  const start={x:g.boss.x,z:g.boss.z};
  startClownPattern(g,id);
  const d=PATTERNS[id],lead=d.precast;
  for(let i=0;i<Math.ceil((lead-.01)*120);i++)stepClown(g,1/120);
  assert.equal(g.clown.zones.length,0,'no hitbox before visible precast '+id);
  const zones=new Map();let punished=false;
  const events=new Set();
  for(let i=0;i<Math.ceil((d.dur+.05-lead)*120);i++){
   stepClown(g,1/120);
   if(g.clown.punish)punished=true;
   for(const e of g.events)events.add(e.type);
   for(const z of g.clown.zones){
    zones.set(z.id,z);
    assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z));
    assert.ok(z.warn>=.85,id+' warning too quick');
    if(z.state==='warn'&&!z.visual&&z.damage>0)
     assert.ok(z.warn>=1.12,id+' unannounced damaging strike');
   }
  }
  assert.ok(events.has('clown-ringmaster-attack'),id+' must have his own attack events');
  assert.equal(punished,true,id+' must finish with a punish window');
  assert.equal(g.clown.state,'idle',id);
  const dangerous=[...zones.values()].filter(z=>z.damage>0&&!z.visual);
  assert.ok(dangerous.length>= (id==='directorVelvetStep'||id==='directorStalkingRush'?1:3),id+' needs actual damage warnings');
  if(['directorVelvetStep','directorStalkingRush','directorFinalVerdict'].includes(id)){
   assert.ok(Math.hypot(g.boss.x-start.x,g.boss.z-start.z)>3,id+' must move the real boss, not a puppet');
  }
  assert.ok(!g.clown.waves.length,'no legacy surprise ball wave');
 });

test('director appears in the first three legal casts and does not rely on surviving troupe members',()=>{
 const g=createClownGame('sword',{register:false,seed:12});
 const openings=[];
 for(let i=0;i<3;i++){const id=choosePattern(g);openings.push(id);startClownPattern(g,id);g.clown.last=id;}
 assert.deepEqual(new Set(openings),new Set(['directorBatonRake','directorVelvetStep','directorCackle']));
 const h=createClownGame('sword',{register:false,seed:33});
 h.boss.phase=2;h.clown.horrorStage=3;h.clown.troupe.members=[];
 startClownPattern(h,'directorFinalVerdict');
 h.player.invuln=1e5;
 for(let i=0;i<900;i++)stepClown(h,1/120);
 assert.equal(h.status,'playing');
 assert.ok(h.events.some(e=>e.type==='clown-ringmaster-attack'));
});
test('director stage FX and recorded metal/voice/string/fire samples follow only real warnings',()=>{
 const expectations={directorBaton:'director-blade',directorVerdict:'director-blade',
  directorStrings:'puppet',directorCackle:'choir',directorFireRing:'director-hoop',
  directorFinalStomp:'director-impact'};
 const scene=new THREE.Scene(),fx=createClownTheatreCues(scene,{coarse:true});
 const g=createClownGame('sword',{register:false});
 g.clown.zones=Object.entries(expectations).map(([sound],i)=>({
  id:i+1,state:'warn',age:.38,warn:1.4,shape:sound==='directorFireRing'||sound==='directorFinalStomp'?'circle':'lane',
  x:i*2-4,z:1,yaw:0,len:12,w:2.4,r:3,damage:24,sound
 }));
 for(const z of g.clown.zones)assert.equal(clownTheatreCueKind(z),expectations[z.sound]);
 fx.update(g,1/60);
 assert.equal(fx.stats().active,Object.keys(expectations).length);
 assert.ok(fx.root.getObjectByName('director-baton-slashing-over-real-lane'));
 g.clown.zones=[];fx.update(g,1/60);assert.equal(fx.stats().active,0);
 fx.dispose();assert.equal(scene.children.length,0);
 const audio=bossFoleySpec({type:'clown-ringmaster-attack',kind:'knife'},g);
 assert.match(audio.file,/sharpening-blade/);
 const scream=bossFoleySpec({type:'clown-impact',key:'directorCackle'},g);
 assert.match(scream.file,/womanvoice/);
});
test('ringmaster attack arms and actual baton remain attached to his own body',()=>{
 const g=createClownGame('sword',{register:false,seed:64});
 const a=createClownActor({coarse:true});
 startClownPattern(g,'directorBatonRake');
 for(let i=0;i<200;i++)stepClown(g,1/120);
 a.update(g,1/60);
 const razor=a.root.getObjectByName('real-director-razor-edged-baton');
 assert.ok(razor?.visible);
 assert.ok(a.root.getObjectByName('directors-own-living-marionette-weapon'));
 disposeScene(a.root);
});
