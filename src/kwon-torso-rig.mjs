const bound=(v,n)=>Number.isFinite(v)?Math.max(-n,Math.min(n,v)):0;
const offsets={waist:[0,0,0],chest:[0,.6,1.2],abdomen:[0,.6,0]};
export function torsoLocalPoint(p,region){const a=offsets[region]||offsets.waist;return [p.x-a[0],p.y-1.5-a[1],p.z+1.5-a[2]];}
export function createKwonTorsoMotion(){
 let owner=null,clock=null,values=null,velocity=null,lastYaw=0;
 const zero=()=>({waistPitch:0,waistYaw:0,chestPitch:0,chestYaw:0,chestRoll:0,waistRoll:0,abdomenPitch:0,abdomenYaw:0,abdomenRoll:0});
 function reset(){owner=clock=values=velocity=null;lastYaw=0;}
 function update(b,m,dt){
  if(!b||['transition','dead'].includes(b.state)){reset();return zero();}
  const lean=bound(m?.lean,.35),sway=bound(m?.sway,.2),
   stamp=[b.state,b.pattern,b.phase,b.t,b.wait,b.x,b.z,b.yaw,b.stun],
   yaw=Number.isFinite(b.yaw)?b.yaw:0,
   fresh=owner!==b||!values,stopped=!fresh&&stamp.every((v,i)=>Object.is(v,clock[i])),
   h=stopped?0:Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  // Armor and shoulders carry a restrained counter-roll when the knight
  // changes facing.  The head and blade are still attached to the same rig.
  const delta=fresh||h<=0?0:Math.atan2(Math.sin(yaw-lastYaw),Math.cos(yaw-lastYaw));
  const turning=bound(-delta/Math.max(h,.012)*.005,.042),
   goal=[lean*.35,sway*.35,lean*.2,-sway*.25,-sway*.35,turning+sway*.08];
  if(fresh){owner=b;values=[...goal];velocity=goal.map(()=>0);lastYaw=yaw;}
  if(h>0)lastYaw=yaw;
  if(!fresh&&h>0)for(let i=0;i<values.length;i++){const w=i<2?14:8,x=values[i]-goal[i],temp=(velocity[i]+w*x)*h,ex=Math.exp(-w*h);values[i]=goal[i]+(x+temp)*ex;velocity[i]=(velocity[i]-w*temp)*ex;}
  clock=stamp;return {waistPitch:values[0],waistYaw:values[1],chestPitch:lean-values[0],chestYaw:sway*1.3-values[1],abdomenPitch:values[2]-values[0]*.5,abdomenYaw:values[3],abdomenRoll:values[4],waistRoll:values[4]*.28,chestRoll:values[5]};
 }
 return {update,reset};
}
export function kwonTorsoRegion(T,part,head,joint){
 if(part===head)return 'chest';
 if(part.isInstancedMesh||part.geometry?.type==='TorusGeometry'&&part.material===joint)return 'abdomen';
 let z=part.position.z;
 if(part.geometry){part.geometry.computeBoundingBox();if(part.geometry.boundingBox){part.updateMatrix();z=part.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(part.matrix).z;}}
 return z>.7?'chest':z<-.5?'abdomen':'waist';
}
export function createKwonTorsoRig(T,pivot,model){
 const waist=new T.Group(),chest=new T.Group(),abdomen=new T.Group(),motion=createKwonTorsoMotion(),v=new T.Vector3();
 waist.name='kwon-waist-rig';chest.name='kwon-chest-rig';abdomen.name='kwon-abdomen-rig';pivot.add(waist);waist.add(chest,abdomen);chest.position.set(...offsets.chest);abdomen.position.set(...offsets.abdomen);
 const groups={waist,chest,abdomen};
 function mount(part,region){const group=groups[region]||waist;part.position.sub(group.position);group.add(part);}
 function point(p,region='waist'){const group=groups[region]||waist;v.set(...torsoLocalPoint(p,region));group.localToWorld(v);model.worldToLocal(v);return {x:v.x,y:v.y,z:v.z};}
 function update(b,m,dt){const p=motion.update(b,m,dt);waist.rotation.set(p.waistPitch,p.waistYaw,p.waistRoll);chest.rotation.set(p.chestPitch,p.chestYaw,p.chestRoll);const k=Math.sin(Math.PI*Math.max(0,Math.min(1,(b?.t||0)/.28)));
 const brace=b?.state==='windup'?.012*k:b?.state==='recovery'?-.010*k:0;
 abdomen.rotation.set(p.abdomenPitch+brace,p.abdomenYaw,p.abdomenRoll+brace*.30);}
 return {waist,chest,abdomen,mount,point,update,headPosition:p=>torsoLocalPoint(p,'chest')};
}
