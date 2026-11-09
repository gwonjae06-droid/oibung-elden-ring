import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardContains} from '../src/blood-data.mjs';
import {createBloodSeraph} from '../src/blood-seraph.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {bloodSeraphSanctity} from '../src/blood-seraph-sanctity.mjs';
import {publishBloodSeraphChoir,resetBloodSeraphChoir,
 bloodSeraphChoirCue} from '../src/blood-seraph-choir.mjs';

const names=['seraphSweep','seraphWingCross','seraphInwardPillars',
 'seraphFrenzy','seraphHaloProcession','seraphBloodRosette'];
function game(id='seraphSweep'){
 const g=createBloodGame('sword',{seed:478});
 g.boss.phase=3;g.boss.state='recovery';
 g.blood.seraphAwakened=true;
 g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
 g.player.hp=g.player.maxHp=100000;g.player.invuln=10000;
 if(id)assert.ok(startBloodPattern(g,id));
 return g;
}

test('all six Seraph-exclusive attacks are significantly larger without touching earlier phases',()=>{
 assert.equal(bloodPool(1).length,13);
 assert.equal(bloodPool(2).length,14);
 assert.deepEqual(bloodPool(3),[...names,'seraphFinale']);
 const [sweep]=game(names[0]).blood.hazards;
 assert.ok(sweep.width>=4.1&&sweep.length>=64&&sweep.warn>=1.8);
 const wings=game(names[1]).blood.hazards;
 assert.equal(wings.length,4);
 assert.ok(wings.every(h=>h.width>=5.6&&h.length>=14.8&&h.warn>=1.8));
 const pillars=game(names[2]).blood.hazards;
 assert.equal(pillars.length,4);
 assert.ok(pillars.every(h=>h.width>=5&&h.shape==='ring'&&h.r-h.width*.72>5));
 const frenzy=game(names[3]).blood.hazards;
 assert.equal(frenzy.length,11);
 assert.ok(frenzy.every(h=>h.width>=3&&h.warn>=1.5));
 const halos=game(names[4]).blood.hazards;
 assert.equal(halos.length,4);
 assert.ok(halos.every(h=>h.r>=6.5&&h.width>=3.2));
 const petals=game(names[5]).blood.hazards;
 assert.equal(petals.length,6);
 assert.ok(petals.every(h=>h.arc>=.52&&h.r>=30));
 const finale=game('seraphFinale').blood.hazards;
 assert.ok(finale.filter(h=>h.shape==='cone').every(h=>h.arc>=.6));
 assert.ok(finale.filter(h=>h.shape==='ring').every(h=>h.width>=2.8));
});

// A coarse, conservative on-foot solver rather than checking whether some
// unreachable point happens to be safe. 2m every .25s = 8m/s.
test('every colossal pattern admits a continuous, on-foot, non-invulnerable evasive route',()=>{
 const step=.25,cell=2,speeds=[[0,0],[cell,0],[-cell,0],[0,cell],[0,-cell]];
 for(const name of [...names,'seraphFinale']){
  const g=game(name),hs=g.blood.hazards,duration=BLOOD_PATTERNS[name].duration;
  const isSafe=(x,z,t)=>{
   if(Math.hypot(x,z)>28)return false;
   for(const h of hs){
    h.age=t;
    if(t>=h.warn&&t<h.warn+h.life&&hazardContains(h,{x,z}))return false;
   }
   return true;
  };
  let reachable=new Set(['0,14']);
  for(let t=step;t<duration;t+=step){
   const next=new Set();
   for(const key of reachable){
    const [x,z]=key.split(',').map(Number);
    for(const [dx,dz] of speeds){
     const nx=x+dx,nz=z+dz;
     if(!isSafe(nx,nz,t))continue;
     // Continuous movement can encounter a warning turning live midway.
     if(!isSafe(x+dx*.5,z+dz*.5,t-step*.5))continue;
     next.add(nx+','+nz);
    }
   }
   assert.ok(next.size>0, name+' has no reachable dodge route at '+t.toFixed(2)+'s');
   reachable=next;
  }
 }
});

test('the only moving part in idle is the slow 3bae face, not a spinning boss torso',()=>{
 const g=game();
 g.boss.state='recovery';g.blood.hazards.length=0;
 g.player.x=20;g.player.z=0;
 g.boss.yaw=0;const originalYaw=g.boss.yaw;
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  rig.update(g,bloodTransformation(g),.1);
  const first=rig.stats().faceYaw;
  assert.ok(first>0&&first<.5,'head should begin a gradual turn');
  for(let i=0;i<16;i++)rig.update(g,bloodTransformation(g),.1);
  assert.ok(rig.stats().faceYaw>first);
  assert.equal(g.boss.yaw,originalYaw,'visual head turning must not move real combat body');
  assert.equal(rig.root.rotation.y,originalYaw);
  const face=scene.getObjectByName('blood-seraph-3bae-sculpted-visage');
  assert.ok(face&&face.rotation.y>.5);
 }finally{rig.dispose();}
});

test('sacred teleport dissolves and reassembles actual 3D feather instances',()=>{
 const g=game();g.boss.state='recovery';g.blood.hazards.length=0;
 g.blood.seraphBlink={age:.25,duration:.62,from:{x:-12,z:8},to:{x:0,z:0}};
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  rig.update(g,bloodTransformation(g),.05);
  assert.equal(rig.stats().teleportFeathersVisible,true);
  assert.ok(scene.getObjectByName('blood-seraph-dissolve-reassemble-feathers')?.isInstancedMesh);
  assert.equal(rig.stats().teleportRingsVisible,2);
  g.blood.seraphBlink=null;rig.update(g,bloodTransformation(g),.05);
  assert.equal(rig.stats().teleportFeathersVisible,false);
 }finally{rig.dispose();}
 assert.equal(scene.getObjectByName('blood-seraph-dissolve-reassemble-feathers'),undefined);
});

test('real MP3 choral swells intensify white-gold light, halo spin and wing spread without altering damage',()=>{
 resetBloodSeraphChoir();
 const g=game('seraphSweep'),health=g.boss.hp;
 const neutral=bloodSeraphSanctity(g);
 assert.equal(neutral.choir,0);
 publishBloodSeraphChoir({seconds:180,energy:.9,crescendo:.83,accent:.75,source:'audio'});
 const musical=bloodSeraphSanctity(g);
 assert.ok(musical.choir>.7);
 assert.ok(musical.haloSpeed>neutral.haloSpeed+1.5);
 assert.ok(musical.wingSpread>neutral.wingSpread+.2);
 assert.ok(musical.brightness>=neutral.brightness);
 assert.equal(g.boss.hp,health);
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  rig.update(g,bloodTransformation(g),.1);
  assert.ok(rig.stats().haloPulse>.7);
  assert.equal(rig.stats().musicSource,'audio');
 }finally{rig.dispose();resetBloodSeraphChoir();}
});

test('music readout expires if user mutes the soundtrack; no fake choir peaks',()=>{
 resetBloodSeraphChoir();
 publishBloodSeraphChoir({seconds:211.25,energy:.8,crescendo:1,accent:.2,source:'audio'},100);
 assert.equal(bloodSeraphChoirCue(500).active,true);
 assert.equal(bloodSeraphChoirCue(750).active,false);
 resetBloodSeraphChoir();
 assert.equal(bloodSeraphChoirCue().active,false);
});
