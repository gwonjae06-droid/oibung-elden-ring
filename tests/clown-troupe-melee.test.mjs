import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownGame} from '../src/clown-combat.mjs';
import {CIRCUS_ROLES,setCircusAct,stepCircusTroupe} from '../src/clown-troupe.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {freshProfile,newRun,configureJourney} from '../src/journey-state.mjs';

// All assertions use the actual normal-journey configuration, not the
// smaller, isolated createGame() boss-HP fixture.
function setup(stage,role){
 const g=createClownGame('sword',{register:false,seed:31});
 const run=newRun('sword');run.stage=1;
 configureJourney(g,run,freshProfile());
 g.boss.state='clown';g.boss.phase=stage===1?1:2;
 g.clown.state='idle';g.clown.horrorStage=stage;
 g.player.x=0;g.player.z=0;
 setCircusAct(g,stage);
 const m=g.clown.troupe.members.find(x=>x.role===role);
 assert.ok(m,role+' must physically spawn in act '+stage);
 m.x=0;m.z=3.25;m.vx=m.vz=0;m.cooldown=0;
 g.clown.troupe.globalCooldown=0;
 for(const other of g.clown.troupe.members)if(other!==m)other.cooldown=9999;
 return {g,m};
}
function perform({g},duration=3.1,{escape=false}={}){
 const zones=[],casts=[],hits=[],dt=1/60;
 for(let i=0;i<Math.ceil(duration/dt);i++){
  g.clown.time+=dt;
  if(escape&&g.clown.time>.40){g.player.x=13;g.player.z=14;}
  stepCircusTroupe(g,dt,{
   zone:(_,z)=>zones.push(z),
   emit:(_,type,data)=>{if(type==='clown-troupe-cast')casts.push({...data,at:g.clown.time});},
   hurt:(_,damage,source)=>hits.push({damage,source,at:g.clown.time})
  });
 }
 return {zones,casts,hits};
}
test('normal journey has tougher living actors including real strongman and blade dancer',()=>{
 const {g}=setup(1,'strongman');
 assert.equal(g.boss.maxHp,5076);
 assert.ok(CIRCUS_ROLES.chorister.hp>=130);
 assert.ok(CIRCUS_ROLES.acrobat.hp>=140);
 assert.ok(CIRCUS_ROLES.puppeteer.hp>=170);
 assert.equal(CIRCUS_ROLES.strongman.hp,192);
 assert.equal(CIRCUS_ROLES.bladeDancer.hp,148);
 assert.ok(g.clown.troupe.members.some(m=>m.role==='strongman'));
 g.clown.horrorStage=2;setCircusAct(g,2);
 assert.ok(g.clown.troupe.members.some(m=>m.role==='bladeDancer'));
});
for(const [stage,role,minHits] of [[1,'strongman',1],[2,'bladeDancer',2]]){
 test(role+' melee has a conspicuous, locked windup and physically close hits',()=>{
  const {g,m}=setup(stage,role),r=perform({g},3.1);
  assert.equal(r.casts.filter(c=>c.melee&&c.id===m.id).length,1);
  const cast=r.casts.find(c=>c.melee&&c.id===m.id);
  const warning=r.zones.find(z=>z.source==='troupe-melee'&&z.owner===m.id);
  assert.ok(warning,'visual-only pre-swing lane');
  assert.equal(warning.visual,true);
  assert.equal(warning.damage,0,'no invisible ranged hitbox');
  assert.ok(warning.warn>=1.1);
  assert.ok(r.hits.length>=minHits,'close strikes actually connect');
  assert.ok(r.hits.every(hit=>hit.at>=cast.at+cast.wind-1/60),
   'no damage may precede the visible melee windup');
  assert.ok(r.hits.every(hit=>hit.damage>0&&hit.damage<=CIRCUS_ROLES[role].attack));
 });
 test(role+' misses when the player retreats during the windup',()=>{
  const r=perform(setup(stage,role),3.1,{escape:true});
  assert.equal(r.hits.length,0);
 });
}
test('new frontliners have attached physical weapons in the troupe PBR rig',()=>{
 const {g}=setup(2,'bladeDancer'),scene=new THREE.Scene();
 const view=createCircusTroupeView(scene,{coarse:true});
 view.update(g,1/60);
 assert.ok(view.root.getObjectByName('strongman-weighted-stage-mallet'));
 assert.ok(view.root.getObjectByName('blade-dancer-handheld-scythe'));
 assert.ok(view.root.getObjectByName('blade-dancer-torn-feather-plume'));
 view.dispose();
});
