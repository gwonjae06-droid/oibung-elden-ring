import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,actGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {gyuwonRunnerScene,gyuwonRunnerGuideAt,gyuwonRunnerLyricStage} from '../src/gyuwon-runner-director.mjs';
import {RUNNER_BODY_HEIGHT,RUNNER_SLIDE_HEIGHT,RUNNER_JUMP_BUFFER,RUNNER_COYOTE_TIME,runnerInitMotion,runnerPressJump,runnerPressSlide,runnerReleaseSlide,runnerStepMotion,runnerBodyHeight,runnerObstacleContact,runnerGuideReset,runnerGuideBridge,runnerGuideCatch,runnerGuideWarning} from '../src/gyuwon-runner-physics.mjs';

function atSix(){
 const g=createGyuwonGame('sword',{yearMode:true,seed:606});
 g.gyuwon.years.year=6;stepGyuwon(g,1/60);
 const m=g.gyuwon.years.musical;m.transition=0;
 g.player.x=m.entry.tx;g.player.z=m.entry.tz;
 g.player.invuln=0;return {g,m};
}
function fresh(){const m={year:6};runnerInitMotion(m);return m;}

test('grounded first leap, real second leap, no third, late edge jump and buffered landing jump',()=>{
 assert.ok(RUNNER_COYOTE_TIME>=.08&&RUNNER_COYOTE_TIME<=.12);
 assert.ok(RUNNER_JUMP_BUFFER>=.08&&RUNNER_JUMP_BUFFER<=.12);
 const m=fresh();
 assert.equal(runnerPressJump(m),true);
 assert.equal(m.jumpCount,1);
 runnerStepMotion(m,true,.08);
 assert.ok(m.jumpY>0);
 assert.equal(runnerPressJump(m),true);
 assert.equal(m.jumpCount,2);
 assert.equal(runnerPressJump(m),false);
 const c=fresh();runnerStepMotion(c,false,.02);
 assert.equal(c.grounded,false);
 assert.equal(runnerPressJump(c),true,'slightly late edge jump uses coyote grace');
 assert.equal(c.jumpCount,1);
 const b=fresh();b.grounded=false;b.jumpY=.02;b.jumpV=-1;b.jumpCount=2;
 assert.equal(runnerPressJump(b),true);
 assert.ok(b.jumpBuffer>0);
 runnerStepMotion(b,true,.02);
 assert.equal(b.jumpCount,1,'buffered input executes on the actual landing');
 assert.ok(b.jumpV>0);
});

test('the visible crouch height is exactly the collision height, including on release',()=>{
 const m=fresh(),overhead={kind:'low',x:0,width:1.3},floor={kind:'high',x:0,width:1.3};
 assert.equal(runnerBodyHeight(m),RUNNER_BODY_HEIGHT);
 assert.equal(runnerObstacleContact(m,0,overhead),true);
 assert.equal(runnerObstacleContact(m,0,floor),true);
 assert.equal(runnerPressSlide(m),true);
 assert.equal(runnerBodyHeight(m),RUNNER_SLIDE_HEIGHT);
 assert.equal(runnerObstacleContact(m,0,overhead),false);
 assert.equal(runnerObstacleContact(m,0,floor),true,'floor danger persists while crouched');
 assert.equal(runnerReleaseSlide(m),true);
 runnerStepMotion(m,true,.05);runnerStepMotion(m,true,.025);
 const mid=runnerBodyHeight(m);
 assert.ok(mid>RUNNER_SLIDE_HEIGHT&&mid<RUNNER_BODY_HEIGHT);
 assert.equal(runnerObstacleContact(m,0,overhead),false,'rising silhouette still fits the overhang');
 runnerStepMotion(m,true,.075);
 assert.equal(runnerBodyHeight(m),RUNNER_BODY_HEIGHT);
 assert.equal(runnerObstacleContact(m,0,overhead),true);
 m.jumpY=1.7;m.jumpV=1;m.grounded=false;
 assert.equal(runnerObstacleContact(m,0,floor),false,'feet truly clear the floor hazard');
 assert.equal(runnerObstacleContact(m,0,overhead),true,'overhead hazard still dangerous in midair');
});

