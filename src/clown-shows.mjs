import {runStageVariant} from './clown-stage-shows.mjs';
export const CLOWN_SHOWS=Object.freeze({headReturn:Object.freeze({name:'머리 좀 받아줘!',dur:4.8,recover:1.4,phases:[1,2]}),offbeatClap:Object.freeze({name:'박수는 끝까지 치셔야죠',dur:6.5,recover:1.3,phases:[1,2]}),runaway:Object.freeze({name:'야, 멈춰! 멈추라고!',dur:5.8,recover:2,phases:[2]})});
const SIGNATURE_OPENINGS={1:['laughBomb','clap','laughBomb','laughBomb','laughBomb'],2:['dash','laughBomb','clap','dash','laughBomb','dash','laughBomb','laughBomb']};
function signatureBook(g){const c=g.clown,phase=g.boss.phase===2?2:1;if(c.signatureBook?.phase!==phase)c.signatureBook={phase,turn:0,index:0};c.stageCounts??={};c.stageCounts.headReturn??=1;if(phase===2)c.stageCounts.runaway??=1;return c.signatureBook;}
export function nextSignatureOpening(g){const b=signatureBook(g);return b.turn%3===2?null:SIGNATURE_OPENINGS[b.phase][b.index%SIGNATURE_OPENINGS[b.phase].length];}
export function recordSignatureOpening(g,forced=false){const b=signatureBook(g);b.turn++;if(forced)b.index++;}
const STAGE_LABELS={photo:'이쪽 보세요, 찰칵!',confetti:'폭탄인 줄 알았죠?',curtain:'커튼 뒤에 뭐가 있을까요',tilt:'무대 좀 돌리겠습니다',encore:'공연 종료 — 앙코르!'};
export function clownShowName(g){const c=g?.clown;if(g?.status!=='playing'||['transition','dead'].includes(g?.boss?.state)||c?.state!=='pattern'||c.punish||c.stunT>0||!CLOWN_SHOWS[c.showKey])return null;const valid=c.showKey==='headReturn'&&['photo','confetti','curtain'].includes(c.stageKey)||c.showKey==='runaway'&&['tilt','encore'].includes(c.stageKey);return valid?STAGE_LABELS[c.stageKey]:CLOWN_SHOWS[c.showKey].name;}
export function updateClownShowLabel(g,doc=globalThis.document){const name=clownShowName(g);if(!name)return false;const label=doc?.getElementById?.('clown-battle')?.firstElementChild?.shadowRoot?.getElementById?.('boss-action');if(!label)return false;label.textContent=name;return true;}
const cross=(a,t,v)=>a<v&&t>=v,clamp=v=>Math.max(0,Math.min(1,v));
export function runClownShow(name,g,c,a,t,api){
 if(!CLOWN_SHOWS[name])throw new Error('Unknown clown show');
 if(runStageVariant(name,g,c,a,t,api))return;
 if(name==='headReturn'){
  const path=api.once(c,'show-path',()=>{const from={x:g.boss.x,z:g.boss.z},yaw=Math.atan2(g.player.x-from.x,g.player.z-from.z),len=api.fitLen(from,yaw,30),to={x:from.x+Math.sin(yaw)*len,z:from.z+Math.cos(yaw)*len};c.yaw=yaw;api.emit(g,'clown-inflate');api.zone(g,{shape:'lane',...from,yaw,len,w:4.2,warn:.8,visual:true});return {from,to,yaw,len};});
  if(t<.65)api.head(c,'inflate',t/.65);else if(t<.8){api.head(c,'hold',1);if(cross(a,t,.65))api.emit(g,'clown-silence');}else{api.head(c,'regrow',clamp((t-.8)/3.8),'small');c.vis.throwK=clamp((t-.8)/.25);}
  if(cross(a,t,.8)){api.bomb(g,{kind:'roll',from:{...path.from,y:2.1},x:path.to.x,z:path.to.z,px:path.from.x,pz:path.from.z,fly:0,travel:.6,warn:.6,r:2.1});api.emit(g,'clown-roll');}
  if(cross(a,t,1.4)){api.zone(g,{shape:'lane',...path.to,yaw:path.yaw+Math.PI,len:path.len,w:4.2,warn:.55,visual:true});api.zone(g,{shape:'circle',...path.from,r:4,warn:1.5,damage:34,blast:true});api.emit(g,'clown-bounce');}
  if(cross(a,t,1.95)){api.bomb(g,{kind:'roll',from:{...path.to,y:2.1},x:path.from.x,z:path.from.z,px:path.to.x,pz:path.to.z,fly:0,travel:.6,warn:.6,r:2.1});api.emit(g,'clown-roll');}
  if(t>=2.55){c.vis.tilt=Math.sin(t*15)*.4;c.vis.crouch=.65;}return;
 }
 if(name==='offbeatClap'){
  api.once(c,'show-clap',()=>{c.yaw=Math.atan2(g.player.x-g.boss.x,g.player.z-g.boss.z);api.cone(g,c.yaw,.8,20,.6,26,'clap');});
  if(cross(a,t,.8))api.cone(g,c.yaw,.8,20,.6,26,'clap');
  if(cross(a,t,2)){c.f.showFinalYaw=Math.atan2(g.player.x-g.boss.x,g.player.z-g.boss.z);api.cone(g,c.f.showFinalYaw+Math.PI/2,.8,8,1.25,24,'carousel');}
  if(cross(a,t,3.3))api.cone(g,c.f.showFinalYaw,.8,23,.9,34,'clap');
  c.vis.glove=t<1.6?.5+.5*Math.abs(Math.sin(t*Math.PI/.8)):t<3.3?1:1-clamp((t-4.1)/.5);c.vis.tilt=t>=2&&t<2.8?-.5:t>=4.1?.4*(1-clamp((t-4.1)/1)):0;return;
 }
 api.dashPart(g,c,a,t,0,'show-run-first');api.dashPart(g,c,a,t,1.9,'show-run-second');
 if(t>=3.3){c.noSeparate=false;c.vis.crouch=1-clamp((t-4.8)/1);c.vis.tilt=Math.sin(t*13)*.3*(1-clamp((t-3.3)/1.8));}
}
