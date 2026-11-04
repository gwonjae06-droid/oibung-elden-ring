import {kwonSound} from './kwon-sounds.mjs';
import {audioChannelGain} from './audio-preferences.mjs';
import {soundVariation} from './sound-variation.mjs';
import {bossFoleySpec,BOSS_FOLEY_PRELOAD} from './boss-foley-map.mjs';
import {bossOfGame} from './battle-dialogs.mjs';
export const SAMPLE_FILES=['clown-laugh.mp3','clap.mp3','clown-jump.mp3','bomb-timer.mp3','sword1.mp3','sword2.mp3','sword3.mp3'];
export function bossSound(ev,g){
 const recorded=bossFoleySpec(ev,g);
 if(recorded)return recorded;
 if(g.dice)return null;
 if(!g.clown)return kwonSound(ev,g);
 const sample=(file,volume=.4)=>({file,rate:1,volume,f:260,to:90,cueDuration:.2,type:'triangle'});
 if(ev.type==='clown-impact'&&ev.key==='clap')return sample('clap.mp3',.45);
 if(ev.type==='clown-bounce'||ev.type==='clown-dash')return sample('clown-jump.mp3',.45);
 if(ev.type==='clown-inflate'||ev.type==='clown-phase2')return sample('clown-laugh.mp3',.32);
 if(ev.type==='clown-throw'){const b=g.clown.bombs?.at(-1);return {...sample('bomb-timer.mp3',.24),duration:Math.max(.1,Math.min(2.2,b?.warn||1))};}
 const synth={'clown-horn':{f:440,to:330,duration:.35,type:'sawtooth'},'clown-confetti':{f:1500,to:280,duration:.2,type:'triangle'},'clown-carousel':{f:220,to:660,duration:.4,type:'sawtooth'},'clown-finale':{f:100,to:40,duration:.65,type:'sine'},'clown-slam':{f:85,to:35,duration:.4,type:'sine'},'clown-roll':{f:140,to:70,duration:.45,type:'triangle'}};
 if(synth[ev.type])return {...synth[ev.type],volume:.09};
 if(ev.type==='clown-impact'&&ev.key==='drumMarch')return {f:125,to:42,duration:.25,type:'sine',volume:.15};return null;
}
export function createBossSfx({makeAudio=url=>new Audio(url),now=()=>performance.now()/1000,getContext,random=Math.random,muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}},schedule=fn=>globalThis.setInterval(fn,80),cancel=id=>globalThis.clearInterval(id)}={}){
 const pools=new Map(),active=new Set(),last=new Map(),errors=[];let game=null,generation=0,timer=null,disposed=false,ownedContext=null,completion=null;
 const maxVoices=globalThis.matchMedia?.('(pointer: coarse)')?.matches?6:10;
 const safe=fn=>{try{return fn();}catch(error){errors.push(error);}};
 function context(){if(disposed)return null;if(getContext)return getContext();if(!ownedContext){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;ownedContext=new C();}return ownedContext;}
 const alive=v=>!disposed&&(game?.status==='playing'||(v.ending&&game?.status==='lost'));
 function cancelTimer(){if(timer===null)return;const id=timer;timer=null;safe(()=>cancel(id));}
 function silence(a){safe(()=>{a.onended=null;});safe(()=>a.pause());safe(()=>{a.currentTime=0;});}
 function stop(v){
  if(v.done){if(v.audio&&![...active].some(q=>q.audio===v.audio))silence(v.audio);return;}
  v.done=true;active.delete(v);if(!active.size)cancelTimer();if(v.audio)silence(v.audio);
  if(v.node){safe(()=>{v.node.onended=null;});try{v.node.stop();}catch{}safe(()=>v.node.disconnect());safe(()=>v.gain?.disconnect());}
 }
 function reset(){generation++;for(const v of [...active])stop(v);active.clear();cancelTimer();last.clear();}
 function fade(v){if(!v.audio||!(v.fade>0)||!(v.volume>0))return;const left=v.until-now();if(left<v.fade)v.audio.volume=v.volume*Math.max(0,Math.min(1,left/v.fade));}
 function clear(){if(!disposed)reset();}
 function prepare(file){if(disposed)return [];if(pools.has(file))return pools.get(file);const pool=[];pools.set(file,pool);for(let i=0;i<(file.startsWith('assets/sfx/')?2:4)&&!disposed;i++){try{const a=makeAudio(new URL('../'+file,import.meta.url).href);if(disposed){releaseClip(a);break;}pool.push(a);a.preload='auto';a.load();}catch{}}return pool;}
 // Nested bosses (each in its own shadow-root dialog) are found through the boss registry, so a new boss needs no change here.
 function allowed(){if(disposed)return false;const doc=globalThis.document;if(muted()||doc?.hidden)return false;if(doc){const entry=bossOfGame(game),isNested=Boolean(entry.dialogId),modal=isNested?doc.getElementById(entry.dialogId):null,root=isNested?modal?.firstElementChild?.shadowRoot:doc;if(isNested&&!modal?.open)return false;if(root?.getElementById('pause-screen')?.hidden===false)return false;}return true;}
 function activate(v){if(disposed)return false;active.add(v);if(timer===null){timer=schedule(()=>{if(disposed)return;for(const q of [...active]){if(!allowed()||!alive(q)||now()>=q.until||q.audio?.ended){stop(q);continue;}fade(q);}});timer?.unref?.();}return true;}
 function tone(spec){
  if(!allowed())return false;let node=null,gain=null,v=null;
  try{const ctx=context();if(!ctx||disposed||ctx.state==='closed')return false;ctx.resume?.()?.catch(()=>{});if(ctx.state!=='running')return false;node=ctx.createOscillator();gain=ctx.createGain();const t=ctx.currentTime,d=spec.cueDuration||spec.duration||.25;node.type=spec.type||'triangle';node.frequency.setValueAtTime(spec.f||240,t);node.frequency.exponentialRampToValueAtTime(spec.to||80,t+d);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(Math.min(.12,spec.volume||.07),t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+d);node.connect(gain);gain.connect(ctx.destination);v={node,gain,until:now()+d+.05,ending:spec.ending};if(!activate(v)){stop(v);return false;}node.onended=()=>stop(v);node.start(t);node.stop(t+d+.02);return true;}catch{if(v)stop(v);else{if(node){try{node.stop();}catch{}safe(()=>node.disconnect());}if(gain)safe(()=>gain.disconnect());}return false;}
 }
 function update(dt,g){if(disposed)return;if(game!==g){reset();game=g;}if(!muted()&&!globalThis.document?.hidden){const id=bossOfGame(g).id,boss=BOSS_FOLEY_PRELOAD[id]?id:'kwon';for(const f of BOSS_FOLEY_PRELOAD[boss])prepare(f);for(const f of SAMPLE_FILES.filter(f=>g.clown?!f.startsWith('sword'):!g.dice&&f.startsWith('sword')))prepare(f);}if(!allowed()||dt<=0){reset();return;}for(const v of [...active]){if(!alive(v)||now()>=v.until||v.audio?.ended){stop(v);continue;}fade(v);}}
 function event(ev,g){
  if(disposed)return false;if(game!==g){reset();game=g;}const ending=!g.clown&&(ev.type==='player-hit'||ev.type==='player-crushed')&&g.status==='lost';if(!allowed()||(g.status!=='playing'&&!ending))return false;if(ev.type==='phase')reset();
  const base=bossSound(ev,g);if(!base)return false;const key=base.file||ev.type+':'+(ev.key||''),time=now();if(time-(last.get(key)??-Infinity)<(base.minGap??.09)||active.size>=maxVoices)return false;
  const j=soundVariation(random),spec={...base,ending,rate:(base.rate||1)*j.pitch*j.speed,volume:base.volume*.8*j.gain*audioChannelGain('effects'),f:(base.f||240)*j.pitch,to:(base.to||80)*j.pitch,cueDuration:(base.cueDuration||base.duration||.25)/j.speed,fade:base.fade||0};if(!base.file)spec.duration=base.duration/j.speed;
  if(!spec.file)return false; // No chiptune-like waveform cues without an actual recording.
  const a=prepare(spec.file).find(a=>(a.readyState>=2||spec.file.startsWith('assets/sfx/'))&&!a.error&&![...active].some(v=>v.audio===a));if(!a)return false;
  if(disposed)return false;const rate=Math.max(.5,Math.min(1.8,spec.rate)),token=generation,v={audio:a,ending,until:time+(spec.duration||1),fade:spec.fade,volume:spec.volume};
  try{a.volume=spec.volume;a.playbackRate=rate;a.preservesPitch=false;a.currentTime=0;if(!activate(v)){stop(v);return false;}last.set(key,time);a.onended=()=>stop(v);
   const started=()=>{if(disposed||token!==generation||!active.has(v)||!allowed()||game!==g||!alive(v)){stop(v);return;}const length=Number.isFinite(a.duration)&&a.duration>0?Math.min(8,a.duration/rate):4;v.until=spec.duration?time+spec.duration:now()+Math.min(ending?1.5:8,length)+.05;};
   const p=a.play();if(p?.then)p.then(started).catch(()=>{const valid=!disposed&&token===generation&&active.has(v)&&allowed()&&game===g&&alive(v);stop(v);// Missing/unplayable recording stays silent; never fall back to oscillator tones.});else started();return true;
  }catch{stop(v);return false;}
 }
 function releaseClip(a){silence(a);safe(()=>{for(const source of a.querySelectorAll?.('source')||[])source.remove();});safe(()=>{if(a.removeAttribute)a.removeAttribute('src');else a.src='';});safe(()=>a.load());}
 function dispose(){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;reset();game=null;
  for(const pool of pools.values())for(const a of pool)releaseClip(a);pools.clear();const ctx=ownedContext;ownedContext=null;
  try{Promise.resolve(ctx?.close?.()).then(()=>finish({errors:[...errors]}),error=>{errors.push(error);finish({errors:[...errors]});});}catch(error){errors.push(error);finish({errors:[...errors]});}return completion;
 }
 return {event,update,clear,dispose,get disposed(){return disposed;},get activeCount(){return active.size;}};
}
