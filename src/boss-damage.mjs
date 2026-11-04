import {bossOfGame} from './battle-dialogs.mjs';
// Plain boss damage used by the arena-style bosses (kwon, clown). Bosses with their own rules register a `damage` loader in the registry.
export function damageStandard(g,amount){
 const b=g.boss;
 if(!Number.isFinite(b?.hp)||b.hp<=0||b.state==='transition')return 0;
 const n=Math.min(amount,b.hp);
 b.hp-=n;
 if(g.stats){g.stats.damage+=n;g.stats.hits++;}
 g.events.push({type:'boss-hit',amount:Math.round(n),big:true,developer:true});
 if(b.hp<=0){
  b.hp=0;b.state='dead';b.queue=[];
  g.status='won';g.projectiles=[];g.bossShots=[];
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'defeated'});
  g.events.push({type:'victory'});
 }else if(b.phase===1&&b.hp<=b.maxHp*0.5){
  Object.assign(b,{phase:2,state:'transition',t:0,queue:[],poise:0,stun:0,punishable:false});
  g.projectiles=[];g.bossShots=[];g.player.action=null;
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'transition',name:null,f:{},punish:false,noSeparate:false});
  g.events.push({type:'phase'});
 }
 return n;
}
// Finds the boss that owns this game through the registry and hands the damage to its own rules.
export async function applyBossDamage(g,amount){
 const load=bossOfGame(g).damage;
 if(load){const damage=await load();return damage(g,amount);}
 return damageStandard(g,amount);
}
