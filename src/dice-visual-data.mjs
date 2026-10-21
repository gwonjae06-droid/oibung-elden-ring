export const DICE_HELL_STYLE=Object.freeze({iron:0x181b22,metalness:.75,roughness:.58,ember:0xff9a32,emissive:0xff3709,crack:0xff5519,border:0xffb648});
export function diceCrackPaths(edge,photoFace){
 if(!Number.isFinite(edge)||edge<=0||!Number.isInteger(photoFace)||photoFace<0||photoFace>5)throw Error('Invalid dice surface');
 const paths=[];for(let face=0;face<6;face++){if(face===photoFace)continue;const axis=Math.floor(face/2),sign=face%2?-1:1,keys=[0,1,2].filter(k=>k!==axis);
 for(let branch=0;branch<3;branch++){const points=[];for(let k=0;k<6;k++){const p=[0,0,0];p[axis]=sign*(edge/2+.025);p[keys[0]]=edge*(-.46+k*.184);p[keys[1]]=edge*((branch-1)*.24+Math.sin(k*2.1+face+branch)*.07);points.push(p);}paths.push({face,points});}}
 return paths;
}
export function diceTelegraphView(g,edge=8,playerRadius=.42){
 const d=g.dice,t=d?.telegraph;if(g.status!=='playing'||!t)return null;
 if(![t.from?.x,t.from?.z,t.to?.x,t.to?.z,edge,playerRadius].every(Number.isFinite)||edge<=0||playerRadius<0)return null;
 const opacity=.38+.12*Math.sin((Number.isFinite(g.time)?g.time:0)*12);
 if(t.kind==='line'&&['charge-warning','charge'].includes(d.state)&&Number.isFinite(t.width)&&t.width>0){const dx=t.to.x-t.from.x,dz=t.to.z-t.from.z;return {kind:'line',x:(t.from.x+t.to.x)/2,z:(t.from.z+t.to.z)/2,yaw:Math.atan2(dx,dz),width:t.width,length:Math.hypot(dx,dz)+edge+2*playerRadius,opacity};}
 if(t.kind==='circle'&&['jump-warning','jump'].includes(d.state)&&Number.isFinite(t.radius)&&t.radius>0)return {kind:'circle',x:t.to.x,z:t.to.z,radius:t.radius+playerRadius,opacity};
 return null;
}
