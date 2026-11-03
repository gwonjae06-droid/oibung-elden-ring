# Boss BGM uploads

Place these six user-provided MP3 files in this directory (keep the exact filenames):

| Boss | Phase 1 | Phase 2 |
| --- | --- | --- |
| 긴턱의 이권재 (kwon/sword) | `swordbgm.mp3` | `swordbgm2.mp3` |
| 광대 오슬우 (clown) | `clown1.mp3` | `clown2.mp3` |
| 주사위 박성원 (dice) | `dicebgm.mp3` | `dicebgm2.mp3` |

`src/boss-tracks.mjs` plays the corresponding MP3 when each boss reaches phase 1 or phase 2.
`src/boss-music.mjs` integrates the track player with pause, mute, retries, boss changes and the original synthesized soundtrack. Missing or unsupported MP3 files fall back to the existing synthesized soundtrack where one exists (the dice boss has no synthesized score).

The MP3 recordings are not included in this commit. Upload them to this folder before expecting the new background music to play. Keep the browser sound toggle enabled. Browser autoplay policy may require a user interaction before music can start.

Prefer recordings you own or have permission to distribute.
