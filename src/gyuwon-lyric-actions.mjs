// Authored 170-line lyric-to-action score for the UNEDITED original tracks.
// 7 and 10 deliberately have no lyric-action mapping: retain their gameplay.
// Caption timestamps are automatically aligned and require listening QA.
// Every action is evaluated from audio.currentTime, never wall-clock frames.
import {GYUWON_ALIGNED_CAPTIONS} from './gyuwon-aligned-captions.mjs';
const specs={
 5:`
greet:spotlight:bow|welcome:doors:open|whereBegin:world:ponder|thousandDoors:doors:cast|millionRoads:roads:sweep|blueGoldSea:sea:wave|dreamWorld:world:cast|kingTomorrow:crown:king|savingKnight:sword:knight|banishSorrow:fog:clear|adventureCall:road:point|raiseCurtain:curtain:raise|trumpetFanfare:trumpet:conduct|becomeAnyone:masks:spin|moreStage:stage:present|danceWorld:dancers:dance|runFree:road:run|discoverSelf:mirror:ponder|wideBright:sun:open|dreamFlight:wings:fly|takeMyHand:hand:reach|manySelves:clones:open|heroDancerStar:stars:spin|notDecided:mirror:shrug|everyCrown:crown:cast|fallAndLaugh:floor:fall|stageReprise:stage:slap|danceReprise:dancers:dance|runReprise:roads:run|mirrorReprise:mirror:ponder|friends:spotlight:whisper|onlyBeginning:doors:raise
`,
 6:`
leftRightFoot:steps:run|worldBelow:world:point|sunshineRun:sun:run|rainDance:rain:spin|mountainLeap:mountain:jump|repeatLeap:mountain:jump|dontLookBack:roads:run|findNewWorld:doors:point|spinningSky:sky:run|chaseAnswers:question:reach|noAnswers:question:shrug|runTomorrow:sun:run|leaveSorrow:fog:clear|touchBlue:sky:jump|millionThings:stars:run|dontStop:roads:run|curtainDrops:curtain:lift|endlessSea:sea:run|placeForMe:home:point|whyRun:question:ask|noClue:question:shrug|whySoFar:roads:lookback|luckyStar:stars:reach|tomorrowReprise:road:run|sorrowBehind:fog:clear|runEnough:roads:run|dreamDestination:home:point
`,
 8:`
hearMusic:spotlight:listen|everywhere:roads:walk|feelRhythm:pulse:sway|beyondImagine:stage:open|leftStep:steps:stepleft|rightStep:steps:stepright|morningDance:sun:spin|singNight:moon:sing|tapStars:stars:tap|clapAndReach:rings:clap|spinTakeBow:ribbons:bow|needNow:spotlight:present|neverMiss:steps:tap|dreamsUnderfoot:world:stamp|worldChoir:choir:sing|lovelySong:ribbons:spin|musicFades:dark:fade|anotherTune:spotlight:snap|nothingToSing:dark:ponder|danceThrough:steps:dance|starsEncore:stars:tap|clapEncore:rings:clap|tomorrowRain:rain:reach|danceAgain:stage:dance
`,
 9:`
wellWell:spotlight:tease|madeIt:spotlight:clap|danceOrFight:ring:fight|kingClown:masks:transform|upsideWorld:city:flip|runAndFly:wings:jump|fightTry:ring:fight|leftSwingRight:arc:stepstrike|battleBright:ribbons:fight|oneRound:ring:invite|turnWorldAgain:city:flip|chanceAndDance:steps:stepstrike|dreamAnother:shield:rise|hitTheFloor:stage:stomp|fightForWhat:question:ponder|letMeTry:ring:fight|smileAndFly:wings:jump|thoughtIdWon:spotlight:bow|battleAgain:mirror:clone|smileBow:spotlight:bow|whereEnding:doors:reach|whereNow:mirror:search|roundEcho1:echo:jab|roundEcho2:echo:kick|roundEcho3:echo:blade|roundEcho4:echo:slam|roundEcho5:echo:gather|grandRound:ring:raise|showBack:ensemble:transform|fallRise:stage:rise|tillTheEnd:ensemble:reach
`,
 11:`
wonderWalk:roads:walk|rainFireThunder:elements:conduct|thousandParts:masks:transform|songInHeart:heart:heart|runAndFight:ring:fight|danceLight:dancers:spin|dreamWorld:world:cast|notAsSeems:mirror:ponder|oneMoreStage:stage:present|oneMoreDance:dancers:dance|runningFree:roads:run|discoverMe:mirror:ponder|wonderfulWorld:world:open|marvelousDream:stars:reach|smallMagic:flower:touch|beautyInSong:ribbons:sing|manySkies:windows:walk|wishesPass:stars:reach|whereBelong:doors:search|findInSong:heart:heart|comeSoFar:clones:lookback|shiningStar:stars:reach|stageAgain:stage:open|chanceAgain:heart:offer|danceTogether:dancers:dance|musicSky:sky:raise|dreamsFly:stars:raise|iRun:road:run|weRun:clones:run|discoverUs:heart:bow
`,
 ending:`
onceUpon:spotlight:narrate|dreamingBoy:child:reach|thousandWorlds:doors:walk|thousandSongs:stage:sing|butOneThing:dark:still|neverFind:stars:reach|everyDoor:doors:walk|thousandShore:sea:walk|learnRun:roads:run|learnFly:wings:fly|everyDistantSky:sky:reach|oneMoreStage:stage:present|oneMoreChance:heart:offer|worldToDance:dancers:dance|runningAgain:roads:run|maybe:dark:still|discoverSelf:mirror:ponder|but:dark:still|whatDream:question:ponder|whatBecome:clones:search|firstTime:steps:still|stopRunning:roads:still|searchedWorld:doors:lookback|insideHeart:mirror:heart|justWanted:mirror:reach|wayHome:home:walk
`
};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
// Contact is defined on the SAME lyric entry as its animation and world FX.
 // The visual hitbox consumers never invent a second arbitrary time mapping.
 const contact9=Object.freeze({
  upsideWorld:['royal-sweep',2.8,.82,9],
  leftSwingRight:['right-swing',2.1,.80,10],
  oneRound:['round-bell',2.5,.82,8],
  turnWorldAgain:['inverse-pulse',3.2,1.05,13],
  chanceAndDance:['dance-kicks',2.4,.9,10],
  smileAndFly:['skyfall',2.6,1.12,11],
  roundEcho1:['echo-jab',2.3,.80,8],
  roundEcho2:['echo-kick-prepare',2.6,.85,0],
  roundEcho3:['echo-blade',3.2,.94,10],
  roundEcho4:['echo-slam',2.6,.85,12],
  roundEcho5:['echo-gather',2.6,.85,0],
  grandRound:['grand-ring',3.1,1.0,13],
  fallRise:['chorus-finale',3.3,1.42,17]
 });
 const contact6=Object.freeze({
  mountainLeap:['mountain','high'],repeatLeap:['mountain','high'],
  curtainDrops:['curtain','low']
 });
