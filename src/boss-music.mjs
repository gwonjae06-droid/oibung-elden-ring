const hz=n=>440*2**((n-69)/12);
export function score(boss,phase,beat){
 const b=((beat%32)+32)%32,p=phase===2?2:1,notes=[];
 const add=(voice,n,dur,vol)=>notes.push({voice,f:hz(n),dur,vol});
 if(boss==='kwon'){
  const roots=[50,46,53,45],root=roots[Math.floor(b/8)],arp=[0,7,12,15];
  add('piano',root+arp[b%4],.5,.12);if(b%4===0)add('piano',root-12,1.5,.14);
  if(b%2===0){const melody=[74,77,76,72,70,69,72,73,74,81,79,77,76,73,69,73];add('violin',melody[b/2]+(p===2?12:0),p===2?.43:.65,.12);}
  if(p===2&&b%2===1)add('piano',root+19,.25,.07);
 }else if(boss==='clown'){
  const bass=[48,43,46,43],melody=[72,76,79,76,74,77,81,77,75,78,82,78,74,73,71,67];
  add('kick',36,.16,.2);if(b%2===1)add('snare',60,.12,.1);
  add('trombone',bass[Math.floor(b/2)%4],.23,.11);
  if(b%2===0)add('trumpet',melody[(b/2)%16],.27,.12);
  if(p===2&&b%4===3)add('trumpet',melody[Math.floor(b/2)%16]+1,.16,.06);
  if(b%8===6)add('voice',p===2?65:60,.32,.055);
 }
 return notes;
}
export function musicState(doc,focused=true){
 if(doc.hidden||!focused)return null;
 const modal=doc.getElementById('clown-battle');
 const root=modal?modal.firstElementChild?.shadowRoot:doc;
 if(modal&&!modal.open)return null;
 if(!modal&&doc.getElementById('boss-transition')?.open)return null;
 if(!root)return null;const get=id=>root.getElementById(id),hud=get('boss-hud');
 if(!hud||hud.hidden||!get('pause-screen')?.hidden||!get('result')?.hidden)return null;
 const menu=get('menu');if(menu&&!menu.hidden)return null;
 const meter=get('boss-fill')?.parentElement;if(Number(meter?.getAttribute('aria-valuenow')??1)<=0)return null;
 const phase=/두 번째|앙코르/.test(get('phase-label')?.textContent||'')?2:1;
 return {boss:modal?'clown':'kwon',phase};
}
export function createBossMusic(factory){
 let ctx,bus,noise,enabled=false,state=null,next=0,beat=0,laugh=null,loading=false;
 const nodes=new Set();
 function ensure(){if(ctx)return true;try{ctx=factory();if(!ctx)return false;bus=ctx.createGain();bus.gain.value=.28;const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return true;}catch{return false;}}
 function track(node){nodes.add(node);node.onended=()=>{nodes.delete(node);node.disconnect();};return node;}
 function stop(){for(const node of nodes){try{node.stop();}catch{}node.disconnect();}nodes.clear();next=0;}
 function voice(n,t){
  if(nodes.size>80)return;
  const g=ctx.createGain(),s=track(n.voice==='snare'?ctx.createBufferSource():ctx.createOscillator());
  const f=ctx.createBiquadFilter();f.type=n.voice==='voice'?'bandpass':'lowpass';f.frequency.value=n.voice==='voice'?850:n.voice==='violin'?3200:n.voice==='piano'?4200:1800;f.Q.value=n.voice==='voice'?5:.7;
  if(n.voice==='snare')s.buffer=noise;else{s.type=n.voice==='piano'?'triangle':n.voice==='kick'?'sine':'sawtooth';s.frequency.setValueAtTime(n.voice==='kick'?140:n.f,t);if(n.voice==='kick')s.frequency.exponentialRampToValueAtTime(42,t+n.dur);}
  const attack=n.voice==='violin'?.07:.008,end=t+n.dur;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(n.vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,end);
  s.connect(f);f.connect(g);g.connect(bus);
  if(n.voice==='violin'){const l=track(ctx.createOscillator()),depth=ctx.createGain();l.frequency.value=5.7;depth.gain.value=9;l.connect(depth);depth.connect(s.detune);l.start(t);l.stop(end+.02);}
  s.start(t);s.stop(end+.02);s.onended=()=>{nodes.delete(s);s.disconnect();f.disconnect();g.disconnect();};
 }
 function loadLaugh(){if(loading||laugh)return;loading=true;fetch(new URL('../clown-laugh.mp3',import.meta.url)).then(r=>{if(!r.ok)throw Error('laugh unavailable');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b)).then(b=>{laugh=b;}).catch(()=>{});}
 function chuckle(t){if(!laugh||nodes.size>76)return;const s=track(ctx.createBufferSource()),g=ctx.createGain();s.buffer=laugh;g.gain.setValueAtTime(.08,t);const dur=Math.min(1.4,laugh.duration);g.gain.setValueAtTime(.08,t+Math.max(0,dur-.08));g.gain.linearRampToValueAtTime(0,t+dur);s.connect(g);g.connect(bus);s.start(t,0,dur);s.onended=()=>{nodes.delete(s);s.disconnect();g.disconnect();};}
 return {
  unlock(){if(!ensure())return false;try{ctx.resume()?.catch(()=>{});}catch{}enabled=true;return true;},
  update(value,on=true){
   if(!ctx||!enabled)return;
   if(!on||!value||ctx.state!=='running'){stop();state=value;return;}
   if(!state||state.boss!==value.boss||state.phase!==value.phase){stop();beat=0;state={...value};}
   if(value.boss==='clown')loadLaugh();
   const interval=60/(value.boss==='clown'?(value.phase===2?152:128):(value.phase===2?112:88));
   if(!next||next<ctx.currentTime-.1)next=ctx.currentTime+.025;
   let count=0;while(next<ctx.currentTime+.16&&count++<4){for(const n of score(value.boss,value.phase,beat))voice(n,next);if(value.boss==='clown'&&beat%32===30)chuckle(next);beat++;next+=interval;}
  },
  reset(){stop();beat=0;state=null;},
  dispose(){stop();enabled=false;ctx?.close()?.catch(()=>{});},
  get activeVoices(){return nodes.size;}
 };
}
let installed=false;
export function installBossMusic(doc=globalThis.document,win=globalThis.window){
 if(installed||!doc||!win)return;installed=true;
 const C=win.AudioContext||win.webkitAudioContext;if(!C)return;
 const music=createBossMusic(()=>new C());let focused=doc.hasFocus(),muted=false;
 const readMute=()=>{try{muted=win.localStorage.getItem('oibung-muted')==='1';}catch{}};
 function sync(){readMute();music.update(musicState(doc,focused),!muted);}
 function gesture(e){const id=e.composedPath().find(n=>n?.id)?.id;if(['start','retry','change','quit','bt-confirm'].includes(id))music.reset();queueMicrotask(()=>{readMute();if(!muted)music.unlock();sync();});}
 const blur=()=>{focused=false;sync();},focus=()=>{focused=true;sync();};
 win.addEventListener('pointerdown',gesture,{passive:true});win.addEventListener('keydown',gesture);win.addEventListener('blur',blur);win.addEventListener('focus',focus);doc.addEventListener('visibilitychange',sync);
 const timer=win.setInterval(sync,80);
 win.addEventListener('pagehide',e=>{music.reset();if(!e.persisted){win.clearInterval(timer);music.dispose();}},{capture:true});
}
