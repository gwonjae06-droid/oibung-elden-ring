// Story-only balancing. Hidden routes and independent boss fights retain their original values.
export const JOURNEY_BOSS_HP_MULTIPLIER=Object.freeze({dice:1.5,blood:1.3});
export const JOURNEY_WEAKNESS_MULTIPLIER=Object.freeze({dice:1.5,blood:1.3});
export function journeyBossHp(bossId,baseHp){
 const scale=JOURNEY_BOSS_HP_MULTIPLIER[bossId]??1;
 return Math.round(baseHp*scale/10)*10;
}
export function journeyWeaknessMultiplier(game,bossId,defaultMultiplier=1){
 return game?.journeyBalance?.mode==='story'&&game.journeyBalance.boss===bossId
  ?JOURNEY_WEAKNESS_MULTIPLIER[bossId]??defaultMultiplier:defaultMultiplier;
}
