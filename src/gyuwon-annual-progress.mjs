// The year is a narrative milestone, not temporary invulnerability.
// Real HP loss advances the displayed milestone. Time and surplus hits do not.
export const GYUWON_CALENDAR_SECONDS=48;
export const annualBudget=g=>g.boss.maxHp*.065;
export function annualFloorForYear(g,year){
 const e=g.gyuwon.years;
 if(year>=11)return e.year<11?g.boss.maxHp*.015:0;
 return g.boss.maxHp*(1-.065*year);
}
export const annualFloor=g=>annualFloorForYear(g,g.gyuwon.years.year);
// The bar is an HP milestone. Wall time and extra hits at the floor never advance it.
export const annualClockRate=()=>0;
export function syncAnnualHealth(g){
 const e=g.gyuwon.years,floor=annualFloor(g),start=Math.max(floor+.001,e.yearStartHp??Math.max(g.boss.hp+(e.yearDamage||0)-(e.damageBank||0),g.boss.maxHp*(1-.065*(e.year-1))));
 const progress=Math.max(0,Math.min(1,(start-g.boss.hp)/(start-floor)));
 e.season=progress*GYUWON_CALENDAR_SECONDS;e.day=Math.max(0,Math.ceil(365*(1-progress)));
 return progress;
}
export function acceptAnnualDamage(g,amount,{dot=false}={}){
 const e=g.gyuwon.years,b=g.boss,budget=annualBudget(g),damage=Math.max(0,Number.isFinite(amount)?amount:0);
 // The final show owns its last 800 HP; a stray melee/DoT tick cannot
 // bypass the unskippable, character-driven ending.
 const floor=e.mode==='exam'?annualFloorForYear(g,e.year+1):
  e.mode==='musical'&&e.year===11?Math.max(800,annualFloor(g)):annualFloor(g);
 const health=Math.max(0,Math.min(damage,b.hp-floor));b.hp-=health;
 const credit=e.mode==='combat'&&e.year<11?Math.max(0,Math.min(damage-health,budget*.5-(e.damageBank||0))):0;
 e.damageBank=(e.damageBank||0)+credit;e.yearDamage=(e.yearDamage||0)+health+credit;
 if(e.mode==='combat')syncAnnualHealth(g);
 return {health,credit,pressure:0,calendarSeconds:0,accepted:health+credit};
}
// Previously, this carry was paid AFTER the visible grade recovery, making
// a successful exam appear to lose HP upon entering the next school year.
// Settle last year's earned overflow first, against the next-year floor.
export function settleAnnualCarryBeforeGrade(g){
 const e=g.gyuwon.years,b=g.boss;
 const nextFloor=annualFloorForYear(g,e.year+1);
 const amount=Math.max(0,Math.min(e.damageBank||0,b.hp-nextFloor));
 b.hp-=amount;e.damageBank=0;e.yearDamage=amount;
 return amount;
}
export function applyAnnualCarry(g){
 const e=g.gyuwon.years,bank=e.damageBank||0;
 const amount=Math.max(0,Math.min(bank,g.boss.hp-annualFloor(g)));
 g.boss.hp-=amount;e.damageBank=0;e.yearDamage=amount;
 e.calendarDamage=amount;e.calendarAdvance=0;e.lastPressureAt=-1000;
 return amount;
}
export function annualDisplay(g){return {day:g.gyuwon.years.day,echo:null,glitch:0};}
