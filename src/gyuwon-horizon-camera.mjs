const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function gyuwonHorizonShot(g,{reduced=false}={}){
 const wave=g?.gyuwon?.hazards?.find(h=>h.shape==='wave');
 if(g?.status!=='playing'||g?.boss?.state!=='pattern'||!wave)return {active:false,weight:0};
 const t=wave.age,finish=Math.min(1.85,wave.warn-.15),hold=Math.min(.95,finish*.55);
 const weight=smooth(.02,.3,t)*(1-smooth(hold,finish,t))*(reduced?.55:1);
 return {active:weight>.001,weight,finish,t,gap:wave.gap,z:wave.z+Math.max(0,t-wave.warn)*wave.speed};
}
export function poseGyuwonHorizonCamera(camera,target,g,options={}){
 const s=gyuwonHorizonShot(g,options);if(!s.active)return s;
 const p=g.player;
 // Reveal from outside the recalled cathedral so its rear wall cannot hide the horizon.
 camera.position.lerp({x:s.gap+18,y:14,z:s.z+95},s.weight);
 target.lerp({x:s.gap,y:18,z:s.z},s.weight);
 camera.fov+=(55-camera.fov)*s.weight;camera.updateProjectionMatrix();return s;
}
