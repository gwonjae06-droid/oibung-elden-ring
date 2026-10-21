import {score,musicTempo,MUSIC_LOOP} from './boss-score.mjs';
export {score} from './boss-score.mjs';
export function musicState(doc,focused=true){
 if(doc.hidden||!focused)return null;
 const modal=doc.getElementById('clown-battle'),root=modal?modal.firstElementChild?.shadowRoot:doc;
 if(modal&&!modal.open||!modal&&doc.getElementById('boss-transition')?.open||!root)return null;
 const get=id=>root.getElementById(id),hud=get('boss-hud');
 if(!hud||hud.hidden||!get('pause-screen')?.hidden||!get('result')?.hidden)return null;
 const menu=get('menu');if(menu&&!menu.hidden)return null;
 if(Number(get('boss-fill')?.parentElement?.getAttribute('aria-valuenow')??1)<=0)return null;
 return {boss:modal?'clown':'kwon',phase:/두 번째|앙코르/.test(get('phase-label')?.textContent||'')?2:1,busy:/폭탄|팽창|마지막 박수/.test(get('boss-action')?.textContent||'')};
}
export function createBossMusic(factory,{fetchAudio=globalThis.fetch}={}){
 let ctx=null,bus=null,noise=null,enabled=false,disposed=false,state=null,next=0,tick=0,laugh=null,loading=false,retryAt=0;const groups=new Set();
 function ensure(){if(disposed)return false;if(ctx)return true;try{ctx=factory();if(!ctx)return false;bus=ctx.createGain();bus.gain.value=.22;const comp=ctx.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=18;comp.ratio.value=5;bus.connect(comp);comp.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return true;}catch{ctx=null;return false;}}
 function release(g){if(g.done)return;g.done=true;groups.delete(g);for(const n of g.sources){n.onended=null;try{n.stop();}catch{}n.disconnect();}for(const n of g.fx)n.disconnect();}
 function stop(){for(const g of [...groups])release(g);next=0;}
 function voices(){let n=0;for(const g of groups)n+=g.sources.length;return n;}
 function voice(note,time){
  const count=note.voice==='piano'||note.voice==='violin'?3:note.voice==='trumpet'||note.voice==='voice'?2:1;if(voices()+count>96)return;
  const t=time+(note.at||0),end=t+note.dur,g={sources:[],fx:[],end:end+.04,done:false},env=ctx.createGain();g.fx.push(env);env.connect(bus);
  const attack=note.voice==='violin'?.055:note.voice==='voice'?.045:.008;
  env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(note.vol,t+Math.min(attack,note.dur*.3));env.gain.exponentialRampToValueAtTime(.0001,end);
  let remaining=0;
  const start=node=>{g.sources.push(node);remaining++;node.onended=()=>{if(--remaining===0)release(g);};node.start(t);node.stop(end+.025);};
  function part(f,type,amount,cutoff,formant=false){const o=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();o.type=type;const slide=note.voice==='trombone'?.94:note.voice==='trumpet'?.985:1;o.frequency.setValueAtTime(f*slide,t);o.frequency.exponentialRampToValueAtTime(f,t+.045);filter.type=formant?'bandpass':'lowpass';filter.frequency.setValueAtTime(cutoff,t);filter.Q.value=formant?4:.8;gain.gain.value=amount;o.connect(filter);filter.connect(gain);gain.connect(env);g.fx.push(filter,gain);start(o);return o;}
  if(['snare','cymbal'].includes(note.voice)){const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();s.buffer=noise;filter.type='highpass';filter.frequency.value=note.voice==='cymbal'?6500:1900;s.connect(filter);filter.connect(env);g.fx.push(filter);start(s);}
  else if(['kick','tom'].includes(note.voice)){const o=part(note.voice==='kick'?120:155,'sine',1,650);o.frequency.exponentialRampToValueAtTime(note.voice==='kick'?42:65,end);}
  else if(note.voice==='piano'){part(note.f,'triangle',.8,4800);part(note.f*2,'sine',.18,5800);part(note.f*3,'sine',.06,6500);}
  else if(note.voice==='violin'){const o=part(note.f,'sawtooth',.7,3200);part(note.f*2,'triangle',.12,4200);const l=ctx.createOscillator(),depth=ctx.createGain();l.frequency.value=5.5;depth.gain.value=9;l.connect(depth);depth.connect(o.detune);g.fx.push(depth);start(l);}
  else if(note.voice==='voice'){part(note.f,'sawtooth',.5,800,true);part(note.f,'sawtooth',.28,1200,true);}
  else{part(note.f,'sawtooth',.65,note.voice==='trumpet'?2600:1200);if(note.voice==='trumpet')part(note.f*2,'triangle',.16,3500);}
  groups.add(g);
 }
 function loadLaugh(){if(loading||laugh||ctx.currentTime<retryAt||!fetchAudio)return;loading=true;fetchAudio(new URL('../clown-laugh.mp3',import.meta.url)).then(r=>{if(!r.ok)throw Error('laugh unavailable');return r.arrayBuffer();}).then(b=>disposed?null:ctx.decodeAudioData(b)).then(b=>{if(!disposed)laugh=b;loading=false;}).catch(()=>{loading=false;retryAt=(ctx?.currentTime||0)+30;});}
 function chuckle(t){if(!laugh||voices()>92)return;const s=ctx.createBufferSource(),gain=ctx.createGain(),dur=Math.min(1.4,laugh.duration);if(dur<=0)return;s.buffer=laugh;gain.gain.setValueAtTime(.035,t);gain.gain.setValueAtTime(.035,t+Math.max(0,dur-.08));gain.gain.linearRampToValueAtTime(.0001,t+dur);s.connect(gain);gain.connect(bus);const g={sources:[s],fx:[gain],end:t+dur+.04,done:false};groups.add(g);s.onended=()=>release(g);s.start(t,0,dur);s.stop(t+dur+.025);}
 return {
  unlock(){if(!ensure())return false;try{ctx.resume()?.catch(()=>{});}catch{}enabled=true;return true;},
  update(value,on=true){
   if(!ctx||!enabled||disposed)return;for(const g of [...groups])if(ctx.currentTime>=g.end)release(g);
   if(!on||!value||ctx.state!=='running'){stop();return;}
   if(!state||state.boss!==value.boss||state.phase!==value.phase){stop();tick=0;state={boss:value.boss,phase:value.phase};}
   if(value.boss==='clown')loadLaugh();const interval=30/musicTempo(value.boss,value.phase);
   if(!next||next<ctx.currentTime-.1)next=ctx.currentTime+.025;
   let count=0;while(next<ctx.currentTime+.18&&count++<4){for(const n of score(value.boss,value.phase,tick))voice(n,next);if(value.boss==='clown'&&tick%MUSIC_LOOP===126&&!value.busy)chuckle(next);tick++;next+=interval;}
  },
  reset(){stop();tick=0;state=null;},
  dispose(){stop();disposed=true;enabled=false;ctx?.close()?.catch(()=>{});},
  get activeVoices(){return voices();}
 };
}
let installed=false;
export function installBossMusic(doc=globalThis.document,win=globalThis.window){
 if(installed||!doc||!win)return;installed=true;const C=win.AudioContext||win.webkitAudioContext;if(!C)return;
 const music=createBossMusic(()=>new C());let focused=doc.hasFocus(),muted=false;
 const readMute=()=>{try{muted=win.localStorage.getItem('oibung-muted')==='1';}catch{}};
 function sync(){readMute();music.update(musicState(doc,focused),!muted);}
 function gesture(e){const path=e.composedPath();if(path.some(n=>['start','retry','change','quit'].includes(n?.id)||n?.classList?.contains('bt-confirm')))music.reset();queueMicrotask(()=>{readMute();if(!muted)music.unlock();sync();});}
 const blur=()=>{focused=false;sync();},focus=()=>{focused=true;sync();};
 win.addEventListener('pointerdown',gesture,{passive:true});win.addEventListener('keydown',gesture);win.addEventListener('blur',blur);win.addEventListener('focus',focus);doc.addEventListener('visibilitychange',sync);
 const timer=win.setInterval(sync,80);win.addEventListener('pagehide',e=>{music.reset();if(!e.persisted){win.clearInterval(timer);music.dispose();}},{capture:true});
}
