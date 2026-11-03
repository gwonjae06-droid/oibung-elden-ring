import test from 'node:test';
import assert from 'node:assert/strict';
import {ROULETTE_NUMBERS,ROULETTE_TABLE} from '../src/roulette-table.mjs';
import {DICE_RULES as R} from '../src/dice-data.mjs';
import {musicState} from '../src/boss-music.mjs';
import {bindBattleSession} from '../src/battle-session.mjs';
import {diceMotion} from '../src/dice-motion-data.mjs';
import {DICE_PATTERNS} from '../src/dice-combat.mjs';

test('roulette pockets cover 0 through 36 once and the full combat board fits inside the wheel',()=>{
  assert.deepEqual([...ROULETTE_NUMBERS].sort((a,b)=>a-b),Array.from({length:37},(_,i)=>i));
  const half=(R.side-1)*R.edge/2+R.tileWidth/2;
  assert.ok(Math.hypot(half,half)<ROULETTE_TABLE.feltRadius);
  assert.ok(ROULETTE_TABLE.pocketInner>ROULETTE_TABLE.feltRadius);
});

test('active dice session selects the existing dice soundtrack and a paused session silences it',()=>{
  const root={},modal={open:true,firstElementChild:{shadowRoot:root}},doc={hidden:false,getElementById:id=>id==='dice-battle'?modal:null};
  let active=true;const release=bindBattleSession(root,()=>({active,game:{status:'playing',player:{},boss:{phase:2},dice:{}}}));
  assert.deepEqual(musicState(doc),{boss:'dice',phase:2,busy:false});active=false;assert.equal(musicState(doc),null);release();
});

test('casino die remains rigid and its shortened frenzy leaves more warning time',()=>{
  for(const state of ['warning','rolling','charge-warning','charge','jump-warning','jump','recovery','frenzy-windup'])for(const t of [0,.1,.3,.9,2]){
    const motion=diceMotion({state,t},t);assert.equal(motion.sy,1);assert.equal(motion.sxz,1);
  }
  assert.equal(DICE_PATTERNS.frenzyRolls,4);assert.ok(DICE_PATTERNS.frenzyWarning>=.6);assert.ok(DICE_PATTERNS.frenzyRollTime>=.38);
});
