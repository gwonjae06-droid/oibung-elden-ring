import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,stepClown,startClownPattern,PATTERNS,inZone} from '../src/clown-combat.mjs';
import {act} from '../src/combat.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/240)stepClown(g,1/240);};
test('all performances finish with at least a visible punish interval',()=>{
 for(const[k,d]of Object.entries(PATTERNS)){
  const g=createClownGame();
  g.boss.phase=d.phases.includes(1)?1:2;
  g.player.x=g.player.z=18;g.player.invuln=100;
  startClownPattern(g,k);
  let punishFrames=0;
  for(let time=0;time<d.dur+.1;time+=1/240){
   stepClown(g,1/240);
   if(g.clown.punish)punishFrames++;
  }
  assert.ok(punishFrames>=24,k+' has too little safe punish time');
  assert.equal(g.clown.state,'idle',k);
 }
});
test('heads lock targets and shove never damages',()=>{const g=createClownGame();g.player.invuln=100;startClownPattern(g,'laughBomb');tick(g,PATTERNS.laughBomb.precast+1.7);const q=g.clown.bombs[0],x=q.x,z=q.z;g.player.x=-10;tick(g,.4);assert.equal(q.x,x);assert.equal(q.z,z);for(const phase of[1,2]){const h=createClownGame();h.boss.phase=phase;h.player.z=-2.6;startClownPattern(h,'shove');tick(h,PATTERNS.shove.precast+.7);assert.equal(h.player.hp,h.player.maxHp);assert.ok(h.events.some(e=>e.type==='clown-shove'));}});
test('early ringmaster phase changes without harming either actor',()=>{const g=createClownGame('hammer');g.clown.wait=99;g.boss.hp=1001;g.player.z=-2;g.player.yaw=Math.PI;act(g,'light');tick(g,.5);assert.equal(g.boss.state,'transition');const hp=g.player.hp,bhp=g.boss.hp;assert.equal(act(g,'skill'),false);tick(g,5.6);assert.equal(g.boss.phase,2);assert.equal(g.boss.state,'clown');assert.equal(g.player.hp,hp);assert.equal(g.boss.hp,bhp);assert.equal(g.clown.zones.length,0);});
test('every weapon damages the clown and retry resets the encounter',()=>{for(const w of['sword','hammer','bow','cards']){const g=createClownGame(w),initialHp=g.boss.hp;g.clown.wait=99;g.player.z=g.boss.z+2.35;g.player.yaw=Math.PI;act(g,'light');tick(g,1.2);assert.ok(g.boss.hp<initialHp,w);}assert.equal(createClownGame().player.potions,3);assert.equal(createClownGame().boss.phase,1);});
test('warning shapes use exact bounds',()=>{const z={shape:'circle',x:0,z:0,r:3};assert.equal(inZone(z,{x:2.9,z:0}),true);assert.equal(inZone(z,{x:3.1,z:0}),false);});
