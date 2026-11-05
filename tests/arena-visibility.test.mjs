import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaCovered} from '../src/arena-visibility.mjs';
test('visible battle draws, but every full-screen encounter and opaque home covers the old arena',()=>{
 const elements={},doc={hidden:false,getElementById:id=>elements[id]};assert.equal(arenaCovered(doc),false);
 for(const id of ['clown-battle','dice-battle','blood-battle']){elements[id]={open:true};assert.equal(arenaCovered(doc),true);elements[id].open=false;assert.equal(arenaCovered(doc),false);}
 elements.journey={open:true,hidden:false};assert.equal(arenaCovered(doc),true);elements.journey.hidden=true;assert.equal(arenaCovered(doc),false);
 doc.hidden=true;assert.equal(arenaCovered(doc),true);doc.hidden=false;assert.equal(arenaCovered(doc),false);
});
