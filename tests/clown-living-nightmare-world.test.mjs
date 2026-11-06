import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownGame,stepClown,PATTERNS,startClownPattern} from '../src/clown-combat.mjs';
import {HORROR_PATTERNS} from '../src/clown-horror-patterns.mjs';
import {nightmareWorldState,createClownLivingWorld,NIGHTMARE_PALETTES} from '../src/clown-nightmare-world.mjs';
import {clownMutationPose} from '../src/clown-nightmare-mutation.mjs';
import {createClownNightmareAnatomy} from '../src/clown-nightmare-anatomy.mjs';
import {CLOWN_NIGHTMARE_FILES,CLOWN_NIGHTMARE_SFX_MANIFEST} from '../src/clown-nightmare-sfx.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';
import {clownDangerSpotlightCue} from '../src/clown-danger-spotlight.mjs';

function make(stage=3){
 const g=createClownGame('sword',{register:false,seed:739});
 g.boss.phase=stage>=2?2:1;g.clown.horrorStage=stage;
 g.boss.hp=g.boss.maxHp*(stage===3?.18:stage===2?.42:.83);
 return g;
}
test('world modes follow active horror shows and rotate in idle without touching combat',()=>{
 const g=make(3);
 const cases={wrongTwin:'mirror',emptyAudience:'audience',stageRupture:'inversion',
  mouthOfTheAudience:'flesh',foldedCrawl:'flesh',livingShadow:'void'};
 for(const [pattern,mode]of Object.entries(cases)){
  g.clown.name=pattern;g.clown.state='pattern';
  assert.equal(nightmareWorldState(g).mode,mode);
 }
 g.clown.state='idle';g.clown.name=null;
 const modes=new Set();
 for(const t of[0,11,22,33,44]){g.clown.time=t;modes.add(nightmareWorldState(g).mode);}
 assert.equal(modes.size,5);
 assert.equal(nightmareWorldState(g).stage,3);
 assert.ok(nightmareWorldState(g).exposure>0&&nightmareWorldState(g).exposure<=.98);
 assert.ok(Object.keys(NIGHTMARE_PALETTES).includes('inversion'));
});
test('breathing scenery changes atmospheric colors but keeps bright physical arena lights',()=>{
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x29272a);
 scene.fog=new THREE.Fog(0x3c3533,53,125);
 const keyLight=new THREE.DirectionalLight(0xffffff,2.05),ambientLight=new THREE.HemisphereLight(0xffffff,0x444444,1.55);
 const world=createClownLivingWorld(scene,{coarse:true,reduced:true,keyLight,ambientLight});
 assert.equal(world.root.userData.decorativeOnly,true);
 assert.deepEqual(world.stats(),{portals:7,arches:4,curtains:4,decorativeOnly:true});
 const bg=scene.background.clone(),fog=scene.fog.color.clone();
 const g=make(3);g.clown.name='wrongTwin';g.clown.state='pattern';g.clown.pt=1.5;
 for(let i=0;i<160;i++)world.update(g,1/60);
 assert.equal(world.mode,'mirror');
 assert.equal(world.stage,3);
 assert.ok(!scene.background.equals(bg));
 assert.ok(!scene.fog.color.equals(fog));
 assert.ok(keyLight.intensity>1.4, 'keep player and spotlight telegraphs readable');
 let visiblePortals=0,visibleFace=0;world.root.traverse(o=>{
  if(o.name==='mirror-that-does-not-reflect'&&o.visible)visiblePortals++;
  if(o.name==='gigantic-mask-on-distant-curtain'&&o.visible)visibleFace++;
  assert.notEqual(o.userData?.collider,true);
 });
 assert.equal(visiblePortals,7);
 assert.equal(visibleFace,0);
 g.clown.name='livingShadow';
 for(let i=0;i<60;i++)world.update(g,1/60);
 assert.equal(world.mode,'void');
 assert.ok(world.root.getObjectByName('colossal-impossible-smiling-face')?.visible);
 world.event({type:'clown-phase3'});
 world.reset();
 assert.ok(scene.background.equals(bg));
 assert.ok(scene.fog.color.equals(fog));
 assert.equal(keyLight.intensity,2.05);
 assert.equal(ambientLight.intensity,1.55);
 world.dispose();assert.equal(scene.children.length,0);
});
test('the mask, jaw and puppet-body deformation become more disturbing as HP falls and attacks change',()=>{
 const g=make(1),baseline=clownMutationPose(g,1);
 g.clown.horrorStage=2;g.boss.hp=g.boss.maxHp*.36;
 const middle=clownMutationPose(g,1);
 g.clown.horrorStage=3;g.boss.hp=g.boss.maxHp*.16;
 const end=clownMutationPose(g,1);
 assert.ok(baseline.anger<middle.anger&&middle.anger<end.anger);
 g.clown.state='pattern';g.clown.name='stolenFace';g.clown.pt=2;
 const torn=clownMutationPose(g,2);
 assert.ok(torn.maskSplit>end.maskSplit);
 g.clown.name='mouthOfTheAudience';
 const gaping=clownMutationPose(g,2);
 assert.ok(gaping.jaw>end.jaw);
 g.clown.name='foldedCrawl';
 const folded=clownMutationPose(g,2);
 assert.ok(folded.skeletalFold>end.skeletalFold);
 for(const v of Object.values(folded))if(typeof v==='number')assert.ok(Number.isFinite(v));
});
test('the upgraded photo-face rig actually moves its jaw and peels porcelain plates',()=>{
 const body=new THREE.Group(),head={group:new THREE.Group()},mount={group:new THREE.Group()};
 const rig=createClownNightmareAnatomy(THREE,{body,head,mount}),g=make(3);
 const original=head.group.getObjectByName('clown-original-face-anomaly');
 const plate=original.getObjectByName('peeling-porcelain-cheek');
 const jaw=original.getObjectByName('unhinging-jaw');
 assert.ok(plate&&jaw);
 const neutral=jaw.position.y;
 g.clown.name='stolenFace';g.clown.state='pattern';g.clown.pt=3;
 rig.update(g,3,false);
 const opened=jaw.position.y,split=plate.rotation.y;
 assert.ok(opened<neutral);
 assert.ok(Math.abs(split)>.08);
 g.clown.name='mouthOfTheAudience';g.clown.pt=3;
 for(let i=1;i<=24;i++)rig.update(g,3+i/60,false);
 assert.ok(jaw.position.y<neutral);
 assert.ok(body.getObjectByName('puppet-shadow-appendage'));
 assert.equal(rig.groupNames.length,2);
});
test('new face, jaw and ripped-theatre patterns use only real delayed spotlight geometry',()=>{
 for(const name of ['stolenFace','mouthOfTheAudience','stageRupture']){
  const g=make(3);g.player.invuln=1000;startClownPattern(g,name);
  let warnings=0,early=true,seenDamage=false,everPunished=false;
  for(let i=0;i<Math.ceil((PATTERNS[name].dur+.08)*120);i++){
   stepClown(g,1/120);
   if(g.clown.pt>PATTERNS[name].precast)early=false;
   for(const z of g.clown.zones){
    if(early)assert.fail(name+' spawned a hitbox during the visible opening pose');
    if(z.state==='warn'&&z.damage>0){
     warnings++;seenDamage=true;
     assert.ok(z.warn>=1,name);
     assert.equal(clownDangerSpotlightCue(z),true);
    }
   }
   if(g.clown.punish)everPunished=true;
  }
  assert.ok(warnings>0&&seenDamage,name+' warnings missing');
  assert.ok(everPunished,name+' should permit a clear counterattack');
  assert.equal(g.clown.state,'idle');
 }
});
test('ten future sound filenames resolve to assets/sfx but require no current MP3 upload',()=>{
 assert.equal(CLOWN_NIGHTMARE_SFX_MANIFEST.length,10);
 assert.equal(Object.keys(CLOWN_NIGHTMARE_FILES).length,10);
 assert.ok(CLOWN_NIGHTMARE_FILES.childLaugh.endsWith('/childfunny.mp3'));
 for(const [name,meaning]of CLOWN_NIGHTMARE_SFX_MANIFEST){
  assert.ok(name.endsWith('.mp3')&&meaning.length>3);
  assert.ok(Object.values(CLOWN_NIGHTMARE_FILES).includes('assets/sfx/'+name));
 }
 const g=make(3),cues={audience:'audiencewhisper.mp3',double:'childfunny.mp3',
  'clap-delay':'reversedclap.mp3',face:'facesplit.mp3',fold:'bodycreak.mp3',
  mouth:'voidsmile.mp3','stage-break':'circuswarp.mp3'};
 for(const [cue,expected]of Object.entries(cues)){
  const spec=bossFoleySpec({type:'clown-horror',cue},g);
  assert.equal(spec?.file,'assets/sfx/'+expected,cue);
  assert.ok(spec.natural&&spec.volume<=.3);
 }
 assert.equal(bossFoleySpec({type:'clown-phase3'},g).file,'assets/sfx/nightmaretransition.mp3');
 assert.equal(bossFoleySpec({type:'clown-horror',cue:'unregistered'},g),null);
 assert.ok(bossFoleySpec({type:'clown-zone',warn:1,shape:'circle'},g)?.file?.endsWith('.mp3'));
});
