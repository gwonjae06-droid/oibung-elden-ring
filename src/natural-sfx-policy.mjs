// Never generate pitched retro/8-bit effects in the live game.
// Leave only short, unpitched filtered-noise foley for events that still lack
// a licensed recording. Boss attacks and player weapons use recorded samples.
export const NOISE_ONLY_SFX=Object.freeze({
 'hit-player':Object.freeze([
  Object.freeze(['n',450,135,.15,.20,'lowpass',0,.009]),
  Object.freeze(['n',1100,460,.065,.055,'bandpass',0,.004])
 ]),
 roll:Object.freeze([Object.freeze(['n',940,260,.18,.085,'lowpass'])]),
 dodge:Object.freeze([Object.freeze(['n',2500,700,.085,.055,'bandpass'])])
});
export const RETRO_SYNTH_DISABLED=true;
