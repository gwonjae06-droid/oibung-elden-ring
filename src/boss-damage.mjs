import {bossOfGame} from './battle-dialogs.mjs';
import {damageArenaBoss} from './arena-damage.mjs';
// Compatibility name for developer fixed damage; no weapon rewards or stagger multiplier.
export function damageStandard(g,amount){return damageArenaBoss(g,amount,0,{developer:true});}
// isCurrent must still hold after an asynchronously loaded boss damage handler resolves.
export async function applyBossDamage(g,amount,{isCurrent=()=>true}={}){
 const valid=()=>g?.status==='playing'&&Number.isFinite(amount)&&amount>0&&Number.isFinite(g.boss?.hp)&&g.boss.hp>0&&g.boss.state!=='transition'&&isCurrent();
 if(!valid())return 0;
 const load=bossOfGame(g).damage;
 if(load){const damage=await load();if(!valid())return 0;return damage(g,amount);}
 return damageStandard(g,amount);
}
