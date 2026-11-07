// One deterministic, non-skippable ~5.2s conductor transformation.
// Every camera, choreography and stage-prop reads this same beat. Visual only.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=u=>{const n=sat(u);return n*n*(3-2*n)};
export const CLOWN_PHASE2_DURATION=5.2;
export const CLOWN_PHASE2_CUES=Object.freeze([
 Object.freeze({at:.28,type:'clown-phase2-overture'}),
 Object.freeze({at:1.36,type:'clown-phase2-string-tension'}),
 Object.freeze({at:2.8,type:'clown-phase2-mask-break'}),
 Object.freeze({at:4.02,type:'clown-phase2-reveal'})
]);
export function clownPhase2Beat(game){
 const b=game?.boss||{},active=b.state==='transition'&&b.phase===2;
 const t=active?Math.max(0,Math.min(CLOWN_PHASE2_DURATION,b.t||0)):0;
 const silk=smooth((t-.18)/.74)*(1-smooth((t-4.78)/.37));
 const bind=smooth((t-1.14)/.65)*(1-smooth((t-3.37)/.55));
 const fracture=smooth((t-2.65)/.52);
 const command=smooth((t-3.45)/.75);
 const alive=active?Math.min(1,smooth(t/.35))*(1-smooth((t-4.9)/.30)):0;
 const close=-2.7*Math.sin(Math.PI*t/CLOWN_PHASE2_DURATION);
 return {active,t,silk,bind,fracture,command,alive,
  cameraDistance:active?close:0,
  cameraLift:active?.75*Math.sin(Math.PI*t/CLOWN_PHASE2_DURATION):0,
  headTurn:bind*Math.sin(t*3.1)*.36,
  chestArch:.21*bind-.15*command,
  armSpread:.95*smooth((t-1.10)/1.4),
  finale:command*alive};
}
