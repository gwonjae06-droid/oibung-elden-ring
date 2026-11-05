import * as THREE from 'three';
import {smooth} from './blood-transformation.mjs';

// Anatomical silhouette: scapula -> humerus -> elbow -> carpal arch -> six
// curved finger bones. Scalloped membranes are sealed front/back geometry,
// never independent floating billboards or a pile of overlapping strip wings.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
const TAU=Math.PI*2;
function tube(parent,points,radius,mat,segments=22){
 const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,6,false);
 const obj=new THREE.Mesh(geo,mat);parent.add(obj);return obj;
}
function mesh(parent,geo,mat,x=0,y=0,z=0){
 const obj=new THREE.Mesh(geo,mat);obj.position.set(x,y,z);parent.add(obj);return obj;
}
function fingerPoint(index,t,count=6){
 const angle=.77-index*.265,length=3.28-index*.19;
 return vec(
  length*Math.cos(angle)*t+.16*Math.sin(t*Math.PI),
  length*Math.sin(angle)*t+.24*Math.sin(t*Math.PI),
  -.2*t-.16*t*index/count+.35*Math.sin(t*Math.PI)
 );
}
export function bloodWingWebGeometry(index,{coarse=false,count=6}={}){
 const columns=coarse?5:10,rows=coarse?5:9,frontCount=(columns+1)*(rows+1),verts=[],colors=[],idx=[];
 const toneA=new THREE.Color(0x9b1837),toneB=new THREE.Color(0x250d1b),toneC=new THREE.Color(0x6e132d);
 const color=new THREE.Color();
 for(let skin=0;skin<2;skin++)for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  const across=col/columns,span=row/rows;
  // Scalloped outer edge with a distinct notch between each pair of rays.
  const radial=span*(1-.19*Math.sin(Math.PI*across)**1.3);
  const a=fingerPoint(index,radial,count),b=fingerPoint(index+1,radial,count);
  const pos=a.lerp(b,across),bow=Math.sin(Math.PI*span)*Math.sin(Math.PI*across);
  pos.z+=.21*bow+(skin===0?.033:-.033);
  verts.push(pos.x,pos.y,pos.z);
  color.copy(toneA).lerp(toneB,clamp(span*.71+across*(1-across)*.36));
  color.lerp(toneC,bow*.32);
  colors.push(color.r,color.g,color.b);
 }
 for(let skin=0;skin<2;skin++)for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=skin*frontCount+row*(columns+1)+col,b=a+columns+1;
  if(skin===0)idx.push(a,b,a+1,a+1,b,b+1);
  else idx.push(a,a+1,b,a+1,b+1,b);
 }
 for(let row=0;row<rows;row++)for(const col of [0,columns]){
  const a=row*(columns+1)+col,b=a+columns+1;
  idx.push(a,b,a+frontCount,b,b+frontCount,a+frontCount);
 }
 for(let col=0;col<columns;col++)for(const row of [0,rows]){
  const a=row*(columns+1)+col,b=a+1;
  idx.push(a,a+frontCount,b,b,a+frontCount,b+frontCount);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(idx);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
export function createBloodWings(parent,fluid,quality,{reduced=false}={}){
 const sides=[],veins=[],coarse=quality.segments<16;
 const bone=fluid.material.clone();bone.color.setHex(0x8e1735);
 bone.emissive.setHex(0x451125);bone.emissiveIntensity=.5;
 const ivory=new THREE.MeshStandardMaterial({color:0x947f81,roughness:.52,metalness:.18});
 const tips=new THREE.MeshStandardMaterial({color:0xba6580,metalness:.28,roughness:.35});
 const webMat=new THREE.MeshPhysicalMaterial({
  color:0xffffff,vertexColors:true,side:THREE.DoubleSide,roughness:.37,metalness:0,
  clearcoat:.52,clearcoatRoughness:.24,transparent:true,opacity:.93,depthWrite:true
 });
 for(const side of [-1,1]){
  const pivot=new THREE.Group();
  pivot.position.set(side*.8,3.4,-.67);pivot.scale.x=side;parent.add(pivot);
  // Oblique muscular shoulder and a true hinged elbow.
  const shoulder=mesh(pivot,new THREE.IcosahedronGeometry(.42,1),ivory,.08,.08,0);
  shoulder.scale.set(1.18,.75,.82);
  tube(pivot,[vec(.08,.02,0),vec(.85,.52,-.1),vec(1.75,1.1,-.2),vec(2.25,1.05,-.3)],.17,bone,20);
  tube(pivot,[vec(.1,.03,.2),vec(.95,.57,.13),vec(1.74,1.07,-.05),vec(2.2,1.04,-.15)],.044,tips,18);
  const elbow=new THREE.Group();elbow.position.set(2.25,1.05,-.3);pivot.add(elbow);
  const joint=mesh(elbow,new THREE.IcosahedronGeometry(.31,1),ivory);
  joint.scale.set(1.12,1,.9);
  tube(elbow,[vec(0,0,0),vec(.78,.44,-.06),vec(1.48,.88,-.04),vec(2.04,1.01,.05)],.128,bone,20);
  tube(elbow,[vec(0,.14,.12),vec(.85,.56,.08),vec(1.65,.94,.09),vec(2.04,1.02,.12)],.036,tips,20);
  const wrist=new THREE.Group();wrist.position.set(2.04,1.01,.05);elbow.add(wrist);
  mesh(wrist,new THREE.SphereGeometry(.26,12,10),ivory).scale.set(1.2,.95,.75);
  const digits=[],webs=[],edgeVeins=[];
  const count=quality.wingRibs||6;
  for(let i=0;i<count;i++){
   const points=Array.from({length:9},(_,j)=>fingerPoint(i,j/8,count));
   const digit=tube(wrist,points,Math.max(.037,.095-i*.009),i%2?bone:ivory,coarse?14:24);
   digit.name='blood-wing-finger';veins.push(digit);digits.push(digit);
   const last=points.at(-1),prev=points.at(-2),tangent=last.clone().sub(prev).normalize();
   const talon=mesh(wrist,new THREE.ConeGeometry(.09,.39,7),tips,last.x,last.y,last.z);
   talon.quaternion.setFromUnitVectors(vec(0,1,0),tangent);
   if(i<count-1){
    const web=mesh(wrist,bloodWingWebGeometry(i,{coarse,count}),webMat);
    web.name='blood-wing-web';webs.push(web);
    const edgePoints=Array.from({length:9},(_,j)=>{
     const u=j/8,radial=1-.19*Math.sin(u*Math.PI)**1.3;
     return fingerPoint(i,radial,count).lerp(fingerPoint(i+1,radial,count),u);
    });
    const seam=tube(wrist,edgePoints,.024, tips,coarse?9:18);
    edgeVeins.push(seam);
   }
  }
  // Serrated scapular spines visually bridge the shoulder armor and membrane.
  for(let i=0;i<3;i++){
   const barb=mesh(pivot,new THREE.ConeGeometry(.11,.6+i*.12,7),ivory,.6+i*.47,.48+i*.29,-.24);
   barb.rotation.z=-.5+i*.15;
  }
  sides.push({pivot,elbow,wrist,webs,digits,veins:edgeVeins,side});
 }
 let previousYaw=null,inertia=0,wingLift=0,wingFold=0,wingCurl=0,wingSlash=0,wingDownbeat=0,wingTrailing=0;
 function update(g,c,dt,pose={}){
  const delta=clamp(Number.isFinite(dt)?dt:0,0,.1);
  const yaw=g.boss.yaw||0;
  if(previousYaw!==null&&delta>0){
   const d=Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));
   inertia+=(clamp(-d/Math.max(delta,.016)*.09,-.25,.25)-inertia)*(1-Math.exp(-delta*8));
  }
  previousYaw=yaw;
  const target=pose.wings||{},speed=g.boss.state==='pattern'?12:6.5;
  const follow=(value,aim)=>value+(aim-value)*(1-Math.exp(-delta*speed));
  wingLift=follow(wingLift,target.lift||0);
  wingFold=follow(wingFold,target.fold||0);
  wingCurl=follow(wingCurl,target.curl||0);
  wingSlash=follow(wingSlash,target.sweep||0);
  wingDownbeat=follow(wingDownbeat,target.downbeat||0);
  wingTrailing=follow(wingTrailing,pose.followThrough||0);
  const moving=g.boss.state==='pattern',t=g.time||0;
  const breathe=reduced?0:Math.sin(t*(moving?2.8:1.25))*.035;
  for(const {pivot,elbow,wrist,webs,digits,side} of sides){
   const boneBirth=c.active?smooth(1.8,2.9,c.t):c.bones||0;
   const membraneBirth=c.active?smooth(2.6,3.65,c.t):c.membrane||0;
   pivot.visible=boneBirth>.005;
   pivot.scale.set(side*Math.max(.001,boneBirth),Math.max(.001,boneBirth),Math.max(.001,boneBirth));
   // Local +X points away from the spine for BOTH mirrored shoulders. Folding
   // turns the wings back, not inward through the torso.
   pivot.rotation.y=.14+wingFold*1.08+inertia*.5;
   pivot.rotation.z=.12+wingLift*.5+(side>0?wingSlash*.69:-wingSlash*.24)-wingDownbeat*.35+wingTrailing*.1+breathe;
   pivot.rotation.x=(reduced?0:Math.sin(t*1.4+side)*.025)+wingFold*.13;
   elbow.rotation.z=-.08+wingCurl*.42+wingLift*.12-wingDownbeat*.19+wingTrailing*.09-(reduced?0:Math.sin(t*1.8+side)*.04);
   elbow.rotation.y=wingFold*.2+inertia*.12;
   wrist.rotation.z=.07+wingCurl*.22+(side>0?wingSlash*.2:-wingSlash*.12)-wingDownbeat*.24+wingTrailing*.13+(reduced?0:Math.sin(t*2.2+side)*.03);
   wrist.rotation.x=(reduced?0:Math.sin(t*1.7+side)*.04);
   for(let i=0;i<webs.length;i++){
    const birth=c.active?smooth(2.6+i*.055,3.6+i*.045,c.t):membraneBirth;
    const mesh=webs[i];mesh.visible=birth>.008;
    mesh.scale.setScalar(Math.max(.001,birth));
    // Small delayed ripples belong to the joint, not a disconnected plane.
    mesh.rotation.x=wingTrailing*.035*Math.sin(i*1.4+side)+(reduced?0:Math.sin(t*2.4-i*.7)*.012);
   }
   for(const digit of digits)digit.visible=boneBirth>.008;
  }
 }
 function clear(){
  previousYaw=null;inertia=wingLift=wingFold=wingCurl=wingSlash=wingDownbeat=wingTrailing=0;
  for(const {pivot,elbow,wrist}of sides){pivot.rotation.set(0,0,0);elbow.rotation.set(0,0,0);wrist.rotation.set(0,0,0);}
 }
 return {update,clear,sides,veins,dispose(){bone.dispose();ivory.dispose();tips.dispose();webMat.dispose();}};
}
