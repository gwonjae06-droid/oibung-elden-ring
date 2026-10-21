// BoxGeometry material indices: +X, -X, +Y, -Y, +Z, -Z.
export const DICE_FACE_PIPS=Object.freeze([1,6,2,5,3,4]);
const NORMALS=Object.freeze([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(Object.freeze));
export function normalizedDiceQuaternion(q){
 if(!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite))return null;
 const n=Math.hypot(...q);return n>1e-9?q.map(v=>v/n):null;
}
export function diceWorldVector(v,q){
 const a=normalizedDiceQuaternion(q);if(!a||!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))return null;
 const [x,y,z,w]=a,[X,Y,Z]=v,tx=2*(y*Z-z*Y),ty=2*(z*X-x*Z),tz=2*(x*Y-y*X);
 return [X+w*tx+y*tz-z*ty,Y+w*ty+z*tx-x*tz,Z+w*tz+x*ty-y*tx];
}
export function diceTopFace(q){
 if(!normalizedDiceQuaternion(q))return null;
 let face=0,height=-Infinity;
 for(let i=0;i<6;i++){const y=diceWorldVector(NORMALS[i],q)[1];if(y>height+1e-9){height=y;face=i;}}
 return {face,pips:DICE_FACE_PIPS[face]};
}
