// Every authored 5수 lyric phrase has an expressive blocking pose. The source
// clock is audio.currentTime via actFivePerformanceAt, never a second animation
// timer. All hand targets are given to the existing collision simulation first;
// the 3D actor must FOLLOW those positions, not draw a fake independent hand.

const PI=Math.PI;
const ZERO=[0,0,0];
const shape=(torso=ZERO,head=ZERO,left=ZERO,right=ZERO,fingers='open',style='breathe')=>Object.freeze({torso,head,hands:[left,right],fingers,style});
// Wrists are authored around the CHEST, in giant-scale metres. In particular,
// an embrace crosses the chest and an offered hand reaches toward the audience;
// neither is a small offset from a palm parked on the floor.
export const GYUWON_LYRIC_BLOCKING=Object.freeze({
 idle:shape(ZERO,ZERO,[-11,-2,10],[11,-2,10]),
 greet:shape([.09,0,-.025],[-.09,0,.035],[-17,5,7],[17,5,7],'open','bow'),
 welcome:shape([-.045,0,.018],[-.09,0,0],[-21,6,4],[21,6,4],'open','fan'),
 choose:shape([0,-.10,.025],[0,-.16,0],[-10,0,10],[6,10,4],'point','search'),
 doors:shape([-.045,0,0],[-.06,0,0],[-18,5,9],[18,5,9],'open','unfold'),
 roads:shape([.015,.10,-.025],[-.04,.2,.01],[-19,-1,8],[14,4,11],'point','sweep'),
 sea:shape([.04,-.04,.025],[.035,-.08,0],[-17,1,9],[17,3,9],'open','wave'),
 dream:shape([-.025,0,0],[-.12,.07,0],[-6,10,4],[6,10,4],'open','breathe'),
 king:shape([-.04,0,0],[-.09,0,0],[-6,16,1],[6,16,1],'open','crown'),
 knight:shape([.07,.08,-.03],[.04,.08,0],[-10,0,9],[12,7,7],'fist','lunge'),
 heart:shape([.07,0,0],[.10,0,0],[5,5,8],[-5,3,11],'offering','embrace'),
 wipe:shape([.045,0,0],[.04,.08,0],[-10,-1,10],[6,10,6],'open','wipe'),
 adventure:shape([-.03,-.08,0],[.02,-.1,0],[-10,1,10],[11,6,13],'beckon','forward'),
 curtain:shape([-.025,0,0],[-.03,0,0],[-13,16,7],[13,16,7],'grip','pull'),
 brass:shape([-.025,.04,.02],[-.01,.06,0],[-3,9,8],[5,9,10],'grip','fanfare'),
 costume:shape([.05,0,0],[.09,0,-.02],[-5,3,6],[5,3,6],'grip','costume'),
 stage:shape([-.035,0,0],[-.04,0,0],[-19,-1,9],[13,5,10],'point','present'),
 dance:shape([-.025,0,.045],[0,.06,-.025],[-16,3,10],[16,3,10],'open','waltz'),
 run:shape([.09,0,.02],[.06,0,0],[-9,1,7],[9,5,12],'loose','march'),
 self:shape([.07,0,0],[.12,0,0],[-4,4,7],[4,4,10],'offering','heart'),
 sky:shape([-.045,0,0],[-.14,0,0],[-22,8,3],[22,8,3],'open','rising'),
 flight:shape([-.055,0,.025],[-.09,0,0],[-25,7,0],[25,7,0],'open','fly'),
 hand:shape([.035,0,0],[-.025,.06,0],[-6,1,8],[10,7,27],'offering','offer'),
 together:shape([.065,0,0],[.06,0,0],[6,5,7.5],[-6,3,10.5],'offering','embrace'),
 roles:shape([.05,-.05,.025],[.05,-.06,0],[-15,4,7],[15,7,7],'open','bow'),
 crowns:shape([-.045,0,0],[-.09,0,0],[-7,16,1],[7,16,1],'open','crown'),
 laugh:shape([.11,0,.04],[.06,0,.06],[-6,-1,9],[6,-1,9],'loose','laugh'),
 friends:shape([-.025,.04,-.01],[.01,-.07,0],[-18,5,9],[18,5,9],'open','wave'),
 beginning:shape([-.04,0,0],[-.04,0,0],[-20,6,7],[20,6,7],'open','unfold'),
 conduct:shape([-.02,0,.02],[-.03,.04,0],[-13,4,9],[13,6,9],'point','conduct')
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
  case 'fly':{const flap=sin(beat*.5);return {hand:[side*second*1.2,flap*4.2,-Math.abs(flap)*1.2],tilt:second*.02,bounce:.08};}
  case 'embrace':return {hand:[0,.12*second,0],tilt:0,bounce:.035};
  case 'wipe':return {hand:side>0?[sin(progress*PI)*3,.15*second,.3*second]:ZERO,tilt:0,bounce:0};
  case 'gather':return {hand:[-side*ramp*.8,ramp*.45,-ramp],tilt:0,bounce:.08};
  case 'bow':return {hand:[0,-ramp*.35,0],tilt:0,bounce:0};
  case 'offer':return {hand:[0,.12*second,side>0?ramp*1.0:0],tilt:0,bounce:0};
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
 const weight=clamp(p.weight),progress=clamp(p.progress);
 const action=gesture==='roles'?(progress<.3?'knight':progress<.62?'dance':'sky'):gesture;
 const shape=GYUWON_LYRIC_BLOCKING[action],
  beat=Math.max(0,time)*Math.PI*2*bpm/60,scaleTime=clamp(time/180);
 const hit=clamp((hitUntil-time)/.35),wind=raidAttack?.wind||1;
 const anticipation=raidAttack?clamp(raidAttack.age/wind)*(1-clamp((raidAttack.age-wind)/.45)):0;
 const torso=scale(shape.torso,weight),head=scale(shape.head,weight),wrists=[];
 const response=[];
 for(let index=0;index<2;index++){
  const side=index===0?-1:1,detail=mood(shape.style,beat,progress,side);
  const rest=GYUWON_LYRIC_BLOCKING.idle.hands[index];
  wrists.push(combine(rest.map((v,i)=>v+(shape.hands[index][i]-v)*weight),scale(detail.hand,weight)));
  response.push({roll:side*(shape.style==='conduct'?.16:shape.style==='waltz'?.11:.06)*weight+detail.tilt*weight,
   pitch:shape.style==='embrace'?-PI/2:shape.style==='lunge'?-.9:shape.style==='offer'?-.08:shape.style==='fanfare'?.24:0,
   yaw:shape.style==='embrace'?-side*PI/2:0,
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
 if(gesture==='wipe')head[1]+=sin(progress*PI*4)*.16*weight;
 head[2]+=sin(beat*.42)*.015+hit*.065;
 // Exaggerated stage-scale waist and ribcage articulation, still inside
 // controllable angular bounds. Independent shoulder joints follow the waist.
 const phraseLift=weight*(.5+.5*sin(progress*PI)),drive=sin(beat*.25),side=sin(beat*.16);
 torso[0]=clamp(torso[0]*2.15+sin(beat*.15)*.046*weight+anticipation*.07,-.47,.47);
 torso[1]=clamp(torso[1]*2.0+side*.065*weight,-.45,.45);
 torso[2]=clamp(torso[2]*2.1+drive*.075*weight,-.45,.45);
 const waist=[clamp(torso[0]*.54+sin(beat*.20)*.028,-.33,.33),
  clamp(torso[1]*.68,-.31,.31),clamp(torso[2]*.64,-.33,.33)];
 const chest=[clamp(torso[0]*.78,-.34,.34),clamp(torso[1]*.65,-.34,.34),clamp(torso[2]*.76,-.34,.34)];
 const lean={x:clamp(sin(beat*.20)*.55*weight+torso[2]*2.1,-1.3,1.3),
  z:clamp(-torso[0]*2.8+.35*sin(beat*.13)*weight,-1.9,1.9)};
 const shoulders=[-1,1].map(side=>({pitch:clamp(-torso[0]*.28+side*.055*drive,-.35,.35),
  roll:clamp(side*phraseLift*.16+torso[2]*.34,-.28,.28),
  twist:clamp(torso[1]*.36+side*.07*side,-.28,.28)}));
 head[0]=clamp(head[0]*1.3,-.5,.5);
 head[1]=clamp(head[1]*1.2,-.5,.5);
 const bounce=sin(beat*.46)*.08+(response[0].bounce+response[1].bounce)*.45*weight+phraseLift*.12;
 const handTargets=wrists.map(p=>{
  const c=rotateXYZ(p,chest);c[0]+=lean.x*.45;c[1]+=7.5+bounce*1.5;c[2]+=lean.z*.55;
  const w=rotateXYZ(c,waist);return [w[0]+lean.x*.68,w[1]+8,w[2]-25+lean.z*.52];
 });
 const hands=handTargets.map((p,i)=>[p[0]-(i?13:-13),p[1]-2.7,p[2]+3]);
 return {gesture,action,style:shape.style,weight,progress,torso,head,waist,chest,lean,shoulders,hands,handTargets,palms:response,
  bounce,flinch:hit,anticipation,spotlight:raidAttack?.blocked===true,normalizedTime:scaleTime};
}
function rotateXYZ([x,y,z],[rx,ry,rz]){
 const a=x*Math.cos(rz)-y*Math.sin(rz),b=x*Math.sin(rz)+y*Math.cos(rz);
 const c=a*Math.cos(ry)+z*Math.sin(ry),d=-a*Math.sin(ry)+z*Math.cos(ry);
 return [c,b*Math.cos(rx)-d*Math.sin(rx),b*Math.sin(rx)+d*Math.cos(rx)];
}
