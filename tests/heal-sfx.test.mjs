import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createSampleSfx,PLAYER_CLIP_ENVELOPES,SOUND_SAMPLES} from '../src/sample-sfx.mjs';
import {createGame,act} from '../src/combat.mjs';
import {completePlayerHeal} from '../src/player-tick.mjs';

test('all three boss screens start recovery sound from heal-start, not a late healed event',()=>{
 for(const file of ['arena.mjs','clown-battle.mjs','dice-battle.mjs']){
  const src=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.ok(src.includes('heal-start'),file+' lacks heal-start handler');
  if(file==='arena.mjs')assert.match(src,/case 'heal-start':audio\.play\('healed'\)/);
  if(file==='clown-battle.mjs')assert.match(src,/'heal-start':'healed'/);
  if(file==='dice-battle.mjs')assert.match(src,/e\.type==='heal-start'\?'healed'/);
 }
});
test('potion emits one immediate heal-start and a later completion event',()=>{
 const g=createGame('sword',{register:false});
 g.startGrace=0;g.player.hp=35;
 assert.equal(act(g,'heal'),true);
 assert.equal(g.events.filter(e=>e.type==='heal-start').length,1);
 const action=g.player.action;
 assert.equal(completePlayerHeal(g,action),false);
 action.t=.79;
 assert.equal(completePlayerHeal(g,action),true);
 assert.equal(completePlayerHeal(g,action),false);
 assert.equal(g.events.filter(e=>e.type==='healed').length,1);
});
test('heal source exists and has an audible gain envelope above generic attack samples',()=>{
 assert.ok(SOUND_SAMPLES.healed.includes('assets/sfx/heal.mp3'));
 assert.ok(existsSync(new URL('../assets/sfx/heal.mp3',import.meta.url)));
 assert.ok(PLAYER_CLIP_ENVELOPES.healed.gain>1);
 assert.ok(PLAYER_CLIP_ENVELOPES.healed.seconds>=2);
 assert.ok(PLAYER_CLIP_ENVELOPES['skill-heal'].gain>=1);
});
test('heal sample plays and a rejected playback triggers one optional fallback',async()=>{
 let failed=0;
 class DeniedAudio{
  constructor(src){this.src=src;this.volume=1;this.currentTime=0;}
  play(){return Promise.reject(new Error('blocked playback'));}
  pause(){}
  load(){}
  removeAttribute(){}
 }
 const player=createSampleSfx({AudioClass:DeniedAudio,schedule:()=>1,cancel:()=>{},random:()=>0});
 player.setEnabled(true);
 assert.equal(player.play('healed',{onFailure:()=>failed++}),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(failed,1);
 assert.equal(player.activeCount,0);
 player.dispose();
});
test('successful playback never triggers emergency synthesized fallback',async()=>{
 let failed=0;const played=[];
 class SupportedAudio{
  constructor(src){this.src=src;this.currentTime=0;this.volume=1;played.push(this);}
  play(){return Promise.resolve();}
  pause(){}
  load(){}
  removeAttribute(){}
 }
 const s=createSampleSfx({AudioClass:SupportedAudio,schedule:()=>1,cancel:()=>{},random:()=>0});
 s.setEnabled(true);
 assert.equal(s.play('healed',{onFailure:()=>failed++}),true);
 await Promise.resolve();
 assert.equal(failed,0);
 assert.ok(played[0].volume>.34);
 s.dispose();
});
