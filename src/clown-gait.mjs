// Physically supported circus footwork. Animation only: the player's and
// clown's collision bodies remain at their simulation-authoritative positions.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=u=>{const t=clamp(u);return t*t*(3-2*t);};
const mix=(a,b,u)=>a+(b-a)*u;
const TAU=Math.PI*2;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const length=v=>Math.hypot(...v);
export function clownLegTarget(side,phase,activity,crouch=0){
 const a=clamp(activity),p=((phase%1)+1)%1;
 const stance=p<.62,u=stance?smooth(p/.62):smooth((p-.62)/.38);
 // A planted shoe travels backward relative to the torso; during swing
 // it clears the floor and returns forward before the next foot plants.
 const stride=stance?mix(.44,-.44,u):mix(-.44,.44,u);
 const lift=stance?0:Math.sin(Math.PI*u)*.28*a;
 const hip=[side*.45,1.25-crouch*.12,0];
 const foot=[side*(.55+.025*a),.10+lift,.25+stride*a*.78];
 const toward=minus(foot,hip),dist=Math.max(1e-8,length(toward)),
  axis=toward.map(v=>v/dist),pole=[side*.16,.04,1],
  projection=dot(pole,axis),v=pole.map((q,i)=>q-projection*axis[i]),
  norm=Math.max(1e-8,length(v)),
  // Two articulated, almost-constant length bones instead of a frozen knee.
  radius=Math.max(.68,dist/2+.015),bend=Math.sqrt(Math.max(0,radius*radius-dist*dist/4)),
  knee=hip.map((q,i)=>q+toward[i]*.5+v[i]/norm*bend);
 return {hip,knee,foot,planted:stance,lift,phase:p};
}
export function createClownGait(){
 let owner=null,odo=0,activity=0;
 function reset(){owner=null;odo=0;activity=0;}
 function update(g,dt){
  const current=Number.isFinite(g?.clown?.odo)?g.clown.odo:0,h=clamp(dt,0,.05),
   state=g?.clown?.state;
  if(owner!==g){owner=g;odo=current;activity=0;}
  const distance=Math.abs(current-odo);
  const velocity=h>0?clamp(distance/Math.max(h,.001)/8):0;
  if(h>0){activity=mix(activity,velocity,1-Math.exp(-12*h));odo=current;}
  const phase=current/3.8;
  const crouch=clamp(g?.clown?.vis?.crouch||0);
  const legs=[clownLegTarget(-1,phase,activity,crouch),clownLegTarget(1,phase+.5,activity,crouch)];
  const running=state==='pattern'&&g?.clown?.name==='dash';
  const sway=activity*Math.sin(phase*TAU)*.024,weight=activity*(running?.08:.035);
  return {legs,bob:activity*Math.abs(Math.sin(phase*TAU))*.035,
   roll:sway,lean:weight,activity};
 }
 return {update,reset};
}
