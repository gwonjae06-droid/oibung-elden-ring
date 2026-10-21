import {soundVariation} from './sound-variation.mjs';
import {playerSoundRecipe} from './player-presentation.mjs';
let ctx=null,bus=null,noise=null,listening=false;
function ensure(){try{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!ctx){if(!C)return false;ctx=new C();bus=ctx.createGain();bus.gain.value=.8;const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}ctx.resume()?.catch(()=>{});return ctx.state==='running';}catch{return false;}}
export function createPlayerSound(){
 if(!listening&&globalThis.addEventListener){listening=true;for(const type of ['pointerdown','keydown'])globalThis.addEventListener(type,ensure,{capture:true,passive:true});}
 const active=new Set(),last=new Map();
 const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}};
 function clear(){for(const q of [...active]){q.s.onended=null;try{q.s.stop();}catch{}q.s.disconnect();q.f?.disconnect();q.g.disconnect();}active.clear();last.clear();}
 function update(){if(muted()||globalThis.document?.hidden)clear();}
 function play(key,weapon){if(muted()||globalThis.document?.hidden||!ensure()||active.size>12)return false;const t=ctx.currentTime;if(t-(last.get(key)??-Infinity)<.09)return false;last.set(key,t);const j=soundVariation();for(const [kind,f,to,dur,vol]of playerSoundRecipe(key,weapon)){if(active.size>=16)break;const s=kind==='n'?ctx.createBufferSource():ctx.createOscillator(),g=ctx.createGain(),end=t+dur/j.speed;let filter=null;if(kind==='n'){s.buffer=noise;filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(f*j.pitch,t);filter.frequency.exponentialRampToValueAtTime(to*j.pitch,end);s.connect(filter);filter.connect(g);}else{s.type='triangle';s.frequency.setValueAtTime(f*j.pitch,t);s.frequency.exponentialRampToValueAtTime(to*j.pitch,end);s.connect(g);}g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*j.gain,t+.004);g.gain.exponentialRampToValueAtTime(.0001,end);g.connect(bus);const q={s,g,f:filter};active.add(q);s.onended=()=>{active.delete(q);s.disconnect();filter?.disconnect();g.disconnect();};s.start(t);s.stop(end+.02);}return true;}
 return {play,clear,update};
}
