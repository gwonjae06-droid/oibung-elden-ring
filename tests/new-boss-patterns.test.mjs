import test from 'node:test';
import assert from 'node:assert/strict';
import {PATTERNS as KWON,SEQUENCES,PHASE_ONE,ORDER,CLOSE,createGame,beginSequence,chooseOpening,angleDelta} from '../src/combat.mjs';
import {PATTERNS as CLOWN,createClownGame,startClownPattern,stepClown} from '../src/clown-combat.mjs';

test('new first-boss combos reuse existing moves and are in the opening rotation',()=>{
 for(const [phase,map,keys] of [[1,PHASE_ONE,['feint','skewer']],[2,SEQUENCES,['afterimage','widow']]])
  for(const k of keys){assert.ok(map[k],k);assert.ok(map[k].length>=2&&map[k].length<=3,k);for(const m of map[k])assert.ok(KWON[m],m);assert.ok(ORDER[phase].includes(k),k);}
 assert.ok(CLOSE[1].includes('skewer'));
 for(const phase of [1,2]){const map=phase===1?PHASE_ONE:SEQUENCES;for(const list of [ORDER[phase],CLOSE[phase]])for(const k of list)assert.ok(map[k],phase+':'+k);}
});

test('every opening can be chosen and started, and rotation no longer skips entries',()=>{
 for(const phase of [1,2])for(const z of [-1,5,16]){
  const g=createGame(),seen=new Set();g.boss.phase=phase;g.player.z=z;g.player.invuln=100;
  for(let i=0;i<120;i++){const k=chooseOpening(g);beginSequence(g,k);seen.add(k);g.boss.state='idle';}
  if(z===5)for(const k of ORDER[phase])assert.ok(seen.has(k),phase+':'+k);
 }
});

test('an opening never repeats immediately when several are available',()=>{
 for(const phase of [1,2]){
  const g=createGame();g.boss.phase=phase;g.player.z=5;
  for(let i=0;i<80;i++){const k=chooseOpening(g);assert.notEqual(k,g.boss.lastOpening);g.boss.lastOpening=k;}
 }
});

function run(key,phase){
 const g=createClownGame(),def=CLOWN[key],seen=new Map();let peak=0;
 g.boss.phase=phase;g.player.invuln=1e6;startClownPattern(g,key);
 for(let i=0;i<Math.ceil((def.dur+.1)*120);i++){
  stepClown(g,1/120,{});peak=Math.max(peak,g.clown.zones.length);
  for(const z of g.clown.zones)if(!seen.has(z.id))seen.set(z.id,{...z});
 }
 return {g,zones:[...seen.values()],peak};
}

for(const [key,phases] of [['spotlightSweep',[1,2]],['fireHoop',[1,2]],['humanCannon',[2]]])
 for(const phase of phases)test(key+' phase '+phase+' is telegraphed, bounded and inside the arena',()=>{
  const {zones,peak}=run(key,phase);
  assert.ok(zones.length>=3,key);
  assert.ok(peak<=40,'too many simultaneous zones: '+peak);
  for(const z of zones){
   assert.ok(z.warn>=.8,key+' warning '+z.warn);
   assert.ok(z.damage>=20&&z.damage<=40,key+' damage '+z.damage);
   if(z.shape==='circle')assert.ok(Math.hypot(z.x,z.z)<=23&&z.r>0);
   if(z.shape==='lane'){assert.ok(Number.isFinite(z.len)&&z.len>0&&z.len<=30);assert.ok(z.w>=5);}
  }
 });

test('the cannon is a phase two pattern aimed at the player before it fans out',()=>{
 assert.deepEqual(CLOWN.humanCannon.phases,[2]);
 const {g,zones}=run('humanCannon',2),lanes=zones.filter(z=>z.shape==='lane');
 assert.equal(lanes.length,3);
 assert.ok(Math.abs(angleDelta(lanes[0].yaw,Math.atan2(g.player.x-g.boss.x,g.player.z-g.boss.z)))<1e-6);
 const a=angleDelta(lanes[0].yaw,lanes[1].yaw),b=angleDelta(lanes[0].yaw,lanes[2].yaw);
 assert.ok(Math.abs(Math.abs(a)-.42)<1e-6&&Math.abs(Math.abs(b)-.42)<1e-6&&a*b<0);
});

test('spotlights step from the boss toward the locked target and the last one is largest',()=>{
 for(const [phase,count] of [[1,4],[2,5]]){
  const {g,zones}=run('spotlightSweep',phase);
  assert.equal(zones.length,count);
  const d=zones.map(z=>Math.hypot(z.x-g.boss.x,z.z-g.boss.z));
  for(let i=1;i<d.length;i++)assert.ok(d[i]>d[i-1]);
  assert.equal(Math.max(...zones.map(z=>z.r)),zones[zones.length-1].r);
 }
});

test('fire hoops ring the clown at widening radii and each ring keeps a gap',()=>{
 for(const [phase,rings] of [[1,2],[2,3]]){
  const {g,zones}=run('fireHoop',phase),radii=new Set(zones.map(z=>Math.round(Math.hypot(z.x-g.boss.x,z.z-g.boss.z)*10)/10));
  assert.ok(radii.size<=rings&&radii.size>=Math.min(2,rings));
  for(const r of radii)assert.ok([6,10.2,14.4].some(v=>Math.abs(v-r)<.11),'radius '+r);
  assert.ok(zones.length<rings*12);
 }
});
