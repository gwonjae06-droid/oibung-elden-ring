import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,actGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {tickPlayerAction,advancePlayerProjectile} from '../src/player-combat.mjs';
import {createPlayerProjectileView} from '../src/player-projectile-view.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';

const launch=weapon=>{
 const g=createGyuwonGame(weapon,{yearMode:true,seed:41});
 g.player.floorY=1.7;g.player.invuln=100;
 if(weapon==='sword')g.evolutions=['blade-wave'];
 assert.equal(actGyuwon(g,'light'),true,weapon+' must accept a real player attack');
 tickPlayerAction(g,WEAPONS[weapon].wind+.025,WEAPONS[weapon]);
 assert.ok(g.projectiles.length>0,weapon+' projectile must be emitted by combat');
 return g;
};

test('Gyuwon draws real bow arrows, cards and upgraded sword waves with shared 3D assets',()=>{
 const scene=new THREE.Scene(),view=createPlayerProjectileView(scene);
 try{
  for(const [weapon,kind,expected] of [['bow','bow',1],['cards','cards',3],['sword','wave',1]]){
   const g=launch(weapon),before=JSON.stringify(g.projectiles);
   assert.equal(g.projectiles.length,expected);
   assert.ok(g.projectiles.every(q=>q.kind===kind&&q.y===2.9));
   view.update(g,.016);
   assert.equal(view.stats().active,expected,weapon+' visual projectiles missing');
   assert.equal(view.root.children.length,expected);
   for(let i=0;i<expected;i++){
    const node=view.root.children[i],projectile=g.projectiles[i];
    assert.equal(node.position.x,projectile.x);
    assert.equal(node.position.y,projectile.y,'raised floors must carry arrows and waves');
    assert.equal(node.position.z,projectile.z);
    assert.ok(node.visible&&node.children.length>0||node.isMesh);
   }
   assert.equal(JSON.stringify(g.projectiles),before,'rendering must not mutate hit registration');
   view.clear();assert.equal(view.stats().active,0);
  }
 }finally{view.dispose();}
 assert.equal(scene.getObjectByName('shared-player-projectiles'),undefined);
});

test('Gyuwon projectile VFX follows simulated hits, survives recycled IDs and clears on retry',()=>{
 const scene=new THREE.Scene(),view=createPlayerProjectileView(scene);
 try{
  const first=launch('bow'),q=first.projectiles[0];
  view.update(first);assert.equal(view.stats().active,1);
  const prior=view.root.children[0].position.clone();
  advancePlayerProjectile(q,.08);
  view.update(first,.08);
  assert.ok(view.root.children[0].position.distanceTo(prior)>1);
  first.projectiles.length=0;view.update(first);assert.equal(view.stats().active,0);
  const second=launch('cards');assert.equal(second.projectiles[0].id,q.id);
  view.update(second);
  assert.equal(view.stats().active,3,'new game must not retain old arrow mesh');
  assert.equal(view.root.children.length,3);
  view.clear();assert.equal(view.root.children.length,0);
 }finally{view.dispose();}
});

test('Gyuwon renderer supports returning hammer and lit bow variants as physical world meshes',()=>{
 const scene=new THREE.Scene(),view=createPlayerProjectileView(scene);
 try{
  const g=createGyuwonGame('hammer',{yearMode:true});
  g.player.floorY=1.7;g.evolutions=['blood-hammer'];
  assert.equal(actGyuwon(g,'skill'),true,'real returning-hammer skill must activate');
  tickPlayerAction(g,.26,WEAPONS.hammer);
  assert.equal(g.projectiles.length,1);
  assert.equal(g.projectiles[0].kind,'hammer-throw');
  assert.equal(g.projectiles[0].y,3.2,'hammer flies above the folded floor');
  view.update(g);
  assert.equal(view.stats().active,1);
  assert.equal(view.root.children[0].name,'player-returning-hammer');
  g.projectiles.length=0;view.update(g);
  const bow=createGyuwonGame('bow',{yearMode:true});
  bow.projectiles.push({id:1,kind:'bow',x:0,z:10,y:1.2,yaw:0,life:2,fireRank:1});
  view.update(bow);
  assert.equal(view.stats().active,1);
  assert.ok(view.root.children[0].getObjectByName('player-fire-arrow-flame'));
 }finally{view.dispose();}
});
