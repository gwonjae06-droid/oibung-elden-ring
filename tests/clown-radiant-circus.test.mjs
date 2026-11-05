import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownCircusStage,CIRCUS_LAYOUT,CIRCUS_PALETTE} from '../src/clown-radiant-circus.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
const named=(scene,name)=>{const found=[];scene.traverse(o=>{if(o.name===name)found.push(o);});return found;};
const get=(scene,name)=>{const o=named(scene,name)[0];assert.ok(o,'Missing '+name);return o;};

test('bright circus constructs ivory-crimson floor, gold motifs and physical theatre backdrop',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene);
 const s=stage.stats();
 assert.equal(s.playableRadius,23);assert.equal(s.collidableProps,0);
 assert.ok(s.bulbs>=160);assert.ok(s.columns>=12);
 assert.equal(s.realSpotlights,2);
 assert.ok(CIRCUS_LAYOUT.columnsRadius>CIRCUS_LAYOUT.floorRadius);
 assert.ok(CIRCUS_LAYOUT.curtainsRadius>CIRCUS_LAYOUT.columnsRadius);
 for(const name of ['clown-radiant-nightmare-circus','circus-ivory-crimson-floor','circus-gold-floor-inlay',
 'circus-central-star-medallion','circus-gilded-radial-rays','circus-ivory-pilasters',
 'circus-pilaster-gold-capitals','circus-gilded-theatre-arch','circus-scalloped-velvet-curtain',
 'circus-curtain-gold-swag','circus-audience-tier','circus-silhouette-audience',
 'circus-instanced-marquee-bulbs','circus-marquee-lamp-halos','circus-gilded-chandelier',
 'circus-gold-follow-spot','circus-second-follow-spot','circus-soft-theatrical-light-shaft'])get(scene,name);
 assert.ok(named(scene,'circus-scalloped-velvet-curtain').length>=12);
 assert.equal(named(scene,'circus-gilded-chandelier').length,2);
 assert.ok(get(scene,'circus-ivory-crimson-floor').receiveShadow,'combatants must cast a visible shadow');
 assert.ok(get(scene,'circus-ivory-crimson-floor').geometry.getAttribute('color'));
 assert.ok(get(scene,'circus-instanced-marquee-bulbs').isInstancedMesh);
 assert.ok(get(scene,'circus-instanced-marquee-bulbs').instanceColor,'marquee must support phase coloration');
 const lamps=[];scene.traverse(x=>{if(x.isLight)lamps.push(x);});
 assert.equal(lamps.length,2,'do not simulate hundreds of real lamps');
 assert.ok(lamps.every(x=>!x.castShadow),'moving show spotlights must not allocate shadow maps');
 stage.dispose();stage.dispose();
 assert.equal(named(scene,'clown-radiant-nightmare-circus').length,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('light shows react to phase and attack events without touching the real boss game state',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene,{reduced:true});
 const game=createClownGame('sword');
 const before=structuredClone(game);
 const warm=stage.update(game,.016);
 assert.equal(warm.phase,1);assert.equal(warm.mode,'gold');
 const bulb=get(scene,'circus-instanced-marquee-bulbs'),c=new THREE.Color();
 bulb.getColorAt(3,c);const warmHex=c.getHex();
 stage.event({type:'clown-blast',x:10,z:12},game);
 assert.equal(stage.update(game,.016).mode,'crimson');
 assert.ok(stage.lights.left.intensity>0);
 stage.event({type:'clown-clap'},game);
 assert.equal(stage.update(game,.016).mode,'gold');
 game.boss.phase=2;
 stage.event({type:'phase'},game);
 const frenzy=stage.update(game,.016);
 assert.equal(frenzy.phase,2);
 bulb.getColorAt(3,c);
 assert.notEqual(c.getHex(),warmHex,'phase two should recolor marquee');
 assert.equal(stage.lights.left.color.getHex(),0xff9fcb);
 assert.equal(stage.lights.right.color.getHex(),0x8de5dc);
 assert.equal(game.player.hp,before.player.hp);
 assert.equal(game.boss.hp,before.boss.hp);
 assert.deepEqual(game.events,before.events,'lighting is visual-only');
 stage.reset();assert.equal(stage.phase,1);
 stage.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('mobile builds fewer static props, keeps the same floor radius, disables expensive secondary lighting',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene,{coarse:true,reduced:true});
 const s=stage.stats();
 assert.equal(s.bulbs,96);assert.equal(s.columns,12);
 assert.equal(stage.lights.right.intensity,0);
 assert.equal(named(scene,'circus-soft-theatrical-light-shaft').length,0);
 assert.equal(named(scene,'circus-instanced-marquee-bulbs')[0].count,96);
 const game=createClownGame();
 for(let i=0;i<50;i++){game.time+=.016;stage.update(game,.016);}
 game.boss.phase=2;stage.update(game,.016);
 assert.equal(stage.phase,2);
 stage.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('curtains, pillars, gallery and chandelier anchors stay outside the playable floor',()=>{
 const scene=new THREE.Scene(),stage=createClownCircusStage(scene,{coarse:true});
 const pillar=get(scene,'circus-ivory-pilasters'),p=new THREE.Vector3(),r=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 for(let i=0;i<pillar.count;i++){
  pillar.getMatrixAt(i,matrix);matrix.decompose(p,r,scale);
  assert.ok(Math.hypot(p.x,p.z)>CIRCUS_LAYOUT.floorRadius,'column encroaches on combat');
 }
 for(const name of ['circus-gilded-chandelier','circus-audience-tier']){
  for(const item of named(scene,name))assert.ok(item.position.y>1,'decor should not block the floor');
 }
 assert.ok(CIRCUS_PALETTE.cream>CIRCUS_PALETTE.crimson);
 stage.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
