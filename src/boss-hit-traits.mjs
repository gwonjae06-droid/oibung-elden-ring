import {playerIncomingDamage} from './weapon-stats.mjs';

// Encounter-owned simulation state; presentation consumes this without adding text.
export const BOSS_HIT_TRAITS=Object.freeze({bleedDuration:2,bleedDps:2,bleedRegen:1.2,stunDuration:.7,crushDuration:1,drainRatio:.25,drainDuration:.75});
const fresh=()=>({bleed:0,stun:0,crush:0,drain:0});
export const playerIncapacitated=p=>(p?.traits?.stun||0)>0||(p?.traits?.crush||0)>0;
export function clearBossHitTraits(g){
 const p=g.player;if(!p)return;p.traits=fresh();
 if(['stunned','crushed'].includes(p.action?.kind))p.action=null;
}
export function applyBossHitTrait(g,damage,{boss=g.blood?'blood':g.dice?'dice':g.clown?'clown':'kwon',cut=true}={}){
 if(g.status!=='playing'||!(damage>0)||!Number.isFinite(damage)||g.boss.hp<=0)return 0;
 const p=g.player,t=p.traits??=fresh(),r=BOSS_HIT_TRAITS;
 if(boss==='blood'){
  const amount=Math.max(0,Math.min(g.boss.maxHp-g.boss.hp,damage*r.drainRatio));g.boss.hp+=amount;t.drain=r.drainDuration;
  if(amount>0)g.events.push({type:'boss-drain',amount});return amount;
 }
 if(p.hp<=0)return 0;
 if(boss==='kwon'&&cut)t.bleed=r.bleedDuration;
 if(boss==='clown'){t.stun=r.stunDuration;p.action={kind:'stunned',t:0,total:r.stunDuration};}
 if(boss==='dice'){t.crush=r.crushDuration;p.action={kind:'crushed',t:0,total:r.crushDuration};}
 return 0;
}
export function tickBossHitTraits(g,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 if(g.status!=='playing'){clearBossHitTraits(g);return;}
 const p=g.player,t=p.traits;if(!t)return;
 if(t.bleed>0){const amount=Math.min(p.hp,playerIncomingDamage(g,Math.min(dt,t.bleed)*BOSS_HIT_TRAITS.bleedDps,{dot:true}));p.hp=Math.max(0,p.hp-amount);
  if(p.hp<=0){g.status='lost';clearBossHitTraits(g);if(g.bossShots)g.bossShots.length=0;if(g.projectiles)g.projectiles.length=0;g.events.push({type:'death'});return;}
 }
 for(const name of ['bleed','stun','crush','drain']){const left=t[name]-dt;t[name]=left>1e-9?left:0;}
 const a=p.action;if(a?.kind==='stunned'||a?.kind==='crushed'){
  const left=a.kind==='stunned'?t.stun:t.crush;a.t=Math.max(0,a.total-left);if(left<=1e-9)p.action=null;
 }
}
