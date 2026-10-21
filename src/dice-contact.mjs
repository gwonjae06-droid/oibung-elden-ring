import {DICE_RULES as R,diceTouches,diceCrushes,dicePressure} from './dice-data.mjs';
export function resolveDiceContact(p,pose,moving=false){
 const result={x:p.x,z:p.z,crushed:false};if(!diceTouches(p,pose))return result;
 if(moving&&diceCrushes(p,pose))return {...result,crushed:true};
 const half=R.edge/2,r=R.playerRadius,q=dicePressure(p,pose);
 // Space beneath a raised leading face stays open until that face descends.
 if(moving&&Math.abs(q.across)<half-r&&q.along>=0)return result;
 const a=(p.x-pose.x)*pose.dx+(p.z-pose.z)*pose.dz,b=q.across,da=half*(Math.abs(Math.cos(pose.angle))+Math.abs(Math.sin(pose.angle)))+r-Math.abs(a),db=half+r-Math.abs(b);
 if(da<=0||db<=0)return result;const side=moving&&Math.abs(b)>=half-r||db<=da,amount=(side?db:da)+.001,sign=(side?b:a)<0?-1:1;
 result.x+=(side?pose.dz:pose.dx)*amount*sign;result.z+=(side?-pose.dx:pose.dz)*amount*sign;
 const limit=(R.side-1)*R.edge/2+R.tileWidth/2-r;result.x=Math.max(-limit,Math.min(limit,result.x));result.z=Math.max(-limit,Math.min(limit,result.z));return result;
}
