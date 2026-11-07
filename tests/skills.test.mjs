import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillState,tickSkills,skillReady,consumeSkill,STANDARD_COOLDOWN,SKILLS,SKILL_COLORS,SKILL_HEX} from '../src/skills.mjs';
test('retired universal actives do not grant unearned active skills',()=>{
 const s=createSkillState();
 assert.equal(skillReady(s,'hammer'),false);
 assert.equal(consumeSkill(s,'cards'),null);
 assert.equal(consumeSkill(s,'bow'),null);
 assert.deepEqual(s,{cooldown:0,storedDamage:0,sigilMarks:0});
});
test('forge cooldown uses simulation time, clamps to zero and ignores negative dt',()=>{
 const s=createSkillState();s.cooldown=STANDARD_COOLDOWN;
 tickSkills(s,'sword',.6);assert.ok(Math.abs(s.cooldown-9.4)<1e-9);
 tickSkills(s,'sword',-20);assert.ok(Math.abs(s.cooldown-9.4)<1e-9);
 tickSkills(s,'sword',11);assert.equal(s.cooldown,0);
});
test('forge weapons have names and stable, distinct visual palettes',()=>{
 for(const id of ['sword','hammer','bow','cards'])assert.ok(SKILLS[id].name);
 const keys=['sword','hammer','bow','blue','red','yellow','heal'];
 for(const key of keys){assert.equal(SKILL_COLORS[key].length,3);assert.ok(SKILL_COLORS[key].every(v=>v>=0&&v<=1));assert.ok(Number.isInteger(SKILL_HEX[key]));}
 assert.equal(new Set(keys.map(key=>SKILL_HEX[key])).size,keys.length);
});
