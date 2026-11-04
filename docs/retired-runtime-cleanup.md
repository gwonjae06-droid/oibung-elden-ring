# Retired runtime cleanup (2026-11-04)

The public page `spider-combat.html` uses `data-journey="1"` and the three-boss journey controller. This patch trims retired initialization and GPU allocations without changing active boss mechanics.

## Changed

- `bootstrap.mjs` skips the old direct-boss entry controller, boss-transition UI installer, dice-chain observer, and legacy co-op chooser for the current journey. The non-journey compatibility path remains.
- `clown-entrance.mjs` owns the live clown entrance renderer. `journey-transition.mjs` imports it directly, while the old transition module re-exports it for compatibility.
- The old `playDiceEntrance` extra-WebGL cutscene and its obsolete `diceEntranceRoll` helper and corresponding legacy tests were removed. Current CSS 3D `dice-entrance-view.mjs` is unchanged.
- `dice-actor.mjs` no longer allocates unused portrait-card and chain-sweep visual objects on a live dice board (`faceAttacks` is false by default).
- The old dialog stylesheet is no longer requested by the current public page.
- Removed an unused one-byte `src/sound` file.

## Deliberately retained

- Legacy face-attack logic and tests remain opt-in test/compatibility code. Full removal requires replacing tests that explicitly set `faceAttacks=true`; this patch removes its unnecessary live Three.js resource creation, not the synchronous battle contract.
- `game-ui.mjs` includes compatibility UI but is still responsible for live shared HUD/visual effects; do not delete it.
- `boss-transition.mjs` and `boss-transition.css` are preserved for non-journey compatibility.
- Co-op server/client implementation remains for future support; the old chooser is not initialized by the journey.
- `clown-preview.html` is a separate optional development preview.
- Current music, image assets, portrait texture, and sound samples must remain.

## Verification

Run `npm test` with Node 20+, followed by browser checks for the three-boss journey, phase transitions, weapon changes, music, scene disposal and mobile controls. Unit tests do not verify WebGL and audio performance.
