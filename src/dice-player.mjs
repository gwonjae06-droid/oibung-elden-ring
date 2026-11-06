import {giantAim,strikeGiantHand} from './dice-giant.mjs';
import {playerRollSpeed} from './player-movement-rules.mjs';
import {playerMeleeReach} from './weapon-abilities.mjs';
import {giantImpact} from './dice-giant-hit.mjs';
import {WEAPONS} from './weapon-data.mjs';
import {diceSegmentImpact,diceWeakHit} from './dice-hit.mjs';
import {journeyWeaknessMultiplier} from './journey-balance.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {actPlayer,createPlayerState,tickPlayerAction,advancePlayerProjectile} from './player-combat.mjs';
import {settlePlayerHit} from './player-hit.mjs';
import {createDiceGame,stepDice,damageDice} from './dice-combat.mjs';
import {DICE_BOARD,DICE_RULES as R} from './dice-data.mjs';
export function createDicePlayerGame(weapon='sword',{seed}={}){
 if(!WEAPONS[weapon])throw new Error('Unknown weapon');
 const g=createDiceGame({seed}),spawn=DICE_BOARD[3];
 Object.assign(g,{weapon,projectiles:[],nextId:0,stats:{hits:0,damage:0,dodges:0}});
 g.player=createPlayerState({x:spawn.x,z:spawn.z,yaw:-Math.PI/2,weapon});
 Object.defineProperty(g,'applyBonusDamage',{enumerable:false,writable:true,configurable:true,
  value:(amount,poise=0,{dot=false}={})=>{
   const dealt=damageDice(g,amount,null,{dot});
   if(dealt>0){g.stats.damage+=dealt;if(!dot)g.stats.hits++;}
   return dealt;
  }});
 Object.assign(g.boss,{x:g.dice.pose.x,z:g.dice.pose.z,state:'dice',phase:1});
 g.dice.stun=0;g.dice.giantEnabled=true;
  // Each new attempt shuffles the full casino attack pool. Roulette is
  // neither hard-coded to open nor buried at a predictable fixed index.
  return g;
}
export function actDice(g,type,input={}){
 if(g.status!=='playing'||g.dice.giant?.state==='transition')return false;
 const p=g.player;
 if(!p.action){const aim=giantAim(g);p.yaw=Math.atan2(aim.x-p.x,aim.z-p.z);if(type==='roll'&&(input.x||input.z))p.yaw=Math.atan2(input.x||0,input.z||0);}
 return actPlayer(g,type);
}
export function diceFaceDamageable(g,impact){return Boolean(impact)&&(!g.dice.giant?diceWeakHit(impact):g.dice.giant.temperament==='feral'||diceWeakHit(impact));}
export function diceFaceDamageMultiplier(g,impact){if(!diceFaceDamageable(g,impact))return 0;return !g.dice.giant&&g.boss.phase===1?journeyWeaknessMultiplier(g,'dice',1):1;}
function hit(g,amount,action,impact){
 const multiplier=diceFaceDamageMultiplier(g,impact);
 if(!multiplier){g.dice.blockFlash=.12;g.events.push({type:'dice-blocked',face:impact.face});return;}
 const dealt=g.dice.giant?(impact.part==='hand'?strikeGiantHand(g,impact.index,amount):amount*journeyWeaknessMultiplier(g,'dice',2.8)):amount*multiplier;
 const damage=damageDice(g,dealt,impact.point);if(!damage)return;
 settlePlayerHit(g,damage,action,{canStun:g.status==='playing',stun:duration=>{g.dice.stun=duration;}});
}
function melee(g,weapon,action){
 const p=g.player,range=playerMeleeReach(g,g.weapon==='hammer'?3.05:2.85);
 const impact=(g.dice.giant?(a,b)=>giantImpact(g,a,b):diceSegmentImpact)({x:p.x,y:1.75,z:p.z},
  {x:p.x+Math.sin(action.yaw)*range,y:1.75,z:p.z+Math.cos(action.yaw)*range},g.dice.pose);
 if(impact){action.hit=true;hit(g,weapon.damage*action.mult+(action.bankedBonus||0),action,impact);}
}
function projectiles(g,dt){
 for(const q of g.projectiles){const previous=advancePlayerProjectile(q,dt,g.player);if(q.hit||q.life<=0)continue;
  const to={x:q.x,y:Number.isFinite(q.y)?q.y:1.2,z:q.z};
  const from={x:previous.x,y:Number.isFinite(previous.y)?previous.y:to.y,z:previous.z};
  const impact=g.dice.giant?giantImpact(g,from,to):diceSegmentImpact(from,to,g.dice.pose);if(impact){q.hit=true;hit(g,q.damage,q.source,impact);if(!q.returningHammer&&(!q.piercing||!diceFaceDamageable(g,impact)))q.life=0;}}
 g.projectiles=g.projectiles.filter(q=>q.life>0);
}
export function stepDicePlayer(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 let left=Math.min(.05,dt);
 while(left>1e-9&&g.status==='playing'){
  const h=Math.min(left,1/120),p=g.player,weapon=WEAPONS[g.weapon];
  g.dice.blockFlash=Math.max(0,(g.dice.blockFlash||0)-h);
  if(g.dice.giant?.state==='transition'){p.action=null;g.projectiles.length=0;}
  tickPlayerResources(g,h);tickPlayerAction(g,h,weapon,{basicLifetime:2,melee:action=>melee(g,weapon,action)});projectiles(g,h);if(g.status!=='playing')break;
  const action=p.action,movement=action?.kind==='roll'?{x:Math.sin(action.yaw),z:Math.cos(action.yaw),roll:true,rollSpeed:playerRollSpeed(g)}:action?.kind==='backshot'&&action.t<=.4?{x:-Math.sin(action.yaw),z:-Math.cos(action.yaw),roll:true,rollSpeed:9}:action?{x:0,z:0}:{x:input.x||0,z:input.z||0};
  if(!action)p.yaw=Math.atan2(g.dice.pose.x-p.x,g.dice.pose.z-p.z);
  stepDice(g,h,{...movement,freezeBoss:g.dice.stun>0});g.dice.stun=Math.max(0,g.dice.stun-h);g.boss.x=g.dice.pose.x;g.boss.z=g.dice.pose.z;left-=h;
 }
}
