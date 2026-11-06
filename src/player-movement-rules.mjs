import {weaponStats} from './weapon-stats.mjs';
// Shared combat movement. Bow dodge forge legacy removed in favour of fire.
export const PLAYER_WALK_SPEED=4.7;
export const PLAYER_ROLL_SPEED=10;
export function playerRollSpeed(game){return PLAYER_ROLL_SPEED*weaponStats(game?.weapon).rollDistance;}
export const ROLL_DODGE_START=.075;
export const ROLL_DODGE_END=.35;
export function playerWalkSpeed(player,slowFactor=1){return PLAYER_WALK_SPEED*weaponStats(player?.weapon).walkSpeed*slowFactor;}
export function playerRolling(player){const a=player?.action;return a?.kind==='roll'&&a.t>=ROLL_DODGE_START&&a.t<=ROLL_DODGE_END;}
