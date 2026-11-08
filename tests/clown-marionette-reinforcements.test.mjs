import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {createCircusTroupe,setCircusAct,prepareCircusPhaseTransition,
 stepCircusTroupe} from '../src/clown-troupe.mjs';
import {beginLegacyEchoAttack,LEGACY_ECHO_CONFIG} from '../src/clown-legacy-echo.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {createLegacyEchoView} from '../src/clown-legacy-echo-view.mjs';
import {createClownActor} from '../src/clown-ringmaster-actor.mjs';
import {CLOWN_PHASE2_DURATION} from '../src/clown-phase2-score.mjs';
import {readFileSync} from 'node:fs';

const game=()=>createClownGame('sword',{register:false,seed:19});

test('phase changes preserve member identity, HP and position and ADD two newcomers',()=>{
 const g=game(),t=g.clown.troupe;
 setCircusAct(g,1);
 assert.equal(t.members.length,3);
 const originals=t.members.slice();
 originals[0].life-=37;originals[1].x+=1.7;
 const saved=originals.map(m=>({id:m.id,life:m.life,x:m.x}));
 prepareCircusPhaseTransition(g);
 assert.equal(t.members.length,3,'preparation never clears live cast');
 setCircusAct(g,2);
 assert.equal(t.members.filter(m=>!m.legacy).length,5);
 for(let i=0;i<3;i++){
  assert.equal(t.members[i],originals[i]);
  assert.equal(t.members[i].id,saved[i].id);
  assert.equal(t.members[i].life,saved[i].life);
  assert.equal(t.members[i].x,saved[i].x);
 }
 const before=t.members.slice(),oldIds=new Set(before.map(m=>m.id));
 setCircusAct(g,3);
 assert.equal(t.members.filter(m=>!m.legacy).length,7);
 assert.ok(before.every(m=>t.members.includes(m)),'existing cast and original minibosses survive low HP');
 assert.ok(t.members.filter(m=>!oldIds.has(m.id)).length>=2);
 setCircusAct(g,3);assert.equal(t.members.length,before.length+2,'same stage cannot repeatedly spawn');
});

test('the whole 2nd-act X controller is a real wooden rig behind a fully string-bound human',()=>{
 const g=game();g.boss.phase=2;g.boss.state='transition';g.boss.t=2.4;
 g.clown.state='transition';g.clown.horrorStage=2;
 const actor=createClownActor({coarse:true});
 actor.update(g,1/60);
 const cross=actor.root.getObjectByName('seulwoo-act-two-X-shaped-wooden-marionette-controller');
 assert.ok(cross?.visible,'the wooden puppet controller emerges during phase transition');
 let planks=0,strings=[];
 cross.traverse(o=>{
  if(o.name.startsWith('genuine-crossed-wooden-puppet-plank'))planks++;
  if(o.name.startsWith('real-marionette-string-'))strings.push(o);
 });
 assert.equal(planks,2,'the controller must form an actual X of crossing wood planks');
 assert.equal(strings.length,10,'strings must tie face, shoulders, hands, waist and ankles');
 assert.ok(strings.every(s=>s.isMesh&&Number.isFinite(s.scale.y)&&s.scale.y>.2));
 const before=strings[3].position.clone();
 g.boss.state='clown';g.boss.t=CLOWN_PHASE2_DURATION;g.clown.time+=1.3;
 actor.update(g,1/30);
 assert.ok(cross.visible,'controller remains visible for whole phase 2');
 assert.ok(strings[3].position.distanceTo(before)>.01,'animated wrist must pull its actual string');
 g.boss.phase=1;actor.update(g,1/30);
 assert.equal(cross.visible,false,'wood and strings only attach in second act');
 actor.disposePortrait();
});

test('original mini rigs load before battle, show a whole clown body and reuse exact rig',async()=>{
 const scene=new THREE.Scene(),view=createLegacyEchoView(scene,{coarse:true});
 const ready=view.prewarm();await ready;
 assert.equal(view.stats().pooledOriginals,LEGACY_ECHO_CONFIG.max);
 view.prepareGpuWarmup();
 const total=scene.getObjectByName('original-seulwoo-mini-midbosses');
 assert.ok(total?.getObjectByName('vintage-original-full-velvet-torso')||
  total?.getObjectByName('sculpted-original-clown-head')||
  total?.getObjectByName('vintage-original-sculpted-clown-head')||
  total?.getObjectByName('sculpted-ringmaster-face')||
  total?.getObjectByName('old-seulwoo-head-fallback')||
  total?.getObjectByName('clown-head'),
  'legacy actor must contain a real head or detailed torso, not only a striped sphere');
 view.finishGpuWarmup();
 const g=game();g.boss.phase=2;g.clown.horrorStage=2;
 setCircusAct(g,2);
 view.update(g,1/30);
 const oldCount=view.stats().miniMidbosses;
 assert.ok(oldCount>=1&&oldCount<=2);
 assert.equal(view.stats().pooledOriginals,LEGACY_ECHO_CONFIG.max-oldCount);
 const rigs=view.root.children.filter(o=>o.name==='mini-original-ball-riding-seulwoo'&&o.visible);
 assert.equal(rigs.length,oldCount);
 view.clear();
 assert.equal(view.stats().pooledOriginals,LEGACY_ECHO_CONFIG.max);
 view.update(g,1/30);
 assert.equal(view.stats().miniMidbosses,oldCount,'same prebuilt actors are reused');
 view.dispose();
});

test('legacy mini shows real projectile geometry during head bomb and juggling anticipation',()=>{
 const scene=new THREE.Scene(),view=createLegacyEchoView(scene,{coarse:true});
 const g=game();g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);
 const m=g.clown.troupe.members.find(x=>x.legacy);
 view.update(g,1/30);
 for(const kind of ['headBomb','juggle']){
  m.legacyAttackIndex=kind==='headBomb'?0:1;
  const zones=[];
  const atk=beginLegacyEchoAttack(g,m,{zone:(_g,z)=>zones.push(z),emit(){}});
  assert.equal(atk.kind,kind);
  assert.ok(atk.shots.length>=1);
  g.clown.time=atk.start+.8;
  view.update(g,1/30);
  const visuals=[];
  view.root.traverse(x=>{
   if(x.name==='mini-original-clown-physical-juggling-projectile'&&x.visible)visuals.push(x);
  });
  assert.ok(visuals.length>=1,'ball/projectile must be visible during '+kind);
  assert.ok(zones.every(z=>z.warn>=1.42&&z.damage<=LEGACY_ECHO_CONFIG.damage.roll));
  m.legacyAttack=null;g.clown.time+=2.0;
 }
 view.dispose();
});

test('the troupe and mini actor GPU pool are prepared before combat begins',()=>{
 const stage=new THREE.Scene(),view=createCircusTroupeView(stage,{coarse:true});
 view.prewarm();assert.ok(view.stats().pooled>=8);
 view.prepareGpuWarmup();view.finishGpuWarmup();
 const g=game();setCircusAct(g,1);view.update(g,1/30);
 assert.equal(view.stats().performers,3);
 assert.ok(view.stats().pooled>=5,'stage two reinforcements are already modeled');
 g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);view.update(g,1/30);
 assert.equal(view.stats().performers,5);
 view.dispose();
 const battle=readFileSync(new URL('../src/clown-battle.mjs',import.meta.url),'utf8');
 assert.match(battle,/troupeView\.prewarm\(\)/);
 assert.match(battle,/legacyEchoes\.prewarm\(\)/);
 assert.match(battle,/warmup\.start\(\)/);
});
