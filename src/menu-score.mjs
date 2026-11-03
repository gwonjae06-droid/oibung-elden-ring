// Sparse, sustained piano partials only. No drum, bass pulse or sawtooth layer.
export function createMenuScore(win){
 let ctx,bus,timer,next=0,beat=0,enabled=false,disposed=false;const voices=new Set();
 const hz=n=>440*2**((n-69)/12);
 function piano(n,t,d,v){
  for(const [harmonic,amount] of [[1,1],[2,.16],[3,.035]]){
   const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz(n)*harmonic;
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v*amount,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+d/(1+(harmonic-1)*.4));
   o.connect(g);g.connect(bus);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+d+.04);
  }
 }
 function schedule(){if(!enabled||!ctx||ctx.state!=='running')return;const step=60/58;if(next<ctx.currentTime)next=ctx.currentTime+.05;
  while(next<ctx.currentTime+.3){const bar=Math.floor(beat/4)%8,s=beat%4,root=[50,46,53,48,50,43,46,45][bar];
   if(s===0){piano(root-12,next,5.5,.045);piano(root+7,next+.09,5,.025);}
   if(s===0||s===2)piano(root+12+[0,3,7,2,5,7,3,0][Math.floor(beat/2)%8],next+.2,4.5,.043);
   if(s===3&&bar%2===1)piano(root+19,next,3.5,.018);
   next+=step;beat++;
  }
 }
 return {unlock(){if(disposed)return;try{if(!ctx){ctx=new (win.AudioContext||win.webkitAudioContext)();bus=ctx.createGain();bus.gain.value=.55;const comp=ctx.createDynamicsCompressor();bus.connect(comp);comp.connect(ctx.destination);
   if(ctx.createConvolver&&ctx.createBuffer){const reverb=ctx.createConvolver(),wet=ctx.createGain(),length=ctx.sampleRate*3,buffer=ctx.createBuffer(2,length,ctx.sampleRate);for(let c=0;c<2;c++){const data=buffer.getChannelData(c);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/length,3)*.35;}reverb.buffer=buffer;wet.gain.value=.22;bus.connect(reverb);reverb.connect(wet);wet.connect(comp);}
  }ctx.resume()?.catch(()=>{});}catch{}},
 update(on,volume=.55){enabled=!!on;if(bus)bus.gain.value=volume;if(!on){for(const o of voices)try{o.stop();}catch{}next=0;beat=0;return;}if(!timer)timer=win.setInterval(schedule,100);schedule();},
 dispose(){disposed=true;enabled=false;win.clearInterval(timer);for(const o of voices)try{o.stop();}catch{}return ctx?.close()?.catch(()=>{});}};
}
