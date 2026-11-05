const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function solveClownArm(shoulder,hand,side=1,previous=null){
 if(![shoulder,hand].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))throw new TypeError('Finite arm endpoints required');
 const v=hand.map((x,i)=>x-shoulder[i]),d=Math.hypot(...v),n=d>1e-8?v.map(x=>x/d):[0,0,1],length=Math.max(1.2,d/1.88),pole=previous?previous.map((x,i)=>x-shoulder[i]):[side,-.65,-.35];
 let bend=pole.map((x,i)=>x-n[i]*dot(pole,n)),m=Math.hypot(...bend);
 if(m<1e-6){const fallback=Math.abs(n[1])<.9?[0,-1,0]:[side,0,0];bend=fallback.map((x,i)=>x-n[i]*dot(fallback,n));m=Math.hypot(...bend);}
 const height=Math.sqrt(Math.max(0,length*length-d*d/4)),elbow=shoulder.map((x,i)=>x+n[i]*d/2+bend[i]/m*height);
 return {shoulder:[...shoulder],elbow,hand:[...hand],upper:length,lower:length};
}
export function createClownArmRig(T,body,L){
 const shoulder=new T.Group(),elbow=new T.Group(),wrist=new T.Group();shoulder.name='clown-shoulder-'+L.s;elbow.name='clown-elbow-'+L.s;wrist.name='clown-wrist-'+L.s;
 body.add(shoulder);shoulder.add(L.upper,elbow);elbow.add(L.lower,L.elbow,L.cuff,wrist);wrist.add(L.glove);L.glove.position.set(0,0,0);L.elbow.position.set(0,0,0);
 const position=new T.Vector3(),target=new T.Vector3(),axis=new T.Vector3(0,1,0),direction=new T.Vector3(),upperQ=new T.Quaternion(),lowerQ=new T.Quaternion(),wristQ=new T.Quaternion();let owner=null,ready=false,previous=null;
 function pose(from,to,dt,locked=false,game=null){
  const h=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;target.set(...to);
  if(!ready||owner!==game){position.copy(target);previous=null;owner=game;ready=true;}else if(locked)position.copy(target);else if(h>0)position.lerp(target,1-Math.exp(-24*h));
  const p=solveClownArm(from,position.toArray(),L.s,previous);previous=p.elbow;
  shoulder.position.set(...p.shoulder);direction.set(...p.elbow).sub(target.set(...p.shoulder)).normalize();upperQ.setFromUnitVectors(axis,direction);shoulder.quaternion.copy(upperQ);
  elbow.position.set(0,p.upper,0);direction.set(...p.hand).sub(target.set(...p.elbow)).normalize();lowerQ.setFromUnitVectors(axis,direction);elbow.quaternion.copy(upperQ).invert().multiply(lowerQ);
  wrist.position.set(0,p.lower,0);wristQ.identity();if(!locked)wristQ.slerp(lowerQ,.18);wrist.quaternion.copy(lowerQ).invert().multiply(wristQ);
  L.upper.position.set(0,p.upper/2,0);L.upper.scale.set(1,p.upper,1);L.lower.position.set(0,p.lower/2,0);L.lower.scale.set(1,p.lower,1);L.cuff.position.set(0,p.lower-.12,0);
  return p;
 }
 return {shoulder,elbow,wrist,pose};
}
