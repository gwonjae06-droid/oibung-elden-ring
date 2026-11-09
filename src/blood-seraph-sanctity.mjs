import {bloodSeraphChoirCue} from './blood-seraph-choir.mjs';

// All effects are visual-only and derive from real authored collision clocks.
// Never mutate damage, warning windows or audio transport from this module.
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const MAJESTY=Object.freeze({
 seraphSweep:1.12,seraphWingCross:1.08,seraphInwardPillars:1.23,
 seraphFrenzy:1.28,seraphHaloProcession:1.12,seraphBloodRosette:1.19,
 seraphFinale:1.5
});
export function bloodSeraphSanctity(g,music=bloodSeraphChoirCue()){
 const active=g?.status==='playing'&&g.boss?.phase===3;
 if(!active)return {active:false,brightness:0,choir:0,wingSpread:0,
  haloSpeed:1,charge:0,impact:0,patternScale:1,source:'none'};
 const s=g.blood,pattern=s.pattern,magnitude=MAJESTY[pattern]||1;
 const live=g.boss.state==='pattern';
 let charge=0,impact=0;
 if(live)for(const h of s.hazards||[]){
  const until=h.warn-h.age,elapsed=h.age-h.warn;
  if(until>=0&&until<=1.25)
   charge=Math.max(charge,clamp(1-until/1.25));
  if(elapsed>=0&&elapsed<h.life)
   impact=Math.max(impact,clamp(1-elapsed/Math.max(.2,Math.min(.75,h.life))));
 }
 const choir=music.active?clamp(
  music.energy*.39+music.crescendo*.86+music.accent*.54):0;
 const transition=g.boss.state==='transition'
  ?clamp((s.t||0)/5.6)*.48:0;
 // A broad warm-white illumination spreads while the crimson strike
 // actually goes live. Spectral choir increases grandeur, not hitboxes.
 const brightness=clamp(
  .14+transition+(.38*charge+1.05*impact)*magnitude+choir*.34,0,1.75);
 return {active:true,brightness,charge,impact,choir,
  wingSpread:clamp(choir*.28+impact*.21+charge*.09,0,.52),
  haloSpeed:1+choir*2.8+impact*1.5+charge*.45,
  patternScale:magnitude,source:music.source};
}
