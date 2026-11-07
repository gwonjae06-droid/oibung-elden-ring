// Lightweight, deterministic sphere rigid-body motion with friction, bounds,
// restitution and real contact. No arbitrary floating visual interpolation.
import {PHASE_TWO_SCALE} from './clown-visual-data.mjs';
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{const t=sat(x);return t*t*(3-2*t)};
export const CLOWN_VISUAL_SCALE=1.25;
export const CLOWN_BALL_RADIUS=2.6;
export const phaseTwoBallScale=time=>1+(PHASE_TWO_SCALE-1)*smooth((time-.15)/1.65);
export function clownDismountPose(time){
 const t=Math.max(0,Number.isFinite(time)?time:0),u=sat((t-1.65)/1.75);
 const raised=2*CLOWN_BALL_RADIUS*phaseTwoBallScale(Math.min(t,1.65));
 return {bodyY:raised*(1-u*u),airborne:u>0&&u<1,progress:u};
}
// Shared pure rig/hurtbox frame: neither a lifted shoulder nor a crawling
// skull may keep a phantom ground-level collision volume.
export function clownContactFrame(g,animation,beast){
 const boss=g?.boss||{},a=animation||{},q=beast||{};
 const base=boss.phase===2
  ?boss.state==='transition'?clownDismountPose(boss.t).bodyY:q.bodyHeight||0
  :5.2;
 const pitch=boss.phase===2
  ?(q.pitch||0)+Math.max(-.22,Math.min(.25,(a.lean||0)*.32))
  :0;
 return {base,pitch,height:Math.max(0,base+(a.lift||0))};
}
export const createClownStageBall=(x=0,z=0)=>({
 x,z,vx:0,vz:0,r:CLOWN_BALL_RADIUS*CLOWN_VISUAL_SCALE,
 scale:1,roll:0,launched:false,impacts:0
});
export function stepClownStageBall(g,dt){
 if(!g?.clown||g.boss?.phase!==2)return;
 const c=g.clown,b=g.boss,p=g.player,h=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,1/30));
 const ball=c.stageBall||(c.stageBall=createClownStageBall(b.x,b.z));
 const time=b.state==='transition'?b.t:5.2;
 ball.scale=phaseTwoBallScale(time);ball.r=CLOWN_BALL_RADIUS*CLOWN_VISUAL_SCALE*ball.scale;
 if(!ball.launched&&time>=1.75){ball.launched=true;ball.vx=-15;ball.vz=-7;}
 const oldX=ball.x,oldZ=ball.z;
 if(ball.launched){
  ball.x+=ball.vx*h;ball.z+=ball.vz*h;
  const drag=Math.exp(-(b.state==='transition'?.70:2.35)*h);
  ball.vx*=drag;ball.vz*=drag;
  const d=Math.hypot(ball.x,ball.z),limit=Math.max(2,27-ball.r-.15);
  if(d>limit){const nx=ball.x/d,nz=ball.z/d;ball.x=nx*limit;ball.z=nz*limit;
   const outward=ball.vx*nx+ball.vz*nz;
   if(outward>0){ball.vx-=1.3*outward*nx;ball.vz-=1.3*outward*nz;ball.impacts++;}
  }
  if(b.state!=='transition'){
   // An inactive prop cannot deal damage, but it cannot be walked through.
   for(const [o,radius,movable] of [[p,.48,true],[b,1.30,false]]){
    const dx=o.x-ball.x,dz=o.z-ball.z,d=Math.hypot(dx,dz),reach=ball.r+radius;
    if(d>=reach)continue;
    const nx=d>1e-6?dx/d:1,nz=d>1e-6?dz/d:0,over=reach-d;
    if(movable){o.x+=nx*over;o.z+=nz*over;
     const pd=Math.hypot(o.x,o.z);if(pd>26.6){o.x*=26.6/pd;o.z*=26.6/pd;}
    }else{ball.x-=nx*Math.min(over,1.8);ball.z-=nz*Math.min(over,1.8);}
    ball.vx-=nx*2.1;ball.vz-=nz*2.1;
   }
  }
  ball.roll+=Math.hypot(ball.x-oldX,ball.z-oldZ)/Math.max(.01,ball.r);
 }
}
export function clownBallWorldPose(g){
 const b=g?.boss||{},c=g?.clown||{};
 if(b.phase!==2)return {x:b.x||0,z:b.z||0,scale:1,y:CLOWN_BALL_RADIUS*CLOWN_VISUAL_SCALE};
 const s=c.stageBall||createClownStageBall((b.x||0)-15,(b.z||0)-7);
 const scale=s.scale??PHASE_TWO_SCALE;
 return {x:s.x,z:s.z,scale,y:CLOWN_BALL_RADIUS*CLOWN_VISUAL_SCALE*scale,roll:s.roll||0,colliderRadius:CLOWN_BALL_RADIUS*CLOWN_VISUAL_SCALE*scale};
}
