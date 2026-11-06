import {playerIncapacitated} from './boss-hit-traits.mjs';
import {playerStaminaCost} from './balance.mjs';
import {weaponStats} from './weapon-stats.mjs';
import {evolutionCount} from './weapon-evolution.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createSkillState} from './skills.mjs';
import {equippedAbility,abilityRank,isAbilityReady} from './weapon-specialization.mjs';
import {completePlayerHeal} from './player-tick.mjs';

export function createPlayerState({x = 0, z = 13, yaw = Math.PI, weapon = 'sword'} = {}) {
  const stats=weaponStats(weapon);
  return {
    weapon,
    x,
    z,
    yaw,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    stamina: 100,
    regen: 0,
    action: null,
    invuln: 0,
    potions: 3,
    skill: createSkillState(),
  };
}

export function spawnPlayerProjectiles(game, action, weapon, {basicLifetime=1.7}={}){
 const thrown=Boolean(action.throwHammer),leap=Boolean(action.leap);
 const count=thrown?1:leap?2:game.weapon==='cards'?3:1;
 const fireRank=game.weapon==='bow'&&!leap?abilityRank(game,'piercing-arrow'):0;
 const volleyScale=game.journeyBalance?.mode==='story'&&count>1?Math.max(.78,1-.055*(count-1)):1;
 for(let i=0;i<count;i++){
  game.projectiles.push({
   id:game.nextId++,x:game.player.x,z:game.player.z,y:thrown?1.35:1.2,
   yaw:action.yaw+(i-(count-1)/2)*(leap?.09:.075),
   speed:thrown?19:game.weapon==='bow'?26:20,
   life:thrown?2.3:basicLifetime,
   damage:weapon.damage*action.mult*volleyScale,fireRank,
   poise:weapon.poise*(thrown?1.3:1),
   kind:thrown?'hammer-throw':game.weapon,
   source:action,piercing:thrown,bossHit:false,hit:false,skill:thrown||leap,
   flight:0,originX:game.player.x,originZ:game.player.z
  });
 }
 game.events.push({type:'shot'});
}

// Collision and movement belong to the encounter; action timing belongs to the player.
export function tickPlayerAction(
  game,
  dt,
  weapon,
  {roll = () => {}, melee = () => {}, leap = () => {}, basicLifetime = 1.7} = {},
) {
  const action = game.player.action;
  if (!action||playerIncapacitated(game.player)) return;
  action.t += dt;
  if (action.kind === 'roll') roll(action);
  else if (action.leap && action.t<=.55) leap(action);
  if (action.kind === 'heal') completePlayerHeal(game, action);
  else if (action.kind === 'attack' || action.kind === 'skill') {
    if (action.t >= action.wind && !action.done) {
      action.done = true;
      game.events.push({type: 'swing'});
      if (weapon.projectile||action.throwHammer)spawnPlayerProjectiles(game, action, weapon, {basicLifetime});
      else if(action.basic&&game.weapon==='sword'){
        const rank=evolutionCount(game,'blade-wave');
        if(rank){
          const hard=game.journeyBalance?.mode==='story';
          // Charged melee may hit hard, but the accompanying free wave must
          // not inherit a second full 3x+ charge multiplier.
          const rankScale=hard?(rank===1?.55:.9):.6*rank;
          spawnPlayerProjectiles(game,action,{...weapon,damage:weapon.damage*rankScale},{basicLifetime:1.3});
          const q=game.projectiles.at(-1);q.kind='wave';q.speed=24;q.y=1.2;
        }
      }
    }
    if (
      !weapon.projectile && !action.throwHammer &&
      !action.hit &&
      action.t >= action.wind &&
      action.t <= action.wind + action.active
    )
      melee(action);
  }
  if (action.t >= action.total && game.player.action === action)
    game.player.action = null;
}

export function advancePlayerProjectile(projectile,dt,player=null){
 const previous={x:projectile.x,y:projectile.y,z:projectile.z};
 if(projectile.kind==='hammer-throw'){
  projectile.flight=(projectile.flight||0)+dt;
  if(projectile.flight<=.70){
   projectile.x+=Math.sin(projectile.yaw)*projectile.speed*dt;
   projectile.z+=Math.cos(projectile.yaw)*projectile.speed*dt;
  }else{
   projectile.returning=true;
   const tx=player?.x??projectile.originX,tz=player?.z??projectile.originZ,
    dx=tx-projectile.x,dz=tz-projectile.z,d=Math.hypot(dx,dz),
    travel=Math.min(d,Math.max(20,d*4)*dt);
   if(d>1e-6){projectile.x+=dx/d*travel;projectile.z+=dz/d*travel;}
   if(d-travel<.8)projectile.life=0;
  }
 }else{
  projectile.x+=Math.sin(projectile.yaw)*projectile.speed*dt;
  projectile.z+=Math.cos(projectile.yaw)*projectile.speed*dt;
 }
 projectile.life-=dt;
 return previous;
}

