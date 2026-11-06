// Tiny, gameplay-read-only rim-light directions. This is stage lighting,
// NOT an attack telegraph or danger-area visual and never spawns a shadow light.
const bound=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
export function cinematicLightCue(game,profile='kwon'){
 const b=game?.boss||{},phase=b.phase>1?2:1;
 if(game?.status&&game.status!=='playing')return {rim:0,environment:0,warmth:0};
 let rim=0;
 if(profile==='kwon'){
  rim=b.state==='windup'?.12:b.state==='active'?.28:b.state==='recovery'?.08:0;
 }else if(profile==='clown'){
  const c=game?.clown||{},performing=['pattern','show'].includes(c.state);
  rim=performing?.15+bound(c.vis?.stomp||0)*.1+bound(c.vis?.glove||0)*.045:0;
 }else if(profile==='dice'){
  const s=game?.dice?.giant;
  rim=s?.state==='attack'?.23:s?.state==='transition'?.12:
   ['charge-warning','jump-warning','pip-warning'].includes(game?.dice?.state)?.08:0;
 }else if(profile==='blood'){
  rim=b.state==='pattern'?.18:b.state==='transition'?.17:0;
  if(b.state==='pattern'&&game?.blood?.elevation>0)rim+=.055;
 }
 const phaseAccent=phase===2?.055:0;
 const intensity=bound(rim+phaseAccent,0,.38);
 return {rim:intensity,environment:bound(intensity*.055,0,.024),
  warmth:phase===2?(profile==='blood'?.55:profile==='dice'?.20:.09):0};
}
