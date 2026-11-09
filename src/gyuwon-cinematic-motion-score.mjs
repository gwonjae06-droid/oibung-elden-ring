// Original-score cinema blocking: pose, anticipation, accent and follow-through
// are driven only by the media clock. Each lyric has an explicitly named action,
// and each action modifies its semantic stance rather than a generic bob.
import {GYUWON_LYRIC_ACTIONS,gyuwonLyricActionAt} from './gyuwon-lyric-actions.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const rest=()=>({chest:0,turn:0,bank:0,headPitch:0,headYaw:0,
 leftArm:0,rightArm:0,leftElbow:0,rightElbow:0,
 leftStep:0,rightStep:0,kneeLift:0,height:0,shoulder:0,handOpen:1,focus:'face'});
const BASE=Object.freeze({
 bow:{chest:.48,headPitch:.26,leftArm:.25,rightArm:.25,focus:'face'},
 open:{chest:-.12,leftArm:-.82,rightArm:-.82,headPitch:-.12,focus:'wide'},
 cast:{leftArm:-1.05,rightArm:-.9,headPitch:-.18,focus:'hands'},
 point:{rightArm:-.73,rightElbow:-.55,turn:.16,headYaw:.17,focus:'hands'},
 present:{rightArm:-.6,leftArm:-.4,chest:-.1,focus:'wide'},
 reach:{rightArm:-.94,rightElbow:-.38,chest:-.09,headYaw:.11,focus:'hands'},
 raise:{leftArm:-1.18,rightArm:-1.18,chest:-.15,headPitch:-.22,focus:'sky'},
 lift:{leftArm:-.88,rightArm:-.78,chest:-.2,focus:'hands'},
 wave:{leftArm:-.58,rightArm:-.75,turn:.13,bank:.1,focus:'world'},
 sweep:{rightArm:-.77,turn:.28,bank:.1,focus:'world'},
 run:{leftStep:-.78,rightStep:.78,chest:.13,leftArm:-.26,rightArm:.32,focus:'feet'},
 walk:{leftStep:-.42,rightStep:.42,chest:.09,leftArm:-.12,rightArm:.16,focus:'feet'},
 jump:{kneeLift:.6,height:.34,leftArm:-.75,rightArm:-.86,chest:-.15,focus:'feet'},
 fly:{height:.38,leftArm:-1.12,rightArm:-1.12,chest:-.17,focus:'sky'},
 spin:{turn:.7,bank:.14,leftArm:-.86,rightArm:-.88,leftStep:-.3,rightStep:.3,focus:'wide'},
 dance:{turn:.34,leftArm:-.63,rightArm:-.5,leftStep:-.52,rightStep:.48,focus:'feet'},
 sway:{bank:.25,turn:.18,leftArm:-.25,rightArm:-.42,focus:'wide'},
 stepleft:{leftStep:-1,rightStep:.25,bank:-.18,turn:-.11,focus:'feet'},
 stepright:{leftStep:-.25,rightStep:1,bank:.18,turn:.11,focus:'feet'},
 tap:{leftStep:-.62,rightStep:.62,kneeLift:.31,focus:'feet'},
 stamp:{kneeLift:.6,rightStep:.48,chest:.15,focus:'feet'},
 clap:{leftArm:-.72,rightArm:-.72,leftElbow:-.77,rightElbow:-.77,focus:'hands'},
 snap:{rightArm:-.65,rightElbow:-.42,headYaw:.1,focus:'hands'},
 ponder:{headPitch:.24,rightArm:-.39,rightElbow:-.48,focus:'face'},
 search:{headYaw:.38,turn:.21,rightArm:-.2,focus:'face'},
 whisper:{headPitch:.12,rightArm:-.52,rightElbow:-.5,focus:'face'},
 ask:{headYaw:.18,leftArm:-.18,rightArm:-.32,focus:'face'},
 listen:{headYaw:.18,rightArm:-.58,rightElbow:-.65,focus:'face'},
 lookback:{turn:-.36,headYaw:-.38,leftArm:-.24,focus:'face'},
 heart:{headPitch:.16,leftArm:-.44,rightArm:-.39,leftElbow:-.46,rightElbow:-.48,focus:'face'},
 offer:{leftArm:-.3,rightArm:-.81,rightElbow:-.34,focus:'hands'},
 tease:{bank:.12,headYaw:-.16,rightArm:-.22,focus:'face'},
 shrug:{bank:.12,leftArm:-.3,rightArm:-.3,headYaw:.14,focus:'face'},
 transform:{turn:.63,leftArm:-.9,rightArm:-.73,focus:'wide'},
 fight:{turn:.22,rightArm:-.62,leftArm:.3,rightStep:.42,focus:'hands'},
 stepstrike:{leftStep:-.68,rightStep:.55,rightArm:-1.0,turn:.4,focus:'hands'},
 jab:{rightArm:-.9,rightStep:.39,turn:.19,focus:'hands'},
 kick:{kneeLift:.78,rightStep:.91,bank:-.23,focus:'feet'},
 blade:{rightArm:-1.03,rightElbow:-.33,turn:.31,focus:'hands'},
 slam:{leftArm:-1.12,rightArm:-1.1,chest:.43,kneeLift:.36,focus:'hands'},
 gather:{leftArm:-.7,rightArm:-.7,leftElbow:-.45,rightElbow:-.45,focus:'hands'},
 rise:{height:.36,chest:-.2,headPitch:-.12,focus:'wide'},
 fall:{height:-.4,chest:.52,headPitch:.25,focus:'face'},
 still:{headPitch:.18,leftArm:.06,rightArm:.06,focus:'face'},
 fade:{headPitch:.18,chest:.06,focus:'face'},
 narrate:{rightArm:-.45,headYaw:.12,focus:'face'},
 sing:{chest:-.06,headPitch:-.17,leftArm:-.52,rightArm:-.62,focus:'face'},
 king:{chest:-.19,headPitch:-.16,leftArm:-.25,rightArm:-.25,focus:'face'},
 knight:{rightArm:-1.11,leftArm:.26,chest:.17,rightStep:.48,focus:'hands'},
 clear:{leftArm:-.96,rightArm:-.8,headPitch:-.09,focus:'wide'},
 conduct:{rightArm:-.86,leftArm:-.35,headPitch:-.09,focus:'hands'},
 slap:{rightArm:-1.06,chest:.36,kneeLift:.28,focus:'hands'},
 pull:{leftArm:-.9,rightArm:-.9,chest:.24,focus:'hands'},
 hold:{chest:0,headPitch:.02,focus:'face'}
});
// Every lyric name gets a deliberate accent assignment. Refrains are not copy:
// each uses its own foot, arm or stage direction while keeping the same button count.
const SIGNATURE=Object.freeze({
 greet:{chest:.65,headPitch:.31},welcome:{leftArm:-1.1,rightArm:-1.1},
 thousandDoors:{turn:.33,leftArm:-1.2},millionRoads:{turn:-.28,rightArm:-1.2},
 blueGoldSea:{bank:.24,turn:.18},kingTomorrow:{headPitch:-.22,leftArm:-.22},
 savingKnight:{rightArm:-1.35,rightStep:.52},
 raiseCurtain:{leftArm:-1.27,rightArm:-1.27},
 trumpetFanfare:{rightElbow:-.95,headYaw:.09},
 becomeAnyone:{turn:1.25,bank:.16},danceWorld:{leftStep:-.43,rightStep:.63},
 dreamFlight:{leftArm:-1.3,rightArm:-1.3},
 takeMyHand:{rightArm:-1.2,rightElbow:-.24},
 fallAndLaugh:{chest:.71,height:-.39},
 onlyBeginning:{chest:-.15,rightArm:-1.16},
 leftRightFoot:{leftStep:-.98,rightStep:.93},
 rainDance:{turn:1.14,bank:.19},mountainLeap:{kneeLift:1.0,height:.56},
 repeatLeap:{kneeLift:.89,height:.5,rightStep:1.06},
 dontLookBack:{headYaw:-.55,turn:-.22},
 spinningSky:{headPitch:-.26,turn:.28},
 touchBlue:{height:.63,leftArm:-1.2},
 curtainDrops:{leftArm:-1.12,rightArm:-1.12},
 luckyStar:{rightArm:-1.25,headPitch:-.27},
 dreamDestination:{rightStep:.5,chest:-.17},
 hearMusic:{rightArm:-.7,rightElbow:-.97},
 feelRhythm:{bank:.32,turn:.2},
 leftStep:{leftStep:-1.28,rightStep:.21},
 rightStep:{leftStep:-.18,rightStep:1.28},
 tapStars:{kneeLift:.48,leftStep:-.61},
 clapAndReach:{leftElbow:-1.12,rightElbow:-1.1},
 spinTakeBow:{turn:1.05,chest:.37},
 neverMiss:{leftStep:-.53,rightStep:.57},
 worldChoir:{leftArm:-1.02,rightArm:-1.04,headPitch:-.15},
 musicFades:{height:-.09,headPitch:.28},
 anotherTune:{rightElbow:-.72},
 danceThrough:{turn:.58,leftStep:-.81},
 starsEncore:{kneeLift:.59,rightStep:.68},
 clapEncore:{leftArm:-1.05,rightArm:-1.05},
 tomorrowRain:{rightArm:-1.0,headPitch:-.29},
 danceAgain:{turn:1.28,leftArm:-1.0,rightArm:-1.0},
 danceOrFight:{chest:-.28,rightArm:-.57,rightStep:.43},
 kingClown:{turn:.69,chest:.13,headYaw:.34},
 upsideWorld:{turn:.87,leftArm:-1.28,rightArm:-1.16},
 runAndFly:{height:.45,rightStep:.78},
 leftSwingRight:{leftStep:-1.06,rightStep:.63,rightArm:-1.28,turn:.55},
 battleBright:{leftArm:-1.09,rightArm:-.8},
 turnWorldAgain:{turn:-.99,leftArm:-1.33},
 chanceAndDance:{rightStep:.91,bank:-.3},
 smileAndFly:{height:.64,headPitch:-.28},
 thoughtIdWon:{chest:.48},battleAgain:{headYaw:.39},
 roundEcho1:{rightArm:-1.22,rightStep:.45},
 roundEcho2:{rightStep:1.27,kneeLift:1.05},
 roundEcho3:{rightArm:-1.32,turn:.55},
 roundEcho4:{chest:.66,leftArm:-1.4,rightArm:-1.4},
 roundEcho5:{leftArm:-.83,rightArm:-.83},
 grandRound:{leftArm:-1.36,rightArm:-1.36},
 fallRise:{height:-.26,chest:.53},tillTheEnd:{rightArm:-1.18},
 wonderWalk:{leftStep:-.54,rightStep:.5},
 rainFireThunder:{turn:.58,rightArm:-1.16},
 thousandParts:{turn:.78,headYaw:.25},
 runAndFight:{rightStep:.93,rightArm:-1.12},
 notAsSeems:{headYaw:-.36,chest:.2},
 oneMoreDance:{leftStep:-.72,rightStep:.72},
 smallMagic:{height:-.14,rightArm:-.66},
 manySkies:{headPitch:-.3,rightArm:-.79},
 wishesPass:{headYaw:.3,rightArm:-1.12},
 whereBelong:{leftStep:-.12,rightStep:.12,headYaw:.46},
 findInSong:{headPitch:.24,leftElbow:-.58,rightElbow:-.58},
 shiningStar:{headPitch:-.31,leftArm:-1.32,rightArm:-1.3},
 danceTogether:{turn:1.01,leftStep:-.71},
 iRun:{leftStep:-1.01,rightStep:.97},
 weRun:{leftStep:-.93,rightStep:1.05},
 discoverUs:{chest:.62,headPitch:.23},
 onceUpon:{rightArm:-.54,headYaw:.2},
 dreamingBoy:{headPitch:-.33,rightArm:-1.06},
 neverFind:{rightArm:-1.3,headPitch:.21},
 everyDoor:{leftStep:-.65,rightStep:.71},
 learnFly:{leftArm:-1.37,rightArm:-1.37},
 whatDream:{headPitch:.38,headYaw:.1},
 whatBecome:{headYaw:-.48},
 firstTime:{headPitch:.23,leftArm:.1,rightArm:.1},
 stopRunning:{chest:.14,headPitch:.34,leftStep:0,rightStep:0},
 searchedWorld:{turn:-.4,headYaw:-.5},
 insideHeart:{chest:.23,headPitch:.18,rightElbow:-.77},
 justWanted:{rightArm:-.95,headPitch:.08},
 wayHome:{leftStep:-.54,rightStep:.57,headPitch:.05}
});
const FOCI=Object.freeze({steps:'feet',mountain:'feet',rain:'world',sea:'world',city:'world',doors:'world',
 windows:'world',home:'world',stars:'sky',sun:'sky',sky:'sky',wings:'sky',
 curtain:'world',trumpet:'hands',sword:'hands',crown:'face',mirror:'face',
 masks:'face',heart:'face',spotlight:'face',dancers:'wide',choir:'wide'});
