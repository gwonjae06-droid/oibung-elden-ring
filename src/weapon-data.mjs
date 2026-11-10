import {PLAYER_DAMAGE_MULTIPLIER} from './balance.mjs';
const BASE_WEAPONS = {
  sword:{name:'검',damage:72,cost:18,wind:.17,active:.14,end:.32,range:3.5,poise:24},
  hammer:{name:'망치',damage:114,cost:27,wind:.43,active:.18,end:.52,range:3.7,poise:62},
  bow:{name:'활',damage:49,cost:17,wind:.48,active:.08,end:.36,range:34,poise:13,projectile:true},
  cards:{name:'카드',damage:18,cost:22,wind:.27,active:.10,end:.35,range:28,poise:9,projectile:true}
};
// The one place where the global player damage balance is applied.
export const WEAPONS = Object.fromEntries(Object.entries(BASE_WEAPONS).map(([id,weapon])=>[id,{...weapon,damage:Math.round(weapon.damage*PLAYER_DAMAGE_MULTIPLIER)}]));
