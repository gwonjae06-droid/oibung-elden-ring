const WEAPONS=new Set(['sword','hammer','bow','cards']);
export function createCoopParty(members,createPlayer){
 if(!Array.isArray(members)||members.length!==2||typeof createPlayer!=='function')throw Error('INVALID_PARTY');
 const ids=new Set();
 return members.map((member,index)=>{
  if(!member||typeof member.id!=='string'||!member.id||member.id.length>64||ids.has(member.id)||!WEAPONS.has(member.weapon))throw Error('INVALID_MEMBER');
  ids.add(member.id);const player=structuredClone(createPlayer(member.weapon,index));
  if(!player||![player.x,player.z,player.hp,player.maxHp].every(Number.isFinite)||player.maxHp<=0||player.hp<=0||player.hp>player.maxHp)throw Error('INVALID_PLAYER');
  return {id:member.id,weapon:member.weapon,player};
 });
}
export function livingCoopPlayers(party){return party.filter(member=>member.player.hp>0);}
export function pickCoopTarget(party,boss,{currentId=null,locked=false}={}){
 if(locked)return party.some(member=>member.id===currentId)?currentId:null;
 if(![boss.x,boss.z].every(Number.isFinite))throw Error('INVALID_BOSS_POSITION');
 let best=null,distance=Infinity;
 for(const member of livingCoopPlayers(party)){
  const p=member.player,d=Math.hypot(p.x-boss.x,p.z-boss.z);
  if(!Number.isFinite(d))throw Error('INVALID_PLAYER_POSITION');
  if(d<distance||(d===distance&&(best===null||member.id<best))){best=member.id;distance=d;}
 }
 return best;
}
export function coopBattleStatus(boss,party){
 if(!Number.isFinite(boss.hp)||boss.hp<0||party.length!==2)throw Error('INVALID_BATTLE');
 if(boss.hp===0)return 'won';
 return livingCoopPlayers(party).length?'playing':'lost';
}
export function createCoopAttack(id,damage){
 if(typeof id!=='string'||!id||!Number.isFinite(damage)||damage<=0)throw Error('INVALID_ATTACK');
 return {id,damage,resolved:new Set()};
}
// Callbacks use authoritative geometry and the shared engine's defense rules.
// This ordinary-damage helper must not be used for instant crush attacks.
export function resolveCoopAttack(party,attack,{touches,evades}){
 if(!(attack.resolved instanceof Set)||!Number.isFinite(attack.damage)||attack.damage<=0||typeof touches!=='function'||typeof evades!=='function')throw Error('INVALID_ATTACK_RULES');
 const events=[];
 for(const member of livingCoopPlayers(party)){
  if(attack.resolved.has(member.id)||!touches(member.player,member.id))continue;
  attack.resolved.add(member.id);
  if(evades(member.player,member.id)){events.push({type:'dodge',playerId:member.id,attackId:attack.id});continue;}
  const amount=Math.min(member.player.hp,attack.damage);member.player.hp-=amount;
  events.push({type:'player-hit',playerId:member.id,attackId:attack.id,amount});
  if(member.player.hp===0)events.push({type:'player-death',playerId:member.id,attackId:attack.id});
 }
 return events;
}
export function snapshotCoopParty(party){return structuredClone(party.map(({id,weapon,player})=>({id,weapon,alive:player.hp>0,player})));}
