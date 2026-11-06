import {applyBossHitTrait} from './boss-hit-traits.mjs';
import {diceInvulnerable} from './dice-defense.mjs';

// Unlike the retired portrait cards, these coins start on the physical dice,
// move at a readable speed and have a short, non-damaging release grace period.
export const DICE_ROULETTE=Object.freeze({
 spin:1.85,interval:.54,speed:8.2,life:7.5,radius:1.25,
 damage:22,armTime:.4,postRelease:.5,
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hitSegment=(p,a,b,r)=>{
 const x=b.x-a.x,z=b.z-a.z,d=x*x+z*z;
 const t=d?clamp(((p.x-a.x)*x+(p.z-a.z)*z)/d,0,1):0;
 return Math.hypot(p.x-a.x-x*t,p.z-a.z-z*t)<=r;
};
export function rouletteFiringAngle(s,i){
 const spread=s.kind==='jackpot'?.34:.19;
 // The centre remains deliberately clear during jackpot: two symmetric banks.
 const center=(i-(s.count-1)/2)*spread;
 return s.aim+center+(s.kind==='jackpot'?(center<0?-.1:.1):0);
}
export function beginDiceRoulette(g,kind='count'){
 if(!g||g.status!=='playing'||g.dice.giant||!['count','jackpot'].includes(kind))return false;
 const d=g.dice,turn=d.rouletteTurn||0,count=kind==='count'?2+turn%5:4+turn%3;
 d.rouletteTurn=turn+1;
 const origin={x:d.pose.x,z:d.pose.z},aim=Math.atan2(g.player.x-origin.x,g.player.z-origin.z);
 d.roulette={kind,count,aim,origin,stage:'spin',t:0,released:0};
 d.rouletteShots||=[];
 d.state='roulette-spin';d.t=0;d.telegraph=null;d.pendingPattern=false;
 g.events.push({type:'dice-roulette-spin',kind,count,duration:DICE_ROULETTE.spin});
 return true;
}
export function clearDiceRoulette(g){
 if(!g?.dice)return;
 g.dice.roulette=null;
 if(g.dice.rouletteShots)g.dice.rouletteShots.length=0;
}
function release(g,s,i){
 const yaw=rouletteFiringAngle(s,i),x=s.origin.x+Math.sin(yaw)*8,
   z=s.origin.z+Math.cos(yaw)*8;
 const shot={x,z,yaw,vx:Math.sin(yaw)*DICE_ROULETTE.speed,
   vz:Math.cos(yaw)*DICE_ROULETTE.speed,age:0,life:DICE_ROULETTE.life,
   radius:DICE_ROULETTE.radius,damage:s.kind==='jackpot'?25:DICE_ROULETTE.damage,
   kind:s.kind,id:(g.nextId=(g.nextId||0)+1)};
 g.dice.rouletteShots.push(shot);
 g.events.push({type:'dice-roulette-release',kind:s.kind,index:i,count:s.count,x,z,yaw});
}
export function stepDiceRoulette(g,dt,frozen=false){
 const d=g.dice;
 if(g.status!=='playing'||d.giant){clearDiceRoulette(g);return;}
 if(frozen)return;
 const s=d.roulette;
 if(s){
  s.t+=dt;
  if(s.stage==='spin'&&s.t>=DICE_ROULETTE.spin){
   s.stage='throw';d.state='roulette-throw';
   g.events.push({type:'dice-roulette-result',kind:s.kind,count:s.count});
  }
  while(s.stage==='throw'&&s.released<s.count&&
       s.t>=DICE_ROULETTE.spin+s.released*DICE_ROULETTE.interval){
   release(g,s,s.released++);
  }
  if(s.released===s.count&&
     s.t>=DICE_ROULETTE.spin+(s.count-1)*DICE_ROULETTE.interval+DICE_ROULETTE.postRelease){
   d.roulette=null;d.state='recovery';d.t=0;d.longRecovery=true;
  }
 }
 for(let i=d.rouletteShots.length-1;i>=0;i--){
  const shot=d.rouletteShots[i],from={x:shot.x,z:shot.z};
  shot.age+=dt;shot.life-=dt;shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;
  if(shot.age>=DICE_ROULETTE.armTime&&hitSegment(g.player,from,shot,shot.radius)){
   if(!diceInvulnerable(g.player)&&!(g.player.invuln>0)){
    const amount=Math.min(g.player.hp,shot.damage);g.player.hp-=amount;
    g.player.invuln=.55;applyBossHitTrait(g,amount,{boss:'dice'});
    g.events.push({type:'player-hit',source:'dice-roulette',amount});
    if(g.player.hp<=0){g.status='lost';g.deathCause='dice-roulette';clearDiceRoulette(g);g.events.push({type:'death'});return;}
   }
   // A successful roll always consumes the coin; it cannot turn around and hit again.
   d.rouletteShots.splice(i,1);
  }else if(shot.life<=0||Math.hypot(shot.x,shot.z)>93)d.rouletteShots.splice(i,1);
 }
}
