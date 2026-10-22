// Compatibility adapter: existing engine/board callers now execute portrait barrages.
// Legacy state keys are retained so existing victory/death cleanup still cancels attacks.
export {groundContactFace} from './dice-ground-face.mjs';
export {stepPortraitBarrage as stepGroundSpikes} from './dice-portrait-barrage.mjs';
export {buildPortraitBarrageVisuals as buildGroundSpikeVisuals} from './dice-portrait-fx.mjs';
