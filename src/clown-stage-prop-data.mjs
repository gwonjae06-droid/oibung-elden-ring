const sat=v=>Math.max(0,Math.min(1,v));
export function clownCameraPropPose(g,bodyY=5.2,scale=1.25){
 const c=g?.clown,b=g?.boss,t=c?.pt;
 if(g?.status!=='playing'||b?.state==='transition'||c?.state!=='pattern'||c.showKey!=='headReturn'||c.stageKey!=='photo'||!Number.isFinite(t)||t<0||t>2.2)return null;
 if(![b.x,b.z,c.yaw,bodyY,scale].every(Number.isFinite)||scale<=0)return null;
 return {x:b.x+Math.sin(c.yaw)*2.9*scale,y:(bodyY+2.5)*scale,z:b.z+Math.cos(c.yaw)*2.9*scale,yaw:c.yaw,scale:scale*(.7+.3*sat(t/.25))};
}
export function photoCardFrame(zone){
 if(!zone||!Number.isFinite(zone.warn)||zone.warn<=0)return {visible:false,develop:0,scale:0};
 if(zone.state==='warn')return {visible:true,develop:sat(zone.age/zone.warn),scale:1};
 if(zone.state==='burst')return {visible:zone.fade>0,develop:1,scale:sat(zone.fade/.28)};
 return {visible:false,develop:0,scale:0};
}
