import {createEncounterStore} from './encounter-state.mjs';
import {installDevBossDamage} from './dev-boss-damage.mjs'; // TEMP DEV: remove before release.
import {installHudLayout} from './hud-layout.mjs';
// Each independently rendered arena owns its progression state.
const sessions = new WeakMap();

export function bindBattleSession(root, read) {
  if (!root || typeof read !== 'function')
    throw new TypeError('A root and state reader are required');
  const store = createEncounterStore();
  let game = null;
  const session = {
    read() {
      const state = read();
      if (state?.game?.player && state.game.boss) {
        if (game !== state.game) {
          game = state.game;
          store.register(game);
        }
        return {...state, encounter: store.read()};
      }
      return state;
    },
  };
  sessions.set(root, session);
  const disposeHud = installHudLayout(root, () => {
    const doc = root.ownerDocument || root;
    if(root === doc){
      const win=doc.defaultView;
      if(win?.Event)win.dispatchEvent(new win.Event('oibung:home'));
      return;
    }
    const current=sessions.get(root)?.read();
    if(typeof current?.close === 'function')current.close();
    else {
      const win=doc.defaultView;
      if(win?.Event)win.dispatchEvent(new win.Event('oibung:home'));
    }
  });
  // TEMP DEV: remove this installation and disposeDev call before release.
  const disposeDev = installDevBossDamage(root, () => sessions.get(root) === session ? session.read() : null);
  return () => {
    disposeHud();
    disposeDev();
    store.clear();
    game = null;
    if (sessions.get(root) === session) sessions.delete(root);
  };
}

export function readBattleSession(root) {
  return sessions.get(root)?.read() ?? null;
}
