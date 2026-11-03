# Explicit browser bootstrap

spider-combat.html now calls bootstrapGame rather than separately starting the arena, transition UI and coop menu. bootstrap.mjs owns the installation sequence: load the entry controller and transition modules, install the entry listener, evaluate arena.mjs, install transition UI, then install game UI, boss music, dice progression and coop menu. Startup is deduplicated per document with one promise. Optional feature failures are reported without discarding other features; required failures are surfaced to the page and installed entry/transition controls are disposed. Reload the page after a required failure; automatic retry of partially evaluated arena code is intentionally not provided.

transition-data.mjs no longer imports UI code, starts dynamic imports, observes DOM nodes or registers window events. Existing timeline functions and the covered-state API are retained, so it is browser-side-effect-free on import but not entirely stateless. The legacy string-based shouldStartTransition helper remains for compatibility; active progression does not use it.

clown-entry-controller.mjs explicitly installs and removes the weapon-selection listener, validates the event source and weapon, deduplicates requests and prevents stale imports from opening a closed or replaced transition. It restores the source controls on failure or battle close and supports disposal. The redundant transition-label MutationObserver was removed instead of moved; common UI owns label presentation.

This is initialization separation, not full session ownership. arena.mjs still starts a render loop when imported. Some feature installers do not yet expose complete disposal. Other preview pages remain standalone. Next work should make battle construction and shutdown explicit and consolidate input, HUD, audio and resource ownership.

Added mocked startup/controller tests, a hostile-browser-global import test for transition data and updated coop wiring tests. Tests and real-browser startup have not been executed here. Check main startup, both boss transitions, entry failures, retries and the preview page after applying.
