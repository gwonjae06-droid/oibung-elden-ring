import {playerIncapacitated} from './boss-hit-traits.mjs';
import {playerStaminaCost} from './balance.mjs';
import {weaponStats} from './weapon-stats.mjs';
import {evolutionCount} from './weapon-evolution.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {createSkillState} from './skills.mjs';
import {completePlayerHeal} from './player-tick.mjs';
import {createRangedMagazine,canFireRanged,spendRangedAmmo} from './ranged-reload.mjs';
import {WEAPON_ACTIVE_COOLDOWN,applyWeaponHitEffects,attackStoredDamage,equippedPath,
 launchHammer,moveReturningHammer,BOW_BACKSHOT_ARROWS} from './weapon-abilities.mjs';

export function createPlayerState({x=0,z=13,yaw=Math.PI,weapon='sword'}={}){
 const stats=weaponStats(weapon);
 return {weapon,x,z,yaw,hp:stats.maxHp,maxHp:stats.maxHp,stamina:100,regen:0,
  action:null,invuln:0,potions:3,skill:createSkillState(),ranged:createRangedMagazine(weapon)};
}

export function spawnPlayerProjectiles(game,action,weapon,{basicLifetime=1.7}={}){
 const count=action.projectileCount||(game.weapon==='cards'?3:1);
 // A cancelled windup must not consume ammo; only actual release does.
 if(weapon.projectile&&!spendRangedAmmo(game,count))return false;
 const fireRank=game.weapon==='bow'&&action.basic?evolutionCount(game,'piercing-arrow'):0;
 const volleyScale=game.journeyBalance?.mode==='story'&&game.weapon==='cards'&&count>1
  ?Math.max(.78,1-.055*(count-1)):1;
 for(let i=0;i<count;i++){
  game.projectiles.push({id:game.nextId++,x:game.player.x,z:game.player.z,y:1.2+(game.player.floorY||0),
   yaw:action.yaw+(i-(count-1)/2)*(count===2?.1:.075),
   speed:game.weapon==='bow'?26:game.weapon==='cards'?20:24,
   life:basicLifetime,damage:weapon.damage*action.mult*volleyScale,
   fireRank,poise:weapon.poise,kind:game.weapon,source:action,
   piercing:false,bossHit:false,hit:false,skill:false});
 }
 game.events.push({type:'shot'});
 return true;
}

export function tickPlayerAction(game,dt,weapon,{roll=()=>{},backstep=()=>{},melee=()=>{},basicLifetime=1.7}={}){
 const action=game.player.action;
 if(!action||playerIncapacitated(game.player))return;
 const previous=action.t;action.t+=dt;
 if(action.kind==='roll')roll(action);
 else if(action.kind==='heal')completePlayerHeal(game,action);
 else if(action.kind==='backshot'){
  if(previous<.4)backstep(action,Math.min(dt,.4-previous));
  if(action.t>=action.wind&&!action.done){
   action.done=true;spawnPlayerProjectiles(game,action,weapon,{basicLifetime});
  }
 }else if(action.kind==='throw'){
  if(action.t>=.24&&!action.done){action.done=true;launchHammer(game,action);}
 }else if(action.kind==='attack'){
  if(action.t>=action.wind&&!action.done){
   action.done=true;game.events.push({type:'swing'});
   if(weapon.projectile)spawnPlayerProjectiles(game,action,weapon,{basicLifetime});
   else if(game.weapon==='sword'&&action.basic){
    const rank=evolutionCount(game,'blade-wave');
    if(rank){
     spawnPlayerProjectiles(game,action,{...weapon,damage:weapon.damage*(rank>=2?.9:.6)},{basicLifetime:1.3});
     const q=game.projectiles.at(-1);
     q.kind='wave';q.speed=24;q.y=1.2;
    }
   }
  }
  if(!weapon.projectile&&!action.hit&&action.t>=action.wind&&action.t<=action.wind+action.active)
   melee(action);
 }
 if(action.t>=action.total&&game.player.action===action)game.player.action=null;
}

