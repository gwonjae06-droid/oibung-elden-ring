import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createSampleSfx,SOUND_SAMPLES} from '../src/sample-sfx.mjs';
const getStorage=()=>{
 const data=new Map([['oibung.audio.master','0.5'],['oibung.audio.effects','0.4']]);
 return {getItem:key=>data.get(key)??null};
};
test('recorded samples refer only to actual local audio assets',()=>{
 for(const files of Object.values(SOUND_SAMPLES))for(const file of files){
  assert.equal(existsSync(new URL('../'+file,import.meta.url)),true,file);
 }
});
test('sample engine uses recorded files, throttles events, respects volume and cleans up',()=>{
 const clips=[];let at=0;
 class FakeAudio{
  constructor(src){this.src=src;this.preload='';this.paused=true;this.playbackRate=1;this.volume=1;this.currentTime=0;clips.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  load(){}
  removeAttribute(){}
 }
 const s=createSampleSfx({AudioClass:FakeAudio,storage:getStorage(),now:()=>at,coarse:()=>true,random:()=>0});
 assert.equal(s.play('swing-sword'),false);
 s.setEnabled(true);
 assert.equal(s.play('swing-sword'),true);
 assert.ok(clips[0].src.endsWith('/sword1.mp3'));
 assert.equal(clips[0].volume,.068);
 assert.equal(s.activeCount,1);
 assert.equal(s.play('swing-sword'),false);
 at+=80;assert.equal(s.play('swing-sword'),true);assert.equal(s.activeCount,2);
 clips[0].onended?.();assert.equal(s.activeCount,1);
 s.setEnabled(false);assert.equal(s.activeCount,0);
 assert.ok(clips.every(c=>c.paused));
 s.dispose();assert.equal(s.play('swing-sword'),false);
});
test('missing sample playback capability fails silently and leaves synth fallback possible',()=>{
 const s=createSampleSfx({AudioClass:null,coarse:()=>false,random:()=>0});
 s.setEnabled(true);assert.equal(s.play('swing-sword'),false);
 assert.equal(s.play('nonsense'),false);
 s.dispose();
});
