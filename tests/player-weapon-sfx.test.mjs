import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {PLAYER_WEAPON_CLIPS,PLAYER_WEAPON_FILES,playerWeaponCue,createPlayerWeaponSfx} from '../src/player-weapon-sfx.mjs';
import {BOSS_FOLEY_FILES} from '../src/boss-foley-map.mjs';

const game=(weapon,kind='attack')=>({status:'playing',weapon,player:{action:{kind}}});

test('all four weapons have distinct normal/skill recordings and all assigned assets exist',()=>{
 const packs=PLAYER_WEAPON_CLIPS;
 assert.deepEqual(Object.keys(packs).sort(),['bow','cards','hammer','sword']);
 const bossFiles=Object.values(BOSS_FOLEY_FILES).flatMap(group=>Object.values(group));
 for(const [weapon,pack] of Object.entries(packs)){
  assert.ok(pack.attack?.length,weapon+' missing attack');
  assert.ok((weapon==='cards'?pack.blue:pack.skill)?.length,weapon+' missing skill');
  assert.ok(pack.attack.every(s=>s.gain<=.17),weapon+' normal too loud');
  for(const cues of Object.values(pack))for(const c of cues){
   assert.ok(existsSync(new URL('../'+c.file,import.meta.url)),c.file);
   assert.ok(c.gain>0&&c.gain<=.21,c.file);
   assert.ok(c.seconds>c.fade&&c.seconds<=1.1,c.file);
   assert.ok(c.minGap>=.08,c.file);
  }
  const normal=new Set(pack.attack.map(s=>s.file));
  const skills=Object.entries(pack).filter(([name])=>!['attack','impact'].includes(name)).flatMap(([,spec])=>spec.map(s=>s.file));
  assert.ok(skills.every(file=>!normal.has(file)),weapon+' attack/skill share recordings');
 }
 assert.equal(PLAYER_WEAPON_FILES.length,16);
 for(const file of PLAYER_WEAPON_FILES){
  assert.ok(!bossFiles.includes(file),'new boss-exclusive file reused by a player: '+file);
  assert.ok(!file.endsWith('/heal.mp3')&&!file.endsWith('/dead.mp3'));
 }
});

test('normal attacks, skill casts and ranged impact map without double-firing',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=game(weapon);
  const normal=playerWeaponCue({type:weapon==='bow'||weapon==='cards'?'shot':'swing'},g);
  assert.equal(normal?.key,weapon+':attack');
  assert.equal(playerWeaponCue({type:'skill-cast',flavor:weapon==='cards'?'red':weapon},g)?.key,weapon==='cards'?'cards:red':weapon+':skill');
  g.player.action.kind='skill';
  assert.equal(playerWeaponCue({type:weapon==='bow'||weapon==='cards'?'shot':'swing'},g),null);
  assert.equal(playerWeaponCue({type:'skill-stun'},g),null);
  assert.equal(playerWeaponCue({type:'skill-pierce'},g),null);
 }
 for(const color of ['blue','red','yellow'])assert.ok(playerWeaponCue({type:'skill-cast',flavor:color},game('cards')));
 assert.equal(playerWeaponCue({type:'boss-hit',amount:12},game('sword')),null);
 assert.equal(playerWeaponCue({type:'boss-hit',amount:12},game('bow'))?.key,'bow:impact');
 assert.equal(playerWeaponCue({type:'boss-hit',amount:0},game('bow')),null);
 assert.equal(playerWeaponCue({type:'healed'},game('hammer')),null);
});

test('one active attack voice across normal and skill, quiet volume, timer fade and mute',async()=>{
 const items=[];let t=0,tick=null,cancelled=0,muted=false;
 class FakeAudio{
  constructor(url){this.src=url;this.preload='';this.paused=true;this.volume=1;this.currentTime=0;items.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  load(){}removeAttribute(){}
 }
 const instance=createPlayerWeaponSfx({
  AudioClass:FakeAudio,now:()=>t,muted:()=>muted,hidden:()=>false,
  schedule:fn=>{tick=fn;return 3;},cancel:()=>{cancelled++;tick=null;},
  storage:{getItem:()=>null}
 });
 const sword=game('sword');
 assert.equal(instance.event({type:'swing'},sword),true);
 assert.equal(instance.activeCount,1);
 assert.ok(items.some(c=>!c.paused&&c.src.endsWith('/sword1.mp3')));
 const swordSound=items.find(c=>!c.paused);
 assert.equal(swordSound.volume,.14);
 assert.equal(instance.event({type:'swing'},sword),false,'rapid repeated normal attack should be throttled');
 t=150;
 assert.equal(instance.event({type:'skill-cast',flavor:'sword'},sword),true);
 assert.ok(swordSound.paused,'previous attack must stop before skill starts');
 assert.equal(instance.activeCount,1);
 assert.ok(items.some(c=>!c.paused&&c.src.endsWith('/sword3.mp3')));
 const active=items.find(c=>!c.paused),original=active.volume;
 t=150+510;tick();
 assert.ok(active.volume<original,'skill should fade near its end');
 t=900;tick();
 assert.equal(instance.activeCount,0);
 assert.ok(cancelled>=2);
 t=1150;
 assert.equal(instance.event({type:'shot'},game('cards')),true);
 muted=true;tick();assert.equal(instance.activeCount,0);
 instance.dispose();
 assert.equal(instance.event({type:'shot'},game('cards')),false);
 assert.equal(instance.activeCount,0);
});

test('no sound when muted, hidden, unsupported or interrupted by healing/death cleanup',()=>{
 let muted=true,hidden=false;
 const f=createPlayerWeaponSfx({AudioClass:null,muted:()=>muted,hidden:()=>hidden});
 assert.equal(f.event({type:'swing'},game('sword')),false);
 muted=false;assert.equal(f.event({type:'swing'},game('sword')),false);
 hidden=true;assert.equal(f.event({type:'shot'},game('bow')),false);
 f.clear();f.dispose();assert.equal(f.disposed,true);
});
