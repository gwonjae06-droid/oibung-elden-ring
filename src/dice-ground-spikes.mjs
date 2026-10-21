import {diceTopFace,diceWorldVector} from './dice-orientation.mjs';
import {DICE_PHOTO_FACE} from './dice-photo-data.mjs';
import {diceTempo} from './dice-pressure.mjs';
export const GROUND_SPIKES=Object.freeze({warning:.9,active:.65,cooldown:.8,radius:1.25,damage:32});
const NORMALS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function groundContactFace(pose,edge=8){
 if(!pose||!Number.isFinite(pose.y)||Math.abs(pose.y-edge/2)>.02)return null;
 const top=diceTopFace(pose.rotation);if(!top||diceWorldVector(NORMALS[top.face],pose.rotation)[1]<.999999)return null;
 const face=top.face^1;return {face,pips:face===DICE_PHOTO_FACE?0:7-top.pips};
}
function targets(p,count,limit){const cells=[];for(const r of [0,4,8,12]){for(let i=0;i<(r?8:1);i++){const a=i*Math.PI/4,x=Math.max(-limit,Math.min(limit,p.x+Math.cos(a)*r)),z=Math.max(-limit,Math.min(limit,p.z+Math.sin(a)*r));if(!cells.some(c=>Math.hypot(c.x-x,c.z-z)<.1))cells.push({x,z});if(cells.length===count)return cells;}}return cells;}
export function stepGroundSpikes(g,dt,frozen=false,edge=8,limit=43,playerRadius=.42){
 const d=g.dice;if(g.status!=='playing'){d.groundSpikes=null;d.spikeCooldown=0;return;}
 const contact=groundContactFace(d.pose,edge);d.bottomFace=contact;
 if(contact?.pips===0){d.groundSpikes=null;d.spikeCooldown=0;return;}
 if(frozen)return;
 let wave=d.groundSpikes;
 if(!wave){d.spikeCooldown=Math.max(0,(d.spikeCooldown||0)-dt/diceTempo(g.boss));if(d.spikeCooldown>0||!contact)return;
 wave=d.groundSpikes={cells:targets(g.player,contact.pips,limit),face:contact.face,count:contact.pips,stage:'warning',t:0,tempo:diceTempo(g.boss),hit:false};g.events.push({type:'dice-spike-warning',cells:wave.cells.map(c=>({...c})),count:wave.count,face:wave.face,radius:GROUND_SPIKES.radius,duration:GROUND_SPIKES.warning*wave.tempo});return;}
 wave.t+=dt/wave.tempo;
 if(wave.stage==='warning'){if(wave.t<GROUND_SPIKES.warning)return;wave.stage='active';wave.t=0;g.events.push({type:'dice-spike-erupt',count:wave.count});}
 if(wave.t>=GROUND_SPIKES.active){d.groundSpikes=null;d.spikeCooldown=GROUND_SPIKES.cooldown;return;}
 if(!wave.hit&&!(g.player.invuln>0)&&wave.cells.some(c=>Math.hypot(g.player.x-c.x,g.player.z-c.z)<=GROUND_SPIKES.radius+playerRadius)){wave.hit=true;const amount=Math.min(g.player.hp,GROUND_SPIKES.damage);g.player.hp-=amount;g.events.push({type:'player-hit',source:'dice-spikes',amount});if(g.player.hp===0){g.status='lost';d.groundSpikes=null;d.telegraph=null;d.frenzyRemaining=0;g.events.push({type:'death'});}}
}
export function buildGroundSpikeVisuals(THREE,root){
 const group=new THREE.Group();group.name='dice-ground-spikes';group.visible=false;root.add(group);
 const mat=new THREE.MeshBasicMaterial({color:0xff431b,transparent:true,opacity:.4,depthWrite:false}),hot=new THREE.MeshStandardMaterial({color:0xffa143,emissive:0xff3a0a,emissiveIntensity:1.2,metalness:.5,roughness:.5}),disc=new THREE.CircleGeometry(GROUND_SPIKES.radius+.42,48).rotateX(-Math.PI/2),cone=new THREE.ConeGeometry(GROUND_SPIKES.radius,4,10),slots=[];
 for(let i=0;i<6;i++){const mark=new THREE.Mesh(disc,mat),spike=new THREE.Mesh(cone,hot);group.add(mark,spike);slots.push({mark,spike});}
 return {update(g){const wave=g.dice.groundSpikes;group.visible=g.status==='playing'&&Boolean(wave);for(let i=0;i<slots.length;i++){const s=slots[i],c=wave?.cells[i];s.mark.visible=Boolean(c)&&group.visible;s.spike.visible=s.mark.visible&&wave.stage==='active';if(!c)continue;s.mark.position.set(c.x,.1,c.z);const height=Math.max(.01,Math.min(1,wave.t/.12));s.spike.scale.y=height;s.spike.position.set(c.x,2*height,c.z);}}};
}
