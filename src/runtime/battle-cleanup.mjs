import {settleCleanup,combineCleanupReports} from './cleanup-completion.mjs';

// Invoke every cleanup synchronously, even when another fails or is asynchronous.
export function createBattleCleanup(steps, {timeoutMs = 2000} = {}) {
  let completion;
  return function close() {
    if (completion) return completion;
    let finish;
    completion = new Promise(resolve => { finish = resolve; });
    let list;
    try { list = typeof steps === 'function' ? steps() : steps; }
    catch (error) { finish({errors:[{label:'Build battle cleanup',error}],timeouts:[]}); return completion; }
    const pending = list.map(([label, cleanup]) => settleCleanup(cleanup, label, {timeoutMs}));
    Promise.all(pending).then(reports => finish(combineCleanupReports(reports)));
    return completion;
  };
}
