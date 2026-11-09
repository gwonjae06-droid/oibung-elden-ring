import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,stepGyuwon,actGyuwon,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {REFERENCE_UNIT_TYPES,usesReference2d,referenceKeyAction} from '../src/gyuwon-reference-rules.mjs';
import {gyuwonFightScene,gyuwonFightGround,GYUWON_FIGHT_SET_PIECES} from '../src/gyuwon-fight-director.mjs';
import {GYUWON_LYRIC_ACTIONS,GYUWON_LYRIC_ACTION_YEARS,GYUWON_LYRIC_ACTION_COUNT,gyuwonLyricActionAt,gyuwonLyricActionsCrossed} from '../src/gyuwon-lyric-actions.mjs';
import {GYUWON_ALIGNED_CAPTIONS} from '../src/gyuwon-aligned-captions.mjs';
import {GYUWON_LYRIC_SCENARIOS} from '../src/gyuwon-lyric-action-scenarios.mjs';
import {gyuwonLyricActorMotion} from '../src/gyuwon-lyric-actor-motion.mjs';
import {gyuwonLyricStagePose} from '../src/gyuwon-lyric-3d-art.mjs';
import {gyuwonLyricMouthAt} from '../src/gyuwon-lyric-photo-mouth.mjs';
const advance=(g,s,input={})=>{for(let i=0;i<Math.ceil(s*120);i++)stepGyuwon(g,1/120,input);};
function at(year){const g=createGyuwonGame('sword',{yearMode:true,seed:843}),e=g.gyuwon.years;e.year=year;stepGyuwon(g,.008);const m=e.musical;m.transition=0;g.player.invuln=0;g.player.x=m.entry.tx;g.player.z=m.entry.tz;g.boss.x=m.entry.btx;g.boss.z=m.entry.btz;g.boss.hp=({5:6000,6:5300,7:4600,8:3900,9:3200,10:2500,11:1800})[year];return {g,m};}
test('only the supplied 2D genres select Canvas2D, while act five and finale remain 3D',()=>{for(let y=5;y<=11;y++){const {g,m}=at(y);assert.equal(usesReference2d(m),y>=6&&y<=10);assert.equal(damageGyuwon(g,99999),0);}});
test('giant turn combat owns four allies, five persistent parts, speed queue and shared skill points',()=>{const {g,m}=at(5);assert.equal(m.party.length,4);assert.equal(m.enemies.length,5);assert.equal(m.queue.length,6);assert.equal(m.turnActor,'ally2');assert.equal(actGyuwon(g,'target3'),false);assert.ok(actGyuwon(g,'target1'));assert.ok(actGyuwon(g,'light'));assert.equal(m.skillPoints,4);const hp=m.enemies[1].hp;advance(g,.9);assert.equal(m.enemies[1].hp,hp);advance(g,.2);assert.ok(m.enemies[1].hp<hp);assert.equal(g.boss.hp,6000);advance(g,.8);assert.equal(m.turn,'player');assert.ok(actGyuwon(g,'skill'));assert.equal(m.skillPoints,3);});
test('turn skills cannot be free and out-of-turn ultimates cannot refund their own energy',()=>{const {g,m}=at(5);m.skillPoints=0;assert.equal(actGyuwon(g,'skill'),false);m.party[0].energy=100;assert.ok(actGyuwon(g,'ultimate0'));assert.equal(m.party[0].energy,0);advance(g,1.6);assert.equal(m.party[0].energy,0);assert.equal(actGyuwon(g,'ultimate0'),false);assert.ok(m.enemies.some(e=>e.hp<e.maxHp));});
test('giant enemy turn damage waits for preparation and physical travel, then settles once',()=>{const {g,m}=at(5);m.turn='boss';m.turnActor='enemy1';m.enemyVictim='ally0';m.turnElapsed=0;const hp=m.party[0].hp;advance(g,1.9);assert.equal(m.party[0].hp,hp);assert.ok(m.raidAttack.y>1.8);advance(g,.25);assert.equal(m.party[0].hp,hp-18);advance(g,.3);assert.equal(m.party[0].hp,hp-18);});
test('runner has two jumps, real platform gaps and collectible jelly contacts',()=>{const {g,m}=at(6);assert.ok(actGyuwon(g,'jump'));advance(g,.1);assert.ok(actGyuwon(g,'jump'));assert.equal(actGyuwon(g,'jump'),false);assert.ok(g.player.floorY>0);m.jellies=[{x:g.player.x+.15,y:m.jumpY+1,kind:'jelly'}];const score=m.score;advance(g,.01);assert.ok(m.score>score);assert.ok(m.pickups>0);m.platforms=[];m.jumpY=-5.1;m.jumpV=-3;const hp=g.player.hp;g.player.invuln=0;advance(g,.01);assert.ok(g.player.hp<hp);assert.ok(m.platforms.length>0);assert.ok(m.jumpY>0);});
test('runner slide clears hanging obstacles, but actual ground collisions cause damage',()=>{const {g,m}=at(6);assert.ok(actGyuwon(g,'slide'));m.obstacles=[{x:g.player.x+.1,kind:'low',hit:false}];const hp=g.player.hp;advance(g,.01);assert.equal(g.player.hp,hp);m.obstacles=[{x:g.player.x+.1,kind:'high',hit:false}];advance(g,.01);assert.ok(g.player.hp<hp);assert.ok(actGyuwon(g,'slide-end'));assert.equal(m.slide,0);});
test('six unit cards enforce currency and cooldown, with upgradable passive income',()=>{const {g,m}=at(7);assert.equal(REFERENCE_UNIT_TYPES.length,6);assert.ok(actGyuwon(g,'summon0'));assert.equal(m.money,140);assert.equal(actGyuwon(g,'summon0'),false);assert.ok(actGyuwon(g,'upgrade'));assert.equal(m.workerLevel,2);const money=m.money;advance(g,.5);assert.ok(m.money>money);assert.ok(m.unitCooldowns[0]>0);});
test('unit attack contact is delayed by its own windup, and the cannon sweeps through enemies',()=>{const {g,m}=at(7);m.money=500;actGyuwon(g,'summon0');const ally=m.units[0];ally.x=-.6;const enemy={...ally,id:99,team:-1,x:.6,hp:500,maxHp:500};m.units.push(enemy);m.enemySpawn=99;advance(g,.4);assert.equal(enemy.hp,500);advance(g,.3);assert.ok(enemy.hp<500);const after=enemy.hp;m.cannon=100;assert.ok(actGyuwon(g,'cannon'));advance(g,.6);assert.ok(enemy.hp>=after-30);advance(g,.5);assert.ok(enemy.hp<after-90);assert.equal(g.boss.hp,4600);});
test('Backup Spotlight adaptation has distinct pose, turn and quick-turn cues with strict timing',()=>{const {g,m}=at(8);assert.deepEqual(new Set(m.dancePatterns.map(p=>p.kind)),new Set(['pose','turn','quick']));const p=m.dancePatterns[0];m.time=p.first;assert.equal(actGyuwon(g,'skill'),false);assert.ok(actGyuwon(g,'light'));assert.equal(p.done[0],true);assert.equal(m.judgement,'PERFECT');assert.equal(actGyuwon(g,'light'),false);const q=m.dancePatterns.find(p=>p.kind==='quick');m.time=q.first+.1;assert.equal(actGyuwon(g,'roll'),false);assert.ok(actGyuwon(g,'light'));assert.equal(q.done[0],true);assert.equal(m.dancePoseKind,'quick');});
test('a large audio clock jump never applies invisible dance misses',()=>{
 const {g,m}=at(8);
 const hp=g.player.hp;
 m.time=m.dancePatterns[2].first+2.7;
 advance(g,.0083);
 assert.equal(g.player.hp,hp);
 assert.ok(m.dancePatterns.slice(0,2).every(p=>p.misses.some(Boolean)));
});
test('accepted dance hits own the only bright impact burst and the two controls stay strict',()=>{
 const {g,m}=at(8),p=m.dancePatterns[0];
 m.time=p.first;
 assert.equal(m.danceHit,null);
 assert.equal(actGyuwon(g,'roll'),false);
 assert.equal(m.danceHit,null);
 assert.equal(actGyuwon(g,'light'),true);
 assert.equal(m.danceHit.grade,'PERFECT');
 assert.equal(m.danceHit.scheduledAt,p.first);
 assert.equal(m.danceHit.action,'light');
 assert.equal(actGyuwon(g,'light'),false);
});
test('missing a dance beat breaks the combo and causes a short visible miss reaction',()=>{const {g,m}=at(8);m.combo=4;m.time=m.dancePatterns[0].first+.25;m.dancePreviousTime=m.time-.1;const hp=g.player.hp;advance(g,.01);assert.equal(m.combo,0);assert.ok(m.danceError>0);assert.ok(g.player.hp<hp);});
test('fighter strikes require range and contact time; far attacks never score',()=>{const {g,m}=at(9);m.enemyThink=99;m.turnCount=1;actGyuwon(g,'light');advance(g,.6);assert.equal(m.score,0);const [p,b]=m.fighters;p.x=0;b.x=2.7;p.action=null;const hp=b.hp;assert.ok(actGyuwon(g,'light'));advance(g,.15);assert.equal(b.hp,hp);advance(g,.13);assert.ok(b.hp<hp);assert.ok(m.score>0);assert.equal(g.boss.hp,3200);});
test('fighter supports jumping, held guard and a resource-gated super move',()=>{const {g,m}=at(9),p=m.fighters[0];assert.equal(actGyuwon(g,'super'),false);assert.ok(actGyuwon(g,'jump'));advance(g,.12);assert.ok(p.y>0);assert.ok(actGyuwon(g,'guard'));assert.equal(m.guardHeld,true);assert.ok(actGyuwon(g,'guard-end'));p.action=null;p.meter=100;assert.ok(actGyuwon(g,'super'));assert.equal(p.meter,0);});
test('vertical shooter auto-fires, scores only on target contact and has finite bombs',()=>{const {g,m}=at(10);g.player.invuln=100;g.player.x=10;advance(g,.7);assert.ok(m.bullets.length>0);assert.equal(m.score,0);g.player.x=-6;advance(g,1.3);assert.ok(m.score>0);assert.equal(g.boss.hp,2500);m.enemyShots=[{x:0,z:0,vx:0,vz:1,life:3}];assert.ok(actGyuwon(g,'bomb'));assert.equal(m.bombs,2);assert.equal(m.enemyShots.length,0);m.bombs=0;assert.equal(actGyuwon(g,'bomb'),false);});
test('shooter drag position moves physically and weapon switching does not grant power',()=>{const {g,m}=at(10);m.pointerTarget={x:8,z:5};advance(g,.1);assert.ok(g.player.x>0&&g.player.x<8);assert.ok(g.player.z<13);const power=m.power;actGyuwon(g,'skill');assert.equal(m.power,power);assert.equal(m.weaponMode,'laser');});
test('genre-specific keyboard commands match the visible native controls',()=>{assert.equal(referenceKeyAction(at(5).m,'KeyQ'),'light');assert.equal(referenceKeyAction(at(5).m,'Digit4'),'ultimate3');assert.equal(referenceKeyAction(at(6).m,'Space'),'jump');assert.equal(referenceKeyAction(at(7).m,'Digit6'),'summon5');assert.equal(referenceKeyAction(at(8).m,'KeyJ'),'light');assert.equal(referenceKeyAction(at(8).m,'KeyL'),'skill');assert.equal(referenceKeyAction(at(8).m,'Space'),null);assert.equal(referenceKeyAction(at(9).m,'KeyK'),'guard');assert.equal(referenceKeyAction(at(9).m,'KeyJ'),'light');assert.equal(referenceKeyAction(at(9).m,'KeyO'),null);assert.equal(referenceKeyAction(at(10).m,'Space'),'bomb');});
test('runner slide remains held beyond one second and releases immediately',()=>{const {g,m}=at(6);g.player.invuln=999;actGyuwon(g,'slide');advance(g,1.4);assert.ok(m.slide>.9);actGyuwon(g,'slide-end');assert.equal(m.slide,0);assert.equal(m.slideHeld,false);});
test('an empty target wave cannot consume or create turn-combat resources',()=>{const {g,m}=at(5);for(const e of m.enemies)e.hp=0;const sp=m.skillPoints;m.party[0].energy=100;assert.equal(actGyuwon(g,'light'),false);assert.equal(actGyuwon(g,'skill'),false);assert.equal(m.skillPoints,sp);assert.equal(actGyuwon(g,'ultimate0'),false);assert.equal(m.party[0].energy,100);});

