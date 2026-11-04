// Deterministic in-place possession: swelling/tremor -> violent accelerating spin -> neck strike.
export const POSSESSION=Object.freeze({still:.6,spinEnd:3.6,launchEnd:3.85,possessEnd:4.5,riseEnd:5.8,end:7});
const sat=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>{const t=sat(v);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const unit=q=>{const m=Math.hypot(...q)||1;return q.map(n=>n/m);};
const yawTurn=a=>[0,Math.sin(a/2),0,Math.cos(a/2)];
export function cinematicBeat(t){
 if(t<POSSESSION.still)return 'still';
 if(t<POSSESSION.spinEnd)return 'spin';
 if(t<POSSESSION.launchEnd)return 'launch';
 if(t<POSSESSION.possessEnd)return 'possess';
 if(t<POSSESSION.riseEnd)return 'rise';
 if(t<POSSESSION.end)return 'reveal';
 return 'complete';
}
export function possessionScale(t){
 // The die visibly grows in place during the three-second charge, before the impact.
 if(t<=POSSESSION.still)return 1;
 if(t<POSSESSION.spinEnd)return 1+.32*smooth((t-POSSESSION.still)/3);
 return 1.32+.08*smooth((t-POSSESSION.spinEnd)/.9);
}
export function spinPose(from,t){
 const p=sat((t-POSSESSION.still)/3);
 // The angle, not the path, accelerates sharply. Jitter grows with speed.
 const angle=2*Math.PI*(1.2*p+8.4*p*p*p);
 const amp=1.3*p*p;
 const jitter=p>=1?0:amp;
 const rotation=unit(yawTurn(angle));
 return {x:from.x+jitter*Math.sin(p*133),y:from.y+8*smooth(p)+jitter*.55*Math.cos(p*109),z:from.z+jitter*Math.sin(p*107),rotation};
}
export function possessionPose(from,t){
 const rotation=yawTurn(-Math.PI/2);
 if(t<POSSESSION.still)return {...from,rotation:[...from.rotation]};
 if(t<POSSESSION.spinEnd)return spinPose(from,t);
 if(t<POSSESSION.launchEnd){
  const p=spinPose(from,POSSESSION.spinEnd),u=smooth((t-POSSESSION.spinEnd)/.25);
  return {x:mix(p.x,0,u),y:mix(p.y,58,u),z:mix(p.z,-106,u),rotation:unit(p.rotation.map((n,i)=>mix(n,rotation[i],u)))};
 }
 return {x:0,y:58,z:-106,rotation};
}
