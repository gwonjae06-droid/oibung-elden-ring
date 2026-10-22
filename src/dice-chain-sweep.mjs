import {diceTempo} from './dice-pressure.mjs';
import {applyDiceSlow} from './dice-slow.mjs';
export const CHAIN_SWEEP=Object.freeze({warning:1,sweepTime:.6,width:3.2,travel:8,damage:22,cooldown:2});
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function planChainSweep(pose,target,limit=65,axis='x'){
 const cross=axis==='x'?'z':'x';
 const room=CHAIN_SWEEP.travel/2+CHAIN_SWEEP.width/2;
 const center=clamp(target[cross],-limit+room,limit-room);
 return {axis,cross,center,sign:target[cross]<pose[cross]?-1:1,limit,travel:CHAIN_SWEEP.travel,width:CHAIN_SWEEP.width};
}
export function chainBandCenter(plan,u){return plan.center+plan.sign*plan.travel*(clamp(u,0,1)-.5);}
function rect(plan,center,half){return plan.axis==='x'?{cx:0,cz:center,halfX:plan.limit,halfZ:half}:{cx:center,cz:0,halfX:half,halfZ:plan.limit};}
export function chainLane(plan){return rect(plan,plan.center,plan.travel/2+plan.width/2);}
export function chainBand(plan,u){return rect(plan,chainBandCenter(plan,u),plan.width/2);}
export function chainSweptRect(plan,u0,u1){const a=chainBandCenter(plan,u0),b=chainBandCenter(plan,u1);return rect(plan,(a+b)/2,Math.abs(b-a)/2+plan.width/2);}
export function circleRectHit(p,r,radius=.42){const x=clamp(p.x,r.cx-r.halfX,r.cx+r.halfX),z=clamp(p.z,r.cz-r.halfZ,r.cz+r.halfZ);return Math.hypot(p.x-x,p.z-z)<=radius+1e-9;}
export function beginChainSweep(g,limit=65){
 const d=g.dice,ordinal=d.chainOrdinal||0;d.chainOrdinal=ordinal+1;
 const wave={kind:'chain-sweep',stage:'warning',t:0,tempo:diceTempo(g.boss),plan:planChainSweep(d.pose,g.player,limit,ordinal%2?'z':'x'),resolved:false};
 d.groundSpikes=wave;g.events.push({type:'dice-chain-warning',duration:CHAIN_SWEEP.warning*wave.tempo,axis:wave.plan.axis});return wave;
}
export function stepChainSweep(g,dt,frozen=false,playerRadius=.42){
 const d=g.dice,w=d.groundSpikes;
 if(g.status!=='playing'){d.groundSpikes=null;g.player.slow=null;return;}
 if(w?.kind!=='chain-sweep'||frozen||!Number.isFinite(dt)||dt<=0)return;
 let left=dt/w.tempo;
 if(w.stage==='warning'){
   const used=Math.min(left,Math.max(0,CHAIN_SWEEP.warning-w.t));w.t+=used;left-=used;
   if(w.t<CHAIN_SWEEP.warning-1e-9)return;
   w.stage='active';w.t=0;g.events.push({type:'dice-chain-sweep'});
 }
 const u0=Math.min(1,w.t/CHAIN_SWEEP.sweepTime);w.t+=left;const u1=Math.min(1,w.t/CHAIN_SWEEP.sweepTime);
 if(!w.resolved&&circleRectHit(g.player,chainSweptRect(w.plan,u0,u1),playerRadius)){
   w.resolved=true;
   if(!(g.player.invuln>0)){
     const amount=Math.min(g.player.hp,CHAIN_SWEEP.damage);g.player.hp-=amount;
     applyDiceSlow(g.player);g.events.push({type:'player-hit',source:'dice-chain',amount});
     if(g.player.hp===0){g.status='lost';d.groundSpikes=null;d.telegraph=null;d.frenzyRemaining=0;g.player.slow=null;g.events.push({type:'death'});return;}
   }
 }
 if(w.t>=CHAIN_SWEEP.sweepTime-1e-9){d.groundSpikes=null;d.spikeCooldown=CHAIN_SWEEP.cooldown;d.nextFaceAttack='portrait';g.events.push({type:'dice-chain-end'});}
}
