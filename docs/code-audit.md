# Casino and transition audit

## Changes in this patch

- Giant seated black patrons, gaming tables, roulette shapes, slot-machine facades and a room enclosure live in casino-room.mjs rather than being added directly to the dice model builder. Geometry and materials are shared. Mobile uses four patrons instead of eight. Decorations have no gameplay collision.
- The normal clown-to-dice transition now uses dice-entrance-view.mjs: a CSS 3D cube in its own top-layer dialog. It no longer allocates another WebGL renderer alongside the active battles. The die rolls across the viewport and flattens the underlying scene. It is a new visual implementation, not a claim that the old WebGL cutscene has been verified.
- Modal creation and animation errors settle the transition promise; a retry button remains available. Removed battles cancel the transition. Only transform, transformOrigin and filter are restored, rather than overwriting the entire style attribute.
- The casino grid test expected twice the actual coordinate count; corrected to 24 segments times six coordinates.

## Remaining technical debt

1. dice-actor.mjs still combines the die and board warning rendering. This patch extracts the new lounge only.
2. The old exported playDiceEntrance in dice-battle.mjs is retained for compatibility but is no longer used by the normal transition path. Remove it after all callers and old tests are migrated.
3. Boss progression still reads victory text via MutationObserver. Explicit engine events would be safer, but require coordinated changes across the battle engines rather than another observer patch.
4. Shared screen effects read formatted HUD values. Game state should ultimately feed them directly.
5. Old chain and portrait attack modules remain behind faceAttacks=false. Their renderers still allocate unused objects; a separate cleanup should remove those imports and update legacy tests.
6. Existing motion can visually offset a model without moving collision geometry; browser tests must check agreement.
7. Known pending test concerns: the prior screen-fx recovery test expects no green flash immediately after a large heal, contradicting the implementation; old tests also contain hard-coded balance values. These are not marked passing.

## Verification limits

Added pure layout checks and fake-DOM transition lifecycle tests. No full npm test run, real-browser WebGL/CSS rendering, GPU performance measurement or reproduction on the user's device has been performed. A confirmed fix requires playing through clown victory and into the dice battle, including cancellation, tab visibility and retry.
