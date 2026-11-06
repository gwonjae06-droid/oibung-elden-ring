import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,rolling} from '../src/combat.mjs';
import {createBloodGame,actBlood,stepBlood} from '../src/blood-combat.mjs';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {PLAYER_WALK_SPEED,PLAYER_ROLL_SPEED,playerWalkSpeed,playerRolling} from '../src/player-movement-rules.mjs';

const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<.00001,msg+': '+a+' vs '+b);
const tick=(g,advance,input={x:1,z:0})=>{const start=g.player.x;for(let i=0;i<30;i++)advance(g,1/120,input);return g.player.x-start;};
const blood=()=>{const g=createBloodGame();g.blood.recover=99;return g;};

test('Blood, Clown and first boss use identical baseline walk speed and diagonal normalization',()=>{
 const a=createGame('sword',{register:false}),c=createClownGame('sword',{register:false}),b=blood();
 const kwon=tick(a,step),clown=tick(c,stepClown),bloodDist=tick(b,stepBlood);
 near(kwon,PLAYER_WALK_SPEED*.25,'first boss walk');near(clown,kwon,'Clown walk');
 near(bloodDist,kwon,'Blood walk');
 for(const source of [{x:1,z:0},{x:1,z:1}]){
  const g=blood(),origin={...g.player};for(let i=0;i<30;i++)stepBlood(g,1/120,source);
  near(Math.hypot(g.player.x-origin.x,g.player.z-origin.z),PLAYER_WALK_SPEED*.25,'diagonal normalization');
 }
});
test('blood no longer has the retired blue card speed buff but retains chain debuff',()=>{
 const g=blood();
 g.player.skill.blue=2;
 near(playerWalkSpeed(g.player),PLAYER_WALK_SPEED,'blue card skill retired');
 near(tick(g,stepBlood),PLAYER_WALK_SPEED*.25,'normal walking unchanged');
 const slowed=blood();slowed.blood.slow=2;
 near(tick(slowed,stepBlood),PLAYER_WALK_SPEED*.65*.25,'chain slow affects running');
 assert.ok(slowed.blood.slow>1.7);
});
test('Blood dodge travels at the first boss rate and uses the same invulnerability frames',()=>{
 const g=blood(),start=g.player.x;
 assert.equal(actBlood(g,'roll',{x:1,z:0}),true);
 for(let i=0;i<36;i++)stepBlood(g,1/120);
 near(g.player.x-start,PLAYER_ROLL_SPEED*.3,'Blood dodge displacement');
 assert.equal(rolling({action:{kind:'roll',t:.07}}),false);
 for(const t of [.075,.18,.35]){
  const actor={action:{kind:'roll',t}};
  assert.equal(playerRolling(actor),true);
  assert.equal(rolling(actor),true,'first-boss dodge is identical');
 }
 assert.equal(playerRolling({action:{kind:'roll',t:.36}}),false);
 assert.equal(g.boss.hp,g.boss.maxHp,'dodge does not damage the boss');
});
test('first boss unchanged by shared constants; Blood velocity stays bounded under invalid input',()=>{
 near(PLAYER_WALK_SPEED,4.7,'standard walk');
 near(PLAYER_ROLL_SPEED,10,'standard roll');
 for(const vector of [{x:Infinity,z:NaN},{x:999,z:999},{x:-2,z:1}]){
  const g=blood();tick(g,stepBlood,vector);
  assert.ok(Number.isFinite(g.player.x)&&Number.isFinite(g.player.z));
  assert.ok(Math.hypot(g.player.x,g.player.z)<30);
 }
});
