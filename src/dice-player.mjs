import {WEAPONS} from './weapon-data.mjs';
import {diceSegmentImpact,diceWeakHit} from './dice-hit.mjs';
import {tickPlayerResources} from './player-tick.mjs';
import {actPlayer,createPlayerState,tickPlayerAction,advancePlayerProjectile,rewardPlayerHit} from './player-combat.mjs';
import {createDiceGame,stepDice,damageDice} from './dice-combat.mjs';
import {DICE_BOARD,DICE_RULES as R} from './dice-data.mjs';

export function createDicePlayerGame(weapon='sword') {
  if(!WEAPONS[weapon])throw new Error('Unknown weapon');
  const g=createDiceGame(),spawn=DICE_BOARD[3];
  Object.assign(g,{weapon,projectiles:[],nextId:0,stats:{hits:0,damage:0,dodges:0}});
  g.player=createPlayerState({x:spawn.x,z:spawn.z,yaw:-Math.PI/2});
  Object.assign(g.boss,{x:g.dice.pose.x,z:g.dice.pose.z,state:'dice',phase:1});
  g.dice.stun=0;
  return g;
}

export function actDice(g,type,input={}) {
  if(g.status!=='playing')return false;
  const p=g.player;
  if(!p.action) {
    p.yaw=Math.atan2(g.dice.pose.x-p.x,g.dice.pose.z-p.z);
    if(type==='roll'&&(input.x||input.z))p.yaw=Math.atan2(input.x||0,input.z||0);
  }
  return actPlayer(g,type);
}

function hit(g,amount,action,impact) {
  if(!diceWeakHit(impact)) {
    g.dice.blockFlash=.12;
    g.events.push({type:'dice-blocked',face:impact.face});
    return;
  }
  const damage=damageDice(g,amount);
  if(!damage)return;
  g.stats.hits++;
  g.stats.damage+=damage;
  rewardPlayerHit(g,damage,action,{canStun:g.status==='playing',stun:duration=>{g.dice.stun=duration;}});
}

function melee(g,weapon,action) {
  const p=g.player,range=R.edge/2+(action.skill?4:weapon.range);
  const impact=diceSegmentImpact({x:p.x,y:1.2,z:p.z},
    {x:p.x+Math.sin(action.yaw)*range,y:1.2,z:p.z+Math.cos(action.yaw)*range},g.dice.pose);
  if(impact) {
    action.hit=true;
    hit(g,weapon.damage*action.mult,action,impact);
  }
}

function projectiles(g,dt) {
  for(const projectile of g.projectiles) {
    const previous=advancePlayerProjectile(projectile,dt);
    if(projectile.hit||projectile.life<=0)continue;
    const impact=diceSegmentImpact(previous,projectile,g.dice.pose);
    if(impact) {
      projectile.hit=true;
      hit(g,projectile.damage,projectile.source,impact);
      if(!projectile.piercing||!diceWeakHit(impact))projectile.life=0;
    }
  }
  g.projectiles=g.projectiles.filter(projectile=>projectile.life>0);
}

export function stepDicePlayer(g,dt,input={}) {
  if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  let left=Math.min(.05,dt);
  while(left>1e-9&&g.status==='playing') {
    const h=Math.min(left,1/120),p=g.player,weapon=WEAPONS[g.weapon];
    g.dice.blockFlash=Math.max(0,(g.dice.blockFlash||0)-h);
    tickPlayerResources(g,h);
    // Preserve the board encounter's two-second basic projectile lifetime.
    tickPlayerAction(g,h,weapon,{basicLifetime:2,melee:action=>melee(g,weapon,action)});
    projectiles(g,h);
    if(g.status!=='playing')break;
    const action=p.action;
    const movement=action?.kind==='roll'
      ?{x:Math.sin(action.yaw),z:Math.cos(action.yaw),roll:true}
      :action?{x:0,z:0}:{x:input.x||0,z:input.z||0,blue:p.skill.blue>0};
    if(!action)p.yaw=Math.atan2(g.dice.pose.x-p.x,g.dice.pose.z-p.z);
    stepDice(g,h,{...movement,freezeBoss:g.dice.stun>0});
    g.dice.stun=Math.max(0,g.dice.stun-h);
    g.boss.x=g.dice.pose.x;
    g.boss.z=g.dice.pose.z;
    left-=h;
  }
}
