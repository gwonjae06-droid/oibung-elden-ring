import {GYUWON_ALIGNED_CAPTIONS} from './gyuwon-aligned-captions.mjs';
import {actFiveChoreographyAt} from './gyuwon-act-five-choreography.mjs';
import {actFiveInstrumentalAt} from './gyuwon-act-five-vocal-acting.mjs';
const cues=GYUWON_ALIGNED_CAPTIONS[5];
const score=[
 ['greet','invitation'],['welcome','invitation'],['choose','doors'],
 ['doors','doors'],['roads','doors'],['sea','wave'],['dream','stars'],
 ['king','crown'],['knight','strike'],['wipe','invitation'],['adventure','chase'],
 ['curtain','strike'],['brass','fan'],['costume','crown'],
 ['stage','strike'],['dance','waltz'],['run','chase'],['self','invitation'],
 ['sky','stars'],['flight','stars'],['hand','invitation'],['together','fan'],
 ['roles','stars'],['choose','crown'],['crowns','crown'],['laugh','breather'],
 ['stage','strike'],['dance','waltz'],['run','chase'],['self','invitation'],
 ['friends','invitation'],['beginning','fan']
];
export const ACT_FIVE_SCORE=Object.freeze(cues.map((c,i)=>Object.freeze({index:i,start:c.start,end:c.end,gesture:score[i][0],pattern:score[i][1]})));
const clamp=x=>Math.max(0,Math.min(1,x));
export const scoreEase=x=>{x=clamp(x);return x*x*(3-2*x);};
export function actFivePerformanceAt(time){
 const cue=ACT_FIVE_SCORE.findLast(c=>time>=c.start&&time<c.end+.55);
 if(!cue)return actFiveInstrumentalAt(time);
 return {...cue,time,weight:scoreEase((time-cue.start)/.3)*(1-scoreEase((time-cue.end)/.55)),progress:clamp((time-cue.start)/(cue.end-cue.start)),instrumental:false,vocal:true};
}
// A pattern stays attached to its complete windup/contact/recovery even if a
// sung phrase ends while the actor is moving. There are no instant lyric hits.
export function actFiveAttackProfile(time,part){
 const p=actFivePerformanceAt(time),kind=part<2?({wave:'sweep',waltz:'waltz',chase:'chase',strike:'strike',doors:'sweep'}[p.pattern]||'reach'):p.pattern;
 if(p.index<0&&time<135)return {kind:'reach',wind:1.4,impactAt:2.1,duration:3.15,multi:false};
 const wind=kind==='strike'?1.65:kind==='chase'?1.35:kind==='reach'?1.65:1.5;
 return {kind,wind,impactAt:wind+.8,duration:wind+1.9,multi:part>=2&&['fan','stars'].includes(kind)};
}
// Preserve a clear silhouette for the three connected, literal sung actions.
// An already launched strike completes; its next windup cannot overlap them.
export const actFiveLiteralFocusAt=(time,lookAhead=0)=>time<82.89&&time+lookAhead>=67.34;
export function actFiveAttackPoint(attack,from,to,age,side=1){
 const q=scoreEase((age-attack.wind)/(attack.impactAt-attack.wind)),back=scoreEase((age-attack.impactAt-.2)/.85),pre=scoreEase(age/attack.wind),arc=Math.sin(q*Math.PI);
 const lift=attack.kind==='strike'?8:attack.kind==='reach'?2:5;
 const sweep=['sweep','waltz','chase'].includes(attack.kind)?side*arc*(attack.kind==='chase'?3:6):0;
 return {x:from.x+(to.x-from.x)*q+sweep,y:(from.y+Math.sin(pre*Math.PI)*lift)*(1-q)+to.y*q+(attack.kind==='stars'?arc*7:0),z:from.z+(to.z-from.z)*q,back};
}
// The actual five boss part colliders take the blocking positions before the
// renderer moves a single pixel; a hand never acts in one place and hits
// elsewhere. Collision-owned attacks override idle sung choreography.
export function poseActFiveHands(m,dt){
 const pose=actFiveChoreographyAt(m.time,m.songPerformance,{hitUntil:m.hitTargetUntil||0,bpm:m.bpm||136});
 m.handPose=pose;
 const k=1-Math.exp(-Math.max(0,dt)*7.5);
 for(let index=0;index<2;index++){
  // Only a hand actually making physical contact owns its wrist. The other
  // hand, both hands during ally/projectile actions, and harmless broken parts
  // continue the song. Target HP and attackability do not control anatomy.
  if(m.raidAttack?.part===index)continue;
  const e=m.enemies[index],[x,y,z]=pose.handTargets[index];
  e.x+=(x-e.x)*k;e.y+=(y-e.y)*k;e.z+=(z-e.z)*k;
 }
}
