import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,statSync} from 'node:fs';
import {bossFoleySpec,BOSS_FOLEY_FILES,BOSS_FOLEY_PRELOAD} from '../src/boss-foley-map.mjs';
import {PLAYER_CLIP_ENVELOPES,SOUND_SAMPLES,createSampleSfx} from '../src/sample-sfx.mjs';
import {createBossSfx} from '../src/boss-sfx.mjs';
const kwon=(pattern='sweep')=>({status:'playing',boss:{phase:1,pattern}});
const clown=()=>({status:'playing',boss:{phase:2},clown:{bombs:[]}});
const dice=()=>({status:'playing',boss:{phase:2},dice:{giant:{}}});
test('all 17 uploaded boss-only sound files exist and player files are excluded',()=>{
 const all=Object.values(BOSS_FOLEY_FILES).flatMap(category=>Object.values(category));
 assert.equal(all.length,17);
 assert.equal(new Set(all).size,17);
 assert.deepEqual([...new Set([...BOSS_FOLEY_PRELOAD.kwon,...BOSS_FOLEY_PRELOAD.clown,...BOSS_FOLEY_PRELOAD.dice])].sort(),all.slice().sort());
 for(const path of all){assert.match(path,/^assets\/sfx\/.*\.mp3$/);assert.ok(statSync(new URL('../'+path,import.meta.url)).size>1000,path);}
 const files=readdirSync(new URL('../assets/sfx/',import.meta.url)).filter(f=>f.endsWith('.mp3'));
 assert.ok(files.length>=19);
 assert.ok(!all.some(file=>file.endsWith('/heal.mp3')||file.endsWith('/dead.mp3')));
 const player=Object.entries(SOUND_SAMPLES).flatMap(([event,files])=>files.filter(f=>f.startsWith('assets/sfx/')).map(f=>({event,file:f})));
 assert.deepEqual(player.map(x=>x.event).sort(),['death','healed','skill-heal']);
 assert.deepEqual([...new Set(player.map(x=>x.file))].sort(),['assets/sfx/dead.mp3','assets/sfx/heal.mp3']);
});
test('every boss-only recording is actually mapped to a boss gameplay event and a bounded envelope',()=>{
 const cues=[
  [kwon(),{type:'telegraph'}],[kwon('thrust'),{type:'telegraph'}],[kwon(),{type:'boss-swing'}],[kwon(),{type:'player-hit',amount:30}],[kwon(),{type:'phase'}],
  ...['clown-juggle','clown-drum','clown-confetti','clown-blast','clown-stomp'].map(type=>[clown(),{type}]),
  ...['dice-warning','dice-roll','dice-charge','dice-jump','dice-pip-warning','dice-pip-burst','dice-impact','dice-stomp','player-crushed','dice-giant-warning','dice-giant-hand-hit','dice-giant-neck-impact','dice-giant-hand-destroyed','dice-giant-feral','dice-possession','dice-possessed'].map(type=>[dice(),{type}])
 ];
 const mapped=new Set();
 for(const [g,event] of cues){
  const spec=bossFoleySpec(event,g);
  assert.ok(spec?.file,event.type);
  assert.ok(spec.volume>0&&spec.volume<=.45,event.type);
  assert.ok(spec.duration>0&&spec.duration<=2.05,event.type);
  assert.ok(spec.fade>=.1&&spec.fade<spec.duration,event.type);
  assert.ok(spec.minGap>0,event.type);
  mapped.add(spec.file);
 }
 assert.equal(mapped.size,17,'some uploaded recordings have no associated boss event');
 assert.equal(bossFoleySpec({type:'healed'},kwon()),null);
 assert.equal(bossFoleySpec({type:'death'},dice()),null);
 assert.equal(bossFoleySpec({type:'player-hit',amount:0},kwon()),null);
});
test('boss foley fades before its capped length and stops during pause',async()=>{
 let time=0;const clips=[];
 const s=createBossSfx({now:()=>time,muted:()=>false,makeAudio:url=>{
  const audio={url,readyState:4,error:null,duration:9,volume:0,playbackRate:1,currentTime:0,ended:false,load(){},pause(){this.paused=true},play(){this.paused=false;return Promise.resolve();}};
  clips.push(audio);return audio;
 }});
 const g=dice();
 assert.equal(s.event({type:'dice-giant-neck-impact'},g),true);
 await Promise.resolve();
 const audio=clips.find(c=>!c.paused&&c.volume>0);
 assert.ok(audio?.url.includes('rock-smash'));
 const before=audio.volume;
 time=1.72;s.update(.016,g);assert.ok(audio.volume<before&&audio.volume>0);
 time=2.1;s.update(.016,g);assert.equal(s.activeCount,0);
 assert.equal(audio.paused,true);
 s.dispose();
});
test('healing and death clips fade at configured lengths without leaving playback running',()=>{
 const clips=[];let time=0,tick=()=>{},stopped=0;
 class FakeAudio {
  constructor(url){this.url=url;this.currentTime=0;this.paused=true;this.volume=1;clips.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}load(){}
 }
 const s=createSampleSfx({AudioClass:FakeAudio,now:()=>time,random:()=>0,coarse:()=>false,schedule:fn=>{tick=fn;return 1;},cancel:()=>{stopped++;}});
 s.setEnabled(true);
 assert.equal(s.play('healed'),true);
 const first=clips.find(v=>!v.paused);assert.ok(first.url.endsWith('/heal.mp3'));const gain=first.volume;
 time=(PLAYER_CLIP_ENVELOPES.healed.seconds-.1)*1000;tick();
 assert.ok(first.volume<gain,'fade-out did not run');
 time=PLAYER_CLIP_ENVELOPES.healed.seconds*1000+30;tick();
 assert.equal(first.paused,true);assert.equal(s.activeCount,0);
 assert.ok(stopped>0);
 assert.equal(s.play('death'),true);
 assert.ok(clips.some(v=>!v.paused&&v.url.endsWith('/dead.mp3')));
 s.dispose();assert.equal(s.activeCount,0);
});
