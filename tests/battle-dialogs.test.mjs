import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BATTLE_DIALOGS,BATTLE_DIALOG_IDS,battleDialogSelector,findOpenBattle,battleRoots} from '../src/battle-dialogs.mjs';

test('battle dialogs come from the boss registry, newest boss first',()=>{
 assert.deepEqual(BATTLE_DIALOG_IDS,['blood-battle','dice-battle','clown-battle']);
 assert.deepEqual(BATTLE_DIALOGS.map(d=>d.boss),['blood','dice','clown']);
 assert.equal(battleDialogSelector(),'dialog#blood-battle[open], dialog#dice-battle[open], dialog#clown-battle[open]');
});
test('findOpenBattle reports the open boss dialog and its shadow root',()=>{
 const root={},doc={getElementById:id=>id==='dice-battle'?{open:true,firstElementChild:{shadowRoot:root}}:null};
 const found=findOpenBattle(doc);
 assert.equal(found.boss,'dice');assert.equal(found.id,'dice-battle');assert.equal(found.root,root);
 assert.equal(findOpenBattle({getElementById:()=>null}),null);
 assert.deepEqual(battleRoots(doc),[root]);
});
test('a later boss wins when two battle dialogs are open',()=>{
 const open={open:true,firstElementChild:{shadowRoot:{}}};
 assert.equal(findOpenBattle({getElementById:id=>id==='clown-battle'||id==='blood-battle'?open:null}).boss,'blood');
});
test('music, screen effects, sound, dev damage and the mobile gate no longer hard-code boss dialog ids',()=>{
 for(const file of ['boss-music.mjs','screen-fx.mjs','sound-variation.mjs','dev-boss-damage.mjs','mobile-landscape.mjs']){
  const text=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.doesNotMatch(text,/(clown|dice|blood)-battle/,file);
 }
});
