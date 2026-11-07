import {WEAPONS} from './weapon-data.mjs';
import {WEAPON_STATS,weaponStats} from './weapon-stats.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
import {forgeTier} from './purification-forge.mjs';

const NAMES=Object.freeze({sword:'검',hammer:'망치',bow:'활',cards:'카드'});
const keys=Object.keys(NAMES);
const maxOf=read=>Math.max(...keys.map(read));
const asPercent=n=>Math.round(n*100)+'%';

// Hex radar values are relative rankings among four weapons. Printed numbers
// are the unmodified combat data. Defense is inverted: LESS damage is better.
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

// Normalized radar geometry: the same combat-derived percentage that used to
// drive the bars now determines each of the six hexagon vertices.
const RADAR_AXES=Object.freeze(['공격','경직','체력','방어','이동','회피']);
function radarXY(index,percentage,radius=84){
 const v=Math.max(0,Math.min(100,Number(percentage)||0))/100;
 const angle=-Math.PI/2+index*Math.PI/3;
 return [(180+Math.cos(angle)*radius*v).toFixed(2),(135+Math.sin(angle)*radius*v).toFixed(2)];
}
export function radarVertices(values){
 if(!Array.isArray(values)||values.length!==6)throw new RangeError('A six-axis radar requires six normalized stats');
 return values.map((v,i)=>radarXY(i,v).join(',')).join(' ');
}
function radarDiagram(weapon,rows){
 const axes=rows.slice(0,6);
 const rings=[25,50,75,100].map(pct=>
  '<polygon class="j-radar-ring" points="'+radarVertices(Array(6).fill(pct))+'"/>').join('');
 const spokes=RADAR_AXES.map((_,i)=>{
  const [x,y]=radarXY(i,100);
  return '<line class="j-radar-ray" x1="180" y1="135" x2="'+x+'" y2="'+y+'"/>';
 }).join('');
 const labels=RADAR_AXES.map((label,i)=>{
  const [x,y]=radarXY(i,100,116);
  return '<text class="j-radar-label" x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="middle">'+label+'</text>';
 }).join('');
 const points=axes.map((r,i)=>{
  const [x,y]=radarXY(i,r.percent);
  return '<circle class="j-radar-node" cx="'+x+'" cy="'+y+'" r="2.8"/>';
 }).join('');
 return '<svg class="j-stat-radar" viewBox="0 0 360 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+NAMES[weapon]+' 능력치 육각형 비교: 금빛은 선택 무기, 회색 점선은 네 무기 평균">'+
  '<title>'+NAMES[weapon]+' 능력치 육각형 비교</title><desc>공격력, 경직, 최대 체력, 방어 효율, 이동 속도, 회피 거리 순서로 네 무기 중 상대 수치를 비교합니다. 정확한 수치는 그래프 아래에 표시합니다.</desc>'+
  rings+spokes+
  '<polygon class="j-radar-average" points="'+radarVertices(axes.map(r=>r.averagePercent))+'"/>'+
  '<polygon class="j-radar-current" points="'+radarVertices(axes.map(r=>r.percent))+'"/>'+
  points+labels+'</svg>';
}
export function weaponStatChart(id,{profile=null}={}){
 const weapon=Object.hasOwn(NAMES,id)?id:'sword';
 const w=WEAPONS[weapon],rows=weaponStatRows(weapon);
 const stats=rows.slice(0,6).map(row=>
  '<div class="j-stat-fact"><dt>'+row.label+'</dt><dd>'+row.text+'</dd></div>').join('');
 const recovery='<div class="j-stat-recovery"><span>기력 회복</span><strong>'+rows[6].text+'</strong></div>';
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
  '<div class="j-stat-radar-frame">'+radarDiagram(weapon,rows)+
  '<div class="j-radar-key" aria-label="차트 범례"><span class="j-radar-key-current">선택 무기</span><span class="j-radar-key-average">4종 평균</span></div></div>'+
  '<dl class="j-stat-facts" aria-label="정확한 무기 능력치">'+stats+'</dl>'+
  recovery+
  basic+'<p class="j-stat-note">육각형은 네 무기의 상대 비교입니다. 수치는 실제 전투 기준이며, 각인 효과와 별도입니다.</p>'+
  upgrades+'</section>';
}
