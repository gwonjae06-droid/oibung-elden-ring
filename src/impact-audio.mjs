export const IMPACT_SOUND_NAMES=['hit-slash','hit-blunt','hit-pierce','hit-crit','blood-splat','hit-flesh'];
export function createImpactAudio(factory){
  const make=factory||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;});
  let ctx=null,master=null,noiseBuf=null,enabled=false,ends=[];const last={};
  function ensure(){
    if(ctx)return true;
    try{ctx=make();}catch(e){ctx=null;}
    if(!ctx)return false;
    const comp=ctx.createDynamicsCompressor();master=ctx.createGain();master.gain.value=.55;master.connect(comp);comp.connect(ctx.destination);
    const len=Math.floor(ctx.sampleRate*1.2);noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;return true;
  }
  const room=end=>{const now=ctx.currentTime;ends=ends.filter(e=>e>now);if(ends.length>=28)return false;ends.push(end);return true;};
  const env=(g,t,a,peak,d)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);};
  function tone({f,to,dur,type='sine',vol=.2,at=0,attack=.004}){
    const t=ctx.currentTime+at;if(!room(t+attack+dur+.05))return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    if(to)o.frequency.exponentialRampToValueAtTime(to,t+attack+dur);
    env(g,t,attack,vol,dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+attack+dur+.05);
  }
  function noise({dur,type='bandpass',f=1000,to,q=1,vol=.2,at=0,attack=.003}){
    const t=ctx.currentTime+at;if(!room(t+attack+dur+.05))return;
    const s=ctx.createBufferSource(),flt=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;
    flt.type=type;flt.Q.setValueAtTime(q,t);flt.frequency.setValueAtTime(f,t);if(to)flt.frequency.exponentialRampToValueAtTime(to,t+attack+dur);
    env(g,t,attack,vol,dur);s.connect(flt);flt.connect(g);g.connect(master);s.start(t,Math.random());s.stop(t+attack+dur+.05);
  }
  const SOUNDS={
    'hit-slash':()=>{noise({dur:.14,type:'highpass',f:3200,to:900,vol:.3});tone({f:420,to:130,dur:.09,type:'sawtooth',vol:.14});tone({f:130,to:50,dur:.16,vol:.3});},
    'hit-blunt':()=>{tone({f:85,to:30,dur:.34,vol:.5,attack:.003});noise({dur:.3,type:'lowpass',f:800,to:90,vol:.45});tone({f:1300,to:420,dur:.06,type:'triangle',vol:.14});},
    'hit-pierce':()=>{noise({dur:.1,f:2600,to:900,q:1.4,vol:.24});tone({f:720,to:210,dur:.12,type:'triangle',vol:.16});tone({f:95,to:45,dur:.18,vol:.28,at:.01});},
    'hit-crit':()=>{tone({f:210,to:60,dur:.26,type:'square',vol:.2});noise({dur:.22,f:1800,q:1.2,vol:.32});tone({f:1568,dur:.3,type:'triangle',vol:.09,at:.02});tone({f:70,to:32,dur:.4,vol:.4});},
    'blood-splat':()=>{noise({dur:.24,type:'lowpass',f:1500,to:280,vol:.26,attack:.005});noise({dur:.14,f:620,q:1.6,vol:.16,at:.05});tone({f:170,to:70,dur:.16,vol:.14});},
    'hit-flesh':()=>{tone({f:130,to:45,dur:.3,type:'sawtooth',vol:.26});noise({dur:.3,type:'lowpass',f:950,to:150,vol:.34});noise({dur:.16,f:420,q:1.5,vol:.2,at:.05});}
  };
  return {
    get enabled(){return enabled;},names:Object.keys(SOUNDS),
    setEnabled(on){
      if(!on){enabled=false;return false;}
      if(!ensure()){enabled=false;return false;}
      if(ctx.state==='suspended'&&ctx.resume)ctx.resume();enabled=true;return true;
    },
    play(name,opts={}){
      if(!enabled||!ctx)return false;const fn=SOUNDS[name];if(!fn)return false;
      const now=ctx.currentTime,gap=opts.minGap===undefined?.035:opts.minGap;
      if(last[name]!==undefined&&now-last[name]<gap)return false;last[name]=now;fn(opts);return true;
    }
  };
}
