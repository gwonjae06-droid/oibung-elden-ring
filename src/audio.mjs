import {soundVariation,kwonFight} from './sound-variation.mjs';
import {createSampleSfx,SOUND_SAMPLES} from './sample-sfx.mjs';
import {audioChannelGain} from './audio-preferences.mjs';
const LIMIT=48;
export function createAudio(factory){
 let ctx=null,master=null,ambientBus=null,noise=null,enabled=false,drone=null;const nodes=new Set(),ends=new Map(),last=new Map();
 const samples=createSampleSfx();
 const make=factory||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;});
 function addReverb(comp){
  if(typeof ctx.createConvolver!=='function')return;
  try{
   const len=Math.max(1,Math.floor(ctx.sampleRate*1.4)),ir=ctx.createBuffer(2,len,ctx.sampleRate);
   for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len)**2.6;}
   const conv=ctx.createConvolver(),wet=ctx.createGain();conv.buffer=ir;wet.gain.value=.16;master.connect(conv);conv.connect(wet);wet.connect(comp);
  }catch{}
 }
 function ensure(){if(ctx)return true;try{ctx=make();if(!ctx)return false;master=ctx.createGain();master.gain.value=.44*audioChannelGain('effects');const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);ambientBus=ctx.createGain();ambientBus.gain.value=audioChannelGain('ambient');ambientBus.connect(comp);addReverb(comp);noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*2),ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return true;}catch{ctx=null;return false;}}
 function prune(){const now=ctx.currentTime;for(const [s,e] of ends)if(e<=now){ends.delete(s);nodes.delete(s);}}
 // No pitched oscillators in gameplay SFX: short filtered noise conveys motion,
 // blunt hits and warnings without retro 8-bit beeps.
 function emit(q,j,power=1){
  prune();if(nodes.size>=LIMIT)return;
  const [kind,f,to,dur,vol,type='bandpass',delay=0,attack=.005]=q;
  const t=ctx.currentTime+delay/j.speed,end=t+(Math.min(dur,.52)+attack)/j.speed;
  const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=noise;s.loop=true;
  filter.type=kind==='t'||type==='sine'||type==='square'||type==='sawtooth'||type==='triangle'?'lowpass':type;
  filter.Q.value=.6;
  const first=kind==='t'?Math.max(90,Math.min(900,f*.65)):Math.max(100,Math.min(3000,f));
  const last=kind==='t'?Math.max(65,Math.min(500,(to||f)*.6)):Math.max(100,Math.min(2600,to||f));
  filter.frequency.setValueAtTime(first*j.pitch,t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(50,last*j.pitch),end);
  s.connect(filter);filter.connect(g);
  const peak=Math.min(.2,vol*(kind==='t'?.52:.7)*j.gain*power);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(Math.max(.0002,peak),t+attack/j.speed);
  g.gain.exponentialRampToValueAtTime(.0001,end);g.connect(master);
  nodes.add(s);ends.set(s,end+.05);
  s.onended=()=>{nodes.delete(s);ends.delete(s);s.disconnect();filter.disconnect();g.disconnect();};
  s.start(t);s.stop(end+.03);
 }
 const R={
 'swing-sword':[['n',900,3200,.18,.2],['t',2400,3600,.1,.04,'triangle',.02]],
 'swing-hammer':[['n',600,180,.32,.32,'lowpass',0,.08],['t',95,48,.25,.14,'sine',.1],['t',60,34,.3,.1,'sine',.2]],
 'swing-bow':[['t',240,170,.22,.2,'triangle'],['n',2500,0,.05,.12,'highpass']],
 'swing-cards':[['n',3200,0,.05,.1,'highpass'],['n',3200,0,.05,.1,'highpass',.045],['n',3200,0,.05,.1,'highpass',.09]],
 roll:[['n',400,1300,.3,.12],['n',160,90,.3,.06,'lowpass']],
 'hit-boss':[['t',150,52,.2,.3],['n',1800,0,.09,.18],['t',72,34,.3,.22,'sine'],['n',5200,0,.05,.07,'highpass']],
 'hit-player':[['t',115,40,.36,.22,'sawtooth'],['n',900,0,.22,.32,'lowpass'],['t',58,28,.42,.2,'sine']],
 dodge:[['t',880,1320,.12,.08],['n',3800,0,.06,.04,'highpass']],
 healed:[['t',523,0,.35,.1,'triangle'],['t',659,0,.35,.1,'triangle',.09],['t',784,0,.35,.1,'triangle',.18]],
 'tele-slash':[['n',300,1500,.55,.12,'bandpass',0,.15],['t',70,115,.55,.07,'sawtooth',0,.15]],
 'tele-thrust':[['t',60,160,.7,.1,'sawtooth',0,.25],['n',400,2200,.7,.1,'bandpass',0,.25]],
 'tele-slam':[['t',45,95,.85,.22,'sine',0,.3],['n',200,700,.85,.16,'lowpass',0,.3]],
 'tele-whirl':[['t',120,280,.85,.05,'square',0,.3],['n',500,1250,.6,.12]],
 'boss-slash':[['n',1400,300,.3,.3],['t',180,70,.3,.1,'sawtooth']],
 'boss-thrust':[['n',2200,400,.5,.3,'lowpass',0,.03],['t',100,60,.5,.1,'sawtooth']],
 'boss-slam':[['n',1200,300,.25,.2,'lowpass'],['t',70,30,.55,.42,'sine',.3],['n',500,120,.45,.3,'lowpass',.3],['t',38,24,.7,.28,'sine',.3]],
 'boss-whirl':[['n',1500,400,.22,.26],['n',1300,400,.22,.26,'bandpass',.2],['n',1100,400,.22,.26,'bandpass',.4],['n',900,400,.22,.26,'bandpass',.6]],
 phase:[['t',90,38,1.2,.26,'sawtooth'],['t',140,58,1.2,.08,'square'],['n',700,140,1.2,.24,'lowpass'],['t',55,220,1.2,.1,'sawtooth',0,.5],['n',200,2400,1.2,.1,'bandpass',0,.6]],
 stagger:[['n',1500,0,.25,.24,'highpass'],['t',300,100,.3,.16,'triangle'],['t',1320,880,.25,.05,'square']],
 victory:[['t',392,0,.7,.14,'triangle'],['t',494,0,.7,.14,'triangle',.14],['t',587,0,.7,.14,'triangle',.28],['t',784,0,.7,.14,'triangle',.42],['t',98,0,1.2,.12],['t',196,0,1.4,.05,'sine',.05,.3],['t',294,0,1.4,.05,'sine',.2,.3]],
 death:[['t',220,55,1.4,.18,'sawtooth'],['n',600,100,1,.2,'lowpass'],['t',60,28,1.6,.2,'sine']],
 ui:[['t',620,0,.06,.06,'triangle']]
 };
 function stopDrone(){if(!drone)return;for(const n of drone.nodes){try{n.stop();}catch{}n.disconnect();}drone.gain.disconnect();drone=null;}
 return {
  get enabled(){return enabled;},names:Object.keys(R),
  setEnabled(on){if(on){if(!ensure())return enabled=false;ctx.resume?.()?.catch(()=>{});enabled=true;samples.setEnabled(true);}else{enabled=false;samples.setEnabled(false);stopDrone();for(const s of [...nodes]){try{s.stop();}catch{}}nodes.clear();ends.clear();}return enabled;},
  play(name,opts={}){if(!enabled||!ctx||!R[name])return false;const t=ctx.currentTime;if(t-(last.get(name)??-Infinity)<(opts.minGap??.03))return false;last.set(name,t);// Never generate retro waveforms. Keep the physical air ambience via ambience().
  // Healing/death recordings still play; events without a recorded asset are silent.
  if(!Object.hasOwn(SOUND_SAMPLES,name))return false;
  if(name.startsWith('boss-')&&!kwonFight())return false;
  return samples.play(name,opts);},
  ambience(on){
   if(!ctx)return;
   if(!on){stopDrone();return;}
   if(!enabled||drone)return;
   // Unpitched, filtered air replaces the earlier five-oscillator electronic drone.
   ambientBus.gain.value=audioChannelGain('ambient');const gain=ctx.createGain();gain.gain.value=.035;gain.connect(ambientBus);
   const wind=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
   wind.buffer=noise;wind.loop=true;filter.type='lowpass';filter.frequency.value=230;filter.Q.value=.45;
   wind.connect(filter);filter.connect(gain);
   wind.start();drone={gain,nodes:[wind,filter]};
  },
  get activeDrone(){return Boolean(drone);}
 };
}
