import {DICE_BOARD,DICE_RULES as R,diceDirection,nearestDiceTile} from './dice-data.mjs';
// Sungwon is a rigid cube: his autonomous movement must be physical,
// individually telegraphed rolls between neighbouring tiles, never a hidden
// sliding translation. At close/mid range he circles instead of always rolling
// straight into the same square; at long range he still pursues the player.
export function nextDiceRoamTile(d,player){
 const index=d.index,from=DICE_BOARD[index];
 if(!from||!player||!Number.isFinite(player.x)||!Number.isFinite(player.z))return index;
 const goal=nearestDiceTile(player),direct=diceDirection(index,goal);
 const possible=[1,-1,R.side,-R.side].filter(delta=>{
  const tile=DICE_BOARD[index+delta];
  return Boolean(tile&&Math.abs(tile.x-from.x)+Math.abs(tile.z-from.z)===R.edge);
 });
 if(!possible.length)return index;
 if(d.frenzyRemaining>0||Math.hypot(player.x-from.x,player.z-from.z)>R.edge*3.1)
  return index+(possible.includes(direct)?direct:possible[0]);
 const k=(d.moves||0)+(d.roamBias||0);
 // Two closing steps for every orbiting step; preserve a fixed footprint
 // and physical wall limits rather than inventing a diagonal attack.
 const flank=k%3===2;
 if(!flank&&possible.includes(direct))return index+direct;
 const side=[R.side,-R.side].includes(direct)?[1,-1]:[R.side,-R.side];
 const order=k%2?[...side].reverse():side;
 const lateral=order.find(delta=>possible.includes(delta)&&index+delta!==d.roamPrevious);
 const chosen=lateral??(possible.includes(direct)?direct:possible[0]);
 return index+chosen;
}
