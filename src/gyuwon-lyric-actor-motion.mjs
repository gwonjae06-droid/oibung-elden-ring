// 11su and ending skeletal performance: original audio time -> cinematic
// shot score -> real torso/neck/shoulders/elbows/knees. Read-only and seek-safe.
import {gyuwonCinematicMotionAt} from './gyuwon-cinematic-motion-score.mjs';
export function gyuwonLyricActorMotion(lyric,time=0){
 if(!lyric)return null;
 const moment=gyuwonCinematicMotionAt(lyric.year,time);
 if(!moment)return null;
 const pose=moment.pose;
 const step=Math.max(Math.abs(pose.leftStep),Math.abs(pose.rightStep));
 return {
  torsoX:pose.chest*.74,torsoY:pose.turn*.66,torsoZ:pose.bank*.7,
  headX:pose.headPitch,headY:pose.headYaw,
  leftArm:pose.leftArm,rightArm:pose.rightArm,
  leftElbow:pose.leftElbow,rightElbow:pose.rightElbow,
  step:lyric.gesture==='still'||lyric.actionId==='stopRunning'?0:Math.min(1,step),
  lift:pose.height,
  twist:pose.turn*.23,
  handOpen:pose.handOpen,
  focus:moment.focus,cinematicCueId:lyric.id
 };
}
