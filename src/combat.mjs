import {applyBossHitTrait,tickBossHitTraits,playerIncapacitated} from './boss-hit-traits.mjs';
import {kwonReadableWind} from './attack-readability.mjs';
import {BOSS_TEMPO} from './boss-tempo.mjs';
import {createBossAutonomy,stepBossAutonomy} from './boss-autonomy.mjs';
import {chooseKwonCloseDefense,KWON_CLOSE_DEFENSE} from './kwon-close-defense.mjs';
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
import {kwonHurtShapes,kwonMeleeContact,kwonProjectileContact,kwonPlayerSeparation} from './kwon-hurtbox.mjs';
import {clownHurtShapes,clownAimPart} from './boss-hit-regions.mjs';
// Legacy common active skills removed; only forge paths remain.
import {evolutionCount} from './weapon-evolution.mjs';
import {equippedPath,playerMeleeReach} from './weapon-abilities.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {playerWalkSpeed,playerRollSpeed,playerRolling} from './player-movement-rules.mjs';
import {playerIncomingDamage} from './weapon-stats.mjs';
import {registerEncounter} from './encounter-state.mjs';
import {createPatternShuffle,drawPatternShuffle} from './pattern-shuffle.mjs';
import {KWON_THIRD_PATTERNS,KWON_THIRD_COMBOS,KWON_THIRD_FAR,KWON_THIRD_CLOSE,
 kwonThirdTransition,makeKwonFractures,advanceKwonFractures} from './kwon-third-phase.mjs';
