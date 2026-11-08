// Routing is ready; no synthetic/chiptune substitute is used for missing music.
export const GYUWON_MUSIC_SECTIONS=Object.freeze(['arrogant-waltz','hunter','unsettling-fantasy','monster-circus','tragic-recollection','last-answer']);
export const gyuwonMusicSection=year=>Math.min(5,Math.floor((Math.max(1,Number(year)||1)-1)/2));
