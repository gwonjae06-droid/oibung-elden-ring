import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_TRACKS,bossTrack,createBossTracks,BLOOD_MUSIC_REPRISE_SECONDS} from '../src/boss-tracks.mjs';

test('uploaded MP3 filenames map to the correct boss and phase',()=>{
  assert.deepEqual(BOSS_TRACKS.kwon,['swordbgm.mp3','swordbgm2.mp3']);
  assert.deepEqual(BOSS_TRACKS.clown,['clown1.mp3','clown2.mp3']);
  assert.deepEqual(BOSS_TRACKS.dice,['dicebgm.mp3','dicebgm2.mp3']);
  assert.deepEqual(BOSS_TRACKS.blood,['bloodbgm1.mp3','bloodbgm2.mp3']);
  assert.match(bossTrack({boss:'blood',phase:1}).url,/assets\/music\/bloodbgm1\.mp3$/);
  assert.match(bossTrack({boss:'blood',phase:2}).url,/assets\/music\/bloodbgm2\.mp3$/);
  assert.equal(bossTrack({boss:'blood',phase:3}).key,bossTrack({boss:'blood',phase:2}).key);
  assert.equal(bossTrack({boss:'dice',phase:2}).key,'dice:2');
  assert.equal(bossTrack({boss:'dice',phase:3}).key,'dice:3');
  assert.match(bossTrack({boss:'dice',phase:3}).url,/dicebgm2\.mp3$/);
  assert.match(bossTrack({boss:'kwon',phase:1}).url,/assets\/music\/swordbgm\.mp3$/);
  assert.equal(bossTrack({boss:'unknown',phase:1}),null);
});

class FakeAudio{
  static instances=[];
  constructor(src){this.src=src;this.paused=true;this.loop=false;this.volume=1;this.currentTime=0;FakeAudio.instances.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}
  load(){}
}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.001,actual+' != '+expected);

test('phase change crossfades, pauses and cleans up audio',()=>{
  FakeAudio.instances=[];let time=0;
  const tracks=createBossTracks({Audio:FakeAudio},{now:()=>time,fadeMs:1000,volume:.5});
  assert.equal(tracks.update({boss:'kwon',phase:1}),true);
  assert.equal(tracks.playingKey,'kwon:1');
  const first=FakeAudio.instances[0];assert.equal(first.loop,true);
  time=500;tracks.update({boss:'kwon',phase:1});near(first.volume,.25);
  time=600;tracks.update({boss:'kwon',phase:2});
  const second=FakeAudio.instances[1];assert.equal(tracks.playingKey,'kwon:2');near(second.volume,0);
  time=1100;tracks.update({boss:'kwon',phase:2});near(first.volume,.125);near(second.volume,.25);
  tracks.update(null);assert.equal(first.paused,true);assert.equal(second.paused,true);
  time=2100;tracks.update({boss:'kwon',phase:2});near(second.volume,.25);
  time=2600;tracks.update({boss:'kwon',phase:2});near(second.volume,.5);assert.equal(first.paused,true);
  tracks.reset();assert.equal(second.paused,true);assert.equal(tracks.playingKey,null);
  tracks.dispose();assert.equal(tracks.update({boss:'dice',phase:1}),false);
});

test('missing Audio support permits the original synthesizer fallback',()=>{
  const tracks=createBossTracks({});
  assert.equal(tracks.update({boss:'clown',phase:1}),false);
  assert.equal(tracks.playingKey,null);
  tracks.dispose();
});

test('blood boss phase switch crossfades uploaded files and can reset on retry',()=>{
  FakeAudio.instances=[];let time=0;
  const tracks=createBossTracks({Audio:FakeAudio},{now:()=>time,fadeMs:1200,volume:.5});
  assert.equal(tracks.update({boss:'blood',phase:1}),true);
  const first=FakeAudio.instances.at(-1);
  assert.match(first.src,/bloodbgm1\.mp3$/);
  time=1200;tracks.update({boss:'blood',phase:1});near(first.volume,.5);
  time=1300;assert.equal(tracks.update({boss:'blood',phase:2}),true);
  const second=FakeAudio.instances.at(-1);
  assert.match(second.src,/bloodbgm2\.mp3$/);
  assert.equal(tracks.playingKey,'blood:2');
  time=1900;tracks.update({boss:'blood',phase:2});near(first.volume,.25);near(second.volume,.25);
  tracks.update(null);assert.equal(first.paused,true);assert.equal(second.paused,true);
  tracks.reset();assert.equal(tracks.playingKey,null);
  time=2000;assert.equal(tracks.update({boss:'blood',phase:1}),true);
  assert.match(FakeAudio.instances.at(-1).src,/bloodbgm1\.mp3$/);
  tracks.dispose();
});

test('Blood 2P music continues over Seraph metamorphosis, then reprises from the middle after the entire ending',()=>{
 FakeAudio.instances=[];let t=0;
 const tracks=createBossTracks({Audio:FakeAudio},{now:()=>t,fadeMs:500});
 tracks.update({boss:'blood',phase:2,offset:1.8});
 const same=FakeAudio.instances[0];
 assert.equal(same.loop,false);
 assert.equal(BLOOD_MUSIC_REPRISE_SECONDS,130);
 same.currentTime=198.4;t=1000;
 tracks.update({boss:'blood',phase:3,cinematic:true});
 assert.equal(FakeAudio.instances.length,1,'3P must never create a new music player');
 assert.equal(tracks.playingKey,'blood:2');
 assert.equal(same.currentTime,198.4,'3P must retain the exact currently playing time');
 assert.equal(same.playbackRate,1);
 same.duration=263.23;same.paused=true;same.currentTime=same.duration;
 same.onended();
 assert.equal(same.currentTime,130,'only after the full ending do we replay the middle');
 assert.equal(same.paused,false);
 tracks.update({boss:'blood',phase:3});
 assert.equal(FakeAudio.instances.length,1);
 tracks.reset();
 assert.equal(same.onended,null,'reset must detach stale replay handlers');
 tracks.dispose();
});
