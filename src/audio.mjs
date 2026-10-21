import {soundVariation,kwonFight} from './sound-variation.mjs';
const LIMIT=48;
export function createAudio(factory){
 let ctx=null,master=null,noise=null,enabled=false,drone=null;const nodes=new Set(),last=new Map();
 const make=factory||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;});
 function ensure(){if(ctx)return true;try{ctx=make();if(!ctx)return false;master=ctx.createGain();master.gain.value=.44;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*2),ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return true;}catch{ctx=null;return false;}}
 function emit(q,j,power=1){
  if(nodes.size>=LIMIT)return;const [kind,f,to,dur,vol,type='sine',delay=0,attack=.005]=q,t=ctx.currentTime+delay/j.speed,end=t+(dur+attack)/j.speed;
  const s=kind==='n'?ctx.createBufferSource():ctx.createOscillator(),g=ctx.createGain();let filter=null;
  if(kind==='n'){s.buffer=noise;s.loop=true;filter=ctx.createBiquadFilter();filter.type=type==='sine'?'bandpass':type;filter.Q.value=1.1;filter.frequency.setValueAtTime(f*j.pitch,t);if(to)filter.frequency.exponentialRampToValueAtTime(to*j.pitch,end);s.connect(filter);filter.connect(g);}
  else{s.type=type;s.frequency.setValueAtTime(f*j.pitch,t);if(to)s.frequency.exponentialRampToValueAtTime(to*j.pitch,end);s.connect(g);}
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*j.gain*power,t+attack/j.speed);g.gain.exponentialRampToValueAtTime(.0001,end);g.connect(master);nodes.add(s);s.onended=()=>{nodes.delete(s);s.disconnect();filter?.disconnect();g.disconnect();};s.start(t);s.stop(end+.03);
 }
 const R={
 'swing-sword':[['n',900,3200,.18,.2]],'swing-hammer':[['n',600,180,.32,.32,'lowpass',0,.08],['t',95,48,.25,.14,'sine',.1]],
 'swing-bow':[['t',240,170,.22,.2,'triangle'],['n',2500,0,.05,.12,'highpass']],
 'swing-cards':[['n',3200,0,.05,.1,'highpass'],['n',3200,0,.05,.1,'highpass',.045],['n',3200,0,.05,.1,'highpass',.09]],
 roll:[['n',400,1300,.3,.12]],'hit-boss':[['t',150,52,.2,.3],['n',1800,0,.09,.18]],
 'hit-player':[['t',115,40,.36,.22,'sawtooth'],['n',900,0,.22,.32,'lowpass']],dodge:[['t',880,1320,.12,.08]],
 healed:[['t',523,0,.35,.1,'triangle'],['t',659,0,.35,.1,'triangle',.09],['t',784,0,.35,.1,'triangle',.18]],
 'tele-slash':[['n',300,1500,.55,.12,'bandpass',0,.15],['t',70,115,.55,.07,'sawtooth',0,.15]],
 'tele-thrust':[['t',60,160,.7,.1,'sawtooth',0,.25],['n',400,2200,.7,.1,'bandpass',0,.25]],
 'tele-slam':[['t',45,95,.85,.22,'sine',0,.3],['n',200,700,.85,.16,'lowpass',0,.3]],
 'tele-whirl':[['t',120,280,.85,.05,'square',0,.3],['n',500,1250,.6,.12]],
 'boss-slash':[['n',1400,300,.3,.3],['t',180,70,.3,.1,'sawtooth']],
 'boss-thrust':[['n',2200,400,.5,.3,'lowpass',0,.03],['t',100,60,.5,.1,'sawtooth']],
 'boss-slam':[['n',1200,300,.25,.2,'lowpass'],['t',70,30,.55,.42,'sine',.3],['n',500,120,.45,.3,'lowpass',.3]],
 'boss-whirl':[['n',1500,400,.22,.26],['n',1300,400,.22,.26,'bandpass',.2],['n',1100,400,.22,.26,'bandpass',.4],['n',900,400,.22,.26,'bandpass',.6]],
 phase:[['t',90,38,1.2,.26,'sawtooth'],['t',140,58,1.2,.08,'square'],['n',700,140,1.2,.24,'lowpass']],
 stagger:[['n',1500,0,.25,.24,'highpass'],['t',300,100,.3,.16,'triangle']],
 victory:[['t',392,0,.7,.14,'triangle'],['t',494,0,.7,.14,'triangle',.14],['t',587,0,.7,.14,'triangle',.28],['t',784,0,.7,.14,'triangle',.42],['t',98,0,1.2,.12]],
 death:[['t',220,55,1.4,.18,'sawtooth'],['n',600,100,1,.2,'lowpass']],ui:[['t',620,0,.06,.06,'triangle']]
 };
 function stopDrone(){if(!drone)return;for(const n of drone.nodes){try{n.stop();}catch{}n.disconnect();}drone.gain.disconnect();drone=null;}
 return {
  get enabled(){return enabled;},names:Object.keys(R),
  setEnabled(on){if(on){if(!ensure())return enabled=false;ctx.resume?.()?.catch(()=>{});enabled=true;}else{enabled=false;stopDrone();for(const s of [...nodes]){try{s.stop();}catch{}}}return enabled;},
  play(name,opts={}){if(!enabled||!ctx||!R[name])return false;const t=ctx.currentTime;if(t-(last.get(name)??-Infinity)<(opts.minGap??.03))return false;last.set(name,t);const j=soundVariation();let recipes=R[name];if(kwonFight()&&['boss-slash','boss-thrust','boss-slam','boss-whirl'].includes(name))recipes=[['n',name==='boss-thrust'?1900:1200,350,name==='boss-whirl'?.65:.28,.2,'bandpass']];const power=name==='hit-boss'?Math.min(2,Math.max(.4,(opts.amount||60)/80)):1;for(const q of recipes)emit(q,j,power);return true;},
  ambience(on){if(!ctx)return;if(!on){stopDrone();return;}if(!enabled||drone)return;const gain=ctx.createGain();gain.gain.value=.03;gain.connect(master);const a=ctx.createOscillator(),b=ctx.createOscillator();a.type=b.type='sawtooth';a.frequency.value=55;b.frequency.value=55.7;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=170;a.connect(filter);b.connect(filter);filter.connect(gain);a.start();b.start();drone={gain,nodes:[a,b,filter]};},
  get activeDrone(){return Boolean(drone);}
 };
}
