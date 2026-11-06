// A deliberate, visible flight instead of the old ~0.11 second teleport.
// Only physical thrown props get longer windups; palm/head attack cues retain
// their existing combat timing.
export const GIANT_THROW_SLOW=1.85;
export const GIANT_THROW_FLIGHT_SECONDS=1.25;
export function slowThrownHazards(hazards,isThrown,factor=GIANT_THROW_SLOW){
 return hazards.map(h=>h&&!h.throwSlowed&&Number.isFinite(h.warn)&&h.warn>0&&isThrown(h)
  ?{...h,warn:h.warn*factor,flightSeconds:GIANT_THROW_FLIGHT_SECONDS,throwSlowed:true}:h);
}
