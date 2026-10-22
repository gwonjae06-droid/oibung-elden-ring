import {rolling} from './combat.mjs';
// Roll protection applies to ordinary damage only; crush paths must bypass this helper.
export function diceInvulnerable(player){return player.invuln>0||rolling(player);}
