import {applyBossHitTrait} from './boss-hit-traits.mjs';
import {BEAST_PATTERNS,CRAWL_PATTERNS} from './clown-beast-pose.mjs';
import {createCircusTroupe,stepCircusTroupe,clearCircusTroupe,prepareCircusPhaseTransition} from './clown-troupe.mjs';
import {balanceClownTroupeWarning,protectClownEscapeFromDirector} from './clown-escape-routes.mjs';
import {REMASTERED_CIRCUS_RUN} from './clown-ensemble-repertoire.mjs';
import {RINGMASTER_ATTACK_DEFINITIONS} from './clown-ringmaster-attacks.mjs';
import {createClownStageBall,stepClownStageBall} from './clown-grounded-physics.mjs';
import {HORROR_DEFINITIONS,HORROR_RUN,HORROR_PATTERNS,horrorMinStage} from './clown-horror-patterns.mjs';
import {playerIncomingDamage} from './weapon-stats.mjs';
import {createBossAutonomy,stepBossAutonomy} from './boss-autonomy.mjs';
import {drawPatternShuffle} from './pattern-shuffle.mjs';
import {clownPrecastTime,clownPrecastPose} from './attack-readability.mjs';
import {BOSS_TEMPO} from './boss-tempo.mjs';
import {clownHurtShapes} from './boss-hit-regions.mjs';
import {kwonPlayerSeparation} from './kwon-hurtbox.mjs';
import {
  createGame,
  step as baseStep,
  rolling,
  clamp,
  angleDelta,
} from './combat.mjs';
import {
  ROLL,
  PRESSURE,
  segmentGap,
  waveCrosses,
  rollPosition,
} from './clown-pressure.mjs';
export const ARENA = 27,
  BALL_LIMIT = 23.25,
  BODY_R = 3.3,
  CLOWN_HP = PRESSURE.hp,
  FLY = 0.9,
  SWELL = 0.55,
  HUG_DIST = 3.8,
  HUG_TIME = 2.2,
  HEAD_Y = 9.9;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
  toward = (a, b) => Math.atan2(b.x - a.x, b.z - a.z),
  emit = (g, type, data = {}) => g.events.push({type, ...data}),
  cross = (a, t, v) => a < v && t >= v;
const smooth = (t) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
function confine(p, r = ARENA) {
  const d = Math.hypot(p.x, p.z);
  if (d > r) {
    p.x *= r / d;
    p.z *= r / d;
  }
}
const newVis = () => ({
  pose: 'idle',
  k: 0,
  mode: 'full',
  crouch: 0,
  glove: 0,
  neck: 0,
  neckTarget: null,
  tilt: 0,
  juggle: 0,
  jump: 0,
  shake: 0,
  throwK: 0,
  stomp: 0,
});
const resetVis = (c) => {
    c.vis = newVis();
  },
  head = (c, pose, k, mode = 'full') =>
    Object.assign(c.vis, {pose, k: clamp(k, 0, 1), mode});
function once(c, key, fn) {
  if (!c.f[key]) c.f[key] = fn() || true;
  return c.f[key];
}
export function inZone(z, p) {
  if (z.shape === 'lane') {
    const dx = p.x - z.x,
      dz = p.z - z.z,
      a = dx * Math.sin(z.yaw) + dz * Math.cos(z.yaw),
      b = dx * Math.cos(z.yaw) - dz * Math.sin(z.yaw);
    return a >= 0 && a <= z.len && Math.abs(b) <= z.w / 2;
  }
  return (
    dist(z, p) < z.r &&
    (z.shape === 'circle' || Math.abs(angleDelta(z.yaw, toward(z, p))) < z.half)
  );
}
export function hurt(g, damage, src) {
  const p = g.player,
    c = g.clown;
  if (g.status !== 'playing' || g.boss.state === 'transition') return false;
  c.hits.push({src, t: g.time});
  if (c.hits.length > 128) c.hits.shift();
  if (p.invuln > 0) return false;
  if (rolling(p)) {
    g.stats.dodges++;
    emit(g, 'dodge');
    return false;
  }
  damage = Math.min(p.hp,playerIncomingDamage(g,Math.round(damage * PRESSURE.damage[g.boss.phase >= 2 ? 1 : 0])));
  p.hp = Math.max(0, p.hp - damage);
  p.invuln = 0.32;
  applyBossHitTrait(g,damage,{boss:'clown'});
  g.hitstop = Math.max(g.hitstop || 0, 0.07);
  emit(g, 'player-hit', {amount: damage});
  if (!p.hp) {
    g.status = 'lost';
    emit(g, 'death');
  }
  return true;
}
function zone(g, z) {
  const q = {
    id: g.nextId++,
    age: 0,
    state: 'warn',
    fade: 0,
    kind: 'danger',
    damage: 0,
    visual: false,
    blast: false,
    ...z,
  };
  if(q.source==='troupe'||q.source==='legacyEcho')
    Object.assign(q,balanceClownTroupeWarning(g,q));
  else protectClownEscapeFromDirector(g,q);
  g.clown.zones.push(q);
  emit(g, 'clown-zone', {id: q.id, shape: q.shape, warn: q.warn, sound:q.sound||null});
  return q;
}
function cone(
  g,
  yaw,
  warn,
  r = 10,
  half = 0.32,
  damage = 27,
  sound = 'hornFan',
) {
  const moving = ['clap', 'hornFan', 'curtainCall'].includes(sound);
  return zone(g, {
    shape: 'cone',
    x: g.boss.x,
    z: g.boss.z,
    yaw,
    r,
    half,
    warn,
    damage,
    sound,
    visual: moving,
    waveKind: moving ? sound : null,
  });
}
function spawnWave(g, z) {
  const c = g.clown,
    phase = g.boss.phase === 2;
  if (c.waves.length >= 12) c.waves.shift();
  const w = {
    id: g.nextId++,
    x: z.x,
    z: z.z,
    r: 0,
    range: z.r,
    yaw: z.yaw,
    half: z.half,
    width: phase ? 1.5 : 1.2,
    speed: phase ? 30 : 24,
    damage: z.damage,
    kind: z.waveKind,
    hit: false,
    first: Math.max(0, z.age - z.warn),
  };
  c.waves.push(w);
  emit(g, 'clown-wave', {id: w.id, key: w.kind});
  emit(g, w.kind === 'clap' ? 'clown-clap' : 'clown-horn');
}
function updateZones(g, dt) {
  for (const z of g.clown.zones) {
    if (z.state === 'warn') {
      z.age += dt;
      if (z.age < z.warn) continue;
      z.state = 'burst';
      z.fade = 0.28;
      if (z.waveKind) spawnWave(g, z);
      else if (!z.visual && inZone(z, g.player)) {
        if (z.kind === 'push') {
          if (!rolling(g.player)) {
            const a =
              dist(z, g.player) < 0.001
                ? g.player.yaw + Math.PI
                : toward(z, g.player);
            g.player.x += Math.sin(a) * 2.5;
            g.player.z += Math.cos(a) * 2.5;
            confine(g.player);
            emit(g, 'clown-shove');
          }
        } else if (z.damage > 0) hurt(g, z.damage, z.id);
      }
      if (!z.visual || z.waveKind)
        emit(g, 'clown-impact', {key: z.sound || g.clown.name, x: z.x, z: z.z});
      if (z.blast) emit(g, 'clown-blast', {x: z.x, z: z.z, r: z.r});
    } else z.fade -= dt;
  }
  g.clown.zones = g.clown.zones.filter((z) => z.state === 'warn' || z.fade > 0);
}
function updateWaves(g, dt) {
  const c = g.clown,
    old = c.prevPlayer || g.player;
  for (const w of c.waves) {
    const r = w.r,
      h = w.first === undefined ? dt : w.first;
    delete w.first;
    w.r = Math.min(w.range, w.r + w.speed * h);
    if (!w.hit && waveCrosses(w, r, w.r, old, g.player)) {
      w.hit = true;
      hurt(g, w.damage, 'wave' + w.id);
    }
  }
  c.waves = c.waves.filter((w) => w.r < w.range);
}
function bomb(g, o) {
  const b = g.boss,
    q = {
      id: g.nextId++,
      t: 0,
      fly: FLY,
      warn: FLY + SWELL,
      from: {x: b.x, y: HEAD_Y, z: b.z},
      ...o,
    };
  g.clown.bombs.push(q);
  emit(g, 'clown-throw', {kind: q.kind});
  return q;
}
function target(g) {
  const p = {x: g.player.x, z: g.player.z};
  confine(p, ARENA-1);
  return p;
}
function bombAt(
  g,
  p,
  r = 1.9,
  damage = 22,
  fly = 0.85,
  kind = 'ball',
  swell = 0,
) {
  const warn = fly + swell,
    z = zone(g, {
      shape: 'circle',
      ...p,
      r,
      warn,
      damage,
      final: swell || 0.3,
      blast: true,
    });
  return bomb(g, {kind, ...p, r, fly, warn, zone: z.id});
}
const throwHead = (g, r, d) => bombAt(g, target(g), r, d, FLY, 'head', SWELL),
  throwBall = (g) => bombAt(g, target(g));
