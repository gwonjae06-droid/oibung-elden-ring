export function squareContains(p,center,halfWidth,playerRadius=0){return [p.x,p.z,center.x,center.z,halfWidth,playerRadius].every(Number.isFinite)&&halfWidth>=0&&playerRadius>=0&&Math.max(Math.abs(p.x-center.x),Math.abs(p.z-center.z))<=halfWidth+playerRadius;}
export const squareDiscArgs=halfWidth=>[halfWidth*Math.SQRT2,4,Math.PI/4];
export const squareConeArgs=(halfWidth,height=4)=>[halfWidth*Math.SQRT2,height,4,1,false,Math.PI/4];
