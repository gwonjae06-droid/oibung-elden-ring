import {evolutionCount} from './weapon-evolution.mjs';
import {WEAPONS} from './weapon-data.mjs';

// Reuse the existing forge branch IDs so permanent browser saves migrate
// without losing flames or accidentally unlocking both exclusive paths.
export const ABILITY_BRANCHES=Object.freeze({
 sword:Object.freeze([{id:'blade-wave',name:'검기',active:false},{id:'charged-blade',name:'장검의 영역',active:false}]),
 hammer:Object.freeze([{id:'earth-wave',name:'받아내는 철벽',active:true,cooldown:12},{id:'blood-hammer',name:'회귀하는 철추',active:true,cooldown:10}]),
 bow:Object.freeze([{id:'twin-arrow',name:'후퇴 연사',active:true,cooldown:10},{id:'piercing-arrow',name:'화염의 시위',active:false}]),
 cards:Object.freeze([{id:'wide-deck',name:'삼중 문양',active:false},{id:'blood-deck',name:'생명 흡수',active:false}])
});
export const equippedAbility=g=>ABILITY_BRANCHES[g?.weapon]?.find(b=>evolutionCount(g,b.id)>0)||null;
export const abilityRank=(g,id)=>Math.min(2,evolutionCount(g,id));
export const isAbilityReady=g=>Boolean(equippedAbility(g)?.active&&!(g.player.skill.cooldown>0));
export function abilityDisplay(g){
 const a=equippedAbility(g);
 if(!a)return {name:'스킬 없음',text:'대장간에서 무기 능력을 각인하세요',ratio:0,card:'',ready:false};
 const level=abilityRank(g,a.id),cooldown=g.player.skill.cooldown||0;
 if(!a.active){
  const label=a.id==='wide-deck'?(g.boss.cardMarks||0)+'/3 문양':a.id==='charged-blade'?'근접 사거리 2배':a.id==='piercing-arrow'?'화살에 화상 지속 피해':a.id==='blood-deck'?'적중 시 '+(level===2?16:8)+'% 회복':'평타 검기 자동 발사';
  return {name:a.name,text:label,ratio:1,card:'',ready:false};
 }
 return {name:a.name,text:cooldown>0?'재사용 '+cooldown.toFixed(1)+'초':a.id==='earth-wave'?'1.2초간 받는 피해 절반 · 차단분 저장':a.id==='blood-hammer'?'투척 후 자동 회수 · 경직 1.3배':'뒤로 도약하며 일반 화살 2발',ratio:cooldown>0?Math.max(0,1-cooldown/a.cooldown):1,card:'',ready:cooldown<=0};
}
// Reward only the accepted impacts. Protected/armored faces and misses
// cannot count as marks, trigger an explosion, or start a burn.
export function registerSpecialHit(g,damage,action,{fireRank=0,bonus=()=>0}={}){
 if(!(damage>0)||g.status!=='playing')return;
 const id=equippedAbility(g)?.id;
 if(g.weapon==='bow'&&id==='piercing-arrow'&&fireRank>0){
  const dot=damage*(fireRank>=2?1.15:1);
  const b=g.boss,stacks=b.weaponBurns??=[];
  if(stacks.length>=6)stacks.shift();
  stacks.push({left:3,dps:dot/3,acc:0});
  g.events.push({type:'weapon-ignite',x:b.x,z:b.z});
 }
 if(g.weapon==='cards'&&id==='wide-deck'&&action?.basic){
  const b=g.boss,marks=(b.cardMarks||0)+1;
  if(marks>=3){
   b.cardMarks=0;
   const tier=abilityRank(g,id);
   const extra=WEAPONS.cards.damage*(tier===2?3.6:2.8);
   const poise=WEAPONS.cards.poise*(tier===2?5:4);
   bonus(extra,poise);
   g.events.push({type:'card-mark-burst',x:b.x,z:b.z,damage:extra});
  }else{b.cardMarks=marks;g.events.push({type:'card-mark',marks,x:b.x,z:b.z});}
 }
}
export function tickWeaponBurn(g,dt,deal=()=>0){
 if(g?.status!=='playing'||g.boss?.state==='transition')return 0;
 const b=g.boss,stacks=b.weaponBurns;
 if(!stacks?.length)return 0;
 let due=0,expired=false;
 for(const burn of stacks){
  const h=Math.min(Math.max(0,dt),burn.left);
  burn.acc+=h*burn.dps;burn.left=Math.max(0,burn.left-h);
  if(burn.left<=1e-8){expired=true;}
 }
 b.weaponBurnClock=(b.weaponBurnClock||0)+dt;
 if(b.weaponBurnClock>=.15||expired){
  for(const burn of stacks){due+=burn.acc;burn.acc=0;}
  b.weaponBurnClock=0;
 }
 b.weaponBurns=stacks.filter(x=>x.left>1e-8);
 if(due<=0)return 0;
 const actual=deal(due)||0;
 if(actual>0)g.events.push({type:'weapon-burn',amount:actual,x:b.x,z:b.z});
 return actual;
}
