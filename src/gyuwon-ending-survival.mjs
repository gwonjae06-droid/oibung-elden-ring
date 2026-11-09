// The fifth year begins the narrative's unbroken theatrical epilogue.
// Only the PLAYER's shared HP is protected; party members, minigame enemies,
// match rounds and the boss keep their own independent win/loss mechanics.
export function gyuwonPlayerHpFloor(g){
 return (g?.gyuwon?.years?.year??0)>=5?1:0;
}

export function applyGyuwonPlayerDamage(g,rawDamage){
 const floor=gyuwonPlayerHpFloor(g),p=g.player;
 const before=Math.max(floor,p.hp);
 const damage=Number.isFinite(rawDamage)?Math.max(0,rawDamage):0;
 p.hp=Math.max(floor,before-damage);
 // Keep hurt events/statistics truthful: display the HP actually deducted,
 // while callers may still show the normal hit animation even at 1 HP.
 return before-p.hp;
}
