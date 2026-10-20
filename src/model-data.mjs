const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const LEG_ROOT_Y = 2.0;
const LEG_Z = [1.4, .5, -.5, -1.6];
const LEG_FAN = [.75, .28, -.28, -.75];

export function legPlan() {
  const legs = [];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      legs.push({
        index: legs.length, side, k,
        root: [side * 1.15, LEG_ROOT_Y, LEG_Z[k]],
        yaw: side * LEG_FAN[k],
        points: [[0, 0, 0], [side * 1.6, 1.2, .5], [side * 3.2, -.5, 1.0], [side * 3.9, -LEG_ROOT_Y, 1.3]]
      });
    }
  }
  return legs;
}

export function legFootWorld(leg) {
  const [x, y, z] = leg.points[3], c = Math.cos(leg.yaw), s = Math.sin(leg.yaw);
  return [leg.root[0] + x * c + z * s, leg.root[1] + y, leg.root[2] - x * s + z * c];
}

export function gait(leg, phase, speed) {
  const group = (leg.k + (leg.side > 0 ? 1 : 0)) % 2;
  const ph = phase + (group ? Math.PI : 0) + leg.k * .35;
  const s = Math.min(speed, 14);
  return {yaw: Math.sin(ph) * (.05 + s * .022), lift: Math.max(0, Math.cos(ph)) * (.02 + s * .014)};
}

export function walkPose(phase, speed) {
  const s = Math.min(1, speed / 5), sw = Math.sin(phase) * .7 * s;
  return {legL: sw, legR: -sw, armL: -sw * .8, armR: sw * .8, bob: Math.abs(Math.sin(phase)) * .06 * s, lean: .08 * s};
}

export function capeSway(i, time, speed) {
  return -(.06 + .05 * i + Math.min(speed, 8) * .02) + Math.sin(time * 3 + i) * .03;
}

export function weaponAngle(a) {
  const rest = a.total - a.wind - a.active;
  if (a.t < a.wind) return -1.5 * (a.t / a.wind);
  const k = clamp((a.t - a.wind) / a.active, 0, 1);
  if (k < 1) return -1.5 + 2.9 * k;
  return 1.4 * (1 - clamp((a.t - a.wind - a.active) / Math.max(rest, .01), 0, 1));
}

export function ellipsoidPoint(c, r, x, z) {
  const u = 1 - ((x - c[0]) / r[0]) ** 2 - ((z - c[2]) / r[2]) ** 2;
  const y = c[1] + r[1] * Math.sqrt(Math.max(0, u));
  const n = [(x - c[0]) / (r[0] * r[0]), (y - c[1]) / (r[1] * r[1]), (z - c[2]) / (r[2] * r[2])];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  return {point: [x, y, z], normal: [n[0] / len, n[1] / len, n[2] / len], inside: u >= 0};
}

export function ringAt(c, r, z) {
  const k = Math.sqrt(Math.max(0, 1 - ((z - c[2]) / r[2]) ** 2));
  return {rx: r[0] * k, ry: r[1] * k, y: c[1], z};
}

export function onSphere(center, r, dir) {
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  return [center[0] + dir[0] / len * r, center[1] + dir[1] / len * r, center[2] + dir[2] / len * r];
}
