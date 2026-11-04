// TEMP DEV EASTER EGG: remove this module and its battle-session wiring before release.
export function installDevBossDamage(root, read) {
  const win = (root.ownerDocument || root).defaultView;
  if (!win?.addEventListener) return () => {};
  function onKey(event) {
    if (event.key !== ';' || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented) return;
    if (event.composedPath?.().some(el => el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || ''))) return;
    const state = read();
    const g = state?.game, b = g?.boss;
    if (!state?.active || g?.status !== 'playing' || !Number.isFinite(b?.hp) || b.hp <= 0 || b.state === 'transition') return;
    event.preventDefault();
    const amount = Math.min(500, b.hp);
    b.hp -= amount;
    if (g.stats) { g.stats.damage += amount; g.stats.hits++; }
    g.events.push({type: 'boss-hit', amount, big: true, developer: true});
    if (b.hp === 0) {
      b.state = 'dead';
      b.queue = [];
      g.status = 'won';
      g.projectiles = [];
      g.bossShots = [];
      g.events.push({type: 'victory'});
    }
  }
  win.addEventListener('keydown', onKey);
  return () => win.removeEventListener('keydown', onKey);
}
