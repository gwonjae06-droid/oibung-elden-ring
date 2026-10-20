import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,beginSequence,chooseOpening,CLOSE,PATTERNS,HUG_TIME} from '../src/combat.mjs';
const tick=(g,t,input={})=>{for(let s=0;s<t;s+=1/120)step(g,1/120,input);};
const place=(g,px,pz)=>{g.boss.x=0;g.boss.z=0;g.boss.yaw=0;g.boss.aim=0;g.player.x=px;g.player.z=pz;};
test('close-range pools offer several options in each phase and include the new patterns',()=>{
  assert.ok(CLOSE[1].length>=5&&CLOSE[2].length>=6);
  for(const k of ['stomp','backsweep','shove'])assert.ok(PATTERNS[k]);
  for(const phase of [1,2]){const g=createGame();g.boss.phase=phase;g.boss.x=0;g.boss.z=0;g.player.x=0;g.player.z=3.2;const seen=new Set();for(let i=0;i<60;i++){const k=chooseOpening(g);seen.add(k);g.boss.lastOpening=k;}assert.ok(seen.size>=4,phase+':'+[...seen]);}
});
test('stomp hits anyone within its ground radius and misses those outside',()=>{
  for(const [d,hit] of [[3.2,true],[6.5,true]]){const g=createGame();place(g,d,0);startPattern(g,'stomp');g.boss.state='active';g.boss.t=0;g.boss.hit=false;tick(g,.3);assert.equal(g.player.hp<120,hit,String(d));}
  const far=createGame();place(far,0,-16);startPattern(far,'stomp');far.boss.state='active';far.boss.t=0;far.boss.hit=false;tick(far,.3);assert.equal(far.player.hp,120);
});
test('backsweep turns the boss around and hits behind it, but not in front',()=>{
  const g=createGame();place(g,0,5);startPattern(g,'backsweep');assert.ok(Math.abs(Math.abs(g.boss.yaw)-Math.PI)<1e-9);
  g.player.invuln=0;tick(g,.45);assert.ok(Math.abs(Math.abs(g.boss.yaw)-Math.PI)<1e-6);tick(g,.4);assert.ok(g.player.hp<120);
  const f=createGame();place(f,0,-16);startPattern(f,'backsweep');f.boss.yaw=Math.PI;f.boss.aim=Math.PI;f.boss.state='active';f.boss.t=0;f.boss.hit=false;tick(f,.3);assert.equal(f.player.hp,120);
});
test('shove knocks the player back, but not through a roll',()=>{
  const g=createGame();place(g,0,4);startPattern(g,'shove');g.boss.state='active';g.boss.t=0;g.boss.hit=false;step(g,1/120);assert.ok(g.player.z>8.5);assert.ok(g.player.hp<120);
  const r=createGame();place(r,0,4);r.player.action={kind:'roll',t:.2,total:.52,yaw:0};startPattern(r,'shove');r.boss.state='active';r.boss.t=0;step(r,1/120);assert.equal(r.player.hp,120);
});
test('a player who clings to the boss is forced off with a shove',()=>{
  for(const phase of [1,2]){const g=createGame();g.boss.phase=phase;g.boss.wait=99;place(g,0,3.2);const seen=[];let id=g.boss.attackId;
    for(let i=0;i<120*3;i++){step(g,1/120);if(g.boss.attackId!==id){id=g.boss.attackId;seen.push(g.boss.pattern);}}
    assert.equal(seen[0],'shove',String(phase));assert.ok(g.player.hp<120);}
  assert.ok(HUG_TIME<=1);
});
test('standing still or orbiting the boss at melee range can never be safe',()=>{
  for(const phase of [1,2])for(const offset of [[0,3],[3,0],[0,-3],[-3,0],[2.2,2.2]]){
    const g=createGame();g.boss.phase=phase;place(g,offset[0],offset[1]);g.player.invuln=0;let first=null;
    for(let i=0;i<120*8&&g.status==='playing';i++){step(g,1/120);if(g.player.hp<120&&first===null)first=g.time;if(g.player.hp<=0)break;}
    assert.ok(first!==null&&first<4,phase+' '+offset+' '+first);
  }
  for(const phase of [1,2]){
    const g=createGame();g.boss.phase=phase;place(g,0,3.2);let ang=0,first=null;
    for(let i=0;i<120*10&&g.status==='playing';i++){ang+=.012;g.player.x=Math.sin(ang)*3.3;g.player.z=Math.cos(ang)*3.3;step(g,1/120);if(g.player.hp<120&&first===null)first=g.time;if(g.player.hp<=0)break;}
    assert.ok(first!==null&&first<5,'orbit '+phase+' '+first);
  }
});
