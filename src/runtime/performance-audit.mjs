// Runtime frame diagnostics. Sampling is read-only and never touches damage,
// physics, cinematics or render scale. Findings are hypotheses, not GPU timings.
const finite=(x,defaultValue=0)=>Number.isFinite(x)?x:defaultValue;
export function interpretFrameStats({boss,phase,pattern,frameMs,renderCalls,triangles,geometries,textures,heapGrowthMB,scale}){
 const samples=frameMs.filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
 const median=samples[Math.floor(samples.length*.5)]??0,p95=samples[Math.floor(samples.length*.95)]??0;
 const avg=samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length);
 const suspects=[];
 if(renderCalls>450)suspects.push('draw-call count: CPU/WebGL command overhead possible');
 if(triangles>1_000_000)suspects.push('high visible triangle count: geometry or vertex cost possible');
 if(textures>120||geometries>500)suspects.push('resident GPU resources: memory or startup pressure possible');
 if(heapGrowthMB>48)suspects.push('JavaScript heap growth: allocation or garbage collection possible');
 if(scale<.81&&p95>30)suspects.push('slow even after pixel-scale reduction: likely not fill rate alone');
 if(!suspects.length)suspects.push('bottleneck undetermined; collect Chrome Performance and GPU traces');
 return {boss,phase,pattern,medianFrameMs:+median.toFixed(1),p95FrameMs:+p95.toFixed(1),
  avgFps:avg>0?+(1000/avg).toFixed(1):0,renderCalls,triangles,geometries,textures,
  heapGrowthMB:+heapGrowthMB.toFixed(1),renderScale:scale,
  evidence:'Frame durations and Three.js render counters (not separate CPU/GPU timing).',
  status:p95>30||median>25?'slow':'normal',confirmedCause:null,suspectedCauses:suspects};
}
export function createFramePerformanceAudit({renderer,boss,onReport=report=>console.warn('[오든링 렉 원인 조사 · 실측/추정 구분]',report),windowSize=120,reportEvery=10}={}){
 const samples=[];let elapsed=0,lastReport=-Infinity,last=null,initialHeap=null;
 const heap=()=>finite(globalThis.performance?.memory?.usedJSHeapSize,0)/1048576;
 function reset(){samples.length=0;elapsed=0;lastReport=-Infinity;last=null;initialHeap=null;}
 function sample(dt,{active=true,phase=1,pattern='',scale=1}={}){
  if(!active||!Number.isFinite(dt)||dt<=0){samples.length=0;return null;}
  if(initialHeap===null)initialHeap=heap();
  elapsed+=dt;samples.push(Math.min(100,dt*1000));if(samples.length>windowSize)samples.shift();
  if(samples.length<windowSize||elapsed-lastReport<reportEvery)return null;
  const r=renderer?.info?.render??{},m=renderer?.info?.memory??{};
  last=interpretFrameStats({boss,phase,pattern,frameMs:samples,renderCalls:finite(r.calls),triangles:finite(r.triangles),
   geometries:finite(m.geometries),textures:finite(m.textures),heapGrowthMB:Math.max(0,heap()-(initialHeap||0)),scale});
  lastReport=elapsed;
  if(last.status==='slow')onReport(last);
  return last;
 }
 return {sample,reset,get snapshot(){return last;}};
}
