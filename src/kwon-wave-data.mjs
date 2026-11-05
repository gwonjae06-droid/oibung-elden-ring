// One wide, ground-travelling vertical sword wave. Shared by hit detection and visuals.
export const KWON_WAVE=Object.freeze({
 kind:'vertical-sword-wave',
 radius:1.75, // Horizontal collision radius; artwork is at most 3.5 units wide.
 width:3.5,
 height:5.8,
 speedFirst:18,
 speedSecond:22,
 lifetime:1.5,
 releaseRatio:.58 // The wave leaves the blade as the overhead chop reaches its apex.
});
