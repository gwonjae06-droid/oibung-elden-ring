import {BOSS_HIT_TRAITS} from './boss-hit-traits.mjs';
import {tickSkills} from './skills.mjs';

// Boss-specific movement and collision remain with each encounter.
export function tickPlayerResources(game, dt) {
  const player = game.player;
  const charges = player.skill.charges;
  tickSkills(player.skill, game.weapon, dt);
  if (game.weapon === 'bow' && player.skill.charges > charges) {
    game.events.push({type: 'skill-ready', flavor: 'bow'});
  }
  player.invuln = Math.max(0, player.invuln - dt);
  player.regen = Math.max(0, player.regen - dt);
  if (!player.regen && !player.action) player.stamina = Math.min(100, player.stamina + 30 * dt * (player.traits?.bleed>0?BOSS_HIT_TRAITS.bleedRegen:1));
}

export function completePlayerHeal(game, action) {
  if (action.kind !== 'heal' || action.done || action.t < .78) return false;
  action.done = true;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 65);
  game.events.push({type: 'healed'});
  return true;
}
