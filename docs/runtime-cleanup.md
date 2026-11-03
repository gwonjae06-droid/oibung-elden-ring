# Runtime lifecycle cleanup

## Implemented

- runtime/frame-loop.mjs supplies an explicit start/stop loop. It cancels the pending RAF, deduplicates starts, rejects callbacks from older generations and stops on update errors. It is currently used by screen effects, not yet by the battle renderers.
- Screen effects now clear owned CSS on disposal, unregister listeners, permit reinstallation after disposal and update only the topmost supported battle. Covered and paused screens are cleared; returning to them does not falsely count their health reset as healing. Reduced motion replaces the pulsing low-health value with a constant. Visibility changes reset the wall-clock reference. Permanent pagehide cleans up; a persisted pagehide preserves the cached page.
- The recovery test now expects a green pulse immediately after a large heal and its removal after the lifetime. The earlier expectation that the pulse disappear on the healing frame contradicted the feature.
- bootstrapGame returns disposeFeatures(), featuresDisposed and unmanagedFeatures. Available dispose/close handles are called once in reverse ownership order; one cleanup failure does not prevent other cleanup. Unmanaged installers are reported rather than falsely marked fully disposed.

## Validation

The drafted frame-loop, screen-effect and bootstrap modules were executed in an isolated Node environment with the two test suites included in this patch: 14 tests passed, 0 failed. The screen-fx-data dependency was reconstructed from the existing helper implementation. This is targeted mocked validation, not a full checkout npm test, CI result or browser/WebGL run.

## Still pending

- disposeFeatures is NOT a full game shutdown. arena.mjs still starts its own loop on import and does not expose a renderer/session disposal handle.
- Game UI, boss music and dice-chain installers still need complete returned disposal APIs. They may appear in unmanagedFeatures. Screen effects have their own explicit handle and pagehide cleanup, but game-ui does not yet pass that handle to bootstrap.
- Shared player simulation, input/HUD/camera ownership, one audio service and old chain/portrait code removal remain separate migrations.
- Screen effects still read health and visibility from HUD DOM; eventual session state should supply these inputs directly.
