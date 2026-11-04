// Test-only controls invoke the real damage paths in the production arenas.
import {readBattleSession} from '../src/battle-session.mjs';
import {launchClownBattle} from '../src/clown-battle.mjs';
import {launchDiceBattle} from '../src/dice-battle.mjs';
import {launchBloodBattle} from '../src/blood-battle.mjs';
import {hurt as hurtClown} from '../src/clown-combat.mjs';
import {stepDicePlayer} from '../src/dice-player.mjs';
import {startBloodPattern} from '../src/blood-combat.mjs';
import {clearBossHitTraits} from '../src/boss-hit-traits.mjs';
let boss=null,battle=null;
const root=()=>boss==='kwon'?document:document.getElementById(boss+'-battle')?.firstElementChild?.shadowRoot;
const current=()=>readBattleSession(root());
const error=e=>parent.postMessage({traitError:String(e.message||e)},location.origin);
window.addEventListener('error',error);window.addEventListener('unhandledrejection',e=>error(e.reason));
function close(){battle?.close();battle=null;readBattleSession(document)?.menu?.();}
const configure=g=>{g.startGrace=0;g.player.hp=g.player.maxHp=10000;if(g.clown)g.clown.stunT=1e6;if(g.dice){g.dice.giantEnabled=false;g.dice.state='recovery';g.dice.t=-1e6;g.dice.spikeCooldown=1e6;g.player.x=g.player.z=20;}if(g.blood){g.blood.recover=1e6;g.boss.hp=g.boss.maxHp*.8;}if(!g.clown&&!g.dice&&!g.blood)g.boss.stun=1e6;};
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||!e.data.traitQa)return;try{
 const cmd=e.data.traitQa;
 if(['kwon','clown','dice','blood'].includes(cmd)){close();boss=cmd;document.getElementById('journey')?.close();if(cmd==='kwon')readBattleSession(document).start('sword',configure);else battle=({clown:launchClownBattle,dice:launchDiceBattle,blood:launchBloodBattle}[cmd])({weapon:'sword',practice:true,configure});return;}
 const s=current(),g=s?.game;if(cmd==='close'){close();boss=null;return;}if(!g)return;
 if(cmd==='clear'){clearBossHitTraits(g);return;}
 if(cmd==='hit'){
  g.player.invuln=0;s.resume();
  if(boss==='kwon')g.bossShots.push({x:g.player.x,z:g.player.z,yaw:0,speed:0,life:.05,damage:10});
  if(boss==='clown')hurtClown(g,10,'qa');
  if(boss==='dice'){g.dice.stun=0;const p={x:g.player.x,z:g.player.z,index:g.dice.index};Object.assign(g.dice,{state:'charge',t:0,from:p,to:p});stepDicePlayer(g,.005);g.dice.stun=1e6;g.dice.pose.x=g.player.x-18;g.dice.pose.z=g.player.z-18;}
  if(boss==='blood'){startBloodPattern(g,'burst');for(const h of g.blood.hazards)h.warn=.05;}
 }
}catch(e){error(e);}});
setInterval(()=>{const s=current(),r=root(),g=s?.game,icon=r?.querySelector?.('.boss-hit-trait-icon'),body=icon?.style;parent.postMessage({traitStatus:{ready:!!readBattleSession(document),boss,active:!!s?.active,traits:g?.player.traits,hp:g?.player.hp,bossHp:g?.boss.hp,action:g?.player.action,icon:icon?{text:icon.textContent,display:body.display,svg:icon.innerHTML}:null}},location.origin);},100);
