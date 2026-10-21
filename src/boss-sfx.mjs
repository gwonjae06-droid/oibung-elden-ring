export const SAMPLE_FILES=['clown-laugh.mp3','clap.mp3','clown-jump.mp3','bomb-timer.mp3','sword1.mp3','sword2.mp3','sword3.mp3'];
const SWORDS={sweep:1,reverse:2,cross:3,thrust:3,slam:2,leap:2,whirl:1,rise:3,jab:3,rush:1,retreat:2,wave:3,stomp:2,backsweep:2,shove:2};
export function bossSound(ev,g){
 if(!g.clown){if(ev.type==='boss-swing'||ev.type==='boss-shot')return {file:'sword'+(SWORDS[g.boss.pattern]||1)+'.mp3',duration:1.2,volume:.42};return null;}
 const sample=(file,duration=1,volume=.4)=>({file,duration,volume});
 if(ev.type==='clown-impact'&&ev.key==='clap')return sample('clap.mp3',.9,.45);
 if(ev.type==='clown-bounce'||ev.type==='clown-dash')return sample('clown-jump.mp3',.7,.45);
 if(ev.type==='clown-inflate'||ev.type==='clown-phase2')return sample('clown-laugh.mp3',1.2,.32);
 if(ev.type==='clown-throw'){const b=g.clown.bombs?.at(-1);return sample('bomb-timer.mp3',Math.max(.1,Math.min(2.2,b?.warn||1)),.24);}
 const synth={
  'clown-horn':{f:440,to:330,duration:.35,type:'sawtooth'},
  'clown-confetti':{f:1500,to:280,duration:.2,type:'triangle'},
  'clown-carousel':{f:220,to:660,duration:.4,type:'sawtooth'},
  'clown-finale':{f:100,to:40,duration:.65,type:'sine'},
  'clown-slam':{f:85,to:35,duration:.4,type:'sine'},
  'clown-roll':{f:140,to:70,duration:.45,type:'triangle'}
 };
 if(synth[ev.type])return {...synth[ev.type],volume:.09};
 if(ev.type==='clown-impact'&&ev.key==='drumMarch')return {f:125,to:42,duration:.25,type:'sine',volume:.15};
 return null;
}
let sharedContext=null;
function context(){if(sharedContext)return sharedContext;const C=globalThis.AudioContext||globalThis.webkitAudioContext;try{return sharedContext=C?new C():null;}catch{return null;}}
export function createBossSfx({makeAudio=url=>new Audio(url),now=()=>performance.now()/1000,muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch{return false;}}}={}){
 const pools=new Map(),active=new Set(),last=new Map();let game=null,generation=0,timer=null;
 function stop(v){if(v.node&&!active.has(v))return;if(v.audio&&!active.has(v)&&[...active].some(q=>q.audio===v.audio))return;active.delete(v);if(!active.size&&timer!==null){clearInterval(timer);timer=null;}if(v.audio){v.audio.pause();try{v.audio.currentTime=0;}catch{}}if(v.node){try{v.node.stop();}catch{}v.node.disconnect();v.gain.disconnect();}}
 function clear(){generation++;for(const v of [...active])stop(v);last.clear();}
 function prepare(file){if(pools.has(file))return pools.get(file);const pool=[];for(let i=0;i<2;i++){try{const a=makeAudio(new URL('../'+file,import.meta.url).href);a.preload='auto';a.load();pool.push(a);}catch{}}pools.set(file,pool);return pool;}
 function allowed(){const doc=globalThis.document;if(muted()||doc?.hidden)return false;if(doc&&game?.clown){const modal=doc.getElementById('clown-battle'),root=modal?.firstElementChild?.shadowRoot;if(!modal?.open||!root?.getElementById('pause-screen')?.hidden)return false;}return true;}
 function activate(v){active.add(v);if(timer===null){timer=setInterval(()=>{for(const q of [...active])if(!allowed()||game?.status!=='playing'||now()>=q.until||q.audio?.ended)stop(q);},80);timer.unref?.();}}
 function update(dt,g){if(game!==g){clear();game=g;}if(!allowed()||dt<=0||g.status!=='playing'){clear();return;}for(const f of SAMPLE_FILES.filter(f=>g.clown?f.startsWith('clown')||f==='clap.mp3'||f==='bomb-timer.mp3':f.startsWith('sword')))prepare(f);for(const v of [...active]){if(now()>=v.until||v.audio?.ended)stop(v);}}
 function event(ev,g){
  if(game!==g){clear();game=g;}if(!allowed()||g.status!=='playing')return false;
  if(ev.type==='phase'){clear();return false;}
  const spec=bossSound(ev,g);if(!spec)return false;const key=spec.file||ev.type+':'+(ev.key||''),time=now();
  if(time-(last.get(key)??-Infinity)<.09||active.size>=8)return false;
  if(spec.file){const a=prepare(spec.file).find(a=>![...active].some(v=>v.audio===a)&&a.readyState>=2);if(!a)return false;a.volume=spec.volume;a.currentTime=0;const v={audio:a,until:time+spec.duration},token=generation;activate(v);last.set(key,time);try{const p=a.play();p?.then(()=>{if(token!==generation||!active.has(v)||!allowed()||now()-time>.2)stop(v);}).catch(()=>stop(v));return true;}catch{stop(v);return false;}}
  const ctx=context();if(!ctx)return false;try{ctx.resume()?.catch(()=>{});if(ctx.state!=='running')return false;const node=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;node.type=spec.type;node.frequency.setValueAtTime(spec.f,t);node.frequency.exponentialRampToValueAtTime(spec.to,t+spec.duration);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(spec.volume,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+spec.duration);node.connect(gain);gain.connect(ctx.destination);const v={node,gain,until:time+spec.duration};activate(v);node.onended=()=>stop(v);node.start(t);node.stop(t+spec.duration+.02);last.set(key,time);return true;}catch{return false;}
 }
 return {event,update,clear,get activeCount(){return active.size;}};
}
