import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,swordPose,swordSegment,rolling,PATTERNS,ORDER,TEMPO,SWORD} from '../src/combat.mjs';
const tick=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)step(g,1/120,input);};
const place=(g,x,z)=>{g.player.x=x;g.player.z=z;};
const setBoss=(g,pattern,state,t)=>{g.boss.pattern=pattern;g.boss.state=state;g.boss.t=t;};
const NEW=['rise','jab','rush','retreat','wave'];
test('the boss now has a dozen attacks, all scheduled',()=>{
  assert.ok(Object.keys(PATTERNS).length>=12);
  for(const k of NEW)assert.ok(PATTERNS[k]&&PATTERNS[k].name,k);
  for(const ph of [1,2])for(const k of ORDER[ph])assert.ok(PATTERNS[k],'unknown '+k);
  for(const k of Object.keys(PATTERNS))assert.ok(ORDER[2].includes(k),k+' never used in phase 2');
  assert.ok(ORDER[1].length>=9&&ORDER[2].length>=12);
  assert.ok(!ORDER[1].includes('whirl')&&!ORDER[1].includes('cross')&&!ORDER[1].includes('retreat'));
});
test('wind-ups and recoveries are much faster than before',()=>{
  assert.ok(TEMPO>=1.3);
  const g=createGame();place(g,20,-4);startPattern(g,'sweep');
  let t=0;while(g.boss.state==='windup'&&t<5){step(g,1/240);t+=1/240;}
  assert.ok(Math.abs(t-PATTERNS.sweep.wind/TEMPO)<.02,'windup took '+t);
  assert.ok(t<PATTERNS.sweep.wind*.8);
});
test('the sword is fully raised exactly when the strike begins (no snap)',()=>{
  for(const [name,expected] of [['slam',-1.12],['leap',-1.0],['wave',-.6]]){
    const g=createGame();place(g,20,-4);startPattern(g,name);
    let prev=null;
    while(g.boss.state==='windup'){prev=swordPose(g.boss);step(g,1/240);}
    assert.ok(Math.abs(prev.pitch-expected)<.15,name+' last windup pitch '+prev.pitch+' vs '+expected);
  }
});
test('the pause between attacks is short, and shorter in phase 2',()=>{
  for(const [phase,wait] of [[1,.35],[2,.18]]){
    const name=phase===1?'sweep':'cross';
    const g=createGame();g.boss.phase=phase;place(g,20,-4);startPattern(g,name);
    let guard=0;while(!(g.boss.state==='idle'&&g.boss.pattern===name)&&guard++<120*8)step(g,1/120);
    assert.ok(Math.abs(g.boss.wait-wait)<.02,'phase '+phase+' wait '+g.boss.wait);
  }
});
test('rise (rising slash): sweeps from the ground up and hurts once for 30',()=>{
  const g=createGame();setBoss(g,'rise','active',0);
  const lo=swordPose(g.boss).pitch;setBoss(g,'rise','active',PATTERNS.rise.active);const hi=swordPose(g.boss).pitch;
  assert.ok(lo>.7&&hi<-.7,'pitch '+lo+' -> '+hi);
  const h=createGame();startPattern(h,'rise');setBoss(h,'rise','active',PATTERNS.rise.active*.2);
  const {a,b}=swordSegment(h.boss);h.player.x=(a.x+b.x)/2;h.player.z=(a.z+b.z)/2;step(h,1/120);
  assert.equal(h.player.hp,120-PATTERNS.rise.damage);
  for(let i=0;i<6;i++){h.player.invuln=0;step(h,1/120);}
  assert.equal(h.player.hp,120-PATTERNS.rise.damage);
});
test('jab fires a rapid chain of exactly three thrusts, then stops',()=>{
  const g=createGame();place(g,0,2);
  g.boss.wait=0;g.boss.sequence=ORDER[1].indexOf('jab');step(g,1/120);
  assert.equal(g.boss.pattern,'jab');assert.equal(g.boss.chain,2);
  let guard=0;
  while(guard++<120*8){
    step(g,1/120);
    if(g.boss.state==='idle'&&g.boss.pattern==='jab')break;
  }
  const jabs=g.events.filter(e=>e.type==='telegraph'&&e.name===PATTERNS.jab.name).length;
  assert.equal(jabs,3);assert.equal(g.boss.chain,0);
});
test('each jab hurts for 16 and the whole chain is fast',()=>{
  const g=createGame();startPattern(g,'jab');setBoss(g,'jab','active',PATTERNS.jab.active*.8);
  const {b}=swordSegment(g.boss);g.player.x=b.x;g.player.z=b.z;step(g,1/120);
  assert.equal(g.player.hp,120-PATTERNS.jab.damage);
  const one=(PATTERNS.jab.wind+PATTERNS.jab.recover)/TEMPO+PATTERNS.jab.active;
  assert.ok(one*3<2.2,'three jabs take '+one*3);
});
test('rush dashes forward and cuts across in one pass for 32',()=>{
  const g=createGame();place(g,0,2);startPattern(g,'rush');
  const z0=g.boss.z;
  tick(g,PATTERNS.rush.wind/TEMPO+PATTERNS.rush.active+.05);
  assert.equal(g.player.hp,120-PATTERNS.rush.damage);
  assert.ok(g.boss.z-z0>2,'dash distance '+(g.boss.z-z0));
});
test('retreat steps back, deals nothing, then follows up with a rising slash',()=>{
  const g=createGame();g.boss.phase=1;place(g,0,2);startPattern(g,'retreat');
  const z0=g.boss.z;let seen=[];
  for(let i=0;i<120*3;i++){
    step(g,1/120);
    if(!seen.length||seen[seen.length-1]!==g.boss.pattern)seen.push(g.boss.pattern);
    if(g.boss.pattern==='retreat'&&g.boss.state==='active')assert.equal(g.player.hp,120,'retreat must not hurt');
  }
  assert.deepEqual(seen.slice(0,2),['retreat','rise']);
  const quiet=createGame();place(quiet,0,2);startPattern(quiet,'retreat');tick(quiet,PATTERNS.retreat.wind/TEMPO+PATTERNS.retreat.active);
  assert.ok(!quiet.events.some(e=>e.type==='player-hit'),'retreat must not register a hit at all');
  assert.equal(quiet.player.action,null);assert.equal(quiet.player.invuln,0);
  const h=createGame();place(h,0,2);startPattern(h,'retreat');tick(h,PATTERNS.retreat.wind/TEMPO+PATTERNS.retreat.active);
  assert.ok(h.boss.z<z0-1.5,'retreated '+(h.boss.z-z0));
});
test('wave launches a sword beam that travels, hurts once, and can be rolled through',()=>{
  const g=createGame();assert.deepEqual(g.bossShots,[]);
  place(g,0,12);startPattern(g,'wave');
  tick(g,PATTERNS.wave.wind/TEMPO+.02);
  assert.equal(g.bossShots.length,1);
  assert.ok(g.events.some(e=>e.type==='boss-shot'));
  const z1=g.bossShots[0].z;tick(g,.2);
  assert.ok(g.bossShots[0].z-z1>2.5,'beam speed');
  tick(g,1.0);
  assert.equal(g.player.hp,120-PATTERNS.wave.damage);
  assert.equal(g.bossShots.length,0,'beam is consumed on hit');
  const side=createGame();place(side,0,12);startPattern(side,'wave');tick(side,PATTERNS.wave.wind/TEMPO+.02);
  place(side,6,12);tick(side,1.0);
  assert.equal(side.player.hp,120,'stepping aside after the beam is fired avoids it');
  const dodge=createGame();place(dodge,0,12);startPattern(dodge,'wave');
  tick(dodge,PATTERNS.wave.wind/TEMPO+.02);
  while(dodge.bossShots.length&&Math.hypot(dodge.bossShots[0].x-dodge.player.x,dodge.bossShots[0].z-dodge.player.z)>2.2)step(dodge,1/120);
  dodge.player.action={kind:'roll',t:.2,total:.52,yaw:Math.PI};
  assert.ok(rolling(dodge.player));
  tick(dodge,.2);
  assert.equal(dodge.player.hp,120);assert.equal(dodge.stats.dodges,1);
});
test('the beam disappears at the edge of the arena',()=>{
  const g=createGame();g.bossShots.push({id:99,x:0,z:26.5,yaw:0,speed:15,life:5,damage:24});
  step(g,1/120);assert.equal(g.bossShots.length,0);
});
test('rush chains into a reverse cut only in phase 2',()=>{
  for(const [phase,chained] of [[1,false],[2,true]]){
    const g=createGame();g.boss.phase=phase;place(g,20,-4);startPattern(g,'rush');
    const seen=[];for(let i=0;i<120*4;i++){step(g,1/120);if(!seen.length||seen[seen.length-1]!==g.boss.pattern)seen.push(g.boss.pattern);}
    assert.equal(seen[1]==='reverse',chained,'phase '+phase+' '+seen.join('>'));
  }
});
test('far away, the boss closes in with a beam or a dash instead of idling',()=>{
  const picks=new Set();
  for(let seq=0;seq<2;seq++){
    const g=createGame();place(g,0,18);g.boss.wait=0;g.boss.sequence=seq;step(g,1/120);picks.add(g.boss.pattern);
  }
  assert.deepEqual([...picks].sort(),['rush','wave']);
});
test('every new pattern keeps a finite pose through its whole life',()=>{
  const g=createGame();
  for(const name of NEW)for(const state of ['windup','active','recovery'])for(let t=0;t<=2;t+=.1){
    setBoss(g,name,state,t);g.boss.speed=TEMPO;
    const p=swordPose(g.boss);for(const v of Object.values(p))assert.ok(Number.isFinite(v),name+state+t);
    const {a,b}=swordSegment(g.boss);assert.ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)-SWORD.length)<1e-6);
  }
});
