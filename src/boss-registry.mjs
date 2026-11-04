import {bossMaxHp} from './balance.mjs';
// Fixed campaign order. Add a boss here (and implement it) instead of editing the journey code.
export const CAMPAIGN_ORDER=Object.freeze(['kwon','clown','dice','blood','gyuwon']);
// reward: what happens after the boss is defeated. 'evolution' = pick a weapon evolution, 'advance' = go straight on,
// 'ending' = the final boss (no reward screen).
// gameKey: the property that marks a game object as this boss's game (game.clown, game.dice, game.blood).
const DEFINITIONS={
 kwon:{name:'긴턱의 이권재',implemented:true,kind:'arena',dialogId:null,gameKey:null,reward:'evolution'},
 clown:{name:'광대 오슬우',implemented:true,kind:'module',dialogId:'clown-battle',gameKey:'clown',reward:'evolution',
  load:()=>import('./clown-battle.mjs'),
  launch:(m,o)=>m.launchClownBattle({weapon:o.weapon,practice:true,configure:o.configure,onClose:o.onClose})},
 dice:{name:'거대 주사위 박성원',implemented:true,kind:'module',dialogId:'dice-battle',gameKey:'dice',reward:'advance',
  load:()=>import('./dice-battle.mjs'),
  launch:(m,o)=>m.launchDiceBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose,startPhase:o.startPhase})},
 blood:{name:'영원한 혈왕 배서준',implemented:true,kind:'module',dialogId:'blood-battle',gameKey:'blood',reward:'advance',
  load:()=>import('./blood-battle.mjs'),
  launch:(m,o)=>m.launchBloodBattle({weapon:o.weapon,configure:o.configure,onClose:o.onClose})},
 gyuwon:{name:'무두의 사유 최규원',implemented:false,kind:'module',dialogId:'gyuwon-battle',gameKey:'gyuwon',reward:'ending'}
};
export const BOSS_REGISTRY=Object.freeze(Object.fromEntries(CAMPAIGN_ORDER.map((id,order)=>[id,Object.freeze({id,order,maxHp:bossMaxHp(order),...DEFINITIONS[id]})])));
// Only finished bosses can be reached from the journey; flip `implemented` when a new boss is ready.
export const PLAYABLE_BOSSES=Object.freeze(CAMPAIGN_ORDER.filter(id=>BOSS_REGISTRY[id].implemented));
