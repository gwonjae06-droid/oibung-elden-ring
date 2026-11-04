import {beginGiant,beginFeral} from './dice-giant.mjs';
export const DICE_PHASE_FRACTIONS=Object.freeze({second:2/3,third:1/3});
export function diceTempo(boss){
 const ratio=Number.isFinite(boss.hp)&&Number.isFinite(boss.maxHp)&&boss.maxHp>0?Math.max(0,Math.min(1,boss.hp/boss.maxHp)):1;
 return .65+.35*ratio;
}
export function syncDiceClock(g){const d=g.dice;if(d.clockState!==d.state){d.clockState=d.state;d.tempo=diceTempo(g.boss);}return d.tempo;}
export function updateDicePhase(g){
 if(g.status!=='playing'||g.boss.hp<=0||!(g.boss.maxHp>0))return false;
 if(g.boss.phase===1&&g.boss.hp<=g.boss.maxHp*DICE_PHASE_FRACTIONS.second){
  g.boss.phase=2;g.boss.phase2PendingDesign=!g.dice.giantEnabled;
  if(g.dice.giantEnabled)beginGiant(g);
  g.events.push({type:'dice-phase-change',phase:2,pendingDesign:!g.dice.giantEnabled});return true;
 }
 if(g.boss.phase===2&&g.boss.hp<=g.boss.maxHp*DICE_PHASE_FRACTIONS.third){
  g.boss.phase=3;if(g.dice.giant)beginFeral(g);
  g.events.push({type:'dice-phase-change',phase:3});return true;
 }
 return false;
}