export function advancePlayerProjectile(projectile,dt,player=null){
 if(projectile.returningHammer)return moveReturningHammer(projectile,dt,player||{x:0,z:0});
 const old={x:projectile.x,y:projectile.y,z:projectile.z};
 projectile.x+=Math.sin(projectile.yaw)*projectile.speed*dt;
 projectile.z+=Math.cos(projectile.yaw)*projectile.speed*dt;
 projectile.life-=dt;
 return old;
}

// Only accepted, actually dealt damage pays any weapon bonuses.
export function rewardPlayerHit(game,damage,action,{canStun,stun}={}){
 if(!(damage>0))return;
 const rank=game.weapon==='cards'?evolutionCount(game,'blood-deck'):0;
 if(rank&&action?.basic){
  const gain=Math.min(game.player.maxHp-game.player.hp,damage*(rank>=2?.16:.08));
  if(gain>0){game.player.hp+=gain;game.events.push({type:'skill-heal',flavor:'cards',amount:gain});}
 }
 applyWeaponHitEffects(game,damage,action,{canStun,stun});
}
const emit=(game,type,data={})=>game.events.push({type,...data});
export function actPlayer(game,type){
 const player=game.player,weapon=WEAPONS[game.weapon],skill=player.skill;
 if(!weapon||game.status!=='playing'||game.startGrace>0||playerIncapacitated(player))return false;
 const cancelBasic=type==='roll'&&player.action?.kind==='attack'&&player.action.basic;
 if(player.action&&!cancelBasic||game.boss.state==='transition')return false;
 if(type==='heal'){
  if(!player.potions||player.hp>=player.maxHp)return false;
  player.potions--;player.action={kind:'heal',t:0,total:1.05,done:false};emit(game,'heal-start');return true;
 }
 if(type==='roll'){
  const cost=playerStaminaCost(game.journey?.rollCost??25);
  if(player.stamina<cost)return false;
  player.stamina-=cost;player.regen=.85;player.action={kind:'roll',t:0,total:.52,yaw:player.yaw};
  emit(game,'roll');return true;
 }
 if(type==='skill'){
  const path=equippedPath(game);
  if(!WEAPON_ACTIVE_COOLDOWN[path]||skill.cooldown>0||
    (path==='twin-arrow'&&!canFireRanged(game,BOW_BACKSHOT_ARROWS)))return false;
  skill.cooldown=WEAPON_ACTIVE_COOLDOWN[path]-(path==='twin-arrow'&&evolutionCount(game,path)>=2?2:0);
  const kind=path==='earth-wave'?'guard':path==='blood-hammer'?'throw':'backshot';
  player.action={kind,t:0,total:kind==='guard'?1.2:kind==='throw'?.5:.62,
   wind:.19,done:false,yaw:player.yaw,basic:false,projectileCount:BOW_BACKSHOT_ARROWS,
   mult:game.journey?.damage??1};
  emit(game,'skill-cast',{flavor:game.weapon,path});
  return true;
 }
 const cost=playerStaminaCost(weapon.cost+(game.journey?.cost??0));
 if(type!=='light'||player.stamina<cost||!canFireRanged(game))return false;
 player.stamina-=cost;player.regen=.85;
 const speed=Math.max(.1,game.journey?.speed??1),wind=weapon.wind/speed,active=weapon.active/speed,end=weapon.end/speed;
 const bonus=game.weapon==='hammer'?attackStoredDamage(game,{basic:true}):0;
 player.action={kind:'attack',t:0,total:wind+active+end,wind,active,yaw:player.yaw,
  done:false,hit:false,basic:true,mult:game.journey?.damage??1,bankedBonus:bonus,
  sigilCredited:false};
 emit(game,'attack-start');return true;
}
