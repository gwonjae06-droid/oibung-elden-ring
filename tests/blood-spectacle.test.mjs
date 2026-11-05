import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,hazardContains} from '../src/blood-data.mjs';
import {bloodSculptureGeometries} from '../src/blood-sculpture.mjs';
const NEW=['lances','cross','judgement','ritual'];
test('all four new attacks allow a continuous walking route from eight starting directions',()=>{
 for(const id of NEW)for(let direction=0;direction<8;direction++){
  const g=createBloodGame();g.boss.phase=BLOOD_PATTERNS[id].phase;const a=direction*Math.PI/4;g.player.x=Math.round(Math.sin(a)*20/2)*2;g.player.z=Math.round(Math.cos(a)*20/2)*2;startBloodPattern(g,id);
  const hazards=g.blood.hazards;let points=new Map([[g.player.x+','+g.player.z,{x:g.player.x,z:g.player.z}]]);
  for(let t=0;t<BLOOD_PATTERNS[id].duration;t+=.25){const next=new Map();for(const p of points.values())for(const[dX,dZ]of [[0,0],[2,0],[-2,0],[0,2],[0,-2]]){const q={x:p.x+dX,z:p.z+dZ};if(Math.hypot(q.x,q.z)>26)continue;let safe=true;for(let tick=1;tick<=5&&safe;tick++){const age=t+tick*.05,where={x:p.x+dX*tick/5,z:p.z+dZ*tick/5};for(const h of hazards)if(age>=h.warn&&age<=h.warn+h.life&&hazardContains({...h,age},where)){safe=false;break;}}if(safe)next.set(q.x+','+q.z,q);}assert.ok(next.size,id+' trapped start '+direction+' at '+t);points=next;}
 }
});
test('enlarged blood spells have intentionally wider collision footprints',()=>{
 const g=createBloodGame();startBloodPattern(g,'wave');assert.equal(g.blood.hazards[0].width,6);assert.ok(hazardContains({...g.blood.hazards[0],age:0},{x:5.5,z:-5}));
 startBloodPattern(g,'burst');assert.equal(g.blood.hazards[0].r,14);g.boss.phase=2;startBloodPattern(g,'wing');assert.equal(g.blood.hazards[0].r,19);
});
test('liquid sculpture uses finite authored buffers and stays within its shared polygon budget',()=>{
 for(const segments of[12,20]){const geometry=bloodSculptureGeometries(segments);let triangles=0;for(const g of Object.values(geometry)){assert.equal(g.type,'BufferGeometry');triangles+=g.index.count/3;for(const v of g.attributes.position.array)assert.ok(Number.isFinite(v));g.dispose();}assert.ok(triangles<=9000,'shared triangles '+triangles);}
});
