// Associates each independently rendered arena with its live combat state.
const sessions = new WeakMap();

export function bindBattleSession(root, read) {
  if (!root || typeof read !== 'function') throw new TypeError('A root and state reader are required');
  const session = {read};
  sessions.set(root, session);
  return () => { if (sessions.get(root) === session) sessions.delete(root); };
}

export function readBattleSession(root) {
  return sessions.get(root)?.read() ?? null;
}
