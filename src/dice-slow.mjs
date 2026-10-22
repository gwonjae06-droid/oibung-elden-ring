export const DICE_SLOW=Object.freeze({factor:.6,duration:1.5});
export function applyDiceSlow(player){
 const old=player.slow;
 player.slow={factor:Math.min(old?.t>0?old.factor:1,DICE_SLOW.factor),t:Math.max(old?.t>0?old.t:0,DICE_SLOW.duration)};
}
export function diceSlowFactor(player){return player.slow?.t>0?player.slow.factor:1;}
export function stepDiceSlow(player,dt){if(player.slow){player.slow.t=Math.max(0,player.slow.t-dt);if(player.slow.t===0)player.slow=null;}}
export function clearDiceFaceAttack(g){g.dice.groundSpikes=null;g.dice.spikeCooldown=0;g.dice.nextFaceAttack='portrait';g.dice.chainOrdinal=0;g.player.slow=null;}
