const SOUND_COUNT_LIMIT = 48;

export function createAudio(factory) {
  const make = factory || (() => {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    return C ? new C() : null;
  });
  let ctx = null, master = null, noiseBuf = null, enabled = false, drone = null, ends = [];
  const lastPlayed = {};

  function ensure() {
    if (ctx) return true;
    try { ctx = make(); } catch (e) { ctx = null; }
    if (!ctx) return false;
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = .55;
    master.connect(comp);
    comp.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 2);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  function envelope(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
  }

  function hasRoom(endTime) {
    const now = ctx.currentTime;
    ends = ends.filter(e => e > now);
    if (ends.length >= SOUND_COUNT_LIMIT) return false;
    ends.push(endTime);
    return true;
  }

  function tone({f, to, dur, type = 'sine', vol = .2, at = 0, attack = .005, detune = 0}) {
    const t = ctx.currentTime + at;
    if (!hasRoom(t + attack + dur + .05)) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + dur);
    if (detune) o.detune.setValueAtTime(detune, t);
    envelope(g, t, attack, vol, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + attack + dur + .05);
  }

  function noise({dur, type = 'lowpass', f = 1000, to, q = 1, vol = .2, at = 0, attack = .005}) {
    const t = ctx.currentTime + at;
    if (!hasRoom(t + attack + dur + .05)) return;
    const s = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    flt.type = type; flt.Q.setValueAtTime(q, t);
    flt.frequency.setValueAtTime(f, t);
    if (to) flt.frequency.exponentialRampToValueAtTime(to, t + attack + dur);
    envelope(g, t, attack, vol, dur);
    s.connect(flt); flt.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + attack + dur + .05);
  }

  const SOUNDS = {
    'swing-sword': () => { noise({dur: .18, type: 'bandpass', f: 900, to: 3200, q: 1.2, vol: .2}); },
    'swing-hammer': () => {
      noise({dur: .32, type: 'lowpass', f: 600, to: 180, vol: .32, attack: .08});
      tone({f: 95, to: 48, dur: .25, vol: .14, at: .1});
    },
    'swing-bow': () => {
      tone({f: 240, to: 170, dur: .22, type: 'triangle', vol: .2});
      noise({dur: .05, type: 'highpass', f: 2500, vol: .12});
    },
    'swing-cards': () => {
      for (let i = 0; i < 3; i++) noise({dur: .05, type: 'highpass', f: 3200, vol: .1, at: i * .045});
    },
    'roll': () => { noise({dur: .3, type: 'bandpass', f: 400, to: 1300, q: .8, vol: .12}); },
    'hit-boss': (o) => {
      const power = Math.min(2, Math.max(.4, (o.amount || 60) / 80));
      tone({f: 150, to: 52, dur: .2, vol: .3 * power});
      noise({dur: .09, type: 'bandpass', f: 1800, vol: .18 * power});
    },
    'hit-player': () => {
      tone({f: 115, to: 40, dur: .36, type: 'sawtooth', vol: .22});
      noise({dur: .22, type: 'lowpass', f: 900, vol: .32});
    },
    'dodge': () => { tone({f: 880, to: 1320, dur: .12, vol: .08}); },
    'healed': () => { [523, 659, 784].forEach((f, i) => tone({f, dur: .35, vol: .1, at: i * .09, type: 'triangle'})); },
    'tele-slash': () => {
      noise({dur: .55, type: 'bandpass', f: 300, to: 1500, q: 1.4, vol: .12, attack: .15});
      tone({f: 70, to: 115, dur: .55, type: 'sawtooth', vol: .07, attack: .15});
    },
    'tele-thrust': () => {
      tone({f: 60, to: 160, dur: .7, type: 'sawtooth', vol: .1, attack: .25});
      noise({dur: .7, type: 'bandpass', f: 400, to: 2200, q: 1.2, vol: .1, attack: .25});
    },
    'tele-slam': () => {
      tone({f: 45, to: 95, dur: .85, vol: .22, attack: .3});
      noise({dur: .85, type: 'lowpass', f: 200, to: 700, vol: .16, attack: .3});
    },
    'tele-whirl': () => {
      tone({f: 120, to: 280, dur: .85, type: 'square', vol: .05, attack: .3});
      for (let i = 0; i < 4; i++) noise({dur: .16, type: 'bandpass', f: 500 + i * 250, q: 2, vol: .09, at: i * .2});
    },
    'boss-slash': () => {
      noise({dur: .3, type: 'bandpass', f: 1400, to: 300, q: 1.1, vol: .3});
      tone({f: 180, to: 70, dur: .3, type: 'sawtooth', vol: .1});
    },
    'boss-thrust': () => {
      noise({dur: .5, type: 'lowpass', f: 2200, to: 400, vol: .3, attack: .03});
      tone({f: 100, to: 60, dur: .5, type: 'sawtooth', vol: .1});
    },
    'boss-slam': () => {
      noise({dur: .25, type: 'lowpass', f: 1200, to: 300, vol: .2});
      tone({f: 70, to: 30, dur: .55, vol: .42, at: .3});
      noise({dur: .45, type: 'lowpass', f: 500, to: 120, vol: .3, at: .3});
    },
    'boss-whirl': () => {
      for (let i = 0; i < 4; i++) noise({dur: .22, type: 'bandpass', f: 1500 - i * 200, to: 400, q: 1.3, vol: .26, at: i * .2});
      tone({f: 110, to: 60, dur: .8, type: 'sawtooth', vol: .1});
    },
    'phase': () => {
      tone({f: 90, to: 38, dur: 1.2, type: 'sawtooth', vol: .26, attack: .05});
      tone({f: 140, to: 58, dur: 1.2, type: 'square', vol: .08, attack: .05, detune: 14});
      noise({dur: 1.2, type: 'lowpass', f: 700, to: 140, vol: .24, attack: .05});
    },
    'stagger': () => {
      noise({dur: .25, type: 'highpass', f: 1500, vol: .24});
      tone({f: 300, to: 100, dur: .3, type: 'triangle', vol: .16});
    },
    'victory': () => {
      [392, 494, 587, 784].forEach((f, i) => tone({f, dur: .7, vol: .14, at: i * .14, type: 'triangle'}));
      tone({f: 98, dur: 1.2, vol: .12, attack: .1});
    },
    'death': () => {
      tone({f: 220, to: 55, dur: 1.4, type: 'sawtooth', vol: .18, attack: .02});
      noise({dur: 1.0, type: 'lowpass', f: 600, to: 100, vol: .2});
    },
    'ui': () => { tone({f: 620, dur: .06, vol: .06, type: 'triangle'}); }
  };

  function stopDrone() {
    if (!drone) return;
    const d = drone; drone = null;
    const t = ctx.currentTime;
    d.gain.gain.cancelScheduledValues(t);
    d.gain.gain.setValueAtTime(d.gain.gain.value || .03, t);
    d.gain.gain.linearRampToValueAtTime(.0001, t + .8);
    for (const n of d.nodes) { try { n.stop(t + .9); } catch (e) { /* already stopped */ } }
  }

  return {
    get enabled() { return enabled; },
    names: Object.keys(SOUNDS),
    setEnabled(on) {
      if (on) {
        if (!ensure()) { enabled = false; return false; }
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        enabled = true;
      } else {
        enabled = false;
        if (ctx) stopDrone();
      }
      return enabled;
    },
    play(name, opts = {}) {
      if (!enabled || !ctx) return false;
      const fn = SOUNDS[name];
      if (!fn) return false;
      const now = ctx.currentTime, min = opts.minGap === undefined ? .03 : opts.minGap;
      if (lastPlayed[name] !== undefined && now - lastPlayed[name] < min) return false;
      lastPlayed[name] = now;
      fn(opts);
      return true;
    },
    ambience(on) {
      if (!ctx) return;
      if (!on) { stopDrone(); return; }
      if (!enabled || drone) return;
      const t = ctx.currentTime, g = ctx.createGain(), flt = ctx.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.setValueAtTime(170, t);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.03, t + 1.5);
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o1.type = 'sawtooth'; o2.type = 'sawtooth';
      o1.frequency.setValueAtTime(55, t); o2.frequency.setValueAtTime(55.7, t);
      lfo.frequency.setValueAtTime(.12, t); lg.gain.setValueAtTime(55, t);
      lfo.connect(lg); lg.connect(flt.frequency);
      o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(master);
      o1.start(t); o2.start(t); lfo.start(t);
      drone = {gain: g, nodes: [o1, o2, lfo]};
    },
    get activeDrone() { return Boolean(drone); }
  };
}
