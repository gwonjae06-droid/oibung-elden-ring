import {createRecoilBank} from './animation-recoil.mjs';
const limit=(v,max)=>Number.isFinite(v)?Math.max(-max,Math.min(max,v)):0;
export function kwonNeckOffsets(head){return {pivot:[head[0],head[1]-.65,head[2]-.25],head:[0,.65,.25]};}
export function createKwonNeckMotion(){
 let owner=null,lastYaw=0,pose={pitch:0,yaw:0,roll:0};
 function reset(){owner=null;lastYaw=0;pose={pitch:0,yaw:0,roll:0};}
 function update(b,m,dt,frozen=false){
  if(!b||b.phase!==1||['transition','dead'].includes(b.state)){reset();return {...pose};}
  const yaw=Number.isFinite(b.yaw)?b.yaw:0,fresh=owner!==b;
  if(fresh){owner=b;lastYaw=yaw;pose={pitch:0,yaw:0,roll:0};}
  const h=frozen?0:Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));if(!h)return {...pose};
  const turn=Math.atan2(Math.sin(yaw-lastYaw),Math.cos(yaw-lastYaw))/h;lastYaw=yaw;
  const recoil=b.state==='recovery'?Math.sin(Math.PI*Math.max(0,Math.min(1,(b.t||0)/.28)))*.045:0;
  const goal={pitch:limit(-limit(m?.lean,.35)*.35+recoil,.12),yaw:limit(-limit(m?.sway,.2)*.55+limit(-turn*.018,.12),.2),roll:limit(-limit(m?.sway,.2)*.25,.07)},a=1-Math.exp(-28*h);
  for(const k of Object.keys(pose))pose[k]+=(goal[k]-pose[k])*a;return {...pose};
 }
 return {update,reset};
}
export function collectKwonMouthParts(T,children){return children.filter(o=>{if(o.isInstancedMesh||!o.geometry)return false;if(o.geometry.type==='ConeGeometry')return o.position.z>2&&o.position.y<2.6;if(o.geometry.type!=='TubeGeometry')return false;o.geometry.computeBoundingBox();return o.geometry.boundingBox?.getCenter(new T.Vector3()).z>2.4;});}
export function createKwonNeckRig(T,torso,head,HEAD,model){
 const joint=new T.Group();joint.name='kwon-neck-rig';const rest=kwonNeckOffsets(torso.headPosition(HEAD)),motion=createKwonNeckMotion(),recoil=createRecoilBank(),v=new T.Vector3();let lastOwner=null;joint.position.set(...rest.pivot);torso.chest.add(joint);joint.add(head);head.position.set(...rest.head);
 return {joint,headOffset:rest.head,update(b,m,dt,frozen){const p=motion.update(b,m,dt,frozen);joint.rotation.set(p.pitch,p.yaw,p.roll);},point(){head.getWorldPosition(v);model.worldToLocal(v);return {x:v.x,y:v.y,z:v.z};}};
}
// Visual motion updates are scoped to this rig.
