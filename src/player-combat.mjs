import {playerIncapacitated} from './boss-hit-traits.mjs';
import {evolutionCount} from './weapon-evolution.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createSkillState, consumeSkill, SKILLS} from './skills.mjs';
import {completePlayerHeal} from './player-tick.mjs';

export function createPlayerState({x = 0, z = 13, yaw = Math.PI} = {}) {
  return {
    x,
    z,
    yaw,
    hp: 120,
    maxHp: 120,
    stamina: 100,
    regen: 0,
    action: null,
    invuln: 0,
    potions: 3,
    skill: createSkillState(),
  };
}

export function spawnPlayerProjectiles(
  game,
  action,
  weapon,
  {basicLifetime = 1.7} = {},
) {
  const count = game.weapon === 'cards' ? 3+2*evolutionCount(game,'wide-deck') : game.weapon==='bow'&&!action.skill?1+evolutionCount(game,'twin-arrow'):1,
    skill = Boolean(action.skill);
  for (let i = 0; i < count; i++) {
    game.projectiles.push({
      id: game.nextId++,
      x: game.player.x,
      z: game.player.z,
      y: 1.2,
      yaw: action.yaw + (i - (count - 1) / 2) * 0.075,
      speed: skill ? 36 : game.weapon === 'bow' ? 26+10*evolutionCount(game,'piercing-arrow') : 20,
      life: skill ? 2 : basicLifetime,
      damage: weapon.damage * action.mult*(game.weapon==='bow'&&!skill?1+.3*evolutionCount(game,'piercing-arrow'):1),
      poise: weapon.poise * (skill ? 2 : 1),
      kind: game.weapon,
      source: action,
      piercing: skill||(game.weapon==='bow'&&evolutionCount(game,'piercing-arrow')>0),
      bossHit: false,
      hit: false,
      skill,
    });
  }
  game.events.push({type: 'shot'});
}

// Collision and movement belong to the encounter; action timing belongs to the player.
export function tickPlayerAction(
  game,
  dt,
  weapon,
  {roll = () => {}, melee = () => {}, basicLifetime = 1.7} = {},
) {
  const action = game.player.action;
  if (!action||playerIncapacitated(game.player)) return;
  action.t += dt;
  if (action.kind === 'roll') roll(action);
  else if (action.kind === 'heal') completePlayerHeal(game, action);
  else if (action.kind === 'attack' || action.kind === 'skill') {
    if (action.t >= action.wind && !action.done) {
      action.done = true;
      game.events.push({type: 'swing'});
      if (weapon.projectile)spawnPlayerProjectiles(game, action, weapon, {basicLifetime});
      else if(action.basic){const rank=evolutionCount(game,game.weapon==='sword'?'blade-wave':'earth-wave');if(rank){spawnPlayerProjectiles(game,action,{...weapon,damage:weapon.damage*.6*rank},{basicLifetime:1.3});const q=game.projectiles.at(-1);q.kind='wave';q.speed=24;q.y=game.weapon==='hammer'?.25:1.2;}}
    }
    if (
      !weapon.projectile &&
      !action.hit &&
      action.t >= action.wind &&
      action.t <= action.wind + action.active
    )
      melee(action);
  }
  if (action.t >= action.total && game.player.action === action)
    game.player.action = null;
}

export function advancePlayerProjectile(projectile, dt) {
  const previous = {x: projectile.x, y: projectile.y, z: projectile.z};
  projectile.x += Math.sin(projectile.yaw) * projectile.speed * dt;
  projectile.z += Math.cos(projectile.yaw) * projectile.speed * dt;
  projectile.life -= dt;
  return previous;
}

