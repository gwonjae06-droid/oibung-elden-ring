// Visual telegraphs must never be the authoritative damage shape.
// Normal attacks are read from the boss pose or physical projectile.
// Large attacks gain environmental cues rather than exact coloured hitbox overlays.
export const KWON_ENVIRONMENT=new Set(['slam','leap','stomp','whirl','wave']);
export const CLOWN_SPECTACLES=new Set(['tripleBomb','confettiCurtain','spotlightSweep','fireHoop','humanCannon','curtainCall','lastClap','drumMarch','balloonBouquet','ballRain','bounceChain','ballCannon','carousel','ballSpin']);
export const BLOOD_ENVIRONMENT=new Set(['fountain','burst','chain','orbit','vortex','dive','eclipse','rain','pulse','pursuit','tide']);
export function kwonEnvironmentCue(zone,pattern){
 return zone?.active===false&&KWON_ENVIRONMENT.has(pattern)?'stone-tremor':null;
}
export function clownEnvironmentCue(zone,pattern,hasVisibleBomb=false){
 if(!zone||zone.state==='burst'||zone.visual||zone.waveKind||hasVisibleBomb)return null;
 return CLOWN_SPECTACLES.has(pattern)?'stage-light':null;
}
export function diceEnvironmentCue(hazard,giant){
 if(!hazard||!giant)return null;
 if(hazard.live)return null;
 if(hazard.headSlam||hazard.handIndex!==null&&hazard.handIndex!==undefined)return 'falling-shadow';
 return giant.slot===6||giant.temperament==='feral'&&[4,6,8].includes(giant.slot)?'casino-glint':null;
}
export const bloodEnvironmentCue=pattern=>BLOOD_ENVIRONMENT.has(pattern)?'blood-coalescence':null;
