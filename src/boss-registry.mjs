import {bossMaxHp} from './balance.mjs';
// Fixed campaign order. Add a boss here (and implement it) instead of editing the journey code.
export const CAMPAIGN_ORDER=Object.freeze(['kwon','clown','dice','blood','gyuwon']);
// Every finished boss now grants one purification flame; the permanent forge
// replaces post-victory weapon choices. An ending boss still grants a flame.
// gameKey: the property that marks a game object as this boss's game (game.clown, game.dice, game.blood).
// hint(game): the tip shown after a defeat. place: how the arena is announced before the fight (optional).
// secret: an extra hidden-menu shortcut {label, phase}. damage: loads this boss's own damage function (optional).
const DEFINITIONS={
 kwon:{name:'긴턱의 이권재',implemented:true,kind:'arena',dialogId:null,gameKey:null,reward:'flame',
  hint:()=>'조용해진 칼날 끝에 다음 서약이 기다립니다.'},
 clown:{name:'광대 오슬우',implemented:true,kind:'module',dialogId:'clown-battle',gameKey:'clown',reward:'flame',
  hint:()=>'무대 뒤에서는 아직도 웃음이 흘러나옵니다.',
  load:()=>import('./clown-battle.mjs'),
  launch:(m,o)=>m.launchClownBattle({weapon:o.weapon,practice:true,configure:o.configure,onClose:o.onClose})},
 dice:{name:'거대 주사위 박성원',implemented:true,kind:'module',dialogId:'dice-battle',gameKey:'dice',reward:'flame',
  hint:()=>'주사위가 굴러간 자리에 아직 끝나지 않은 내기가 남았습니다.',
  secret:{label:'박성원 · 육체 강탈부터',phase:2},
  damage:()=>import('./dice-combat.mjs').then(m=>m.damageDice),
  load:()=>import('./dice-battle.mjs'),
  launch:(m,o)=>m.launchDiceBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose,startPhase:o.startPhase})},
 blood:{name:'영원한 혈왕 배서준',implemented:true,kind:'module',dialogId:'blood-battle',gameKey:'blood',reward:'flame',
  hint:()=>'피의 바다는 멈추지 않고 성당의 종을 울립니다.',
  place:'성혈 대성당에',
  damage:()=>import('./blood-combat.mjs').then(m=>m.damageBlood),
  load:()=>import('./blood-battle.mjs'),
  launch:(m,o)=>m.launchBloodBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose})},
 gyuwon:{name:'무두의 사유 최규원',implemented:true,kind:'module',dialogId:'gyuwon-battle',gameKey:'gyuwon',reward:'flame',
  place:'심야 자습실에',hint:()=>'마지막 답안은 아직 빈 종이 위에 남아 있습니다.',
  damage:()=>import('./gyuwon-combat.mjs').then(m=>m.damageGyuwon),
  load:()=>import('./gyuwon-battle.mjs'),launch:(m,o)=>m.launchGyuwonBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose})}
};
export const BOSS_REGISTRY=Object.freeze(Object.fromEntries(CAMPAIGN_ORDER.map((id,order)=>[id,Object.freeze({id,order,maxHp:bossMaxHp(order),...DEFINITIONS[id]})])));
// Only finished bosses can be reached from the journey; flip `implemented` when a new boss is ready.
export const PLAYABLE_BOSSES=Object.freeze(CAMPAIGN_ORDER.filter(id=>BOSS_REGISTRY[id].implemented));
