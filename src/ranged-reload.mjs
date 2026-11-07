// Shared, renewable magazines for every live boss encounter.
// Normal journey is authoritative; standalone and hidden fights use the same rules.
export const RANGED_MAGAZINES=Object.freeze({
 bow:Object.freeze({capacity:8,shotCost:1,reloadDuration:1.4}),
 cards:Object.freeze({capacity:12,shotCost:3,reloadDuration:1.2})
});

export function createRangedMagazine(weapon){
 const rules=RANGED_MAGAZINES[weapon];
 return rules?{capacity:rules.capacity,loaded:rules.capacity,
  shotCost:rules.shotCost,reloadDuration:rules.reloadDuration,
  remaining:0,pending:false}:null;
}

export function canFireRanged(game,count=game?.player?.ranged?.shotCost??0){
 const magazine=game?.player?.ranged;
 if(!magazine)return true;
 return !magazine.pending&&magazine.remaining<=0&&magazine.loaded>=count;
}

export function spendRangedAmmo(game,count=game?.player?.ranged?.shotCost??0){
 const magazine=game?.player?.ranged;
 if(!magazine)return true;
 if(!canFireRanged(game,count))return false;
 magazine.loaded-=count;
 // Reload only once the full magazine is depleted. The current attack's
 // recovery must finish before its full 1.2/1.4-second reload begins.
 if(magazine.loaded<magazine.shotCost)magazine.pending=true;
 return true;
}

export function tickRangedReload(game,dt){
 const magazine=game?.player?.ranged,player=game?.player;
 if(!magazine||!(dt>0)||game.status!=='playing'||game.boss?.state==='transition')return;
 // Manual movement is allowed, but reloading makes the player vulnerable:
 // attacking is blocked; rolling pauses progress, never silently completes it.
 if(player.action)return;
 if(magazine.pending&&magazine.remaining<=0){
  magazine.pending=false;
  magazine.remaining=magazine.reloadDuration;
  game.events?.push({type:'ranged-reload-start',weapon:game.weapon});
 }
 if(magazine.remaining>0){
  magazine.remaining=Math.max(0,magazine.remaining-dt);
  if(magazine.remaining===0){
   magazine.loaded=magazine.capacity;
   game.events?.push({type:'ranged-reload-complete',weapon:game.weapon});
  }
 }
}

export function rangedMagazineLabel(magazine){
 if(!magazine)return '';
 if(magazine.remaining>0)return '장전 '+magazine.remaining.toFixed(1)+'초';
 if(magazine.pending)return '장전 대기';
 return magazine.loaded+' / '+magazine.capacity;
}
