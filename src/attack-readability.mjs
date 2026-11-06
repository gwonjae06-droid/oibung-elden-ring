// Shared encounter timing contract.  This never writes damage directly:
// boss simulations and visible body language both read the same timestamps.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export const smoothAnticipation=t=>{const u=sat(t);return u*u*(3-2*u);};
export const READABLE_ATTACK=Object.freeze({
 kwon:Object.freeze({ordinary:.43,ordinaryFirst:.48,heavy:.74}),
 clown:Object.freeze({ordinary:.56,heavy:.70,close:.47}),
 dice:Object.freeze({rush:.92,heavy:1.15,rapid:.79}),
 blood:Object.freeze({spell:1.15}),
});
const HEAVY_KWON=new Set(['thrust','slam','leap','whirl','wave','stomp']);
const QUICK_CLOWN=new Set(['shove','dash','clap','bounce']);
const HEAVY_CLOWN=new Set([
 'tripleBomb','lastClap','curtainCall','humanCannon','ballCannon',
 'ballSpin','mirrorStage','trapdoorWaltz','grandEncore','invertedApplause',
]);
export function kwonReadableWind(pattern,wind,phase=1){
 const floor=HEAVY_KWON.has(pattern)?READABLE_ATTACK.kwon.heavy:
  phase===2?READABLE_ATTACK.kwon.ordinary:READABLE_ATTACK.kwon.ordinaryFirst;
 return Math.max(wind??0,floor);
}
export function clownPrecastTime(name){
 return QUICK_CLOWN.has(name)?READABLE_ATTACK.clown.close:
  HEAVY_CLOWN.has(name)?READABLE_ATTACK.clown.heavy:READABLE_ATTACK.clown.ordinary;
}
export function clownPrecastPose(name,t,lead){
 const u=smoothAnticipation(t/Math.max(.01,lead));
 const throwing=/Bomb|Cannon|juggle|Encore|ballRain|balloon/i.test(name);
 const clapping=/clap|applause|horn|fan/i.test(name);
 const jumping=/bounce|jump|dash|trapdoor|carousel/i.test(name);
 return {
  crouch:(jumping?.65:.22)*u,
  glove:(clapping?.95:throwing?.72:.38)*u,
  tilt:Math.sin(u*Math.PI)*(.13+(throwing?.1:0)),
  shake:(throwing?.15:.045)*u,
  juggle:throwing?.2*u:0,
  stomp:jumping?.25*u:0,
 };
}
export function giantReadableWarning(h){
 if(!h||!Number.isFinite(h.warn))return h;
 const fast=Boolean(h.rapid),head=Boolean(h.headSlam);
 const minimum=fast?READABLE_ATTACK.dice.rapid:
  head||h.damage>=35?READABLE_ATTACK.dice.heavy:READABLE_ATTACK.dice.rush;
 return {...h,warn:Math.max(h.warn,minimum)};
}
export const bloodReadableWarning=warn=>Math.max(warn??0,READABLE_ATTACK.blood.spell);
