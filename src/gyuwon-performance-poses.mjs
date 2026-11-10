// All accents use the recording clock. One sample drives the leader and response.
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function gyuwonDancePoseAt(time,at,kind='pose',period=60/GYUWON_BEATS[8].bpm){
 const beat=(time-GYUWON_BEATS[8].offset)/period;
 const age=(time-at)/period,prepare=smooth((age+1)/.8),release=1-smooth(age/.9);
 const accent=prepare*release,side=Math.floor(beat/2)%2?-1:1;
 const contact=Math.sin(Math.PI*clamp(age+1));
 return {shift:Math.sin(beat*Math.PI)*3+side*accent*10,
  height:Math.abs(Math.sin(beat*Math.PI))*.035+contact*.09,
  bank:side*accent*.12,turn:kind==='turn'?smooth((age+.8)/1.6)*Math.PI*2:Math.sin(beat*Math.PI)*.06,
  leftStep:side*accent*.65,rightStep:-side*accent*.65,
  kneeLift:kind==='quick'?accent*.4:accent*.15,
  leftArm:kind==='turn'?-accent*1.05:-accent*.34,
  rightArm:kind==='turn'?-accent*.82:-accent*.92,
  leftElbow:-.3-accent*.32,rightElbow:-.25-accent*.4,
  headPitch:-accent*.04,headYaw:side*.08,handOpen:1};
}
export function gyuwonFightPoseAt(f,time,lyric){
 const beat=(time-GYUWON_BEATS[9].offset)*GYUWON_BEATS[9].bpm/60;
 const bounce=Math.sin(beat*Math.PI)*.035;
 const pose={shift:0,height:Math.abs(bounce),bank:0,turn:0,leftStep:0,rightStep:0,kneeLift:0,
  leftArm:-.48,rightArm:-.65,leftElbow:-.8,rightElbow:-.75,headPitch:0,headYaw:0,handOpen:.2};
 const a=f.action;
 if(a){
  const prep=smooth(a.t/a.wind),strike=smooth((a.t-a.wind)/Math.max(.04,a.live*.45)),back=smooth((a.t-a.wind-a.live)/a.recovery);
  const extension=strike*(1-back),pull=prep*(1-strike);
  pose.bank=-.12*pull+.19*extension;pose.turn=-.18*pull+.30*extension;
  pose.strike=extension;pose.wind=pull;pose.attackKind=a.kind;pose.range=a.range;
  pose.leftArm=-.55;pose.rightArm=-.5-.75*extension;pose.rightElbow=-.9*(1-extension);
  pose.shift=-6*pull+8*extension;pose.rightStep=.34*extension;
  if(a.kind==='kick'){pose.kick=extension;pose.kneeLift=.85*prep*(1-back);pose.bank=-.18*extension;}
  if(a.kind==='super'){pose.leftArm=-.5-extension;pose.leftElbow=-.6*(1-extension);pose.bank=.25*extension;}
 }else if(!f.guard&&f.stun<=0&&lyric){
  const w=Math.sin(Math.PI*clamp(lyric.phase||0)),g=lyric.gesture;
  if(['jump','fly','raise','rise'].includes(g)){pose.leftArm-=w*.7;pose.rightArm-=w*.7;pose.headPitch=-w*.14;}
  if(['transform','flip','clone'].includes(g)){pose.turn=Math.sin(w*Math.PI)*.5;pose.leftArm-=w*.3;pose.bank=Math.sin(beat*Math.PI)*.1;}
  if(['fight','stepstrike','jab','blade','kick','slam'].includes(g)){pose.turn=Math.sin(beat*Math.PI)*.13;pose.leftStep=Math.sin(beat*Math.PI)*.12;pose.rightStep=-pose.leftStep;}
  if(['ponder','search','bow','reach'].includes(g)){pose.headPitch=w*.2;pose.rightElbow=-.8-w*.35;pose.rightArm=-.6-w*.2;}
 }
 if(f.guard){pose.leftArm=-.8;pose.rightArm=-.9;pose.leftElbow=-1.15;pose.rightElbow=-1.2;pose.bank=-.08;}
 if(f.stun>0){pose.bank=-.2;pose.headPitch=-.12;}
 return pose;
}
