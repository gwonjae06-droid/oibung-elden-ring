import {evolutionCount} from './weapon-evolution.mjs';
import {WEAPONS} from './weapon-data.mjs';

export const WEAPON_ACTIVE_COOLDOWN=Object.freeze({'earth-wave':12,'blood-hammer':13,'twin-arrow':10});
export const HAMMER_GUARD_TIME=1.2;
export const HAMMER_GUARD_FACTOR=.5;
export const HAMMER_THROW_POISE=1.3;
export const BOW_BACKSHOT_ARROWS=2;

export function equippedPath(game){
 const paths={sword:['blade-wave','charged-blade'],hammer:['earth-wave','blood-hammer'],bow:['twin-arrow','piercing-arrow'],cards:['wide-deck','blood-deck']};
 return (paths[game?.weapon]||[]).find(id=>evolutionCount(game,id)>0)||null;
}
export function playerMeleeReach(game,base){
 return game?.weapon==='sword'&&evolutionCount(game,'charged-blade')?base*2:base;
}
export function attackStoredDamage(game,action){
 const s=game.player.skill;
 if(game.weapon!=='hammer'||!action?.basic||!(s.storedDamage>0))return 0;
 const boost=s.storedDamage*(evolutionCount(game,'earth-wave')>=2?1.15:1);
 s.storedDamage=0;
 game.events.push({type:'hammer-stored-release',amount:boost});
 return boost;
}
export function applyWeaponHitEffects(game,damage,action,{stun}={}){
 if(!(damage>0)||!action?.basic)return;
 const rankSigil=game.weapon==='cards'?evolutionCount(game,'wide-deck'):0;
 if(rankSigil&&!action.sigilCredited){
  action.sigilCredited=true;
  const s=game.player.skill;
  s.sigilMarks=(s.sigilMarks||0)+1;
  game.events.push({type:'card-sigil-mark',count:s.sigilMarks});
  if(s.sigilMarks>=3){
   s.sigilMarks=0;
   const amount=WEAPONS.cards.damage*(rankSigil>=2?2.4:1.8);
   const dealt=game.applyBonusDamage?.(amount,WEAPONS.cards.poise*7,{sigil:true})||0;
   if(dealt>0){stun?.(rankSigil>=2?.5:.35);game.events.push({type:'card-sigil-burst',amount:dealt});}
  }
 }
 if(game.weapon==='bow'&&evolutionCount(game,'piercing-arrow')){
  // One arrow inflicts its *landed* initial damage again over time, not
  // an instant double-hit. Each arrow has a bounded independent burn pool.
  const stacks=game.weaponBurnStacks??=[];
  const duration=evolutionCount(game,'piercing-arrow')>=2?3.2:2.8;
  stacks.push({left:duration,duration,total:damage});
  if(stacks.length>8)stacks.shift();
  game.weaponBurnStacks=stacks;
  game.events.push({type:'bow-burn-applied',amount:damage});
 }
}
export function tickWeaponBurn(game,dt){
 const stacks=game.weaponBurnStacks;
 if(!(dt>0)||!stacks?.length||game.status!=='playing')return;
 if(game.boss?.state==='transition'){stacks.length=0;game.weaponBurnPending=0;game.weaponBurnClock=0;return;}
 let amount=0;
 for(const stack of stacks){
  const h=Math.min(dt,stack.left);
  const full=stack.duration??(stack.duration=stack.left);
  amount+=stack.total*h/full;
  stack.left-=h;
 }
 game.weaponBurnStacks=stacks.filter(s=>s.left>1e-7);
 game.weaponBurnPending=(game.weaponBurnPending||0)+amount;
 game.weaponBurnClock=(game.weaponBurnClock||0)+dt;
 if(game.weaponBurnClock>=.18||!game.weaponBurnStacks.length){
  const dealt=game.applyBonusDamage?.(game.weaponBurnPending,0,{dot:true})||0;
  if(dealt>0)game.events.push({type:'bow-burn-tick',amount:dealt});
  game.weaponBurnClock=0;game.weaponBurnPending=0;
 }
}
export function launchHammer(game,action){
 const p=game.player,rank=evolutionCount(game,'blood-hammer');
 game.projectiles.push({id:game.nextId++,kind:'hammer-throw',x:p.x,z:p.z,y:1.5,yaw:action.yaw,
  speed:21,life:3.3,damage:WEAPONS.hammer.damage*(rank>=2?1.2:1),
  poise:WEAPONS.hammer.poise*HAMMER_THROW_POISE,
  maxRange:18,travel:0,returning:false,returningHammer:true,
  source:{basic:false,weaponThrow:true},hit:false,bossHit:false,skill:true});
 game.events.push({type:'hammer-throw'});
}
export function moveReturningHammer(q,dt,p){
 const old={x:q.x,y:q.y,z:q.z};
 if(!q.returning){
  const step=Math.min(q.maxRange-q.travel,q.speed*dt);
  q.x+=Math.sin(q.yaw)*step;q.z+=Math.cos(q.yaw)*step;
  q.travel+=step;
  if(q.travel>=q.maxRange-1e-5)q.returning=true;
 }else{
  const dx=p.x-q.x,dz=p.z-q.z,d=Math.hypot(dx,dz),step=Math.min(d,27*dt);
  if(d>.0001){q.x+=dx/d*step;q.z+=dz/d*step;}
  if(d<.65||d-step<.65)q.life=0;
 }
 q.life-=dt;
 return old;
}
