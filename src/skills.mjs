// Legacy generic weapon active abilities retired. Only the equipped forge path
// can unlock an active action; unupgraded weapons use ordinary attacks.
export const STANDARD_COOLDOWN=10;
export const SKILLS=Object.freeze({
 sword:{name:'검술'},hammer:{name:'망치 기술'},bow:{name:'궁술'},cards:{name:'카드 각인'}
});
export function createSkillState(){return {cooldown:0,storedDamage:0,sigilMarks:0};}
export function tickSkills(s,weapon,dt){s.cooldown=Math.max(0,(s.cooldown||0)-Math.max(0,dt));}
export const skillReady=()=>false;
export const consumeSkill=()=>null;
export const SKILL_COLORS={sword:[.55,.85,1],hammer:[1,.45,.18],bow:[.6,1,.5],blue:[.3,.62,1],red:[1,.22,.18],yellow:[1,.86,.25],heal:[1,.2,.38],white:[1,1,1]};
export const SKILL_HEX={sword:0x8fd8ff,hammer:0xff7a2e,bow:0x9dff80,blue:0x4d9fff,red:0xff3a2e,yellow:0xffdc40,heal:0xff3361,white:0xffffff};
