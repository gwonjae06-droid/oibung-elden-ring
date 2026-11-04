// Synchronized screen impact for Park Sungwon. No timers or game damage.
const finite=(n,d=0)=>Number.isFinite(n)?n:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createDiceSlamFeedback({reduced=false,holdSeconds=.065}={}){
 let hold=0,age=0,energy=0,sign=1;
 function event(e){
  if(e?.type!=='dice-giant-head-impact')return false;
  if(reduced)return true;
  const strength=clamp(finite(e.strength,1),.2,1.4);
  hold=Math.max(hold,holdSeconds*(e.rapid?.65:1));
  energy=Math.max(energy,strength);age=0;sign=finite(e.x)<0?-1:1;
  return true;
 }
 function tick(dt,active=true){
  if(!Number.isFinite(dt)||dt<=0)return 0;
  if(!active)return dt;
  age+=dt;energy*=Math.exp(-dt*8);
  if(hold>0){hold=Math.max(0,hold-dt);return 0;}
  return dt;
 }
 function apply(camera,target){
  if(reduced||energy<.001||!camera?.position||!target)return false;
  const kick=energy*Math.sin(age*58);
  camera.position.x+=sign*.19*kick;
  camera.position.y+=.43*kick-.14*energy;
  camera.position.z+=.22*energy*Math.cos(age*42);
  target.y-=.38*energy;return true;
 }
 function reset(){hold=0;age=0;energy=0;sign=1;}
 return {event,tick,apply,reset,get hold(){return hold;},get energy(){return energy;}};
}
