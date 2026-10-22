import {diceTopFace,diceWorldVector} from './dice-orientation.mjs';
import {DICE_PHOTO_FACE} from './dice-photo-data.mjs';
const NORMALS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function groundContactFace(pose,edge=12){if(!pose||!Number.isFinite(pose.y)||Math.abs(pose.y-edge/2)>.02)return null;const top=diceTopFace(pose.rotation);if(!top||diceWorldVector(NORMALS[top.face],pose.rotation)[1]<.999999)return null;const face=top.face^1;return {face,pips:face===DICE_PHOTO_FACE?0:7-top.pips};}
export function segmentSquareHit(a,b,p,half){if(![a.x,a.z,b.x,b.z,p.x,p.z,half].every(Number.isFinite)||half<0)return false;let lo=0,hi=1;for(const key of ['x','z']){const d=b[key]-a[key],v=a[key]-p[key];if(Math.abs(d)<1e-9){if(Math.abs(v)>half)return false;continue;}let n=(-half-v)/d,f=(half-v)/d;if(n>f)[n,f]=[f,n];lo=Math.max(lo,n);hi=Math.min(hi,f);if(lo>hi)return false;}return true;}
