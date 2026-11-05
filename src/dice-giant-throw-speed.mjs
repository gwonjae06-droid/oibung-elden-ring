export const GIANT_THROW_SLOW=1.1;
export function slowThrownHazards(hazards,isThrown,factor=GIANT_THROW_SLOW){
 return hazards.map(h=>h&&!h.throwSlowed&&Number.isFinite(h.warn)&&h.warn>0&&isThrown(h)?{...h,warn:h.warn*factor,throwSlowed:true}:h);
}
