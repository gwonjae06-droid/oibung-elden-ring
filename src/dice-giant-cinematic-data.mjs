// Deterministic seven-second possession. Every beat derives from simulation time.
export const POSSESSION=Object.freeze({still:0.6,spinEnd:3.6,launchEnd:3.85,possessEnd:4.5,riseEnd:5.8,end:7});
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
export function spinPose(from,t){
 const progress=sat((t-POSSESSION.still)/3);
 const angular=2*Math.PI*(1.8*progress+5*progress**3);
 const radius=35-13*progress;
 const orbit={x:Math.sin(angular)*radius,y:28+43*smooth(progress)+7*Math.sin(progress*Math.PI*3),z:-29+Math.cos(angular)*radius};
 const entrance=smooth(progress/.12);
 const turn=yawTurn(angular+progress*11*Math.PI);
 return {x:mix(from.x,orbit.x,entrance),y:mix(from.y,orbit.y,entrance),z:mix(from.z,orbit.z,entrance),rotation:unit(from.rotation.map((n,i)=>mix(n,turn[i],entrance)))};
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
export function possessionScale(t){return 1+.4*smooth((t-4.05)/1.5);}
