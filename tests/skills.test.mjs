import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillState,tickSkills,currentCard,skillReady,consumeSkill,STANDARD_COOLDOWN,SKILLS,SKILL_COLORS,SKILL_HEX,CARD_NOTICE} from '../src/skills.mjs';
test('cards rotate blue-red-yellow at the stated interval',()=>{
 const s=createSkillState();assert.equal(currentCard(s),'blue');tickSkills(s,'cards',.59);assert.equal(currentCard(s),'blue');tickSkills(s,'cards',.02);assert.equal(currentCard(s),'red');tickSkills(s,'cards',.6);assert.equal(currentCard(s),'yellow');tickSkills(s,'cards',.6);assert.equal(currentCard(s),'blue');
});
test('right click lock-in activates the matching card buff',()=>{
 for(const [card,key] of [['blue','blue'],['red','nextRed'],['yellow','nextYellow']]){
  const s=createSkillState();s.cycle=card==='blue'?0:card==='red'?.6:1.2;assert.equal(consumeSkill(s,'cards'),card);assert.equal(s[key],card==='blue'?3:true);assert.equal(s.cooldown,STANDARD_COOLDOWN);assert.equal(s.cycle,0);
 }
});
test('cards wait for the standard cooldown',()=>{
 const s=createSkillState();consumeSkill(s,'cards');assert.equal(skillReady(s,'cards'),false);tickSkills(s,'cards',9.99);assert.equal(skillReady(s,'cards'),false);tickSkills(s,'cards',.02);assert.equal(skillReady(s,'cards'),true);
});
test('timers never run backwards',()=>{const s=createSkillState();s.cooldown=2;s.blue=3;s.haste=4;tickSkills(s,'cards',-10);assert.equal(s.cooldown,2);assert.equal(s.blue,3);assert.equal(s.haste,4);});
test('hammer threshold and bow stack limits',()=>{
 assert.equal(SKILLS.hammer.hits,4);const h=createSkillState();h.hammerHits=3;assert.equal(skillReady(h,'hammer'),false);h.hammerHits=4;assert.equal(consumeSkill(h,'hammer'),'hammer');assert.equal(h.hammerHits,0);
 const b=createSkillState();for(let i=0;i<3;i++)consumeSkill(b,'bow');assert.equal(consumeSkill(b,'bow'),null);tickSkills(b,'bow',STANDARD_COOLDOWN+.1);assert.equal(b.charges,1);tickSkills(b,'bow',99);assert.equal(b.charges,3);assert.equal(b.recharge,0);
});
test('each skill has distinct colour data',()=>{
  const keys=['sword','hammer','bow','blue','red','yellow','heal'];
  for(const k of keys){assert.equal(SKILL_COLORS[k].length,3);assert.ok(SKILL_COLORS[k].every(v=>v>=0&&v<=1));assert.ok(Number.isInteger(SKILL_HEX[k]));}
  assert.equal(new Set(keys.map(k=>SKILL_HEX[k])).size,keys.length);assert.deepEqual(Object.keys(CARD_NOTICE),['blue','red','yellow']);
});
