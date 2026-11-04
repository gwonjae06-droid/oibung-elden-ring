// Central balance knobs. Change numbers here, not inside individual bosses or weapons.
// Every damage the player deals with a weapon is multiplied once, in weapon-data.mjs.
export const PLAYER_DAMAGE_MULTIPLIER=.9;
// Boss health is similar across the campaign: the first boss is lowest and each later boss has a little more.
export const BASE_BOSS_HP=3800;
export const BOSS_HP_SCALE=Object.freeze([1,1.06,1.12,1.18,1.24]);
export const bossMaxHp=order=>Math.round(BASE_BOSS_HP*BOSS_HP_SCALE[order]/10)*10;
