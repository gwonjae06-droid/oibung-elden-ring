import test from 'node:test';
import assert from 'node:assert/strict';
import {PATTERNS as KWON,PHASE_ONE,SEQUENCES} from '../src/combat.mjs';
import {PATTERNS as CLOWN} from '../src/clown-combat.mjs';
import {giantPattern,giantPropType,GIANT_NAMES,FERAL_NAMES} from '../src/dice-giant.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {BLOOD_ATTACK_GESTURES} from '../src/blood-attack-motion.mjs';
import {BLOOD_SPELL_FORMS} from '../src/blood-spell-fx.mjs';
import {createBloodGame,startBloodPattern,severHeartNode,stepBlood} from '../src/blood-combat.mjs';

test('Kwon signatures have real windups, colliding attacks and recovery',()=>{
  for(const name of ['spiderPrison','graveSword','livingSword','lastStance']){
    assert.ok(KWON[name].wind>=.74,name);
    assert.ok(KWON[name].active>0&&KWON[name].recover>1,name);
  }
  assert.ok(PHASE_ONE.spiderPrison.includes('spiderPrison'));
  for(const name of ['graveSword','livingSword','lastStance'])
    assert.ok(SEQUENCES[name].includes(name));
});

test('Clown signatures are assigned to the appropriate phases and have precast & punish time',()=>{
  const expected={puppetFuneral:[1],laughContagion:[1],stageCapsize:[2],lastMagic:[2]};
  for(const [name,phases] of Object.entries(expected)){
    const p=CLOWN[name];
    assert.deepEqual(p.phases,phases);
    assert.ok(p.precast>=.52&&p.dur>p.precast+p.recover+1.5,name);
  }
});

test("Sungwon's new casino attacks respect limb tags, positive warnings and the feral head",()=>{
  const player={x:4,z:-39};
  assert.equal(GIANT_NAMES.length,16);
  assert.equal(FERAL_NAMES.length,16);
  for(const i of [11,12,13]){
    const p=giantPattern(i,player);
    assert.ok(p.hazards.length>=3);
    assert.ok(p.hazards.every(h=>h.warn>=.79&&h.start>=0));
    assert.ok(p.hazards.some(h=>h.handIndex===0||h.handIndex===1));
  }
  const domino=giantPattern(11,player);
  assert.equal(giantPropType({slot:11,temperament:'controlled'},domino.hazards[0]),'chip');
  const roulette=giantPattern(12,player);
  assert.equal(giantPropType({slot:12,temperament:'controlled'},roulette.hazards[0]),'coin');
  const torn=giantPattern(12,player,'feral',.2);
  assert.ok(torn.hazards.some(h=>h.headSlam));
  assert.ok(torn.hazards.some(h=>h.handIndex!=null));
});

test('Seojun signatures each create damage events paired to gestures and reusable spell forms',()=>{
  const pairs={reverseFlow:1,bloodStatues:1,wingGenesis:2,heartFeast:2};
  for(const [name,phase] of Object.entries(pairs)){
    const spec=BLOOD_PATTERNS[name];
    assert.equal(spec.phase,phase);
    assert.ok(BLOOD_ATTACK_GESTURES[name]&&BLOOD_SPELL_FORMS[name]);
    const g=createBloodGame('sword',{seed:43});
    g.boss.phase=phase;
    assert.equal(startBloodPattern(g,name),true);
    assert.ok(g.blood.hazards.length>=2);
    assert.ok(g.blood.hazards.every(h=>h.warn>=1.28&&h.warn<spec.duration));
    assert.ok(g.blood.hazards.every(h=>h.hit===false&&h.age===0));
  }
});

test('Seojun sacrament channels can be severed and stop their portion of the heal',()=>{
  const make=()=>{
    const g=createBloodGame('sword',{seed:72});
    g.boss.phase=2;
    g.boss.hp=g.boss.maxHp*.22;
    assert.equal(startBloodPattern(g,'heartFeast'),true);
    g.player.invuln=100;
    return g;
  };
  const free=make(),broken=make(),all=make();
  assert.equal(free.blood.heartNodes.length,3);
  const n=broken.blood.heartNodes[0];
  assert.equal(severHeartNode(broken,40,{x:n.x,z:n.z}),true);
  assert.equal(n.hp,0);
  assert.ok(broken.blood.hazards.find(h=>h.channel===0).hit);
  for(const node of all.blood.heartNodes)
    assert.equal(severHeartNode(all,40,{x:node.x,z:node.z}),true);
  for(const g of [free,broken,all]){
    g.blood.t=7.09;
    stepBlood(g,.04);
  }
  assert.ok(free.boss.hp>broken.boss.hp);
  assert.ok(broken.boss.hp>all.boss.hp);
  assert.ok(Math.abs(all.boss.hp-all.boss.maxHp*.22)<.001);
});
