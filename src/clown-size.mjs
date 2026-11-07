import {hurt} from './clown-combat.mjs';
import {stepShowClown as baseStep} from './clown-show-runtime.mjs';
import {segmentGap} from './clown-pressure.mjs';
import {updateClownLens} from './clown-lens-gag.mjs';
import {slowClownThrow} from './clown-throw-speed.mjs';
import {clownHurtShapes} from './boss-hit-regions.mjs';
import {kwonPlayerSeparation} from './kwon-hurtbox.mjs';
export const CLOWN_SIZE=1.25;
export const CLOWN_BODY_RADIUS=3.3*CLOWN_SIZE;
// In phase two the clown stands on a head-ball that is 1.5x bigger, so his solid body grows a little too.
export const PHASE_TWO_BODY_SCALE=1.25;
export const CLOWN_CAMERA=Object.freeze({distance:11.875,target:4.7,reticle:7.5});
const scaledBombs=new WeakSet();
export function separateLargeClown(b,p,big=false){const r=CLOWN_BODY_RADIUS*(big?PHASE_TWO_BODY_SCALE:1),d=Math.hypot(p.x-b.x,p.z-b.z);if(d>=r)return;let a=d>.001?Math.atan2(p.x-b.x,p.z-b.z):p.yaw;p.x=b.x+Math.sin(a)*r;p.z=b.z+Math.cos(a)*r;if(Math.hypot(p.x,p.z)>27){const center=Math.hypot(b.x,b.z),out=Math.atan2(b.x,b.z),limit=Math.acos(Math.max(-1,Math.min(1,(27*27-center*center-r*r)/(2*center*r)))),delta=Math.atan2(Math.sin(a-out),Math.cos(a-out));a=out+(delta<0?-1:1)*(limit+.0001);p.x=b.x+Math.sin(a)*r;p.z=b.z+Math.cos(a)*r;}}
export function createLargeClownStepper(step=baseStep,damage=hurt){return function(g,dt,input={}){
 if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 const oldBoss={x:g.boss.x,z:g.boss.z},oldPlayer={x:g.player.x,z:g.player.z},time=g.time,oldPt=g.clown.pt,wasStunned=g.clown.stunT>0;
 step(g,dt,input);
 updateClownLens(g);
 const c=g.clown,b=g.boss,p=g.player;
 for(const q of c.bombs){if(!scaledBombs.has(q)){q.from.y*=CLOWN_SIZE;slowClownThrow(c,q);scaledBombs.add(q);}}
 if(c.name==='dash'&&!c.showKey)for(const z of c.zones)if(z.shape==='lane'&&z.visual)z.w=CLOWN_BODY_RADIUS*2;
 if(g.status!=='playing'||b.state==='transition'||g.time===time)return;
 const dashAdvanced=c.pt>oldPt&&Math.hypot(b.x-oldBoss.x,b.z-oldBoss.z)>1e-6;
 if(c.name==='dash'&&!c.showKey&&!wasStunned&&!(c.stunT>0)&&dashAdvanced)for(const [key,start]of [['lane',0],['returnLane',1.8]]){const lane=c.f[key],u=c.pt-start;if(!lane||lane.hit||u<.9||u>1.35+Math.min(dt,1/30))continue;
 const gap=segmentGap({x:0,z:0},{x:oldBoss.x-oldPlayer.x,z:oldBoss.z-oldPlayer.z},{x:b.x-p.x,z:b.z-p.z});if(gap<CLOWN_BODY_RADIUS){lane.hit=true;damage(g,30,'dash'+key);}}
 if(g.status==='playing'&&!c.noSeparate&&c.vis&&Number.isFinite(b.phase)){
  const contact=kwonPlayerSeparation(clownHurtShapes(g),p,{radius:.42,height:1.15});
  if(contact){p.x=contact.x;p.z=contact.z;const len=Math.hypot(p.x,p.z);if(len>27){p.x*=27/len;p.z*=27/len;}}
 }
 c.prevPlayer={x:p.x,z:p.z};
 };}
export const stepLargeClown=createLargeClownStepper();
