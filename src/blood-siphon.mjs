import {BLOOD_PHASE_TWO_ENTRY_RATIO} from './blood-data.mjs';

// A deliberately finite second-phase sustain mechanic. The blood sea recharges
// the boss, but never above the phase-two entry threshold and never indefinitely.
// All clocks use fixed-step combat time, so pausing cannot heal the boss.
export const BLOOD_SIPHON_RULES=Object.freeze({
 firstDelay:10.5,
 interval:15,
 channel:2.4,
 healFraction:.05, // 5% of the encounter's configured max HP.
 maxHeals:5,
 phaseCeiling:BLOOD_PHASE_TWO_ENTRY_RATIO,
 retryWhenFull:1.25
});

export function createBloodSiphonState(){
 return {cooldown:BLOOD_SIPHON_RULES.firstDelay,active:false,t:0,
  heals:0,totalHealed:0,lastAmount:0,flash:0};
}
export function tickBloodSiphon(g,dt){
 const b=g?.boss,s=g?.blood?.siphon;
 if(!s||!Number.isFinite(dt)||dt<=0)return;
 s.flash=Math.max(0,s.flash-dt);
 if(g.status!=='playing'||b.phase!==2||g.blood.seraphPending||
  b.state==='transition'||b.state==='dead'||b.hp<=0)return;
 const rules=BLOOD_SIPHON_RULES;
 if(s.heals>=rules.maxHeals)return;
 const cap=b.maxHp*rules.phaseCeiling;
 if(s.active){
  s.t=Math.min(rules.channel,s.t+dt);
  if(s.t+1e-7<rules.channel)return;
  s.active=false;s.t=0;s.cooldown=rules.interval;
  const healed=Math.max(0,Math.min(b.maxHp*rules.healFraction,cap-b.hp));
  if(healed>0){
   b.hp+=healed;
   s.heals++;s.totalHealed+=healed;s.lastAmount=healed;s.flash=1.35;
   g.events.push({type:'blood-siphon-heal',amount:healed,heals:s.heals,
    x:b.x,z:b.z,y:4.7+g.blood.elevation});
  }
  return;
 }
 s.cooldown=Math.max(0,s.cooldown-dt);
 if(s.cooldown>1e-7)return;
 // Wait for the player to deal damage: no wasted rituals or fake healing FX.
 if(b.hp>=cap-.01){s.cooldown=rules.retryWhenFull;return;}
 s.cooldown=0;s.active=true;s.t=0;
 g.events.push({type:'blood-siphon-begin',duration:rules.channel,
  x:b.x,z:b.z,y:4.7+g.blood.elevation});
}
