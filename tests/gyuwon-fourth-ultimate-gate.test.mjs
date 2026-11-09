import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {annualFloor} from '../src/gyuwon-annual-progress.mjs';
import {startGyuwonYearCast} from '../src/gyuwon-years.mjs';
import {MARKSMAN_VOLLEYS,MARKSMAN_BURST_ROUNDS} from '../src/gyuwon-nightmare-mechanics.mjs';
import {GYUWON_REVERIE_SECONDS} from '../src/gyuwon-reverie.mjs';

const game=(year=4,legacyAnnual=false)=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:391});
 const e=g.gyuwon.years;
 e.year=year;e.legacyAnnual=legacyAnnual;e.mode='combat';e.recover=0;
 g.player.invuln=1e5;g.boss.state='recovery';
 return g;
};
const advance=(g,t)=>{const n=Math.ceil(t/.05);for(let i=0;i<n;i++)stepGyuwon(g,.05);};

test('HP depleted in fourth year forces all 210 rifle rounds and the bow volleys before the unskippable film',()=>{
 const g=game(),e=g.gyuwon.years;
 g.boss.hp=annualFloor(g);
 stepGyuwon(g,.05);
 assert.equal(e.year,4);
 assert.equal(e.cast,'ultimateMarksman','HP at zero-days must force the actual 4th-year skill');
 assert.equal(e.mode,'combat');
 assert.equal(e.signatureUsed,true,'windup started is not completion');
 assert.equal(e.fourthUltimateCompleted,false);
 assert.ok(g.gyuwon.hazards.some(h=>h.signature==='ultimateMarksman'&&h.visual==='year-bullet'));
 advance(g,20);
 assert.equal(e.mode,'combat','the film cannot interrupt the ongoing volleys');
 assert.equal(e.cast,'ultimateMarksman');
 assert.equal(e.fourthUltimateCompleted,false);
 assert.equal(e.marksmanVolleys,MARKSMAN_VOLLEYS);
 advance(g,2.5);
 assert.equal(MARKSMAN_VOLLEYS*MARKSMAN_BURST_ROUNDS,210);
 assert.equal(e.marksmanVolleys,30);
 assert.equal(e.fourthUltimateCompleted,true);
 assert.equal(e.year,4);
 assert.equal(e.mode,'reverie');
 assert.ok(e.reverie&&e.reverie.time<1);
 const finished=g.events.filter(x=>x.type==='gyuwon-fourth-ultimate-finished');
 assert.equal(finished.length,1);
 assert.equal(finished[0].rifleShots,210);
 assert.equal(g.events.filter(x=>x.type==='gyuwon-reverie-start').length,1);
 assert.equal(g.events.filter(x=>x.type==='gyuwon-year'&&x.year===5).length,0);
 assert.equal(g.boss.hp,annualFloor(g),'the signature must not secretly lower the boss HP');
});

test('an earlier completed fourth-year ultimate is not repeated at the HP boundary',()=>{
 const g=game(),e=g.gyuwon.years;
 assert.ok(startGyuwonYearCast(g,'ultimateMarksman',()=>{}));
 e.recover=90;
 advance(g,22.3);
 assert.equal(e.cast,null);
 assert.equal(e.fourthUltimateCompleted,true);
 assert.equal(e.mode,'combat');
 const firstCount=e.castCount;
 g.boss.hp=annualFloor(g);
 stepGyuwon(g,.05);
 assert.equal(e.mode,'reverie');
 assert.equal(e.castCount,firstCount);
});

test('earlier years and legacy 4th-year exams do not inherit the forced signature gate',()=>{
 const early=game(3);
 early.boss.hp=annualFloor(early);stepGyuwon(early,.05);
 assert.equal(early.gyuwon.years.mode,'exam');
 const legacy=game(4,true);
 legacy.boss.hp=annualFloor(legacy);stepGyuwon(legacy,.05);
 assert.equal(legacy.gyuwon.years.mode,'exam');
 assert.equal(legacy.gyuwon.years.cast,null);
});

test('the 4th-year cutscene is still the existing 58 second unskippable reverie',()=>{
 const g=game(),e=g.gyuwon.years;
 e.fourthUltimateCompleted=true;g.boss.hp=annualFloor(g);
 stepGyuwon(g,.05);assert.equal(e.mode,'reverie');
 advance(g,14);
 assert.equal(e.year,4);
 assert.equal(e.mode,'reverie');
 advance(g,GYUWON_REVERIE_SECONDS-13.9);
 assert.equal(e.year,5);
 assert.equal(e.mode,'musical');
 assert.equal(e.reverieComplete,true);
});
