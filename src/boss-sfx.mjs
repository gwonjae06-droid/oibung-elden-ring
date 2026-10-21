import {kwonSound} from './kwon-sounds.mjs';
import {soundVariation} from './sound-variation.mjs';
export const SAMPLE_FILES=['clown-laugh.mp3','clap.mp3','clown-jump.mp3','bomb-timer.mp3','sword1.mp3','sword2.mp3','sword3.mp3'];
export function bossSound(ev,g){
 if(!g.clown)return kwonSound(ev,g);
 const sample=(file,volume=.4)=>({file,rate:1,volume,f:260,to:90,cueDuration:.2,type:'triangle'});
 if(ev.type==='clown-impact'&&ev.key==='clap')return sample('clap.mp3',.45);
 if(ev.type==='clown-bounce'||ev.type==='clown-dash')return sample('clown-jump.mp3',.45);
 if(ev.type==='clown-inflate'||ev.type==='clown-phase2')return sample('clown-laugh.mp3',.32);
 if(ev.type==='clown-throw'){const b=g.clown.bombs?.at(-1);return {...sample('bomb-timer.mp3',.24),duration:Math.max(.1,Math.min(2.2,b?.warn||1))};}
 const synth={
 'clown-horn':{f:440,to:330,duration:.35,type:'sawtooth'},'clown-confetti':{f:1500,to:280,duration:.2,type:'triangle'},
 'clown-carousel':{f:220,to:660,duration:.4,type:'sawtooth'},'clown-finale':{f:100,to:40,duration:.65,type:'sine'},
 'clown-slam':{f:85,to:35,duration:.4,type:'sine'},'clown-roll':{f:140,to:70,duration:.45,type:'triangle'}
 };
 if(synth[ev.type])return {...synth[ev.type],volume:.09};
 if(ev.type==='clown-impact'&&ev.key==='drumMarch')return {f:125,to:42,duration:.25,type:'sine',volume:.15};
 return null;
}
let sharedContext=null;
function context(){if(sharedContext)return sharedContext;const C=globalThis.AudioContext||globalThis.webkitAudioContext;try{return sharedContext=C?new C():null;}catch{return null;}}
export function createBossSfx({makeAudio=url=>new Audio(url),now=()=>performance.now()/1000,getContext=context,random=Math.random,muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}}}={}){
 const pools=new Map(),active=new Set(),last=new Map();let game=null,generation=0,timer=null;
 const alive=v=>game?.status==='playing'||(v.ending&&game?.status==='lost');
 function stop(v){if(v.node&&!active.has(v))return;if(v.audio&&!active.has(v)&&[...active].some(q=>q.audio===v.audio))return;active.delete(v);if(!active.size&&timer!==null){clearInterval(timer);timer=null;}if(v.audio){v.audio.onended=null;v.audio.pause();try{v.audio.currentTime=0;}catch{}}if(v.node){v.node.onended=null;try{v.node.stop();}catch{}v.node.disconnect();v.gain.disconnect();}}
 function clear(){generation++;for(const v of [...active])stop(v);last.clear();}
 function prepare(file){if(pools.has(file))return pools.get(file);const pool=[];for(let i=0;i<4;i++){try{const a=makeAudio(new URL('../'+file,import.meta.url).href);a.preload='auto';a.load();pool.push(a);}catch{}}pools.set(file,pool);return pool;}
 function allowed(){const doc=globalThis.document;if(muted()||doc?.hidden)return false;if(doc){const modal=doc.getElementById('clown-battle'),root=game?.clown?modal?.firstElementChild?.shadowRoot:doc;if(game?.clown&&!modal?.open)return false;if(root?.getElementById('pause-screen')?.hidden===false)return false;}return true;}
 function activate(v){active.add(v);if(timer===null){timer=setInterval(()=>{for(const q of [...active])if(!allowed()||!alive(q)||now()>=q.until||q.audio?.ended)stop(q);},80);timer.unref?.();}}
 function tone(spec){
  const ctx=getContext();if(!ctx)return false;try{ctx.resume()?.catch(()=>{});if(ctx.state!=='running')return false;const node=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime,d=spec.cueDuration||spec.duration||.25;node.type=spec.type||'triangle';node.frequency.setValueAtTime(spec.f||240,t);node.frequency.exponentialRampToValueAtTime(spec.to||80,t+d);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(Math.min(.12,spec.volume||.07),t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+d);node.connect(gain);gain.connect(ctx.destination);const v={node,gain,until:now()+d+.05,ending:spec.ending};activate(v);node.onended=()=>stop(v);node.start(t);node.stop(t+d+.02);return true;}catch{return false;}
 }
 function update(dt,g){
  if(game!==g){clear();game=g;}
  if(!muted()&&!globalThis.document?.hidden)for(const f of SAMPLE_FILES.filter(f=>g.clown?!f.startsWith('sword'):f.startsWith('sword')))prepare(f);
  if(!allowed()||dt<=0){clear();return;}
  for(const v of [...active])if(!alive(v)||now()>=v.until||v.audio?.ended)stop(v);
 }
 function event(ev,g){
  if(game!==g){clear();game=g;}const ending=!g.clown&&ev.type==='player-hit'&&g.status==='lost';if(!allowed()||(g.status!=='playing'&&!ending))return false;
  if(ev.type==='phase'){clear();return false;}
  const base=bossSound(ev,g);if(!base)return false;const key=base.file||ev.type+':'+(ev.key||''),time=now();
  if(time-(last.get(key)??-Infinity)<.09||active.size>=10)return false;
  const j=soundVariation(random),spec={...base,ending,rate:(base.rate||1)*j.pitch*j.speed,volume:base.volume*.8*j.gain,f:(base.f||240)*j.pitch,to:(base.to||80)*j.pitch,cueDuration:(base.cueDuration||base.duration||.25)/j.speed};
  if(!base.file)spec.duration=base.duration/j.speed;
  if(!spec.file){const ok=tone(spec);if(ok)last.set(key,time);return ok;}
  const a=prepare(spec.file).find(a=>a.readyState>=2&&!a.error&&![...active].some(v=>v.audio===a));
  if(!a){const ok=tone(spec);if(ok)last.set(key,time);return ok;}
  const rate=Math.max(.5,Math.min(1.8,spec.rate)),token=generation,v={audio:a,ending,until:time+(spec.duration||1)};
  try{
   a.volume=spec.volume;a.playbackRate=rate;a.preservesPitch=false;a.currentTime=0;activate(v);last.set(key,time);a.onended=()=>stop(v);
   const started=()=>{if(token!==generation||!active.has(v)||!allowed()||game!==g||!alive(v)){stop(v);return;}const length=Number.isFinite(a.duration)&&a.duration>0?Math.min(8,a.duration/rate):4;v.until=spec.duration?time+spec.duration:now()+Math.min(ending?1.5:8,length)+.05;};
   const p=a.play();if(p?.then)p.then(started).catch(()=>{const valid=token===generation&&active.has(v)&&allowed()&&game===g&&alive(v);stop(v);if(valid&&now()-time<.15)tone(spec);});else started();return true;
  }catch{stop(v);return tone(spec);}
 }
 return {event,update,clear,get activeCount(){return active.size;}};
}
