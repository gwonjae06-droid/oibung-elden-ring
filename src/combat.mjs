import {applyBossHitTrait,tickBossHitTraits,playerIncapacitated} from './boss-hit-traits.mjs';
import {WEAPONS as PLAYER_WEAPONS} from './weapon-data.mjs';
import {
  actPlayer,
  createPlayerState,
  tickPlayerAction,
  advancePlayerProjectile,
} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {damageArenaBoss as bossDamage} from './arena-damage.mjs';
import {KWON_WAVE,nextKwonWaveVariant} from './kwon-wave-data.mjs';
import {kwonHurtShapes,kwonHurtContact,kwonProjectileContact} from './kwon-hurtbox.mjs';
import {currentCard, skillReady, SKILLS, STANDARD_COOLDOWN} from './skills.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {registerEncounter} from './encounter-state.mjs';
export const TAU = Math.PI * 2;
export const TEMPO = 1;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDelta = (a, b) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const BOSS_SCALE = 1.4;
export const CINEMATIC = 5.2;
export const HUG_RANGE = 3.3;
export const HUG_TIME = 2.2;
export const WEAPONS = PLAYER_WEAPONS;
export const PATTERNS = {
  sweep: {
    name: '왕검 횡단',
    wind: 0.48,
    active: 0.22,
    recover: 0.95,
    damage: 25,
  },
  reverse: {
    name: '역린 참격',
    wind: 0.24,
    active: 0.22,
    recover: 1.05,
    damage: 28,
  },
  thrust: {
    name: '왕의 관통',
    wind: 1.05,
    active: 0.2,
    recover: 1.3,
    damage: 42,
  },
  slam: {name: '천추 처형', wind: 1.0, active: 0.3, recover: 1.4, damage: 45},
  cross: {
    name: '붉은 사선',
    wind: 0.55,
    active: 0.25,
    recover: 1.0,
    damage: 28,
  },
  leap: {name: '군림 낙하', wind: 0.8, active: 0.6, recover: 1.4, damage: 43},
  whirl: {
    name: '패왕 회천',
    wind: 0.85,
    active: 0.72,
    recover: 1.3,
    damage: 36,
  },
  rise: {name: '승천 검격', wind: 0.46, active: 0.3, recover: 1.15, damage: 36},
  jab: {name: '연화 검격', wind: 0.28, active: 0.18, recover: 1.0, damage: 18},
  rush: {name: '무영 발도', wind: 0.55, active: 0.3, recover: 1.0, damage: 32},
  retreat: {
    name: '납도 — 정적',
    wind: 0.24,
    active: 0.32,
    recover: 0.9,
    damage: 0,
  },
  wave: {name: '월광 파', wind: 1.05, active: 0.42, recover: 1.0, damage: 27},
  stomp: {name: '지축 강타', wind: 0.7, active: 0.26, recover: 1.0, damage: 26},
  backsweep: {
    name: '배후 후려치기',
    wind: 0.7,
    active: 0.24,
    recover: 1.0,
    damage: 28,
  },
  shove: {name: '압살 밀치기', wind: 0.5, active: 0.2, recover: 1.2, damage: 0},
};
export const ORDER = {
  1: [
    'rush',
    'sweep',
    'thrust',
    'leap',
    'stomp',
    'hunt',
    'siege',
    'feint',
    'skewer',
  ],
  2: [
    'draw',
    'flurry',
    'execution',
    'crescent',
    'tempest',
    'counter',
    'trample',
    'royalHunt',
    'requiem',
    'afterimage',
    'widow',
  ],
};
export const CLOSE = {
  1: ['shove', 'sweep', 'stomp', 'shove', 'backsweep', 'hunt', 'skewer'],
  2: [
    'breaker',
    'counter',
    'trample',
    'breaker',
    'tempest',
    'maelstrom',
    'royalHunt',
  ],
};
export const SEQUENCES = {
  draw: ['retreat', 'rush', 'reverse'],
  flurry: ['cross', 'reverse', 'jab', 'jab', 'rise'],
  execution: ['thrust', 'slam'],
  crescent: ['wave', 'wave', 'rush'],
  tempest: ['whirl', 'cross', 'slam'],
  counter: ['retreat', 'rise', 'thrust'],
  trample: ['stomp', 'backsweep', 'slam'],
  breaker: ['shove'],
  shove: ['shove'],
  maelstrom: ['backsweep', 'whirl', 'stomp'],
  royalHunt: ['retreat', 'rush', 'cross', 'thrust'],
  requiem: ['wave', 'rush', 'slam'],
  afterimage: ['rush', 'retreat', 'rise'],
  widow: ['leap', 'jab', 'slam'],
};
export const PHASE_ONE = {
  rush: ['rush'],
  sweep: ['sweep', 'reverse'],
  thrust: ['thrust'],
  leap: ['leap'],
  stomp: ['stomp'],
  backsweep: ['backsweep', 'reverse'],
  shove: ['shove'],
  hunt: ['rush', 'sweep', 'reverse'],
  siege: ['leap', 'stomp'],
  feint: ['retreat', 'rush'],
  skewer: ['jab', 'sweep'],
};
export const SWORD = {x: 0, y: 2.3, z: 2.8, length: 8.55, width: 0.78};
// Legacy bounding-radius helper. Precise damage uses the transformed anatomy below.
export const kwonBodyHitRadius=b=>b?.phase===2?3.45:3.05;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
  toward = (a, b) => Math.atan2(b.x - a.x, b.z - a.z),
  mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  },
  emit = (g, type, data = {}) => g.events.push({type, ...data});
