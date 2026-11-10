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
 // Historical saves could buy both paths. Keep the higher-rank path
 // (first listed wins a tie); migration returns the displaced flames.
 for(const [weapon,branches]of Object.entries(clean)){
  const paths=EVOLUTIONS[weapon];
  if(branches[paths[0].id]&&branches[paths[1].id]){
   const keep=branches[paths[1].id]>branches[paths[0].id]?paths[1].id:paths[0].id;
   branches[paths.find(p=>p.id!==keep).id]=0;
  }
 }
 return clean;
}
const legacyInvestment=input=>{
 if(!input||typeof input!=='object')return 0;
 let total=0;
 for(const [weapon,paths]of Object.entries(EVOLUTIONS))
  for(const {id}of paths){const tier=input?.[weapon]?.[id];
   if(Number.isSafeInteger(tier)&&tier>=0&&tier<=FORGE_MAX_TIER)total+=tier;
  }
 return total;
};
export const investedFlames=(profile,weapon=null)=>Object.entries(sanitizeForge(profile?.forge))
 .filter(([id])=>weapon===null||id===weapon)
 .reduce((sum,[,branches])=>sum+Object.values(branches).reduce((a,b)=>a+b,0),0);
export function normalizeFlameProfile(profile){
 const returned=Math.max(0,legacyInvestment(profile.forge)-investedFlames(profile));
 profile.flames=Math.min(MAX_FLAMES,safeInt(profile.flames)+returned);
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
export function forgeTier(profile,weapon,id){
 if(!EVOLUTIONS[weapon]?.some(e=>e.id===id))return 0;
 return sanitizeForge(profile?.forge)[weapon][id];
}
export function buyForgeTier(profile,weapon,id){
 if(!EVOLUTIONS[weapon]?.some(e=>e.id===id)||!profile||typeof profile!=='object')return false;
 normalizeFlameProfile(profile);
 if(flameBalance(profile)<1||forgeTier(profile,weapon,id)>=FORGE_MAX_TIER)return false;
 // The opposite upgrade is unreachable through the UI and API.
 if(EVOLUTIONS[weapon].some(e=>e.id!==id&&forgeTier(profile,weapon,e.id)>0))return false;
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
// Older cached journey modules still import this name. Keep an inert export so
// mixed-version clients can open the menu while refreshing the entry module.
// Revival is retired: this compatibility function never spends or resumes.
export const consumeRevivalFlame=()=>false;
