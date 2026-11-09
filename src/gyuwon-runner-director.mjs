import {gyuwonMasterScene} from './gyuwon-master-director.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';

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
// An early shower responds to the known opening lyrics about rain. The full
// original is not yet manually charted; later locations use section anchors.
export function gyuwonRunnerAccent(time){
 const t=Number.isFinite(time)?time:0;
 return {shower:t>=9.8&&t<12.9,footsteps:t>=3.3&&t<6.8,
  answer:t>=17.6&&t<22.6,
  star:t>=23.8&&t<26.6||t>=37.48&&t<41,
  chorus:t>=23.8&&t<30};
}
export function gyuwonRunnerGuideAt(time,duration=GYUWON_SONGS[6].duration){
 const t=clamp(time/duration)*180;
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
