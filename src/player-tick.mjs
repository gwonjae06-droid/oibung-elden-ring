import {BOSS_HIT_TRAITS} from './boss-hit-traits.mjs';
import {tickSkills} from './skills.mjs';
import {weaponStats} from './weapon-stats.mjs';

// Boss-specific movement and collision remain with each encounter.
export function tickPlayerResources(game, dt) {
  const player = game.player;
  const before=player.skill.cooldown;
  tickSkills(player.skill,game.weapon,dt);
  if(before>0&&player.skill.cooldown<=0&&['hammer','bow'].includes(game.weapon))game.events.push({type:'skill-ready',flavor:game.weapon});
  player.invuln = Math.max(0, player.invuln - dt);
  player.regen = Math.max(0, player.regen - dt);
  if (!player.regen && !player.action) player.stamina = Math.min(100, player.stamina + 30 * dt * weaponStats(game.weapon).staminaRegen * (player.traits?.bleed>0?BOSS_HIT_TRAITS.bleedRegen:1));
}

export function completePlayerHeal(game, action) {
  if (action.kind !== 'heal' || action.done || action.t < .78) return false;
  action.done = true;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 65);
  game.events.push({type: 'healed'});
  return true;
}
