import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBattleSession,readBattleSession} from '../src/battle-session.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createProgressionGate} from '../src/progression-gate.mjs';
import {encounterStore} from '../src/encounter-state.mjs';
import {coopWeapon} from '../src/coop-menu.mjs';
import {musicState} from '../src/boss-music.mjs';

test('parallel arenas retain their own outcomes and retries invalidate only their own tickets',()=>{
  encounterStore.clear();const main={},clown={},dice={};
  const g=createGame('sword',{register:false});let c=createClownGame('hammer',{register:false});
  const d=createDicePlayerGame('bow');
  const disposers=[bindBattleSession(main,()=>({game:g})),bindBattleSession(clown,()=>({game:c})),bindBattleSession(dice,()=>({game:d}))];
  g.status=c.status='won';
  const read=root=>()=>readBattleSession(root)?.encounter;
  const a=createProgressionGate('kwon',read(main)),b=createProgressionGate('clown',read(clown));
  const at=a.automatic(),bt=b.automatic();assert.ok(at&&bt);assert.notEqual(at.encounterId,bt.encounterId);
  assert.equal(readBattleSession(dice).encounter.bossId,'dice');assert.equal(encounterStore.read(),null);
  c=createClownGame('cards',{register:false});assert.equal(b.valid(bt),false);assert.equal(a.valid(at),true);
  for(const dispose of disposers)dispose();assert.equal(a.valid(at),false);
});

test('coop selection and music use engine state rather than translated HUD text',()=>{
  const root={getElementById(){throw Error('HUD lookup');}},modal={open:true,firstElementChild:{shadowRoot:root}};
  const doc={hidden:false,getElementById:id=>id==='clown-battle'?modal:null};
  const g=createClownGame('cards',{register:false});g.boss.phase=2;g.clown.state='pattern';g.clown.name='tripleBomb';
  const dispose=bindBattleSession(root,()=>({game:g,active:true}));
  assert.equal(coopWeapon(doc),'cards');assert.deepEqual(musicState(doc),{boss:'clown',phase:2,busy:true});dispose();
});
