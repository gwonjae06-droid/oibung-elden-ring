// Bounded secondary inertia for visual joints only; never import from combat.
import {springStep} from './secondary-physics.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
export function createRecoilBank(){
 const channels=new Map();
 function step(key,drive,dt,{strength=1,frequency=15,limit=.07}={}){
  const signal=clamp(drive,-4,4),h=clamp(dt,0,.05);
  let s=channels.get(key);
  if(!s){s={signal,offset:0,velocity:0};channels.set(key,s);return 0;}
  if(!h)return s.offset;
  const kick=clamp(signal-s.signal,-2,2)*clamp(strength,0,4);
  s.signal=signal;
  const f=clamp(frequency,1,40),bound=clamp(limit,.001,.25);
  const next=springStep(s.offset,s.velocity+kick,0,h,f);
  s.offset=clamp(next.position,-bound,bound);
  s.velocity=clamp(next.velocity,-bound*f*7,bound*f*7);
  if(Math.abs(next.position)>bound&&Math.sign(s.offset)===Math.sign(s.velocity))s.velocity=0;
  return s.offset;
 }
 return {step,reset(){channels.clear();},get size(){return channels.size;}};
}