function updateBombs(g, dt) {
  const c = g.clown;
  for (const q of c.bombs) {
    const old = {x: q.px, z: q.pz},
      was = q.t;
    q.t += dt;
    if (q.kind === 'roll') {
      const p = rollPosition(q);
      q.px = p.x;
      q.pz = p.z;
      // Only the truly moving head can contact the player. The stage/encore
        // launch windup is a separate, non-damaging anticipation period.
        const windup = q.windup || 0;
        if (!q.hit && q.t >= windup && was <= windup + q.travel) {
        const a = c.prevPlayer || g.player,
          b = g.player;
        if (
          segmentGap(
            {x: 0, z: 0},
            {x: old.x - a.x, z: old.z - a.z},
            {x: p.x - b.x, z: p.z - b.z},
          ) < ROLL.radius
        ) {
          q.hit = true;
          hurt(g, ROLL.damage, 'roll' + q.id);
        }
      }
    }
  }
  c.bombs = c.bombs.filter((q) => q.t < q.warn + 0.3);
}
function fitLen(b, yaw, len) {
  for (
    let i = 0;
    i < 64 &&
    Math.hypot(b.x + Math.sin(yaw) * len, b.z + Math.cos(yaw) * len) >
      BALL_LIMIT;
    i++
  )
    len = Math.max(0, len - 0.5);
  return len;
}
function rosette(g, p, r, warn, n = 10, damage = 25, gap = 0) {
  for (let i = 0; i < n; i++) {
    if (i === gap || i === (gap + 1) % n) continue;
    const a = (i / n) * Math.PI * 2,
      q = {x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r};
    if (Math.hypot(q.x, q.z) < 22)
      zone(g, {shape: 'circle', ...q, r: 1.7, warn, damage, blast: true});
  }
}
const definitions = [
  ['laughBomb', '웃음 폭탄', 5.1, 1.4, [1]],
  ['dash', '곡예 돌진', 4.5, 1.1, [1]],
  ['juggle', '저글링 낙하', 4.5, 1.2, [1]],
  ['clap', '풍선 박수', 3.4, 1.1, [1]],
  ['bounce', '공 튀기기', 3.6, 1.1, [1]],
  ['shove', '관객 밀어내기', 1.6, 1, [1, 2]],
  ['tripleBomb', '삼중 웃음 폭탄', 6.65, 2.1, [2]],
  ['rollingSmile', '굴러오는 미소', 3.8, 1.5, [2]],
  ['inverseBow', '거꾸로 된 인사', 3.8, 1.1, [2]],
  ['lastClap', '마지막 박수', 5.35, 1.7, [2]],
  ['confettiCurtain', '색종이 커튼', 4.6, 1.2, [1]],
  ['hornFan', '나팔 부채꼴', 4.1, 1.1, [1]],
  ['drumMarch', '행진 북 연타', 4.8, 1.2, [1]],
  ['balloonBouquet', '풍선 꽃다발', 5, 1.2, [1]],
  ['carousel', '회전목마', 5.6, 1.2, [1]],
  ['curtainCall', '커튼콜', 7.2, 1.5, [2]],
  ['spotlightSweep', '스포트라이트 쇼', 4.4, 1.2, [1]],
  ['fireHoop', '불의 고리', 4.3, 1.2, [1]],
  ['humanCannon', '인간 대포', 5, 1.4, [2]],
  // These are thrown circus props after the giant balance ball rolls aside.
  ['ballRain', '공 폭우', 4.8, 1.3, [2]],
  ['bounceChain', '연쇄 공 튀기기', 5.6, 1.3, [2]],
  ['ballSpin', '회전 공 휩쓸기', 4.9, 1.3, [2]],
  ['ballCannon', '공 대포', 5.4, 1.5, [2]],
  // Each new routine is a staged performance: pose -> environmental warning
  // -> delayed impact -> clean recovery. No extra high-poly stage props.
  ['mirrorStage', '거울 무대 · 뒤집힌 조명', 4.7, 1.25, [1]],
  ['trapdoorWaltz', '함정 무도회', 5.2, 1.5, [1]],
  ['grandEncore', '세 번의 앙코르', 6.1, 1.6, [2]],
  ['invertedApplause', '거꾸로 박수', 6, 1.45, [2]],
  ['puppetFuneral', '꼭두각시의 장례식', 5.8, 1.65, [1]],
  ['laughContagion', '웃음의 전염', 5.4, 1.4, [1]],
  ['stageCapsize', '무대 전복', 5.6, 1.7, [2]],
  ['lastMagic', '마지막 마술', 6.4, 1.9, [2]],
  ...HORROR_DEFINITIONS.map(([key,name,dur,recover,phases])=>[key,name,dur,recover,phases]),
];
export const PATTERNS = Object.fromEntries(
  definitions.map(([key, name, dur, recover, phases]) => [
    key,
    {name, dur:dur+clownPrecastTime(key), precast:clownPrecastTime(key), recover, phases},
  ]),
);
function dashPart(g, c, a, t, start, key) {
  if (t < start) return;
  const b = g.boss,
    L = once(c, key, () => {
      const yaw = toward(b, g.player),
        len = fitLen(b, yaw, 12);
      c.yaw = yaw;
      zone(g, {
        shape: 'lane',
        x: b.x,
        z: b.z,
        yaw,
        len,
        w: BODY_R * 2,
        warn: 0.9,
        visual: true,
        chargeCue: true,
      });
      emit(g, 'clown-stomp');
      return {x: b.x, z: b.z, yaw, len, hit: false, done: false};
    });
  if (L.done) return;
  const u = t - start;
  c.vis.stomp = u < 0.9 ? Math.abs(Math.sin(u * 16)) : 0;
  c.vis.crouch = u < 0.9 ? smooth(u / 0.9) : 0;
  if (cross(a, t, start + 0.9)) emit(g, 'clown-dash');
  if (u >= 0.9) {
    const old = {x: b.x, z: b.z},
      k = clamp((u - 0.9) / 0.45, 0, 1),
      x = L.x + Math.sin(L.yaw) * L.len * k,
      z = L.z + Math.cos(L.yaw) * L.len * k;
    c.odo += Math.hypot(x - b.x, z - b.z);
    b.x = x;
    b.z = z;
    c.noSeparate = u < 1.35;
    const p = c.prevPlayer || g.player;
    if (
      !L.hit &&
      segmentGap(
        {x: 0, z: 0},
        {x: old.x - p.x, z: old.z - p.z},
        {x: x - g.player.x, z: z - g.player.z},
      ) < BODY_R
    ) {
      L.hit = true;
      hurt(g, 30, 'dash' + key);
    }
    if (u >= 1.35) L.done = true;
  }
}
const RUN = {
  laughBomb(g, c, a, t) {
    once(c, 's', () => emit(g, 'clown-inflate'));
    if (t < 1.4) {
      head(c, 'inflate', t / 1.4);
      c.vis.shake = t / 1.4;
    } else if (t < 1.65) head(c, 'hold', 1);
    if (cross(a, t, 1.4)) emit(g, 'clown-silence');
    if (cross(a, t, 1.65)) {
      throwHead(g, 3.2, 34);
      if (g.boss.phase === 2) c.f.echo = target(g);
    }
    if (c.f.echo && cross(a, t, 2.6))
      zone(g, {
        shape: 'circle',
        ...c.f.echo,
        r: 4,
        warn: 0.9,
        damage: 24,
        blast: true,
      });
    if (t >= 1.65) {
      c.vis.throwK = clamp((t - 1.65) / 0.35, 0, 1);
      head(c, 'regrow', (t - 1.65) / 3.45, 'small');
    }
  },
  dash(g, c, a, t) {
    dashPart(g, c, a, t, 0, 'lane');
    if (g.boss.phase === 2) dashPart(g, c, a, t, 1.8, 'returnLane');
  },
  juggle(g, c, a, t) {
    once(c, 's', () => emit(g, 'clown-juggle'));
    c.vis.juggle = t < 2.6 ? 1 : 0;
    for (const at of g.boss.phase === 2
      ? [0.8, 1.15, 1.5, 1.85, 2.2]
      : [0.9, 1.25, 1.6])
      if (cross(a, t, at)) throwBall(g);
  },
  clap(g, c, a, t) {
    once(c, 'z', () => {
      c.yaw = toward(g.boss, g.player);
      cone(
        g,
        c.yaw,
        Math.max(0.01, 0.85 - t),
        g.boss.phase === 2 ? 15 : 12,
        0.873,
        28,
        'clap',
      );
    });
    c.vis.glove = t < 0.85 ? smooth(t / 0.85) : smooth(1 - (t - 0.85));
    if (g.boss.phase === 2 && cross(a, t, 1.1)) {
      cone(g, c.yaw - 0.65, 0.75, 15, 0.43, 26, 'clap');
      cone(g, c.yaw + 0.65, 1.1, 15, 0.43, 26, 'clap');
    }
  },
  bounce(g, c, a, t) {
    once(c, 'z', () =>
      zone(g, {
        shape: 'circle',
        x: g.boss.x,
        z: g.boss.z,
        r: 4.8,
        warn: 1,
        damage: 30,
      }),
    );
    c.vis.crouch = t < 0.7 ? smooth(t / 0.7) : 0;
    c.vis.jump = t >= 0.7 && t <= 1 ? Math.sin((Math.PI * (t - 0.7)) / 0.3) : 0;
    if (cross(a, t, 1)) {
      emit(g, 'clown-bounce');
      rosette(g, g.boss, 7, 0.8, 10, 24, c.seq % 10);
      if (g.boss.phase === 2) rosette(g, g.boss, 10, 1.3, 12, 26, c.seq % 12);
    }
  },
  shove(g, c, a, t) {
    once(c, 'z', () => {
      c.shoveCd = 4;
      zone(g, {
        shape: 'circle',
        x: g.boss.x,
        z: g.boss.z,
        // The four-legged face and forward paws fill a larger ground arc
        // than the old stage-one ball. The push is still harmless.
        r: Math.max(g.boss.phase===2?5.3:4.5,...clownHurtShapes(g).filter(v=>v.id==='ball'||v.id==='torso')
          .map(v=>v.rz*Math.sqrt(Math.max(0,1-((1.15-v.y)/(v.ry+.5))**2))+.65)),
        warn: 0.6,
        kind: 'push',
      });
    });
    c.vis.tilt = t < 0.6 ? smooth(t / 0.6) : smooth(1 - (t - 0.6) / 0.4);
  },
  tripleBomb(g, c, a, t) {
    const T = [1.2, 2.05, 2.9],
      S = [0, 1.2, 2.05];
    once(c, 's', () => emit(g, 'clown-inflate'));
    if (t < 2.9) {
      const i = t < 1.2 ? 0 : t < 2.05 ? 1 : 2;
      head(c, 'inflate', (t - S[i]) / (T[i] - S[i]));
      c.vis.shake = 0.6;
    }
    for (let i = 0; i < 3; i++)
      if (cross(a, t, T[i]))
        bombAt(g, target(g), 2.7 + i * 0.2, 30, FLY, 'head', 0.4 + i * 0.15);
    if (t >= 2.9) head(c, 'regrow', (t - 2.9) / 3.75, 'small');
  },
  rollingSmile(g, c, a, t) {
    const L = once(c, 'lane', () => {
      const b = g.boss,
        yaw = toward(b, g.player),
        len = fitLen(b, yaw, 14),
        x = b.x + Math.sin(yaw) * len,
        z = b.z + Math.cos(yaw) * len;
      c.yaw = yaw;
      zone(g, {
        shape: 'lane',
        x: b.x,
        z: b.z,
        yaw,
        len,
        w: ROLL.radius * 2,
        warn: ROLL.wind + ROLL.travel - t,
        visual: true,
      });
      zone(g, {
        shape: 'circle',
        x,
        z,
        r: 3.6,
        warn: ROLL.wind + ROLL.travel + ROLL.fuse - t,
        damage: 34,
        final: ROLL.fuse,
        blast: true,
      });
      return {x, z};
    });
    if (t < ROLL.wind) head(c, 'hold', 1);
    else
      head(
        c,
        'regrow',
        (t - ROLL.wind) / (PATTERNS.rollingSmile.dur - ROLL.wind),
        'small',
      );
    if (cross(a, t, ROLL.wind)) {
      const q = bomb(g, {
        kind: 'roll',
        fly: 0,
        travel: ROLL.travel,
        warn: ROLL.travel + ROLL.fuse,
        x: L.x,
        z: L.z,
        r: 3.6,
        px: g.boss.x,
        pz: g.boss.z,
      });
      q.t = t - ROLL.wind;
      const p = rollPosition(q);
      q.px = p.x;
      q.pz = p.z;
      emit(g, 'clown-roll');
    }
  },
  inverseBow(g, c, a, t) {
    if (cross(a, t, 0.2)) {
      const b = g.boss,
        p = target(g),
        d = dist(p, b);
      if (d > 10) {
        p.x = b.x + ((p.x - b.x) * 10) / d;
        p.z = b.z + ((p.z - b.z) * 10) / d;
      }
      c.f.tgt = p;
      zone(g, {
        shape: 'circle',
        ...p,
        r: 3.2,
        warn: 1,
        damage: 40,
        blast: true,
      });
    }
    c.vis.neckTarget = c.f.tgt || null;
    c.vis.crouch = smooth(t / 0.2);
    c.vis.neck =
      t < 0.2 ? 0 : t < 1.2 ? smooth((t - 0.2) / 0.8) : 1 - smooth(t - 1.2);
    if (cross(a, t, 1.2)) {
      emit(g, 'clown-slam', c.f.tgt);
      rosette(g, c.f.tgt, 5, 0.85, 10, 23, c.seq % 10);
    }
  },
  lastClap(g, c, a, t) {
    once(c, 'z', () => {
      c.yaw = toward(g.boss, g.player);
      cone(g, c.yaw, Math.max(0.01, 0.9 - t), 15, 0.873, 28, 'clap');
    });
    c.vis.glove = t < 0.9 ? smooth(t / 0.9) : smooth(1 - (t - 0.9) / 0.6);
    if (cross(a, t, 0.9)) emit(g, 'clown-inflate');
    if (t >= 0.9 && t < 1.7) head(c, 'inflate', (t - 0.9) / 0.8);
    if (cross(a, t, 1.7)) throwHead(g, 3, 34);
    if (t >= 1.7) head(c, 'regrow', (t - 1.7) / 3.65, 'small');
  },
  confettiCurtain(g, c, a, t) {
    c.vis.juggle = t < 3 ? 1 : 0;
    for (let row = 0; row < (g.boss.phase === 2 ? 3 : 2); row++)
      if (cross(a, t, 0.15 + row * 0.75)) {
        const p = target(g),
          gap = (c.seq + row) % 5;
        for (let i = 0; i < 5; i++) {
          if (i === gap) continue;
          const q = {
            x: clamp(p.x + (i - 2) * 4.5, -23, 23),
            z: clamp(p.z + (row - 1) * 4, -23, 23),
          };
          if (Math.hypot(q.x, q.z) < 22)
            zone(g, {
              shape: 'circle',
              ...q,
              r: 1.8,
              warn: 1,
              damage: 23,
              blast: true,
              sound: 'confettiCurtain',
            });
        }
        emit(g, 'clown-confetti');
      }
  },
  hornFan(g, c, a, t) {
    c.vis.glove = 0.5;
    const phase = g.boss.phase === 2;
    for (let i = 0; i < (phase ? 4 : 2); i++)
      if (cross(a, t, 0.1 + i * (phase ? 0.6 : 0.9))) {
        if (i === 0 || i === 3) c.f.aim = toward(g.boss, g.player);
        c.yaw = c.f.aim;
        cone(
          g,
          c.f.aim + [0, -0.6, 0.6, 0][i],
          phase ? 0.7 : 0.75,
          phase ? 22 : 20,
          0.32,
          28,
        );
      }
  },
  drumMarch(g, c, a, t) {
    c.vis.stomp = Math.abs(Math.sin(t * 9));
    const T = g.boss.phase === 2 ? [0.1, 0.75, 1.4, 2.05] : [0.1, 1, 1.9];
    for (let i = 0; i < T.length; i++)
      if (cross(a, t, T[i])) {
        const final = i === T.length - 1;
        zone(g, {
          shape: 'circle',
          ...target(g),
          r: final ? 3.5 : 2.3,
          warn: final ? 1.1 : 0.8,
          damage: final ? 34 : 21,
          blast: true,
          sound: 'drumMarch',
        });
        emit(g, 'clown-drum', {final});
      }
  },
  balloonBouquet(g, c, a, t) {
    c.vis.juggle = t < 3 ? 1 : 0;
    once(c, 's', () => {
      const p = target(g),
        n = g.boss.phase === 2 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2,
          q = {x: p.x + Math.sin(a) * 4.8, z: p.z + Math.cos(a) * 4.8};
        confine(q, ARENA-2);
        bombAt(g, q, 2.1, 26, 0.9, 'ball', 0.6 + i * 0.28);
      }
      emit(g, 'clown-balloon');
    });
  },
  carousel(g, c, a, t) {
    once(c, 's', () => {
      c.f.aim = toward(g.boss, g.player);
    });
    for (let i = 0; i < (g.boss.phase === 2 ? 6 : 4); i++)
      if (cross(a, t, 0.1 + i * 0.55)) {
        c.yaw = c.f.aim + (i * Math.PI) / 3;
        cone(g, c.yaw, 0.85, 12, 0.4, 27, 'carousel');
        emit(g, 'clown-carousel');
      }
    c.vis.tilt = Math.sin(t * 5) * 0.6;
  },
  curtainCall(g, c, a, t) {
    c.vis.juggle = t < 4 ? 1 : 0;
    if (cross(a, t, 0.1)) {
      c.f.aim = toward(g.boss, g.player);
      cone(g, c.f.aim, 1, 20, 0.35, 30, 'curtainCall');
    }
    for (const at of [1.4, 2.1, 2.8]) if (cross(a, t, at)) throwBall(g);
    if (cross(a, t, 3.6)) {
      const p = target(g);
      zone(g, {
        shape: 'circle',
        ...p,
        r: 3.6,
        warn: 1.2,
        damage: 36,
        blast: true,
        sound: 'curtainCall',
      });
      rosette(g, p, 7, 1.5, 10, 25, c.seq % 10);
      emit(g, 'clown-finale');
    }
  },
  spotlightSweep(g, c, a, t) {
    const aim = once(c, 'aim', () => ({...target(g)})),
      n = g.boss.phase === 2 ? 5 : 4,
      at = [0.2, 0.75, 1.3, 1.85, 2.4];
    c.vis.glove = 0.55 + Math.sin(t * 5) * 0.25;
    c.vis.tilt = Math.sin(t * 3) * 0.45;
    for (let i = 0; i < n; i++)
      if (cross(a, t, at[i])) {
        const b = g.boss,
          k = (i + 1) / n,
          last = i === n - 1;
        zone(g, {
          shape: 'circle',
          x: b.x + (aim.x - b.x) * k,
          z: b.z + (aim.z - b.z) * k,
          r: last ? 3.4 : 2.5,
          warn: 0.85,
          damage: last ? 32 : 24,
          blast: true,
          sound: 'drumMarch',
        });
        emit(g, 'clown-drum', {final: last});
      }
  },
  fireHoop(g, c, a, t) {
    c.vis.juggle = t < 3 ? 1 : 0;
    c.vis.jump = t < 0.6 ? Math.sin((Math.PI * t) / 0.6) * 0.5 : 0;
    const rings = g.boss.phase === 2 ? 3 : 2;
    for (let i = 0; i < rings; i++)
      if (cross(a, t, 0.3 + i * 0.9)) {
        rosette(
          g,
          g.boss,
          6 + i * 4.2,
          1.1,
          12,
          24 + i * 2,
          (c.seq * 5 + i * 4) % 12,
        );
        emit(g, 'clown-balloon');
      }
  },
  humanCannon(g, c, a, t) {
    const b = g.boss,
      L = once(c, 'aim', () => {
        const yaw = toward(b, g.player);
        c.yaw = yaw;
        return {yaw, len: fitLen(b, yaw, 26)};
      }),
      side = c.seq % 2 ? 1 : -1;
    c.vis.crouch = t < 1.1 ? smooth(t / 1.1) : 0;
    c.vis.jump =
      t >= 1.1 && t < 1.5 ? Math.sin((Math.PI * (t - 1.1)) / 0.4) : 0;
    c.vis.stomp = t < 1.1 ? Math.abs(Math.sin(t * 14)) : 0;
    if (cross(a, t, 0.1)) {
      zone(g, {
        shape: 'lane',
        x: b.x,
        z: b.z,
        yaw: L.yaw,
        len: L.len,
        w: 5.2,
        warn: 1.1,
        damage: 36,
        sound: 'dash',
      });
      emit(g, 'clown-stomp');
    }
    if (cross(a, t, 1.3)) {
      const yaw = L.yaw + side * 0.42;
      zone(g, {
        shape: 'lane',
        x: b.x,
        z: b.z,
        yaw,
        len: fitLen(b, yaw, 26),
        w: 5.2,
        warn: 1,
        damage: 34,
        sound: 'dash',
      });
      emit(g, 'clown-stomp');
    }
    if (cross(a, t, 2.4)) {
      const yaw = L.yaw - side * 0.42;
      zone(g, {
        shape: 'lane',
        x: b.x,
        z: b.z,
        yaw,
        len: fitLen(b, yaw, 26),
        w: 5.2,
        warn: 1,
        damage: 34,
        sound: 'dash',
      });
      emit(g, 'clown-stomp');
    }
  },
  // Three hanging puppets swing along alternating lanes. Glove pulls precede every swing.
  puppetFuneral(g,c,a,t){
    const aim=once(c,'puppet-aim',()=>({yaw:toward(g.boss,g.player)})).yaw;
    c.vis.glove=.25+.7*Math.abs(Math.sin(t*2.2));
    c.vis.tilt=Math.sin(t*2.2)*.34;
    c.vis.juggle=t<3.7?1:0;
    for(let i=0;i<3;i++)if(cross(a,t,.25+i*1.12)){
      const yaw=aim+(i-1)*.64;c.yaw=yaw;
      zone(g,{shape:'lane',x:g.boss.x,z:g.boss.z,yaw,
        len:fitLen(g.boss,yaw,20),w:3.8,warn:1.05,
        damage:25,blast:true,sound:'carousel'});
      emit(g,'clown-juggle');
    }
  },
  // The audience laughs from the perimeter in sequence; the last beat is a central clap.
  laughContagion(g,c,a,t){
    c.vis.glove=t<3.4?.5+.35*Math.sin(t*3):0;
    c.vis.shake=t<3.4?.3*Math.abs(Math.sin(t*9)):0;
    for(let i=0;i<6;i++)if(cross(a,t,.25+i*.5)){
      const theta=i*Math.PI/3+c.seq*.37;
      const q={x:Math.sin(theta)*17,z:Math.cos(theta)*17};
      zone(g,{shape:'circle',...q,r:5.5,warn:1.15,damage:23,blast:true,sound:'laughBomb'});
      emit(g,'clown-clap');
    }
    if(cross(a,t,2.85))zone(g,{shape:'circle',x:0,z:0,r:7,warn:1.05,damage:32,blast:true,sound:'lastClap'});
  },
  // A series of low, slanted blows sells the stage tipping rather than an unannounced global hit.
  stageCapsize(g,c,a,t){
    c.vis.crouch=t<1.5?smooth(t/1.5):.15;
    c.vis.tilt=Math.sin(Math.min(t,4)*1.3)*.55;
    c.vis.stomp=t>1.45&&t<4.1?Math.abs(Math.sin(t*4)):.0;
    for(let i=0;i<4;i++)if(cross(a,t,.35+i*.72)){
      const theta=c.yaw+(i%2?Math.PI/2:-Math.PI/2);
      zone(g,{shape:'lane',x:g.boss.x,z:g.boss.z,yaw:theta,
        len:fitLen(g.boss,theta,22),w:5.2,warn:1.25,damage:28,
        blast:true,sound:'trapdoorWaltz'});
      emit(g,'clown-stomp');
    }
  },
  // A head in a magic box: the swelling, fall and delayed side bursts are separate readable beats.
  lastMagic(g,c,a,t){
    const p=once(c,'magic-target',()=>target(g));
    head(c,t<1.3?'inflate':t<3.2?'shrink':'regrow',
      t<1.3?smooth(t/1.3):t<3.2?1:smooth((t-3.2)/2),'small');
    c.vis.crouch=t<1.8?.75:Math.max(0,.75*(1-smooth((t-1.8)/2)));
    c.vis.glove=t<3.6?.6+.3*Math.sin(t*3):0;
    if(cross(a,t,1.05))bombAt(g,p,4.1,31,1.2,'head',.6);
    for(let i=0;i<4;i++)if(cross(a,t,2.15+i*.42)){
      const theta=i*Math.PI/2,q={x:p.x+Math.sin(theta)*5.5,z:p.z+Math.cos(theta)*5.5};confine(q,ARENA-2);
      zone(g,{shape:'circle',...q,r:2.9,warn:1,damage:24,blast:true,sound:'curtainCall'});
    }
    if(cross(a,t,4.6))emit(g,'clown-inflate');
  },
  // An old-fashioned follow spotlight marks the player's last position,
  // then the clown turns his shoulders and relights the stage behind them.
  mirrorStage(g, c, a, t) {
    once(c, 'intro', () => emit(g, 'clown-stomp'));
    const b=g.boss,lead=once(c, 'lead',()=>target(g));
    c.yaw+=clamp(angleDelta(c.yaw,toward(b,lead)),-.05,.05);
    c.vis.glove=t<1.35?smooth(t/1.35):Math.max(0,1-smooth((t-1.35)/1.1));
    c.vis.tilt=Math.sin(t*2.7)*.32;
    if(cross(a,t,.16)){
      zone(g,{shape:'circle',...lead,r:6,warn:1.25,damage:27,blast:true,major:true,sound:'spotlightSweep'});
    }
    if(cross(a,t,1.5)){
      const side=c.seq%2?1:-1,aim=toward(b,g.player);
      const q={x:clamp(g.player.x+Math.cos(aim)*5.2*side,-22,22),
        z:clamp(g.player.z-Math.sin(aim)*5.2*side,-22,22)};
      confine(q,ARENA-2);c.f.echo=q;
      zone(g,{shape:'circle',...q,r:5.6,warn:1.05,damage:30,blast:true,major:true,sound:'spotlightSweep'});
      emit(g,'clown-stomp');
    }
  },
  // Three visually readable footfalls advance across the felt. Each warning
  // lands only after the body sinks, springs up, and drops again.
  trapdoorWaltz(g, c, a, t) {
    const b=g.boss,T=[.35,1.45,2.55],phase=g.boss.phase===2;
    c.vis.crouch=.35+.4*Math.max(0,Math.sin(t*Math.PI*2));
    c.vis.jump=0;
    for(let i=0;i<T.length;i++){
      const u=t-T[i];
      if(u>=.38&&u<1.05)c.vis.jump=Math.max(c.vis.jump,Math.sin(Math.PI*(u-.38)/.67)*.7);
      if(cross(a,t,T[i])){
        const p=target(g),yaw=toward(b,p);
        const stride=phase?4.5:3.4,side=i%2?1:-1;
        const q={x:p.x+Math.cos(yaw)*stride*side,z:p.z-Math.sin(yaw)*stride*side};
        confine(q,ARENA-2);
        zone(g,{shape:'circle',...q,r:5.4,warn:1.05,damage:phase?32:28,
          blast:true,major:true,sound:'bounce'});
        emit(g,'clown-stomp');
      }
      if(cross(a,t,T[i]+1.05))emit(g,'clown-bounce');
    }
  },
  // Balls are physically thrown in sequence; the final bouquet leaves an
  // intentionally open wedge rather than covering the whole arena.
  grandEncore(g, c, a, t) {
    once(c,'overture',()=>emit(g,'clown-juggle'));
    c.vis.juggle=t<3.5?1:0;
    c.vis.throwK=t<3.4?Math.abs(Math.sin(t*Math.PI*1.2)):.0;
    c.vis.tilt=Math.sin(t*4)*.22;
    for(let i=0;i<3;i++)if(cross(a,t,.8+i*.9)){
      const p=target(g),ang=c.yaw+(i-1)*.65,q={x:p.x+Math.sin(ang)*3,z:p.z+Math.cos(ang)*3};
      confine(q,ARENA-2);bombAt(g,q,3.1,27,.8,'ball',.2);
    }
    if(cross(a,t,3.5)){
      const p=target(g);rosette(g,p,7.2,1.0,8,23,c.seq%8);
      emit(g,'clown-juggle');
    }
  },
  // Gloves visibly close before each existing wave. Delayed alternating
  // fans, not instant damage, force a positional read.
  invertedApplause(g, c, a, t) {
    const aim=once(c,'aim',()=>({yaw:toward(g.boss,g.player)})).yaw;
    c.vis.glove=t<3.7?.25+.7*Math.abs(Math.sin(t*2.8)):.1;
    c.vis.tilt=Math.sin(t*3)*.28;
    for(let i=0;i<3;i++)if(cross(a,t,.15+i*1.25)){
      const yaw=aim+[0,.76,-.76][i];c.yaw=yaw;
      cone(g,yaw,.9,16,i===0?.48:.42,27+(i===2?5:0),'clap');
      emit(g,'clown-clap');
    }
  },
  // A volley of balls rains down around the player, alternating direct hits and a ring around them.
  ballRain(g, c, a, t) {
    once(c, 's', () => emit(g, 'clown-juggle'));
    c.vis.juggle = t < 2.7 ? 1 : 0;
    for (let i = 0; i < 7; i++)
      if (cross(a, t, 0.2 + i * 0.32)) {
        const p = target(g),
          ang = c.seq * 1.7 + i * 2.4,
          r = i % 2 ? 5.5 : 0,
          q = {x: p.x + Math.sin(ang) * r, z: p.z + Math.cos(ang) * r};
        confine(q, ARENA-2);
        bombAt(g, q, 2.2, 24, 0.85, 'ball', 0.35);
      }
  },
  // Three telegraphed hops of the whole ball toward the player; each landing crushes and sends out a ring.
  bounceChain(g, c, a, t) {
    const T = [0.5, 1.5, 2.5],
      b = g.boss;
    c.vis.crouch = 0;
    c.vis.jump = 0;
    for (let i = 0; i < 3; i++) {
      if (cross(a, t, T[i])) {
        const p = target(g),
          d = Math.max(0.001, dist(p, b)),
          reach = Math.min(d, 9),
          land = {
            x: b.x + ((p.x - b.x) / d) * reach,
            z: b.z + ((p.z - b.z) / d) * reach,
          };
        confine(land, BALL_LIMIT);
        c.f['hop' + i] = {from: {x: b.x, z: b.z}, land};
        zone(g, {
          shape: 'circle',
          x: land.x,
          z: land.z,
          r: 4.4,
          warn: 0.9,
          damage: 30,
          blast: true,
          sound: 'bounce',
        });
      }
      const h = c.f['hop' + i];
      if (!h) continue;
      if (t >= T[i] && t < T[i] + 0.45) c.vis.crouch = smooth((t - T[i]) / 0.45);
      const k = clamp((t - (T[i] + 0.45)) / 0.45, 0, 1);
      if (k > 0) {
        const x = h.from.x + (h.land.x - h.from.x) * smooth(k),
          z = h.from.z + (h.land.z - h.from.z) * smooth(k);
        c.odo += Math.hypot(x - b.x, z - b.z);
        b.x = x;
        b.z = z;
        if (k < 1) c.vis.jump = Math.sin(Math.PI * k);
      }
      if (cross(a, t, T[i] + 0.9)) {
        emit(g, 'clown-bounce');
        rosette(g, h.land, 6, 0.8, 10, 22, (c.seq + i) % 10);
      }
    }
  },
  // The clown spins on his ball and sweeps six lanes around himself one after another.
  ballSpin(g, c, a, t) {
    const b = g.boss,
      base = once(c, 'aim', () => ({yaw: toward(b, g.player)})).yaw,
      dir = c.seq % 2 ? 1 : -1;
    c.vis.tilt = Math.sin(t * 6) * 0.5;
    c.vis.stomp = Math.abs(Math.sin(t * 10));
    for (let i = 0; i < 6; i++)
      if (cross(a, t, 0.2 + i * 0.5)) {
        const yaw = base + i * (Math.PI / 3) * dir;
        c.yaw = yaw;
        zone(g, {
          shape: 'lane',
          x: b.x,
          z: b.z,
          yaw,
          len: fitLen(b, yaw, 20),
          w: 3.4,
          warn: 0.8,
          damage: 28,
          sound: 'dash',
        });
        emit(g, 'clown-stomp');
      }
  },
  // A huge ball is fired at the player; when it lands it shatters into a ring of smaller blasts.
  ballCannon(g, c, a, t) {
    once(c, 's', () => emit(g, 'clown-inflate'));
    c.vis.crouch = t < 1.2 ? smooth(t / 1.2) : 0;
    c.vis.shake = t < 1.2 ? t / 1.2 : 0;
    if (cross(a, t, 1.2)) {
      const p = target(g);
      c.f.land = p;
      bombAt(g, p, 4.2, 40, 1.1, 'head', 0.5);
    }
    if (c.f.land && cross(a, t, 2.9)) {
      emit(g, 'clown-bounce');
      rosette(g, c.f.land, 7, 0.9, 10, 24, c.seq % 10);
    }
  },
};
// A real moving body, using the same swept trajectory as the warning lane.
function crawlPart(g,c,a,t,start,key,{reach=9,anticipation=.72,travel=1.3,damage=26,angleOffset=0}={}){
 if(t<start)return;
 const b=g.boss,lane=once(c,key,()=>{
  const yaw=toward(b,g.player)+angleOffset,len=fitLen(b,yaw,reach);c.yaw=yaw;
  zone(g,{shape:'lane',x:b.x,z:b.z,yaw,len,w:BODY_R*1.8,warn:anticipation,visual:true,chargeCue:true});
  emit(g,'clown-horror',{cue:'reverse-crawl',x:b.x,z:b.z});
  return {x:b.x,z:b.z,yaw,len,hit:false,done:false};
 });
 if(lane.done)return;
 const u=t-start;c.vis.crouch=Math.max(c.vis.crouch,.9);
 c.vis.stomp=u<anticipation?.2:Math.abs(Math.sin(u*15));
 if(u<anticipation)return;
 const k=smooth((u-anticipation)/travel),old={x:b.x,z:b.z};
 const x=lane.x+Math.sin(lane.yaw)*lane.len*k,z=lane.z+Math.cos(lane.yaw)*lane.len*k;
 b.x=x;b.z=z;c.odo+=Math.hypot(x-old.x,z-old.z);c.noSeparate=u<anticipation+travel;
 const p=c.prevPlayer||g.player;
 if(!lane.hit&&segmentGap({x:0,z:0},{x:old.x-p.x,z:old.z-p.z},
  {x:x-g.player.x,z:z-g.player.z})<BODY_R*.94){
  lane.hit=true;hurt(g,damage,'crawl'+key);
 }
 if(u>=anticipation+travel)lane.done=true;
}
const HORROR_API=Object.freeze({once,zone,cone,bomb,emit,dashPart,crawlPart});
Object.assign(RUN,Object.fromEntries(Object.entries(HORROR_RUN).map(([key,fn])=>
 [key,(g,c,a,t)=>fn(g,c,a,t,HORROR_API)])));
