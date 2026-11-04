import {installBossMusic} from '../src/boss-music.mjs';
// QA only; this module is never imported by the production entry point.
import {launchBloodBattle} from '../src/blood-battle.mjs';
import {readBattleSession} from '../src/battle-session.mjs';
import {damageBlood,stepBlood,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
let battle=null,report={},run=0;
const post=()=>parent.postMessage({bloodQaStatus:report},location.origin),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const state=()=>readBattleSession(document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot);
const error=e=>parent.postMessage({bloodQaError:String(e.message||e)},location.origin);
window.addEventListener('error',error);window.addEventListener('unhandledrejection',e=>error(e.reason));
const originalError=console.error;console.error=(...args)=>{error(args.map(String).join(' '));originalError(...args);};
function start(){battle?.close();battle=launchBloodBattle({diagnostics:true,configure:g=>{g.startGrace=0;g.player.hp=g.player.maxHp=1e6;g.blood.recover=1e6;},onClose:()=>{}});}
function cast(id){const s=state(),g=s.game;g.status='playing';g.boss.phase=BLOOD_PATTERNS[id].phase;g.boss.state='recovery';g.blood.phasePending=false;g.blood.recover=1e6;g.blood.stun=0;startBloodPattern(g,id);s.resume();}
async function sequence(){const token=++run,results=[];for(const [id,spec]of Object.entries(BLOOD_PATTERNS)){if(run!==token||!state())return;cast(id);const g=state().game,before=g.player.hp;await sleep((spec.duration+.2)*1000);results.push({id,hpLost:before-g.player.hp,stats:state().diagnostics()});report.sequence=results;post();}report.complete=true;post();}
async function repeat(){const s=state(),g=s.game;s.pause();const iterations=[];for(let round=0;round<4;round++){
 for(const [id,spec]of Object.entries(BLOOD_PATTERNS)){g.boss.phase=spec.phase;g.boss.state='recovery';g.blood.phasePending=false;startBloodPattern(g,id);for(let t=0;t<spec.duration+.1;t+=.05){stepBlood(g,.05);await new Promise(requestAnimationFrame);}}
 iterations.push(s.diagnostics().graphics);report.repeated=iterations;post();
}report.repeatComplete=true;post();}
window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||!e.data.bloodQa)return;try{
 const cmd=e.data.bloodQa,s=state(),g=s?.game;
 if(cmd==='start'||cmd==='retry'){run++;report={};start();}
 
 if(cmd==='close'){run++;battle?.close();}
 if(cmd==='pause')s.pause();if(cmd==='resume'){s.resume();}
 if(cmd==='pattern')cast(e.data.pattern);
 if(cmd==='transition'){g.boss.phase=1;g.boss.state='recovery';g.blood.transitioned=false;damageBlood(g,g.boss.maxHp*.6);s.resume();}
 if(cmd==='mute')localStorage.setItem('oibung-muted','1');if(cmd==='unmute')localStorage.removeItem('oibung-muted');
 if(cmd==='sequence')void sequence().catch(error);
 if(cmd==='repeat')void repeat().catch(error);
 
}catch(err){error(err);}});
setInterval(()=>{const s=state();if(s){const g=s.game;if(g.boss.state==='transition'){report.cinematic??=[];if(report.cinematic.length<80)report.cinematic.push({t:g.blood.t,clock:g.time,audio:s.diagnostics().audioState,music:installBossMusic().trackState});}report={...report,active:s.active,phase:g.boss.phase,state:g.boss.state,time:g.time,transitionTime:g.blood.t,hp:g.player.hp,diagnostics:s.diagnostics(),music:installBossMusic().trackState,viewport:{width:innerWidth,height:innerHeight},hud:Array.from(document.querySelector('#blood-battle').firstElementChild.shadowRoot.querySelectorAll('#boss-hud,#touch')).map(el=>({id:el.id,rect:el.getBoundingClientRect().toJSON(),hidden:el.hidden}))};}else report={...report,closed:true};post();},300);
post();
