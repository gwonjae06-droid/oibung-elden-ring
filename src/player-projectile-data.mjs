import {PLAYER_COLORS} from './player-presentation.mjs';
export function playerProjectileStyle(q,weapon='sword'){
 const kind=['bow','cards','wave'].includes(q?.kind)?q.kind:'orb',color=q?.piercing?0x9dff80:PLAYER_COLORS[kind==='wave'?weapon:kind]||0xffdd95;
 return {kind,color,length:q?.skill?2:1,scale:q?.piercing&&!q?.skill?1.8:1};
}
export function playerProjectilePose(q,time=0){return {x:q.x,y:Number.isFinite(q.y)?q.y:q.kind==='wave'?.25:1.2,z:q.z,yaw:Number.isFinite(q.yaw)?q.yaw:0,spin:q.kind==='cards'?(Number.isFinite(time)?time:0)*10+(Number.isFinite(q.id)?q.id:0):0};}
export function playerProjectileHitsCircle(a,b,target,radius){if(!(radius>0)||![a?.x,a?.z,b?.x,b?.z,target?.x,target?.z,radius].every(Number.isFinite))return false;const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,u=n?Math.max(0,Math.min(1,((target.x-a.x)*dx+(target.z-a.z)*dz)/n)):0;return Math.hypot(a.x+dx*u-target.x,a.z+dz*u-target.z)<=radius;}
export function claimPlayerProjectileHit(q){if(!q||!(q.life>0)||q.hit||q.bossHit)return false;q.hit=q.bossHit=true;if(!q.piercing)q.life=0;return true;}
export const playerAttackCanReachAir=(weapon,projectile=false)=>Boolean(projectile||weapon?.projectile);
