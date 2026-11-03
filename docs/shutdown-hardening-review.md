# Integrated shutdown hardening

This revision groups five runtime/UI source updates and two test updates rather than treating each symptom as a separate migration. It preserves the existing bootstrap Promise, its per-document cache and disposeFeatures alias. The optional AbortSignal belongs to the first bootstrap call for that document. Cancellation rejects startup with AbortError. It does not implement same-document remounting.

Startup now observes permanent pagehide and AbortSignal before awaited loads. Late arena handles are released, installed optional features are tracked immediately and not-yet-installed optional features are skipped after cancellation. Cleanup is deduplicated and ordered features, transition, entry, arena. A module body already being evaluated cannot be undone; its returned handle is reclaimed.

Game UI rechecks navigation validity after a boss import, owns battle handles it launches, rejects stale screen-effect installation after UI replacement, keeps root-local cleanup scopes, deduplicates cosmetic snapshots, disconnects removed shadow roots and restores pause state when an intro is cancelled. Failed initial installation rolls back. Cancelled scope entries are removed from the Set rather than retained until final disposal.

Arena runtime releases pointer captures on frame errors, deduplicates stop notifications, continues teardown after a cancellation error, prevents a disposal performed inside onStart from scheduling a frame, and searches detached owned materials and nested/cyclic uniform objects for textures. Frame cancellation clears the stored handle before calling the cancellation backend.

Validation performed before this commit proposal: 21 tests passed in an isolated Node directory (15 new shutdown regressions, four disposer lifecycle tests, two existing bootstrap-lifecycle tests copied from the repository). Modified JS files passed node --check. DOM/window/renderer/audio were doubles. The Game UI imports for restoreBossName and default playBossIntro were minimal isolation stubs, and the intro test explicitly injected playIntro. Those stubs are not repository changes. Default intro animation and name restoration were not validated. The previous UI source-string ownership assertion is replaced by a disposer behavior test; actual UI ownership behavior is checked by the new regression suite.

Not performed: full repository npm test, real browser/Three.js/audio execution, GPU/audio leak measurement, server connections or real BFCache validation.

Still open: final release of the global boss-sfx AudioContext and preloaded HTMLAudio pools; hidden resources and async work in skill/environment/player effects; exception-safe teardown and retained handlers in secondary battle sessions, including dice-battle; explicit main session construction and same-document remounting. This revision does not claim all game errors or complete game shutdown have been resolved.
