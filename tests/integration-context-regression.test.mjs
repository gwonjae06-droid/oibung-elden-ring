import test from 'node:test';
import assert from 'node:assert/strict';
import {kwonFight} from '../src/sound-variation.mjs';
import {coopWeapon} from '../src/coop-menu.mjs';

function documentStub(entries={},selected='sword'){return {getElementById:id=>entries[id]??null,querySelector:()=>({dataset:{weapon:selected}})};}
function modal(label,open=true){return {open,firstElementChild:{shadowRoot:{getElementById:id=>id==='weapon-label'?{textContent:label}:null}}};}
test('first-boss audio applies only to an uncovered visible first-boss HUD',()=>{
 assert.equal(kwonFight(undefined),false);
 assert.equal(kwonFight(documentStub()),false);
 assert.equal(kwonFight(documentStub({'boss-hud':{hidden:true}})),false);
 assert.equal(kwonFight(documentStub({'boss-hud':{hidden:false}})),true);
 for(const id of ['clown-battle','dice-battle','boss-transition']){
  assert.equal(kwonFight(documentStub({'boss-hud':{hidden:false},[id]:{open:true}})),false,id);
  assert.equal(kwonFight(documentStub({'boss-hud':{hidden:false},[id]:{open:false}})),true,id);
 }
});
test('coop loadout follows the open nested battle instead of a stale closed dialog',()=>{
 const doc=documentStub({'dice-battle':modal('검',false),'clown-battle':modal(' 망치 ')},'cards');
 assert.equal(coopWeapon(doc),'hammer');
});
test('dice loadout wins while a parent clown dialog remains open',()=>{
 assert.equal(coopWeapon(documentStub({'dice-battle':modal('활'),'clown-battle':modal('망치')})),'bow');
});
test('coop loadout falls back safely when no active label is available',()=>{
 assert.equal(coopWeapon(documentStub({},'cards')),'cards');
 assert.equal(coopWeapon(documentStub({'dice-battle':{open:true}},'hammer')),'hammer');
});
