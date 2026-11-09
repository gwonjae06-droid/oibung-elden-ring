import {GYUWON_ALIGNED_CAPTIONS} from './gyuwon-aligned-captions.mjs';
// Original-recording lyric windows are the only authority for lip movement.
// Without phoneme markers in the master, visemes are deliberately approximate,
// spread over the existing aligned sung words rather than invented audio peaks.
const cues=GYUWON_ALIGNED_CAPTIONS[5];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=x=>{const q=clamp(x);return q*q*(3-2*q);};
const vowelWeight=word=>{
 const v=[...word.toLowerCase()].filter(c=>'aeiouy'.includes(c));
 if(!v.length)return [.18];
 return v.map(c=>({a:.94,e:.62,i:.39,o:.93,u:.73,y:.43})[c]);
};
const spoken=cues.map(c=>{
 const beats=c.en.split(/\s+/).flatMap(word=>vowelWeight(word));
 return {...c,beats:beats.length?beats:[.3]};
});
export function actFiveMouthAt(time){
 const cue=spoken.find(c=>time>=c.start&&time<c.end);
 if(!cue)return {singing:false,openness:0,roundness:0,smile:0,phrase:-1};
 const u=clamp((time-cue.start)/(cue.end-cue.start));
 const index=Math.min(cue.beats.length-1,Math.floor(u*cue.beats.length));
 const local=u*cue.beats.length-index;
 const vowel=cue.beats[index];
 const envelope=smooth((time-cue.start)/.16)*(1-smooth((time-cue.end+.01)/-.22));
 const pulse=Math.pow(Math.sin(Math.PI*local),.58);
 return {singing:true,openness:clamp(envelope*(.12+vowel*.82)*(.16+.84*pulse)),
  roundness:vowel,smile:clamp(.3+(.65-vowel)*.35),phrase:cues.indexOf(cue)};
}
export function actFiveInstrumentalAt(time){
 const t=Math.max(0,Number.isFinite(time)?time:0),intro=t<1.44,bridge=t>=82.34&&t<89.86,
  finale=t>=135;
 const sequence=finale?['conduct','dance','flight','friends','beginning','conduct','welcome','dance']:
  bridge?['dream','hand','together','roles']:
  ['welcome','choose','roads','dream','stage','self','conduct','friends'];
 const duration=finale?5.2:bridge?2.1:2.8;
 const offset=finale?t-135:bridge?t-82.34:t;
 const slot=Math.floor(offset/duration)%sequence.length,phase=(offset/duration)%1;
 return {time:t,index:-1,gesture:intro?'greet':sequence[slot],
  pattern:finale?'fan':'invitation',weight:intro?.72:.60+.18*Math.sin(Math.PI*phase),
  progress:phase,instrumental:true,vocal:false};
}
