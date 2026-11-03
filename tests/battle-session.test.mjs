import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBattleSession,readBattleSession} from '../src/battle-session.mjs';
import {readWeapon,pauseForChooser,closeDiceBattle} from '../src/game-ui.mjs';

test('dice exit uses the live session close command without depending on button text',()=>{
  const root={querySelector(){throw Error('Button lookup');}};let modal={firstElementChild:{shadowRoot:root}},calls=0;
  const unbind=bindBattleSession(root,()=>({close(){calls++;modal=null;return Promise.resolve();}}));
  closeDiceBattle({getElementById:()=>modal});assert.equal(calls,1);assert.equal(modal,null);unbind();
});

test('chooser uses session commands without looking for pause buttons',()=>{
  const root={getElementById(){throw Error('DOM pause lookup');}},calls=[];
  const unbind=bindBattleSession(root,()=>({active:true,pause:()=>{calls.push('pause');return true;},resume:()=>calls.push('resume')}));
  const resume=pauseForChooser(root);assert.deepEqual(calls,['pause']);resume();assert.deepEqual(calls,['pause','resume']);unbind();
});

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
