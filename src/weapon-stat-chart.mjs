import {WEAPONS} from './weapon-data.mjs';
import {WEAPON_STATS,weaponStats} from './weapon-stats.mjs';

const NAMES=Object.freeze({sword:'검',hammer:'망치',bow:'활',cards:'카드'});
const keys=Object.keys(NAMES);
const maxOf=read=>Math.max(...keys.map(read));
const asPercent=n=>Math.round(n*100)+'%';

// Graph bars are relative rankings among the four weapons; their printed
// values are the real, unmodified combat data. Defense is inverted because
// receiving LESS damage is better.
export function weaponStatRows(id){
 const weapon=Object.hasOwn(WEAPONS,id)?id:'sword';
 const w=WEAPONS[weapon],s=weaponStats(weapon);
 const specs=[
  {label:'한 번 공격 피해',value:w.damage,max:maxOf(x=>WEAPONS[x].damage),text:String(w.damage)},
  {label:'경직 누적',value:w.poise,max:maxOf(x=>WEAPONS[x].poise),text:String(w.poise)},
  {label:'최대 체력',value:s.maxHp,max:maxOf(x=>WEAPON_STATS[x].maxHp),text:String(s.maxHp)},
  {label:'방어 효율',value:1/s.incomingDamage,max:maxOf(x=>1/WEAPON_STATS[x].incomingDamage),text:'받는 피해 '+asPercent(s.incomingDamage)},
  {label:'이동 속도',value:s.walkSpeed,max:maxOf(x=>WEAPON_STATS[x].walkSpeed),text:asPercent(s.walkSpeed)},
  {label:'회피 거리',value:s.rollDistance,max:maxOf(x=>WEAPON_STATS[x].rollDistance),text:asPercent(s.rollDistance)},
  {label:'기력 회복',value:s.staminaRegen,max:maxOf(x=>WEAPON_STATS[x].staminaRegen),text:asPercent(s.staminaRegen)}
 ];
 return specs.map(({label,value,max,text})=>({label,text,percent:Math.max(0,Math.min(100,Math.round(value/max*100)))}));
}
export function weaponStatChart(id){
 const weapon=Object.hasOwn(NAMES,id)?id:'sword';
 const rows=weaponStatRows(weapon);
 return '<section class="j-stat-chart" aria-label="'+NAMES[weapon]+' 능력치 그래프">'+
  '<div class="j-stat-heading"><h2>'+NAMES[weapon]+' · 능력치</h2><span>WEAPON PROFILE</span></div>'+
  '<div class="j-stat-rows">'+rows.map(row=>
   '<div class="j-stat-row"><div class="j-stat-label"><span>'+row.label+'</span><strong>'+row.text+'</strong></div>'+
   '<div class="j-stat-track" role="meter" aria-label="'+row.label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+row.percent+'" aria-valuetext="'+row.text+'"><span class="j-stat-fill" style="width:'+row.percent+'%"></span></div></div>'
  ).join('')+'</div>'+
  '<p class="j-stat-note">막대 길이는 네 무기 간 상대 비교입니다. 공격 피해는 1회 기본 타격 기준이며, 특수 효과와 각인 효과는 별도입니다.</p></section>';
}
