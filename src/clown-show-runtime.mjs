import {stepClown as originalStep,hurt,PATTERNS} from './clown-combat.mjs';
import {ROLL,segmentGap} from './clown-pressure.mjs';
import {CLOWN_SHOWS,runClownShow,nextSignatureOpening,recordSignatureOpening} from './clown-shows.mjs';
const sat=v=>Math.max(0,Math.min(1,v));
const emit=(g,type,data={})=>g.events.push({type,...data});
const keyFor=g=>g.clown.name==='laughBomb'?'headReturn':g.clown.name==='clap'?'offbeatClap':g.clown.name==='dash'&&g.boss.phase===2?'runaway':null;
const neutral=()=>({pose:'idle',k:0,mode:'full',crouch:0,glove:0,neck:0,neckTarget:null,tilt:0,juggle:0,jump:0,shake:0,throwK:0,stomp:0});
function zone(g,data){const z={id:g.nextId++,age:0,state:'warn',fade:0,kind:'danger',damage:0,visual:false,blast:false,...data};g.clown.zones.push(z);emit(g,'clown-zone',{id:z.id,shape:z.shape,warn:z.warn});return z;}
function cone(g,yaw,warn,r,half,damage,sound){const moving=['clap','hornFan','curtainCall'].includes(sound);return zone(g,{shape:'cone',x:g.boss.x,z:g.boss.z,yaw,warn,r,half,damage,sound,visual:moving,waveKind:moving?sound:null});}
function bomb(g,data){const q={id:g.nextId++,t:0,fly:.9,warn:1.45,from:{x:g.boss.x,y:9.9,z:g.boss.z},...data};g.clown.bombs.push(q);emit(g,'clown-throw',{kind:q.kind});return q;}
function fitLen(b,yaw,len){for(let i=0;i<128&&len>0&&Math.hypot(b.x+Math.sin(yaw)*len,b.z+Math.cos(yaw)*len)>19.5;i++)len=Math.max(0,len-.5);return len;}
function dashPart(g,c,a,t,start,key){
 if(t<start)return;let lane=c.f[key];const radius=3.3*1.25*(g.boss.phase===2?1.25:1);
 if(!lane){const b=g.boss,yaw=Math.atan2(g.player.x-b.x,g.player.z-b.z),len=fitLen(b,yaw,24);lane=c.f[key]={x:b.x,z:b.z,yaw,len,hit:false,done:false};c.yaw=yaw;zone(g,{shape:'lane',x:b.x,z:b.z,yaw,len,w:radius*2,warn:.9,visual:true});emit(g,'clown-stomp');}
 if(lane.done)return;const u=t-start;c.vis.stomp=u<.9?Math.abs(Math.sin(u*16)):0;c.vis.crouch=u<.9?sat(u/.9):0;
 if(a<start+.9&&t>=start+.9)emit(g,'clown-dash');if(u<.9)return;
 const b=g.boss,old={x:b.x,z:b.z},k=sat((u-.9)/.45),x=lane.x+Math.sin(lane.yaw)*lane.len*k,z=lane.z+Math.cos(lane.yaw)*lane.len*k;c.odo+=Math.hypot(x-b.x,z-b.z);b.x=x;b.z=z;c.noSeparate=u<1.35;
 const p=c.showPrevious||g.player;if(!lane.hit&&segmentGap({x:0,z:0},{x:old.x-p.x,z:old.z-p.z},{x:x-g.player.x,z:z-g.player.z})<radius){lane.hit=true;hurt(g,30,'show-dash-'+key);}if(u>=1.35)lane.done=true;
}
const api={once(c,k,fn){if(!Object.hasOwn(c.f,k))c.f[k]=fn()??true;return c.f[k];},zone,cone,bomb,fitLen,dashPart,emit,head(c,pose,k,mode='full'){Object.assign(c.vis,{pose,k:sat(k),mode});}};
function beginSignature(g,name){if(!PATTERNS[name])return false;const c=g.clown;c.used??={};c.used[name]=(c.used[name]||0)+1;Object.assign(c,{state:'pattern',name,pt:0,f:{},punish:false,noSeparate:false,showKey:null,stageKey:null});c.vis=neutral();emit(g,'clown-telegraph',{name:PATTERNS[name].name,key:name});return true;}
function finish(g){const c=g.clown;c.last=c.name;Object.assign(c,{state:'idle',name:null,f:{},wait:g.boss.phase===2?.12:.22,punish:false,noSeparate:false,showKey:null,showPrevious:null,stageKey:null});c.vis=neutral();}
export function stepShowClown(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 const c=g.clown,wasFrozen=g.hitstop>0,wasStunned=c.stunT>0,time=g.time,wasIdle=c.state==='idle',h=Math.min(dt,1/30);let forced=false;
 if(wasIdle&&!wasFrozen&&!wasStunned&&g.boss.state!=='transition'&&c.wait<=h&&!(c.hug>2.2&&c.shoveCd<=0)){const opening=null; // Retired photo-ball signature; never force it in new fights.
  if(opening)forced=beginSignature(g,opening);}
 if(c.state==='pattern'&&!c.showKey)c.showKey=keyFor(g);
 c.showPrevious={x:g.player.x,z:g.player.z};if(c.showKey&&c.state==='pattern')c.state='show';originalStep(g,dt,input);
 if(g.status!=='playing'||g.boss.state==='transition'||['transition','defeated'].includes(c.state)){c.showKey=null;c.showPrevious=null;c.stageKey=null;return;}
 if(wasIdle&&g.time!==time&&['pattern','show'].includes(c.state)&&c.name&&c.name!=='shove')recordSignatureOpening(g,forced);
 if(c.state==='pattern'&&!c.showKey){c.showKey=keyFor(g);if(c.showKey){const def=CLOWN_SHOWS[c.showKey];for(let i=g.events.length-1;i>=0;i--){const e=g.events[i];if(e.type==='clown-telegraph'){e.name=def.name;break;}}}}
 if(!c.showKey)return;c.state='pattern';if(wasFrozen||wasStunned||c.stunT>0||g.time===time)return;
 const a=c.pt;c.pt+=Math.max(0,Math.min(dt,1/30));runClownShow(c.showKey,g,c,a,c.pt,api);const def=CLOWN_SHOWS[c.showKey];
 c.punish=g.status==='playing'&&c.pt>=def.dur-def.recover&&!c.waves.length&&!c.zones.some(z=>(!z.visual||z.waveKind)&&z.state==='warn')&&!c.bombs.some(q=>q.kind==='roll'&&q.t<q.travel);
 if(g.status==='playing'&&c.pt>=def.dur)finish(g);
}
PATTERNS.laughBomb.name=CLOWN_SHOWS.headReturn.name;PATTERNS.clap.name=CLOWN_SHOWS.offbeatClap.name;
export {ROLL};