// Vintage pattern names now use troupe choreography, never toy-ball poses.
Object.assign(RUN,Object.fromEntries(Object.entries(REMASTERED_CIRCUS_RUN).map(([key,fn])=>
 [key,(g,c,a,t)=>fn(g,c,a,t,HORROR_API)])));
export const LIVE_REPERTOIRE=Object.freeze([
 'directorBatonRake','directorVelvetStep','directorCackle','directorStringLash',
 'directorInfernalRing','directorStalkingRush','directorFinalVerdict',
 'synchronizedHush','corpseMarionetteReprise','mouthlessLament',
 'knifeJugglerRelay','midnightDrumline','tightropeExecution','maskedTrapdoor','ringmasterDoubleAct',
 'emberCarouselRevue','candlelightChoir','marionetteGallows','maskedCannonade','curtainOfLostVoices','allCastRequiem',
 'drumMarch','spotlightSweep','carousel','curtainCall',
 'ghostProcession','puppetOverture','infernalHoops','choirOfAshes','curtainStampede','midnightGrandFinale',
 'mimicMirrorExchange','acrobatKnifeWaltz','puppetMarionetteScissors',
 'choristerThroatCanon','firekeeperCinderSpiral','grandCastCounterpoint',
 'wrongTwin','mirrorStage','puppetFuneral','fireHoop','echoApplause','laughContagion','emptyAudience',
 'curtainNightmare','audienceJudgement','funeralParade','facePeelHunt','stolenFace','brokenHorses',
 'unhingedClap','vanishingAct','marionetteDevour'
]);
const DIRECTOR_SIGNATURES=new Set(RINGMASTER_ATTACK_DEFINITIONS.map(a=>a[0]));
export function choosePattern(g) {
 const c=g.clown,phase=g.boss.phase,d=dist(g.boss,g.player);
 // The close-contact shove stays a situational defensive reaction, not an
 // unfairly common attack occupying half the regular performance cycle.
 if(d<4&&c.shoveCd<=0&&c.seq>0&&c.seq%7===0&&c.last!=='shove'){
  c.seq++;return 'shove';
 }
 const stage=g.clown.horrorStage||1;
 // The old giant-ball and photograph-shooting tricks stay testable only:
 // live performance uses a coherent ensemble-centered director's repertoire.
 const repertoire=new Set(LIVE_REPERTOIRE);
 const pool=Object.keys(PATTERNS).filter(k=>repertoire.has(k)&&k!=='shove'
  &&PATTERNS[k].phases.includes(phase)&&horrorMinStage(k)<=stage);
 const close=new Set(['directorBatonRake','directorCackle','directorStringLash',
  'synchronizedHush','drumMarch','knifeJugglerRelay','maskedTrapdoor','ringmasterDoubleAct','carousel','ballSpin',
  'trapdoorWaltz','invertedApplause','puppetFuneral','lastMagic']);
 let preferred=d<5.5?pool.filter(k=>close.has(k))
  :d>12?pool.filter(k=>!close.has(k)):[];
 // Horror acts are real combat variety, not a rare one-off cutscene: prefer
 // an unread nightmare cue while respecting the shuffled full-pattern deck.
 const horror=pool.filter(k=>HORROR_PATTERNS.includes(k));
 if(horror.length&&stage>=2&&c.seq%3===0)
  preferred=[...horror.filter(k=>c.last!==k),...preferred];
 // A crawl is an unsettling punctuation mark, not the boss's main gait.
 // The exhaustive shuffle bag still guarantees every authored move.
 if(phase===2&&stage>=2&&c.seq%6===3){
  const beasts=pool.filter(k=>BEAST_PATTERNS.includes(k)&&k!==c.last&&c.seq%12===3);
  if(beasts.length)preferred=[...beasts,...preferred];
 }
 if(g.journeyBalance?.mode==='story'){
  const follow={dash:'clap',juggle:'bounce',confettiCurtain:'spotlightSweep',
   spotlightSweep:'hornFan',ballCannon:'bounceChain',
   ballRain:'ballSpin',bounceChain:'ballCannon'}[c.last];
  if(follow&&pool.includes(follow)&&
      (d>=5.5||close.has(follow))&&(d<=12||!close.has(follow))){
   preferred=[follow,...preferred];
  }
 }
 // Reserve the first available post-transformation casts for unseen horrors.
 // Without this, the final-act attacks are legal at 25% HP but are rarely
 // selected before the player kills the boss. The full shuffle bag survives.
 let premiered=false;
 if(phase===2&&stage===3){
  // Premiere the two authored climax attacks while there is still boss HP
  // to experience them; afterwards the original shuffle bag stays exhaustive.
  const debut=pool.filter(k=>['directorFinalVerdict','allCastRequiem','audienceJudgement'].includes(k)&&!(c.used?.[k]>0));
  const finale=pool.filter(k=>horrorMinStage(k)===3&&!(c.used?.[k]>0));
  if(debut.length){preferred=debut;premiered=true;}
  else if(finale.length)preferred=finale;
 }else if(phase===2&&stage===2){
  const debut=pool.filter(k=>['directorStringLash','directorStalkingRush','directorInfernalRing',
    'corpseMarionetteReprise','mouthlessLament','candlelightChoir','marionetteGallows','emberCarouselRevue'].includes(k)&&!(c.used?.[k]>0));
  if(debut.length){preferred=debut;premiered=true;}
 }
 // The director premieres his own blows before his circus steals attention.
 if(phase===1&&stage===1&&c.seq<3){
  const direct=pool.filter(k=>['directorBatonRake','directorVelvetStep','directorCackle'].includes(k)&&!(c.used?.[k]>0));
  if(direct.length){preferred=direct;premiered=true;}
 }
 // Half the ordinary combat turns belong to the living ringmaster himself,
 // not to whichever puppet happened to survive onstage. Both seeded shuffle
 // bags remain exhaustive; neither family can be spammed in succession.
 const director=pool.filter(k=>DIRECTOR_SIGNATURES.has(k));
 const supporting=pool.filter(k=>!DIRECTOR_SIGNATURES.has(k));
 let choices=pool,deck='clown-'+phase+'-act'+stage;
 if(!premiered&&director.length&&supporting.length){
  const lead=c.seq%2===0;
  choices=lead?director:supporting;
  deck+=lead?'-director':'-support';
  if(lead){
   const closeOptions=['directorBatonRake','directorStringLash','directorCackle'];
   const farOptions=['directorVelvetStep','directorStalkingRush'];
   const based=d>10?farOptions:d<7?closeOptions:[];
   preferred=[...based.filter(k=>choices.includes(k)),...preferred.filter(k=>choices.includes(k))];
  }else preferred=preferred.filter(k=>choices.includes(k));
 }
 c.seq++;
 return drawPatternShuffle(g.patternShuffle,deck,choices,{preferred,avoid:c.last});
}
export function startClownPattern(g, name) {
  if (!PATTERNS[name]) throw Error('Unknown clown pattern');
  const c = g.clown;
  c.beastRecoverAt=CRAWL_PATTERNS.includes(name)?PATTERNS[name].dur-PATTERNS[name].recover-.25:null;
  c.used ||= {};
  c.used[name] = (c.used[name] || 0) + 1;
  Object.assign(c, {
    state: 'pattern',
    name,
    pt: 0,
    f: {},
    punish: false,
    noSeparate: false,
  });
  resetVis(c);
  emit(g, 'clown-telegraph', {name: PATTERNS[name].name, key: name});
}
function finish(g) {
  const c = g.clown;
  c.last = c.name;
  // A fully completed performance has a short, readable transition before
  // any freely roaming member can start another attack. Motion continues.
  if(c.troupe)c.troupe.globalCooldown=Math.max(c.troupe.globalCooldown,.28);
  Object.assign(c, {
    state: 'idle',
    name: null,
    f: {},
    wait: Math.max(g.boss.phase===2?.64:.76,PRESSURE.wait[g.boss.phase >= 2 ? 1 : 0] *
      (g.journeyBalance?.mode==='story'?.88:1))*BOSS_TEMPO.gap,
    punish: false,
    noSeparate: false,
  });
  resetVis(c);
}
function tickClown(g, dt) {
  const c = g.clown,
    b = g.boss,
    p = g.player;
  if (c.state === 'idle') {
    c.yaw += clamp(angleDelta(c.yaw, toward(b, p)), -dt * 2.5, dt * 2.5);
    // Circus footwork is a real displacement, not a canned attack dash.
    // The player can see a side-step, a close-range withdrawal, or a chase
    // during the breathing room between performances.
    // Do not read the player's committed attack as a signal to dodge
    // away. Close-range swings must remain punishable during their windup.
    const committed=Boolean(p.action&&['attack','skill'].includes(p.action.kind)&&dist(b,p)<9);
    if(!committed){
      const motion=stepBossAutonomy(c.autonomy,b,p,dt,{
        spacing:b.phase===2?4.0:4.4,
        speed:PRESSURE.chase[b.phase===2?1:0],
        sideSpeed:b.phase===2?4.0:3.25,
        arena:BALL_LIMIT,phase:b.phase,farDistance:10.5
      });
      c.odo+=Math.hypot(motion.dx,motion.dz);
    }
    c.wait -= dt;
    // The ringmaster maintains his own tempo even while his ensemble attacks.
    if (c.wait <= 0)
      startClownPattern(
        g,
        c.hug > HUG_TIME && c.shoveCd <= 0 ? 'shove' : choosePattern(g),
      );
  } else if (c.state === 'pattern') {
    const d = PATTERNS[c.name],
      a = c.pt;
    c.pt += dt;
    // No danger object or projectile can be spawned during this authored
    // body-language introduction. The old stage timeline begins only after
    // a visible bow, glove draw-back or compressing step.
    const lead=d.precast,previous=Math.max(0,a-lead),elapsed=Math.max(0,c.pt-lead);
    if(c.pt<=lead){
      Object.assign(c.vis,clownPrecastPose(c.name,c.pt,lead));
    }else{
      // Blend the windup into each show's own rig animation. Without this
      // bridge, the drawn-back glove or crouching body would snap to idle on
      // the exact first attack frame, even though collision timing was safe.
      const channels=['crouch','glove','tilt','shake','juggle','stomp'];
      for(const key of channels)c.vis[key]=0;
      RUN[c.name](g,c,previous,elapsed);
      if(elapsed<.24){
        const anticipation=clownPrecastPose(c.name,lead,lead);
        const blend=smooth(elapsed/.24);
        for(const key of channels)c.vis[key]=anticipation[key]*(1-blend)+c.vis[key]*blend;
      }
    }
    c.punish =
      c.pt >= d.dur - d.recover &&
      !c.waves.length &&
      !c.zones.some((z) =>
        z.source !== 'troupe' &&
        z.source !== 'troupe-melee' &&
        z.source !== 'legacyEcho' &&
        (!z.visual || z.waveKind) && z.state === 'warn');
    if (c.pt >= d.dur) finish(g);
  }
}
function updateClown(g, dt) {
  const c = g.clown,
    b = g.boss,
    p = g.player;
  c.time += dt;
  c.hug = dist(p, b) < HUG_DIST ? c.hug + dt : 0;
  c.shoveCd = Math.max(0, c.shoveCd - dt);
  // Phase two continues to death, with its former 25%-HP horror crescendo.
  const nextStage=b.phase===2?(b.hp<=b.maxHp*.25?3:2):1;
  if(nextStage!==c.horrorStage){
   c.horrorStage=nextStage;
   if(nextStage===3)emit(g,'clown-phase3');
  }
  updateBombs(g, dt);
  updateZones(g, dt);
  updateWaves(g, dt);
  stepCircusTroupe(g,dt,{zone,emit,hurt});
  if (g.status !== 'playing') return;
  if (c.stunT > 0) c.stunT = Math.max(0, c.stunT - dt);
  else tickClown(g, dt);
  b.yaw = c.yaw;
  if(!c.noSeparate){
    const contact=kwonPlayerSeparation(clownHurtShapes(g),p,{radius:.42,height:1.15});
    if(contact){p.x=contact.x;p.z=contact.z;confine(p);}
  }
  c.prevPlayer = {x: p.x, z: p.z};
}
export function createClownGame(weapon = 'sword', options) {
  const g = createGame(weapon, options);
  Object.assign(g.boss, {
    x: 0,
    z: -6,
    hp: CLOWN_HP,
    maxHp: CLOWN_HP,
    state: 'clown',
    phase: 1,
    stun: 1e9,
    poise: 0,
  });
  g.player.z = 14;
  g.clown = {
    state: 'idle',
    wait: 1.4,
    pt: 0,
    name: null,
    f: {},
    last: null,
    seq: 0,
    used: {},
    zones: [],
    bombs: [],
    waves: [],
    prevPlayer: {x: g.player.x, z: g.player.z},
    stunT: 0,
    hug: 0,
    shoveCd: 0,
    punish: false,
    noSeparate: false,
    odo: 0,
    autonomy:createBossAutonomy((g.patternShuffle?.seed||1)^0x7af1b9),
    yaw: 0,
    time: 0,
    hits: [],
    vis: newVis(),
    horrorStage:1,
    beastSince:null,
    beastRecoverAt:null,
    stageBall:null,
    troupe:createCircusTroupe(g),
  };
  return g;
}
export function stepClown(g, dt, input = {}) {
  if (g.status !== 'playing') return;
  const b = g.boss,
    c = g.clown;
  dt = clamp(dt, 0, 1 / 30);
  if (b.state !== 'transition') {
    b.state = 'clown';
    b.stun = 1e9;
    b.poise = 0;
  }
  const frozen = g.hitstop > 0,
    from = g.events.length;
  baseStep(g, dt, input);
  for (let i = from; i < g.events.length; i++) {
    const e = g.events[i];
    if (e.type === 'skill-stun') c.stunT = 1;
    else if (e.type === 'phase') {
      prepareCircusPhaseTransition(g);
      Object.assign(c, {
        zones: [],
        bombs: [],
        waves: [],
        state: 'transition',
        name: null,
        f: {},
        punish: false,
        noSeparate: false,
      });
      resetVis(c);
    } else if (e.type === 'armed') {
      Object.assign(b, {state: 'clown', stun: 1e9, poise: 0});
      Object.assign(c, {
        state: 'idle',
        wait: 0.8,
        beastSince: c.time,
        used: {},
        prevPlayer: {x: g.player.x, z: g.player.z},
      });
      emit(g,'clown-phase2');
    } else if (e.type === 'victory') {
      clearCircusTroupe(g);
      Object.assign(c, {zones: [], bombs: [], waves: [], state: 'defeated'});
      resetVis(c);
    }
  }
  // Old balloon-balance physics is retired from this encounter.
  if (
    frozen ||
    g.status !== 'playing' ||
    b.state === 'transition' ||
    b.state === 'dead'
  )
    return;
  b.state = 'clown';
  b.stun = 1e9;
  b.poise = 0;
  updateClown(g, dt);
}
export function clownView(g) {
  const c = g.clown,
    b = g.boss;
  let action = ''; // Only motion, sound and physical effects reveal the attack.
  return {
    name: '광대 오슬우',
    sub: b.phase===2?'2막 · 끝나지 않는 앙코르':'1막 · 웃지 않는 광대',
    phase: b.phase,
    hp: b.hp,
    maxHp: b.maxHp,
    action,
  };
}
