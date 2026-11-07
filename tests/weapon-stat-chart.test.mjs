import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPONS} from '../src/weapon-data.mjs';
import {WEAPON_STATS} from '../src/weapon-stats.mjs';
import {weaponStatRows,weaponStatChart} from '../src/weapon-stat-chart.mjs';
import {forgeScreen} from '../src/forge-view.mjs';
import {freshProfile} from '../src/journey-state.mjs';

test('every weapon graph uses the same live values as combat',()=>{
 for(const id of Object.keys(WEAPONS)){
  const rows=weaponStatRows(id),s=WEAPON_STATS[id],w=WEAPONS[id];
  assert.equal(rows.length,7);
  assert.equal(rows[0].text,String(w.damage));
  assert.equal(rows[1].text,String(w.poise));
  assert.equal(rows[2].text,String(s.maxHp));
  assert.equal(rows[3].text,'받는 피해 '+Math.round(s.incomingDamage*100)+'%');
  assert.equal(rows[4].text,Math.round(s.walkSpeed*100)+'%');
  assert.equal(rows[5].text,Math.round(s.rollDistance*100)+'%');
  assert.equal(rows[6].text,Math.round(s.staminaRegen*100)+'%');
  assert.ok(rows.every(r=>Number.isFinite(r.percent)&&r.percent>=0&&r.percent<=100));
  const chart=weaponStatChart(id);
  assert.equal((chart.match(/role="meter"/g)||[]).length,7);
  assert.match(chart,/aria-valuetext=/);
  assert.equal((chart.match(/j-stat-average/g)||[]).length,7);
  assert.match(chart,/기본 사거리/);
  assert.match(chart,/기본 동작/);
  assert.match(chart,/기력 소모/);
  assert.match(chart,/실제|상대 비교/);
 }
});
test('defense bars increase when incoming damage falls; invalid identifiers never inject HTML',()=>{
 assert.ok(weaponStatRows('hammer')[3].percent>weaponStatRows('bow')[3].percent);
 assert.equal(weaponStatChart('unknown'),weaponStatChart('sword'));
 assert.equal(weaponStatChart('__proto__'),weaponStatChart('sword'));
});
test('smithy shows the selected weapon chart next to the persistent forge tree',()=>{
 const profile=freshProfile();
 const html=forgeScreen(profile,'hammer',{button:(a,b,c)=>'<button data-j="'+a+'" '+c+'>'+b+'</button>',back:()=>'',warning:()=>''});
 assert.match(html,/망치 · 능력치/);
 assert.match(html,/j-stat-chart/);
 assert.match(html,/j-forge-trees/);
 assert.doesNotMatch(html,/지름길|불꽃을 사용해 해금된/);
});

test('forge chart distinguishes permanent skill effects from basic damage',()=>{
 const p=freshProfile();
 p.flames=2;p.earnedFlames=2;p.forge.sword['blade-wave']=1;
 const html=weaponStatChart('sword',{profile:p});
 assert.match(html,/현재 강화 · 검기 1각인/);
 assert.match(html,/각인 효과와 별도/);
 const unowned=weaponStatChart('bow',{profile:p});
 assert.match(unowned,/미각인/);
});
