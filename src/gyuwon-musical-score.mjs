import {audioChannelGain} from './audio-preferences.mjs';

// Original, instrumental Broadway-style orchestral sketch, NOT a copy of a
// Disney recording or tune. Sample-free warm strings/brass/piano voicings,
// soft percussion and room convolution. A mastered instrumental MP3 can later
// replace this score without changing the stage/camera/gameplay contracts.
const SONG=Object.freeze([0,2,4,7,9,7,4,2,5,7,9,12,11,9,7,4,
  4,5,7,11,12,9,7,5,2,4,7,9,7,4,2,0]);
const PRELUDE=Object.freeze([0,3,7,5,3,0,-2,0,2,5,7,5,3,2,0,-2]);
const LAMENT=Object.freeze([0,-2,-3,-7,-5,-3,-2,-5,-7,-10,-8,-7,-3,-5,-7,-12]);
const midi=n=>440*Math.pow(2,(n-69)/12);
export function createGyuwonMusicalScore(makeContext=()=>null){
 let ctx=null,master=null,rev=null,next=0,beat=0,section='',disposed=false;
 let noise=null,voiceCount=0;
 function ensure(){
  if(disposed)return false;
  if(ctx)return true;
  try{
   ctx=makeContext();
   if(!ctx)return false;
   master=ctx.createGain();master.gain.value=0;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=5400;
   master.connect(filter);filter.connect(ctx.destination);
   rev=ctx.createConvolver();
   const seconds=1.15,len=Math.ceil(ctx.sampleRate*seconds),ir=ctx.createBuffer(2,len,ctx.sampleRate);
   for(let k=0;k<2;k++){
    const samples=ir.getChannelData(k);
    for(let i=0;i<len;i++){
     const t=i/len;
     samples[i]=(Math.random()*2-1)*Math.pow(1-t,3)*.22;
    }
   }
   rev.buffer=ir;const wet=ctx.createGain();wet.gain.value=.24;
   master.connect(rev);rev.connect(wet);wet.connect(ctx.destination);
   noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.2),ctx.sampleRate);
   const n=noise.getChannelData(0);for(let i=0;i<n.length;i++)n[i]=(Math.random()*2-1)*Math.exp(-i/n.length*9);
   next=ctx.currentTime+.06;
   return true;
  }catch(error){try{ctx?.close?.();}catch{}ctx=null;return false;}
 }
 function tone(note,time,duration,voice='strings',loudness=.1){
  if(!ctx||!master||voiceCount>90)return;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  const hz=midi(note),isBrass=voice==='brass',isPiano=voice==='piano';
  oscillator.type=isBrass?'sawtooth':isPiano?'triangle':'sawtooth';
  oscillator.frequency.setValueAtTime(hz,time);
  filter.type='lowpass';filter.frequency.setValueAtTime(isBrass?2200:isPiano?3100:1250,time);
  filter.Q.value=isBrass?.8:.2;
  const attack=isPiano?.012:isBrass?.045:.14;
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,loudness),time+attack);
  if(isPiano)gain.gain.exponentialRampToValueAtTime(.0002,time+duration*.91);
  else{
   gain.gain.setValueAtTime(Math.max(.0002,loudness),time+Math.max(attack,duration*.72));
   gain.gain.exponentialRampToValueAtTime(.0002,time+duration);
  }
  oscillator.connect(filter);filter.connect(gain);gain.connect(master);
  oscillator.start(time);oscillator.stop(time+duration+.02);voiceCount++;
  oscillator.onended=()=>{voiceCount--;oscillator.disconnect();filter.disconnect();gain.disconnect();};
 }
 function drums(time,heavy=false){
  if(!ctx||!noise)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  source.buffer=noise;filter.type='lowpass';filter.frequency.value=heavy?360:900;
  gain.gain.setValueAtTime(heavy?.12:.045,time);
  gain.gain.exponentialRampToValueAtTime(.0001,time+.15);
  source.connect(filter);filter.connect(gain);gain.connect(master);
  source.start(time);source.stop(time+.17);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 }
 function schedule(mode,index,time,year){
  const minor=mode!=='musical',line=mode==='lament'?LAMENT:minor?PRELUDE:SONG;
  const base=mode==='lament'?60:mode==='prelude'?59:60;
  const note=base+line[index%line.length];
  const pulse=mode==='prelude'?.62:mode==='lament'?.88:.38;
  const toneName=mode==='lament'?'strings':mode==='prelude'?'piano':index%4===0?'brass':'strings';
  tone(note,time,pulse*1.7,toneName,mode==='lament'?.072:minor?.09:.072);
  if(index%2===0)tone(base-12+[0,5,9,7][Math.floor(index/4)%4],
   time,pulse*3.3,'strings',mode==='lament'?.055:.052);
  if(!minor&&index%4===0){
   const chord=[0,4,7];for(const part of chord)tone(base-3+part,time,pulse*3.3,'strings',.042);
  }
  if(!minor&&index%2===0)drums(time,index%4===0);
 }
 function update(g,{enabled=true,muted=false}={}){
  if(!enabled||muted||disposed){if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.045);return false;}
  if(!ensure())return false;
  try{if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}
  const e=g?.gyuwon?.years;
  const mode=e?.musical?.finishing?'lament':e?.year>=5?'musical':'prelude';
  const key=mode+':'+(mode==='musical'?e.year:0);
  if(section!==key){section=key;beat=0;next=ctx.currentTime+.12;}
  master.gain.setTargetAtTime(.18*audioChannelGain('music'),ctx.currentTime,.18);
  const tempo=mode==='lament'?.77:mode==='prelude'?.72:
   e.year===8?.54:e.year===11?.46:.43;
  let guard=0;
  while(next<ctx.currentTime+.15&&guard++<6){
   schedule(mode,beat++,next,e.year);next+=tempo;
  }
  return true;
 }
 function stop(){if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.035);}
 function dispose(){if(disposed)return;disposed=true;stop();try{ctx?.close?.();}catch{}ctx=null;}
 return {update,stop,dispose,get mode(){return section;}};
}
