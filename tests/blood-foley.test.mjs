import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {BLOOD_FOLEY,BLOOD_ATTACK_SOUNDS,bloodFoleySpec} from '../src/blood-foley.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BOSS_FOLEY_PRELOAD,bossFoleySpec} from '../src/boss-foley-map.mjs';
import {createBossSfx} from '../src/boss-sfx.mjs';

const game=(pattern='wave',state='pattern')=>({
 bossId:'blood',status:'playing',boss:{phase:BLOOD_PATTERNS[pattern].phase,state},
 blood:{pattern}
});

test('all seven uploaded blood recordings, including tsunami.mp3, are preloaded for the blood boss',()=>{
 const files=Object.values(BLOOD_FOLEY);
 assert.equal(files.length,7);
 assert.equal(new Set(files).size,6);
 assert.deepEqual(files.map(f=>f.slice('assets/sfx/'.length)).sort(),[
  'bloodhit.mp3','bloodhit2.mp3','bloodhit3.mp3','bloodhit4.mp3','bloodhit5.mp3','bloodsplash.mp3','tsunami.mp3'
 ].sort());
 for(const file of files){
  assert.ok(file.startsWith('assets/sfx/'));
  assert.ok(statSync(new URL('../'+file,import.meta.url)).size>1000,file);
  assert.ok(BOSS_FOLEY_PRELOAD.blood.includes(file),file);
 }
});

test('all fourteen phase-specific blood spells map to uploaded strike or splash recordings',()=>{
 assert.deepEqual(Object.keys(BLOOD_ATTACK_SOUNDS).sort(),Object.keys(BLOOD_PATTERNS).sort());
 assert.deepEqual(new Set(Object.values(BLOOD_ATTACK_SOUNDS)),new Set(Object.keys(BLOOD_FOLEY).filter(x=>x!=='tsunami')));
 for(const id of Object.keys(BLOOD_PATTERNS)){
  const g=game(id),spec=bossFoleySpec({type:'blood-impact',pattern:id},g);
  assert.equal(spec.file,BLOOD_FOLEY[BLOOD_ATTACK_SOUNDS[id]],id);
  assert.ok(spec.volume>=.1&&spec.volume<=.35,id);
  assert.ok(spec.duration>=.4&&spec.duration<=1.3,id);
  assert.ok(spec.fade>0&&spec.fade<spec.duration,id);
  assert.ok(spec.minGap>=.15,id);
  assert.equal(spec.natural,true,id);
 }
});

test('wet charges and genuine wet player hits sound different from melee attacks',()=>{
 for(const id of ['wave','fountain','vortex','rain','tide']){
  const g=game(id);
  assert.equal(bloodFoleySpec({type:'blood-warning',pattern:id},g)?.file,BLOOD_FOLEY.splash);
  assert.equal(bloodFoleySpec({type:'hurt',amount:20},g)?.file,BLOOD_FOLEY.hit);
 }
 for(const id of ['burst','dive','wing','pulse','pursuit','chain']){
  const g=game(id);
  assert.equal(bloodFoleySpec({type:'hurt',amount:20},g),null);
 }
 assert.equal(bloodFoleySpec({type:'hurt',amount:0},game()),null);
 for(const event of ['boss-hit','swing','shot','victory','phase']){
  assert.equal(bloodFoleySpec({type:event},game()),null,event);
 }
 assert.equal(bloodFoleySpec({type:'blood-impact'},game('tide','transition')),null);
});

test('recorded blood attacks retain natural pitch, are capped, and clear on pause',async()=>{
 let now=0;
 const clips=[];
 const s=createBossSfx({
  now:()=>now,random:()=>1,muted:()=>false,
  schedule:()=>1,cancel:()=>{},
  makeAudio:url=>{
   const a={url,readyState:4,duration:4,volume:0,playbackRate:0,
    currentTime:0,ended:false,plays:0,paused:true,error:null,
    load(){},pause(){this.paused=true;},play(){this.paused=false;this.plays++;return Promise.resolve();}};
   clips.push(a);return a;
  }
 });
 const g=game('dive');
 assert.equal(s.event({type:'blood-impact',pattern:'dive'},g),true);
 await Promise.resolve();
 const a=clips.find(c=>c.plays>0);
 assert.ok(a?.url.endsWith('/bloodhit5.mp3'));
 assert.equal(a.playbackRate,1);
 assert.equal(s.activeCount,1);
 assert.equal(s.event({type:'blood-impact',pattern:'dive'},g),false,'same-tick spam should be ignored');
 s.update(0,g);
 assert.equal(s.activeCount,0);
 assert.equal(a.paused,true);
 s.dispose();
});

test('horizon tsunami uses uploaded natural-disaster clip, but not during other patterns or the transformation',()=>{
 const g=game('requiem'),ev={type:'blood-tsunami-approach',pattern:'requiem'};
 const sound=bossFoleySpec(ev,g);
 assert.equal(sound.file,BLOOD_FOLEY.tsunami);
 assert.equal(sound.rate,1);
 assert.equal(sound.natural,true);
 assert.ok(sound.duration>=6&&sound.minGap>sound.duration);
 assert.ok(sound.volume>.3&&sound.volume<.6);
 assert.equal(bloodFoleySpec(ev,game('tide')),null);
 assert.equal(bloodFoleySpec(ev,game('requiem','transition')),null);
 assert.equal(bloodFoleySpec({type:'blood-warning',pattern:'requiem'},g).file,BLOOD_FOLEY.splash);
 assert.equal(bloodFoleySpec({type:'blood-impact',pattern:'requiem'},g).file,BLOOD_FOLEY.splash);
});

test('the real approaching tsunami emits exactly one SFX event per cast, never one per hazard flank',()=>{
 const g=createBloodGame('sword',{seed:97});
 g.boss.phase=2;g.player.maxHp=g.player.hp=1e8;
 assert.ok(startBloodPattern(g,'requiem'));
 let sounds=0;let near=false;
 for(let i=0;i<280;i++){
  stepBlood(g,.05);
  const waveEvents=g.events.filter(e=>e.type==='blood-tsunami-approach');
  sounds+=waveEvents.length;
  if(waveEvents.length){near=true;assert.equal(waveEvents[0].pattern,'requiem');}
  g.events.length=0;
 }
 assert.equal(sounds,1,'the same recording should not restart for each crest, hit or wave flank');
 assert.ok(near,'the massive wave must approach close enough to hear');
});
