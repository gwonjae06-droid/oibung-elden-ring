import test from 'node:test';import assert from 'node:assert/strict';
import {groundContactFace,segmentSquareHit} from '../src/dice-ground-face.mjs';
const s=Math.SQRT1_2;
test('bottom counts and the zero portrait survive the attack replacement',()=>{for(const [q,count]of [[[0,0,0,1],5],[[0,0,-s,s],0],[[0,0,s,s],6],[[s,0,0,s],3],[[-s,0,0,s],4],[[1,0,0,0],2]])assert.equal(groundContactFace({y:6,rotation:q}).pips,count);});
test('airborne dice do not start new face attacks',()=>assert.equal(groundContactFace({y:12,rotation:[0,0,0,1]}),null));
test('fast projectile segments cannot tunnel through the player',()=>{assert.equal(segmentSquareHit({x:-10,z:0},{x:10,z:0},{x:0,z:0},.8),true);assert.equal(segmentSquareHit({x:-10,z:2},{x:10,z:2},{x:0,z:0},.8),false);assert.equal(segmentSquareHit({x:0,z:0},{x:0,z:0},{x:0,z:0},.8),true);});

import {stepPortraitBarrage,PORTRAIT_BARRAGE as P} from '../src/dice-portrait-barrage.mjs';
const make=()=>({status:'playing',boss:{hp:3000,maxHp:3000},events:[],player:{x:20,z:0,hp:120,invuln:0},dice:{state:'charge',t:.2,pose:{x:0,y:6,z:0,rotation:[0,0,0,1]}}});
function advance(g,t,frozen=false){for(let left=t;left>1e-9;){const dt=Math.min(.05,left);stepPortraitBarrage(g,dt,frozen);left-=dt;}}
test('portrait volley creates exactly the bottom pip count and locks its aim',()=>{const g=make();advance(g,.05);assert.equal(g.dice.groundSpikes.count,5);const target={...g.dice.groundSpikes.target},dirs=g.dice.groundSpikes.cards.map(c=>[c.dx,c.dz]);g.player.z=20;advance(g,.8);assert.deepEqual(g.dice.groundSpikes.target,target);assert.deepEqual(g.dice.groundSpikes.cards.map(c=>[c.dx,c.dz]),dirs);assert.equal(g.player.hp,120);});
test('volley emits staggered finite projectiles and cannot hit the same card twice',()=>{const g=make();advance(g,4.5);assert.ok(g.events.some(e=>e.type==='dice-portrait-barrage'));assert.ok(g.player.hp<120);assert.ok(g.events.filter(e=>e.source==='dice-portrait').length<=5);assert.equal(g.dice.state,'charge');assert.equal(g.dice.t,.2);});
test('photo bottom cancels the volley and freeze preserves its timer',()=>{const g=make();advance(g,.2);const t=g.dice.groundSpikes.t;advance(g,2,true);assert.equal(g.dice.groundSpikes.t,t);g.dice.pose.rotation=[0,0,-s,s];advance(g,5);assert.equal(g.dice.groundSpikes,null);assert.equal(g.player.hp,120);});
test('dodging consumes a colliding card without damage and terminal hits stop once',()=>{const g=make();g.player.invuln=1;advance(g,4);assert.equal(g.player.hp,120);const h=make();h.player.hp=1;advance(h,4);assert.equal(h.status,'lost');assert.equal(h.events.filter(e=>e.type==='death').length,1);});
test('cooldown allows repetition and each warning snapshots the health tempo',()=>{const g=make();g.player.invuln=1;advance(g,.05);g.boss.hp=600;assert.equal(g.dice.groundSpikes.tempo,1);advance(g,10);assert.ok(g.events.filter(e=>e.type==='dice-portrait-warning').length>=2);assert.ok(P.cooldown>0);});

import {buildPortraitBarrageVisuals} from '../src/dice-portrait-fx.mjs';
class V{set(x,y,z){Object.assign(this,{x,y,z});return this;}}
class G{constructor(){this.children=[];this.position=new V();this.scale=new V();this.rotation={};}add(...o){this.children.push(...o);}}
class M extends G{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
class Geo{rotateX(){return this;}}
class Mat{constructor(p){Object.assign(this,p);}}
test('renderer pools six photo frames and square lanes with a shared texture',()=>{const root=new G(),texture={},api=buildPortraitBarrageVisuals({Group:G,Mesh:M,MeshBasicMaterial:Mat,MeshStandardMaterial:Mat,PlaneGeometry:Geo,BoxGeometry:Geo,TextureLoader:class{load(){return texture;}},DoubleSide:2},root),g=make();advance(g,.05);api.update(g);const children=root.children[0].children;assert.equal(children.filter(o=>o.visible).length,10);const cards=children.filter((_,i)=>i%2===0);assert.equal(cards[0].children[0].material.map,texture);assert.equal(cards[1].children[0].material.map,texture);g.status='won';api.update(g);assert.equal(root.children[0].visible,false);});
test('legacy entry points now re-export only the new behavior',async()=>{const m=await import('../src/dice-ground-spikes.mjs');assert.equal(m.stepGroundSpikes,stepPortraitBarrage);assert.equal(m.buildGroundSpikeVisuals,buildPortraitBarrageVisuals);});