test('helper offers one physical bridge and one rescue per eligible scene',()=>{
 const m=fresh();m.platforms=[];m.fallRecovery=0;
 runnerGuideReset(m,gyuwonRunnerScene(145));
 assert.equal(m.guideRescues,1);assert.equal(m.guideBridgesLeft,1);
 const bridge=runnerGuideBridge(m,30,4.8,145);
 assert.ok(bridge?.guide);assert.ok(bridge.x>30&&bridge.end<34.8);
 assert.equal(runnerGuideBridge(m,34.8,5.2,145),null);
 m.jumpY=-3.5;m.jumpV=-4;
 assert.equal(runnerGuideCatch(m,{x:-10},145.4),true);
 assert.ok(m.jumpY>1&&m.jumpV>0);
 assert.equal(m.platforms.length,1);
 assert.ok(m.platforms[0].guide);
 assert.equal(runnerGuideCatch(m,{x:-10},146),false);
 runnerGuideReset(m,gyuwonRunnerScene(96));
 assert.equal(m.guideRescues,0,'quiet song is deliberately unthreatening');
 assert.equal(m.guideBridgesLeft,0);
});

test('warning targets exactly the approaching real obstacle and expires',()=>{
 const m=fresh();m.obstacles=[
  {id:10,x:3,kind:'low',hit:false},
  {id:20,x:8,kind:'high',hit:false}];
 runnerGuideWarning(m,-10,35);
 assert.equal(m.guideAction,'warn');
 assert.equal(m.guideWarnId,10);
 assert.equal(m.guideWarnKind,'low');
 m.obstacles=[];runnerGuideWarning(m,-10,36);
 assert.equal(m.guideAction,'');
});

test('original aligned 6수 phrases visibly change weather and scenery without text overlays',()=>{
 const lyricCases=[
  [13,'footsteps'],[22.5,'sunlight'],[25.5,'shower'],
  [29,'mountains'],[43.2,'questions'],[64,'curtains'],
  [67,'sea'],[100,'star'],[110.5,'tomorrow'],[118,'dream']
 ];
 for(const [time,kind]of lyricCases){
  const cue=gyuwonRunnerLyricStage(time);
  assert.equal(cue?.kind,kind,'lyric stage at '+time);
  assert.equal(cue.source,'aligned-original-6su');
  assert.ok(cue.weight>0&&cue.weight<=1);
 }
 assert.equal(gyuwonRunnerLyricStage(140),null,'instrumental passages remain free of invented lyrics');
 assert.equal(gyuwonRunnerGuideAt(38).kind,'bridge');
 assert.equal(gyuwonRunnerGuideAt(68).kind,'warn');
 assert.equal(gyuwonRunnerGuideAt(115).kind,'run');
 assert.equal(gyuwonRunnerGuideAt(130),null);
});

test('integrated high-difficulty runner retains the knight and actual music-controlled scene',()=>{
 const {g,m}=atSix();
 assert.equal(g.weapon,'sword');
 const clock={source:'media',time:164.5,duration:180,ended:false};
 m.clock=clock;
 stepGyuwon(g,1/60);
 assert.equal(m.runnerScene.key,'final-sprint');
 assert.equal(m.guideRescues,1);
 const start=g.boss.hp,base=m.time;
 m.clock=null;g.player.invuln=999;
 for(let i=0;i<200;i++)stepGyuwon(g,1/60);
 const times=m.obstacles.filter(o=>o.section==='final-sprint').map(o=>o.spawnTime);
 assert.ok(times.length>=2,'fast chorus must actually offer frequent hazards');
 assert.ok(times[1]-times[0]<1.3,'difficult combinations must not be watered down');
 assert.equal(g.boss.hp,start,'stage effects cannot reduce boss HP before original song ends');
 assert.ok(m.time>base&&m.time<180,'original soundtrack clock remains authoritative');
 m.platforms=[];m.jumpY=-3.4;m.jumpV=-4;g.player.invuln=0;
 stepGyuwon(g,1/60);
 assert.equal(m.guideAction,'catch');
 assert.equal(m.guideRescues,0);
 assert.ok(m.jumpY>0);
 assert.equal(g.status,'playing');
});

test('actual controls preserve legacy slide semantics while adding optional buffered inputs',()=>{
 const {g,m}=atSix();
 assert.equal(actGyuwon(g,'slide'),true);
 assert.equal(m.slideHeld,true);
 assert.equal(m.slideVisual,1);
 assert.equal(actGyuwon(g,'slide-end'),true);
 assert.equal(m.slide,0);
 assert.equal(m.slideHeld,false);
 assert.ok(m.slideVisual>0,'shape returns to standing smoothly rather than snapping');
 assert.equal(actGyuwon(g,'jump'),true);
 assert.equal(m.slideVisual,0,'leap takes priority over remaining slide fade');
});
