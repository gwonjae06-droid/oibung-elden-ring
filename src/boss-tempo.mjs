// Shared boss pacing; keep windup animation and damage cues on one clock.
export const BOSS_TEMPO=Object.freeze({
 gap:.72,      // 28% shorter downtime between patterns
 windup:.90,   // 10% shorter visible anticipations, subject to cue floors
 recovery:.78, // 22% shorter recovery, subject to punish floors
});
