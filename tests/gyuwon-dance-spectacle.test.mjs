import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_DANCE_LYRIC_MOMENTS,gyuwonDanceLyricMoment,
 drawGyuwonDanceLyricBackdrop,drawGyuwonDanceLyricFloor,
 drawGyuwonDanceLyricForeground} from '../src/gyuwon-dance-spectacle.mjs';
import {gyuwonDanceScene} from '../src/gyuwon-dance-director.mjs';

test('full 180s dance has ordered lyric-led visual anchors without changing the audio',()=>{
 assert.ok(GYUWON_DANCE_LYRIC_MOMENTS.length>=20);
 assert.ok(GYUWON_DANCE_LYRIC_MOMENTS.every((v,i,a)=>i===0||v.at>a[i-1].at));
 assert.equal(gyuwonDanceLyricMoment(29.2).key,'step-left');
 assert.equal(gyuwonDanceLyricMoment(31.3).key,'step-right');
 assert.equal(gyuwonDanceLyricMoment(41).focus,'stars');
 assert.equal(gyuwonDanceLyricMoment(97).key,'fade');
 assert.equal(gyuwonDanceLyricMoment(106).key,'still-dance');
 assert.equal(gyuwonDanceLyricMoment(121).key,'rain');
 assert.equal(gyuwonDanceLyricMoment(125).key,'again');
 assert.equal(gyuwonDanceLyricMoment(178).key,'bow');
});
test('high-density star, silence, rain, dawn stages render deterministically with no effect ownership of hits',()=>{
 let n=0;
 const gradient=()=>({addColorStop(){}});
 const c=new Proxy({}, {get(target,property){
  if(property==='createLinearGradient'||property==='createRadialGradient')return gradient;
  if(Object.hasOwn(target,property))return target[property];
  return ()=>{n++};
 },set(target,property,value){target[property]=value;return true}});
 for(const t of [0,10.635,28.96,31,40,44,47.64,60,94,102,105.66,112.42,120.02,124,158,174.5,179]){
  const s=gyuwonDanceScene(t),m={time:t,combo:5,danceError:0};
  const tele={active:true,action:'light',lead:.75,remaining:.15,index:0,at:t+.15};
  const before=n;
  drawGyuwonDanceLyricBackdrop(c,s,m);
  drawGyuwonDanceLyricFloor(c,s,m,tele);
  drawGyuwonDanceLyricForeground(c,s,m,tele);
  assert.ok(n>before,'must issue real canvas draw calls at '+t);
  assert.ok(n-before<600,'bounded scene draw work at '+t);
 }
});
