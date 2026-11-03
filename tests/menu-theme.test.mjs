import test from 'node:test';
import assert from 'node:assert/strict';
import {MENU_THEME_URL,createMenuTheme} from '../src/menu-theme.mjs';

function setup(){
 let time=0,created=0,paused=0,played=0,cleared=0;
 const intervals=new Set(),media=[];
 class Audio{
  constructor(src){created++;this.src=src;this.volume=1;this.paused=true;this.loop=false;this.preload='none';media.push(this);}
  play(){played++;this.paused=false;return Promise.resolve();}
  pause(){paused++;this.paused=true;}
  removeAttribute(){}
  load(){}
 }
 const fallback={unlocks:0,updates:[],disposes:0,unlock(){this.unlocks++;},update(...args){this.updates.push(args);},dispose(){this.disposes++;}};
 const win={Audio,performance:{now:()=>time},setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);cleared++;}};
 const makeFallback=()=>fallback;
 return {win,media,fallback,makeFallback,advance(ms){time+=ms;for(const tick of [...intervals])tick();},get counts(){return {created,paused,played,cleared,timers:intervals.size}}};
}

test('uploaded MP3 is the exact filename for the menu theme',()=>{
 assert.match(MENU_THEME_URL,/\/assets\/music\/maintheme\.mp3$/);
});

test('MP3 waits for a gesture, plays once, fades and resumes from its position',async()=>{
 const s=setup(),player=createMenuTheme(s.win,{makeFallback:s.makeFallback,fadeMs:300});
 player.update(true,.6);
 assert.equal(s.counts.created,0);
 player.unlock();
 await Promise.resolve(); // HTMLMediaElement.play resolves asynchronously.
 assert.equal(s.counts.created,1);
 assert.equal(s.media[0].src,MENU_THEME_URL);
 assert.equal(s.media[0].loop,true);
 assert.equal(s.media[0].preload,'auto');
 assert.equal(s.counts.played,1);
 player.update(true,.6);
 s.advance(150);
 assert.ok(s.media[0].volume>.29&&s.media[0].volume<.31);
 player.update(true,.6);
 assert.equal(s.counts.played,1);
 s.advance(150);
 assert.equal(s.media[0].volume,.6);
 player.update(false,.6);
 s.advance(150);
 assert.ok(s.media[0].volume>.29&&s.media[0].volume<.31);
 s.advance(150);
 assert.equal(s.media[0].paused,true);
 player.update(true,.4);
 assert.equal(s.counts.created,1);
 assert.equal(s.counts.played,2);
 s.advance(300);
 assert.equal(s.media[0].volume,.4);
 assert.equal(s.fallback.unlocks,0);
 await player.dispose();
 assert.equal(s.media[0].paused,true);
 assert.equal(s.counts.timers,0);
 assert.equal(s.fallback.disposes,1);
 player.unlock();
 player.update(true,1);
 assert.equal(s.counts.created,1);
});

test('mute or window blur pauses immediately, then recovers',async()=>{
 const s=setup(),p=createMenuTheme(s.win,{makeFallback:s.makeFallback});
 p.update(true,.8);p.unlock();await Promise.resolve();p.update(true,.8);s.advance(300);
 assert.equal(s.media[0].volume,.8);
 p.update(false,.8,{immediateStop:true});
 assert.equal(s.media[0].volume,0);
 assert.equal(s.media[0].paused,true);
 p.update(true,.5);s.advance(300);
 assert.equal(s.media[0].volume,.5);
 assert.equal(s.counts.played,2);
 await p.dispose();
});

test('a failed MP3 uses the original synthesized menu theme as fallback',async()=>{
 const s=setup(),p=createMenuTheme(s.win,{makeFallback:s.makeFallback});
 p.update(true,.45);p.unlock();p.update(true,.45);
 s.media[0].onerror?.(new Error('404'));
 assert.equal(p.usingFallback,true);
 assert.equal(s.fallback.unlocks,1);
 assert.deepEqual(s.fallback.updates.at(-1),[true,.45]);
 p.update(false,.45);
 assert.deepEqual(s.fallback.updates.at(-1),[false,.45]);
 await p.dispose();
});

test('unsupported Audio falls back without constructing any media element',async()=>{
 const s=setup();
 const p=createMenuTheme({...s.win,Audio:undefined},{makeFallback:s.makeFallback});
 p.update(true,.65);p.unlock();
 assert.equal(p.usingFallback,true);
 assert.equal(s.counts.created,0);
 assert.deepEqual(s.fallback.updates.at(-1),[true,.65]);
 await p.dispose();
});
