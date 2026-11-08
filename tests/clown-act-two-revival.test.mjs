import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownGame,stepClown,startClownPattern,PATTERNS,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {setCircusAct,stepCircusTroupe} from '../src/clown-troupe.mjs';
import {LEGACY_ECHO_CONFIG,LEGACY_ECHO_MOVES,legacyEchoCount,beginLegacyEchoAttack,stepLegacyEcho} from '../src/clown-legacy-echo.mjs';
import {createLegacyEchoView} from '../src/clown-legacy-echo-view.mjs';
import {CLOWN_PHASE2_CUES,clownPhase2Beat} from '../src/clown-phase2-score.mjs';
import {createClownPhase2Performance} from '../src/clown-phase2-performance.mjs';
import {TROUPE_DEFINITIONS,TROUPE_RUN} from '../src/clown-troupe-patterns.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';

const init=(seed=9)=>{
 const g=createClownGame('sword',{register:false,seed});
 g.boss.phase=2;g.boss.hp=g.boss.maxHp*.55;g.clown.horrorStage=2;
 setCircusAct(g,2);
 return g;
};
test('the old Seulwoo enters AFTER phase transition as one or two small targetable minis, never a second boss',()=>{
 for(const seed of [8,9,12,13]){
  const g=createClownGame('sword',{register:false,seed});
  const mainMaxHp=g.boss.maxHp;
  g.boss.phase=2;g.boss.state='transition';g.boss.t=1.8;
  g.clown.state='transition';g.clown.horrorStage=2;
  stepCircusTroupe(g,1/60,{zone(){},emit(){}});
  assert.equal(g.clown.troupe.members.length,0,'no miniature during the mandatory cutscene');
  g.boss.state='clown';g.clown.state='idle';setCircusAct(g,2);
  const echoes=g.clown.troupe.members.filter(m=>m.legacy);
  assert.equal(echoes.length,legacyEchoCount(g));
  assert.ok(echoes.length>=1&&echoes.length<=2);
  for(const e of echoes){
   assert.equal(e.role,'legacyEcho');
   assert.equal(e.maxHp,LEGACY_ECHO_CONFIG.hp);
   assert.ok(e.maxHp<g.boss.maxHp*.2,'subboss must stay low HP');
   assert.ok(Math.hypot(e.x-g.player.x,e.z-g.player.z)>4,'offscreen edge entrance, not immediate spawn hit');
   assert.ok(e.cooldown>2,'cannot instantly damage on appearance');
  }
  assert.equal(g.boss.maxHp,mainMaxHp,'mini-boss HP never changes the director HP');
  const once=echoes.map(e=>e.id);
  setCircusAct(g,2);
  assert.deepEqual(g.clown.troupe.members.filter(m=>m.legacy).map(e=>e.id),once,'no repeated summon');
  setCircusAct(g,3);
  assert.deepEqual(g.clown.troupe.members.filter(m=>m.legacy).map(e=>e.id),once,
   'the final director stage must ADD cast members without deleting surviving original minis');
 }
});
test('original retro model module is truly reused, has circus ball and is tiny in visual scene',()=>{
 const scene=new THREE.Scene(),view=createLegacyEchoView(scene,{coarse:true});
 const g=init(9);
 view.update(g,1/60);
 const count=g.clown.troupe.members.filter(m=>m.legacy).length;
 assert.equal(view.stats().miniMidbosses,count);
 const clones=[];view.root.traverse(o=>{if(o.name==='mini-original-ball-riding-seulwoo')clones.push(o);});
 assert.equal(clones.length,count);
 assert.ok(clones.every(x=>x.scale.x<=LEGACY_ECHO_CONFIG.scale&&x.scale.x>0));
 assert.ok(view.root.getObjectByName('original-circus-balance-ball')||
  view.root.getObjectByName('actual-legacy-circus-ball'),'old roller prop required in fallback');
 g.clown.horrorStage=3;setCircusAct(g,3);
 view.update(g,1/60);assert.equal(view.stats().miniMidbosses,count);
 assert.ok(view.stats().pooledOriginals<=LEGACY_ECHO_CONFIG.max);
 view.dispose();assert.equal(scene.children.length,0);
});
test('head bombs, glove clap, old rolling ball and juggling are reduced-damage fully warned mini attacks',()=>{
 const g=init(13),m=g.clown.troupe.members.find(x=>x.legacy);
 assert.equal(LEGACY_ECHO_MOVES.length,4);
 for(let k=0;k<4;k++){
  const zones=[],events=[],hurt=[];
  m.legacyAttackIndex=k;
  const attack=beginLegacyEchoAttack(g,m,{
   zone:(_g,z)=>{zones.push(z);return z},
   emit:(_g,type,event)=>events.push({type,...event})
  });
  assert.equal(attack.kind,LEGACY_ECHO_MOVES[k]);
  assert.ok(zones.length>=1);
  assert.ok(zones.every(z=>z.warn>=1.42));
  assert.ok(zones.every(z=>z.damage<=11));
  assert.ok(zones.every(z=>z.source==='legacyEcho'&&z.miniOwner===m.id));
  assert.ok(events.some(e=>e.type==='clown-legacy-echo-cast'));
  if(attack.kind==='roll'){
   assert.ok(zones.every(z=>z.visual===true&&z.damage===0),'the swept moving ball alone owns roll damage');
   const p=attack.from,q=attack.aim;
   g.player.x=p.x+(q.x-p.x)*.65;g.player.z=p.z+(q.z-p.z)*.65;
   for(let i=0;i<300;i++){
    g.clown.time=attack.start+i/120;
    stepLegacyEcho(g,m,{hurt:(_g,d,src)=>hurt.push({d,src})});
   }
   assert.ok(hurt.length<=1,'no multi-hit invisible sphere');
   assert.ok(hurt.every(h=>h.d<=11));
  }else{
   g.clown.time=attack.start+attack.wind+.5;
   stepLegacyEcho(g,m,{hurt:(_g,d)=>hurt.push(d)});
   assert.equal(hurt.length,0,'other attacks only use standard visible zone engine');
  }
  m.legacyAttack=null;
 }
});
test('phase-two conductor climax has a four-beat ordered score and never attacks or creates a skip button',()=>{
 const scene=new THREE.Scene(),view=createClownPhase2Performance(scene,{coarse:true});
 const g=createClownGame('sword',{register:false,seed:15});
 g.boss.phase=2;g.boss.state='transition';g.clown.state='transition';
 let last=-Infinity;
 const seen=[];
 for(const time of [0,.36,.96,1.52,2.12,2.91,3.42,4.14,4.8,5.14]){
  g.boss.t=time;
  const state=clownPhase2Beat(g);
  assert.ok(state.active);
  assert.ok(Number.isFinite(state.cameraDistance));
  assert.ok(state.cameraDistance<=0,'camera slowly approaches the director, no stage rotation');
  assert.ok(state.t>=last);last=state.t;
  view.update(g,1/60);
  seen.push(...g.events.splice(0));
 }
 assert.deepEqual(seen.filter(e=>e.type.startsWith('clown-phase2-')).map(e=>e.type),
  CLOWN_PHASE2_CUES.map(e=>e.type));
 assert.equal(view.stats().maskCount,8);
 assert.equal(view.stats().strings,11);
 assert.equal(view.root.userData.decorativeOnly,true);
 assert.equal(g.clown.zones.length,0,'cinematic is harmless');
 for(const e of seen.filter(e=>e.type.startsWith('clown-phase2-'))){
  const audio=bossFoleySpec(e,g);assert.match(audio.file,/\.mp3$/);
 }
 g.boss.state='clown';view.update(g,1/60);
 assert.equal(view.stats().active,false);
 view.dispose();assert.equal(scene.children.length,0);
});
const newShows=['mimicMirrorExchange','acrobatKnifeWaltz','puppetMarionetteScissors',
 'choristerThroatCanon','firekeeperCinderSpiral','grandCastCounterpoint'];
