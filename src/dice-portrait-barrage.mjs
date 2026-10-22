import {groundContactFace,segmentSquareHit} from './dice-ground-face.mjs';
import {diceTempo} from './dice-pressure.mjs';
export const PORTRAIT_BARRAGE=Object.freeze({warning:.9,interval:.18,speed:20,life:3.2,half:.55,damage:18,cooldown:1.2});
// Legacy storage keys preserve the existing engine's terminal cleanup contract.
export function stepPortraitBarrage(g,dt,frozen=false,edge=12,limit=65,playerRadius=.42){
 const d=g.dice;if(g.status!=='playing'){d.groundSpikes=null;d.spikeCooldown=0;return;}
 const contact=groundContactFace(d.pose,edge);d.bottomFace=contact;if(contact?.pips===0){d.groundSpikes=null;d.spikeCooldown=0;return;}if(frozen)return;
 let w=d.groundSpikes;
 if(!w){d.spikeCooldown=Math.max(0,(d.spikeCooldown||0)-dt/diceTempo(g.boss));if(d.spikeCooldown>0||!contact)return;
 const target={x:g.player.x,z:g.player.z},p=d.pose,n=Math.hypot(target.x-p.x,target.z-p.z),ax=n?(target.x-p.x)/n:1,az=n?(target.z-p.z)/n:0,clip=v=>Math.max(-limit,Math.min(limit,v));
 const cards=Array.from({length:contact.pips},(_,i)=>{const side=(i-(contact.pips-1)/2)*1.4,reach=edge/(2*Math.max(Math.abs(ax),Math.abs(az)))+1,x=clip(p.x+ax*reach-az*side),z=clip(p.z+az*reach+ax*side),len=Math.hypot(target.x-x,target.z-z)||1;return {x,z,origin:{x,z},dx:(target.x-x)/len,dz:(target.z-z)/len,delay:i*PORTRAIT_BARRAGE.interval,launched:false,alive:true,age:0};});
 w=d.groundSpikes={kind:'portrait-barrage',stage:'warning',t:0,tempo:diceTempo(g.boss),count:cards.length,target,cards,limit};g.events.push({type:'dice-portrait-warning',count:w.count,target:{...target},duration:PORTRAIT_BARRAGE.warning*w.tempo});return;}
 const h=dt/w.tempo;w.t+=h;if(w.stage==='warning'){if(w.t<PORTRAIT_BARRAGE.warning)return;w.stage='active';w.t=0;g.events.push({type:'dice-portrait-barrage'});return;}
 for(const c of w.cards){if(!c.alive||w.t<c.delay)continue;const step=c.launched?h:Math.min(h,w.t-c.delay);c.launched=true;const a={x:c.x,z:c.z};c.x+=c.dx*PORTRAIT_BARRAGE.speed*step;c.z+=c.dz*PORTRAIT_BARRAGE.speed*step;c.age+=step;
 if(segmentSquareHit(a,c,g.player,PORTRAIT_BARRAGE.half+playerRadius)){c.alive=false;if(!(g.player.invuln>0)){const amount=Math.min(g.player.hp,PORTRAIT_BARRAGE.damage);g.player.hp-=amount;g.events.push({type:'player-hit',source:'dice-portrait',amount});if(g.player.hp===0){g.status='lost';d.groundSpikes=null;d.telegraph=null;d.frenzyRemaining=0;g.events.push({type:'death'});return;}}}
 if(c.age>=PORTRAIT_BARRAGE.life||Math.abs(c.x)>limit+1||Math.abs(c.z)>limit+1)c.alive=false;}
 if(w.cards.every(c=>!c.alive)){d.groundSpikes=null;d.spikeCooldown=PORTRAIT_BARRAGE.cooldown;}
}
