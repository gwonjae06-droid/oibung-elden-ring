// Four-paw contortions are momentary nightmare attacks, never default gait.
// Both the actor rig and authoritative hit geometry consume this same pose.
export const BEAST_PATTERNS=Object.freeze(['feralSkitter','reverseCrawl','facePeelHunt','ceilingPounce','unhingedClap']);
export const CRAWL_PATTERNS=Object.freeze(['feralSkitter','reverseCrawl','facePeelHunt','ceilingPounce','foldedCrawl','brokenHorses','marionetteDevour']);
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{const t=sat(x);return t*t*(3-2*t)};
export function clownBeastPose(g){
 const b=g?.boss||{},c=g?.clown||{},third=(c.horrorStage||1)>=3;
 const attacking=b.phase===2&&b.state!=='transition'&&c.state==='pattern'&&CRAWL_PATTERNS.includes(c.name);
 const t=Number.isFinite(c.pt)?c.pt:0,end=Number.isFinite(c.beastRecoverAt)?c.beastRecoverAt:6;
 const entry=attacking?smooth((t-.05)/.82)*(1-smooth((t-end)/1.1)):0;
 const pitch=(third?.87:.80)*entry;
 return {active:entry>.001,third,entry,pitch,bodyHeight:.35*entry,
  bodyRoll:Math.sin((c.time||0)*2.2)*.075*entry*(third?1.5:1),
  headCounter:-pitch+Math.sin((c.time||0)*2.9)*.05*entry,
  stride:Number.isFinite(c.odo)?c.odo/1.9:0};
}
export function clownBeastPaw(pose,side,activity=1){
 if(!pose?.active)return null;
 const a=pose.stride+(side<0?0:Math.PI),motion=sat(activity);
 const swing=Math.sin(a),lift=Math.max(0,Math.cos(a)),z=1.95+.30*motion*swing,pitch=pose.pitch||0;
 // Inverse pitch projection gives a positive palm height after rotation.
 const floorCentre=.89+.12*motion*lift;
 const y=(floorCentre-pose.bodyHeight+z*Math.sin(pitch))/Math.max(.4,Math.cos(pitch));
 return [side*(1.66+.10*motion*swing),y,z];
}
