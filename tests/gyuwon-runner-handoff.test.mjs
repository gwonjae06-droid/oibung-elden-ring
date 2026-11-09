import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,actGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {referenceKeyAction} from '../src/gyuwon-reference-rules.mjs';
import {GYUWON_RUNNER_ENTER_SECONDS,gyuwonFiveToSixExit,gyuwonRunnerScene,gyuwonRunnerAccent,gyuwonRunnerGuideAt,gyuwonRunnerGap} from '../src/gyuwon-runner-director.mjs';

function atSix(){
 const g=createGyuwonGame('sword',{yearMode:true,seed:1926});
 const e=g.gyuwon.years;e.year=6;
 stepGyuwon(g,1/60);
 const m=e.musical;m.transition=0;g.player.invuln=0;
 g.player.x=m.entry.tx;g.player.z=m.entry.tz;
 return {g,m};
}
const to=(g,m,time)=>{
 m.clock={source:'media',time,duration:180,ended:false};
 stepGyuwon(g,1/60);
};

test('Act V velvet path opens only at the end of the full recording, not by HP loss',()=>{
 assert.equal(gyuwonFiveToSixExit(0),0);
 assert.equal(gyuwonFiveToSixExit(159),0);
 assert.equal(gyuwonFiveToSixExit(170),.5);
 assert.equal(gyuwonFiveToSixExit(180),1);
});

test('Act VI is timed as musical chapters, from paper stage to 7수 flags',()=>{
 assert.equal(GYUWON_RUNNER_ENTER_SECONDS,8);
 const cases=[
  [0,'theater'],[15,'meadow'],[41,'bridge'],[65,'rain'],
  [96,'quiet'],[115,'sunrise'],[145,'skyroad'],[166,'finale'],[177,'exit']
 ];
 for(const [time,biome]of cases){
  assert.equal(gyuwonRunnerScene(time).biome,biome,'Incorrect scene at '+time);
 }
 assert.equal(gyuwonRunnerAccent(10).shower,true);
 assert.equal(gyuwonRunnerAccent(15).shower,false);
 assert.equal(gyuwonRunnerGuideAt(3).kind,'curtain');
 assert.equal(gyuwonRunnerGuideAt(96).kind,'moon');
 assert.equal(gyuwonRunnerGuideAt(169).kind,'gate');
 assert.equal(gyuwonRunnerGuideAt(130),null);
 assert.equal(gyuwonRunnerGap(gyuwonRunnerScene(0),2),0);
 assert.equal(gyuwonRunnerGap(gyuwonRunnerScene(96),2),0);
 assert.ok(gyuwonRunnerGap(gyuwonRunnerScene(145),1)>0);
});

test('opening and quiet phrases are real safe breathers with unchanged player identity',()=>{
 const {g,m}=atSix();
 assert.equal(m.runnerBiome,'theater');
 assert.equal(g.weapon,'sword');
 to(g,m,5);assert.equal(m.runnerBiome,'theater');
 assert.deepEqual(m.obstacles,[]);
 to(g,m,65);assert.equal(m.runnerBiome,'rain');
 m.obstacles.push({id:100,x:18,kind:'high',hit:false});
 to(g,m,96);
 assert.equal(m.runnerBiome,'quiet');
 assert.equal(m.obstacles.length,0);
 assert.equal(m.runnerScene.relief,true);
 assert.equal(g.player.hp>0,true);
 to(g,m,145);assert.equal(m.runnerBiome,'skyroad');
});

test('Act VI has exactly two visible abilities and no dash override, even with collected stars',()=>{
 const {g,m}=atSix();
 m.starCharge=100;
 assert.equal(actGyuwon(g,'dash'),false);
 assert.equal(referenceKeyAction(m,'KeyK'),null);
 assert.equal(referenceKeyAction(m,'ShiftLeft'),null);
 assert.equal(referenceKeyAction(m,'Space'),'jump');
 assert.equal(referenceKeyAction(m,'KeyL'),'slide');
 assert.equal(actGyuwon(g,'jump'),true);
 stepGyuwon(g,1/60);
 assert.equal(actGyuwon(g,'jump'),true);
 assert.equal(actGyuwon(g,'jump'),false,'no third jump');
 assert.equal(m.dashTime,0);
 assert.equal(m.dashCooldown,0);
 assert.ok(m.time>0,'original song clock continues during difficult jumps');
});
