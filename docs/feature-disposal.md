# Music and dice progression lifecycle

Both installBossMusic and installDiceChain now return idempotent dispose handles. bootstrapGame already collects returned feature handles, so its disposeFeatures method can now release these two features rather than listing them as unmanaged.

Music disposal cancels the 80ms timer, removes gesture/focus/visibility/pagehide handlers and disposes the music backend. A queued gesture microtask checks disposal before unlocking audio. Registration is per document and can be installed again after disposal. A cached-page pagehide only resets playback. Dice battle selection suppresses the first two bosses' music; this does not add a new dice soundtrack. The synthesis/scoring implementation is unchanged.

Dice progression disposal disconnects both DOM observers, cancels a pending entrance, removes its button and gesture/pagehide handlers and closes its own captured audio contexts. Deferred battle imports recheck disposal through the existing readiness and encounter ticket guards, so they cannot launch a stale battle. Independent cleanup operations continue even if one fails. Disposing progression does not itself close an already launched dice battle; the battle owns that view.

Validation: eight targeted lifecycle checks passed in an isolated Node environment. Audio/music and cutscene dependencies were injected mocks; encounter/gate helper dependencies were reconstructed for the isolated run. This is not a full repository npm test, real-browser or audio synthesis validation. The repository test file uses the real modules and injectable backends.

Still pending: arena.mjs automatic startup, a main renderer start/stop/dispose API, Game UI and all nested effect disposal, shared player simulation, input/HUD/camera modules, unified audio, removal of deprecated attacks. This patch completes two background feature handles only and does not claim full game shutdown.
