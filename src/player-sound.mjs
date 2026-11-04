import {soundVariation} from './sound-variation.mjs';
import {audioChannelGain} from './audio-preferences.mjs';
import {playerSoundRecipe} from './player-presentation.mjs';
export function createPlayerSound({getContext,getDestination=ctx=>ctx.destination,win=globalThis,doc=globalThis.document,listenForGestures=true,muted=()=>{try{return globalThis.localStorage?.getItem('oibung-muted')==='1';}catch{return false;}},random=Math.random}={}){
 let ctx=null,bus=null,noise=null,disposed=false,completion=null;const active=new Set(),last=new Map(),infrastructure=new Set(),removers=[],errors=[];
 const safe=fn=>{try{return fn();}catch(error){errors.push(error);}};
 const allowed=()=>!disposed&&!muted()&&!doc?.hidden;
 function dropInfrastructure(){for(const n of infrastructure)safe(()=>n.disconnect());infrastructure.clear();bus=null;noise=null;}
 function ensure(){
  if(!allowed())return false;
  try{if(!ctx){if(getContext)ctx=getContext();else{const C=win.AudioContext||win.webkitAudioContext;if(!C)return false;ctx=new C();}}if(!ctx||disposed||ctx.state==='closed')return false;
   if(!bus||!noise){dropInfrastructure();bus=ctx.createGain();infrastructure.add(bus);bus.gain.value=.8*audioChannelGain('effects');const comp=ctx.createDynamicsCompressor();infrastructure.add(comp);bus.connect(comp);comp.connect(getDestination(ctx));noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
   ctx.resume?.()?.catch(()=>{});return !disposed&&ctx?.state==='running';
  }catch{dropInfrastructure();return false;}
 }
 function release(q){if(q.done)return;q.done=true;active.delete(q);if(q.s){safe(()=>{q.s.onended=null;});try{q.s.stop();}catch{}safe(()=>q.s.disconnect());}safe(()=>q.f?.disconnect());safe(()=>q.g?.disconnect());}
 function reset(){for(const q of [...active])release(q);active.clear();last.clear();}
 function clear(){if(!disposed)reset();}
 function update(){if(!disposed&&(muted()||doc?.hidden))reset();}
 function play(key,weapon){
  if(!allowed()||!ensure()||active.size>12)return false;bus.gain.value=.8*audioChannelGain('effects');const t=ctx.currentTime;if(t-(last.get(key)??-Infinity)<.09)return false;last.set(key,t);const j=soundVariation(random);
  for(const [kind,f,to,dur,vol] of playerSoundRecipe(key,weapon)){
   if(disposed||active.size>=16)break;const q={s:null,g:null,f:null,done:false};
   try{q.s=kind==='n'?ctx.createBufferSource():ctx.createOscillator();q.g=ctx.createGain();const end=t+dur/j.speed;
    if(kind==='n'){q.s.buffer=noise;q.f=ctx.createBiquadFilter();q.f.type='bandpass';q.f.frequency.setValueAtTime(f*j.pitch,t);q.f.frequency.exponentialRampToValueAtTime(to*j.pitch,end);q.s.connect(q.f);q.f.connect(q.g);}else{q.s.type='triangle';q.s.frequency.setValueAtTime(f*j.pitch,t);q.s.frequency.exponentialRampToValueAtTime(to*j.pitch,end);q.s.connect(q.g);}
    q.g.gain.setValueAtTime(.0001,t);q.g.gain.linearRampToValueAtTime(vol*j.gain,t+.004);q.g.gain.exponentialRampToValueAtTime(.0001,end);q.g.connect(bus);if(disposed){release(q);break;}active.add(q);q.s.onended=()=>release(q);q.s.start(t);q.s.stop(end+.02);
   }catch{release(q);}
  }return !disposed;
 }
 function dispose(){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;for(const remove of removers.splice(0))safe(remove);reset();dropInfrastructure();const old=ctx;ctx=null;
  try{Promise.resolve(getContext?undefined:old?.close?.()).then(()=>finish({errors:[...errors]}),error=>{errors.push(error);finish({errors:[...errors]});});}catch(error){errors.push(error);finish({errors:[...errors]});}return completion;
 }
 if(listenForGestures&&win.addEventListener){try{for(const type of ['pointerdown','keydown']){win.addEventListener(type,ensure,{capture:true,passive:true});removers.push(()=>win.removeEventListener(type,ensure,true));}}catch(error){dispose();throw error;}}
 return {play,clear,update,unlock:ensure,dispose,get disposed(){return disposed;},get activeCount(){return active.size;}};
}
