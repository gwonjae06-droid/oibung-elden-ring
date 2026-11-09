import {GYUWON_ALIGNED_CAPTIONS} from '../src/gyuwon-aligned-captions.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGyuwonMusicalScore} from '../src/gyuwon-musical-score.mjs';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
import {scoreAudit} from '../scripts/gyuwon-source-score-audit.mjs';
import {GYUWON_SUBTITLES,GYUWON_ORIGINAL_SUBTITLES,gyuwonSubtitleAt} from '../src/gyuwon-subtitles.mjs';
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
test('missing/rejected/stalled score never marks an act complete',async()=>{
 for(const failure of ['error','rejected','stalled']){
  const {score,g,sounds,setTime}=rig(),a=sounds[0],m=g.gyuwon.years.musical;
  if(failure==='error')a.onerror();
  else if(failure==='stalled'){setTime(7);score.update(g);}
  else{await Promise.resolve();await Promise.resolve();a.paused=true;a.play=()=>Promise.reject(Error('decode'));score.update(g);await new Promise(r=>setImmediate(r));}
  assert.equal(m.clock.source,'error');setTime(1000);score.update(g);
  assert.equal(m.clock.ended,false);assert.equal(m.clock.time,0);score.dispose();
 }
});
test('original masters and source-located bilingual subtitles',()=>{
 for(const [id,song]of Object.entries(GYUWON_SONGS)){
  assert.equal(song.file,song.source);assert.ok(song.duration>=175);
  assert.ok(fs.statSync(new URL('../assets/music/'+song.file,import.meta.url)).size>100000);
  let end=0;for(const cue of GYUWON_ORIGINAL_SUBTITLES[id]){
   assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=song.duration,id);end=cue.end;
   assert.ok(cue.en&&cue.ko); // Historical edit mappings remain archived, not display priority.
  }
  assert.ok(GYUWON_ORIGINAL_SUBTITLES[id].length>0);
  assert.ok(GYUWON_SUBTITLES[id].length>=GYUWON_ORIGINAL_SUBTITLES[id].length);
  assert.equal(gyuwonSubtitleAt(id,song.duration-.1),null);
 }
});

test('post-song HP bridge uses active real time even with sparse frames',()=>{
 const {score,g,sounds,setTime}=rig(),m=g.gyuwon.years.musical;g.boss.hp=6000;
 sounds[0].onended();score.update(g);stepGyuwon(g,.05);assert.equal(m.settle,0);
 setTime(.8);score.update(g);stepGyuwon(g,.05);assert.ok(m.settle>.79);
 score.stop();setTime(10);score.update(g,{enabled:false});assert.ok(m.settle<1);
 score.update(g);setTime(10.4);score.update(g);stepGyuwon(g,.05);assert.equal(g.gyuwon.years.year,6);assert.equal(g.boss.hp,5300);score.dispose();
});

test('full-song vocal captions extend beyond the historic edit while instrumentals stay blank',()=>{
 for(const [key,song] of Object.entries(GYUWON_SONGS)){
  let count=0;
  for(let second=5;second<song.duration-4;second+=1)if(gyuwonSubtitleAt(key,second)?.ko)count++;
  assert.ok(count>45,key+' actual vocal caption coverage '+count);
  assert.ok(GYUWON_ALIGNED_CAPTIONS[key].some(c=>c.start>90));
  assert.equal(gyuwonSubtitleAt(key,song.duration-.05),null);
 }
});
test('seven-act progress HUD keeps a live song clock and text-only caption style',()=>{
 const hud=fs.readFileSync(new URL('../src/gyuwon-musical-hud.mjs',import.meta.url),'utf8');
 assert.match(hud,/gy-theater-progress/);
 assert.match(hud,/theaterFill\.style\.width/);
 assert.match(hud,/gyuwonSubtitleAt\(gyuwonSongKey\(m\),m\.time\)/);
 assert.match(hud,/background:transparent;border:0/);
});

