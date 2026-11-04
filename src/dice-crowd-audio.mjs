// The old crowd used twelve sawtooth oscillators and pitch glissandos,
// which sounded like an 8-bit game rather than human voices.
// Until a permitted human-crowd recording is supplied, the crowd cue stays
// silent. The physical neck-hit and rock-crash boss recordings still play.
export function createCrowdScream(_makeAudio){
 let enabled=false;
 return {
  setEnabled(value){enabled=Boolean(value);return enabled;},
  scream(){return false;},
  get enabled(){return enabled;}
 };
}
