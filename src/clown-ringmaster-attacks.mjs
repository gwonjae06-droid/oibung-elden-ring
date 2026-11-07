// The ringmaster fights in person, not merely through scripted troupe cues.
// These seven signatures run through the authoritative combat API. Only the
// main boss's real body dashes; warnings freeze the attack origin/direction.
// All body sweeps reuse the existing segment-based hit test from dashPart.
const TAU=Math.PI*2;
const cross=(a,t,v)=>a<v&&t>=v;
const near=p=>{const r=Math.hypot(p.x,p.z);return r>22?{x:p.x*22/r,z:p.z*22/r}:{x:p.x,z:p.z};};
const yaw=(p,q)=>Math.atan2(q.x-p.x,q.z-p.z);
const shift=(p,a,r)=>near({x:p.x+Math.sin(a)*r,z:p.z+Math.cos(a)*r});
const ease=u=>{const v=Math.max(0,Math.min(1,u));return v*v*(3-2*v);};
function gesture(api,g,c,key,kind,action){
 return api.once(c,'ringmaster-direct-'+key,()=>{
  const b=g.boss;
  api.emit(g,'clown-ringmaster-attack',{key,kind,x:b.x,z:b.z,stage:c.horrorStage||1});
  if(action)api.emit(g,'clown-horror',{cue:action,x:b.x,z:b.z});
  return {x:b.x,z:b.z,yaw:c.yaw};
 });
}
function lance(api,g,b,angle,len=12,width=2.5,warn=1.32,damage=25,sound='directorBaton'){
 return api.zone(g,{shape:'lane',x:b.x,z:b.z,yaw:angle,len,w:width,warn,
  damage,major:true,sound});
}
function circle(api,g,p,r=3.2,warn=1.35,damage=25,sound='directorWhisper'){
 return api.zone(g,{shape:'circle',...near(p),r,warn,damage,blast:true,major:true,sound});
}
export const RINGMASTER_ATTACK_DEFINITIONS=Object.freeze([
 ['directorBatonRake','단장의 지휘봉 난도질',6.25,1.65,[1,2],1],
 ['directorVelvetStep','단장의 붉은 장막 춤',6.8,1.6,[1,2],1],
 ['directorCackle','단장의 균열 웃음',6.35,1.65,[1,2],1],
 ['directorStringLash','단장의 살아 있는 인형줄',7.4,1.65,[2],2],
 ['directorInfernalRing','단장의 불의 심판',7.35,1.7,[2],2],
 ['directorStalkingRush','단장의 접힌 자세 추격',7.55,1.75,[2],2],
 ['directorFinalVerdict','마지막 관객의 처형',9.45,2.0,[2],3]
]);
// Standing baton wielder: his right hand comes back, then the *same*
// forward path becomes the sword-shaped warning and eventual damage.
function directorBatonRake(g,c,a,t,api){
 c.vis.glove=.5+.45*Math.abs(Math.sin(t*3.4));
 c.vis.tilt=.10*Math.sin(t*3.2);
 const target=api.once(c,'director-baton-target',()=>near(g.player));
 for(let i=0;i<3;i++)if(cross(a,t,.30+i*1.17)){
  gesture(api,g,c,'baton'+i,'knife','baton-swing');
  const ang=yaw(g.boss,target)+(i-1)*.23;
  c.yaw=ang;
  lance(api,g,g.boss,ang,i===2?14:11.5,i===2?2.9:2.3,1.20,22+i*2,'directorBaton');
 }
}
// Not a teleport: the spectator can watch the full body visibly weave
// through a curtain, then a genuine swept model lunges on the warned lane.
function directorVelvetStep(g,c,a,t,api){
 c.vis.crouch=t<1.45?.33*ease(t/.48):0;
 c.vis.glove=.2+Math.abs(Math.sin(t*2))*.65;
 gesture(api,g,c,'velvet','curtain','curtain');
 api.dashPart(g,c,a,t,.48,'director-silk-first');
 api.dashPart(g,c,a,t,2.52,'director-silk-second');
 if(cross(a,t,4.0)){
  const ang=yaw(g.boss,g.player);c.yaw=ang;
  lance(api,g,g.boss,ang,9.5,2.7,1.12,26,'directorCurtainBlade');
 }
}
// The conductor himself opens his rigid smile. Sound emanates from his
// mouth and only the converging physical cone will actually damage.
function directorCackle(g,c,a,t,api){
 c.vis.neck=.20+.33*Math.sin(Math.min(1,t/2)*Math.PI);
 c.vis.glove=.35+.55*Math.abs(Math.sin(t*3));
 for(let i=0;i<3;i++)if(cross(a,t,.42+i*1.38)){
  gesture(api,g,c,'cackle'+i,i===2?'bell':'choir','teeth');
  const ang=yaw(g.boss,g.player)+(i===1?.35:i===2?-.25:0);c.yaw=ang;
  api.cone(g,ang,1.27,i===2?17:14,i===2?.36:.31,23+i*2,'directorCackle');
 }
}
// Act two: he personally extends thick strings from his own gloves and
// takes space. Troupe puppets make noise but do not generate extra hits.
function directorStringLash(g,c,a,t,api){
 c.vis.glove=.7;c.vis.neck=.28;
 const target=api.once(c,'director-strings-focus',()=>near(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.37+i*1.13)){
  gesture(api,g,c,'strings'+i,'puppet','shadow');
  const ang=yaw(g.boss,target)+[0,.38,-.38,.14][i];c.yaw=ang;
  lance(api,g,g.boss,ang,17,2.28,1.33,24+(i===3?3:0),'directorStrings');
 }
}
// Act two: no instant map-wide damage. The fire ring pieces ignite in a
// readable spiral with an adjacent safe corridor throughout the show.
function directorInfernalRing(g,c,a,t,api){
 c.vis.glove=.85;c.vis.juggle=.4;
 const origin=api.once(c,'director-hoop-origin',()=>near(g.boss));
 const gap=(c.seq||0)%8;
 for(let i=0;i<8;i++)if(cross(a,t,.35+i*.54)){
  if(i===gap||i===(gap+1)%8)continue;
  gesture(api,g,c,'ring'+i,'fire','curtain');
  const q=shift(origin,i*TAU/8,7.5);
  circle(api,g,q,2.5,1.35,24,'directorFireRing');
 }
}
// The actor actually chases, with two independently warned body sweeps.
// No invisible distance-triggered attack; the body is the hitbox.
function directorStalkingRush(g,c,a,t,api){
 c.vis.crouch=t<3.5?.6:0;c.vis.shake=t<3.5?.17*Math.abs(Math.sin(t*11)):0;
 gesture(api,g,c,'hunt','rope','reverse-crawl');
 api.dashPart(g,c,a,t,.47,'director-first-lunge');
 api.dashPart(g,c,a,t,2.74,'director-second-lunge');
 if(cross(a,t,4.40)){
  gesture(api,g,c,'after-hunt','mask','teeth');
  circle(api,g,g.boss,4.7,1.22,28,'directorFinalStomp');
 }
}
// Act three: the real director is not a stationary controller. His first
// charge is a body hit, then his own baton divides the stage while the
// ensemble's matching faces silently look on. Two lanes remain free.
function directorFinalVerdict(g,c,a,t,api){
 c.vis.glove=.8;c.vis.neck=.32;
 gesture(api,g,c,'last-guest','finale','all-faces-one');
 api.dashPart(g,c,a,t,.65,'director-final-sweep');
 const focus=api.once(c,'director-execution-focus',()=>near(g.player));
 const gap=(c.seq||0)%7;
 for(let i=0;i<7;i++)if(i!==gap&&i!==(gap+1)%7&&cross(a,t,2.45+i*.55)){
  gesture(api,g,c,'judgement'+i,i%2?'knife':'bell','curtain');
  const ang=yaw(g.boss,focus)+(i-3)*.28;
  lance(api,g,g.boss,ang,19,2.26,1.41,27,'directorVerdict');
 }
}
export const RINGMASTER_ATTACK_RUN=Object.freeze({
 directorBatonRake,directorVelvetStep,directorCackle,directorStringLash,
 directorInfernalRing,directorStalkingRush,directorFinalVerdict
});
