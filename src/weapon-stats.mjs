// Combat-only weapon identities. Keep damage, poise, skills and forge ranks
// in their existing modules; these five numbers are deliberately independent.
export const WEAPON_STATS=Object.freeze({
 sword:Object.freeze({maxHp:125,incomingDamage:.95,walkSpeed:1,rollDistance:1,staminaRegen:1}),
 hammer:Object.freeze({maxHp:145,incomingDamage:.90,walkSpeed:.90,rollDistance:.95,staminaRegen:.90}),
 bow:Object.freeze({maxHp:100,incomingDamage:1.05,walkSpeed:1.05,rollDistance:1.05,staminaRegen:1.10}),
 cards:Object.freeze({maxHp:110,incomingDamage:1,walkSpeed:1,rollDistance:1,staminaRegen:1})
});

// Standalone dice simulations can have no equipped weapon. Default to
// neutral multipliers so test-only game state remains usable unchanged.
const NEUTRAL=Object.freeze({maxHp:120,incomingDamage:1,walkSpeed:1,rollDistance:1,staminaRegen:1});
export const weaponStats=weapon=>Object.hasOwn(WEAPON_STATS,weapon)?WEAPON_STATS[weapon]:NEUTRAL;

// Scale the delivered hit BEFORE applying HP clamps, invulnerability or boss
// hit traits; return nonnegative finite damage and retain DOT precision.
export function playerIncomingDamage(game,raw){
 if(!Number.isFinite(raw)||raw<=0)return 0;
 const normal=raw*weaponStats(game?.weapon).incomingDamage;
 const a=game?.player?.action;
 if(game?.weapon==='hammer'&&a?.kind==='guard'&&a.t<=1.2){
  const blocked=normal*.5;
  game.player.skill.storedDamage=Math.min(200,Math.max(0,game.player.skill.storedDamage||0)+blocked);
  a.blocked=(a.blocked||0)+blocked;
  game.events?.push({type:'hammer-guard',blocked,total:game.player.skill.storedDamage});
  return normal*.5;
 }
 return normal;
}
