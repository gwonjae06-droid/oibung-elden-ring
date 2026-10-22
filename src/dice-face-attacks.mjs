import {groundContactFace} from './dice-ground-face.mjs';
import {diceTempo} from './dice-pressure.mjs';
import {stepPortraitBarrage} from './dice-portrait-barrage.mjs';
import {beginChainSweep,stepChainSweep} from './dice-chain-sweep.mjs';
import {clearDiceFaceAttack} from './dice-slow.mjs';
// Both attacks share the legacy slot and all existing terminal cleanup paths.
export function stepDiceFaceAttacks(g,dt,frozen=false,edge=12,limit=65,radius=.42){
 const d=g.dice;
 if(g.status!=='playing'){clearDiceFaceAttack(g);return;}
 if(!Number.isFinite(dt)||dt<=0)return;
 d.bottomFace=groundContactFace(d.pose,edge);
 if(d.groundSpikes?.kind==='chain-sweep'){stepChainSweep(g,dt,frozen,radius);return;}
 if(d.groundSpikes){stepPortraitBarrage(g,dt,frozen,edge,limit,radius);if(!d.groundSpikes&&g.status==='playing')d.nextFaceAttack='chain';return;}
 if(d.bottomFace?.pips===0||frozen)return;
 if(d.nextFaceAttack==='chain'){
   d.spikeCooldown=Math.max(0,(d.spikeCooldown||0)-dt/diceTempo(g.boss));
   if(d.spikeCooldown===0&&d.bottomFace)beginChainSweep(g,limit);
   return;
 }
 stepPortraitBarrage(g,dt,frozen,edge,limit,radius);
}
