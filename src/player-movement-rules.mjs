import {SKILLS} from './skills.mjs';
import {evolutionCount} from './weapon-evolution.mjs';

// Shared movement rules for compact Kwon/Clown/Blood arenas. The giant
// Dice arena deliberately keeps its existing large-map traversal pace.
export const PLAYER_WALK_SPEED=4.7;
export const PLAYER_ROLL_SPEED=10;
export function playerRollSpeed(game){const rank=game?.weapon==='bow'?evolutionCount(game,'piercing-arrow'):0;return PLAYER_ROLL_SPEED*(rank===2?1.35:rank===1?1.2:1);}
export const ROLL_DODGE_START=.075;
export const ROLL_DODGE_END=.35;
export function playerWalkSpeed(player,slowFactor=1){
 return PLAYER_WALK_SPEED*(player?.skill?.blue>0?(player.skill.blueMultiplier||SKILLS.cards.blueSpeed):1)*slowFactor;
}
export function playerRolling(player){
 const a=player?.action;
 return a?.kind==='roll'&&a.t>=ROLL_DODGE_START&&a.t<=ROLL_DODGE_END;
}
