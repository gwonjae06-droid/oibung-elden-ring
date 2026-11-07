let encounterSerial = 0;
export function createEncounterStore() {
  let current = null;
  function register(game) {
    if (!game || typeof game !== 'object' || !game.player || !game.boss)
      throw new TypeError('Invalid encounter state');
    current = {id: ++encounterSerial, game};
    return game;
  }
  function read() {
    if (!current) return null;
    const {id, game} = current,
      bossId = game.gyuwon ? 'gyuwon' : game.blood ? 'blood' : game.dice ? 'dice' : game.clown ? 'clown' : 'kwon',
      status = game.status;
    const outcome =
      status === 'won' ? 'won' : status === 'lost' ? 'lost' : null;
    const stats = Object.freeze({...game.stats});
    return Object.freeze({
      encounterId: id,
      bossId,
      status,
      outcome,
      weapon: game.weapon,
      time: game.time,
      stats,
    });
  }
  function canAdvance(bossId, presentationReady = true, expectedId) {
    const state = read();
    return Boolean(
      presentationReady &&
        state &&
        state.bossId === bossId &&
        state.outcome === 'won' &&
        (expectedId === undefined || state.encounterId === expectedId),
    );
  }
  function clear() {
    current = null;
  }
  return Object.freeze({register, read, canAdvance, clear});
}
export const encounterStore = createEncounterStore();
export function registerEncounter(game) {
  return encounterStore.register(game);
}
