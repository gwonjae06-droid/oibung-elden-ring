// Annual HP reserves keep every authored year reachable. Extra accepted damage
// is banked once and spent next year; further pressure advances calendar time.
export const GYUWON_CALENDAR_SECONDS=48;
export const annualBudget=g=>g.boss.maxHp*.065;
export function annualFloor(g){const e=g.gyuwon.years;if(e.year>=11)return e.endingUnlocked?0:g.boss.maxHp*.015;return g.boss.maxHp*(1-.065*e.year);}
export const annualClockRate=g=>1+Math.min(1.2,(g.gyuwon.years.calendarDamage||0)/annualBudget(g)*.15);
export function acceptAnnualDamage(g,amount){
 const e=g.gyuwon.years,b=g.boss;
 e.calendarDamage=(e.calendarDamage||0)+Math.min(amount,b.maxHp*.5);
 const health=Math.max(0,Math.min(amount,b.hp-annualFloor(g)));b.hp-=health;
 const credit=e.year<11?Math.max(0,Math.min(amount-health,annualBudget(g)*.5-(e.damageBank||0))):0;
 e.damageBank=(e.damageBank||0)+credit;e.yearDamage=(e.yearDamage||0)+health+credit;
 return {health,credit,accepted:health+credit};
}
export function applyAnnualCarry(g){const e=g.gyuwon.years,bank=e.damageBank||0;const amount=Math.max(0,Math.min(bank,g.boss.hp-annualFloor(g)));g.boss.hp-=amount;e.damageBank=0;e.yearDamage=amount;e.calendarDamage=amount;return amount;}
export function annualDisplay(g){
 const e=g.gyuwon.years,day=e.day,t=g.time;let echo=null,glitch=0,shown=day;
 if(e.year>=3&&e.year<=4){shown=Math.ceil(365*(1-Math.pow(Math.min(1,e.season/48),.74)));glitch=Math.sin(t*7)>.88?.25:0;}
 if(e.year>=5&&e.year<=6)glitch=Math.sin(t*13)>.7?.65:0;
 if(e.year>=7&&e.year<=8){glitch=.2;echo=Math.floor(365*((t*.17)%1));}
 if(e.year>=9&&e.year<=10){echo=2026-Math.floor((t*.8)%Math.max(1,e.year));glitch=.3;}
 if(e.year>=11){shown=e.season<5?365:Math.max(0,Math.ceil(365*(1-(e.season-5)/43)));glitch=.4;}
 return {day:shown,echo,glitch};
}
