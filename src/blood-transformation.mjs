// All cinematic clocks use combat simulation time, including pause and skip.
export const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function bloodTransformation(g){
 const active=g.boss.state==='transition',t=active?g.blood.t:0,settled=g.boss.phase===2&&!active;
 return {active,t,prayer:active?smooth(.6,1.8,t):0,bell:active?Math.max(0,1-Math.abs(t-1.92)/.22):0,
  veins:settled?1:active?smooth(.8,2.6,t):0,bones:settled?1:active?smooth(1.8,2.9,t):0,
  membrane:settled?1:active?smooth(2.6,3.55,t):0,wings:settled?1:active?smooth(2.6,3.8,t):0,
  dissolve:settled?1:active?smooth(1.9,3.1,t):0,
  darkness:active?smooth(0,.6,t)*(1-smooth(2.6,3.8,t)):0,
  wave:active?smooth(3.45,4.15,t):0,camera:active?smooth(0,.6,t)*(1-smooth(3.8,4.6,t)):0,
  // Environment choreography: glass and vault fracture first, then the
  // sanctuary floods, finally revealing an endless scarlet storm.
  rupture:settled?1:active?smooth(1.35,3.75,t):0,
  seaRise:settled?1:active?smooth(1.7,4.4,t):0,
  sky:settled?1:active?smooth(2.4,4.3,t):0,
  storm:settled?1:active?smooth(3.15,4.6,t):0,
  musicGain:active?1-smooth(0,.48,t):1,musicPhase:active&&t<3.8?1:g.boss.phase};
}
export function poseBloodCamera(camera,target,g,{reduced=false}={}){
 const c=bloodTransformation(g);if(!c.active||reduced)return;
 const t=c.t,b=g.boss,side=Math.sin(b.yaw),front=Math.cos(b.yaw),u=c.camera;
 // Travel from the prayer/window framing into a restrained low wing reveal.
 const height=5+smooth(.6,1.8,t)*7-smooth(2.1,3.3,t)*8;
 const distance=18-smooth(2.4,3.8,t)*2;
 camera.position.lerp({x:b.x+side*distance,y:height+g.blood.elevation*.4,z:b.z+front*distance},u);
 target.lerp({x:b.x,y:4+g.blood.elevation+smooth(.6,1.7,t)*5-smooth(2,3.3,t)*5,z:b.z},u);
}
