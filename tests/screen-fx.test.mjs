import test from 'node:test';
import assert from 'node:assert/strict';
import {LOW_START,LOW_FULL,HEAL_MIN,HEAL_TIME,hpRatio,lowHealthLevel,heartbeat,healGain,healFade} from '../src/screen-fx-data.mjs';
import {installScreenFx} from '../src/screen-fx.mjs';

test('low health effect starts below the threshold and peaks near death',()=>{
 assert.equal(lowHealthLevel(1),0);assert.equal(lowHealthLevel(LOW_START),0);assert.equal(lowHealthLevel(LOW_FULL),1);assert.equal(lowHealthLevel(0),1);
 assert.ok(Math.abs(lowHealthLevel((LOW_START+LOW_FULL)/2)-.5)<1e-9);
 for(const bad of [NaN,undefined,Infinity,-3])assert.ok(lowHealthLevel(bad)>=0&&lowHealthLevel(bad)<=1);
 assert.equal(lowHealthLevel(NaN),0);
 assert.equal(hpRatio(60,120),.5);assert.equal(hpRatio(5,0),1);assert.equal(hpRatio(NaN,120),1);assert.equal(hpRatio(500,120),1);
});

test('the heartbeat is silent when healthy and speeds up as health falls',()=>{
 assert.equal(heartbeat(1.234,0),0);
 const peaks=level=>{let n=0,rising=false;for(let t=0;t<10;t+=.005){const v=heartbeat(t,level);if(v>.95&&!rising){n++;rising=true;}if(v<.5)rising=false;}return n;};
 for(let t=0;t<5;t+=.01)for(const level of [.2,1]){const v=heartbeat(t,level);assert.ok(v>=.3-1e-9&&v<=1+1e-9);}
 assert.ok(peaks(1)>peaks(.2));
 assert.doesNotThrow(()=>heartbeat(NaN,1));
});

test('only a large jump counts as healing and a revival does not',()=>{
 assert.equal(healGain(50,50+HEAL_MIN,120),true);
 assert.equal(healGain(50,50+HEAL_MIN-1,120),false);
 assert.equal(healGain(50,115,120),true);
 assert.equal(healGain(0,120,120),false);
 assert.equal(healGain(NaN,100,120),false);
 assert.equal(healGain(50,30,120),false);
});

test('the heal glow fades out within its time',()=>{
 assert.equal(healFade(1000,1000),1);
 assert.ok(healFade(1000,1000+HEAL_TIME*500)>0&&healFade(1000,1000+HEAL_TIME*500)<1);
 assert.equal(healFade(1000,1000+HEAL_TIME*1000),0);
 assert.equal(healFade(1000,500),0);
 assert.equal(healFade(-1e9,1000),0);
});

function rig(){
 let time=0,hp='120';const queue=[];
 const vig={dataset:{},style:{props:{},setProperty(k,v){this.props[k]=v;},removeProperty(k){delete this.props[k];}}};
 const arena={style:{touched:false}};
 const hpEl={get textContent(){return hp;},parentElement:{querySelector:()=>({getAttribute:()=>'120'})}};
 const map={'hp-value':hpEl,vignette:vig,arena};
 const doc={hidden:false,documentElement:{dataset:{}},getElementById:id=>map[id]};
 const win={};
 return {doc,win,vig,arena,set hp(v){hp=String(v);},step(ms=16){time+=ms;const cb=queue.shift();if(cb)cb();},options:{raf:cb=>{queue.push(cb);},now:()=>time}};
}

test('low health writes the effect values to the vignette only',()=>{
 const r=rig(),fx=installScreenFx(r.doc,r.win,r.options);
 r.step();assert.ok(!('fx' in r.vig.dataset));
 r.hp=30;r.step();
 assert.ok('fx' in r.vig.dataset);
 assert.ok(Number(r.vig.style.props['--lowhp'])>0);
 assert.ok(Number(r.vig.style.props['--beat'])>0);
 assert.equal(r.arena.style.touched,false);
 assert.ok(fx&&typeof fx.dispose==='function');
});

test('recovering above the threshold removes every property',()=>{
 const r=rig();installScreenFx(r.doc,r.win,r.options);
 r.hp=20;r.step();assert.ok('fx' in r.vig.dataset);
 r.hp=25;r.step(2000);
 r.hp=100;r.step(2000);
 assert.ok(!('fx' in r.vig.dataset));
 assert.deepEqual(r.vig.style.props,{});
});

test('a large heal shows the green pulse and a revival from zero does not',()=>{
 const r=rig();installScreenFx(r.doc,r.win,r.options);
 r.hp=50;r.step();
 r.hp=115;r.step(16);
 assert.ok(Number(r.vig.style.props['--heal'])>0.5);
 r.step(1500);
 assert.ok(!('fx' in r.vig.dataset));
 const q=rig();installScreenFx(q.doc,q.win,q.options);
 q.hp=0;q.step();q.hp=120;q.step(16);
 assert.ok(!('fx' in q.vig.dataset)||Number(q.vig.style.props['--heal'])===0);
});

test('a hidden tab pauses it and a second install is refused',()=>{
 const r=rig();installScreenFx(r.doc,r.win,r.options);
 r.doc.hidden=true;r.hp=10;r.step();
 assert.ok(!('fx' in r.vig.dataset));
 r.doc.hidden=false;r.step();
 assert.ok('fx' in r.vig.dataset);
 assert.equal(installScreenFx(r.doc,r.win,r.options),null);
});

test('disposing stops further updates',()=>{
 const r=rig(),fx=installScreenFx(r.doc,r.win,r.options);
 r.step();fx.dispose();r.hp=5;r.step();r.step();
 assert.ok(!('fx' in r.vig.dataset));
});
