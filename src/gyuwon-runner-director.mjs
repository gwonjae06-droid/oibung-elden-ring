import {gyuwonMasterScene} from './gyuwon-master-director.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';
import {GYUWON_ALIGNED_CAPTIONS} from './gyuwon-aligned-captions.mjs';

// The recordings own ALL timings. These are authored staging cues calibrated
// to the original-master section map, not a verified full-lyric transcription.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const smooth=x=>{const q=clamp(x);return q*q*(3-2*q);};
export const GYUWON_RUNNER_EXIT_SECONDS=20;
export const GYUWON_RUNNER_ENTER_SECONDS=8;
export const RUNNER_SCENES=Object.freeze({
 overture:{biome:'theater',speed:9,relief:true,hazard:'none'},
 meadow:{biome:'meadow',speed:12,relief:false,hazard:'flower'},
 bridge:{biome:'bridge',speed:13,relief:false,hazard:'plank'},
 rain:{biome:'rain',speed:14.1,relief:false,hazard:'wind'},
 quiet:{biome:'quiet',speed:8.1,relief:true,hazard:'none'},
 sunrise:{biome:'sunrise',speed:16,relief:false,hazard:'blossom'},
 skyroad:{biome:'skyroad',speed:16.8,relief:false,hazard:'cloud'},
 'final-sprint':{biome:'finale',speed:19,relief:false,hazard:'memory'},
 exit:{biome:'exit',speed:9,relief:true,hazard:'none'}
});
export function gyuwonFiveToSixExit(time,duration=GYUWON_SONGS[5].duration){
 const d=Number.isFinite(duration)&&duration>0?duration:180;
 return smooth((time-(d-GYUWON_RUNNER_EXIT_SECONDS))/GYUWON_RUNNER_EXIT_SECONDS);
}
export function gyuwonRunnerScene(time,duration=GYUWON_SONGS[6].duration){
 const d=Number.isFinite(duration)&&duration>0?duration:180;
 // A slightly different encoded file length must not destroy the ending cue.
 const masterTime=clamp(time/d)*GYUWON_SONGS[6].duration;
 const key=gyuwonMasterScene(6,masterTime).kind;
 const base=RUNNER_SCENES[key]||RUNNER_SCENES.meadow;
 return {...base,key,time:masterTime,progress:clamp(time/d),
  opening:1-smooth(masterTime/GYUWON_RUNNER_ENTER_SECONDS),
  farewell:smooth((masterTime-172)/8)};
}
// Line-accurate stage accents sourced from the existing audio-aligned 6수
// captions. These create objects and lighting, not UI pattern explanations.
// Untranscribed instrumental passages keep the authored biome choreography.
export function gyuwonRunnerLyricStage(time){
 const t=Number.isFinite(time)?time:0;
 const cue=GYUWON_ALIGNED_CAPTIONS[6]?.find(x=>t>=x.start&&t<x.end);
 if(!cue)return null;
 const en=cue.en.toLowerCase();
 const kind=/left foot|right foot/.test(en)?'footsteps':
  /sunshine/.test(en)?'sunlight':
  /rain/.test(en)?'shower':
  /mountains/.test(en)?'mountains':
  /answer|none that i/.test(en)?'questions':
  /curtains/.test(en)?'curtains':
  /sea/.test(en)?'sea':
  /lucky star/.test(en)?'star':
  /tomorrow/.test(en)?'tomorrow':
  /dream/.test(en)?'dream':
  /world/.test(en)?'world':null;
 if(!kind)return null;
 const fade=.38,weight=Math.min(1,clamp((t-cue.start)/fade),clamp((cue.end-t)/fade));
 return {kind,weight,start:cue.start,end:cue.end,source:'aligned-original-6su'};
}
// An early shower responds to the known opening lyrics about rain. The full
// original is not yet manually charted; later locations use section anchors.
export function gyuwonRunnerAccent(time){
 const t=Number.isFinite(time)?time:0;
 return {shower:t>=9.8&&t<12.9||gyuwonRunnerLyricStage(t)?.kind==='shower',footsteps:t>=3.3&&t<6.8,
  answer:t>=17.6&&t<22.6,
  star:t>=23.8&&t<26.6||t>=37.48&&t<41,
  chorus:t>=23.8&&t<30};
}
export function gyuwonRunnerGuideAt(time,duration=GYUWON_SONGS[6].duration,helper=null){
 const t=clamp(time/duration)*180;
 if(helper?.guideAction&&helper.guideActionUntil>time){
  return {kind:helper.guideAction,opacity:1,
   targetId:helper.guideWarnId??null,gesture:helper.guideAction};
 }
 if(t>=34&&t<54)return {kind:'bridge',opacity:smooth((t-34)/2)*(1-smooth((t-52)/2))};
 if(t>=54&&t<82)return {kind:'warn',opacity:smooth((t-54)/2)*(1-smooth((t-80)/2))};
 if(t>=107&&t<123)return {kind:'run',opacity:smooth((t-107)/3)*(1-smooth((t-120)/3))};
 if(t>=136&&t<157)return {kind:'bridge',opacity:smooth((t-136)/3)*(1-smooth((t-154)/3))};
 if(t<12)return {kind:'curtain',opacity:1-smooth((t-7)/5)};
 if(t>=90&&t<=104)return {kind:'moon',opacity:smooth((t-90)/3)*(1-smooth((t-101)/3))};
 if(t>=163&&t<=179)return {kind:'gate',opacity:smooth((t-163)/3)*(1-smooth((t-176)/3))};
 return null;
}
export function gyuwonRunnerGap(scene,pickups){
 if(scene.relief||scene.key==='overture'||scene.key==='exit')return 0;
 if(scene.key==='bridge')return pickups%3===1?4.9:3.4;
 if(scene.key==='rain')return pickups%3===1?4.4:3.2;
 if(scene.key==='skyroad')return pickups%3===1?4.8:3.7;
 return pickups%3===1?4.2:3.1;
}
export function gyuwonRunnerObstacleVariant(scene,index){
 return {
  meadow:['flower','thorn'],bridge:['rope','broken'],rain:['branch','puddle'],
  sunrise:['sunbeam','bramble'],skyroad:['cloud','starfall'],
  finale:['curtain','memory']
 }[scene.biome]?.[index%2]||'flower';
}
export const gyuwonRunnerDashReady=m=>!!m&&m.year===6&&(m.starCharge||0)>=55&&(m.dashCooldown||0)<=0;
