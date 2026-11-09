// Every authored 5수 lyric phrase has an expressive blocking pose. The source
// clock is audio.currentTime via actFivePerformanceAt, never a second animation
// timer. All hand targets are given to the existing collision simulation first;
// the 3D actor must FOLLOW those positions, not draw a fake independent hand.

const PI=Math.PI;
const ZERO=[0,0,0];
const shape=(torso=ZERO,head=ZERO,left=ZERO,right=ZERO,fingers='open',style='breathe')=>Object.freeze({torso,head,hands:[left,right],fingers,style});
// Axes of hands: world x/y/z offsets from the original collision targets.
// Torso/head units are radians, hand units are game-world meters. The restrained
// ranges avoid losing the silhouette or dragging a resting hand through the cast.
export const GYUWON_LYRIC_BLOCKING=Object.freeze({
 idle:shape(),greet:shape([.09,0,-.025],[-.09,0,.035],[-2,8,1],[2,8,1],'open','bow'),
 welcome:shape([-.045,0,.018],[-.09,0,0],[-5,8,2],[5,8,2],'open','fan'),
 choose:shape([0,-.10,.025],[0,-.16,0],[0,3,0],[1,7,2],'point','search'),
 doors:shape([-.045,0,0],[-.06,0,0],[-6,9,-2],[6,9,-2],'open','unfold'),
 roads:shape([.015,.15,-.035],[-.04,.2,.01],[-6,3,2],[5,6,-2],'point','sweep'),
 sea:shape([.06,-.08,.05],[.035,-.08,0],[-4,6,-2],[4,9,-1],'open','wave'),
 dream:shape([-.035,0,0],[-.19,.07,0],[-2,9,-3],[2,10,-4],'open','breathe'),
 king:shape([-.075,0,0],[-.18,0,0],[-1,8,-5],[1,8,-5],'open','crown'),
 knight:shape([.10,.13,-.04],[.07,.12,0],[-4,4,3],[3,3,-4],'fist','lunge'),
 heart:shape([.11,0,0],[.15,0,0],[8,10,-9],[-8,10,-9],'offering','heartbeat'),
 adventure:shape([-.03,-.14,0],[.02,-.15,0],[-3,6,1],[3,8,4],'beckon','forward'),
 curtain:shape([.02,0,0],[-.03,0,0],[-5,10,-2],[6,10,-2],'grip','pull'),
 brass:shape([-.05,.09,.02],[-.01,.14,0],[8,9,-9],[-8,9,-9],'grip','fanfare'),
 costume:shape([.07,0,0],[.09,0,-.02],[6,8,-7],[-6,8,-7],'grip','costume'),
 stage:shape([-.04,0,0],[-.04,0,0],[-7,5,2],[7,5,2],'open','present'),
 dance:shape([-.03,0,.08],[0,.10,-.045],[-5,9,1],[5,10,-2],'open','waltz'),
 run:shape([.15,0,.025],[.09,0,0],[4,3,3],[-4,9,-4],'loose','march'),
 self:shape([.10,0,0],[.18,0,0],[8,9,-8],[-8,6,-9],'offering','heart'),
 sky:shape([-.08,0,0],[-.24,0,0],[-4,12,-3],[4,12,-3],'point','rising'),
 flight:shape([-.11,0,.05],[-.16,0,0],[-7,13,-4],[7,13,-4],'open','fly'),
 hand:shape([-.03,.04,0],[-.03,.12,0],[3,4,4],[2,8,7],'offering','offer'),
 together:shape([.09,0,0],[.06,0,0],[7,6,-5],[-7,6,-5],'open','gather'),
 roles:shape([.075,-.09,.04],[.08,-.1,0],[-4,7,-2],[4,7,-2],'open','bow'),
 crowns:shape([-.09,0,0],[-.16,0,0],[-3,13,-4],[3,13,-4],'open','crown'),
 laugh:shape([-.06,0,.07],[-.16,0,.1],[-4,7,-3],[4,7,-3],'loose','laugh'),
 friends:shape([-.035,.08,-.01],[.01,-.12,0],[-3,9,4],[5,9,4],'open','wave'),
 beginning:shape([-.07,0,0],[-.06,0,0],[-8,8,3],[8,8,3],'open','unfold'),
 conduct:shape([-.025,0,.02],[-.04,.08,0],[-5,8,1],[5,9,1],'point','conduct')
});
export const GYUWON_ACTING_STYLES=Object.freeze(Object.keys(GYUWON_LYRIC_BLOCKING));

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const sin=Math.sin;
const scale=(xyz,k)=>xyz.map(v=>v*k);
const combine=(a,b)=>a.map((v,i)=>v+b[i]);
const mood=(style,beat,progress,side)=>{
 const wave=sin(beat),second=sin(beat*.52+side*.7),ramp=sin(progress*PI);
 switch(style){
  case 'waltz':return {hand:[side*second*1.1,wave*1.2,-.8*second],tilt:second*.045,bounce:Math.abs(wave)*.32};
  case 'march':return {hand:[side*wave*1.6,-side*wave*1.8,side*second],tilt:wave*.045,bounce:Math.abs(wave)*.42};
  case 'wave':return {hand:[side*wave*.9,wave*1.6,second*.6],tilt:second*.025,bounce:.12};
  case 'fan':return {hand:[side*second*1.2,Math.abs(second)*1.8,0],tilt:second*.023,bounce:.15};
  case 'heartbeat':return {hand:[side*wave*.18,Math.abs(wave)*.65,0],tilt:0,bounce:.08*Math.abs(wave)};
  case 'fanfare':return {hand:[0,.25*second,0],tilt:.025*second,bounce:.18*Math.max(0,wave)};
  case 'laugh':return {hand:[side*wave*.85,wave*.7,0],tilt:wave*.035,bounce:Math.abs(second)*.22};
  case 'conduct':return {hand:[side*second*.8,wave*1.9,Math.cos(beat)*.6],tilt:second*.035,bounce:.16};
  case 'fly':return {hand:[side*second*2,Math.abs(wave)*1.8,0],tilt:second*.04,bounce:.12};
  case 'gather':return {hand:[-side*ramp*.8,ramp*.45,-ramp],tilt:0,bounce:.08};
  case 'bow':return {hand:[0,-ramp*.35,0],tilt:0,bounce:0};
  case 'offer':return {hand:[0,.3*second,ramp*.7],tilt:0,bounce:0};
  case 'lunge':return {hand:[side*wave*.4,.4*ramp,.3*ramp],tilt:second*.03,bounce:.12};
  case 'sweep':return {hand:[side*second*.9,.3*wave,0],tilt:second*.04,bounce:0};
  case 'rising':return {hand:[0,Math.abs(wave)*.85,0],tilt:.015*second,bounce:.12};
  default:return {hand:[0,.13*second,0],tilt:second*.012,bounce:.04};
 }
};
/**
 * One choreography sample shared by the simulation and the visual rig.
 * Returned targets are declarative (no Three.js, no world mutation).
 */
