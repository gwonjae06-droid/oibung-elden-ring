import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Contract tests only: the base combat engine is deliberately replaced, not the show runtime.
const base=`export const PATTERNS={laughBomb:{},clap:{}};
export function hurt(g,n){g.damageCalls=(g.damageCalls||0)+1;return true;}
export function stepClown(g,dt,input){
 if(input.transition){g.boss.state='transition';g.clown.state='transition';g.clown.zones=[];g.clown.bombs=[];g.clown.waves=[];return;}
 if(input.victory){g.status='won';g.clown.state='defeated';g.clown.zones=[];g.clown.bombs=[];return;}
 if(g.hitstop>0){g.hitstop=Math.max(0,g.hitstop-dt);return;}
 g.time+=dt;const c=g.clown;c.stunT=Math.max(0,c.stunT-dt);
 if(c.state==='pattern')g.legacyRuns++;
 if(input.start){c.state='pattern';c.name=input.start;c.pt=0;c.f={};g.events.push({type:'clown-telegraph',name:'old'});}
 c.zones=c.zones.filter(z=>{z.age+=dt;return z.age<z.warn+.28;});
 c.bombs=c.bombs.filter(q=>{q.t+=dt;return q.t<q.warn+.3;});
}`;
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const runtimeUrl=new URL('../src/clown-show-runtime.mjs',import.meta.url);
let source=await readFile(runtimeUrl,'utf8');
source=source.replace(/from '\.\/clown-combat\.mjs'/,()=>`from '${data(base)}'`);
for(const file of ['clown-pressure.mjs','clown-shows.mjs'])source=source.replace(`'./${file}'`,`'${new URL(file,runtimeUrl).href}'`);
const {stepShowClown:step}=await import(data(source));
function game(name='laughBomb',phase=2){return {status:'playing',time:0,hitstop:0,nextId:0,events:[],legacyRuns:0,boss:{x:0,z:0,state:'clown',phase},player:{x:0,z:18},clown:{name,state:'pattern',pt:0,f:{},stunT:0,odo:0,yaw:0,vis:{},waves:[],zones:[],bombs:[]}};}
function advance(g,seconds){for(let left=seconds;left>1e-8;){const h=Math.min(left,1/120);step(g,h,{});left-=h;}}
for(const [name,d] of [['laughBomb',4.8],['clap',6.5],['dash',5.8]])test(name+' exclusively runs replacement and finishes',()=>{const g=game(name);advance(g,d+.03);assert.equal(g.legacyRuns,0);assert.equal(g.clown.state,'idle');assert.equal(g.clown.showKey,null);assert.equal(g.clown.noSeparate,false);});
test('phase-one dash remains a legacy attack',()=>{const g=game('dash',1);step(g,.01,{});assert.equal(g.legacyRuns,1);assert.ok(!g.clown.showKey);});
test('hitstop freezes show clock and does not duplicate warnings',()=>{const g=game();step(g,.01,{});const pt=g.clown.pt,n=g.events.length;g.hitstop=1;advance(g,.2);assert.equal(g.clown.pt,pt);assert.equal(g.events.length,n);assert.equal(g.clown.state,'pattern');});
test('stun freezes show clock',()=>{const g=game();step(g,.01,{});const pt=g.clown.pt;g.clown.stunT=1;advance(g,.2);assert.equal(g.clown.pt,pt);});
test('transition clears show ownership without emitting new attacks',()=>{const g=game();advance(g,.9);step(g,.01,{transition:true});const n=g.events.length;advance(g,.1);assert.equal(g.clown.showKey,null);assert.equal(g.clown.bombs.length,0);assert.equal(g.events.length,n);});
test('victory prevents subsequent show attacks',()=>{const g=game();advance(g,.7);step(g,.01,{victory:true});const n=g.events.length;advance(g,1);assert.equal(g.events.length,n);assert.equal(g.clown.showKey,null);});
test('runtime validates delta time',()=>{const g=game();for(const dt of [0,-1,NaN,Infinity])step(g,dt,{});assert.equal(g.time,0);assert.equal(g.events.length,0);});
test('head attack emits exactly two rolls',()=>{const g=game();advance(g,3.1);assert.equal(g.events.filter(e=>e.type==='clown-roll').length,2);});
test('second dash snapshots a new player position',()=>{const g=game('dash');advance(g,1.8);g.player={x:15,z:0};advance(g,.2);const lane=g.clown.f['show-run-second'];assert.ok(lane);assert.ok(lane.yaw>0);assert.equal(g.events.filter(e=>e.type==='clown-stomp').length,2);});
test('newly selected attack gets its show name',()=>{const g=game();g.clown.state='idle';g.clown.name=null;step(g,.01,{start:'clap'});assert.equal(g.events.find(e=>e.type==='clown-telegraph').name,'박수는 끝까지 치셔야죠');assert.equal(g.legacyRuns,0);});
