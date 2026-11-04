import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_CUE_FILES,createBossCues} from '../src/boss-cues.mjs';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

class Clip{
 static made=[];
 constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=0;this.plays=0;Clip.made.push(this);}
 play(){this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(){} load(){}
}
test('recorded boss cue files are uploaded and mapped by event',()=>{
 assert.deepEqual(BOSS_CUE_FILES,{start:'bossstart.mp3',die:'bossdie.mp3'});
 for(const file of Object.values(BOSS_CUE_FILES))assert.ok(existsSync(fileURLToPath(new URL('../assets/sfx/'+file,import.meta.url))),file);
});
test('boss intro and death cues use effect volumes and stop a previous cue',()=>{
 Clip.made=[];const storage={getItem:key=>key==='oibung.audio.master'?'0.8':key==='oibung.audio.effects'?'0.5':null};
 const cues=createBossCues({AudioClass:Clip,storage});
 assert.equal(cues.play('start'),true);assert.equal(Clip.made.length,1);
 assert.match(Clip.made[0].src,/\/assets\/sfx\/bossstart\.mp3$/);
 assert.equal(Clip.made[0].volume,.34*.8*.5);
 assert.equal(cues.play('die'),true);assert.equal(Clip.made[0].paused,true);
 assert.match(Clip.made[1].src,/\/assets\/sfx\/bossdie\.mp3$/);
 assert.equal(Clip.made[1].volume,.48*.8*.5);
 cues.stop('die');assert.equal(Clip.made[1].paused,true);
 cues.dispose();assert.equal(cues.play('start'),false);
});
test('muted cues and unavailable audio cannot break combat',()=>{
 const storage={getItem:key=>key==='oibung-muted'?'1':null};
 const muted=createBossCues({AudioClass:Clip,storage});
 assert.equal(muted.play('start'),false);
 assert.equal(muted.play('die'),false);
 muted.dispose();
 const absent=createBossCues({AudioClass:null});
 assert.equal(absent.play('die'),false);
 absent.dispose();
});
test('boss victory and intro are connected at the shared event sites',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.match(read('src/boss-intro.mjs'),/playedNameCue=true;playBossCue\('start'\)/);
 for(const path of ['src/arena.mjs','src/clown-battle.mjs','src/dice-battle.mjs','src/blood-battle.mjs']){
  assert.match(read(path),/playBossCue\('die'\)/,path);
 }
});
test('all four player-damage event sites feed the recorded hit feedback',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 for(const path of ['src/arena.mjs','src/clown-battle.mjs','src/dice-battle.mjs','src/blood-battle.mjs']){
  assert.match(read(path),/damageFeedback\.hit\(/,path);
 }
 assert.ok(existsSync(fileURLToPath(new URL('../assets/sfx/hit.mp3',import.meta.url))));
 assert.match(read('src/player-hit-feedback.mjs'),/clips\.length<3/);
});