test('low frame rates cannot delay the curtain behind the original song clock',()=>{
 const {score,g,sounds}=rig(),a=sounds[0],m=g.gyuwon.years.musical;
 assert.equal(m.entryDuration,5.8);
 a.currentTime=4;score.update(g);stepGyuwon(g,1/60);
 assert.ok(m.transition>=1.79&&m.transition<=1.81, String(m.transition));
 a.currentTime=6.25;score.update(g);stepGyuwon(g,1/60);
 assert.equal(m.transition,0);
 assert.ok(m.time>=6.25);
 score.dispose();
});

test('manual master-caption corrections can replace temporary lyric slots without changing original duration',async()=>{
 const {GYUWON_MASTER_CAPTION_OVERRIDES}=await import('../src/gyuwon-caption-overrides.mjs');
 for(const key of Object.keys(GYUWON_SONGS)){
  const cues=GYUWON_MASTER_CAPTION_OVERRIDES[key];
  assert.ok(Array.isArray(cues),key);
  let end=0;
  for(const cue of cues){
   assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=GYUWON_SONGS[key].duration,key);
   assert.ok(cue.en&&cue.ko);
   end=cue.end;
  }
 }
 // A cached excerpt is explicitly not certified against the full vocal.
 for(const key of Object.keys(GYUWON_SONGS)){
  const excerpt=GYUWON_ALIGNED_CAPTIONS[key][0];
  const shown=gyuwonSubtitleAt(key,excerpt.start);
  assert.equal(shown.verified,false);
 }
});

test('score audit separates original-excerpt cues from every track\'s unfinished full vocal alignment',()=>{
 const rows=scoreAudit();
 assert.equal(rows.length,8);
 assert.deepEqual(rows.map(r=>String(r.key)),['5','6','7','8','9','10','11','ending']);
 for(const r of rows){
  assert.ok(r.excerptMappedCues>0,r.track);
  assert.ok(r.excerptDerivedAccents>0,r.track);
  assert.ok(r.excerptMappedSeconds>0&&r.excerptMappedSeconds<r.duration,r.track);
  assert.equal(r.provisionalDisplayCues,0,r.track);
  assert.ok(r.wordAlignedCues>=20,r.track);
  assert.equal(r.manualTranscriptionRequired,true,r.track);
 }
});


test('years one through four have no music player, including exams, restarts and prelude states',async()=>{
 const sounds=[];
 const score=createGyuwonMusicalScore(src=>{
  const a={src,paused:true,currentTime:0,duration:180,ended:false,load(){},
   removeAttribute(){this.src='';},pause(){this.paused=true;},
   play(){this.paused=false;return Promise.resolve();}};
  sounds.push(a);return a;
 });
 const g=createGyuwonGame('sword',{yearMode:true});
 for(const year of [1,2,3,4]){
  g.gyuwon.years.year=year;g.gyuwon.years.musical=null;
  for(const mode of ['combat','exam','result','reverie']){
   g.gyuwon.years.mode=mode;
   assert.equal(score.update(g,{enabled:true}),true);
   assert.equal(score.mode,null);
   assert.equal(score.retry(),false);
  }
 }
 score.stop();score.update(g,{enabled:false});
 assert.equal(sounds.length,0,'even the old swordbgm prelude must never be constructed');
 // Year five is still song-owned and plays its unmodified musical master.
 g.gyuwon.years.year=5;g.gyuwon.years.mode='musical';
 g.gyuwon.years.musical={year:5,finishing:false};
 score.update(g,{enabled:true});
 await Promise.resolve();await Promise.resolve();
 assert.equal(score.mode,5);
 assert.ok(sounds.length>=1);
 assert.match(sounds[0].src,/assets\\/music\\/.+\.mp3$/);
 assert.ok(sounds[0].src.includes('assets/music/'));
 assert.equal(sounds[0].paused,false);
 // Re-entering an early year stops and releases all old song objects.
 g.gyuwon.years.year=4;g.gyuwon.years.mode='combat';g.gyuwon.years.musical=null;
 score.update(g,{enabled:true});
 assert.equal(score.mode,null);
 assert.ok(sounds.every(a=>a.paused));
 assert.equal(score.retry(),false);
 score.dispose();
});
