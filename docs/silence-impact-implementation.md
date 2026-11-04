# ODENRING: Silence & Impact — implementation status

Based on the approved "오든링 — 텍스트·오디오 통합 개선 최종 기획안 v1.0".

## Implemented

- Menu copy: removed redundant English headings, persistent keyboard footer and music-autoplay explanation; retained the game's title, lore and error alerts.
- Journey reward copy: reduced repeated instructions; kept the two-choice evolution rule and mechanical descriptions.
- Story archives: preserved every recorded oath memory and made long records expandable via native `details/summary`.
- Shared combat HUD: compact player health/stamina/skill/card display and boss meter on desktop and landscape phones; retained all touch targets.
- Critical combat cues: marked lethal, stagger and weakness alerts as visible despite general notice suppression.
- Audio: master/BGM/effects/ambient/UI controls persisted under `oibung.audio.*`. Existing menu's individual volume remains separate.
- The uploaded seven BGM files, phase switching and playback paths are unchanged.
- Sample-first playback for recorded sword swings, sword skill, slash/pierce hits and Kwon's sword-based boss swings; other existing circus samples remain in use.
- Replaced the original pitched six-oscillator fight ambience with a filtered-air/noise layer.
- Removed overlapping generic hit audio when the specialized impact system is active, and removed redundant player sword/impact/heal layers.
- Existing action, damage, cooldown, boss AI, phase and checkpoint code retained.

## Not fully completed

- **Licensable sample collection**: only the existing sword, laugh, clap, jump and bomb recordings are presently available. Hammer, bow, cards, footstep, flesh/armor, casino, cathedral, phase-change and environment sample recordings still need to be sourced/created. No unlicensed third-party audio was committed.
- **Single audio event bus**: common volume settings and sample playback exist, but the legacy Web Audio, player and boss engines are not yet consolidated into one manager. Current event overlaps were reduced rather than the engines replaced wholesale.
- **Mixer polishing**: device- and headphone-specific loudness normalization and dynamic ducking have not been verified.
- **Manual mobile/desktop UX checks**: automated Node regression tests do not prove legibility, touchscreen overlap or audible quality on actual devices.

## File map

- UI: `src/journey.mjs`, `journey.css`, `style.css`, `src/game-ui.mjs`, `src/arena.mjs`, `src/dice-ui.mjs`
- Volume control: `src/audio-preferences.mjs`
- Sample manager: `src/sample-sfx.mjs`
- Main/boss music: `src/menu-theme.mjs`, `src/boss-tracks.mjs`, `src/boss-music.mjs`
- Effects: `src/audio.mjs`, `src/skill-audio.mjs`, `src/impact-audio.mjs`, `src/player-sound.mjs`, `src/player-polish.mjs`, `src/boss-sfx.mjs`, `src/feel.mjs`, `src/dice-dread-audio.mjs`
- Automated tests: `tests/audio-preferences.test.mjs`, `tests/sample-sfx.test.mjs`, existing regression suites

## Manual acceptance checklist

1. Verify all original BGM tracks (main + both phases of each of the three current bosses) still play.
2. Check settings sliders separately (master, BGM, SFX, ambient, UI, individual main theme volume).
3. Check card color and skill-ready visibility in both desktop and mobile landscape HUD.
4. Verify Sungwon's lethal crush warning, two-hand stagger meters and weakness timer stay visible.
5. Confirm boss intro and phase dialogue and the full oath memory archive remain accessible.
6. Verify touch joystick and action buttons have not shrunk.
7. Verify audio silence on mute, pause, background tab and scene exit; observe browser autoplay restrictions.
8. Check network failures of SFX files never prevent gameplay.
9. Check Chrome/Safari mobile FPS and sound balance.

Run automated checks with `npm test`. Do not claim physical-device audio QA solely from CI.
