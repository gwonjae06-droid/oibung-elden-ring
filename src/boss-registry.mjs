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
  hint:()=>'연속 베기가 끝난 뒤 반격하고, 공격할 기력을 남겨두세요.'},
 clown:{name:'광대 오슬우',implemented:true,kind:'module',dialogId:'clown-battle',gameKey:'clown',reward:'flame',
  hint:()=>'공연의 경고를 읽고 안전한 위치를 먼저 확보하세요.',
  load:()=>import('./clown-battle.mjs'),
  launch:(m,o)=>m.launchClownBattle({weapon:o.weapon,practice:true,configure:o.configure,onClose:o.onClose})},
 dice:{name:'거대 주사위 박성원',implemented:true,kind:'module',dialogId:'dice-battle',gameKey:'dice',reward:'flame',
  hint:g=>g?.dice?.giant?'양손을 부수면 박성원이 분노합니다. 머리를 탁자에 찍은 직후 드러난 사진 면에 반격하세요.':'주사위 몸체는 회피 무적으로 통과할 수 없습니다. 진행 방향 옆으로 빠진 후 사진 면을 노리세요.',
  secret:{label:'박성원 · 육체 강탈부터',phase:2},
  damage:()=>import('./dice-combat.mjs').then(m=>m.damageDice),
  load:()=>import('./dice-battle.mjs'),
  launch:(m,o)=>m.launchDiceBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose,startPhase:o.startPhase})},
 blood:{name:'영원한 혈왕 배서준',implemented:true,kind:'module',dialogId:'blood-battle',gameKey:'blood',reward:'flame',
  hint:()=>'비행 공격 뒤 착지한 붉은 구체에 반격하세요. 사슬 이후의 분수는 회피할 수 있습니다.',
  place:'성혈 대성당에',
  damage:()=>import('./blood-combat.mjs').then(m=>m.damageBlood),
  load:()=>import('./blood-battle.mjs'),
  launch:(m,o)=>m.launchBloodBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose})},
 gyuwon:{name:'무두의 사유 최규원',implemented:false,kind:'module',dialogId:'gyuwon-battle',gameKey:'gyuwon',reward:'flame',hint:()=>''}
};
export const BOSS_REGISTRY=Object.freeze(Object.fromEntries(CAMPAIGN_ORDER.map((id,order)=>[id,Object.freeze({id,order,maxHp:bossMaxHp(order),...DEFINITIONS[id]})])));
// Only finished bosses can be reached from the journey; flip `implemented` when a new boss is ready.
export const PLAYABLE_BOSSES=Object.freeze(CAMPAIGN_ORDER.filter(id=>BOSS_REGISTRY[id].implemented));
