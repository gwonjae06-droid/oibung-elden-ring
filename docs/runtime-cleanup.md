# Runtime lifecycle cleanup

## Implemented

- runtime/frame-loop.mjs supplies an explicit start/stop loop. It cancels the pending RAF, deduplicates starts, rejects callbacks from older generations and stops on update errors. It is currently used by screen effects, not yet by the battle renderers.
- Screen effects clear owned CSS on disposal, unregister listeners, permit reinstallation after disposal and update only the topmost supported battle. Covered and paused screens are cleared; returning to them does not falsely count their health reset as healing. Reduced motion replaces the pulsing low-health value with a constant. Visibility changes reset the wall-clock reference. Permanent pagehide cleans up; a persisted pagehide preserves the cached page.
- Game UI now returns a disposer that disconnects its observers, cancels queued work and intro timers, closes chooser dialogs, skips active intro overlays, restores the pause state and its brand handlers, and disposes the screen-effect handle even if its import resolves after shutdown. It also undoes the UI nodes and labels it changes where practical. It does not undo every arbitrary third-party DOM change.
- bootstrapGame collects the Game UI disposer alongside other available feature handles. It still reports features that do not implement disposal.

## Validation

The screen-effect and bootstrap lifecycle tests were run with isolated Node mocks: 14 tests passed in that targeted suite at the previous step. The new disposer-scope and UI wiring tests have not yet been run. No full repository npm test or real browser/WebGL validation has been run.

## Still pending

- disposeFeatures is NOT a full game shutdown. arena.mjs still starts its own render loop on import and does not expose a renderer/session disposal handle.
- Game UI cleanup releases its listeners, observers, scheduled work and its owned overlays, but it does not restore every cosmetic DOM mutation or reverse every CSS change.
- Boss music and dice-chain now expose disposal handles; other feature/effect installers may still retain resources.
- Shared player simulation, input/HUD/camera ownership, one audio service and old chain/portrait code removal remain separate migrations.
- Screen effects still read health from HUD DOM; eventual session state should supply it directly.
