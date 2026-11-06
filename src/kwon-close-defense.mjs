// Readable, non-interrupting responses to sustained point-blank pressure.
// This module chooses an existing animated boss pattern; damage is still
// resolved by combat.mjs against the real blade, ground or shove geometry.
export const KWON_CLOSE_DEFENSE=Object.freeze({
 range:3.3,
 rearWindup:.24,
 flankWindup:.42,
 frontWindup:.65,
 prolonged:1.5,
 cooldown:2.7,
 frontArc:1.05,
 rearArc:2.05,
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function kwonCloseSituation(b,p){
 if(!b||!p||![b.x,b.z,b.yaw,p.x,p.z].every(finite))return null;
 const dx=p.x-b.x,dz=p.z-b.z,distance=Math.hypot(dx,dz);
 const direction=Math.atan2(dx,dz);
 const offset=Math.atan2(Math.sin(direction-b.yaw),Math.cos(direction-b.yaw));
 return {distance,angle:offset,region:Math.abs(offset)>KWON_CLOSE_DEFENSE.rearArc?'rear':
  Math.abs(offset)<KWON_CLOSE_DEFENSE.frontArc?'front':'flank'};
}
export function chooseKwonCloseDefense(b,p){
 if(!b||b.state!=='idle'||b.stun>0||b.punishable||b.closeCooldown>0)return null;
 const info=kwonCloseSituation(b,p);
 if(!info||info.distance>=KWON_CLOSE_DEFENSE.range)return null;
 const held=finite(b.hug)?b.hug:0;
 // A long hug gets a genuine, widely telegraphed floor shockwave. It is not
 // a sword hit, and already has a matching world-space impact effect.
 if(held>=KWON_CLOSE_DEFENSE.prolonged)return 'stomp';
 // Turning rear cut: first visibly rotate the torso to face the player,
 // then let the physical sword perform the hit test.
 if(info.region==='rear'&&held>=KWON_CLOSE_DEFENSE.rearWindup)return 'backsweep';
 // Sidestep/backstep to restore the greatsword's useful reach.
 if(info.region==='flank'&&held>=KWON_CLOSE_DEFENSE.flankWindup)return 'retreat';
 // Pommel/shoulder shove has a narrow forward-only push cone and zero damage.
 if(held>=KWON_CLOSE_DEFENSE.frontWindup)return 'shove';
 return null;
}
