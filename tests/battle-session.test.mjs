import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBattleSession,readBattleSession} from '../src/battle-session.mjs';
import {readWeapon} from '../src/game-ui.mjs';

test('each arena reads its current game and stale cleanup cannot remove a replacement',()=>{
  const root={getElementById:()=>({textContent:'검'})},doc={querySelector:()=>null};
  let game={weapon:'hammer'};
  const old=bindBattleSession(root,()=>({game,active:true}));
  assert.equal(readWeapon(root,doc),'hammer');
  game={weapon:'bow'};
  assert.equal(readWeapon(root,doc),'bow');
  const dispose=bindBattleSession(root,()=>({game:{weapon:'cards'},active:true}));
  old();
  assert.equal(readWeapon(root,doc),'cards');
  dispose();
  assert.equal(readBattleSession(root),null);
});