const reachSong=(g,m,time)=>{m.clock={source:'media',time,duration:180,ended:false};advance(g,.017);};
test('giant stage opens as theater and destroyed hands never respawn when later parts open',()=>{const {g,m}=at(5);assert.equal(m.entryDuration,5.8);m.enemies[0].hp=0;m.enemies[0].destroyed=true;advance(g,2);assert.equal(m.enemies[0].hp,0);reachSong(g,m,74);assert.equal(m.enemies[2].active,true);assert.equal(m.enemies[0].hp,0);reachSong(g,m,143);assert.equal(m.enemies[3].active,true);assert.equal(m.enemies[4].active,true);});
test('long runner changes scenes and army has an interlude before final fort',()=>{
 const r=at(6);reachSong(r.g,r.m,65);assert.equal(r.m.runnerBiome,'rain');
 reachSong(r.g,r.m,96);assert.equal(r.m.runnerBiome,'quiet');
 reachSong(r.g,r.m,112);assert.equal(r.m.runnerBiome,'sunrise');
 const a=at(7);reachSong(a.g,a.m,77);assert.equal(a.m.enemyFort,2);
 reachSong(a.g,a.m,112);assert.equal(a.m.armyTruce,true);
 reachSong(a.g,a.m,146);assert.equal(a.m.enemyFort,3);assert.equal(a.m.armyTruce,false);
});
test('long fighting song comprises three timed rounds, shooter owns a final carrier only once',()=>{
 const f=at(9);reachSong(f.g,f.m,67);assert.equal(f.m.fightRound,2);
 reachSong(f.g,f.m,137);assert.equal(f.m.fightRound,3);
 const s=at(10);reachSong(s.g,s.m,145);assert.equal(s.m.finalCarrierSpawned,true);
 const final=s.m.shooterTargets.filter(e=>e.phase===7);assert.equal(final.length,1);
 reachSong(s.g,s.m,152);assert.equal(s.m.shooterTargets.filter(e=>e.phase===7).length,1);
});

