export const STANDARD_COOLDOWN=10;
export const CARD_INTERVAL=.6;
export const CARD_ORDER=['blue','red','yellow'];
// The original four universal active skills are retired. Only a forge-selected
// weapon specialization may grant an active cast.
export const SKILLS=Object.freeze({sword:{name:'검술'},hammer:{name:'철추'},bow:{name:'궁술'},cards:{name:'패술'}});
export function createSkillState(){return {cooldown:0,storedDamage:0,haste:0,blue:0,nextRed:false,nextYellow:false,hammerHits:0,charges:0,recharge:0,cycle:0,autoCardCycle:0};}
export function tickSkills(s,weapon,dt){s.cooldown=Math.max(0,(s.cooldown||0)-Math.max(0,dt));}
export function currentCard(){return null;}
export function skillReady(){return false;}
export function consumeSkill(){return null;}
export const SKILL_COLORS={sword:[.55,.85,1],hammer:[1,.45,.18],bow:[.6,1,.5],cards:[.82,.53,1],blue:[.3,.62,1],red:[1,.22,.18],yellow:[1,.86,.25],heal:[1,.2,.38],white:[1,1,1]};
export const SKILL_HEX={sword:0x8fd8ff,hammer:0xff7a2e,bow:0x9dff80,cards:0xdba6ff,blue:0x4d9fff,red:0xff3a2e,yellow:0xffdc40,heal:0xff3361,white:0xffffff};
export const CARD_NOTICE={};
