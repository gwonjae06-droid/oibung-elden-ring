import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCombatImpact} from '../src/combat-impact.mjs';
import {anchorKwonVisualModel} from '../src/kwon-recoil-anchor.mjs';

function model(){
 return {
  position:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},
  rotation:{x:0,y:0,z:0},
  scale:{x:1,y:1,z:1}
 };
}
function game(){
 return {weapon:'sword',status:'playing',boss:{x:0,z:0,hp:1800,maxHp:3572,phase:1},
  player:{x:7,z:0,hp:120,maxHp:120},events:[]};
}
test('Kwon recoil is visual-only and can never accumulate sideways over repeated hits',()=>{
 const g=game(),m=model(),fx=createCombatImpact({boss:'kwon'});
 const startingX=g.boss.x,startingZ=g.boss.z;
 let maximumSidewaysOffset=0;
 for(let frame=0;frame<160;frame++){
  // Both normal damage and the semicolon shortcut emit boss-hit.
  if(frame%10===0)fx.event({type:'boss-hit',amount:65},g);
  fx.update(1/60);
  anchorKwonVisualModel(m,.02);
  m.rotation.x=0;m.rotation.y=0;m.rotation.z=0;
  m.scale.x=m.scale.y=m.scale.z=1;
  fx.bossPose(m);
  maximumSidewaysOffset=Math.max(maximumSidewaysOffset,Math.abs(m.position.x));
  assert.ok(Math.abs(m.position.x)<.5,'individual hit recoil must not permanently shift the model');
  assert.equal(m.position.z,0);
  assert.equal(g.boss.x,startingX);
  assert.equal(g.boss.z,startingZ);
 }
 assert.ok(maximumSidewaysOffset>.02,'hit feedback still moves the model briefly');
 // Once the last recoil ends, the model returns to the exact authored origin.
 for(let frame=0;frame<60;frame++){fx.update(1/60);anchorKwonVisualModel(m,0);fx.bossPose(m);}
 assert.equal(m.position.x,0);
 assert.equal(m.position.z,0);
 fx.dispose();
});
test('semicolon developer hits cannot permanently displace Kwon visual position',()=>{
 const g=game(),m=model(),fx=createCombatImpact({boss:'kwon'});
 for(let hit=0;hit<10;hit++){
  fx.event({type:'boss-hit',amount:500,developer:true},g);
  fx.update(.016);
  anchorKwonVisualModel(m,0);
  fx.bossPose(m);
  assert.ok(Math.abs(m.position.x)<.6);
 }
 fx.update(1);
 anchorKwonVisualModel(m,0);fx.bossPose(m);
 assert.equal(m.position.x,0);
 fx.dispose();
});
test('arena restores boss local X and Z before presenting impact recoil every frame',()=>{
 const source=readFileSync(new URL('../src/arena.mjs',import.meta.url),'utf8');
 assert.match(source,/anchorKwonVisualModel\(bossModel,Math\.sin\(vis\.time\*1\.6\)\*\.05\)/);
 assert.match(source,/impact\.bossPose\(bossModel\)/);
 assert.doesNotMatch(source,/bossModel\.position\.y=Math\.sin\(vis\.time/);
});
