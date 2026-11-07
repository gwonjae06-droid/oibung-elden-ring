import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {WEAPON_STATS} from '../src/weapon-stats.mjs';
import {weaponStatRows,weaponStatChart,radarVertices} from '../src/weapon-stat-chart.mjs';
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
  assert.equal((chart.match(/class="j-stat-radar"/g)||[]).length,1);
  assert.match(chart,/role="img"/);
  assert.equal((chart.match(/class="j-radar-ring"/g)||[]).length,4);
  assert.equal((chart.match(/class="j-radar-ray"/g)||[]).length,6);
  assert.equal((chart.match(/class="j-radar-node"/g)||[]).length,6);
  assert.equal((chart.match(/class="j-radar-current"/g)||[]).length,1);
  assert.equal((chart.match(/class="j-radar-average"/g)||[]).length,1);
  assert.equal((chart.match(/class="j-stat-fact"/g)||[]).length,6);
  assert.match(chart,/class="j-stat-recovery"/);
  assert.match(chart,/4종 평균/);
  assert.doesNotMatch(chart,/j-stat-average|j-stat-track|j-stat-fill|role="meter"/);
  assert.match(chart,/기본 사거리/);
  assert.match(chart,/기본 동작/);
  assert.match(chart,/기력 소모/);
  assert.match(chart,/실제|상대 비교/);
 }
});
test('defense scores increase when incoming damage falls; invalid identifiers never inject HTML',()=>{
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


test('radar geometry stays inside the hexagon and the same average is reused for all weapons',()=>{
 assert.equal(radarVertices([100,100,100,100,100,100]).split(' ').length,6);
 assert.equal(radarVertices([0,0,0,0,0,0]),Array(6).fill('180.00,135.00').join(' '));
 assert.throws(()=>radarVertices([100,100]),RangeError);
 const all=Object.keys(WEAPONS).map(id=>weaponStatChart(id));
 const get=(html,cls)=>html.match(new RegExp('class="'+cls+'" points="([^"]+)"'))?.[1];
 const avgs=all.map(html=>get(html,'j-radar-average'));
 assert.equal(new Set(avgs).size,1,'the 4-weapon average must remain constant regardless of selection');
 const selected=all.map(html=>get(html,'j-radar-current'));
 assert.equal(new Set(selected).size,4,'every weapon must produce a distinct polygon');
 for(const html of all){
  assert.equal(get(html,'j-radar-current').split(' ').length,6);
  assert.equal((html.match(/class="j-radar-label"/g)||[]).length,6);
  assert.doesNotMatch(html,/class="j-stat-average"|class="j-stat-track"|class="j-stat-fill"/);
 }
 const css=readFileSync(new URL('../journey.css',import.meta.url),'utf8');
 assert.match(css,/#journey \.j-stat-radar\{display:block;width:min\(100%,360px\)/);
 assert.match(css,/\.j-radar-average\{fill:#c5c9ce/);
 assert.match(css,/\.j-radar-current\{fill:#d4ab67/);
 assert.doesNotMatch(css,/\.j-stat-average\{|\.j-stat-track\{/);
});
