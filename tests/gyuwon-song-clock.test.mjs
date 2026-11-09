import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGyuwonMusicalScore} from '../src/gyuwon-musical-score.mjs';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
import {GYUWON_SUBTITLES,gyuwonSubtitleAt} from '../src/gyuwon-subtitles.mjs';
function rig(){
 const sounds=[];let time=0;
 const score=createGyuwonMusicalScore(url=>{const a={url,paused:true,currentTime:0,duration:48,ended:false,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},load(){},removeAttribute(){}};sounds.push(a);return a;},()=>time);
 const g=createGyuwonGame('sword',{yearMode:true});g.gyuwon.years.year=5;stepGyuwon(g,.01);g.player.invuln=1e6;
 score.update(g);return {sounds,score,g,setTime(v){time=v;}};
}
test('media position, mute, pause and resume share one authoritative clock',async()=>{
 const {score,g,sounds}=rig(),a=sounds[0];await Promise.resolve();
 a.currentTime=12.5;score.update(g,{muted:true});assert.equal(a.muted,true);assert.equal(g.gyuwon.years.musical.clock.time,12.5);
 score.stop();assert.equal(a.paused,true);score.update(g,{enabled:false});assert.equal(a.currentTime,12.5);
 await new Promise(r=>setImmediate(r));score.update(g,{enabled:true});assert.equal(a.currentTime,12.5);assert.equal(a.paused,false);
 assert.equal(sounds.filter(s=>!s.paused).length,1);score.dispose();assert.ok(sounds.every(s=>s.paused));
});
test('successful playback never ends at the fallback duration, stale ended callbacks do not advance',()=>{
 const {score,g,sounds}=rig(),a=sounds[0],m=g.gyuwon.years.musical;
 a.duration=90;a.currentTime=60;score.update(g);assert.equal(m.clock.duration,90);assert.equal(m.clock.ended,false);
 const stale=a.onended;g.gyuwon.years.year=6;g.gyuwon.years.musical={year:6,time:0};score.update(g);
 stale();assert.equal(g.gyuwon.years.musical.clock.ended,false);assert.equal(a.paused,true);score.dispose();
});
test('missing, rejected and permanently stalled audio fall back without trapping the act',async()=>{
 for(const failure of ['error','rejected','stalled']){
  const {score,g,sounds,setTime}=rig(),a=sounds[0],m=g.gyuwon.years.musical;
  if(failure==='error')a.onerror();
  else if(failure==='stalled'){setTime(7);score.update(g);}
  else{await Promise.resolve();await Promise.resolve();a.paused=true;a.play=()=>Promise.reject(Error('decode'));score.update(g);await new Promise(r=>setImmediate(r));}
  assert.equal(m.clock.source,'fallback',failure);m.time=48;score.update(g);assert.equal(m.clock.ended,true);score.dispose();
 }
});
test('edited masters exist and subtitles have finite, ordered bilingual intervals with silent gaps',()=>{
 for(const [id,song]of Object.entries(GYUWON_SONGS)){
  assert.ok(fs.statSync(new URL('../assets/music/'+song.file,import.meta.url)).size>100000);
  let end=0;for(const cue of GYUWON_SUBTITLES[id]){
   assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=song.duration,id);end=cue.end;
   assert.ok(cue.en&&cue.ko);assert.equal(gyuwonSubtitleAt(id,cue.start),cue);
  }
  assert.equal(gyuwonSubtitleAt(id,song.duration-.1),null);
 }
});
