export const STANDARD_COOLDOWN=10;
export const CARD_INTERVAL=.6;
export const CARD_ORDER=['blue','red','yellow'];
export const SKILLS={sword:{name:'질풍검',duration:5,rate:1.8},hammer:{name:'흡혈 강타',hits:4,heal:.35,multiplier:3},bow:{name:'관통 화살',max:3,multiplier:3},cards:{name:'운명의 선택',blueDuration:3,blueSpeed:1.5,redDamage:1.5,stun:1}};
export function createSkillState(){return {cooldown:0,haste:0,blue:0,nextRed:false,nextYellow:false,hammerHits:0,charges:3,recharge:0,cycle:0};}
export function tickSkills(s,weapon,dt){
  const h=Math.max(0,dt);s.cooldown=Math.max(0,s.cooldown-h);s.haste=Math.max(0,s.haste-h);s.blue=Math.max(0,s.blue-h);
  if(weapon==='cards'&&s.cooldown===0)s.cycle=(s.cycle+h)%(CARD_INTERVAL*3);
  if(weapon==='bow'&&s.charges<3){s.recharge+=h;while(s.recharge>=STANDARD_COOLDOWN&&s.charges<3){s.charges++;s.recharge-=STANDARD_COOLDOWN;}if(s.charges===3)s.recharge=0;}
}
export function currentCard(s){return CARD_ORDER[Math.floor(s.cycle/CARD_INTERVAL)%3];}
export function skillReady(s,weapon){return weapon==='hammer'?s.hammerHits>=4:weapon==='bow'?s.charges>0:s.cooldown<=0;}
export function consumeSkill(s,weapon){
  if(!skillReady(s,weapon))return null;
  if(weapon==='sword'){s.haste=5;s.cooldown=STANDARD_COOLDOWN;return 'sword';}
  if(weapon==='hammer'){s.hammerHits=0;return 'hammer';}
  if(weapon==='bow'){s.charges--;return 'bow';}
  if(weapon==='cards'){
    const card=currentCard(s);s.cooldown=STANDARD_COOLDOWN;s.cycle=0;
    if(card==='blue')s.blue=3;
    if(card==='red')s.nextRed=true;
    if(card==='yellow')s.nextYellow=true;
    return card;
  }
  return null;
}
export const SKILL_COLORS={sword:[.55,.85,1],hammer:[1,.45,.18],bow:[.6,1,.5],blue:[.3,.62,1],red:[1,.22,.18],yellow:[1,.86,.25],heal:[1,.2,.38],white:[1,1,1]};
export const SKILL_HEX={sword:0x8fd8ff,hammer:0xff7a2e,bow:0x9dff80,blue:0x4d9fff,red:0xff3a2e,yellow:0xffdc40,heal:0xff3361,white:0xffffff};
export const CARD_NOTICE={blue:'파랑 카드 · 이동 속도 +50%',red:'빨강 카드 · 다음 공격 +50%',yellow:'노랑 카드 · 다음 적중 시 기절'};
