import {DICE_RULES as R} from './dice-data.mjs';
import {DICE_PHOTO_FACE} from './dice-photo-data.mjs';
export function diceSegmentImpact(a,b,pose,pad=0){
 const rotation=pose.rotation||[0,0,0,1],n=Math.hypot(...rotation);if(!Number.isFinite(n)||n<1e-9)return null;const x=-rotation[0]/n,y=-rotation[1]/n,z=-rotation[2]/n,w=rotation[3]/n;
 const local=p=>{const X=p.x-pose.x,Y=p.y-pose.y,Z=p.z-pose.z,tX=2*(y*Z-z*Y),tY=2*(z*X-x*Z),tZ=2*(x*Y-y*X);return [X+w*tX+y*tZ-z*tY,Y+w*tY+z*tX-x*tZ,Z+w*tZ+x*tY-y*tX];},A=local(a),B=local(b),half=R.edge/2+pad;if(![...A,...B,half].every(Number.isFinite)||half<=0)return null;
 let lo=0,hi=1,face=null;for(let i=0;i<3;i++){const d=B[i]-A[i];if(Math.abs(d)<1e-9){if(Math.abs(A[i])>half)return null;continue;}let near=(-half-A[i])/d,far=(half-A[i])/d,side=i*2+1;if(near>far){[near,far]=[far,near];side=i*2;}if(near>lo+1e-9||face===null&&near>=lo-1e-9){lo=Math.max(lo,near);face=side;}hi=Math.min(hi,far);if(lo>hi+1e-9)return null;}
 if(face===null||lo<0||lo>1)return null;return {face,t:lo,point:{x:a.x+(b.x-a.x)*lo,y:a.y+(b.y-a.y)*lo,z:a.z+(b.z-a.z)*lo}};
}
export function diceSegmentHit(a,b,pose,pad=0){return diceSegmentImpact(a,b,pose,pad)!==null;}
export function diceWeakHit(impact){return impact?.face===DICE_PHOTO_FACE;}
