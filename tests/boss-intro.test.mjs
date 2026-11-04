import test from 'node:test';
import assert from 'node:assert/strict';
import {INTRO_CARDS,INTRO_DURATION,INTRO_DURATION_REDUCED,introDuration,introFrame} from '../src/boss-intro-data.mjs';
import {playBossIntro} from '../src/boss-intro.mjs';

test('there is one card per boss with distinct names and accents',()=>{
 assert.deepEqual(Object.keys(INTRO_CARDS),['kwon','clown','dice','blood']);
 assert.equal(new Set(Object.values(INTRO_CARDS).map(c=>c.name)).size,4);
 assert.equal(new Set(Object.values(INTRO_CARDS).map(c=>c.accent)).size,4);
 assert.equal(INTRO_CARDS.dice.name,'거대 주사위 박성원');
 assert.ok(Object.isFrozen(INTRO_CARDS)&&Object.isFrozen(INTRO_CARDS.kwon));
});

test('the timeline stays in range, ends on time, and is shorter with reduced motion',()=>{
 assert.equal(introDuration(false),INTRO_DURATION);assert.equal(introDuration(true),INTRO_DURATION_REDUCED);assert.ok(INTRO_DURATION_REDUCED<INTRO_DURATION);
 for(const reduced of [false,true])for(let t=0;t<=introDuration(reduced);t+=.01){
  const f=introFrame(t,reduced);
  for(const k of ['bars','veil','epithet','name','spacing','line'])assert.ok(Number.isFinite(f[k])&&f[k]>=0&&f[k]<=1,k+' at '+t);
  if(reduced)assert.equal(f.spacing,0);
 }
 assert.equal(introFrame(INTRO_DURATION).done,true);
 assert.equal(introFrame(INTRO_DURATION_REDUCED,true).done,true);
 assert.equal(introFrame(0).done,false);
 for(const bad of [NaN,-5,undefined,Infinity])assert.doesNotThrow(()=>introFrame(bad));
});

test('the pieces appear in order and everything leaves before the end',()=>{
 const f=t=>introFrame(t);
 assert.ok(f(.3).bars>0&&f(.3).name===0);
 assert.ok(f(.8).epithet>0&&f(.8).name===0);
 assert.ok(f(1.4).name>0&&f(1.4).line===0);
 assert.ok(f(2.4).line>.9&&f(2.4).name>.9);
 assert.ok(f(3.35).name<.1&&f(3.35).bars<.1&&f(3.35).line<.1);
 assert.ok(f(1).spacing>f(2).spacing);
});

function makeEl(){return {style:{},children:[],attrs:{},isConnected:true,appendChild(c){this.children.push(c);c.parent=this;return c;},setAttribute(k,v){this.attrs[k]=v;},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.isConnected=false;},focus(){this.focused=true;}};}
function rig(hidden=false){
 let time=0;const queue=[],doc={hidden,createElement:makeEl},arena=makeEl();
 return {doc,arena,options:{raf:cb=>{queue.push(cb);return queue.length;},caf(){},now:()=>time},step(ms){time+=ms;const cb=queue.shift();if(cb)cb();},get queued(){return queue.length;}};
}

test('an unknown boss resolves immediately without drawing anything',async()=>{
 const r=rig(),view=playBossIntro(r.doc,r.arena,'nobody',r.options);
 assert.equal(await view.finished,false);assert.equal(r.arena.children.length,0);
});

test('the cutscene draws once, runs for its duration, then removes itself',async()=>{
 const r=rig(),view=playBossIntro(r.doc,r.arena,'kwon',r.options);
 assert.equal(r.arena.children.length,1);
 const overlay=r.arena.children[0];
 assert.equal(overlay.children.at(-1).focused,true);
 let elapsed=0;
 while(r.arena.children.length&&elapsed<6000){r.step(50);elapsed+=50;}
 assert.equal(await view.finished,true);
 assert.equal(r.arena.children.length,0);
 assert.ok(elapsed>=INTRO_DURATION*1000-100&&elapsed<=INTRO_DURATION*1000+300,'ran '+elapsed+'ms');
});

test('the skip button and the skip method end it at once',async()=>{
 const a=rig(),va=playBossIntro(a.doc,a.arena,'clown',a.options);
 a.arena.children[0].children.at(-1).onclick();
 assert.equal(await va.finished,true);assert.equal(a.arena.children.length,0);
 const b=rig(),vb=playBossIntro(b.doc,b.arena,'dice',b.options);
 vb.skip();vb.skip();
 assert.equal(await vb.finished,true);assert.equal(b.arena.children.length,0);
});

test('a hidden tab freezes the clock and resumes afterwards',async()=>{
 const r=rig(true),view=playBossIntro(r.doc,r.arena,'kwon',r.options);
 for(let i=0;i<100;i++)r.step(100);
 assert.equal(r.arena.children.length,1);
 r.doc.hidden=false;
 let elapsed=0;while(r.arena.children.length&&elapsed<6000){r.step(50);elapsed+=50;}
 assert.equal(await view.finished,true);assert.ok(elapsed>=INTRO_DURATION*1000-100);
});

test('removing the arena ends the cutscene without resuming a stale fight',async()=>{
 const r=rig(),view=playBossIntro(r.doc,r.arena,'kwon',r.options);
 r.arena.isConnected=false;r.step(50);
 assert.equal(await view.finished,false);
});

test('reduced motion uses opacity instead of sliding bars',async()=>{
 const r=rig(),view=playBossIntro(r.doc,r.arena,'kwon',{...r.options,reduced:true}),top=r.arena.children[0].children[1];
 r.step(300);assert.equal(top.style.transform,'none');assert.ok(Number(top.style.opacity)>=0);
 let elapsed=0;while(r.arena.children.length&&elapsed<4000){r.step(50);elapsed+=50;}
 assert.equal(await view.finished,true);assert.ok(elapsed<=INTRO_DURATION_REDUCED*1000+300);
});