test('11수 is an unskippable, nonviolent musical curtain call',()=>{
 const {g,m}=at(11);g.player.hp=1;
 assert.equal(actGyuwon(g,'roll'),false);
 assert.equal(actGyuwon(g,'light'),false);
 assert.equal(actGyuwon(g,'skill'),false);
 reachSong(g,m,28);
 assert.equal(m.curtainCall.actor,'oslu');
 assert.equal(m.curtainCall.mode,'recollection');
 assert.equal(g.player.x,0);
 assert.equal(g.player.z,5);
 assert.equal(g.player.hp,1);
 assert.deepEqual(m.finaleHazards,[]);
 reachSong(g,m,108);
 assert.equal(m.curtainCall.mode,'credits');
 assert.deepEqual(m.finaleHazards,[]);
 assert.equal(g.status,'playing');
 assert.equal(g.player.hp,1);
});

test('act nine lyric acts transform ground, identities and fighting rules at source-master anchors',()=>{
 assert.equal(gyuwonFightScene(2).kind,'handoff');
 assert.equal(gyuwonFightScene(19).role,'king');
 assert.equal(gyuwonFightScene(21).role,'clown');assert.equal(gyuwonFightScene(28).arena,'rooftop');
 assert.equal(gyuwonFightScene(50).arena,'rooftop');
 assert.equal(gyuwonFightScene(99).quiet,true);
 assert.equal(gyuwonFightScene(118).arena,'mirror');
 assert.equal(gyuwonFightScene(145).role,'ensemble');
 assert.equal(gyuwonFightScene(176).arena,'stars');
 assert.equal(gyuwonFightGround(15,10),0);
 assert.ok(gyuwonFightGround(55,10)>.3);
 assert.ok(gyuwonFightGround(120,0)>.5);
 assert.ok(GYUWON_FIGHT_SET_PIECES.every((x,i,all)=>x.wind>.5&&x.radius>0&&(i===0||all[i-1].at<x.at)));
});
test('act nine exposes a two-action control scheme and world changes follow media time',()=>{
 const {g,m}=at(9);assert.equal(referenceKeyAction(m,'KeyK'),'guard');
 assert.equal(referenceKeyAction(m,'KeyL'),null);
 assert.ok(actGyuwon(g,'guard'));assert.equal(m.guardHeld,true);
 assert.ok(actGyuwon(g,'guard-end'));
 reachSong(g,m,50);assert.equal(m.fightRound,2);assert.equal(m.fightWorld.arena,'rooftop');
 reachSong(g,m,101);assert.equal(m.fightWorld.quiet,true);
 reachSong(g,m,114);assert.equal(m.fightRound,3);assert.equal(m.fightWorld.role,'reflection');
});
test('early KO enables limited playable encore and does not auto-repeat fight rounds',()=>{
 const {g,m}=at(9);m.fighters[1].hp=0;advance(g,.02);
 assert.equal(m.fightReset,1);
 advance(g,1.6);assert.equal(m.fightReset,1);
 assert.equal(m.encoreOrbs.length,1);
 m.fighters[0].x=m.encoreOrbs[0].x;
 const before=m.encoreCollected;assert.ok(actGyuwon(g,'light'));assert.equal(m.encoreCollected,before+1);
 assert.equal(actGyuwon(g,'light'),false);
 reachSong(g,m,42);assert.equal(m.fightRound,2);assert.equal(m.fightReset,0);
});

