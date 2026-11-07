// Ensemble dramaturgy for the living nightmare circus.
// Every hit is authored through the authoritative delayed combat-zone API;
// cast animation, optional props, lighting and Foley never cause damage.
// The four restored vintage routines retain their original pattern IDs.
import {cueCircusShow,stageCircusBeat,circusTroupeAlive} from './clown-troupe.mjs';
const TAU=Math.PI*2;
const cross=(a,t,x)=>a<x&&t>=x;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
const bound=p=>{const d=Math.hypot(p.x,p.z);return d>22?{x:p.x*22/d,z:p.z*22/d}:{x:p.x,z:p.z};};
const move=(p,yaw,dist)=>bound({x:p.x+Math.sin(yaw)*dist,z:p.z+Math.cos(yaw)*dist});
const aim=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const role=(g,name,i=0)=>{const a=circusTroupeAlive(g).filter(x=>x.role===name);return a[i%Math.max(1,a.length)]||g.boss;};
function curtain(g,c,api,show,kind='curtain'){
 return api.once(c,'ensemble-curtain',()=>{
  cueCircusShow(g,show);
  api.emit(g,'clown-troupe-show',{show,kind,x:g.boss.x,z:g.boss.z});
  return true;
 });
}
function beat(api,g,c,key,at,{role:kind='acrobat',roleIndex=0,pose='juggle',sound=pose,wind=1.35,hold=1.7,force=null}={}){
 return api.once(c,'choreo-'+key,()=>{
  const actor=stageCircusBeat(g,{role:kind,index:roleIndex,pose,wind,hold});
  const origin=actor||g.boss;
  api.emit(g,'clown-troupe-beat',{kind:sound,role:kind,pose,x:origin.x,z:origin.z,show:c.name});
  return {x:origin.x,z:origin.z,yaw:origin.yaw};
 });
}
function lane(api,g,p,yaw,len,w,warn,damage,sound){
 return api.zone(g,{shape:'lane',...bound(p),yaw,len:clamp(len,3,30),w,warn,damage,sound,major:true});
}
function ring(api,g,p,r,warn,damage,sound){
 return api.zone(g,{shape:'circle',...bound(p),r,warn,damage,blast:true,major:true,sound});
}
const actorLane=(api,g,actor,target,opts={})=>{
 const yaw=aim(actor,target),distance=Math.hypot(actor.x-target.x,actor.z-target.z);
 return lane(api,g,actor,yaw,Math.min(22,distance+2),opts.w||2.4,opts.warn||1.3,opts.damage||23,opts.sound||'knifeJuggler');
};
// DISTINCT NEW ROLES AND FORMATIONS - lengths are body-clock seconds excluding
// the existing standardized pre-cast. Last attacks land before recovery.
export const ENSEMBLE_DEFINITIONS=Object.freeze([
 ['knifeJugglerRelay','칼 저글러들의 릴레이',7.1,1.45,[1,2],1],
 ['midnightDrumline','한밤의 북소리 대열',7.4,1.55,[1,2],1],
 ['tightropeExecution','허공의 곡예단',7.7,1.65,[1,2],1],
 ['maskedTrapdoor','가면극의 비밀문',7.1,1.6,[1,2],1],
 ['ringmasterDoubleAct','두 명의 가짜 단장',7.2,1.5,[1,2],1],
 ['emberCarouselRevue','불꽃 회전목마의 귀환',8.1,1.7,[2],2],
 ['candlelightChoir','촛불을 든 합창단',8.4,1.65,[2],2],
 ['marionetteGallows','실에 묶인 대합주',9.0,1.8,[2],2],
 ['maskedCannonade','가면단의 인간 대포',8.2,1.65,[2],2],
 ['curtainOfLostVoices','장막 뒤의 잃어버린 목소리',9.0,1.85,[2],3],
 ['allCastRequiem','악몽의 서커스단 진혼곡',10.6,2.15,[2],3],
]);
// Each singer or acrobat prepares on the ACTUAL puppet mesh. The warning
// origin is frozen at cast time so movement cannot drag a hitbox onto a player.
function knifeJugglerRelay(g,c,a,t,api){
 curtain(g,c,api,'juggle','juggle');
 const p=api.once(c,'knife-snapshot',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.25+i*1.10)){
  const q=beat(api,g,c,'knife'+i,t,{role:'acrobat',roleIndex:i,pose:'juggle',sound:'knife',wind:1.3});
  const offset=move(p,Math.PI/2*(i%2?1:-1),i%2?1.5:2);
  actorLane(api,g,q,offset,{w:2.15,warn:1.30,damage:20+i%2*2,sound:'knifeJuggler'});
 }
}
function midnightDrumline(g,c,a,t,api){
 curtain(g,c,api,'drums','drums');
 const center=api.once(c,'drum-target',()=>bound(g.player)),gap=(c.seq||0)%5;
 for(let i=0;i<5;i++)if(cross(a,t,.25+i*.94)){
  const q=beat(api,g,c,'drum'+i,t,{role:'acrobat',roleIndex:i,pose:'drum',sound:'drum',wind:1.33});
  // Alternating five percussion lines with one missing line: a clear aisle.
  const idx=(i+1+gap)%5,offset=(idx-2)*3.7;
  const x=clamp(center.x+offset,-21,21),yaw=i%2?Math.PI:0;
  lane(api,g,{x,z:yaw?17:-17},yaw,29,2.30,1.33,23,'drumLine');
 }
}
function tightropeExecution(g,c,a,t,api){
 curtain(g,c,api,'trapeze','trapeze');
 const anchor=api.once(c,'rope-center',()=>bound(g.player));
 const angles=[.68,-.72,1.09,-1.01];
 for(let i=0;i<4;i++)if(cross(a,t,.35+i*1.11)){
  const q=beat(api,g,c,'rope'+i,t,{role:'acrobat',roleIndex:i,pose:'vault',sound:'rope',wind:1.4});
  const from=move(anchor,angles[i]+Math.PI,10.5),yaw=aim(from,anchor);
  lane(api,g,from,yaw,19,2.25,1.40,24,'trapezeWire');
 }
}
function maskedTrapdoor(g,c,a,t,api){
 curtain(g,c,api,'puppets','trapdoor');
 const anchor=api.once(c,'trap-anchor',()=>bound(g.player));
 const gap=(c.seq||0)%6;
 for(let i=0;i<6;i++)if(i!==gap&&cross(a,t,.25+i*.83)){
  beat(api,g,c,'trap'+i,t,{role:'puppeteer',roleIndex:i,pose:'strings',sound:'trapdoor',wind:1.30});
  const q=move(anchor,i*TAU/6,5.3);
  ring(api,g,q,2.28,1.30,21,'trapdoorRevue');
 }
}
function ringmasterDoubleAct(g,c,a,t,api){
 curtain(g,c,api,'twins','twins');
 const p=api.once(c,'mirror-center',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.34+i*1.05)){
  const q=beat(api,g,c,'mirror'+i,t,{role:'mimic',roleIndex:i,pose:'mirror',sound:'mask',wind:1.3});
  const side=i%2?1:-1,destination=move(p,side*Math.PI*.65,i>1?4:2);
  actorLane(api,g,q,destination,{w:2.7,warn:1.30,damage:22,sound:'mirrorDouble'});
 }
}
function emberCarouselRevue(g,c,a,t,api){
 curtain(g,c,api,'fire','carousel');
 const p=api.once(c,'carousel-center',()=>bound(g.player)),gap=(c.seq||0)%8;
 for(let i=0;i<8;i++)if(i!==gap&&i!==(gap+1)%8&&cross(a,t,.26+i*.65)){
  beat(api,g,c,'hoop'+i,t,{role:'firekeeper',roleIndex:i,pose:'hoop',sound:'fire',wind:1.37});
  const q=move(p,TAU*i/8,7.5);
  ring(api,g,q,2.15,1.37,23,'infernalHoops');
 }
}
function candlelightChoir(g,c,a,t,api){
 curtain(g,c,api,'chorus','choir');
 const anchor=api.once(c,'choir-snap',()=>bound(g.player)),gap=c.seq%5;
 for(let i=0;i<6;i++)if(cross(a,t,.37+i*.83)){
  if(i%5===gap)continue;
  const singer=beat(api,g,c,'song'+i,t,{role:'chorister',roleIndex:i,pose:'sing',sound:'choir',wind:1.40});
  const target=move(anchor,(i%2?1:-1)*.22,i===4?2.4:0);
  actorLane(api,g,singer,target,{w:2.65,warn:1.4,damage:24,sound:'candleChoir'});
 }
}
function marionetteGallows(g,c,a,t,api){
 curtain(g,c,api,'puppets','puppet');
 const center=api.once(c,'gallows-target',()=>bound(g.player));
 const gap=c.seq%5;
 for(let i=0;i<6;i++)if(cross(a,t,.45+i*.9)){
  const q=beat(api,g,c,'string'+i,t,{role:'puppeteer',roleIndex:i,pose:'strings',sound:'puppet',wind:1.42});
  const angle=i*Math.PI/3+.18;
  if(i===gap)continue;
  const hanging=move(center,angle,3.2+(i%3)*.65);
  actorLane(api,g,q,hanging,{w:2.35,warn:1.42,damage:25,sound:'marionetteStrings'});
 }
}
function maskedCannonade(g,c,a,t,api){
 curtain(g,c,api,'cannon','cannon');
 const p=api.once(c,'cannon-anchor',()=>bound(g.player));
 for(let i=0;i<5;i++)if(cross(a,t,.32+i*1.03)){
  beat(api,g,c,'cannon'+i,t,{role:i%2?'mimic':'acrobat',roleIndex:i,pose:'cannon',sound:'cannon',wind:1.45});
  const q=move(p,i*TAU/5,3.3+(i%2)*2.8);
  ring(api,g,q,2.5,1.45,26,'maskedCannon');
 }
}
function curtainOfLostVoices(g,c,a,t,api){
 curtain(g,c,api,'curtain','curtain');
 const p=api.once(c,'veil-anchor',()=>bound(g.player)),gap=c.seq%6;
 for(let i=0;i<6;i++)if(cross(a,t,.28+i*1.07)){
  const type=i%2?'chorister':'puppeteer';
  const actor=beat(api,g,c,'veil'+i,t,{role:type,roleIndex:i,pose:type==='chorister'?'sing':'strings',sound:'curtain',wind:1.52});
  const yaw=aim(actor,p)+(i-gap)*.1;
  lane(api,g,actor,yaw,19,2.55,1.52,26,'curtainEcho');
 }
}
function allCastRequiem(g,c,a,t,api){
 curtain(g,c,api,'finale','finale');
 const anchor=api.once(c,'requiem-center',()=>bound(g.player)),gap=c.seq%10;
 for(let i=0;i<10;i++)if(cross(a,t,.30+i*.67)){
  const roles=['chorister','acrobat','puppeteer','firekeeper','mimic'],r=roles[i%roles.length],
   pose={chorister:'sing',acrobat:'vault',puppeteer:'strings',firekeeper:'hoop',mimic:'mirror'}[r];
  const act=beat(api,g,c,'requiem'+i,t,{role:r,roleIndex:i,pose,sound:i%2?'finale':'bell',wind:1.43});
  if(i%10===gap||i%10===(gap+1)%10)continue;
  if(i%2){const q=move(anchor,i*TAU/10,6.6);ring(api,g,q,2.4,1.43,27,i%5===3?'infernalHoops':'requiemChoir');}
  else actorLane(api,g,act,anchor,{w:2.5,warn:1.43,damage:27,sound:'requiemStrings'});
 }
}
// Four vintage acts RECUT as living-cast attack performances, not old
// spheres, camera gags or free-floating arbitrary warning cylinders.
function drumMarch(g,c,a,t,api){midnightDrumline(g,c,a,t,api);}
function spotlightSweep(g,c,a,t,api){
 curtain(g,c,api,'chorus','spotlight');
 const p=api.once(c,'spotlight-p',()=>bound(g.player));
 for(let i=0;i<3;i++)if(cross(a,t,.22+i*.85)){
  const singer=beat(api,g,c,'spot'+i,t,{role:'chorister',roleIndex:i,pose:'sing',sound:'bell',wind:1.26});
  actorLane(api,g,singer,move(p,i%2?.31:-.31,2),{w:3.0,warn:1.26,damage:21,sound:'spotlightChoir'});
 }
}
function carousel(g,c,a,t,api){
 curtain(g,c,api,'fire','carousel');
 const p=api.once(c,'carousel-p',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.23+i*.88)){
  beat(api,g,c,'carousel'+i,t,{role:'firekeeper',roleIndex:i,pose:'hoop',sound:'fire',wind:1.27});
  const q=move(p,TAU*i/6,6.4);ring(api,g,q,2.2,1.27,21,'infernalHoops');
 }
}
function curtainCall(g,c,a,t,api){
 curtain(g,c,api,'curtain','curtain');
 const p=api.once(c,'call-p',()=>bound(g.player));
 for(let i=0;i<5;i++)if(cross(a,t,.33+i*1.02)){
  const singer=beat(api,g,c,'curtain'+i,t,{role:i%2?'chorister':'puppeteer',roleIndex:i,pose:i%2?'sing':'strings',sound:'curtain',wind:1.32});
  actorLane(api,g,singer,p,{w:2.45,warn:1.32,damage:24,sound:'curtainEcho'});
 }
}
export const ENSEMBLE_RUN=Object.freeze({knifeJugglerRelay,midnightDrumline,tightropeExecution,maskedTrapdoor,ringmasterDoubleAct,
 emberCarouselRevue,candlelightChoir,marionetteGallows,maskedCannonade,curtainOfLostVoices,allCastRequiem});
export const REMASTERED_CIRCUS_RUN=Object.freeze({drumMarch,spotlightSweep,carousel,curtainCall});
