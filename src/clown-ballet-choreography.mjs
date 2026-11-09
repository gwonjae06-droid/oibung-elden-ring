// Choreography values are independent of Three.js. The duet shares a musical
// phrase, but the lead carries the weight and the ballerina answers on the
// opposite beat. Blending is based on elapsed seconds, not the frame rate.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:a));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const finite=x=>Number.isFinite(x)?x:0;

export function balletSculptPose({time=0,beat=0,active=false,pulse=0,lead=false,pattern='',reduced=false,showcase=0}={}){
 const t=Math.max(0,finite(time)),b=Math.max(0,finite(beat));
 const activity=active?clamp(pulse,0,1):0;
 const direction=lead?1:-1;
 const breath=Math.sin(t*1.17+(lead?0:.45));
 const phrase=Math.sin(t*1.92+(lead?0:Math.PI));
 const bow=pattern==='balletFinalBow'?1:0;
 const mirror=pattern==='balletMirrorVeils'?1:0;
 const pas=pattern==='balletPasDeDeux'?1:0;
 const fouette=pattern==='balletFouette'?1:0;
 const stage=activity*smooth((b-.18)/.55);
 const reference=smooth((clamp(showcase,0,1)-.18)/.72);
 // The photo-silhouette only peaks in the non-damaging opening dance. During
 // combat, smaller motifs avoid decoupling the animated limbs from hurtboxes.
 const echo=stage*(fouette?.16:pas?.12:.04);
 const motif=Math.max(reference,echo);
 const turn=stage*fouette;
 const float=reduced?.5:1;
 // The mirrored arms never become independent looping windmills. One leads,
 // the other accepts the gesture, and the wrists lag the shoulders.
 const armWave=stage*(.15*Math.sin(t*2.55+(lead?0:Math.PI)));
 const reach=stage*(.16+.26*mirror+.12*pas);
 const lift=stage*(.25+.24*pas+.22*fouette);
 const legPhrase=Math.sin(t*(fouette?3.15:1.92)+(lead?0:Math.PI));
 const legL=stage*Math.max(0,legPhrase)*(.20+.28*fouette);
 const legR=stage*Math.max(0,-legPhrase)*(.20+.28*fouette);
 return {
  bodyLift:float*(.017*breath+stage*.055*(.5+.5*Math.cos(t*2.2)))+
   (lead?.43:.06)*reference,
  chestPitch:-.025-stage*(.065+.15*bow)*(.5+.5*Math.sin(t*1.6))+
   (lead?-.28:-.18)*reference,
  chestRoll:stage*(direction*.065+.09*phrase)+.012*breath+
   (lead?.48:-.28)*reference,
  chestYaw:stage*(direction*.11+.08*Math.sin(t*1.6))+(lead?-.13:.09)*reference,
  pelvisYaw:stage*(-direction*.075+.035*phrase)+(lead?.18:-.15)*reference,
  headYaw:stage*(-direction*.16+.05*Math.sin(t*1.45))-.026*breath+
   (lead?-.23:.11)*reference,
  headRoll:-stage*.075*direction-.012*breath+(lead?.20:-.15)*reference,
  headPitch:stage*(.045+bow*.09)-.015*breath+reference*(lead?.16:.21),
  leftReach:1.35+reach+armWave+reference*(lead?-.77:-.55),
  rightReach:1.35+reach-armWave+reference*(lead?.59:-.48),
  leftArmY:2.96+lift+.20*phrase+reference*(lead?1.92:2.02),
  rightArmY:2.96+lift-.20*phrase+reference*(lead?-.27:2.07),
  leftArmZ:.25+stage*.20+reference*(lead?-.20:.07),
  rightArmZ:.25+stage*.20+reference*(lead?.26:-.11),
  leftWrist:-.15+stage*(.22+.12*phrase)-reference*.26,
  rightWrist:.15-stage*(.22-.12*phrase)+reference*.38,
  leftLegLift:legL+motif*(lead?.76:0),
  rightLegLift:legR+motif*(lead?.20:1.14),
  leftLegTrail:stage*(.15*legPhrase+.20*turn)+reference*(lead?-.35:0),
  rightLegTrail:stage*(-.15*legPhrase-.20*turn)+reference*(lead?.35:.20),
  leftPointe:.26+stage*(.15+.18*Math.max(0,legPhrase))+
   motif*(lead?.27:.80),
  rightPointe:.26+stage*(.15+.18*Math.max(0,-legPhrase))+
   motif*(lead?.55:.36),
  // The outside knee of a high passe rotates out and up, without shortening
  // femur/shin. The rear foot returns close to the supporting knee.
  leftAnkleX:reference*(lead?.25:0),
  rightAnkleX:reference*(lead?-.20:-.30),
  leftKneeOut:motif*(lead?.43:0),
  rightKneeOut:motif*(lead?.10:.90),
  leftKneeUp:motif*(lead?.65:0),
  rightKneeUp:motif*(lead?.1:.88),
  silkFloat:float*stage*(.10+.09*Math.sin(t*2.3)),
 };
}

// Large frame gaps are clamped so returning from a hidden tab cannot make a
// pose teleport or a fixed-limb knee reverse in one frame.
export function blendBalletPose(previous,target,dt,frequency=9){
 const seconds=clamp(dt,0,.05);
 const mix=1-Math.exp(-seconds*clamp(frequency,.1,30));
 const result={};
 for(const [key,desired] of Object.entries(target)){
  const from=previous&&Number.isFinite(previous[key])?previous[key]:(
   key==='leftReach'||key==='rightReach'?1.35:
   key==='leftArmY'||key==='rightArmY'?2.96:
   key==='leftArmZ'||key==='rightArmZ'?.25:
   key==='leftPointe'||key==='rightPointe'?.26:0);
  result[key]=from+(finite(desired)-from)*mix;
 }
 return result;
}
