# Boss BGM uploads

Boss music files in this directory (keep the exact filenames):

| Boss | Phase 1 | Phase 2 |
| --- | --- | --- |
| 긴턱의 이권재 (kwon/sword) | `swordbgm.mp3` | `swordbgm2.mp3` |
| 광대 오슬우 (clown) | `clown1.mp3` | `clown2.mp3` |
| 주사위 박성원 (dice) | `dicebgm.mp3` | `dicebgm2.mp3` |
| 영원한 혈왕 배서준 (blood) | `bloodbgm1.mp3` | `bloodbgm2.mp3` |

`src/boss-tracks.mjs` plays the corresponding MP3 when each boss reaches phase 1 or phase 2.
`src/boss-music.mjs` integrates the track player with pause, mute, retries and boss changes. The generated soundtrack is deliberately disabled while external MP3 boss tracks are used; missing MP3 files do not start a synthetic replacement.

The MP3 recordings for the four playable bosses are present in this folder. Keep the browser sound toggle enabled. Browser autoplay policy may require a user interaction before music can start.

Prefer recordings you own or have permission to distribute.

Blood transformation fades phase one to silence, plays the uploaded womanvoice/bell effects once, then starts bloodbgm2 at its 1.8-second lead-in at cinematic time 3.8 seconds. It releases phase one before starting phase two. See `docs/blood-cinematic-quality.md` for the measured cue sheet.
