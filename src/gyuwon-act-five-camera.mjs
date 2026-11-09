// The camera is directed by the original audio/lyric clock. These shots
// never own collision, player input, dialogue timing or phase transitions.
const SHOTS=Object.freeze({
 greet:[[0,22,59],[0,18,-22],48],
 welcome:[[-6,23,57],[0,15,-20],50],
 choose:[[6,20,59],[0,10,-15],51],
 doors:[[0,17,64],[0,12,-17],53],
 roads:[[-9,17,58],[0,7,-12],53],
 sea:[[-10,20,62],[0,9,-22],51],
 dream:[[4,27,58],[0,21,-25],49],
 king:[[8,28,57],[0,25,-25],45],
 knight:[[-10,21,56],[-5,18,-24],49],
 heart:[[0,24,56],[0,17,-23],47],
 adventure:[[8,19,61],[0,10,-15],53],
 curtain:[[0,23,63],[0,31,-28],54],
 brass:[[7,25,58],[0,19,-22],50],
 costume:[[-7,25,56],[0,19,-22],47],
 stage:[[0,22,63],[0,12,-14],54],
 dance:[[7,20,62],[0,10,-16],53],
 run:[[-8,18,64],[0,8,-13],54],
 self:[[0,24,55],[0,20,-24],49],
 sky:[[0,27,60],[0,26,-27],51],
 flight:[[0,26,64],[0,22,-25],52],
 hand:[[-5,24,52],[1,21,-23],49],
 together:[[0,24,55],[0,21,-24],49],
 roles:[[9,24,57],[0,20,-24],50],
 crowns:[[5,28,58],[0,23,-25],48],
 laugh:[[-6,17,61],[0,6,-22],52],
 friends:[[0,21,61],[0,13,-17],53],
 beginning:[[0,25,66],[0,20,-22],54],
 conduct:[[0,25,62],[0,17,-21],53]
});
export const ACT_FIVE_CAMERA_SHOTS=SHOTS;
export function actFiveCameraDirection(m,aspect=1.6){
 const cue=m?.songPerformance||{gesture:'greet',progress:0,weight:0};
 const spec=SHOTS[cue.gesture]||SHOTS.conduct,portrait=aspect<1;
 const t=Number.isFinite(m?.time)?m.time:0;
 const drift=Math.sin(t*.12)*.45;
 const [x,y,z]=spec[0], [fx,fy,fz]=spec[1];
 const position={x:x+drift,y:y,z:portrait?z+28:z};
 const target={x:fx+drift*.24,y:fy,z:fz};
 let fov=spec[2];
 // Retain the real physical warning and the party when a boss attack begins.
 if(m?.raidAttack){
  const a=m.raidAttack;
  const k=Math.max(0,Math.min(1,a.age/Math.max(.01,a.wind)));
  const focus=m.party?.find(p=>p.id===a.victim);
  target.x+=(focus?.x||0)*.12*k;
  target.y+=(focus?.y||0)*.04*k;
  fov=Math.max(fov,52);
  position.y=Math.min(position.y,23);
 }
 if(m?.actorMotion?.type==='ultimate'){
  const a=m.actorMotion,e=m.enemies?.[m.targetIndex],p=m.party?.find(v=>v.id===a.actorId);
  const progress=Math.sin(Math.min(1,a.age/a.duration)*Math.PI);
  position.x+=(p?.homeX||0)*.25*progress;
  position.z-=Math.min(8,6*progress);
  position.y+=progress*2;
  target.x+=(e?.x||0)*.18*progress;
  target.y+=progress*1.3;
 }
 if(m?.encoreCount&&m?.enemies?.[5]&&!m.enemies[5].destroyed){
  const e=m.enemies[5];target.x+=(e.x-target.x)*.12;
 }
 return {position,target,fov};
}
