import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as THREE from 'three';
import {createClownGame,startClownPattern,stepClown,PATTERNS,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {ENSEMBLE_DEFINITIONS,ENSEMBLE_RUN,REMASTERED_CIRCUS_RUN} from '../src/clown-ensemble-repertoire.mjs';
import {HORROR_RUN,horrorMinStage} from '../src/clown-horror-patterns.mjs';
import {cueCircusShow,setCircusAct,stageCircusBeat,circusTroupeAlive} from '../src/clown-troupe.mjs';
import {troupeBeatMotion,circusPerformanceMode} from '../src/clown-ensemble-poses.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {createClownTheatreCues,clownTheatreCueKind} from '../src/clown-theatre-cues.mjs';
import {clownCuePalette} from '../src/clown-danger-spotlight.mjs';
import {CLOWN_ENSEMBLE_RECORDINGS,clownEnsembleRecording} from '../src/clown-ensemble-recordings.mjs';
import {createClownRecordedFoley} from '../src/clown-stage-recordings.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';

test('fourteen new and four remastered performances are really registered in live combat',()=>{
 assert.equal(ENSEMBLE_DEFINITIONS.length,14);
 assert.equal(Object.keys(REMASTERED_CIRCUS_RUN).length,4);
 for(const [key,,dur,recover,phases,stage] of ENSEMBLE_DEFINITIONS){
  assert.equal(typeof HORROR_RUN[key],'function',key);
  assert.ok(LIVE_REPERTOIRE.includes(key),key);
  assert.equal(horrorMinStage(key),stage,key);
  assert.deepEqual(PATTERNS[key].phases,phases,key);
  assert.ok(PATTERNS[key].dur>recover+2,key);
 }
 for(const key of Object.keys(REMASTERED_CIRCUS_RUN))
  assert.ok(LIVE_REPERTOIRE.includes(key),key);
 for(const banned of ['ballRain','ballSpin','bounceChain','ballCannon'])
  assert.ok(!LIVE_REPERTOIRE.includes(banned),'old phantom ball cast remains: '+banned);
});
for(const [key,,duration,recovery,phases,stage] of ENSEMBLE_DEFINITIONS){
 test(key+' casts real delayed zones and grants a usable retaliation interval',()=>{
  const g=createClownGame('sword',{register:false,seed:112});
  g.boss.phase=phases.includes(1)?1:2;
  g.boss.hp=g.boss.maxHp*(stage===3?.18:stage===2?.55:1);
  g.clown.horrorStage=stage;
  g.player.invuln=9999;
  startClownPattern(g,key);
  let recovered=false,samples=0,warningIds=new Set();
  const total=PATTERNS[key].dur;
  for(let i=0;i<Math.ceil((total+.04)*120);i++){
   stepClown(g,1/120);
   if(g.clown.punish)recovered=true;
   for(const z of g.clown.zones)if(z.state==='warn'&&z.damage>0){
    warningIds.add(z.id);
    assert.ok(z.warn>=1.20,key);
    assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z),key);
    samples++;
   }
  }
  assert.ok(warningIds.size>=2,'must actually perform several beats '+key);
  assert.ok(samples>=15,'readable warning duration '+key);
  assert.ok(recovered,'no recovery '+key);
  assert.equal(g.clown.state,'idle');
 });
}
test('new cast gestures actually bind to performers, with old instruments held by the same models',()=>{
 const g=createClownGame('sword',{register:false,seed:13});
 g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);
 cueCircusShow(g,'drums');
 const member=stageCircusBeat(g,{role:'acrobat',pose:'drum',wind:1.3});
 assert.ok(member?.routine&&member.routine.pose==='drum');
 assert.equal(troupeBeatMotion(member,g.clown.time+.22).pose,'drum');
 assert.equal(circusPerformanceMode('knifeJugglerRelay'),'juggle');
 assert.equal(circusPerformanceMode('allCastRequiem'),'finale');
 const scene=new THREE.Scene(),view=createCircusTroupeView(scene,{coarse:true});
 view.update(g,1/60);
 const drum=view.root.getObjectByName('antique-circus-drum-and-sticks');
 assert.ok(drum?.visible,'physical drum visible on the player-facing performer');
 stageCircusBeat(g,{role:'acrobat',pose:'juggle'});
 view.update(g,1/60);
 assert.ok(view.root.getObjectByName('juggled-metal-knife'));
 view.dispose();
});
test('reused uploaded circus recordings are present and play without synthesized tones',async()=>{
 for(const [kind,spec] of Object.entries(CLOWN_ENSEMBLE_RECORDINGS))
  assert.ok(existsSync(new URL('../'+spec.file,import.meta.url)),kind+': '+spec.file);
 for(const kind of Object.keys(CLOWN_ENSEMBLE_RECORDINGS)){
  const note=clownEnsembleRecording({type:'clown-troupe-beat',kind});
  assert.ok(note?.file.startsWith('assets/sfx/'),kind);
  assert.equal(bossFoleySpec({type:'clown-troupe-beat',kind},{boss:{},clown:{}}).file,note.file);
 }
 let clock=0,muted=false,played=0,stopped=0;
 class FakeAudio{
  constructor(url){this.src=url;this.volume=0;this.playbackRate=1;this.currentTime=0;}
  play(){played++;return Promise.resolve();}
  pause(){stopped++;}
  removeAttribute(){}
  load(){}
 }
 const bus=createClownRecordedFoley({AudioClass:FakeAudio,now:()=>clock,muted:()=>muted,gain:()=>1});
 const spec=clownEnsembleRecording({type:'clown-troupe-beat',kind:'choir'});
 assert.equal(bus.play(spec),true);assert.equal(played,1);assert.equal(bus.stats().active,1);
 assert.equal(bus.play(spec),false,'overlapping same sample must be throttled');
 bus.update(.2);muted=true;bus.update(.01);
 assert.equal(bus.stats().active,0,'muting stops current clip');
 assert.ok(stopped>0);
 bus.dispose();
});
test('each stage cue follows an actual warning and disposes without hidden hitboxes',()=>{
 const sounds=['knifeJuggler','drumLine','trapezeWire','trapdoorRevue','maskedCannon',
  'curtainEcho','candleChoir','marionetteStrings','mirrorDouble'];
 const g={time:0,clown:{zones:sounds.map((sound,i)=>({
  id:i+1,sound,state:'warn',warn:1.35,age:.4,x:i*2-8,z:0,
  shape:i%2?'circle':'lane',len:12,w:2.4,r:3,yaw:.4,damage:23
 }))}};
 const scene=new THREE.Scene(),fx=createClownTheatreCues(scene,{coarse:true});
 for(const zone of g.clown.zones)assert.ok(clownTheatreCueKind(zone),zone.sound);
 assert.equal(new Set(sounds.map(sound=>clownCuePalette({sound}).color)).size>=6,true);
 fx.update(g,1/60);
 assert.equal(fx.stats().active,sounds.length);
 for(const id of ['rotating-circus-juggler-knife','bass-drum-concussive-wave',
  'high-wire-aerial-acrobat-lines','opening-theatre-trapdoor-rim',
  'masked-cannonball-descends-on-warning','heavy-circus-velvet-silhouette-strings'])
  assert.ok(fx.root.getObjectByName(id),id);
 for(const z of g.clown.zones)z.state='burst';
 fx.update(g,1/60);assert.equal(fx.stats().active,0);
 fx.dispose();
});
