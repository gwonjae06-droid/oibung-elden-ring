import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/audio.mjs';

function fakeContext() {
  const log = {starts: 0, stops: 0, osc: 0, sources: 0, gains: 0, filters: 0, ramps: 0, errors: []};
  const param = (v = 0) => ({
    value: v,
    setValueAtTime(x, t) { if (!Number.isFinite(x) || !Number.isFinite(t)) log.errors.push('setValueAtTime ' + x + ' ' + t); this.value = x; },
    linearRampToValueAtTime(x, t) { if (!Number.isFinite(x) || !Number.isFinite(t)) log.errors.push('linear ' + x + ' ' + t); log.ramps++; },
    exponentialRampToValueAtTime(x, t) { if (!(x > 0) || !Number.isFinite(t)) log.errors.push('exp ' + x + ' ' + t); log.ramps++; },
    cancelScheduledValues() {}
  });
  const node = (extra) => Object.assign({connect() {}, disconnect() {}}, extra);
  const ctx = {
    currentTime: 0, state: 'running', sampleRate: 8000, destination: node(),
    resumed: 0, resume() { this.resumed++; },
    createDynamicsCompressor: () => node({}),
    createGain: () => { log.gains++; return node({gain: param(1)}); },
    createBuffer: (c, len) => ({getChannelData: () => new Float32Array(len)}),
    createOscillator: () => { log.osc++; return node({type: '', frequency: param(), detune: param(), start() { log.starts++; }, stop() { log.stops++; }}); },
    createBufferSource: () => { log.sources++; return node({buffer: null, loop: false, start() { log.starts++; }, stop() { log.stops++; }}); },
    createBiquadFilter: () => { log.filters++; return node({type: '', frequency: param(), Q: param()}); }
  };
  return {ctx, log};
}

test('every sound plays without invalid audio parameters', () => {
  const {ctx, log} = fakeContext();
  const a = createAudio(() => ctx);
  assert.equal(a.setEnabled(true), true);
  assert.ok(a.names.length >= 20);
  for (const name of a.names) {
    ctx.currentTime += 1;
    const before = log.starts;
    assert.equal(a.play(name, {amount: 120}), true, name);
    assert.ok(log.starts > before, name + ' scheduled nothing');
  }
  assert.deepEqual(log.errors, []);
  assert.equal(log.starts, log.stops);
});

test('disabled audio is silent and never creates a context', () => {
  let made = 0;
  const a = createAudio(() => { made++; return fakeContext().ctx; });
  assert.equal(a.play('ui'), false);
  a.ambience(true);
  assert.equal(made, 0);
  assert.equal(a.enabled, false);
});

test('missing Web Audio support leaves audio off instead of throwing', () => {
  const a = createAudio(() => null);
  assert.equal(a.setEnabled(true), false);
  assert.equal(a.enabled, false);
  assert.equal(a.play('ui'), false);
  const b = createAudio(() => { throw new Error('blocked'); });
  assert.equal(b.setEnabled(true), false);
});

test('unknown sound names are ignored and rapid repeats are throttled', () => {
  const {ctx, log} = fakeContext();
  const a = createAudio(() => ctx);
  a.setEnabled(true);
  assert.equal(a.play('does-not-exist'), false);
  assert.equal(a.play('ui'), true);
  const starts = log.starts;
  assert.equal(a.play('ui'), false);
  assert.equal(log.starts, starts);
  ctx.currentTime += .1;
  assert.equal(a.play('ui'), true);
});

test('suspended contexts are resumed when audio is enabled', () => {
  const {ctx} = fakeContext();
  ctx.state = 'suspended';
  createAudio(() => ctx).setEnabled(true);
  assert.equal(ctx.resumed, 1);
});

test('ambience starts once, stops cleanly, and stops when audio is disabled', () => {
  const {ctx, log} = fakeContext();
  const a = createAudio(() => ctx);
  a.setEnabled(true);
  a.ambience(true);
  assert.equal(a.activeDrone, true);
  const osc = log.osc;
  a.ambience(true);
  assert.equal(log.osc, osc, 'a second start must not stack drones');
  a.ambience(false);
  assert.equal(a.activeDrone, false);
  a.ambience(true);
  assert.equal(a.activeDrone, true);
  a.setEnabled(false);
  assert.equal(a.activeDrone, false);
  assert.equal(a.play('ui'), false);
  assert.deepEqual(log.errors, []);
});

test('a flood of sounds is capped, then recovers once they have finished', () => {
  const {ctx, log} = fakeContext();
  const a = createAudio(() => ctx);
  a.setEnabled(true);
  for (let i = 0; i < 400; i++) a.play('phase', {minGap: 0});
  assert.ok(log.starts <= 60, 'too many voices: ' + log.starts);
  ctx.currentTime += 10;
  const before = log.starts;
  assert.equal(a.play('ui', {minGap: 0}), true);
  assert.ok(log.starts > before);
});
