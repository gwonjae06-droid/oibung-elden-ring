import {noteSkillHit} from './skill-telemetry.mjs';
import {rewardPlayerHit} from './player-combat.mjs';
// The one place that settles a player weapon hit AFTER the boss has accepted the damage:
// it counts the hit once and then pays the rewards (life steal, hammer charge, stun).
// Boss-specific rules (weak faces, phase factors, poise, hit-stop) stay in each boss; they only decide how much damage landed.
// countStats=false is for engines that already count hits inside their own damage function.
export function settlePlayerHit(g,damage,action,{canStun,stun,countStats=true}={}){
 if(!Number.isFinite(damage)||damage<=0)return 0;
 if(countStats&&g.stats){g.stats.hits++;g.stats.damage+=damage;}
 noteSkillHit(g,action);
 rewardPlayerHit(g,damage,action,{canStun,stun});
 return damage;
}
