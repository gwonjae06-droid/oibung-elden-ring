import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_DANCE_STAGES,gyuwonDanceScene,gyuwonDanceAction,gyuwonDanceTelegraph,GYUWON_DANCE_WINDOWS,gyuwonDanceNextCue,gyuwonDanceJudge} from '../src/gyuwon-dance-director.mjs';

test('act eight lyric direction changes scene from army to dance to dawn to next arena',()=>{
 assert.equal(GYUWON_DANCE_STAGES[0].key,'handoff');
 assert.equal(gyuwonDanceScene(0).key,'handoff');
 assert.equal(gyuwonDanceScene(12).key,'invitation');
 assert.equal(gyuwonDanceScene(42).key,'stars');
 assert.equal(gyuwonDanceScene(98).key,'silence');
 assert.equal(gyuwonDanceScene(119).key,'encore');
 assert.equal(gyuwonDanceScene(121).key,'rain');
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

test('visualized note, input acceptance and expiry share one authoritative contact time',()=>{
 const pattern={id:1,kind:'turn',cue:10,first:11.7,count:1,spacing:1,done:[],misses:[]};
 const at=11.7;
 const lead=gyuwonDanceNextCue([pattern],10.3,.5);
 assert.ok(lead?.active);assert.equal(lead.action,'skill');
 assert.ok(lead.remaining>1.35);
 assert.equal(gyuwonDanceJudge([pattern],at-.25,'skill',.5)?.accepted,false);
 assert.equal(gyuwonDanceJudge([pattern],at,'light',.5)?.accepted,false);
 assert.equal(gyuwonDanceJudge([pattern],at,'skill',.5)?.grade,'PERFECT');
 assert.equal(gyuwonDanceJudge([pattern],at+.20,'skill',.5)?.accepted,true);
 assert.equal(gyuwonDanceJudge([pattern],at+GYUWON_DANCE_WINDOWS.expired+.01,'skill',.5),null);
 pattern.done[0]=true;
 assert.equal(gyuwonDanceNextCue([pattern],at,.5),null);
});
test('when a quick two-step follows a previous step, every note has its own cue',()=>{
 const p={id:2,kind:'quick',cue:19.4,first:21,count:2,spacing:1,done:[],misses:[]};
 let n=gyuwonDanceNextCue([p],20,.5);
 assert.equal(n.index,0);assert.equal(n.action,'light');
 p.done[0]=true;
 n=gyuwonDanceNextCue([p],21.05,.5);
 assert.equal(n.index,1);assert.equal(n.at,21.5);
 assert.equal(gyuwonDanceJudge([p],21.50,'light',.5)?.accepted,true);
 assert.equal(gyuwonDanceJudge([p],21.50,'skill',.5)?.accepted,false);
});
