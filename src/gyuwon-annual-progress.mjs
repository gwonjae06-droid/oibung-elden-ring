// The year is a narrative milestone, not temporary invulnerability.
// Damage spends that year's HP allowance, banks one small follow-up, and
// converts further weapon pressure directly into the visible D-day clock.
export const GYUWON_CALENDAR_SECONDS=48;
export const annualBudget=g=>g.boss.maxHp*.065;
export function annualFloor(g){
 const e=g.gyuwon.years;
 if(e.year>=11)return e.endingUnlocked?0:g.boss.maxHp*.015;
 return g.boss.maxHp*(1-.065*e.year);
}
export const annualClockRate=g=>1+Math.min(1.4,(g.gyuwon.years.calendarDamage||0)/annualBudget(g)*.4);
export function acceptAnnualDamage(g,amount,{dot=false}={}){
 const e=g.gyuwon.years,b=g.boss,budget=annualBudget(g);
 const damage=Math.max(0,Number.isFinite(amount)?amount:0);
 const health=Math.max(0,Math.min(damage,b.hp-annualFloor(g)));b.hp-=health;
 // One capped next-year carry; never grant the same overflow twice.
 const credit=e.year<11?Math.max(0,Math.min(damage-health,budget*.5-(e.damageBank||0))):0;
 e.damageBank=(e.damageBank||0)+credit;
 e.yearDamage=(e.yearDamage||0)+health+credit;
 // All real weapon hits accelerate the day counter, even after HP and bank
 // both reach their limits. Per-hit caps prevent one oversized hit from
 // bypassing the annual ultimate, while fast repeated play remains rewarded.
 const pressureInput=dot?damage*.2:damage;
 e.calendarDamage=Math.min(budget*3,(e.calendarDamage||0)+Math.min(pressureInput,budget*.5));
 const room=Math.max(0,GYUWON_CALENDAR_SECONDS-e.season);
 const calendarSeconds=e.mode==='combat'?
  Math.min(room,Math.min(pressureInput,budget*.5)/budget*GYUWON_CALENDAR_SECONDS*.60):0;
 if(calendarSeconds>0){
  e.season+=calendarSeconds;
  e.day=Math.max(0,Math.ceil(365*(1-e.season/GYUWON_CALENDAR_SECONDS)));
  e.lastPressureAt=g.time;
  e.calendarAdvance=(e.calendarAdvance||0)+calendarSeconds;
 }
 // Overflow cannot subtract HP reserved for other years. It is a *real*
 // calendar hit instead: report a bounded effective impact for the existing
 // weapon hit response, avoiding the misleading "immune" feedback at the floor.
 const surplus=Math.max(0,damage-health-credit);
 const pressure=calendarSeconds>0?Math.min(surplus,budget*.25):0;
 return {health,credit,pressure,calendarSeconds,accepted:health+credit+pressure};
}
export function applyAnnualCarry(g){
 const e=g.gyuwon.years,bank=e.damageBank||0;
 const amount=Math.max(0,Math.min(bank,g.boss.hp-annualFloor(g)));
 g.boss.hp-=amount;e.damageBank=0;e.yearDamage=amount;
 e.calendarDamage=amount;e.calendarAdvance=0;e.lastPressureAt=-1000;
 return amount;
}
export function annualDisplay(g){
 const e=g.gyuwon.years,day=e.day,t=g.time;let echo=null,glitch=0,shown=day;
 if(e.year>=3&&e.year<=4){shown=Math.ceil(365*(1-Math.pow(Math.min(1,e.season/48),.74)));glitch=Math.sin(t*7)>.88?.25:0;}
 if(e.year>=5&&e.year<=6)glitch=Math.sin(t*13)>.7?.65:0;
 if(e.year>=7&&e.year<=8){glitch=.2;echo=Math.floor(365*((t*.17)%1));}
 if(e.year>=9&&e.year<=10){echo=2026-Math.floor((t*.8)%Math.max(1,e.year));glitch=.3;}
 // The nightmare clock may hold at D-365 before combat pressure begins,
 // but must respond immediately when a player actually lands a hit.
 if(e.year>=11){shown=e.season<5&&!(e.calendarAdvance>0)?365:day;glitch=.4;}
 return {day:shown,echo,glitch};
}
