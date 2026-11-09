// Source-master subtitle calibration slots.
// To complete the eight-track lyric pass, fill each song with audited lines
// from the original vocal recordings, in ORIGINAL MP3 time (seconds).
// Never take cue timestamps from the 45-second edited score, or invent words.
export const GYUWON_MASTER_CAPTION_OVERRIDES=Object.freeze({
 '5':Object.freeze([]),
 '6':Object.freeze([]),
 '7':Object.freeze([]),
 '8':Object.freeze([]),
 '9':Object.freeze([]),
 '10':Object.freeze([]),
 '11':Object.freeze([]),
 ending:Object.freeze([])
});
export function gyuwonMasterCaptionOverride(key,time){
 return GYUWON_MASTER_CAPTION_OVERRIDES[key]?.find(c=>c.start<=time&&time<c.end)||null;
}
// Each cue is {start,end,en,ko}, with start/end measured against audio.currentTime.
// Single non-overlapping lines; silence and instrumentals have no lyric cue.
