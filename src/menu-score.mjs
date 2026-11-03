// Original 16-bar overture: low strings, horn chords, bell motif and timpani.
// Created only after a user gesture; no external assets or effect on boss tracks.
export function createMenuScore(win){
 let ctx,bus,timer,next=0,beat=0,enabled=false,disposed=false;const voices=new Set();
 const hz=n=>440*2**((n-69)/12);
 function tone(n,t,d,v,type='triangle'){
  const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type;o.frequency.value=hz(n);f.type='lowpass';f.frequency.value=type==='sawtooth'?900:2400;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(f);f.connect(g);g.connect(bus);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();f.disconnect();g.disconnect();};o.start(t);o.stop(t+d+.02);
 }
 function schedule(){if(!enabled||!ctx||ctx.state!=='running')return;const step=60/76;if(next<ctx.currentTime)next=ctx.currentTime+.05;
  while(next<ctx.currentTime+.3){const bar=Math.floor(beat/4)%16,s=beat%4,root=[38,38,34,34,41,41,36,33,38,38,34,34,43,41,33,33][bar];
   tone(root,next,step*.85,.085,'sawtooth');if(s===0){for(const n of [0,7,12,15])tone(root+n,next,step*3.8,.027,'sawtooth');tone(root-12,next,.65,.12,'sine');}
   if(s===0||s===2)tone(74+[0,3,7,5,3,0,-2,-5][Math.floor(beat/2)%8],next,step*1.7,.033,'sine');
   if(bar>=8)tone(root+24+[0,7,3,7][s],next,step*.6,.022);next+=step;beat++;
  }
 }
 return {unlock(){if(disposed)return;try{if(!ctx){ctx=new (win.AudioContext||win.webkitAudioContext)();bus=ctx.createGain();bus.gain.value=.55;const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);}ctx.resume()?.catch(()=>{});}catch{}},
 update(on,volume=.55){enabled=!!on;if(bus)bus.gain.value=volume;if(!on){for(const o of voices)try{o.stop();}catch{}next=0;beat=0;return;}if(!timer)timer=win.setInterval(schedule,100);schedule();},
 dispose(){disposed=true;enabled=false;win.clearInterval(timer);for(const o of voices)try{o.stop();}catch{}return ctx?.close()?.catch(()=>{});}};
}
