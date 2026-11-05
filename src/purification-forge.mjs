import {EVOLUTIONS} from './weapon-evolution.mjs';

// Permanent, per-browser progression. Only the availability of flames and
// purchased tiers is persisted; an active journey is always session-only.
export const FORGE_MAX_TIER=2;
export const MAX_FLAMES=999999;
const safeInt=(value,max=MAX_FLAMES)=>Number.isSafeInteger(value)&&value>=0?Math.min(value,max):0;
export const forgeInventory=()=>Object.fromEntries(Object.keys(EVOLUTIONS).map(weapon=>[
 weapon,Object.fromEntries(EVOLUTIONS[weapon].map(({id})=>[id,0]))
]));
export function sanitizeForge(input){
 const clean=forgeInventory();
 if(!input||typeof input!=='object'||Array.isArray(input))return clean;
 for(const [weapon,branches]of Object.entries(clean)){
  const saved=input[weapon];
  if(!saved||typeof saved!=='object'||Array.isArray(saved))continue;
  for(const id of Object.keys(branches)){const tier=saved[id];branches[id]=Number.isSafeInteger(tier)&&tier>=0&&tier<=FORGE_MAX_TIER?tier:0;}
 }
 return clean;
}
export const investedFlames=(profile,weapon=null)=>Object.entries(sanitizeForge(profile?.forge))
 .filter(([id])=>weapon===null||id===weapon)
 .reduce((sum,[,branches])=>sum+Object.values(branches).reduce((a,b)=>a+b,0),0);
export function normalizeFlameProfile(profile){
 profile.flames=safeInt(profile.flames);
 profile.forge=sanitizeForge(profile.forge);
 profile.earnedFlames=Math.max(safeInt(profile.earnedFlames),profile.flames+investedFlames(profile));
 return profile;
}
export function flameBalance(profile){return safeInt(profile?.flames);}
export function awardPurificationFlame(profile){
 if(flameBalance(profile)>=MAX_FLAMES)return false;
 profile.flames=flameBalance(profile)+1;
 profile.earnedFlames=safeInt(profile.earnedFlames)+1;
 return true;
}
// Deliberate developer-only Easter egg. Not available outside the forge UI.
export const FORGE_DEVELOPER_FLAMES=2;
export function grantForgeDeveloperFlames(profile){
 if(!profile||typeof profile!=='object'||flameBalance(profile)>MAX_FLAMES-FORGE_DEVELOPER_FLAMES)return 0;
 profile.flames=flameBalance(profile)+FORGE_DEVELOPER_FLAMES;
 profile.earnedFlames=Math.min(MAX_FLAMES,safeInt(profile.earnedFlames)+FORGE_DEVELOPER_FLAMES);
 return FORGE_DEVELOPER_FLAMES;
}
export function isForgeDeveloperShortcut(event){
 return (event?.code==='Semicolon'||event?.key===';')&&
  !event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!event.shiftKey&&
  !event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
}
export function forgeTier(profile,weapon,id){
 if(!EVOLUTIONS[weapon]?.some(e=>e.id===id))return 0;
 return sanitizeForge(profile?.forge)[weapon][id];
}
export function buyForgeTier(profile,weapon,id){
 if(!EVOLUTIONS[weapon]?.some(e=>e.id===id))return false;
 if(flameBalance(profile)<1||forgeTier(profile,weapon,id)>=FORGE_MAX_TIER)return false;
 profile.forge=sanitizeForge(profile.forge);
 profile.forge[weapon][id]+=1;
 profile.flames=flameBalance(profile)-1;
 return true;
}
export function refundForgeWeapon(profile,weapon){
 if(!Object.hasOwn(EVOLUTIONS,weapon))return 0;
 profile.forge=sanitizeForge(profile.forge);
 const points=Object.values(profile.forge[weapon]).reduce((a,b)=>a+b,0);
 if(!points||flameBalance(profile)+points>MAX_FLAMES)return 0;
 profile.flames=flameBalance(profile)+points;
 for(const id of Object.keys(profile.forge[weapon]))profile.forge[weapon][id]=0;
 return points;
}
export function forgedEvolutions(profile,weapon){
 if(!Object.hasOwn(EVOLUTIONS,weapon))return [];
 const owned=sanitizeForge(profile?.forge)[weapon];
 return EVOLUTIONS[weapon].flatMap(({id})=>Array(owned[id]).fill(id));
}
