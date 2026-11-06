import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,skillView} from '../src/combat.mjs';
import {actPlayer,tickPlayerAction,rewardPlayerHit} from '../src/player-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {playerRollSpeed,playerWalkSpeed} from '../src/player-movement-rules.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {hazardContains,bloodHazardFootprint,bloodHazardContactReady,BLOOD_BROAD_IMPACT_BUFFER} from '../src/blood-data.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';
import {freshProfile} from '../src/journey-state.mjs';
import {buyForgeTier,refundForgeWeapon,forgeTier,normalizeFlameProfile,forgedEvolutions} from '../src/purification-forge.mjs';
import {forgeScreen} from '../src/forge-view.mjs';
import {SKILLS} from '../src/skills.mjs';

const made=(weapon,ranks=[])=>{const g=createGame(weapon,{register:false});g.evolutions=[...ranks];g.boss.wait=999;return g;};
const attack=(g)=>{g.player.action=null;g.player.stamina=100;assert.ok(actPlayer(g,'light'));const a=g.player.action;tickPlayerAction(g,.5,WEAPONS[g.weapon]);return a;};

test('forge blocks a second path, refunds it, and locks the UI',()=>{
 const p=freshProfile();p.flames=6;
 assert.equal(buyForgeTier(p,'bow','twin-arrow'),true);
 assert.equal(buyForgeTier(p,'bow','piercing-arrow'),false);
 assert.equal(forgeTier(p,'bow','piercing-arrow'),0);
 const ui=forgeScreen(p,'bow',{button:(a,v,attrs)=>'<button data-j="'+a+'" '+attrs+'>'+v+'</button>',back:()=>'',warning:()=>''});
 assert.match(ui,/한 무기는 두 계열 중 하나만/);
 assert.match(ui,/다른 계열을 먼저 반환해야 합니다/);
 assert.equal(refundForgeWeapon(p,'bow'),1);
 assert.equal(buyForgeTier(p,'bow','piercing-arrow'),true);
 assert.deepEqual(forgedEvolutions(p,'bow'),['piercing-arrow']);
});
test('corrupted old dual investment is normalized and flames are returned exactly once',()=>{
 const p=freshProfile();p.flames=1;p.earnedFlames=5;
 p.forge.cards['wide-deck']=1;p.forge.cards['blood-deck']=2;
 normalizeFlameProfile(p);
 assert.equal(forgeTier(p,'cards','wide-deck'),0);
 assert.equal(forgeTier(p,'cards','blood-deck'),2);
 assert.equal(p.flames,2);
 normalizeFlameProfile(p);assert.equal(p.flames,2);
});
test('fire arrows gain visible fire metadata and damage but never multiply or pierce',()=>{
 const g=made('bow',['twin-arrow','twin-arrow']);
 const a=attack(g),q=g.projectiles[0];
 assert.equal(g.projectiles.length,1);
 assert.equal(q.fireRank,2);assert.equal(q.piercing,false);
 assert.equal(q.damage,WEAPONS.bow.damage*1.24);
 assert.equal(q.kind,'bow');assert.ok(q.source===a);
});
test('bow dodge distance scales only for equipped dodge-line bows',()=>{
 assert.equal(playerRollSpeed(made('bow')),10*1.05);
 assert.equal(playerRollSpeed(made('bow',['piercing-arrow'])),10*1.05*1.2);
 assert.equal(playerRollSpeed(made('bow',['piercing-arrow','piercing-arrow'])),10*1.05*1.35);
 assert.equal(playerRollSpeed(made('sword',['piercing-arrow'])),10);
});
test('card attacks alternate weak blue, red and yellow skill, never add projectiles',()=>{
 const g=made('cards',['wide-deck']);const originalSpeed=playerWalkSpeed(g.player);
 const blue=attack(g);assert.equal(blue.autoCard,'blue');assert.equal(g.projectiles.length,3);
 assert.ok(playerWalkSpeed(g.player)>originalSpeed&&playerWalkSpeed(g.player)<originalSpeed*1.4);
 assert.equal(actPlayer(g,'skill'),false,'active skill is absorbed into basic attacks');
 g.projectiles.length=0;
 const red=attack(g);assert.equal(red.autoCard,'red');assert.equal(red.mult,1.18);assert.equal(g.projectiles.length,3);
 g.projectiles.length=0;
 const yellow=attack(g);assert.equal(yellow.autoCard,'yellow');assert.equal(yellow.autoStun,.32);
 assert.equal(g.projectiles.length,3);
 let stuns=0;rewardPlayerHit(g,12,yellow,{canStun:true,stun:n=>{stuns++;assert.equal(n,.32);}});
 rewardPlayerHit(g,10,yellow,{canStun:true,stun:()=>stuns++});assert.equal(stuns,1);
 g.projectiles.length=0;assert.equal(attack(g).autoCard,'blue');
 assert.match(skillView(g).text,/평타/);
});
test('hammer skill and passive recovery remain capped with reduced values',()=>{
 assert.equal(SKILLS.hammer.heal,.14);
 const g=made('hammer',['blood-hammer','blood-hammer']);g.player.hp=40;
 rewardPlayerHit(g,100,{basic:true});
 assert.equal(g.player.hp,50);
 rewardPlayerHit(g,100,{skill:true,basic:false});
 assert.equal(g.player.hp,64);
 rewardPlayerHit(g,1000,{skill:true,basic:false});
 assert.equal(g.player.hp,g.player.maxHp,'no overheal');
});
test('moving Blood wave only hits when its visible crest reaches a distant target',()=>{
 const g=createBloodGame();g.player.x=0;g.player.z=4;
 assert.equal(startBloodPattern(g,'wave'),true);
 const h=g.blood.hazards[0];
 h.age=h.warn+.2;
 assert.equal(hazardContains(h,g.player),false,'the old 10m-long leading hitbox cannot reach early');
 const field=bloodFloorField(g);assert.equal(field.hazards.length,1);
 const foot=bloodHazardFootprint(h);assert.equal(foot.x,field.hazards[0].x);
 assert.equal(foot.halfLength,field.hazards[0].halfLength);
 h.age=h.warn+.46;assert.equal(hazardContains(h,g.player),true,'actual wave reached its target');
});
test('large stationary Blood magic has a short release-before-contact grace',()=>{
 const g=createBloodGame();g.boss.phase=2;assert.equal(startBloodPattern(g,'wing'),true);
 const h=g.blood.hazards[0];
 h.age=h.warn+BLOOD_BROAD_IMPACT_BUFFER-.03;
 assert.equal(bloodHazardContactReady(h),false);
 assert.equal(bloodFloorField(g).hazards[0].active,false);
 h.age=h.warn+BLOOD_BROAD_IMPACT_BUFFER+.02;
 assert.equal(bloodHazardContactReady(h),true);
 assert.equal(bloodFloorField(g).hazards[0].active,true);
});
