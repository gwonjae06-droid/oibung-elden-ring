import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownBalletDuet} from '../src/clown-ballet-duet-view.mjs';
import {createClownGame} from '../src/clown-combat.mjs';

test('two complete male ballet sculptures enter together and reset cleanly',()=>{
 const scene=new THREE.Scene();
 const duet=createClownBalletDuet(scene,{coarse:true,reduced:true});
 const g=createClownGame('sword',{register:false});
 duet.prepareGpuWarmup();
 assert.equal(duet.root.visible,true);
 duet.finishGpuWarmup();
 assert.equal(duet.root.visible,false);
 g.boss.phase=3;g.boss.state='transition';g.boss.t=2.9;g.clown.state='transition';
 duet.update(g,1/60);
 assert.equal(duet.root.visible,true);
 assert.ok(duet.root.getObjectByName('o-seulwoo-male-ballet-dancer'));
 assert.ok(duet.root.getObjectByName('his-wood-carved-ballerino-spouse'));
 assert.ok(duet.root.getObjectByName('articulated-ballet-thigh'));
 assert.ok(duet.root.getObjectByName('anatomical-dancer-waist-ribcage-and-shoulders'));
 g.boss.state='clown';g.clown.state='idle';g.clown.pt=0;
 duet.update(g,1/60);
 const partner=duet.root.getObjectByName('his-wood-carved-ballerino-spouse');
 assert.ok(Number.isFinite(partner.position.x));
 assert.ok(Number.isFinite(partner.position.z));
 duet.reset();assert.equal(duet.root.visible,false);
 duet.dispose();assert.equal(scene.children.includes(duet.root),false);
});
