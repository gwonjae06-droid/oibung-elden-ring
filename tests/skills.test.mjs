import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillState,tickSkills,currentCard,skillReady,consumeSkill,STANDARD_COOLDOWN,SKILLS,SKILL_COLORS,SKILL_HEX,CARD_NOTICE} from '../src/skills.mjs';
test('all four former universal active skills are retired',()=>{
 const s=createSkillState();
 for(const w of ['sword','hammer','bow','cards']){
  assert.equal(skillReady(s,w),false);
  assert.equal(consumeSkill(s,w),null);
 }
 assert.equal(currentCard(s),null);
 assert.deepEqual(CARD_NOTICE,{});
 assert.deepEqual(Object.keys(SKILLS),['sword','hammer','bow','cards']);
});
test('only active forge cooldown remains and never ticks backwards',()=>{
 const s=createSkillState();
 s.cooldown=12;tickSkills(s,'hammer',-1);assert.equal(s.cooldown,12);
 tickSkills(s,'hammer',3.2);assert.ok(Math.abs(s.cooldown-8.8)<1e-9);
 tickSkills(s,'hammer',100);assert.equal(s.cooldown,0);
 assert.equal(s.storedDamage,0);
});
test('existing sound and FX palettes keep stable colors',()=>{
 for(const k of ['sword','hammer','bow','cards','blue','red','yellow','heal']){
  assert.equal(SKILL_COLORS[k].length,3);
  assert.ok(SKILL_COLORS[k].every(x=>x>=0&&x<=1));
  assert.ok(Number.isInteger(SKILL_HEX[k]));
 }
 assert.ok(STANDARD_COOLDOWN>0);
});
