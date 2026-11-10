import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,WEAPONS} from '../src/combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {encounterStore} from '../src/encounter-state.mjs';
import {tickPlayerAction} from '../src/player-combat.mjs';

test('creating a dice player does not overwrite the active progression encounter',()=>{
  createGame('hammer');
  const before=encounterStore.read();
  const first=createDicePlayerGame('cards'),second=createDicePlayerGame('cards');
  assert.deepEqual(encounterStore.read(),before);
  first.player.skill.sigilMarks=2;
  first.player.hp=1;
  assert.equal(second.player.skill.sigilMarks,0);
  assert.equal(second.player.hp,110);
  assert.throws(()=>createDicePlayerGame('missing'),/Unknown weapon/);
  encounterStore.clear();
});

test('attack windup emits its volley once and preserves an interrupting action',()=>{
  const game=createGame('cards');
  act(game,'light');
  tickPlayerAction(game,.29,WEAPONS.cards);
  tickPlayerAction(game,.02,WEAPONS.cards);
  assert.equal(game.projectiles.length,3);
  assert.equal(game.events.filter(e=>e.type==='swing').length,1);
  assert.equal(game.events.filter(e=>e.type==='shot').length,1);
  const melee=createGame('sword');
  act(melee,'light');
  const replacement={kind:'hurt',t:0,total:1};
  tickPlayerAction(melee,.2,WEAPONS.sword,{melee:action=>{
    action.total=.1;
    melee.player.action=replacement;
  }});
  assert.equal(melee.player.action,replacement);
  encounterStore.clear();
});
