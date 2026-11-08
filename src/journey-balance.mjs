// Authoritative HP for normal story journeys, including unlocked boss selection.
// Hidden routes and independent encounters retain their separate HP rules.
// Retained for compatibility with historical balance consumers; not applied to this table.
export const HARD_STORY_HP_SCALE=1.35;
export const JOURNEY_BOSS_HP=Object.freeze({
 kwon:4822,
 clown:5076,
 dice:5711,
 blood:6345,
 gyuwon:7000
});
export const JOURNEY_WEAKNESS_MULTIPLIER=Object.freeze({dice:1.5,blood:1.3});
export function journeyBossHp(bossId,baseHp){
 return JOURNEY_BOSS_HP[bossId]??baseHp;
}
export function journeyWeaknessMultiplier(game,bossId,defaultMultiplier=1){
 return game?.journeyBalance?.mode==='story'&&game.journeyBalance.boss===bossId
  ?JOURNEY_WEAKNESS_MULTIPLIER[bossId]??defaultMultiplier:defaultMultiplier;
}
