// Passive event-only input aggregate. No key stream, cursor coordinates or
// private text is persisted or sent. These signals suggest automation; they
// DO NOT establish that a person used AI, and never block controls.
const ACTION_KEYS=new Set(['KeyJ','KeyL','KeyK','KeyE','KeyQ','Space']);
const MIN_REPORT_MS=15000;
export function eventActionFromInput(event){
 if(event.type==='keydown'){
  if(event.repeat||!ACTION_KEYS.has(event.code))return null;
  return event.code;
 }
 if(event.type!=='pointerdown')return null;
 const nodes=typeof event.composedPath==='function'?event.composedPath():[];
 const hit=nodes.find(node=>node?.dataset?.act||node?.id==='world');
 if(!hit)return null;
 // A pointer on a touchscreen joystick is a movement hold, not a rapid attack.
 const action=hit.dataset?.act;
 return action?'button:'+action:'world-click';
}
export function createEventInputMonitor({clock=()=>performance.now(),send=()=>Promise.resolve(),periodMs=45000}={}){
 let since=clock(),total=0,synthetic=0,rapid=0,cadence=0,lastAny=-Infinity;
 const history=new Map();
 let pending=Promise.resolve();
 const reset=(now=clock())=>{since=now;total=0;synthetic=0;rapid=0;cadence=0;lastAny=-Infinity;history.clear();};
 function record(action,{trusted=true,repeat=false}={}){
  if(!action||repeat)return;
  const now=clock();
  if(now<since)reset(now);
  if(now-since>=periodMs)void flush(now);
  total++;
  if(trusted===false)synthetic++;
  // Exclude simultaneous presses; only repeated implausibly fast actions.
  if(now-lastAny>=0&&now-lastAny<12)rapid++;
  lastAny=now;
  const h=history.get(action)||[];
  h.push(now);
  if(h.length>9)h.shift();
  if(h.length>=9){
   const intervals=h.slice(1).map((t,i)=>t-h[i]);
   const mean=intervals.reduce((a,b)=>a+b,0)/intervals.length;
   const variance=intervals.reduce((a,b)=>a+(b-mean)**2,0)/intervals.length;
   if(mean>=65&&mean<=480&&variance<=1.5**2)cadence++;
  }
  history.set(action,h);
 }
 function flush(now=clock()){
  const durationMs=Math.max(0,Math.floor(now-since));
  const report={durationMs,events:total,untrusted:synthetic,rapid,cadence};
  reset(now);
  if(durationMs<MIN_REPORT_MS||report.events<12)return Promise.resolve(null);
  // Reports are serialized, but the monitor never waits before accepting input.
  const job=pending.catch(()=>{}).then(()=>send(report));
  pending=job;
  return job;
 }
 return {record,flush,reset,snapshot:()=>({durationMs:Math.max(0,Math.floor(clock()-since)),events:total,untrusted:synthetic,rapid,cadence})};
}
