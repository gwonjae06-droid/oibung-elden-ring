import {ROLL} from './clown-pressure.mjs';
export const sat=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
export const PHASE_TWO_VOLUME=2,PHASE_TWO_SCALE=Math.cbrt(PHASE_TWO_VOLUME);
const BODY_OFFSET=5.096*(PHASE_TWO_SCALE-1);
export function mountPose(time,transition=false){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 if(!transition)return {bodyHead:false,visible:true,inflate:2.6,scale:PHASE_TWO_SCALE,bodyY:5.2+BODY_OFFSET,y:2.6*PHASE_TWO_SCALE,z:0,ball:0,ballZ:-8,lift:0,elongation:1};
 const u=smooth((t-1.6)/2.6),v=1-u,scale=1+(PHASE_TWO_SCALE-1)*u,drop=3*v*v*u*10+3*v*u*u*2.6+u*u*u*2.6+v*v*v*11.18;
 return {bodyHead:t<1.6,visible:t>=1.6,inflate:1+1.6*smooth(t/1.6),scale,bodyY:5.2+BODY_OFFSET*smooth((t-3.2)/1),y:drop+2.6*(scale-1)*u,z:13.5*u*(1-u),ball:1-smooth((t-2.2)/1.2),ballZ:-8*smooth((t-2.2)/1.2),lift:1.4*Math.sin(Math.PI*sat((t-2.1)/2.1)),elongation:smooth((t-3.8)/1.4)};
}
export function bombPose(q,phase=1){
 const travel=q.travel||ROLL.travel,k=q.kind==='roll'?sat(q.t/travel):sat(q.t/q.fly),land=q.kind==='roll'||q.t>=q.fly,final=q.kind==='roll'?sat((q.t-travel)/Math.max(.01,q.warn-travel)):sat((q.t-q.fly)/Math.max(.01,q.warn-q.fly));
 const startY=phase===2?8.2+BODY_OFFSET:q.from.y+(q.kind==='head'?1.92:0);
 return {x:q.kind==='roll'?q.px:q.from.x+(q.x-q.from.x)*k,z:q.kind==='roll'?q.pz:q.from.z+(q.z-q.from.z)*k,y:q.kind==='roll'?2.1:startY*(1-k)+2.1*k+Math.sin(Math.PI*k)*4,land,final,inflate:q.kind==='ball'?.45:land?3.1+final*.6:3.1,stretch:land?-.25*(1-final):.2,spin:q.kind==='roll'?Math.hypot(q.x-q.from.x,q.z-q.from.z)*k/2.1:k*2};
}
export function headFrame(g){const c=g.clown,b=g.boss,v=c.vis,m=b.phase===2?mountPose(b.t,b.state==='transition'):null;return {pose:m&&m.bodyHead?'inflate':v.pose,k:m&&m.bodyHead?sat(b.t/1.6):v.k,inflate:m&&m.bodyHead?m.inflate:null,stretch:0,burst:false,bodyHead:m?m.bodyHead:true,mount:m};}
export function selectedWeapon(weapon){return ['sword','hammer','bow','cards'].includes(weapon)?weapon:'sword';}
