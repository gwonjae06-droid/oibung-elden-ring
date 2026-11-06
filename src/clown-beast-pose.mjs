// Pure boss silhouette data used by both real hitboxes and the four-paw rig.
export const BEAST_PATTERNS=Object.freeze(['feralSkitter','reverseCrawl','facePeelHunt','ceilingPounce','unhingedClap']);
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export function clownBeastPose(g){
 const b=g?.boss||{},c=g?.clown||{},active=b.phase===2&&b.state!=='transition';
 const third=(c.horrorStage||1)>=3,t=Number.isFinite(c.time)?c.time:0;
 return {active,third,pitch:third?1.20:1.15,bodyHeight:third?.30:.35,
  bodyRoll:active?Math.sin(t*2.2)*.075*(third?1.5:1):0,
  headCounter:active?-(third?1.20:1.15)+.06*Math.sin(t*2.9):0,
  stride:Number.isFinite(c.odo)?c.odo/1.9:0};
}
export function clownBeastPaw(pose,side,activity=1){
 if(!pose?.active)return null;
 const a=pose.stride+(side<0?0:Math.PI),motion=sat(activity),swing=Math.sin(a),lift=Math.max(0,Math.cos(a));
 return [side*(1.66+.12*motion*swing),4.03+.19*motion*lift,1.95+.34*motion*swing];
}
