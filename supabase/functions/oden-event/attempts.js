// Strict, bounded cumulative snapshots. This is client-reported analytics, never prize eligibility evidence.
const bosses=['kwon','clown','dice','blood','gyuwon'],weapons=['sword','hammer','bow','cards'];
const text=v=>typeof v==='string'&&/^[a-zA-Z0-9_,-]{0,128}$/.test(v);
const num=(v,max=1e7)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const integer=(v,max=1e7)=>num(v,max)&&Number.isInteger(v);
export function normalizeAttempt(r){
 if(!r||typeof r!=='object'||!/^[-0-9a-f]{36}$/i.test(r.attempt_id||'')||
  !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(r.attempt_id)||
  !integer(r.revision,100000)||r.revision<1||!bosses.includes(r.boss)||!weapons.includes(r.weapon)||
  !['touch','keyboard-mouse','unknown'].includes(r.device)||!['story','standalone'].includes(r.ruleset)||
  !['playing','won','lost','interrupted'].includes(r.outcome)||!text(r.build)||!r.build||!text(r.forge)||
  !integer(r.max_phase,20)||r.max_phase<1||!num(r.best_boss_progress,100)||
  !num(r.remaining_hp,10000)||!num(r.max_hp,10000)||r.max_hp<1||r.remaining_hp>r.max_hp)return null;
 const row={};
 for(const name of ['attempt_id','revision','boss','weapon','device','ruleset','build','forge','outcome','max_phase','best_boss_progress','remaining_hp','max_hp'])row[name]=r[name];
 for(const key of ['combat_seconds','performance_seconds']){if(!num(r[key],86400))return null;row[key]=r[key];}
 for(const key of ['damage_dealt','damage_taken']){if(!num(r[key]))return null;row[key]=r[key];}
 for(const key of ['attacks','connected_attacks','confirmed_hits','hits_taken','rolls','potions_used','heals_completed']){if(!integer(r[key],1000000))return null;row[key]=r[key];}
 if(r.connected_attacks>r.attacks||r.heals_completed>r.potions_used)return null;
 if(r.death_pattern!==null&&(!text(r.death_pattern)||r.death_pattern.length>64))return null;
 row.death_pattern=r.outcome==='lost'?r.death_pattern:null;
 for(const [key,limit,fields]of [['phases',12,['seconds','hits','damage','score']],['patterns',25,['hits','damage']]]){
  const input=r[key];if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>limit)return null;
  const clean=Object.create(null);
  for(const [name,v]of Object.entries(input)){
   if(!/^[a-zA-Z0-9_-]{1,64}$/.test(name)||!v||typeof v!=='object')return null;
   clean[name]={};for(const f of fields){if(!(f==='hits'?integer(v[f]):num(v[f])))return null;clean[name][f]=v[f];}
  }
  row[key]=clean;
 }
 return row;
}
export async function storeAttempt(db,participant,eventId,report,now=new Date().toISOString()){
 const row=normalizeAttempt(report);if(!row)return {error:'전투 통계 형식이 올바르지 않습니다.',status:400};
 const table='oden_skill_attempts';
 const filter={participant_id:'eq.'+participant.id,attempt_id:'eq.'+row.attempt_id};
 let rows=await db('GET',{...filter,select:'revision,outcome',limit:'1'},null,table);
 if(!rows.length){
  // The unique key prevents retry/double-tab deliveries from counting another attempt.
  rows=await db('POST',{on_conflict:'participant_id,attempt_id',select:'revision,outcome'},
   {...row,participant_id:participant.id,event_id:eventId,started_at:now,updated_at:now,
    ended_at:row.outcome==='playing'?null:now},table,'resolution=ignore-duplicates,return=representation');
  if(rows.length)return {ok:true,revision:rows[0].revision};
  rows=await db('GET',{...filter,select:'revision,outcome',limit:'1'},null,table);
 }
 const current=rows[0];
 if(!current)return {error:'통계 저장을 다시 시도하세요.',status:409};
 if(current.revision>=row.revision||current.outcome!=='playing')return {ok:true,revision:current.revision};
 await db('PATCH',{...filter,revision:'lt.'+row.revision,outcome:'eq.playing'},
  {...row,updated_at:now,ended_at:row.outcome==='playing'?null:now},table);
 return {ok:true,revision:row.revision};
}
