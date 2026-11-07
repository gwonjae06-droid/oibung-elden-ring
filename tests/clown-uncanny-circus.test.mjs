import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownGame,startClownPattern,stepClown,PATTERNS,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {setCircusAct,cueCircusShow,stageCircusBeat,stepCircusTroupe,
 beginCircusReprise,circusUncannyFrame,circusHorrorMusicGain} from '../src/clown-troupe.mjs';
import {clownTheatreCueKind} from '../src/clown-theatre-cues.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {clownEnsembleRecording} from '../src/clown-ensemble-recordings.mjs';

const newRituals=[
 ['synchronizedHush',1,1,3],
 ['corpseMarionetteReprise',2,2,4],
 ['mouthlessLament',2,2,5]
];
for(const [id,phase,stage,minHits] of newRituals){
 test(id+' provides real hitzones after visible natural windup, then becomes punishable',()=>{
  const g=createClownGame('sword',{register:false,seed:67});
  g.boss.phase=phase;g.boss.hp=g.boss.maxHp*(stage>=2?.5:1);
  g.clown.horrorStage=stage;g.player.invuln=999;
  startClownPattern(g,id);
  const p=PATTERNS[id];assert.ok(p&&LIVE_REPERTOIRE.includes(id));
  assert.ok(p.precast>=.55&&p.recover>=1.4);
  const seen=new Map();let punish=false;
  for(let i=0;i<Math.ceil((p.dur+.04)*120);i++){
   stepClown(g,1/120);
   if(g.clown.punish)punish=true;
   for(const z of g.clown.zones){
    if(z.damage>0&&!z.visual){
     seen.set(z.id,z);
     assert.ok(z.warn>=1.30,'unwarned blow: '+id);
     assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z));
    }
   }
  }
  assert.ok(seen.size>=minHits,'ritual needs distinct visible attacks: '+id);
  assert.equal(punish,true,'must permit retaliatory strike');
  assert.equal(g.clown.state,'idle');
 });
}
test('killed performers are remembered as corpses, not secretly revived enemies',()=>{
 const g=createClownGame('hammer',{register:false,seed:37});
 g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);
 const cast=g.clown.troupe.members;
 const target=cast.find(m=>m.role==='chorister');
 target.life=10;
 g.player.x=target.x;g.player.z=target.z+2;
 g.player.action={kind:'attack',wind:.02,active:.3,t:.06,yaw:Math.PI};
 stepCircusTroupe(g,1/60,{zone(){},emit(){}});
 assert.equal(target.down,true);
 assert.equal(g.clown.troupe.fallen[0].id,target.id);
 const count=cast.length;
 const reprise=beginCircusReprise(g,{duration:7.3});
 assert.equal(reprise.bodies.length,3);
 assert.ok(reprise.bodies.find(x=>x.realCorpse&&x.id==='fallen-'+target.id));
 assert.equal(g.clown.troupe.members.length,count,'ghosts never enter combat');
 assert.ok(reprise.bodies.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)));
 const scene=new THREE.Scene(),view=createCircusTroupeView(scene,{coarse:true});
 view.update(g,1/60);
 assert.equal(view.stats().ghostPuppets,3);
 assert.ok(view.root.getObjectByName('visible-strings-lifting-dead-performer'));
 assert.ok(view.root.getObjectByName('fractured-dead-performer-face'));
 g.clown.time=reprise.end+.01;view.update(g,1/60);
 assert.equal(view.stats().ghostPuppets,0);
 view.dispose();assert.equal(scene.children.length,0);
});
test('empty graveyard fallback is clearly inanimate mannequin scenery, not enemies',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);
 const enemies=g.clown.troupe.members.length;
 const r=beginCircusReprise(g);
 assert.equal(r.bodies.length,3);
 assert.ok(r.bodies.every(x=>x.realCorpse===false));
 assert.equal(g.clown.troupe.members.length,enemies);
});
test('the act-two choir genuinely has no opening mouth, while chest and porcelain cracks deform',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);
 const scene=new THREE.Scene(),view=createCircusTroupeView(scene,{coarse:true});
 stageCircusBeat(g,{role:'chorister',pose:'sing',hold:2});
 g.clown.time+=.45;view.update(g,1/60);
 const mouth=view.root.getObjectByName('singing-mask-mouth'),
  seal=view.root.getObjectByName('seamless-mouthless-porcelain-seal'),
  crack=view.root.getObjectByName('singing-face-stress-fracture');
 assert.ok(mouth&&!mouth.visible);
 assert.ok(seal?.visible);
 assert.ok(crack?.visible);
 assert.ok(view.root.getObjectByName('resonant-choir-air-ring')===undefined,
  '3D warning rings must appear only for real attacking zones');
 view.dispose();
});
test('all performers inherit the same ringmaster grin only in the third-act finale',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=2;g.clown.horrorStage=3;setCircusAct(g,3);
 const scene=new THREE.Scene(),view=createCircusTroupeView(scene,{coarse:true});
 view.update(g,1/60);
 assert.equal(view.root.getObjectByName('all-performers-share-ringmaster-face')?.visible,false);
 cueCircusShow(g,'finale');
 g.clown.time+=2.0;
 const state=circusUncannyFrame(g);
 assert.ok(state.face>.95);
 view.update(g,1/60);
 const faces=[];
 view.root.traverse(o=>{if(o.name==='all-performers-share-ringmaster-face')faces.push(o);});
 assert.equal(faces.length,view.stats().performers);
 assert.ok(faces.every(f=>f.visible));
 assert.ok(view.root.getObjectByName('unison-too-wide-locked-smile'));
 view.dispose();
});
test('first-act synchronized silence is only a visual and sound cue, never direct damage',()=>{
 const g=createClownGame('sword',{register:false});
 g.clown.horrorStage=1;setCircusAct(g,1);
 const hp=g.player.hp;cueCircusShow(g,'hush');
 g.clown.time+=.7;
 const state=circusUncannyFrame(g);
 assert.ok(state.hush>.75);
 assert.equal(g.player.hp,hp);
 assert.equal(g.clown.zones.length,0);
 const sfx=clownEnsembleRecording({type:'clown-troupe-show',show:'hush'});
 assert.match(sfx.file,/audiencewhisper\.mp3$/);
 assert.equal(clownTheatreCueKind({state:'warn',warn:1.4,sound:'corpseRepriseStrings'}),'puppet');
 assert.equal(clownTheatreCueKind({state:'warn',warn:1.4,sound:'mouthlessChoir'}),'choir');
});

test('stage-one synchronized stop and stage-three common face briefly duck the real MP3 without stopping it',()=>{
 const g=createClownGame('sword',{register:false});
 g.clown.horrorStage=1;setCircusAct(g,1);
 assert.equal(circusHorrorMusicGain(g),1);
 cueCircusShow(g,'hush');g.clown.time+=.7;
 assert.ok(circusHorrorMusicGain(g)<.20,'audience whisper dominates the silence');
 g.clown.time+=2;
 assert.equal(circusHorrorMusicGain(g),1,'score returns on cue without restart');
 g.boss.phase=2;g.clown.horrorStage=3;setCircusAct(g,3);
 cueCircusShow(g,'finale');g.clown.time+=1.16;
 assert.ok(circusHorrorMusicGain(g)<.25);
 g.clown.time+=1.5;
 assert.equal(circusHorrorMusicGain(g),1,'theatrical duck ends before finale attacks');
});
