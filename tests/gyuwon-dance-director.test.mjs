import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_DANCE_STAGES,gyuwonDanceScene,gyuwonDanceAction,gyuwonDanceTelegraph} from '../src/gyuwon-dance-director.mjs';

test('act eight lyric direction changes scene from army to dance to dawn to next arena',()=>{
 assert.equal(GYUWON_DANCE_STAGES[0].key,'handoff');
 assert.equal(gyuwonDanceScene(0).key,'handoff');
 assert.equal(gyuwonDanceScene(12).key,'invitation');
 assert.equal(gyuwonDanceScene(42).key,'stars');
 assert.equal(gyuwonDanceScene(98).key,'silence');
 assert.equal(gyuwonDanceScene(119).key,'rain');
 assert.equal(gyuwonDanceScene(160).key,'sunrise');
 assert.equal(gyuwonDanceScene(176).key,'bow');
 assert.equal(gyuwonDanceScene(180).ring,1);
});
test('step and quick-step both belong to J while turning belongs to L',()=>{
 assert.equal(gyuwonDanceAction('pose'),'light');
 assert.equal(gyuwonDanceAction('quick'),'light');
 assert.equal(gyuwonDanceAction('turn'),'skill');
});
test('a never-pressed dance figure nevertheless shows its exact upcoming contact',()=>{
 const p={kind:'pose',cue:10,first:11.65,count:3,spacing:2,done:[],misses:[]};
 const cue=gyuwonDanceTelegraph(p,10.15,.5);
 assert.ok(cue?.active);
 assert.equal(cue.action,'light');
 assert.ok(cue.remaining>1.4);
 assert.ok(cue.lead>0&&cue.lead<1);
 p.done[0]=true;
 const next=gyuwonDanceTelegraph(p,12.2,.5);
 assert.ok(next?.active);
 assert.equal(next.index,1);
 assert.equal(next.at,12.65);
});
test('turns are visibly different from steps and completed cues disappear',()=>{
 const p={kind:'turn',cue:20,first:21.5,count:1,spacing:1,done:[],misses:[]};
 const cue=gyuwonDanceTelegraph(p,20.8,.5);
 assert.equal(cue?.action,'skill');
 assert.ok(cue?.active);
 p.done[0]=true;
 assert.equal(gyuwonDanceTelegraph(p,20.9,.5),null);
});