const segment=(key,rows)=>{
 const tokens=specs[key].replace(/\s/g,'').split('|').filter(Boolean);
 if(tokens.length!==rows.length)throw Error('Lyric action count mismatch for '+key+': '+tokens.length+' of '+rows.length);
 return Object.freeze(rows.map((caption,index)=>{
  const [verb,visual,gesture]=tokens[index].split(':');
  if(!verb||!visual||!gesture)throw Error('Incomplete authored cue '+key+':'+index);
  const strike=key==='9'?contact9[verb]:null,obstacle=key==='6'?contact6[verb]:null;
  const attackEvents=strike?[Object.freeze({type:'fighter-strike',at:caption.start,
    kind:strike[0],radius:strike[1],wind:strike[2],damage:strike[3]})]:
   obstacle?[Object.freeze({type:'runner-obstacle',at:caption.start,variant:obstacle[0],
     kind:obstacle[1],wind:1.2,damage:20})]:[];
  return Object.freeze({id:key+'-'+String(index+1).padStart(2,'0')+'-'+verb,
   year:key,index,start:caption.start,end:caption.end,en:caption.en,ko:caption.ko,
   actionId:verb,actors:Object.freeze(key==='8'?['gyuwon','dancers']:key==='6'?['gyuwon','knight']:key==='9'?['gyuwon','player']:['gyuwon']),
   visual,gesture,worldEvents:Object.freeze([visual]),attackEvents:Object.freeze(attackEvents)});
 }));
};
export const GYUWON_LYRIC_ACTION_YEARS=Object.freeze(['5','6','8','9','11','ending']);
export const GYUWON_LYRIC_ACTIONS=Object.freeze(Object.fromEntries(
 GYUWON_LYRIC_ACTION_YEARS.map(k=>[k,segment(k,GYUWON_ALIGNED_CAPTIONS[k])])));
export const GYUWON_LYRIC_ACTION_COUNT=Object.values(GYUWON_LYRIC_ACTIONS).reduce((n,arr)=>n+arr.length,0);
export function gyuwonLyricActionAt(year,time){
 const key=String(year),list=GYUWON_LYRIC_ACTIONS[key],t=Number(time);
 if(!list||!Number.isFinite(t))return null;
 const cue=list.find(row=>row.start<=t&&t<row.end);
 if(!cue)return null;const length=Math.max(.01,cue.end-cue.start);
 const phase=clamp((t-cue.start)/length),lead=clamp((phase)/.15),
  leave=clamp((1-phase)/.2),weight=Math.min(lead,leave);
 return {...cue,time:t,phase,weight,anticipation:clamp((t-cue.start+.45)/.45),remaining:cue.end-t};
}
// Audio seeks and late frames must not spawn a backlog of attacks.
export function gyuwonLyricActionsCrossed(year,previous,time,{limit=.35}={}){
 const key=String(year),rows=GYUWON_LYRIC_ACTIONS[key];
 if(!rows||!Number.isFinite(previous)||!Number.isFinite(time)||time<=previous||time-previous>limit)return [];
 return rows.filter(row=>row.start>previous&&row.start<=time);
}
export const gyuwonLyricActionScoreStats=()=>Object.fromEntries(
 Object.entries(GYUWON_LYRIC_ACTIONS).map(([k,v])=>[k,v.length]));