// Called only after the encounter accepts a hit and computes the actual damage.
export function rewardPlayerHit(game, damage, action, {canStun, stun} = {}) {
  if (damage <= 0) return;
  const drain=action.basic?(evolutionCount(game,'blood-hammer')*.12+evolutionCount(game,'blood-deck')*.08):0;
  if(drain){const gain=Math.min(game.player.maxHp-game.player.hp,damage*drain);game.player.hp+=gain;if(gain>0)game.events.push({type:'skill-heal',flavor:game.weapon,amount:gain});}
  const skill = game.player.skill;
  if (action.basic && game.weapon === 'hammer' && !action.credited) {
    action.credited = true;
    skill.hammerHits = Math.min(SKILLS.hammer.hits, skill.hammerHits + 1);
    if (skill.hammerHits === SKILLS.hammer.hits)
      game.events.push({type: 'skill-ready', flavor: 'hammer'});
  }
  if (action.stun && !action.stunUsed && canStun) {
    action.stunUsed = true;
    stun(SKILLS.cards.stun);
    game.events.push({type: 'skill-stun', flavor: 'yellow'});
  }
  if (action.skill && game.weapon === 'hammer') {
    const gain = Math.min(
      game.player.maxHp - game.player.hp,
      damage * SKILLS.hammer.heal,
    );
    game.player.hp += gain;
    game.events.push({type: 'skill-heal', flavor: 'hammer', amount: gain});
  }
}

const emit = (game, type, data = {}) => game.events.push({type, ...data});
export function actPlayer(game, type) {
  const player = game.player,
    weapon = WEAPONS[game.weapon],
    skill = player.skill;
  if(game.status!=='playing'||game.startGrace>0||playerIncapacitated(player))return false;
  if(type==='charge-release'&&player.action?.kind==='charging'){const held=player.action.t;player.action=null;const u=Math.min(1,Math.max(0,(held-.2)/.7)),cost=weapon.cost+10*u;if(player.stamina<cost)return false;player.stamina-=cost;player.regen=.85;player.action={kind:'attack',t:0,total:.68,wind:.1,active:.18,yaw:player.yaw,done:false,hit:false,basic:true,mult:1+(2+.5*Math.max(0,evolutionCount(game,'charged-blade')-1))*u,charged:u>0};emit(game,'attack-start');return true;}
  if(type==='roll'&&player.action?.kind==='charging')player.action=null;
  if (
    game.status !== 'playing' ||
    player.action ||
    game.boss.state === 'transition'
  )
    return false;
  if(type==='charge-start'&&evolutionCount(game,'charged-blade')){player.action={kind:'charging',t:0,yaw:player.yaw};return true;}
  if (type === 'heal') {
    if (!player.potions || player.hp >= player.maxHp) return false;
    player.potions--;
    player.action = {kind: 'heal', t: 0, total: 1.05, done: false};
    emit(game, 'heal-start');
    return true;
  }
  if (type === 'roll') {
    const cost=game.journey?.rollCost??25;
    if (player.stamina < cost) return false;
    player.stamina -= cost;
    player.regen = 0.85;
    player.action = {kind: 'roll', t: 0, total: 0.52, yaw: player.yaw};
    emit(game, 'roll');
    return true;
  }
  if (type === 'skill') {
    const flavor = consumeSkill(skill, game.weapon);
    if (!flavor) return false;
    emit(game, 'skill-cast', {flavor});
    if (game.weapon === 'hammer' || game.weapon === 'bow') {
      const hammer = game.weapon === 'hammer';
      player.action = {
        kind: 'skill',
        t: 0,
        wind: hammer ? 0.5 : 0.3,
        active: 0.12,
        total: hammer ? 0.95 : 0.65,
        yaw: player.yaw,
        done: false,
        hit: false,
        basic: false,
        mult: hammer ? SKILLS.hammer.multiplier : SKILLS.bow.multiplier,
        skill: true,
      };
    }
    return true;
  }
  const attackCost=weapon.cost+(game.journey?.cost??0);
  if (type !== 'light' || player.stamina < attackCost) return false;
  player.stamina -= attackCost;
  player.regen = 0.85;
  const rate = (skill.haste > 0 ? SKILLS.sword.rate : 1)/(game.journey?.speed??1);
  const wind = weapon.wind / rate,
    active = weapon.active / rate,
    end = weapon.end / rate;
  player.action = {
    kind: 'attack',
    t: 0,
    total: wind + active + end,
    wind,
    active,
    yaw: player.yaw,
    done: false,
    hit: false,
    basic: true,
    mult: (skill.nextRed ? SKILLS.cards.redDamage : 1)*(game.journey?.damage??1),
    stun: skill.nextYellow,
    stunUsed: false,
    credited: false,
  };
  skill.nextRed = false;
  skill.nextYellow = false;
  emit(game, 'attack-start');
  return true;
}