for(const name of newShows)test(name+' actually appears, signals physical cast and leaves a clean director punish interval',()=>{
 assert.ok(LIVE_REPERTOIRE.includes(name));
 assert.ok(TROUPE_DEFINITIONS.some(d=>d[0]===name));
 assert.equal(typeof TROUPE_RUN[name],'function');
 const g=init(63);
 if(name==='mimicMirrorExchange'){g.boss.phase=1;g.boss.hp=g.boss.maxHp;g.clown.horrorStage=1;}
 else if(name==='grandCastCounterpoint'){g.clown.horrorStage=3;g.boss.hp=g.boss.maxHp*.16;}
 g.player.invuln=9999;
 startClownPattern(g,name);
 const p=PATTERNS[name],zones=new Map();
 let punish=false;
 for(let i=0;i<Math.ceil((p.dur+.04)*120);i++){
  stepClown(g,1/120);
  if(g.clown.punish)punish=true;
  for(const z of g.clown.zones){
   if(['troupe','troupe-melee','legacyEcho'].includes(z.source))continue;
   if(z.damage>0&&!z.visual){
    zones.set(z.id,z);
    assert.ok(z.warn>=1.3,'bad warning '+name);
    assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z));
   }
  }
 }
 assert.ok(zones.size>=3,'new ensemble attack must have real hits');
 assert.ok(punish,'boss must offer reaction opening after whole show');
 assert.equal(g.clown.state,'idle');
 assert.equal(g.status,'playing');
});

test('one or two legacy mini Seulwoo performers actively cast during real phase-two fights, not just standing as decoration',()=>{
 const g=init(15);
 g.player.invuln=10000;
 g.player.hp=100000;
 let casts=0,originalBossAttacks=0,normalCasts=0,rollDistance=0;
 const minis=g.clown.troupe.members.filter(m=>m.legacy);
 for(let i=0;i<60*125&&g.status==='playing';i++){
  stepClown(g,1/60);
  for(const e of g.events){
   if(e.type==='clown-legacy-echo-cast')casts++;
   if(e.type==='clown-ringmaster-attack')originalBossAttacks++;
   if(e.type==='clown-troupe-cast')normalCasts++;
  }
  g.events.length=0;
 }
 assert.ok(casts>=2,'the original miniature needs independent attack turns (got '+casts+')');
 assert.ok(originalBossAttacks>=4,'ringmaster must continue leading the battle');
 assert.ok(normalCasts>=1,'ordinary cast must still be active');
 assert.ok(minis.every(m=>m.life===m.maxHp),'attacks do not consume the mini HP');
 assert.equal(g.boss.phase,2,'independent mini moves must not trigger another phase');
});
