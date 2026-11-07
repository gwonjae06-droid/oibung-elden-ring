import {WEAPONS} from './weapon-data.mjs';
import {WEAPON_STATS,weaponStats} from './weapon-stats.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
import {forgeTier} from './purification-forge.mjs';

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
 return specs.map(({label,value,max,text})=>({label,text,
  percent:Math.max(0,Math.min(100,Math.round(value/max*100))),
  averagePercent:Math.round(keys.reduce((sum,key)=>sum+({
   '한 번 공격 피해':WEAPONS[key].damage,'경직 누적':WEAPONS[key].poise,
   '최대 체력':WEAPON_STATS[key].maxHp,'방어 효율':1/WEAPON_STATS[key].incomingDamage,
   '이동 속도':WEAPON_STATS[key].walkSpeed,'회피 거리':WEAPON_STATS[key].rollDistance,
   '기력 회복':WEAPON_STATS[key].staminaRegen
  })[label],0)/keys.length/max*100)
 }));
}
export function weaponStatChart(id,{profile=null}={}){
 const weapon=Object.hasOwn(NAMES,id)?id:'sword';
 const w=WEAPONS[weapon],rows=weaponStatRows(weapon);
 const basic='<div class="j-stat-basics" aria-label="무기 공격 특성">'+
  '<span>기본 사거리 <strong>'+w.range+'</strong></span>'+
  '<span>기본 동작 <strong>'+(w.wind+w.active+w.end).toFixed(2)+'초</strong></span>'+
  '<span>기력 소모 <strong>'+w.cost+'</strong></span></div>';
 const owned=profile?EVOLUTIONS[weapon].filter(path=>forgeTier(profile,weapon,path.id)>0):[];
 const path=owned[0],rank=path?forgeTier(profile,weapon,path.id):0;
 const upgrades=profile?
  '<div class="j-stat-upgrades"><strong>현재 강화 · '+(path?path.name+' '+rank+'각인':'미각인')+'</strong>'+
  '<p>'+(path?path.text:'현재 적용된 영구 무기 강화가 없습니다. 아래에서 강화 경로를 선택할 수 있습니다.')+'</p>'+
  '<small>기본 공격 수치에 포함되지 않는 스킬·추가 타격·특수 효과입니다.</small></div>':'';
 return '<section class="j-stat-chart" aria-label="'+NAMES[weapon]+' 능력치 그래프">'+
  '<div class="j-stat-heading"><h2>'+NAMES[weapon]+' · 능력치</h2><span>WEAPON PROFILE</span></div>'+
  '<div class="j-stat-rows">'+rows.map(row=>
   '<div class="j-stat-row"><div class="j-stat-label"><span>'+row.label+'</span><strong>'+row.text+'</strong></div>'+
   '<div class="j-stat-track" role="meter" aria-label="'+row.label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+row.percent+'" aria-valuetext="'+row.text+'"><span class="j-stat-fill" style="width:'+row.percent+'%"></span>'+
   '<i class="j-stat-average" aria-hidden="true" style="left:'+row.averagePercent+'%"></i></div></div>'
  ).join('')+'</div>'+
  basic+'<p class="j-stat-note"><i class="j-stat-legend" aria-hidden="true"></i> 표시선은 네 무기 평균 · 막대는 네 무기 간 상대 비교이며 실제 수치를 함께 보여줍니다. 기본 공격의 수치는 각인 효과와 별도입니다.</p>'+
  upgrades+'</section>';
}