test('all 170 authored line-specific lyric actions use the original aligned audio times',()=>{
 assert.equal(GYUWON_LYRIC_ACTION_COUNT,170);
 assert.deepEqual(GYUWON_LYRIC_ACTION_YEARS,['5','6','8','9','11','ending']);
 assert.equal(GYUWON_LYRIC_ACTIONS[7],undefined);
 assert.equal(GYUWON_LYRIC_ACTIONS[10],undefined);
 const seen=new Set();
 for(const key of GYUWON_LYRIC_ACTION_YEARS){
  const actions=GYUWON_LYRIC_ACTIONS[key],captions=GYUWON_ALIGNED_CAPTIONS[key];
  assert.equal(actions.length,captions.length);
  for(let i=0;i<actions.length;i++){
   const a=actions[i],source=captions[i];
   assert.ok(a.id&&!seen.has(a.id));seen.add(a.id);
   assert.equal(a.start,source.start);assert.equal(a.end,source.end);
   assert.equal(a.ko,source.ko);assert.equal(a.en,source.en);
   assert.equal(a.stagingRule,GYUWON_LYRIC_SCENARIOS[key][i].instruction);
   assert.ok(a.stagingRule.length>=15,'each lyric must carry its source acting rule');
   assert.ok(a.actors.length&&a.worldEvents.length&&a.gesture&&a.actionId);
   const middle=(a.start+a.end)/2;
   assert.equal(gyuwonLyricActionAt(key,middle)?.id,a.id);
   assert.equal(gyuwonLyricActionAt(key,a.start)?.id,a.id);
   assert.ok(gyuwonLyricActionAt(key,a.end-1e-5)?.phase>.9);
  }
 }
 assert.equal(seen.size,170);
});
test('timed lyric contact is seek-safe and excluded acts remain unaffected',()=>{
 for(const y of [7,10]){
  assert.equal(gyuwonLyricActionAt(y,33),null);
  assert.deepEqual(gyuwonLyricActionsCrossed(y,31,32),[]);
  const {g,m}=at(y);reachSong(g,m,32);
  assert.equal(m.lyricAction,null);
 }
 assert.deepEqual(gyuwonLyricActionsCrossed(9,2,112),[],'seek cannot queue attacks from past lyrics');
 assert.deepEqual(gyuwonLyricActionsCrossed(9,111.75,111.95).map(a=>a.actionId),['roundEcho1']);
});
test('real media time selects matching 6, 8, and 9 gestures and affects fighter set pieces',()=>{
 const samples=[[6,25.5,'rainDance','spin'],[6,28.5,'mountainLeap','jump'],
  [8,29.3,'leftStep','stepleft'],[8,31.5,'rightStep','stepright'],
  [9,34.0,'leftSwingRight','stepstrike'],[9,118.5,'roundEcho3','blade'],
  [11,40,'runAndFight','fight']];
 for(const [year,time,action,gesture] of samples){
  const {g,m}=at(year);g.player.invuln=9999;
  reachSong(g,m,time);
  assert.equal(m.lyricAction?.actionId,action,String(year)+' at '+time);
  assert.equal(m.lyricAction?.gesture,gesture);
 }
 for(const at of [111.9,114.26,118.28,121.28,122.42])
  assert.ok(GYUWON_FIGHT_SET_PIECES.some(c=>c.at===at&&c.wind>=.65));
 assert.equal(GYUWON_FIGHT_SET_PIECES.find(c=>c.at===114.26).damage,0);
});
test('eleventh-year and ending anatomical gestures do not need animation timers',()=>{
 const f=gyuwonLyricActionAt(11,41.5),m=gyuwonLyricActorMotion(f,41.5);
 assert.ok(m);assert.ok(Number.isFinite(m.leftArm));
 assert.equal(gyuwonLyricStagePose(11,41.5)?.id,f.id);
 const e=gyuwonLyricActionAt('ending',116.5),motion=gyuwonLyricActorMotion(e,116.5);
 assert.equal(e?.actionId,'stopRunning');
 assert.ok(motion);assert.equal(motion.step,0);
 assert.ok(gyuwonLyricStagePose('ending',173)?.instrumental);
});

test('last song and original ending mouth react only to actual lyric words',()=>{
 const singing=gyuwonLyricMouthAt(11,40.1);
 assert.ok(singing.openness>=0&&singing.openness<=1);
 assert.ok(singing.cue?.startsWith('11-'));
 assert.equal(gyuwonLyricMouthAt(11,10).openness,0);
 assert.equal(gyuwonLyricMouthAt('ending',30).openness,0);
 assert.ok(gyuwonLyricMouthAt('ending',138.1).cue?.startsWith('ending-'));
 assert.equal(gyuwonLyricMouthAt(7,40).openness,0);
});