const samples=Object.freeze(['chest','turn','bank','headPitch','headYaw','leftArm','rightArm',
 'leftElbow','rightElbow','leftStep','rightStep','kneeLift','height','shoulder','handOpen']);
const compile=cue=>{
 const pose=rest(),base=BASE[cue.gesture]||BASE.hold;
 Object.assign(pose,base,SIGNATURE[cue.actionId]||{});
 pose.focus=FOCI[cue.visual]||pose.focus;
 // Scores within a song are individual: a singer visually takes direction
 // before the right-hand hero prop answers, without changing combat physics.
 const tempo=.23+(cue.index%4)*.035;
 return Object.freeze({...cue,motion:Object.freeze(pose),
  anticipation:tempo,accent:clamp(.50+(cue.index%3)*.045),recovery:.82,
  direction:cue.actionId==='stepleft'||cue.actionId==='leftStep'?-1:
    cue.actionId==='stepright'||cue.actionId==='rightStep'?1:cue.index%2?1:-1});
};
export const GYUWON_CINEMATIC_SCORE=Object.freeze(Object.fromEntries(
 Object.entries(GYUWON_LYRIC_ACTIONS).map(([year,rows])=>[year,Object.freeze(rows.map(compile))])));
function envelope(profile,p){
 const a=profile.anticipation,peak=profile.accent,recover=profile.recovery;
 if(p<a)return -(.16*(1-smooth(p/a)));
 if(p<peak)return smooth((p-a)/(peak-a));
 if(p<recover)return mix(1,.88,smooth((p-peak)/(recover-peak)));
 return mix(.88,0,smooth((p-recover)/(1-recover)));
}
function evaluate(profile,p,t){
 const v=envelope(profile,p),out={...profile.motion};
 for(const k of samples)out[k]=out[k]*v;
 const movement=['walk','run','stepleft','stepright','tap','dance','sway','spin','jump','fly','stepstrike','fight'].includes(profile.gesture);
 const cadence=Math.sin(t*(profile.gesture==='run'?11:6)+profile.index*.43);
 if(movement){
  out.leftStep+=cadence*Math.abs(v)*.19;
  out.rightStep-=cadence*Math.abs(v)*.19;
  out.height+=Math.max(0,cadence)*Math.abs(v)*.07;
 }
 if(profile.gesture==='spin'||profile.gesture==='transform'){
  out.turn+=profile.direction*smooth((p-.22)/.55)*Math.PI*.35;
 }
 out.focus=profile.motion.focus;
 return out;
}
const blend=(a,b,w)=>{
 const out={...a};for(const k of samples)out[k]=mix(a[k],b[k],w);
 out.focus=w>.55?b.focus:a.focus;
 return out;
};
// Explicit lyric gaps hold a weighted recovery pose, no sudden T-pose.
export function gyuwonCinematicMotionAt(year,time){
 const key=String(year),rows=GYUWON_CINEMATIC_SCORE[key];
 if(!rows||!Number.isFinite(time))return null;
 const lyric=gyuwonLyricActionAt(key,time);
 let index=lyric?.index??-1;
 if(index<0){for(let i=0;i<rows.length;i++)if(rows[i].end<=time)index=i;else break;}
 if(index<0)return {cue:null,focus:'wide',pose:rest(),active:false};
 const profile=rows[index],duration=Math.max(.01,profile.end-profile.start);
 const p=lyric?clamp((time-profile.start)/duration):1,
  pose=evaluate(profile,p,time);
 if(lyric&&index>0){
  const prev=rows[index-1],gap=Math.max(0,profile.start-prev.end),blendTime=Math.min(.28,.14+gap*.2);
  if(time-profile.start<blendTime){
   const exitPose=evaluate(prev,1,prev.end);
   const w=smooth((time-profile.start)/blendTime);
   return {cue:lyric,focus:pose.focus,pose:blend(exitPose,pose,w),active:true};
  }
 }
 return {cue:lyric||profile,focus:pose.focus,pose,active:!!lyric};
}
export const gyuwonCinematicCoverage=()=>Object.fromEntries(
 Object.entries(GYUWON_CINEMATIC_SCORE).map(([k,v])=>[k,v.length]));
