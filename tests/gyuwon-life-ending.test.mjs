import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_LIFE_SECONDS,GYUWON_LIFE_SHOTS,gyuwonLifeFrame} from '../src/gyuwon-life-epilogue.mjs';
import {GYUWON_LIFE_SCENE,gyuwonLifeCameraAt} from '../src/gyuwon-life-stage-3d.mjs';
import {referenceKeyAction} from '../src/gyuwon-reference-rules.mjs';

test('the full family epilogue follows 800 HP without jumps or overlapping scenes',()=>{
 assert.equal(GYUWON_LIFE_SHOTS[0].at,0);
 assert.equal(GYUWON_LIFE_SHOTS.at(-1).end,GYUWON_LIFE_SECONDS);
 assert.ok(GYUWON_LIFE_SHOTS.length>=10);
 for(let i=0;i<GYUWON_LIFE_SHOTS.length;i++){
  const shot=GYUWON_LIFE_SHOTS[i];
  assert.ok(shot.end>shot.at);
  if(i>0)assert.equal(shot.at,GYUWON_LIFE_SHOTS[i-1].end);
  assert.equal(gyuwonLifeFrame(shot.at+.01).shot,shot.id);
  assert.equal(gyuwonLifeFrame(shot.end-.01).complete,false);
 }
 assert.equal(gyuwonLifeFrame(GYUWON_LIFE_SECONDS-.01).complete,false);
 assert.equal(gyuwonLifeFrame(GYUWON_LIFE_SECONDS).complete,true);
});
test('the final two dialog lines precede an actual visual phone zoom',()=>{
 const child=gyuwonLifeFrame(115),answer=gyuwonLifeFrame(130),phone=gyuwonLifeFrame(143);
 assert.match(child.line,/아빠, 이게 뭐야/);
 assert.match(answer.line,/아빠가 옛날에/);
 assert.equal(phone.shot,'phone');
 assert.ok(phone.zoom>0&&phone.zoom<1);
 assert.equal(gyuwonLifeFrame(GYUWON_LIFE_SECONDS).zoom,1);
});
test('displayed 7 has two inputs, displayed 8 adds Space, runner cannot dash',()=>{
 const runner={year:6,reference:true},dance={year:8,reference:true},fighter={year:9,reference:true};
 assert.equal(referenceKeyAction(runner,'KeyK'),null);
 assert.equal(referenceKeyAction(runner,'Space'),'jump');
 assert.equal(referenceKeyAction(runner,'KeyL'),'slide');
 assert.equal(referenceKeyAction(dance,'KeyJ'),'light');
 assert.equal(referenceKeyAction(dance,'KeyL'),'skill');
 assert.equal(referenceKeyAction(dance,'Space'),null);
 assert.equal(referenceKeyAction(fighter,'KeyJ'),'light');
 assert.equal(referenceKeyAction(fighter,'KeyK'),'guard');
 assert.equal(referenceKeyAction(fighter,'Space'),'jump');
});

test('every earlier life vignette is a physical Three.js set with a moving perspective camera',()=>{
 const names=['realization','youth','study','work','parttime','love','wedding','family','child','answer','phone'];
 for(const id of names){
  const s=GYUWON_LIFE_SHOTS.find(x=>x.id===id);
  const f=gyuwonLifeFrame((s.at+s.end)/2);
  assert.ok(GYUWON_LIFE_SCENE[id]&&GYUWON_LIFE_SCENE[id]!=='portal');
  assert.equal(f.sceneKey,GYUWON_LIFE_SCENE[id]);
  const start=gyuwonLifeCameraAt(id,0),end=gyuwonLifeCameraAt(id,1);
  assert.notDeepEqual(start.position,end.position,'3D camera must dolly in '+id);
  assert.ok(start.fov>0&&start.fov<90);
  assert.ok(end.position.every(Number.isFinite));
 }
});
test('phone zoom resolves to the original mural opening, corridor walk and credits before unlock',()=>{
 const before=gyuwonLifeFrame(146.95);
 const splitStart=gyuwonLifeFrame(147),splitMiddle=gyuwonLifeFrame(151.1);
 const splitEnd=gyuwonLifeFrame(157.2),title=gyuwonLifeFrame(178);
 assert.equal(before.shot,'phone');
 assert.equal(splitStart.shot,'portal');
 assert.equal(splitStart.sceneKey,'portal');
 assert.equal(splitStart.split,0);
 assert.ok(splitMiddle.split>0&&splitMiddle.split<1);
 assert.equal(splitEnd.shot,'corridor');
 assert.equal(splitEnd.split,1);
 assert.ok(title.titleOpacity>.5);
 assert.equal(title.complete,false);
 assert.equal(gyuwonLifeFrame(163.9).complete,false);
 assert.equal(gyuwonLifeFrame(164).complete,false);
 assert.equal(gyuwonLifeFrame(181).complete,true);
});
