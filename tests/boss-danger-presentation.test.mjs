import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGame,patternConfig} from '../src/combat.mjs';
import {kwonDangerLevel,createKwonDangerVeil} from '../src/kwon-danger-veil.mjs';
import {clownDangerSpotlightCue,clownSpotlightLayout,createClownDangerSpotlight} from '../src/clown-danger-spotlight.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test('Kwon screen shading only signals an impending hit inside the actual danger zone',()=>{
 const g=createGame('sword',{register:false,seed:10}),b=g.boss,p=g.player;
 b.pattern='stomp';b.state='windup';b.t=patternConfig(b).wind*.65;
 p.x=b.x;p.z=b.z;p.invuln=0;p.action=null;
 const inside=kwonDangerLevel(g);
 assert.ok(inside>.25&&inside<=1);
 p.x=b.x+8;assert.equal(kwonDangerLevel(g),0,'no warning outside the real hit zone');
 p.x=b.x;p.invuln=.4;assert.equal(kwonDangerLevel(g),0,'invulnerable player is not warned');
 p.invuln=0;p.action={kind:'roll',t:.1,total:.6};
 assert.equal(kwonDangerLevel(g),0,'successful dodge window suppresses the warning');
 p.action=null;b.state='active';assert.equal(kwonDangerLevel(g),0,'no stale pre-hit vignette during impact');
 b.state='windup';b.pattern='wave';assert.equal(kwonDangerLevel(g),0,'projectile-only attack must not show an invented area');
 g.status='won';assert.equal(kwonDangerLevel(g),0);
});

test('Kwon danger veil eases in and out without altering player/boss simulation',()=>{
 const children=[],doc={createElement(){return {style:{},setAttribute(){},remove(){this.removed=true;}}}};
 const host={ownerDocument:doc,appendChild(el){children.push(el);}};
 const fx=createKwonDangerVeil(host),g=createGame('sword',{register:false,seed:12});
 const b=g.boss;b.pattern='stomp';b.state='windup';b.t=patternConfig(b).wind*.8;
 g.player.x=b.x;g.player.z=b.z;g.player.action=null;g.player.invuln=0;
 const before={hp:g.player.hp,x:b.x,z:b.z};
 for(let i=0;i<15;i++)fx.update(g,1/60);
 const lit=Number(fx.element.style.opacity);
 assert.ok(lit>.1&&lit<.6);
 g.player.x+=10;for(let i=0;i<30;i++)fx.update(g,1/60);
 assert.ok(Number(fx.element.style.opacity)<lit*.1,'warning fades smoothly after leaving danger');
 assert.deepEqual({hp:g.player.hp,x:b.x,z:b.z},before,'purely visual warning never alters combat');
 fx.clear();assert.equal(fx.element.style.opacity,'0');
 fx.dispose();assert.equal(fx.element.removed,true);
});

test('Clown spots cover the actual circle, forward lane and sector without new zones',()=>{
 const base={id:9,shape:'circle',x:2,z:5,r:6,damage:28,warn:1,age:.4,state:'warn'};
 assert.equal(clownDangerSpotlightCue(base),true);
 assert.equal(clownDangerSpotlightCue({...base,state:'burst'}),false);
 assert.equal(clownDangerSpotlightCue({...base,visual:true}),false);
 assert.equal(clownDangerSpotlightCue({...base,waveKind:'clap'}),false);
 assert.equal(clownDangerSpotlightCue({...base,damage:0}),false);
 assert.equal(clownDangerSpotlightCue({...base,damage:0,kind:'push'}),true);
 let L=clownSpotlightLayout(base);assert.deepEqual([L.x,L.z,L.sx,L.sz,L.shape],[2,5,6,6,0]);
 L=clownSpotlightLayout({...base,shape:'lane',x:0,z:0,yaw:0,len:12,w:4});
 assert.deepEqual([L.x,L.z,L.sx,L.sz,L.shape],[0,6,2,6,1]);
 L=clownSpotlightLayout({...base,shape:'cone',x:0,z:0,yaw:0,r:8,half:.3});
 assert.equal(L.shape,2);assert.equal(L.half,.3);
 const scene=new THREE.Scene(),q=createClownDangerSpotlight(THREE,scene,base);
 const floor=q.getObjectByName('clown-spotlit-danger-footprint');
 assert.ok(floor?.material?.isShaderMaterial);
 assert.ok(floor.material.uniforms.uAlpha.value>0);
 q.userData.spotlightUpdate({...base,shape:'lane',yaw:0,len:12,w:4});
 assert.equal(floor.material.uniforms.uShape.value,1);
 assert.deepEqual([floor.scale.x,floor.scale.z],[2,6]);
 q.userData.spotlightUpdate({...base,state:'burst'});
 assert.equal(q.visible,false,'light switches off on attack impact');
 assert.equal(scene.children.length,1);
 q.parent.remove(q);assert.deepEqual(disposeScene(q).errors,[]);
});

test('Baeseojun live view contains no thick helical black body coils',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true});
 let found=false;scene.traverse(o=>{if(o.name==='blood-arterial-anatomical-vortex'||o.name==='blood-spiralling-3d-vessel')found=true;});
 assert.equal(found,false);
 assert.equal(view.stats().arterialVortex,undefined);
 view.dispose();
});
