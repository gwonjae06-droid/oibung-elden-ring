import test from 'node:test';
import assert from 'node:assert/strict';
import {createFramePerformanceAudit,interpretFrameStats} from '../src/runtime/performance-audit.mjs';
const fake=(calls=700,triangles=1400000)=>({info:{render:{calls,triangles},memory:{geometries:600,textures:130}}});
test('lag reports measured frame time and suspected bottlenecks without claiming CPU or GPU certainty',()=>{
 const reports=[],audit=createFramePerformanceAudit({renderer:fake(),boss:'clown',onReport:r=>reports.push(r)});
 for(let i=0;i<140;i++)audit.sample(1/25,{phase:2,pattern:'feralSkitter',active:true,scale:.7});
 assert.equal(reports.length,1);
 const r=reports[0];assert.equal(r.status,'slow');assert.equal(r.boss,'clown');
 assert.equal(r.phase,2);assert.equal(r.pattern,'feralSkitter');assert.equal(r.renderCalls,700);
 assert.ok(r.suspectedCauses.length>=3);assert.equal(r.confirmedCause,null);
 audit.reset();assert.equal(audit.snapshot,null);
});
test('60fps battle does not issue lag warning; paused frames are excluded',()=>{
 const out=[],audit=createFramePerformanceAudit({renderer:fake(80,90000),boss:'kwon',onReport:r=>out.push(r)});
 for(let i=0;i<220;i++)audit.sample(1/60,{active:true});
 audit.sample(1/25,{active:false});
 assert.equal(out.length,0);
 const r=interpretFrameStats({boss:'kwon',phase:1,pattern:'',frameMs:[16,16,17],renderCalls:50,triangles:30000,geometries:12,textures:8,heapGrowthMB:0,scale:1});
 assert.equal(r.status,'normal');assert.equal(r.confirmedCause,null);
});
