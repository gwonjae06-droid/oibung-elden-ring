import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_CURTAIN_CAST,GYUWON_CURTAIN_CREDITS_START,GYUWON_FINALE_CREDITS,GYUWON_END_DEDICATION,gyuwonCurtainCallAt,gyuwonDedicationAt,isGyuwonCurtainCall} from '../src/gyuwon-curtain-call.mjs';
import {JOURNEY_FINALE_SECONDS} from '../src/journey-finale.mjs';

test('5 returning performers replay their actual phases and remain for the ensemble',()=>{
 assert.deepEqual(GYUWON_CURTAIN_CAST.map(c=>c.name),['이권재','오슬우','박성원','배서준','최규원']);
 const d=180;
 for(let i=0;i<GYUWON_CURTAIN_CAST.length;i++){
  const act=GYUWON_CURTAIN_CAST[i];
  assert.equal(act.scenes.length,i===1?2:3);
  assert.equal(act.end,i===4?GYUWON_CURTAIN_CREDITS_START:GYUWON_CURTAIN_CAST[i+1].start);
  for(let k=0;k<act.scenes.length;k++){
   const p=(act.start+(act.end-act.start)*(k+.5)/act.scenes.length)*d;
   const frame=gyuwonCurtainCallAt(p,d);
   assert.equal(frame.actorIndex,i);
   assert.equal(frame.phase,act.scenes[k].phase);
   assert.equal(frame.joined,i);
   assert.equal(frame.response,act.scenes[k].response);
   assert.ok(frame.prop);
  }
 }
});

test('11수 turns into rolling credits just past the original song midpoint',()=>{
 assert.equal(gyuwonCurtainCallAt(0).mode,'recollection');
 assert.equal(gyuwonCurtainCallAt(93).mode,'recollection');
 assert.equal(gyuwonCurtainCallAt(100).mode,'credits');
 assert.equal(gyuwonCurtainCallAt(180).mode,'credits');
 assert.equal(gyuwonCurtainCallAt(180).creditsProgress,1);
 assert.equal(gyuwonCurtainCallAt(120).ensemble,true);
 assert.equal(gyuwonCurtainCallAt(120).joined,5);
 assert.ok(GYUWON_FINALE_CREDITS.length>=10);
 assert.equal(isGyuwonCurtainCall({year:11,kind:'finale'}),true);
 assert.equal(isGyuwonCurtainCall({year:11,kind:'finale',finishing:true}),false);
 assert.equal(isGyuwonCurtainCall({year:10,kind:'shooter'}),false);
});

test('800 HP transition displays seven dedication messages one by one',()=>{
 assert.deepEqual(GYUWON_END_DEDICATION,[
  '거미 배역 이권재','광대 배역 오슬우','주사위 배역 박성원',
  '혈왕 배역 배서준','수험생 최규원',
  '이 게임을 최규원의 27수능에 바칩니다','규원아 수능 응원한다']);
 assert.equal(gyuwonDedicationAt(1),null);
 for(let i=0;i<7;i++){
  const cue=gyuwonDedicationAt(8+i*10);
  assert.equal(cue.index,i);assert.equal(cue.line,GYUWON_END_DEDICATION[i]);
  assert.equal(cue.opacity,1);
 }
 assert.equal(gyuwonDedicationAt(75),null);
});

test('unskippable home-screen finale is substantially slower than the previous 19 seconds',()=>{
 assert.equal(JOURNEY_FINALE_SECONDS,34);
});
