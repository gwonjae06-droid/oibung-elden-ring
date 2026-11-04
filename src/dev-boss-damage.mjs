import {battleDialogSelector} from './battle-dialogs.mjs';
import {applyBossDamage} from './boss-damage.mjs';
// TEMP DEV EASTER EGG: remove this module and its battle-session wiring before release.
const AMOUNT = 500;
const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;
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
    } else if (doc.querySelector?.(battleDialogSelector())) return;
    const state = read(), g = state?.game;
    if (!state?.active || g?.status !== 'playing' || !g.boss) return;
    event.preventDefault();
    applyBossDamage(g, AMOUNT).catch(error => console.error('Dev damage failed', error));
  }
  win.addEventListener('keydown', onKey, true);
  return () => win.removeEventListener('keydown', onKey, true);
}
