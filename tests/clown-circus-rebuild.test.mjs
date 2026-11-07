import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownActor} from '../src/clown-ringmaster-actor.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {createCircusTroupe,setCircusAct,stepCircusTroupe,cueCircusShow} from '../src/clown-troupe.mjs';
import {createClownGame,startClownPattern,stepClown,PATTERNS,LIVE_REPERTOIRE,choosePattern} from '../src/clown-combat.mjs';
import {clownHurtShapes} from '../src/boss-hit-regions.mjs';
const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepClown(g,1/120);};
test('new runtime actor builds real sculpted ringmaster without a photo-face or rideable sphere',()=>{
 const a=createClownActor({coarse:true});
 const g=createClownGame('sword',{register:false});
 a.root.scale.setScalar(1.25);a.update(g,1/60);
 assert.equal(a.isRebuiltRingmaster,true);
 assert.ok(a.root.getObjectByName('hand-sculpted-porcelain-face'));
 assert.ok(a.root.getObjectByName('articulated-knee'));
 assert.ok(a.root.getObjectByName('antique-conductor-baton'));
 assert.ok(!a.root.getObjectByName('clown-head'));
 assert.ok(!a.root.getObjectByName('circus-balance-ball'));
 assert.ok(!clownHurtShapes(g).some(x=>['ball','mount-head'].includes(x.id)));
});
test('sculpted ringmaster planted shoes do not intersect or levitate above the floor',()=>{
 const a=createClownActor({coarse:true}),g=createClownGame('sword',{register:false});
 a.root.scale.setScalar(1.25);
 for(const phase of[1,2]){
  g.boss.phase=phase;g.boss.state='clown';g.clown.state='idle';g.clown.odo=0;
  a.update(g,1/60);a.root.updateWorldMatrix(true,true);
  let count=0;
  a.root.traverse(o=>{
   if(o.name!=='solid-floor-contact-shoe')return;count++;
   const y=o.getWorldPosition(new THREE.Vector3()).y;
   assert.ok(Math.abs(y-.29*1.25)<.05,'shoe y grounded at '+y);
  });
  assert.equal(count,2);
 }
});
test('separate living actors visibly walk, wind up, stagger and die',()=>{
 const g=createClownGame('sword',{register:false});
 const scene=new THREE.Scene(),v=createCircusTroupeView(scene,{coarse:true});
 for(let i=0;i<80;i++)stepClown(g,1/60);
 v.update(g,1/60);
 const live=g.clown.troupe.members.filter(m=>!m.down);
 assert.ok(live.length>=3);
 assert.equal(v.stats().performers,live.length);
 assert.ok(v.root.getObjectByName('hand-carved-rigid-performance-mask'));
 g.player.x=live[0].x;g.player.z=live[0].z+2;g.player.yaw=Math.PI;
 const actor=live[0];g.player.action={kind:'attack',wind:.01,active:.25,t:.03,yaw:Math.PI};
 stepClown(g,1/60);v.update(g,1/60);
 assert.ok(actor.life<actor.maxHp,'an actual performer can be damaged');
 v.dispose();
});
test('repertoire exclusively chooses coherent circus ensemble, never old photo or ball routines',()=>{
 const g=createClownGame('sword',{register:false});
 assert.equal(LIVE_REPERTOIRE.includes('ballSpin'),false);
 for(const phase of [1,2]){
  g.boss.phase=phase;g.clown.horrorStage=phase===2?3:1;
  for(let i=0;i<45;i++){const id=choosePattern(g);
   assert.ok(LIVE_REPERTOIRE.includes(id)||id==='shove',id);
   assert.ok(PATTERNS[id].phases.includes(phase));
   g.clown.last=id;g.clown.used[id]=(g.clown.used[id]||0)+1;
  }
 }
});
test('six new ensemble attacks only spawn delayed damage with actual recovery',()=>{
 const keys=['ghostProcession','puppetOverture','infernalHoops','choirOfAshes','curtainStampede','midnightGrandFinale'];
 for(const key of keys){
  const g=createClownGame('sword',{register:false});
  g.boss.phase=PATTERNS[key].phases.includes(1)?1:2;
  g.clown.horrorStage=key==='midnightGrandFinale'?3:2;
  g.player.invuln=10000;g.player.hp=g.player.maxHp=100000;
  startClownPattern(g,key);
  let warnings=0,recovered=false;
  const length=PATTERNS[key].dur;
  for(let i=0;i<Math.ceil((length+.03)*120);i++){
   stepClown(g,1/120);
   if(g.clown.punish)recovered=true;
   for(const z of g.clown.zones)if(z.state==='warn'&&z.damage>0){
    assert.ok(z.warn>=1,key+' must telegraph');warnings++;
   }
  }
  assert.ok(warnings>0,key);
  assert.ok(recovered,key+' must allow counterattack');
  assert.equal(g.clown.state,'idle');
 }
});
