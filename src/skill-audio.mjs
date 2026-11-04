import {audioChannelGain} from './audio-preferences.mjs';
import {createSampleSfx} from './sample-sfx.mjs';
export const SKILL_SOUND_NAMES=['skill-sword','skill-hammer','skill-bow','skill-blue','skill-red','skill-yellow','skill-stun','skill-heal','skill-ready','skill-pierce'];
export function createSkillAudio(factory){
  const make=factory||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;});
  let ctx=null,master=null,noiseBuf=null,enabled=false,ends=[];const last={};const sample=createSampleSfx();
  function ensure(){
    if(ctx)return true;
    try{ctx=make();}catch(e){ctx=null;}
    if(!ctx)return false;
    const comp=ctx.createDynamicsCompressor();master=ctx.createGain();master.gain.value=.5*audioChannelGain('effects');master.connect(comp);comp.connect(ctx.destination);
    const len=Math.floor(ctx.sampleRate*1.5);noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;return true;
  }
  const room=end=>{const now=ctx.currentTime;ends=ends.filter(e=>e>now);if(ends.length>=32)return false;ends.push(end);return true;};
  const env=(g,t,a,peak,d)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);};
  // The old pitched sine/square/triangle skill cues sounded like 8-bit games.
  // Keep the same events, but render only subdued, non-pitched air/impact bursts.
  function tone({f,to,dur,vol=.15,at=0,attack=.01}){
    noise({dur:Math.min(.24,dur),type:f<280?'lowpass':'bandpass',
      f:f<280?Math.max(90,f*2):Math.min(1600,f*.72),
      to:to?Math.min(900,Math.max(95,to*.5)):undefined,
      q:.55,vol:Math.min(.085,vol*.4),at,attack});
  }
  function noise({dur,type='bandpass',f=1000,to,q=1,vol=.15,at=0,attack=.01}){
    const t=ctx.currentTime+at;if(!room(t+attack+dur+.05))return;
    const s=ctx.createBufferSource(),flt=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;
    flt.type=type;flt.Q.setValueAtTime(q,t);flt.frequency.setValueAtTime(f,t);if(to)flt.frequency.exponentialRampToValueAtTime(to,t+attack+dur);
    env(g,t,attack,vol,dur);s.connect(flt);flt.connect(g);g.connect(master);s.start(t,Math.random());s.stop(t+attack+dur+.05);
  }
  const SOUNDS={
    'skill-sword':()=>{noise({dur:.5,f:500,to:5200,q:1.6,vol:.2,attack:.05});[1047,1319,1568,2093].forEach((f,i)=>tone({f,dur:.3,type:'triangle',vol:.07,at:i*.06}));},
    'skill-hammer':()=>{tone({f:90,to:34,dur:.5,vol:.4,at:.38,attack:.02});noise({dur:.55,type:'lowpass',f:900,to:90,vol:.35,at:.38});tone({f:196,dur:.9,type:'triangle',vol:.1,at:.4});tone({f:262,dur:.9,type:'triangle',vol:.06,at:.4,detune:9});},
    'skill-bow':()=>{tone({f:220,to:110,dur:.12,type:'triangle',vol:.22});tone({f:900,to:2800,dur:.2,type:'sawtooth',vol:.09,at:.02});noise({dur:.22,type:'highpass',f:2500,to:6000,vol:.14,at:.02});tone({f:1760,dur:.35,vol:.06,at:.1});},
    'skill-blue':()=>{[659,880,1175,1568].forEach((f,i)=>tone({f,dur:.35,vol:.1,at:i*.07,type:'sine'}));noise({dur:.4,f:1500,to:4200,q:.8,vol:.07,attack:.1});},
    'skill-red':()=>{tone({f:98,to:147,dur:.55,type:'sawtooth',vol:.14,attack:.04});tone({f:147,to:196,dur:.55,type:'sawtooth',vol:.09,attack:.04,detune:12});noise({dur:.5,type:'lowpass',f:300,to:1400,vol:.16,attack:.1});},
    'skill-yellow':()=>{[1047,1568,2093].forEach((f,i)=>tone({f,dur:.5,type:'triangle',vol:.1,at:i*.05,detune:i*7}));tone({f:523,dur:.6,type:'sine',vol:.08});},
    'skill-stun':()=>{tone({f:150,to:60,dur:.45,type:'square',vol:.13});noise({dur:.14,f:2200,q:2,vol:.2});noise({dur:.14,f:3200,q:2,vol:.15,at:.12});tone({f:900,to:300,dur:.3,type:'triangle',vol:.1,at:.05});},
    'skill-heal':()=>{tone({f:330,to:196,dur:.22,type:'sawtooth',vol:.07});tone({f:440,to:660,dur:.4,type:'triangle',vol:.12,at:.12});tone({f:880,dur:.4,type:'sine',vol:.06,at:.25});},
    'skill-ready':()=>{tone({f:988,dur:.2,type:'triangle',vol:.1});tone({f:1319,dur:.3,type:'triangle',vol:.1,at:.08});},
    'skill-pierce':()=>{noise({dur:.18,type:'highpass',f:6000,to:1800,vol:.14});tone({f:2400,to:900,dur:.15,type:'triangle',vol:.06});}
  };
  return {
    get enabled(){return enabled;},names:Object.keys(SOUNDS),
    setEnabled(on){
      if(!on){enabled=false;sample.setEnabled(false);return false;}
      if(!ensure()){enabled=false;return false;}
      if(ctx.state==='suspended'&&ctx.resume)ctx.resume();enabled=true;sample.setEnabled(true);return true;
    },
    play(name,opts={}){
      if(!enabled||!ctx)return false;const fn=SOUNDS[name];if(!fn)return false;
      master.gain.value=.5*audioChannelGain('effects');const now=ctx.currentTime,gap=opts.minGap===undefined?.04:opts.minGap;
      if(last[name]!==undefined&&now-last[name]<gap)return false;last[name]=now;
      // Avoid all pitched synth fallback. Weapon skills are already recorded by player-weapon-sfx.
      return name==='skill-heal'?sample.play(name,opts):false;
    }
  };
}
