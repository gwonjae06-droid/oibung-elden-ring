# Gyuwon life epilogue remake

The story, dialogue and first 147 seconds retain their existing sequence. The
post-800-HP battle completion still enters the life film without an interactive
skip path. Combat damage, phase gates and rewards are unchanged.

## Staging

- Return to reality starts inside the actual IV-to-V imagination volume. It
  reverses that camera move into the same bedroom, including its desk, calendar,
  bed and window. The existing raymarched cloud is reused.
- The life montage uses physical park, classroom, office, shop, riverside,
  wedding and family-home sets. Practical lights, cloth and wood surfaces,
  curtains, furnishings and shot-specific moving cameras replace the old stage.
- The photographed protagonist keeps his identity. Film instances own their
  materials and face geometry. Hair greys, wrinkles become visible, cheeks sag
  slightly and posture stoops as the story advances from age 26 to 58. The battle
  actor and its photograph are never modified.
- Partner and child have modeled facial features and the same connected arm,
  wrist and two-link leg hierarchy. Writing, exchanging a ring, holding the baby
  and holding the phone use shoulder/elbow reach targets. The phone follows the
  wrist in world space so inherited arm scale cannot shear its screen.
- At 147 seconds the original `playJourneyFinale` takes over: original mural
  opening, physical relic corridor, coda and credits. Its own finished promise
  authorizes the watched flag and return home. Advancing the outer film clock
  cannot bypass the corridor. Total nominal running time is 181 seconds.

Reset/disposal invalidates pending completion callbacks and disposes the old
finale. Hidden-tab gaps are excluded from the film clock. Playback uses active
real time rather than the battle's capped physics step.

## Verification (2026-11-10)

71 focused tests passed across life ending/remake, reverie, song clock, musical
route, curtain call, journey/controller and UI cleanup. Tests cover preserved
dialogue, camera boundary continuity, monotonic aging/source isolation, connected
supporting rigs, batching bounds and authoritative/cancelled finale completion.

The isolated Edge/SwiftShader harness rendered 16 desktop shots and four 844x390
shots without page or shader errors, in both full-detail and coarse modes.
Natural playback completed once in 181,249 ms; the original finale modal was
removed at completion. After the last clothing/hair and batching adjustments,
the desktop still sequence was rerendered. Full combat-to-ending gameplay and
physical mobile GPU playback have not been replayed end to end.

### Rendering cost

Same-source baseline is main a67e19b. Counts below are renderer submissions and
triangles from sampled frames, not device FPS. Increased family-shot cost comes
from three anatomical articulated actors and physical facial features replacing
the old simple supporting figures, plus furnished sets. Static scenery and rigid
head details are merged per material; rounded furnishings use bounded topology.

| Sample | Main calls / triangles | Remake calls / triangles |
| --- | ---: | ---: |
| Bedroom, 16s | 77 / 43,546 | 71 / 31,402 |
| Study, 36s | 67 / 42,734 | 68 / 42,014 |
| Office, 47s | 98 / 43,762 | 73 / 62,136 |
| Riverside, 72s | 105 / 51,222 | 123 / 116,080 |
| Wedding, 86s | 112 / 57,130 | 123 / 117,296 |
| Family, 120s | 126 / 55,770 | 192 / 163,242 |

Before head batching and furnishing topology adjustment, the new family shot
used 290 calls / 222,774 triangles; the final version uses 192 / 163,242. Coarse
mode disables shadows and uses lower-resolution actor/scenery meshes (the
three-person family sample was under 58,000 triangles before the final dress
occlusion cleanup). GPU time, overdraw and physical-device FPS remain unmeasured;
software-renderer frame cadence is not evidence of mobile smoothness.

Run the isolated browser check with `node scripts/gyuwon-life-remake-qa.cjs` after
installing Three.js and Playwright Core. `PLAYWRIGHT_PATH` and `EDGE_PATH` can
select installed runtimes. Set `GYUWON_COARSE=1` for coarse models or
`GYUWON_NATURAL=1` for an unaccelerated full playback. Reports and screenshots go
to ignored `qa-output/life-remake` directories. An optional original stage module
at `qa-output/life-remake/base-stage.mjs` enables before/after draw-count sampling.
