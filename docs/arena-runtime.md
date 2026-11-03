# Arena runtime controller: foundation only

## Status

createArenaRuntime in src/runtime/arena-runtime.mjs is a dependency-injected lifecycle controller. This commit does not import it from arena.mjs or change bootstrap.mjs. The running game still has its original automatically started main render loop. Existing runtime-cleanup.md warnings about the lack of a main arena disposal API therefore remain applicable.

## Contract

- start() deduplicates starts and cannot restart a disposed controller. stop() cancels pending frames and invalidates stale callbacks through createFrameLoop. onStart may reset the simulation timestamp; onStop supplies game-specific input and pause cleanup. stop() does not remove listeners, cancel timers or close audio.
- dispose() is idempotent. It stops frames, unregisters owned listeners, cancels owned timers, runs onDispose, releases resources discoverable in the supplied scene plus explicitly registered extras, closes contexts created through makeAudioContext(), clears the scene and disposes renderer render lists and renderer. Individual cleanup failures are reported without preventing later cleanup. Context close requests are asynchronous; dispose() does not await their completion.
- listen(), setTimeout(), capture()/release(), own(), and makeAudioContext() only manage resources registered through this controller. They do not discover unrelated browser registrations or hidden resources.
- load(loader, install) suppresses installation after disposal. It does not cancel an in-flight import or automatically control asynchronous work started inside install.
- A persisted pagehide retains the controller for browser caching; permanent pagehide disposes it.
- The supplied scene and renderer must be exclusively owned. Resource discovery covers geometries, materials, direct material textures, texture uniforms, scene background/environment textures and light shadow render targets. It is not a generic deep scan of arbitrary resource graphs. Register detached resources and textures explicitly with own().

## Validation

Six targeted Node tests passed in an isolated local directory using injected window, scene, renderer and audio mocks, plus a copy of the existing frame-loop implementation. Coverage: duplicate starts and stale frames; timers/listeners/audio and shared-resource deduplication; late module completion; pointer capture release; persisted/permanent pagehide; cleanup failure isolation. The error emitted by the final test is intentional. This is not the full repository npm test or a real browser/WebGL test.

## Next integration

Wire arena.mjs frame scheduling, listeners, timers, pointer capture, lazy module installation and its two directly created audio backends to this controller. Export the resulting handle and have bootstrap dispose optional features before that handle. Preserve current startup behavior initially; explicit session construction and remounting can follow separately. Audit nested effect/audio modules and secondary battle ownership before claiming full game shutdown.