export const TAU = Math.PI * 2;
export const TEMPO = 1;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDelta = (a, b) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const BOSS_SCALE = 1.4;
export const CINEMATIC = 5.2;
export const HUG_RANGE = 3.3;
export const HUG_TIME = 1.5;
export const WEAPONS = PLAYER_WEAPONS;
export const PATTERNS = {
  ...KWON_THIRD_PATTERNS,
  // Signature skills retain the same readable windup/active/recovery contract.
  spiderPrison: {name:'거미의 봉쇄',wind:1.25,active:.52,recover:1.7,damage:26},
  graveSword: {name:'검의 묘비',wind:1.42,active:.42,recover:1.65,damage:38},
  livingSword: {name:'살아 있는 턱검',wind:1.12,active:.46,recover:1.48,damage:28},
  lastStance: {name:'왕의 최후 자세',wind:1.12,active:.66,recover:2.1,damage:34},
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
    'counterDancer',
    'skyJudge',
    'spiderPrison',
  ],
  3: Object.keys(KWON_THIRD_COMBOS),
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
    'falseExecution',
    'jawSnare',
    'doubleMoon',
    'windParry',
    'graveSword',
    'livingSword',
    'lastStance',
  ],
};
// Above this distance Kwon's response should be a visible travelling sword
// projectile or an actual gap-closing combo, not a stationary melee swing.
// The adaptive shuffle bag still deals every legal opening once per cycle.
export const KWON_RANGE_PRESSURE=Object.freeze({
 // Stay close enough to land the visible sword, not 6-8m away.
 farDistance:12,
 engageDistance:5.4,
 spacing:3.6,
 sideSpeed:1.25,
 chaseSpeed:Object.freeze({1:13.2,2:13.6,3:14.3}),
 approachSpeed:Object.freeze({1:11.6,2:12.2,3:12.9}),
 chaseWait:.78,
 openings:Object.freeze({
  1:Object.freeze(['spiderPrison','rush','hunt','leap','siege','skyJudge','feint']),
  2:Object.freeze(['graveSword','livingSword','crescent','requiem','doubleMoon','lastStance',
    'jawSnare','afterimage','widow','royalHunt','draw']),
   3:KWON_THIRD_FAR,
  })
});
export const CLOSE = {
  3:KWON_THIRD_CLOSE,
  1: ['shove', 'sweep', 'stomp', 'shove', 'backsweep', 'hunt', 'skewer', 'counterDancer', 'skyJudge'],
  2: [
    'breaker',
    'counter',
    'trample',
    'breaker',
    'tempest',
    'maelstrom',
    'royalHunt',
    'jawSnare',
    'windParry',
  ],
};
export const PHASE_THREE=KWON_THIRD_COMBOS;
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
  // Every new combination uses the original sword/torso motion channels.
  // Each constituent cut telegraphs, then resolves before the next begins.
  falseExecution: ['retreat', 'thrust', 'reverse', 'slam'],
  jawSnare: ['rush', 'backsweep', 'rise'],
  doubleMoon: ['wave', 'retreat', 'rush', 'slam'],
  windParry: ['jab', 'reverse', 'whirl'],
  graveSword: ['graveSword','slam'],
  livingSword: ['livingSword','rush'],
  lastStance: ['lastStance','reverse','cross','slam'],
};
export const PHASE_ONE = {
  spiderPrison: ['spiderPrison','backsweep'],
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
  counterDancer: ['retreat', 'jab', 'backsweep'],
  skyJudge: ['leap', 'stomp', 'reverse'],
};
export const SWORD = {x: 0, y: 2.3, z: 2.8, length: 8.55, width: 0.78};
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
  // Possession keeps the head detached; it has its own cinematic beat.
  const t=b.phase>=2?(b.phase===2&&b.state==='transition'?b.t:CINEMATIC):0;
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
export function kwonBossAimPoint(b){
 // The same centre of the visible chest drives player targeting and hurt tests.
 const chest=kwonVisibleHurtShapes(b).find(s=>s.id==='chest');
 return chest||b;
}
export function encounterBossHurtShapes(g){
 return g.clown?clownHurtShapes(g):kwonVisibleHurtShapes(g.boss);
}
export function encounterBossAimPoint(g){
 return g.clown?clownAimPart(g):kwonBossAimPoint(g.boss);
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
  if(b.phase===3&&KWON_THIRD_PATTERNS[b.pattern])
   return {...c,wind:kwonReadableWind(b.pattern,c.wind,3),
    recover:Math.max(1.1,c.recover)};
  if (b.phase !== 2) return {...c,wind:kwonReadableWind(b.pattern,['slam','wave'].includes(b.pattern)?c.wind:c.wind*BOSS_TEMPO.windup,b.phase),recover:Math.max(b.pattern==='shove'?1.2:.8,c.recover*BOSS_TEMPO.recovery),damage: c.damage > 0 ? c.damage + 3 : 0};
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
    wind:kwonReadableWind(b.pattern,(wind??c.wind)*(['slam','wave'].includes(b.pattern)?1:BOSS_TEMPO.windup),b.phase),
    damage: c.damage > 0 ? c.damage + (b.pattern === 'jab' ? 6 : 10) : 0,
    recover:Math.max(b.pattern==='shove'?1.2:.8,({
        slam: 1.05,
        thrust: 0.85,
        whirl: 0.9,
        rise: 0.8,
        reverse: 0.8,
        rush: 0.8,
        shove: 1.2,
      }[b.pattern] || .8)*BOSS_TEMPO.recovery),
  };
}
export function attackZone(b) {
  if (!['windup', 'active'].includes(b.state)) return null;
  const cfg = patternConfig(b),
    progress = b.state === 'windup' ? clamp(b.t / cfg.wind, 0, 1) : 1,
    active = b.state === 'active',
    base = {kind: 'danger', shape: 'circle', x: b.x, z: b.z, progress, active};
  if (b.pattern === 'stomp') return {...base, r: 6.5};
  // The prison fan and royal last stance have visible sword/projectile contact,
  // not an invisible radial hit around the boss. Same for a rear sword sweep.
  if (['spiderPrison', 'lastStance', 'backsweep'].includes(b.pattern)) return null;
  // Hugging the boss triggers a telegraphed, forward-facing body shove,
  // rather than a 360-degree invisible displacement.
  if (b.pattern === 'shove')
    return {...base, kind:'push', shape:'cone', yaw:b.yaw, r:4.8, half:1.0};
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
export function createGame(weapon = 'sword', {register = true,seed} = {}) {
  if (!WEAPONS[weapon]) throw new Error('Unknown weapon');
  const game = {
    status: 'playing',
    time: 0,
    hitstop: 0,
    weapon,
    events: [],
    projectiles: [],
    bossShots: [],
    kwonFractures: [],
    nextId: 0,
    patternShuffle: createPatternShuffle(seed),
    bossAutonomy: createBossAutonomy(seed??0x72a9c1),
    player: createPlayerState({weapon}),
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
      openingCounts: {1:0,2:0,3:0},
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
      closeCooldown: 0,
      from: null,
      zone: null,
      turnTarget: 0,
      pendingOpening: null,
      riftFired:false,
    },
    stats: {hits: 0, dodges: 0, damage: 0},
  };
  Object.defineProperty(game,'applyBonusDamage',{enumerable:false,writable:true,configurable:true,value:(amount,poise=0,opts={})=>bossDamage(game,amount,poise,opts)});
  return register ? registerEncounter(game) : game;
}
export function act(g, type) {
  return actPlayer(g, type);
}
export function rolling(p) {
  return playerRolling(p);
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
    case 'puppetLunge':
      ly=1.48;ey=-1.20;lp=-.72;ep=.80;back=1.05;break;
    case 'skyRend':
      ly=.24;ey=-.12;lp=-1.35;ep=1.06;back=.25;break;
    case 'earthRend':
      ly=1.22;ey=-1.12;lp=-1.10;ep=.82;back=.38;break;
    case 'falseGap':
      ly=-.38;ey=1.42;lp=.68;ep=-.68;back=.45;break;
    case 'reverseGrip':
      ly=-1.46;ey=1.48;lp=.65;ep=-.84;back=.70;break;
    case 'heavenSplit':
      ly=.12;ey=-.18;lp=1.24;ep=-1.40;back=.60;break;
    case 'wave':
      // Hold the blade above the head before a forceful vertical cut.
      lp = -1.4;
      ep = 1.18;
      break;
  }
  return {ly, ey, lp, ep, back};
}
const SWORD_POSE_ALIASES=Object.freeze({spiderPrison:'stomp',graveSword:'slam',livingSword:'wave',lastStance:'whirl'});
function endPose(b) {
  const stand = cinematicPose(b).standing,
    P = poseParams(
      SWORD_POSE_ALIASES[b.pattern]||b.pattern,
      stand,
      mix(0.25, -0.6, stand),
      mix(0.25, 0.72, stand),
    );
  return {yaw: P.ey, pitch: P.ep, offset: P.back * 0.7};
}
export function startPattern(g, name, {closeDefense=false} = {}) {
  if (!PATTERNS[name]) throw new Error('Unknown pattern');
  const b = g.boss;
  b.from = b.state === 'recovery' ? endPose(b) : null;
  // Keep the torso at the previous strike's follow-through during quick
  // combos. It now returns through the next windup instead of snapping.
  b.motionFrom = b.state === 'recovery' && b.recovery <= .2 ? b.pattern : null;
  b.state = 'windup';
  b.pendingOpening = null;
  b.pattern = name;
  b.t = 0;
  b.hit = false;
  b.waveFired = false;
  b.riftFired = false;
  if(name==='wave')b.waveVariant=nextKwonWaveVariant(b.waveVariant);
  b.attackId++;
  b.punishable = false;
  b.turnTarget = toward(b, g.player) + (name === 'backsweep' && !closeDefense ? Math.PI : 0);
  b.aim = b.yaw;
  b.zone = ['slam', 'leap'].includes(name)
    ? {x: g.player.x, z: g.player.z}
    : null;
  emit(g, 'telegraph', {name: PATTERNS[name].name});
}
export function beginSequence(g, opening) {
  const b = g.boss,
    map=b.phase===1?PHASE_ONE:b.phase===3?PHASE_THREE:SEQUENCES;
  if (!map[opening]) throw new Error('Opening not in phase');
  b.queue = map[opening].slice(1);
  b.lastOpening = opening;
  startPattern(g, map[opening][0]);
}
export function chooseOpening(g) {
 const b=g.boss,d=dist(b,g.player),phase=b.phase===3?3:b.phase===2?2:1;
 const pool=Object.keys(phase===1?PHASE_ONE:phase===3?PHASE_THREE:SEQUENCES);
 // Healing is an explicit punish reaction: shuffle its two legal counters
 // separately. It cannot poison the ordinary attack deck.
 if(g.player.action?.kind==='heal'){
  b.sequence++;
  return drawPatternShuffle(g.patternShuffle,'kwon-healing-'+phase,
   phase===1?['thrust','hunt']:phase===3?['puppetHunt','kingFinale']:['royalHunt','execution'],{avoid:b.lastOpening});
 }
 const distant=d>KWON_RANGE_PRESSURE.farDistance;
 let preferred=distant?KWON_RANGE_PRESSURE.openings[phase]
  :d<5?CLOSE[phase]:ORDER[phase];
 if(g.journeyBalance?.mode==='story'&&!distant&&phase!==3){
  if(d<6)preferred=phase===1
   ?['hunt','skewer','counterDancer','skyJudge','backsweep']
   :['royalHunt','jawSnare','windParry','maelstrom','counter','trample'];
  else if(d>11)preferred=phase===1
   ?['siege','spiderPrison','skyJudge','feint','hunt','thrust']
   :['requiem','livingSword','graveSword','doubleMoon','falseExecution','crescent','execution','draw'];
  else if(phase===2&&b.lastOpening==='crescent')
   preferred=['royalHunt','counter','windParry','trample'];
 }
 // Ensure distinctive sword styles actually appear before a short phase
 // ends. Far-range openings remain limited to a visible projectile or
 // gap-closing approach, never an unfair instant melee strike.
 b.openingCounts ||= {1:0,2:0};
 const signature=phase===1?['spiderPrison','skyJudge','counterDancer']
  :phase===3?['heavenSplit','skyRend','kingFinale','puppetHunt']
  :['graveSword','livingSword','lastStance','doubleMoon'];
 const eligible=signature.filter(id=>pool.includes(id)&&
  (!distant||KWON_RANGE_PRESSURE.openings[phase].includes(id))&&
  (g.journeyBalance?.mode!=='story'||preferred.includes(id)));
 if(b.openingCounts[phase]<(phase===1?2:3)&&eligible.length)
  preferred=eligible;
 b.openingCounts[phase]++;b.sequence++;
 // The balanced bag still casts every legal sequence once per cycle.
 return drawPatternShuffle(g.patternShuffle,'kwon-'+phase,pool,{preferred,avoid:b.lastOpening});
}
export function swordPose(b) {
  const cfg = patternConfig(b),
    q = cinematicPose(b),
    stand = q.standing,
    carry = mix(0.25, -0.6, stand),
    cut = mix(0.25, 0.72, stand),
    {ly, ey, lp, ep, back} = poseParams(SWORD_POSE_ALIASES[b.pattern]||b.pattern, stand, carry, cut),
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
  if(b.state==='transition'){
    if(b.phase===3){
      const c=kwonThirdTransition(b.t);
      // The sword drags the wrist first; the torso follows much later.
      yaw=mix(-.35,-1.3,c.bladeWake);
      pitch=mix(.1,-1.08,c.bladeWake)+.34*c.skyScar;
      offset=mix(0,1.15,c.bodyPulled);
    }else{
      yaw=mix(0,-1.25,q.equip);pitch=mix(.15,-.6,q.equip);
    }
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
// Sweep only the actual 3D blade over the elapsed animation frame.
// A fast rear slash or full turn can no longer become an invisible 360-degree
// hitbox, while a player who really crosses the moving sword still gets hit.
export function sweptBladeHits(player,previous,current,width=SWORD.width){
 if(!previous||!current)return false;
 const point=(a,b,t)=>({
  x:a.x+(b.x-a.x)*t,
  y:a.y+(b.y-a.y)*t,
  z:a.z+(b.z-a.z)*t,
 });
 for(let i=0;i<=4;i++){
  const t=i/4;
  if(bladeHits(player,{a:point(previous.a,current.a,t),b:point(previous.b,current.b,t)},width))
   return true;
 }
 return false;
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
  const amount=Math.min(p.hp,playerIncomingDamage(g,damage));
  const before=p.hp;p.hp = Math.max(0, p.hp - amount);
  p.invuln = 0.32;
  p.action = {kind: 'hurt', t: 0, total: 0.22};
  applyBossHitTrait(g,before-p.hp,{cut});emit(g, 'player-hit', {amount});
  freeze(g, 0.07);
  if (!p.hp) {
    g.status = 'lost';
    g.bossShots = [];
    emit(g, 'death');
  }
}
// Pure melee is initiated only in genuine striking range; dash or visible
// ranged attacks can begin farther away when they have real reach.
const KWON_REACH_MOVES=new Set(['rush','leap','wave','spiderPrison','graveSword','livingSword','lastStance',
 'puppetLunge','skyRend','earthRend','heavenSplit']);
function canCastKwonMove(name,range){
 return range<=KWON_RANGE_PRESSURE.engageDistance||
  range>KWON_RANGE_PRESSURE.farDistance&&KWON_REACH_MOVES.has(name);
}
function pursueKwon(g,dt,range){
 const b=g.boss,phase=b.phase===3?3:b.phase===2?2:1,far=range>KWON_RANGE_PRESSURE.farDistance;
 const turnRate=far?4.6:3.6;
 b.yaw+=clamp(angleDelta(b.yaw,toward(b,g.player)),-dt*turnRate,dt*turnRate);
 b.aim=b.yaw;
 stepBossAutonomy(g.bossAutonomy,b,g.player,dt,{
  speed:far?KWON_RANGE_PRESSURE.chaseSpeed[phase]:KWON_RANGE_PRESSURE.approachSpeed[phase],
  sideSpeed:KWON_RANGE_PRESSURE.sideSpeed,spacing:KWON_RANGE_PRESSURE.spacing,
  arena:24,phase,farDistance:KWON_RANGE_PRESSURE.farDistance
 });
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
      b.wait = b.phase===3?.38:.55;
      emit(g, 'armed');
    }
    return;
  }
  tickBossHitTraits(g,dt);if(g.status!=='playing')return;tickPlayerResources(g, dt);
  const mx = input.x || 0,
    mz = input.z || 0,
    mag = Math.hypot(mx, mz),
    speed = playerWalkSpeed(p);
  if (!p.action && mag&&!playerIncapacitated(p)) {
    p.x += (mx / Math.max(1, mag)) * speed * dt;
    p.z += (mz / Math.max(1, mag)) * speed * dt;
  }
  if (!p.action) {
    if (input.lock) p.yaw = toward(p, encounterBossAimPoint(g));
    else if (mag) p.yaw = Math.atan2(mx, mz);
  }
  // Lock-on follows the boss during the attack's preparatory frames. The
  // previously frozen initial yaw let fast bosses escape an apparently aimed hit.
  const action=p.action;
  if(input.lock&&action&&['attack','skill'].includes(action.kind)&&!action.done&&action.t<action.wind){
    const desired=toward(p,encounterBossAimPoint(g)),delta=angleDelta(action.yaw,desired);
    action.yaw+=clamp(delta,-dt*11,dt*11);
    p.yaw=action.yaw;
  }
  tickPlayerAction(g, dt, w, {
    roll: (a) => {
      if (a.t <= dt * 1.1 && mag) a.yaw = Math.atan2(mx, mz);
      p.x += Math.sin(a.yaw) * playerRollSpeed(g) * dt;
      p.z += Math.cos(a.yaw) * playerRollSpeed(g) * dt;
    },
    backstep: (a,seconds) => {p.x-=Math.sin(a.yaw)*9*seconds;p.z-=Math.cos(a.yaw)*9*seconds;},
    melee: (a) => {
      const shapes=encounterBossHurtShapes(g);
      // The sword is ~2m long beyond the character grip, NOT a radius
      // around the player's feet. Direction and blade height must both line up.
      const reach=playerMeleeReach(g,g.weapon==='hammer'?3.05:2.85);
      const hit=kwonMeleeContact(shapes,p,{reach,yaw:a.yaw,height:1.85,bladeRadius:.28});
      if(hit){
        a.hit=true;
        landHit(g,w.damage*a.mult+(a.bankedBonus||0),w.poise*(g.weapon==='sword'&&evolutionCount(g,'charged-blade')>=2?1.15:1),a,hit);
      }
    },
  });
  confine(p);
  for (const q of g.projectiles) {
    const old = advancePlayerProjectile(q, dt,p);
    if (q.piercing && g.bossShots.length) {
      const n = g.bossShots.length;
      g.bossShots = g.bossShots.filter((s) => segmentDistance(s, old, q) > 1.8);
      if (g.bossShots.length < n) emit(g, 'skill-pierce', {flavor: 'bow'});
    }
    const flightY=Number.isFinite(q.y)?q.y:1.2;
    const from={...old,y:Number.isFinite(old.y)?old.y:flightY};
    const to={x:q.x,y:flightY,z:q.z};
    const hit=q.life>0&&!q.bossHit?kwonProjectileContact(encounterBossHurtShapes(g),from,to):null;
    if(hit){
      q.bossHit=true;
      if(!q.piercing&&!q.returningHammer)q.life=0;
      landHit(g,q.damage,q.poise,q.source,hit);
    }
  }
  g.projectiles = g.projectiles.filter((q) => q.life > 0);
  if (g.status !== 'playing' || b.state === 'transition') return;
  for (const q of g.bossShots) {
    const old = {x: q.x, z: q.z};
    if(q.turnRate){const delta=angleDelta(q.yaw,toward(q,p));q.yaw+=clamp(delta,-q.turnRate*dt,q.turnRate*dt);}
    q.x += Math.sin(q.yaw) * q.speed * dt;
    q.z += Math.cos(q.yaw) * q.speed * dt;
    q.age = (q.age||0) + dt;
    q.life -= dt;
    if (Math.hypot(q.x, q.z) > 27) q.life = 0;
    if (q.life > 0 && q.age >= (q.minArmTime||0) && segmentDistance(p, old, q) < (q.radius ?? 0.9)) {
      q.life = 0;
      hurtPlayer(g, q.damage);
    }
  }
  g.bossShots = g.bossShots.filter((q) => q.life > 0);
  if(!g.clown)advanceKwonFractures(g,dt,damage=>hurtPlayer(g,damage));
  if (g.status !== 'playing') return;
  if (b.stun > 0) {
    b.stun = Math.max(0, b.stun - dt);
    return;
  }
  b.poise = Math.max(0, b.poise - dt * 5);
  b.closeCooldown = Math.max(0, (b.closeCooldown||0)-dt);
  b.t += dt;
  const cfg = patternConfig(b);
  if (b.state === 'stagger') {
    if (b.t >= (b.phase>=2 ? 1.3 : 2.1)) {
      b.state = 'idle';
      b.t = 0;
      b.wait = 0.35;
    }
    return;
  }
  b.hug = dist(p, b) < HUG_RANGE ? (b.hug || 0) + dt : 0;
  if (b.state === 'idle') {
    b.punishable = false;
    // Never interrupt an authored strike, recovery, knockdown or stagger:
    // all counterattacks start only from genuine idle time.
    const counter=chooseKwonCloseDefense(b,p);
    if(counter){
      b.hug=0;
      b.closeCooldown=KWON_CLOSE_DEFENSE.cooldown;
      b.queue=[];
      b.lastOpening='close-'+counter;
      startPattern(g,counter,{closeDefense:true});
    }else{
      // Closing the distance takes priority over medium-range melee.
      pursueKwon(g,dt,dist(p,b));
      b.wait-=dt;
      const after=dist(p,b);
      if(b.wait<=0&&(after<=KWON_RANGE_PRESSURE.engageDistance||
        after>KWON_RANGE_PRESSURE.farDistance)){
       const opening=b.pendingOpening||chooseOpening(g);
       if(after<=KWON_RANGE_PRESSURE.engageDistance||
          after>KWON_RANGE_PRESSURE.farDistance&&
          KWON_RANGE_PRESSURE.openings[b.phase===3?3:b.phase===2?2:1].includes(opening)){
        b.pendingOpening=null;
        beginSequence(g,opening);
       }else b.pendingOpening=opening;
      }
    }
  } else if (b.state === 'windup') {
    if (b.pattern === 'rush' && b.t < 0.18)
      moveBoss(b, 0, dt, b.sequence % 2 ? 8 : -8);
    if (b.t < cfg.wind * (b.phase>=2 ? 0.68 : 0.55)) {
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
    // Sample the actual blade before moving/turning this frame.
    const previousSword=swordSegment({...b,t:Math.max(0,b.t-dt)});
    // Slash and rift are synchronized at the sword's late active contact.
    if(b.phase===3&&!b.riftFired&&['skyRend','earthRend','heavenSplit'].includes(b.pattern)
       &&b.t>=cfg.active*(b.pattern==='heavenSplit'?.7:.62)){
      b.riftFired=true;
      const fractures=makeKwonFractures(b,b.pattern,g.nextId);
      g.nextId+=fractures.length;g.kwonFractures.push(...fractures);
      emit(g,'kwon-rift-release',{name:b.pattern,x:b.x,z:b.z});
    }
    // One broad vertical slash leaves the sword at the midpoint of its fall.
    if(['spiderPrison','graveSword','livingSword','lastStance'].includes(b.pattern)&&!b.waveFired&&b.t>=cfg.active*.38){
      b.waveFired=true;
      const kind=b.pattern, count=kind==='spiderPrison'?7:kind==='graveSword'?3:kind==='lastStance'?2:1;
      const baseYaw=b.yaw, gap=kind==='spiderPrison'?Math.PI/5:0;
      for(let i=0;i<count;i++){
        const yaw=kind==='spiderPrison'?baseYaw+(i-3)*gap:
          kind==='graveSword'?baseYaw+(i-1)*.31:
          kind==='lastStance'?baseYaw+(i?-.37:.37):baseYaw;
        // Emit sword waves from the visible boss blade, never from the player-locked impact marker.
        const origin=b;
        const x=origin.x+Math.sin(yaw)*4.5,z=origin.z+Math.cos(yaw)*4.5;
        const shot={id:g.nextId++,kind:KWON_WAVE.kind,x,z,yaw,
          variant:b.waveVariant,radius:kind==='livingSword'?1.1:1.05,
          speed:kind==='spiderPrison'?9:kind==='graveSword'?8:kind==='livingSword'?11:17,
          minArmTime:.3,
          // The slow, visible ranged signature must have enough lifetime to
           // reach a target near the arena rim without speeding up its projectile.
           life:kind==='spiderPrison'?2.45:kind==='graveSword'?2.7:2.0,age:0,damage:kind==='spiderPrison'?16:kind==='graveSword'?22:26};
        if(kind==='livingSword')shot.turnRate=.65;
        g.bossShots.push(shot);
        emit(g,'boss-shot',{x,z,kind:KWON_WAVE.kind,variant:b.waveVariant});
      }
    }
    if (b.pattern === 'wave' && !b.waveFired && b.t >= cfg.active*KWON_WAVE.releaseRatio) {
      b.waveFired = true;
      const x=b.x+Math.sin(b.yaw)*4,z=b.z+Math.cos(b.yaw)*4;
      g.bossShots.push({id:g.nextId++,kind:KWON_WAVE.kind,x,z,yaw:b.yaw,
        variant:b.waveVariant,radius:KWON_WAVE.radius,
        speed:b.phase>=2?KWON_WAVE.speedSecond:KWON_WAVE.speedFirst,minArmTime:.2,
        life:KWON_WAVE.lifetime,age:0,damage:cfg.damage});
      emit(g,'boss-shot',{x,z,kind:KWON_WAVE.kind,variant:b.waveVariant});
    }
    if(b.pattern==='puppetLunge'&&dist(b,p)>3.15)moveBoss(b,26,dt);
    else if(b.pattern==='rush')moveBoss(b,b.phase>=2?31:23,dt);
    else if (b.pattern === 'thrust') moveBoss(b, 19, dt);
    else if (b.pattern === 'jab') moveBoss(b, 10, dt);
    else if (b.pattern === 'retreat') moveBoss(b, -9, dt);
    else if (b.pattern === 'leap' && b.t < cfg.active * 0.7)
      moveBoss(b, b.leapSpeed, dt);
    else if (b.pattern === 'whirl'||b.pattern==='lastStance') b.yaw += (TAU / cfg.active) * dt;
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
      // Grave Sword is a projectile-only signature. Its former targeted
      // 4.4-unit ground zone and this sword sweep could deal invisible
      // instant damage before any traveling grave projectiles arrived.
      !['wave', 'retreat', 'graveSword'].includes(b.pattern) &&
      sweptBladeHits(p, previousSword, swordSegment(b))
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
    if (b.queue.length) {
      const gap=dist(p,b),next=b.queue[0];
      if(canCastKwonMove(next,gap))startPattern(g,b.queue.shift());
      else {
        // Keep the existing sword follow-through while stepping close enough
        // to deliver the next blow. No instant hit or skipped windup.
        b.t=b.recovery;
        pursueKwon(g,dt,gap);
      }
    }
    else {
      b.state = 'idle';
      b.t = 0;
      // Recovery remains a full punish window. Only the next idle step
      // gains time to run towards a distant target before attacking again.
      b.wait = dist(p,b)>KWON_RANGE_PRESSURE.farDistance
        ?KWON_RANGE_PRESSURE.chaseWait:(b.phase===3?.45:b.phase===2?.58:.68)*BOSS_TEMPO.gap;
      b.punishable = false;
      b.from = null;
    }
  }
  // Prevent clipping against the boss's ACTUAL abdomen at player height.
  // Never snap the player to a circle about the invisible locomotion pivot.
  const separation=g.clown?null:kwonPlayerSeparation(kwonVisibleHurtShapes(b),p);
  if(separation){p.x=separation.x;p.z=separation.z;confine(p);}
}
export function skillView(g){
 const id=equippedPath(g),s=g.player.skill,cooldown=Math.max(0,s.cooldown||0);
 const names={'blade-wave':'검기','charged-blade':'2배 사거리','earth-wave':'피해 저장',
 'blood-hammer':'귀환 철추','twin-arrow':'후퇴 사격','piercing-arrow':'화염 화살',
 'wide-deck':'삼중 낙인','blood-deck':'흡혈 카드'};
 if(!id)return {name:'기본 공격',text:'대장간에서 스킬을 각인하세요',ratio:0,card:'',ready:false};
 const active=['earth-wave','blood-hammer','twin-arrow'].includes(id);
 const progress=id==='wide-deck'?(s.sigilMarks||0)/3:active?cooldown>0?
  1-cooldown/({ 'earth-wave':12,'blood-hammer':13,'twin-arrow':10}[id]):1:1;
 const text=id==='wide-deck'?('문양 '+(s.sigilMarks||0)+' / 3'):
  id==='earth-wave'&&s.storedDamage>0?'저장된 피해 '+Math.round(s.storedDamage):
  active?(cooldown>0?'재사용 '+cooldown.toFixed(1)+'초':'스킬 사용 가능'):
  '일반 공격에 자동 적용';
 return {name:names[id],text,ratio:clamp(progress,0,1),card:'',ready:active&&cooldown<=0};
}
