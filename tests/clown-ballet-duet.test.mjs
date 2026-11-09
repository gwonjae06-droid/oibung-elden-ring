import test from 'node:test';
import assert from 'node:assert/strict';
import {BALLET_DEFINITIONS,BALLET_PATTERNS,BALLET_RUN,
 CLOWN_BALLET_THRESHOLDS,balletPartnerFrame} from '../src/clown-ballet-score.mjs';
import {createClownGame,choosePattern,stepClown} from '../src/clown-combat.mjs';
import {damageArenaBoss} from '../src/arena-damage.mjs';
import {setCircusAct} from '../src/clown-troupe.mjs';
import {clownHurtShapes} from '../src/boss-hit-regions.mjs';

test('O Seulwoo has an earlier second phase and an independent last ballet',()=>{
 const g=createClownGame('sword',{register:false,seed:19});
 assert.equal(CLOWN_BALLET_THRESHOLDS.second,.70);
 assert.equal(CLOWN_BALLET_THRESHOLDS.third,1/3);
 g.boss.hp=g.boss.maxHp*.70+4;
 damageArenaBoss(g,5,0,{developer:true});
 assert.equal(g.boss.phase,2);
 assert.equal(g.boss.state,'transition');
 g.boss.state='clown';
 g.clown.state='idle';
 g.boss.hp=g.boss.maxHp/3+4;
 setCircusAct(g,2);
 assert.ok(g.clown.troupe.members.length>0);
 damageArenaBoss(g,5,0,{developer:true});
 assert.equal(g.boss.phase,3);
 stepClown(g,1/120);
 assert.equal(g.clown.troupe.members.length,0,'all ordinary and mini members leave before the ballet');
 g.boss.state='clown';
 g.clown.state='idle';
 g.clown.wait=100;
 stepClown(g,1/120);
 assert.equal(g.clown.horrorStage,3);
 for(let i=0;i<16;i++)assert.ok(BALLET_PATTERNS.includes(choosePattern(g)));
});

test('both partners have matching real physical hurt volumes',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=3;g.clown.horrorStage=3;g.clown.duetOrbitYaw=.5;
 const frame=balletPartnerFrame(g),parts=clownHurtShapes(g);
 assert.equal(frame.active,true);
 assert.ok(Math.hypot(frame.partner.x-frame.lead.x,frame.partner.z-frame.lead.z)>4);
 for(const id of ['torso','head','spouse-torso','spouse-head']){
  assert.ok(parts.some(p=>p.id===id),id);
 }
 const partner=parts.find(p=>p.id==='spouse-torso');
 assert.ok(Math.hypot(partner.x-frame.partner.x,partner.z-frame.partner.z)<.01);
});

test('all four ballet routines give real advance warnings and punish time',()=>{
 assert.equal(BALLET_DEFINITIONS.length,4);
 for(const [key,duration,recover] of BALLET_DEFINITIONS.map(([k,n,d,r])=>[k,d,r])){
  const g=createClownGame('sword',{register:false});
  g.boss.phase=3;g.clown.horrorStage=3;g.clown.duetOrbitYaw=.3;
  const c=g.clown;c.state='pattern';c.name=key;c.pt=0;c.f={};c.vis={};
  const zones=[];
  const api={
   once(_c,k,fn){if(!Object.hasOwn(_c.f,k))_c.f[k]=fn()??true;return _c.f[k];},
   emit(game,type,extra={}){game.events.push({type,...extra});},
   zone(_game,zone){zones.push({...zone});return zone;}
  };
  let previous=0;
  for(let current=.025;current<=duration-recover+.2;current+=.025){
   c.pt=current;
   BALLET_RUN[key](g,c,previous,current,api);
   previous=current;
  }
  assert.ok(zones.length>=3,key+' needs multiple alternating cues');
  assert.ok(zones.every(z=>z.warn>=1&&z.damage>0),key+' cannot deal instant damage');
  assert.ok(zones.every(z=>['circle','lane'].includes(z.shape)),key+' collision geometry');
 }
});
