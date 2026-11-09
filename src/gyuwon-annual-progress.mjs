// Four physical HP milestones lead into seven song-owned performance milestones.
export const GYUWON_CALENDAR_SECONDS=48;
 // The live fight reserves only 1,000 HP for years 1-4; seven musical
 // scenes then receive 600 HP each, followed by the 800 HP ending.
 export const GYUWON_OPENING_YEAR_HP=250;
 export const GYUWON_MUSICAL_ACT_HP=700;
 export const GYUWON_MUSICAL_ENDING_HP=800;
 export const GYUWON_MUSICAL_TOTAL_HP=4*GYUWON_OPENING_YEAR_HP+
  6*GYUWON_MUSICAL_ACT_HP+1000+GYUWON_MUSICAL_ENDING_HP;
 export const annualBudget=g=>g.gyuwon.years?.legacyAnnual?
  g.boss.maxHp*.065:g.gyuwon.years?.year<=4?
  GYUWON_OPENING_YEAR_HP:g.gyuwon.years?.year===11?1000:GYUWON_MUSICAL_ACT_HP;
export function annualFloorForYear(g,year){
  const e=g.gyuwon.years;
  // Historical challenge probes still use their original year milestones.
  if(e.legacyAnnual){
   if(year>=11)return e.year<11?g.boss.maxHp*.015:0;
   return g.boss.maxHp*(1-.065*year);
  }
  const early=Math.min(4,Math.max(0,year));
  const musical=Math.min(6,Math.max(0,year-4));
  return Math.max(GYUWON_MUSICAL_ENDING_HP,
   g.boss.maxHp-early*GYUWON_OPENING_YEAR_HP-musical*GYUWON_MUSICAL_ACT_HP-(year>=11?1000:0));
 }
export const annualFloor=g=>annualFloorForYear(g,g.gyuwon.years.year);
// The bar is an HP milestone. Wall time and extra hits at the floor never advance it.
export const annualClockRate=()=>0;
export function syncAnnualHealth(g){
 const e=g.gyuwon.years,floor=annualFloor(g);
  const previous=e.legacyAnnual?g.boss.maxHp*(1-.065*(e.year-1)):
   e.year===1?g.boss.maxHp:annualFloorForYear(g,e.year-1);
  const start=Math.max(floor+.001,e.yearStartHp??Math.max(
   g.boss.hp+(e.yearDamage||0)-(e.damageBank||0),previous));
 const progress=Math.max(0,Math.min(1,(start-g.boss.hp)/(start-floor)));
 e.season=progress*GYUWON_CALENDAR_SECONDS;e.day=Math.max(0,Math.ceil(365*(1-progress)));
 return progress;
}
export function acceptAnnualDamage(g,amount,{dot=false}={}){
 const e=g.gyuwon.years,b=g.boss,budget=annualBudget(g),damage=Math.max(0,Number.isFinite(amount)?amount:0);
 if(!e.legacyAnnual&&e.year>=5)return {health:0,credit:0,pressure:0,calendarSeconds:0,accepted:0};
 // The final show owns its last 800 HP; a stray melee/DoT tick cannot
 // bypass the unskippable, character-driven ending.
 const floor=e.mode==='exam'&&e.legacyAnnual?annualFloorForYear(g,e.year+1):
  e.mode==='musical'&&e.year===11?Math.max(GYUWON_MUSICAL_ENDING_HP,annualFloor(g)):annualFloor(g);
 const health=Math.max(0,Math.min(damage,b.hp-floor));b.hp-=health;
 // In the live four-year prologue, never spend hidden carry damage
  // during exam/result scenes. Only explicit weapon hits reduce HP.
  const credit=e.legacyAnnual&&e.mode==='combat'&&e.year<11?
   Math.max(0,Math.min(damage-health,budget*.5-(e.damageBank||0))):0;
 e.damageBank=(e.damageBank||0)+credit;e.yearDamage=(e.yearDamage||0)+health+credit;
 if(e.mode==='combat')syncAnnualHealth(g);
 return {health,credit,pressure:0,calendarSeconds:0,accepted:health+credit};
}
// Previously, this carry was paid AFTER the visible grade recovery, making
// a successful exam appear to lose HP upon entering the next school year.
// Settle last year's earned overflow first, against the next-year floor.
export function settleAnnualCarryBeforeGrade(g){
 const e=g.gyuwon.years,b=g.boss;
 if(!e.legacyAnnual){e.damageBank=0;return 0;}
 const nextFloor=annualFloorForYear(g,e.year+1);
 const amount=Math.max(0,Math.min(e.damageBank||0,b.hp-nextFloor));
 b.hp-=amount;e.damageBank=0;e.yearDamage=amount;
 return amount;
}
export function applyAnnualCarry(g){
 const e=g.gyuwon.years,bank=e.damageBank||0;
 if(!e.legacyAnnual){
  e.damageBank=0;e.yearDamage=0;e.calendarDamage=0;
  e.calendarAdvance=0;e.lastPressureAt=-1000;
  return 0;
 }
 const amount=Math.max(0,Math.min(bank,g.boss.hp-annualFloor(g)));
 g.boss.hp-=amount;e.damageBank=0;e.yearDamage=amount;
 e.calendarDamage=amount;e.calendarAdvance=0;e.lastPressureAt=-1000;
 return amount;
}
export function annualDisplay(g){return {day:g.gyuwon.years.day,echo:null,glitch:0};}
