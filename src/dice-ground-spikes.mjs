// Compatibility adapter: combat scheduling lives in dice-face-attacks.mjs.
export {groundContactFace} from './dice-ground-face.mjs';
export {stepPortraitBarrage as stepGroundSpikes} from './dice-portrait-barrage.mjs';
import {buildPortraitBarrageVisuals} from './dice-portrait-fx.mjs';
import {buildChainSweepVisuals} from './dice-chain-fx.mjs';
export function buildGroundSpikeVisuals(THREE,root){
 const portrait=buildPortraitBarrageVisuals(THREE,root),chain=buildChainSweepVisuals(THREE,root);
 return {update(g){portrait.update(g);chain.update(g);}};
}