const freeze = (g, t) => {
  g.hitstop = Math.max(g.hitstop || 0, t);
};
function confine(p) {
  const r = Math.hypot(p.x, p.z);
  if (r > 23) {
    p.x *= 23 / r;
    p.z *= 23 / r;
  }
}
export function segmentDistance(p, a, b) {
  const x = b.x - a.x,
    z = b.z - a.z,
    d = x * x + z * z,
    t = d ? clamp(((p.x - a.x) * x + (p.z - a.z) * z) / d, 0, 1) : 0;
  return Math.hypot(p.x - a.x - x * t, p.z - a.z - z * t);
}
export function cinematicPose(b) {
  const t = b.phase === 2 ? (b.state === 'transition' ? b.t : CINEMATIC) : 0;
  return {
    standing: ease(t / 1.8),
    reach: ease((t - 1.8) / 1.1),
    detach: ease((t - 2.9) / 0.9),
    equip: ease((t - 3.8) / 1.4),
    time: t,
  };
}
export function bodyPose(b) {
  const s = cinematicPose(b).standing,
    air =
      b.pattern === 'leap' &&
      b.state === 'active' &&
      b.t < PATTERNS.leap.active * 0.7
        ? Math.sin((Math.PI * b.t) / (PATTERNS.leap.active * 0.7)) * 2.6
        : 0;
  return {standing: s, angle: -0.9 * s, pivotY: 1.5, pivotZ: -1.5, lift: air};
}
export function kwonVisibleHurtShapes(b){
 const pose=bodyPose(b),cinema=cinematicPose(b);
 return kwonHurtShapes(b,{point:p=>bodyPoint(b,p),angle:pose.angle,scale:BOSS_SCALE,headAttached:cinema.detach<.5});
}
export function bodyPoint(b, p) {
  const q = bodyPose(b),
    c = Math.cos(q.angle),
    s = Math.sin(q.angle),
    y = p.y - 1.5,
    z = p.z + 1.5;
  return {
    x: p.x * BOSS_SCALE,
    y: (1.5 + y * c - z * s + q.lift) * BOSS_SCALE,
    z: (-1.5 + y * s + z * c) * BOSS_SCALE,
  };
}
export function patternConfig(b) {
  const c = PATTERNS[b.pattern];
  if (b.phase !== 2) return {...c, damage: c.damage > 0 ? c.damage + 3 : 0};
  const wind = {
    rush: 0.38,
    jab: 0.19,
    cross: 0.32,
    reverse: 0.2,
    slam: 1.12,
    thrust: 0.7,
    whirl: 0.68,
    rise: 0.3,
    retreat: 0.52,
    wave: 1.12,
    leap: 0.8,
    sweep: 0.3,
    stomp: 0.6,
    backsweep: 0.6,
    shove: 0.5,
  }[b.pattern];
  return {
    ...c,
    wind,
    damage: c.damage > 0 ? c.damage + (b.pattern === 'jab' ? 6 : 10) : 0,
    recover:
      {
        slam: 1.05,
        thrust: 0.85,
        whirl: 0.9,
        rise: 0.8,
        reverse: 0.8,
        rush: 0.8,
        shove: 1.2,
      }[b.pattern] || 0.8,
  };
}
export function attackZone(b) {
  if (!['windup', 'active'].includes(b.state)) return null;
  const cfg = patternConfig(b),
    progress = b.state === 'windup' ? clamp(b.t / cfg.wind, 0, 1) : 1,
    active = b.state === 'active',
    base = {kind: 'danger', shape: 'circle', x: b.x, z: b.z, progress, active};
  if (b.pattern === 'stomp') return {...base, r: 6.5};
  if (b.pattern === 'shove') return {...base, kind: 'push', r: 4.8};
  if (b.pattern === 'backsweep')
    return {
      ...base,
      shape: 'cone',
      r: 8,
      yaw: b.yaw + Math.PI,
      half: Math.PI - 1.2,
    };
  if (['slam', 'leap'].includes(b.pattern) && b.zone)
    return {
      ...base,
      x: b.zone.x,
      z: b.zone.z,
      r: b.pattern === 'leap' ? 5.2 : 3.2,
    };
  return null;
}
export function inZone(z, p) {
  return (
    Math.hypot(p.x - z.x, p.z - z.z) < z.r &&
    (z.shape === 'circle' || Math.abs(angleDelta(z.yaw, toward(z, p))) < z.half)
  );
}
export function createGame(weapon = 'sword', {register = true} = {}) {
  if (!WEAPONS[weapon]) throw new Error('Unknown weapon');
  const game = {
    status: 'playing',
    time: 0,
    hitstop: 0,
    weapon,
    events: [],
    projectiles: [],
    bossShots: [],
    nextId: 0,
    player: createPlayerState(),
    boss: {
      x: 0,
      z: -4,
      yaw: 0,
      hp: 2100,
      maxHp: 2100,
      phase: 1,
      state: 'idle',
      t: 0,
      wait: 0.8,
      pattern: 'sweep',
      sequence: 0,
      attackId: 0,
      hit: false,
      poise: 0,
      combo: false,
      chain: 0,
      speed: 1,
      queue: [],
      lastOpening: null,
      recovery: 0,
      punishable: false,
      leapSpeed: 0,
      aim: 0,
      pressure: 0,
      stun: 0,
      hug: 0,
      from: null,
      zone: null,
      turnTarget: 0,
    },
    stats: {hits: 0, dodges: 0, damage: 0},
  };
  return register ? registerEncounter(game) : game;
}
export function act(g, type) {
  return actPlayer(g, type);
}
export function rolling(p) {
  return p.action?.kind === 'roll' && p.action.t >= 0.075 && p.action.t <= 0.35;
}
function poseParams(pattern, stand, carry, cut) {
  let ly = 0,
    ey = 0,
    lp = carry,
    ep = cut,
    back = 0;
  switch (pattern) {
    case 'sweep':
      ly = 1.3;
      ey = -1.3;
      lp = cut;
      break;
    case 'reverse':
      ly = -1.35;
      ey = 1.35;
      lp = cut;
      break;
    case 'cross':
      ly = 1.15;
      ey = -1.2;
      lp = -0.75;
      ep = 0.85;
      break;
    case 'thrust':
    case 'jab':
      lp = ep = mix(0.18, 0.68, stand);
      back = pattern === 'jab' ? 1 : 1.4;
      break;
    case 'slam':
      lp = -1.15;
      ep = mix(0.4, 1.03, stand);
      break;
    case 'stomp':
      lp = -1.2;
      ep = mix(0.5, 1.05, stand);
      break;
    case 'backsweep':
      ly = -1.5;
      ey = 1.5;
      lp = ep = cut;
      break;
    case 'shove':
      lp = ep = mix(0.3, 0.6, stand);
      back = 0.9;
      break;
    case 'leap':
      lp = -1;
      ep = 0.45;
      break;
    case 'whirl':
      ly = ey = 1.32;
      lp = ep = cut;
      break;
    case 'rise':
      lp = 1.05;
      ep = -0.8;
      ey = 0.3;
      break;
    case 'rush':
      ly = 1.5;
      ey = -1.45;
      lp = cut;
      break;
    case 'retreat':
      ly = ey = -1.25;
      lp = ep = 0.15;
      break;
    case 'wave':
      // Hold the blade above the head before a forceful vertical cut.
      lp = -1.4;
      ep = 1.18;
      break;
  }
  return {ly, ey, lp, ep, back};
}
function endPose(b) {
  const stand = cinematicPose(b).standing,
    P = poseParams(
      b.pattern,
      stand,
      mix(0.25, -0.6, stand),
      mix(0.25, 0.72, stand),
    );
  return {yaw: P.ey, pitch: P.ep, offset: P.back * 0.7};
}
export function startPattern(g, name) {
  if (!PATTERNS[name]) throw new Error('Unknown pattern');
  const b = g.boss;
  b.from = b.state === 'recovery' ? endPose(b) : null;
  b.state = 'windup';
  b.pattern = name;
  b.t = 0;
  b.hit = false;
  b.waveFired = false;
  if(name==='wave')b.waveVariant=nextKwonWaveVariant(b.waveVariant);
  b.attackId++;
  b.punishable = false;
  b.turnTarget = toward(b, g.player) + (name === 'backsweep' ? Math.PI : 0);
  b.aim = b.yaw;
  b.zone = ['slam', 'leap'].includes(name)
    ? {x: g.player.x, z: g.player.z}
    : null;
  emit(g, 'telegraph', {name: PATTERNS[name].name});
}
export function beginSequence(g, opening) {
  const b = g.boss,
    map = b.phase === 1 ? PHASE_ONE : SEQUENCES;
  if (!map[opening]) throw new Error('Opening not in phase');
  b.queue = map[opening].slice(1);
  b.lastOpening = opening;
  startPattern(g, map[opening][0]);
}
export function chooseOpening(g) {
  const b = g.boss,
    d = dist(b, g.player);
  let list;
  if (b.phase === 1)
    list =
      g.player.action?.kind === 'heal'
        ? ['thrust', 'hunt']
        : d > 13
          ? ['thrust', 'leap', 'siege']
          : d < 5
            ? CLOSE[1]
            : ORDER[1];
  else if (g.player.action?.kind === 'heal') list = ['royalHunt', 'execution'];
  else
    list =
      d > 13
        ? ['crescent', 'draw', 'execution', 'requiem']
        : d < 5
          ? CLOSE[2]
          : ORDER[2];
  const i = b.sequence++;
  let pick = list[i % list.length];
  if (pick === b.lastOpening && list.length > 1)
    pick = list[(i + 1) % list.length];
  return pick;
}
export function swordPose(b) {
  const cfg = patternConfig(b),
    q = cinematicPose(b),
    stand = q.standing,
    carry = mix(0.25, -0.6, stand),
    cut = mix(0.25, 0.72, stand),
    {ly, ey, lp, ep, back} = poseParams(b.pattern, stand, carry, cut),
    from = b.from || {yaw: 0, pitch: carry, offset: 0};
  let yaw = 0,
    pitch = carry,
    offset = 0;
  if (b.state === 'windup') {
    // First raise the blade, then hold it overhead for a readable anticipation.
    const t = ease(b.pattern === 'wave' ? Math.min(1,b.t/(cfg.wind*.6)) : b.t/cfg.wind);
    yaw = mix(from.yaw, ly, t);
    pitch = mix(from.pitch, lp, t);
    offset = mix(from.offset, -back, t);
  } else if (b.state === 'active') {
    const t = ease(b.t / cfg.active);
    yaw = mix(ly, ey, t);
    pitch = mix(lp, ep, t);
    offset = mix(-back, back * 0.7, t);
  } else if (b.state === 'recovery') {
    if (b.queue && b.queue.length) {
      yaw = ey;
      pitch = ep;
      offset = back * 0.7;
    } else {
      const t = ease(b.t / Math.max(0.01, b.recovery || cfg.recover));
      yaw = mix(ey, 0, t);
      pitch = mix(ep, carry, t);
      offset = mix(back * 0.7, 0, t);
    }
  }
  const neck = bodyPoint(b, SWORD),
    grip = {x: 0.4, y: 5.2, z: 2.4},
    equip = q.detach,
    root = {
      x: mix(neck.x, grip.x, equip),
      y: mix(neck.y, grip.y, equip),
      z: mix(neck.z, grip.z, equip) + offset,
    };
  if (b.state === 'transition') {
    yaw = mix(0, -1.25, q.equip);
    pitch = mix(0.15, -0.6, q.equip);
  }
  return {...root, yaw, pitch, length: SWORD.length};
}
export function swordSegment(b) {
  const p = swordPose(b),
    c = Math.cos(b.yaw),
    s = Math.sin(b.yaw),
    a = {x: b.x + p.x * c + p.z * s, y: p.y, z: b.z - p.x * s + p.z * c},
    yaw = b.yaw + p.yaw,
    len = SWORD.length * Math.cos(p.pitch);
  return {
    a,
    b: {
      x: a.x + Math.sin(yaw) * len,
      y: a.y - Math.sin(p.pitch) * SWORD.length,
      z: a.z + Math.cos(yaw) * len,
    },
  };
}
export function handPoint(b, side) {
  const p = swordPose(b),
    x = side * 0.35,
    z = -0.35,
    cy = Math.cos(p.yaw),
    sy = Math.sin(p.yaw),
    cp = Math.cos(p.pitch),
    sp = Math.sin(p.pitch);
  return {
    x: p.x + x * cy + z * cp * sy,
    y: p.y - z * sp,
    z: p.z - x * sy + z * cp * cy,
  };
}
export function bladeHits(p, {a, b}, width = SWORD.width) {
  const dy = b.y - a.y;
  let lo = 0,
    hi = 1;
  if (Math.abs(dy) < 1e-8) {
    if (a.y < 0.1 || a.y > 2.2) return false;
  } else {
    const t0 = (0.1 - a.y) / dy,
      t1 = (2.2 - a.y) / dy;
    lo = Math.max(0, Math.min(t0, t1));
    hi = Math.min(1, Math.max(t0, t1));
    if (lo > hi) return false;
  }
  const at = (t) => ({x: mix(a.x, b.x, t), z: mix(a.z, b.z, t)});
  return segmentDistance(p, at(lo), at(hi)) < width;
}
function landHit(g, amount, poise, a,point=null) {
  const actual = bossDamage(g, amount, poise,{point}),
    b = g.boss;
  // bossDamage already counted the hit (with poise and hit-stop), so only the rewards are settled here.
  settlePlayerHit(g, actual, a, {
    canStun: b.hp > 0 && b.state !== 'transition',
    stun: (duration) => {
      b.stun = duration;
    },
    countStats: false,
  });
}
function hurtPlayer(g, damage,cut=true) {
  const p = g.player;
  if (g.status !== 'playing' || p.invuln > 0 || g.boss.state === 'transition')
    return;
  if (rolling(p)) {
    g.stats.dodges++;
    emit(g, 'dodge');
    return;
  }
  const before=p.hp;p.hp = Math.max(0, p.hp - damage);
  p.invuln = 0.32;
  p.action = {kind: 'hurt', t: 0, total: 0.22};
  applyBossHitTrait(g,before-p.hp,{cut});emit(g, 'player-hit', {amount: damage});
  freeze(g, 0.07);
  if (!p.hp) {
    g.status = 'lost';
    g.bossShots = [];
    emit(g, 'death');
  }
}
function moveBoss(b, v, dt, side = 0) {
  const y = b.aim ?? b.yaw;
  b.x += (Math.sin(y) * v + Math.cos(y) * side) * dt;
  b.z += (Math.cos(y) * v - Math.sin(y) * side) * dt;
  confine(b);
}
export function step(g, dt, input = {}) {
  if (g.status !== 'playing') return;
  dt = clamp(dt, 0, 1 / 30);
  if (g.hitstop > 0) {
    g.hitstop = Math.max(0, g.hitstop - dt);
    return;
  }
  g.time += dt;
  const p = g.player,
    b = g.boss,
    w = WEAPONS[g.weapon];
  if (b.state === 'transition') {
    b.t += dt;
    if (b.t >= CINEMATIC) {
      b.state = 'idle';
      b.t = 0;
      b.wait = 0.55;
      emit(g, 'armed');
    }
    return;
  }
  tickBossHitTraits(g,dt);if(g.status!=='playing')return;tickPlayerResources(g, dt);
  const mx = input.x || 0,
    mz = input.z || 0,
    mag = Math.hypot(mx, mz),
    speed = p.skill.blue > 0 ? 4.7 * SKILLS.cards.blueSpeed : 4.7;
  if (!p.action && mag&&!playerIncapacitated(p)) {
    p.x += (mx / Math.max(1, mag)) * speed * dt;
    p.z += (mz / Math.max(1, mag)) * speed * dt;
  }
  if (!p.action) {
    if (input.lock) p.yaw = toward(p, b);
    else if (mag) p.yaw = Math.atan2(mx, mz);
  }
  // Lock-on follows the boss during the attack's preparatory frames. The
  // previously frozen initial yaw let fast bosses escape an apparently aimed hit.
  const action=p.action;
  if(input.lock&&action&&['attack','skill'].includes(action.kind)&&!action.done&&action.t<action.wind){
    const desired=toward(p,b),delta=angleDelta(action.yaw,desired);
    action.yaw+=clamp(delta,-dt*11,dt*11);
    p.yaw=action.yaw;
  }
  tickPlayerAction(g, dt, w, {
    roll: (a) => {
      if (a.t <= dt * 1.1 && mag) a.yaw = Math.atan2(mx, mz);
      p.x += Math.sin(a.yaw) * 10 * dt;
      p.z += Math.cos(a.yaw) * 10 * dt;
    },
    melee: (a) => {
      const shapes=kwonVisibleHurtShapes(b),reach=a.skill?Math.max(6.8,w.range):w.range;
      const hit=kwonHurtContact(shapes,p,{reach,yaw:a.yaw});
      if(hit){
        a.hit=true;
        landHit(g,w.damage*a.mult,w.poise*(a.skill?2.5:1),a,hit);
      }
    },
  });
  confine(p);
  for (const q of g.projectiles) {
    const old = advancePlayerProjectile(q, dt);
    if (q.piercing && g.bossShots.length) {
      const n = g.bossShots.length;
      g.bossShots = g.bossShots.filter((s) => segmentDistance(s, old, q) > 1.8);
      if (g.bossShots.length < n) emit(g, 'skill-pierce', {flavor: 'bow'});
    }
    const hit=q.life>0&&!q.bossHit?kwonProjectileContact(kwonVisibleHurtShapes(b),old,q):null;
    if(hit){
      q.bossHit=true;
      if(!q.piercing)q.life=0;
      landHit(g,q.damage,q.poise,q.source,hit);
    }
  }
  g.projectiles = g.projectiles.filter((q) => q.life > 0);
  if (g.status !== 'playing' || b.state === 'transition') return;
  for (const q of g.bossShots) {
    const old = {x: q.x, z: q.z};
    q.x += Math.sin(q.yaw) * q.speed * dt;
    q.z += Math.cos(q.yaw) * q.speed * dt;
    q.age = (q.age||0) + dt;
    q.life -= dt;
    if (Math.hypot(q.x, q.z) > 27) q.life = 0;
    if (q.life > 0 && segmentDistance(p, old, q) < (q.radius ?? 0.9)) {
      q.life = 0;
      hurtPlayer(g, q.damage);
    }
  }
  g.bossShots = g.bossShots.filter((q) => q.life > 0);
  if (g.status !== 'playing') return;
  if (b.stun > 0) {
    b.stun = Math.max(0, b.stun - dt);
    return;
  }
  b.poise = Math.max(0, b.poise - dt * 5);
  b.t += dt;
  const cfg = patternConfig(b);
  if (b.state === 'stagger') {
    if (b.t >= (b.phase === 2 ? 1.3 : 2.1)) {
      b.state = 'idle';
      b.t = 0;
      b.wait = 0.35;
    }
    return;
  }
  b.hug = dist(p, b) < HUG_RANGE ? (b.hug || 0) + dt : 0;
  if (b.state === 'idle') {
    b.punishable = false;
    b.yaw += clamp(angleDelta(b.yaw, toward(b, p)), -dt * 2.7, dt * 2.7);
    b.aim = b.yaw;
    if (dist(p, b) > 8) moveBoss(b, b.phase === 1 ? 6.8 : 6.5, dt);
    if (b.hug > HUG_TIME) {
      b.hug = 0;
      beginSequence(g, 'shove');
    } else {
      b.wait -= dt;
      if (b.wait <= 0) beginSequence(g, chooseOpening(g));
    }
  } else if (b.state === 'windup') {
    if (b.pattern === 'rush' && b.t < 0.18)
      moveBoss(b, 0, dt, b.sequence % 2 ? 8 : -8);
    if (b.t < cfg.wind * (b.phase === 2 ? 0.68 : 0.55)) {
      const target =
          b.pattern === 'backsweep'
            ? b.turnTarget
            : b.zone
              ? toward(b, b.zone)
              : toward(b, p),
        rate = b.pattern === 'backsweep' ? 9 : 2.1;
      b.yaw += clamp(angleDelta(b.yaw, target), -dt * rate, dt * rate);
      b.aim = b.yaw;
    }
    if (b.t >= cfg.wind) {
      b.state = 'active';
      b.t = 0;
      emit(g, 'boss-swing');
      if (b.pattern === 'leap') {
        b.aim = toward(b, b.zone);
        b.yaw = b.aim;
        b.leapSpeed = dist(b, b.zone) / (cfg.active * 0.7);
      }
    }
  } else if (b.state === 'active') {
    // One broad vertical slash leaves the sword at the midpoint of its fall.
    if (b.pattern === 'wave' && !b.waveFired && b.t >= cfg.active*KWON_WAVE.releaseRatio) {
      b.waveFired = true;
      const x=b.x+Math.sin(b.yaw)*4,z=b.z+Math.cos(b.yaw)*4;
      g.bossShots.push({id:g.nextId++,kind:KWON_WAVE.kind,x,z,yaw:b.yaw,
        variant:b.waveVariant,radius:KWON_WAVE.radius,
        speed:b.phase===2?KWON_WAVE.speedSecond:KWON_WAVE.speedFirst,
        life:KWON_WAVE.lifetime,age:0,damage:cfg.damage});
      emit(g,'boss-shot',{x,z,kind:KWON_WAVE.kind,variant:b.waveVariant});
    }
    if (b.pattern === 'rush') moveBoss(b, b.phase === 2 ? 31 : 23, dt);
    else if (b.pattern === 'thrust') moveBoss(b, 19, dt);
    else if (b.pattern === 'jab') moveBoss(b, 10, dt);
    else if (b.pattern === 'retreat') moveBoss(b, -9, dt);
    else if (b.pattern === 'leap' && b.t < cfg.active * 0.7)
      moveBoss(b, b.leapSpeed, dt);
    else if (b.pattern === 'whirl') b.yaw += (TAU / cfg.active) * dt;
    const zone = attackZone(b);
    if (!b.hit && zone) {
      const ready =
        b.pattern === 'leap'
          ? b.t >= cfg.active * 0.7
          : b.pattern === 'slam'
            ? b.t >= cfg.active * 0.84
            : b.pattern === 'stomp'
              ? b.t >= cfg.active * 0.4
              : true;
      if (ready && inZone(zone, p)) {
        b.hit = true;
        if (zone.kind === 'push') {
          if (!rolling(p)) {
            const a = toward(b, p);
            p.x += Math.sin(a) * 3.5;
            p.z += Math.cos(a) * 3.5;
            confine(p);
            emit(g, 'shove');
          }
        } else hurtPlayer(g, cfg.damage,b.pattern!=='stomp');
      }
    } else if (
      !b.hit &&
      !zone &&
      !['wave', 'retreat'].includes(b.pattern) &&
      bladeHits(p, swordSegment(b))
    ) {
      b.hit = true;
      hurtPlayer(g, cfg.damage);
    }
    if (b.t >= cfg.active) {
      b.state = 'recovery';
      b.t = 0;
      b.punishable = b.queue.length === 0;
      b.recovery = b.punishable ? cfg.recover : 0.13;
      emit(g, b.punishable ? 'opening' : 'combo-gap');
    }
  } else if (b.state === 'recovery' && b.t >= b.recovery) {
    if (b.queue.length) startPattern(g, b.queue.shift());
    else {
      b.state = 'idle';
      b.t = 0;
      b.wait = b.phase === 2 ? 0.07 : 0.12;
      b.punishable = false;
      b.from = null;
    }
  }
  const d = dist(p, b);
  if (d < 3) {
    const a = d < 0.001 ? p.yaw : toward(b, p);
    p.x = b.x + Math.sin(a) * 3;
    p.z = b.z + Math.cos(a) * 3;
    confine(p);
  }
}
export function skillView(g) {
  const s = g.player.skill,
    w = g.weapon,
    ready = skillReady(s, w);
  let text = '',
    ratio = 1,
    card = '';
  if (w === 'sword') {
    ratio =
      s.haste > 0
        ? s.haste / SKILLS.sword.duration
        : ready
          ? 1
          : 1 - s.cooldown / STANDARD_COOLDOWN;
    text =
      s.haste > 0
        ? '공속 증가 ' + s.haste.toFixed(1) + '초'
        : ready
          ? '준비 완료'
          : '재사용 ' + s.cooldown.toFixed(1) + '초';
  } else if (w === 'hammer') {
    ratio = s.hammerHits / SKILLS.hammer.hits;
    text = ready
      ? '준비 완료'
      : s.hammerHits + ' / ' + SKILLS.hammer.hits + ' 적중';
  } else if (w === 'bow') {
    ratio =
      (s.charges + (s.charges < 3 ? s.recharge / STANDARD_COOLDOWN : 0)) / 3;
    text = '충전 ' + s.charges + ' / 3';
  } else {
    ratio = ready ? 1 : 1 - s.cooldown / STANDARD_COOLDOWN;
    card = ready ? currentCard(s) : '';
    text = ready
      ? '우클릭으로 카드 확정'
      : '재사용 ' + s.cooldown.toFixed(1) + '초';
    if (s.blue > 0) text = '이동 가속 ' + s.blue.toFixed(1) + '초';
    else if (s.nextRed) text = '다음 공격 피해 +50%';
    else if (s.nextYellow) text = '다음 적중 시 기절';
  }
  return {name: SKILLS[w].name, text, ratio: clamp(ratio, 0, 1), card, ready};
}
