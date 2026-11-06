// A single travelling compound sword wave. Both variant silhouettes use one hitbox.
export const KWON_WAVE=Object.freeze({
 kind:'vertical-sword-wave',
 radius:2.6, // One half of the bright lateral span, for both + and X variants.
 width:5.2,
 height:5.8,
 speedFirst:18,
 speedSecond:22,
 lifetime:1.5,
 releaseRatio:.58 // The wave leaves the blade as the overhead chop reaches its apex.
});
export const KWON_WAVE_VARIANTS=Object.freeze(['plus','x']);
// Alternating casts guarantee both variants during a fight without unpredictable damage spikes.
export function nextKwonWaveVariant(last){return last==='plus'?'x':'plus';}