export function actFiveChoreographyAt(time,performance,{hitUntil=0,raidAttack=null,bpm=136}={}){
 const p=performance||{gesture:'idle',weight:0,progress:0},gesture=GYUWON_LYRIC_BLOCKING[p.gesture]?p.gesture:'idle';
 const shape=GYUWON_LYRIC_BLOCKING[gesture],weight=clamp(p.weight),progress=clamp(p.progress),
  beat=Math.max(0,time)*Math.PI*2*bpm/60,scaleTime=clamp(time/180);
 const hit=clamp((hitUntil-time)/.35),wind=raidAttack?.wind||1;
 const anticipation=raidAttack?clamp(raidAttack.age/wind)*(1-clamp((raidAttack.age-wind)/.45)):0;
 const torso=scale(shape.torso,weight),head=scale(shape.head,weight),hands=[];
 const response=[];
 for(let index=0;index<2;index++){
  const side=index===0?-1:1,detail=mood(shape.style,beat,progress,side);
  hands.push(combine(scale(shape.hands[index],weight),scale(detail.hand,weight)));
  response.push({roll:side*(shape.style==='conduct'?.16:shape.style==='waltz'?.11:.06)*weight+detail.tilt*weight,
   pitch:shape.style==='offer'?-.18*weight:shape.style==='fanfare'?.24*weight:0,
   curl:shape.fingers==='fist'?.80:shape.fingers==='grip'?.63:
    shape.fingers==='point'?.28:shape.fingers==='offering'?.22:
    shape.fingers==='beckon'?.42:shape.fingers==='loose'?.38:.06,
   point:shape.fingers==='point',bounce:detail.bounce*weight});
 }
 torso[0]+=sin(beat*.52)*.012+hit*.13+anticipation*.055;
 torso[1]+=sin(beat*.25)*.013;
 torso[2]+=sin(beat*.37)*.018+(response[0].roll+response[1].roll)*.2;
 head[0]+=sin(beat*.31)*.025+hit*-.13-anticipation*.06;
 head[1]+=sin(beat*.19)*.026;
 head[2]+=sin(beat*.42)*.015+hit*.065;
 const bounce=sin(beat*.46)*.12+(response[0].bounce+response[1].bounce)*.5*weight;
 return {gesture,style:shape.style,weight,progress,torso,head,hands,palms:response,
  bounce,flinch:hit,anticipation,spotlight:raidAttack?.blocked===true,normalizedTime:scaleTime};
}