// Called only after the encounter accepts a hit and computes the actual damage.
export function rewardPlayerHit(game,damage,action){
 if(!(damage>0)||!action)return;
 const rank=game.weapon==='cards'?evolutionCount(game,'blood-deck'):0;
 if(rank>0&&action.basic){
  const gain=Math.min(game.player.maxHp-game.player.hp,damage*(rank>=2?.16:.08));
  if(gain>0){game.player.hp+=gain;game.events.push({type:'skill-heal',flavor:'cards',amount:gain});}
 }
}

const emit = (game, type, data = {}) => game.events.push({type, ...data});
export function actPlayer(game, type) {
  const player = game.player,
    weapon = WEAPONS[game.weapon],
    skill = player.skill;
  if(game.status!=='playing'||game.startGrace>0||playerIncapacitated(player))return false;
  // Basic attacks alone can be cancelled into a roll, including their
  // recovery. Specials, healing, stagger and hurt retain their commitments.
  // Never discard the attack unless the dodge stamina cost can be paid.
  const cancelBasic=type==='roll'&&player.action?.kind==='attack'&&player.action.basic===true;
  if (
    game.status !== 'playing' ||
    (player.action&&!cancelBasic) ||
    game.boss.state === 'transition'
  )
    return false;
  if (type === 'heal') {
    if (!player.potions || player.hp >= player.maxHp) return false;
    player.potions--;
    player.action = {kind: 'heal', t: 0, total: 1.05, done: false};
    emit(game, 'heal-start');
    return true;
  }
  if (type === 'roll') {
    const cost=playerStaminaCost(game.journey?.rollCost??25);
    if (player.stamina < cost) return false;
    // Atomic replace prevents the cancelled swing from spawning a late hit,
    // projectile or repeated skill proc on the next simulation frame.
    if(cancelBasic)player.action=null;
    player.stamina -= cost;
    player.regen = 0.85;
    player.action = {kind: 'roll', t: 0, total: 0.52, yaw: player.yaw};
    emit(game, 'roll');
    return true;
  }
  if(type==='skill'){
   const ability=equippedAbility(game);
   if(!ability?.active||!isAbilityReady(game))return false;
   skill.cooldown=ability.cooldown-(abilityRank(game,ability.id)>1?2:0);
   emit(game,'skill-cast',{flavor:game.weapon,ability:ability.id});
   if(ability.id==='earth-wave'){
    player.action={kind:'guard',t:0,total:1.2,yaw:player.yaw,blocked:0};
   }else if(ability.id==='blood-hammer'){
    player.action={kind:'skill',t:0,total:1.05,wind:.38,active:.01,yaw:player.yaw,hit:false,done:false,mult:abilityRank(game,ability.id)>1?1.35:1.12,throwHammer:true,skill:true};
   }else if(ability.id==='twin-arrow'){
    player.action={kind:'skill',t:0,total:.65,wind:.17,active:.01,yaw:player.yaw,hit:false,done:false,mult:1,leap:true,skill:true};
   }
   return true;
  }
  const attackCost=playerStaminaCost(weapon.cost+(game.journey?.cost??0));
  if (type !== 'light' || player.stamina < attackCost) return false;
  player.stamina -= attackCost;
  player.regen = 0.85;
  const rate=1/(game.journey?.speed??1);
  const wind=weapon.wind/rate,active=weapon.active/rate,end=weapon.end/rate;
  const saved=game.weapon==='hammer'&&evolutionCount(game,'earth-wave')?Math.max(0,skill.storedDamage||0):0;
  if(saved>0)skill.storedDamage=0;
  player.action={
   kind:'attack',t:0,total:wind+active+end,wind,active,
   yaw:player.yaw,done:false,hit:false,basic:true,
   mult:game.journey?.damage??1,bonusDamage:saved
  };
  emit(game, 'attack-start');
  return true;
}
