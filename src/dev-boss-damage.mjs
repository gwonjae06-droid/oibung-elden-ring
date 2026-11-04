// TEMP DEV EASTER EGG: remove this module and its battle-session wiring before release.
const AMOUNT = 500;
const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;
function damageStandard(g) {
  const b = g.boss;
  if (!Number.isFinite(b?.hp) || b.hp <= 0 || b.state === 'transition') return;
  const n = Math.min(AMOUNT, b.hp);
  b.hp -= n;
  if (g.stats) { g.stats.damage += n; g.stats.hits++; }
  g.events.push({type: 'boss-hit', amount: Math.round(n), big: true, developer: true});
  if (b.hp <= 0) {
    b.hp = 0; b.state = 'dead'; b.queue = [];
    g.status = 'won'; g.projectiles = []; g.bossShots = [];
    if (g.clown) Object.assign(g.clown, {zones: [], bombs: [], waves: [], state: 'defeated'});
    g.events.push({type: 'victory'});
  } else if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
    Object.assign(b, {phase: 2, state: 'transition', t: 0, queue: [], poise: 0, stun: 0, punishable: false});
    g.projectiles = []; g.bossShots = []; g.player.action = null;
    if (g.clown) Object.assign(g.clown, {zones: [], bombs: [], waves: [], state: 'transition', name: null, f: {}, punish: false, noSeparate: false});
    g.events.push({type: 'phase'});
  }
}
function applyDamage(g) {
  if (g.dice) {
    import('./dice-combat.mjs').then(m => m.damageDice(g, AMOUNT)).catch(error => console.error('Dev damage failed', error));
    return;
  }
  damageStandard(g);
}
export function installDevBossDamage(root, read) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView;
  if (!win?.addEventListener) return () => {};
  function onKey(event) {
    if (event.code !== 'Semicolon' || event.shiftKey || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.composedPath?.().some(el => el?.isContentEditable || TEXT_INPUT.test(el?.tagName || ''))) return;
    const host = root.host;
    if (host) {
      if (!host.closest?.('dialog')?.open) return;
    } else if (doc.querySelector?.('dialog#clown-battle[open], dialog#dice-battle[open]')) return;
    const state = read(), g = state?.game;
    if (!state?.active || g?.status !== 'playing' || !g.boss) return;
    event.preventDefault();
    applyDamage(g);
  }
  win.addEventListener('keydown', onKey, true);
  return () => win.removeEventListener('keydown', onKey, true);
}
