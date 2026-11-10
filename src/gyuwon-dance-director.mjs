import {drawGyuwonPerformer} from './gyuwon-performance-art.mjs';
import {gyuwonDancePoseAt} from './gyuwon-performance-poses.mjs';
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {gyuwonDanceLyricMoment} from './gyuwon-dance-spectacle.mjs';
// Act VIII: two-action theatrical choreography, staged on the ORIGINAL media clock.
// Time anchors are production cues; the full master lyric/beat transcription needs listening QA.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const TAU=Math.PI*2;
export const GYUWON_DANCE_STAGES=Object.freeze([
 {at:0,key:'handoff',sky:'#8f79b3',horizon:'#d8afd0',floor:'#7a5e85',light:'#e6c0db'},
 {at:10,key:'invitation',sky:'#292449',horizon:'#7e5b9a',floor:'#74516f',light:'#d6b9f1'},
 {at:28.5,key:'footsteps',sky:'#39244f',horizon:'#aa748d',floor:'#a37e9a',light:'#ffe5bb'},
 {at:39.5,key:'stars',sky:'#0c1b42',horizon:'#4266aa',floor:'#497a9c',light:'#b7e5ff'},
 {at:47.6,key:'ensemble',sky:'#42255e',horizon:'#d68f99',floor:'#ac7d9b',light:'#ffdec2'},
 {at:73,key:'grand',sky:'#261a49',horizon:'#9e6cad',floor:'#875f96',light:'#ffe2b2'},
 {at:94,key:'silence',sky:'#090f24',horizon:'#283453',floor:'#303856',light:'#a2a7d6'},
 {at:112,key:'encore',sky:'#122951',horizon:'#6f7fc4',floor:'#6586b9',light:'#f1eaff'},
 {at:120,key:'rain',sky:'#1b385b',horizon:'#638bab',floor:'#547b9b',light:'#c4eaff'},
 {at:130,key:'reunion',sky:'#423e70',horizon:'#bf91ab',floor:'#987e9c',light:'#fff1c7'},
 {at:158,key:'sunrise',sky:'#b66f92',horizon:'#ffcd9e',floor:'#d4a47e',light:'#fff2b2'},
 {at:174.5,key:'bow',sky:'#b36a78',horizon:'#ffdfb0',floor:'#a07975',light:'#fff0c4'}
].map(Object.freeze));
function mix(a,b,t){
 t=clamp(t);const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16);
 const ch=(shift)=>Math.round(((aa>>shift)&255)*(1-t)+((bb>>shift)&255)*t);
 return 'rgb('+ch(16)+','+ch(8)+','+ch(0)+')';
}
export function gyuwonDanceScene(time=0){
 const t=clamp(time,0,180);let idx=0;
 for(let i=1;i<GYUWON_DANCE_STAGES.length;i++)if(t>=GYUWON_DANCE_STAGES[i].at)idx=i;
 const now=GYUWON_DANCE_STAGES[idx],old=GYUWON_DANCE_STAGES[Math.max(0,idx-1)];
 const fade=idx===0?1:clamp((t-now.at)/3.2);
 return {key:now.key,time:t,fade,sky:mix(old.sky,now.sky,fade),
  horizon:mix(old.horizon,now.horizon,fade),floor:mix(old.floor,now.floor,fade),
  light:mix(old.light,now.light,fade),quiet:t>=94&&t<112,
  rain:t>=120&&t<130,stars:(t>=39.5&&t<94)||(t>=112&&t<120),
  crowd:clamp((t-47.6)/42),dawn:clamp((t-150)/24),
  handoff:1-clamp(t/9),ring:clamp((t-174.5)/5.5)};
}
export const gyuwonDanceAction=kind=>kind==='turn'?'skill':'light';
export const GYUWON_DANCE_WINDOWS=Object.freeze({perfect:.075,good:.22,expired:.24});
// One ordered source of truth for the visible cue and the J/L contact test.
// A note that never had a visible preparation cannot inflict damage.
export function gyuwonDanceNextCue(patterns,time,period=.5){
 let best=null;
 for(const p of patterns||[]){
  const cue=gyuwonDanceTelegraph(p,time,period);
  if(!cue?.active)continue;
  if(!best||cue.at<best.at)best={...cue,pattern:p};
 }
 return best;
}
export function gyuwonDanceJudge(patterns,time,action,period=.5){
 const cue=gyuwonDanceNextCue(patterns,time,period);
 if(!cue)return null;
 const error=Math.abs(time-cue.at),grade=error<=GYUWON_DANCE_WINDOWS.perfect?'PERFECT':'GOOD';
 return {...cue,error,grade,accepted:error<=GYUWON_DANCE_WINDOWS.good&&cue.action===action};
}
export function gyuwonDanceTelegraph(pattern,time,period=.5){
 if(!pattern)return null;
 let index=-1;
 for(let i=0;i<pattern.count;i++)if(!pattern.done[i]&&!pattern.misses[i]){index=i;break;}
 if(index<0)return null;
 const at=pattern.first+index*pattern.spacing*period;
 const start=index===0?pattern.cue:at-Math.max(1.1,period*2.4);
 return {kind:pattern.kind,action:gyuwonDanceAction(pattern.kind),
  at,lead:clamp((time-start)/Math.max(.01,at-start)),remaining:at-time,
  active:time>=start&&time<=at+GYUWON_DANCE_WINDOWS.expired,index,count:pattern.count};
}
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function beam(c,x,target,color,alpha){
 c.save();c.globalAlpha=clamp(alpha);c.fillStyle=color;c.beginPath();
 c.moveTo(x,15);c.lineTo(target-90,545);c.lineTo(target+90,545);c.closePath();c.fill();c.restore();
}
export function drawGyuwonDanceWorld(c,m,{portrait}={}){
 const s=gyuwonDanceScene(m.time),t=m.time,period=m.dancePeriod||60/GYUWON_BEATS[8].bpm;
 const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#151b2b');sky.addColorStop(1,s.floor);
 c.fillStyle=sky;c.fillRect(0,0,1280,720);
 // A restrained real venue leaves hands, feet and weight changes legible.
 for(const side of [-1,1])for(let i=0;i<7;i++){
  c.fillStyle=i%2?'#4c283e':'#352237';c.fillRect(side<0?i*12:1280-(i+1)*12,0,13,570);
 }
 c.fillStyle='#8d7461';c.fillRect(0,553,1280,167);
 c.strokeStyle='#534435';c.lineWidth=2;
 for(let i=0;i<22;i++){c.beginPath();c.moveTo(i*66,553);c.lineTo(i*86-190,720);c.stroke();}
 for(const x of [220,640,1060]){c.fillStyle='#d2baa0';c.fillRect(x-13,51,26,15);beam(c,x,x,'#ffe4c4',.07);}
 const tele=gyuwonDanceNextCue(m.dancePatterns,t,period);
 // The leader demonstrates one beat before the player's scheduled contact.
 // Subsequent repetitions keep showing the same preparation on each beat.
 const at=tele?.at??(Math.floor((t-GYUWON_BEATS[8].offset)/period)+1)*period+GYUWON_BEATS[8].offset;
 const kind=tele?.kind||'pose';
 const leader=gyuwonDancePoseAt(t,at-period,kind,period);
 const hit=m.danceHit,responding=hit&&t-hit.at<period*1.15&&t>=hit.at;
 const player=responding?gyuwonDancePoseAt(t,hit.at,hit.kind,period):gyuwonDancePoseAt(t,t+period,'pose',period);
 if(!responding){player.leftArm*=.2;player.rightArm*=.2;player.leftStep*=.15;player.rightStep*=.15;player.shift*=.25;}
 if(m.danceError>0&&!responding){player.bank=-.1*m.danceError;player.headPitch=.2;}
 const fade=clamp((t-.5)/2.2);c.save();c.globalAlpha=fade;
 drawGyuwonPerformer(c,330,553,{scale:1.75,pose:leader,gyuwon:true,portrait,color:'#8a678e'});
 drawGyuwonPerformer(c,775,553,{scale:1.75,pose:player});
 // A smaller backing dancer follows the leader; no synthetic timing graphics.
 drawGyuwonPerformer(c,1090,535,{scale:1.12,pose:leader,color:'#5e6f85',gyuwon:true,portrait});
 c.restore();
 return {scene:s,telegraph:tele,lyric:gyuwonDanceLyricMoment(t)};
}
