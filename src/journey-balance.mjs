// Story-only balancing. Hidden routes and independent boss fights retain their original values.
// Hard story: precisely +35% over the previous story HP, rounded to integers.
// Secret routes and independent bosses continue to use their original HP.
export const HARD_STORY_HP_SCALE=1.35;
const PREVIOUS_STORY_HP=Object.freeze({kwon:3572,clown:3760,dice:4230,blood:4700});
export const JOURNEY_BOSS_HP=Object.freeze(Object.fromEntries(
 Object.entries(PREVIOUS_STORY_HP).map(([id,hp])=>[id,Math.round(hp*HARD_STORY_HP_SCALE)])
));
export const JOURNEY_WEAKNESS_MULTIPLIER=Object.freeze({dice:1.5,blood:1.3});
export function journeyBossHp(bossId,baseHp){
 return JOURNEY_BOSS_HP[bossId]??baseHp;
}
export function journeyWeaknessMultiplier(game,bossId,defaultMultiplier=1){
 return game?.journeyBalance?.mode==='story'&&game.journeyBalance.boss===bossId
  ?JOURNEY_WEAKNESS_MULTIPLIER[bossId]??defaultMultiplier:defaultMultiplier;
}
