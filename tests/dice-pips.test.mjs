import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_BOARD as B,DICE_RULES as R,diceRollPose} from '../src/dice-data.mjs';
import {createDiceGame,stepDice,damageDice,DICE_PATTERNS as P} from '../src/dice-combat.mjs';
import {diceTopFace} from '../src/dice-orientation.mjs';

const s=Math.SQRT1_2,FACES=[[0,0,0,1],[0,0,s,s],[0,0,-s,s],[1,0,0,0],[-s,0,0,s],[s,0,0,s]];
function advance(g,seconds,input={}){for(let left=seconds;left>1e-9;){const dt=Math.min(.05,left);stepDice(g,dt,input);left-=dt;}}
function ready(count,phase,rotation=[0,0,0,1],player={x:0,z:0}){
 const g=createDiceGame();g.boss.phase=phase;
 Object.assign(g.dice,{index:0,pose:diceRollPose(B[0],B[1],0),rotation,state:'recovery',t:R.recovery,pendingPattern:true,patternCount:count});
 g.player.x=player.x;g.player.z=player.z;stepDice(g,.05);return g;
}
const withPips=n=>FACES.find(q=>diceTopFace(q).pips===n);

test('the six test orientations show every face number',()=>{
 assert.deepEqual([...new Set(FACES.map(q=>diceTopFace(q).pips))].sort(),[1,2,3,4,5,6]);
});

test('the top face decides how many cells light up',()=>{
 for(const q of FACES){
  const g=ready(3,1,q),pips=diceTopFace(q).pips;
  assert.equal(g.dice.state,'pip-warning');
  assert.equal(g.dice.pips.pips,pips);
  assert.equal(g.dice.pips.tiles.length,pips);
  assert.equal(new Set(g.dice.pips.tiles).size,pips);
  for(const i of g.dice.pips.tiles)assert.ok(B[i]);
 }
});

test('a safe neighbouring cell always exists next to the player',()=>{
 for(const q of FACES){
  const g=ready(3,1,q),marked=new Set(g.dice.pips.tiles),center=60;
  const safe=[-1,0,1].flatMap(dz=>[-1,0,1].map(dx=>center+dz*R.side+dx)).filter(i=>!marked.has(i));
  assert.ok(safe.length>=3,'face '+diceTopFace(q).pips);
 }
});

test('standing on a marked cell takes one hit when the cells burst',()=>{
 const g=ready(3,1,withPips(5));
 assert.ok(g.dice.pips.tiles.includes(60));
 advance(g,P.pipWarning+.1);
 assert.equal(g.player.hp,120-P.pipDamage);
 assert.equal(g.events.filter(e=>e.type==='dice-pip-burst').length,1);
 assert.equal(g.events.filter(e=>e.type==='player-hit'&&e.source==='dice-pip').length,1);
 assert.equal(g.events.filter(e=>e.type==='dice-impact'&&e.source==='dice-pip').length,5);
 assert.equal(g.dice.state,'recovery');
});

test('stepping onto an unmarked cell or dodging avoids the damage',()=>{
 const safe=ready(3,1,withPips(5));safe.player.x=R.edge;advance(safe,P.pipWarning+.1);assert.equal(safe.player.hp,120);
 const dodge=ready(3,1,withPips(5));dodge.player.invuln=10;advance(dodge,P.pipWarning+.1);assert.equal(dodge.player.hp,120);
});

test('phase one warns for 1.2 seconds and phase two is shorter but hits harder',()=>{
 const one=ready(3,1,withPips(5));
 advance(one,P.pipWarning-.1);assert.equal(one.dice.state,'pip-warning');
 advance(one,.2);assert.equal(one.dice.state,'recovery');
 const two=ready(4,2,withPips(5));
 assert.equal(two.dice.state,'pip-warning');
 assert.ok(P.pipWarningP2<P.pipWarning&&P.pipWarningP2>=1&&P.pipDamageP2>P.pipDamage);
 advance(two,P.pipWarningP2-.1);assert.equal(two.dice.state,'pip-warning');
 advance(two,.2);
 assert.equal(two.player.hp,120-P.pipDamageP2);
});

test('freezing the boss keeps the pip warning timer',()=>{
 const g=ready(3,1,withPips(5));advance(g,.5);const t=g.dice.t;
 advance(g,.6,{freezeBoss:true});
 assert.equal(g.dice.t,t);assert.equal(g.dice.state,'pip-warning');
});

test('the flash fades, the cells clear, and the fight continues',()=>{
 const g=ready(3,1,withPips(5));g.player.x=R.edge;
 advance(g,P.pipWarning+.1);assert.ok(g.dice.pips&&g.dice.pips.flash>0);
 advance(g,P.pipFlash+.1);assert.equal(g.dice.pips,null);
 advance(g,R.recovery+.2);assert.ok(['warning','rolling','recovery'].includes(g.dice.state));
 assert.equal(g.status,'playing');
});

test('winning during the warning clears the cells and stops further attacks',()=>{
 const g=ready(3,1,withPips(5));
 damageDice(g,g.boss.hp);
 assert.equal(g.status,'won');assert.equal(g.dice.pips,null);
 const time=g.time;advance(g,3);assert.equal(g.time,time);
});

test('the old chain and portrait attacks are off in a normal fight',()=>{
 assert.equal(createDiceGame().dice.faceAttacks,false);
 const g=ready(0,1,[0,0,0,1],{x:-60,z:60});
 for(let i=0;i<1200&&g.status==='playing';i++){stepDice(g,.05);assert.equal(g.dice.groundSpikes,null);}
 assert.ok(!g.events.some(e=>/portrait|sweep/.test(e.type)));
});
