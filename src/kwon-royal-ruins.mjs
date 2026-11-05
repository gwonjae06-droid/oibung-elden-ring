// The sword grave and throne are visual history, not obstacles or combat hazards.
export const KWON_ROYAL_LAYOUT=Object.freeze({throneZ:-40,outerSwordRadius:34,playRadius:23});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function createKwonRoyalRuins(T,parent,{coarse=false,reduced=false}={}){
 const root=new T.Group();root.name='kwon-abandoned-royal-sword-shrine';
 root.userData.decorativeOnly=true;parent.add(root);
 const marble=new T.MeshStandardMaterial({color:0x8b92a0,roughness:.86});
 const steel=new T.MeshStandardMaterial({color:0x9daab9,metalness:.6,roughness:.46,
  emissive:0x280c16,emissiveIntensity:0});
 const gold=new T.MeshStandardMaterial({color:0x968061,metalness:.51,roughness:.42});
 const velvet=new T.MeshStandardMaterial({color:0x452135,roughness:1,side:T.DoubleSide});
 const crimson=new T.MeshBasicMaterial({color:0xff526d,transparent:true,opacity:0,
  depthWrite:false,side:T.DoubleSide});
 const box=new T.BoxGeometry(1,1,1);
 function block(group,name,mat,x,y,z,sx,sy,sz){
  const m=new T.Mesh(box,mat);m.name=name;m.position.set(x,y,z);m.scale.set(sx,sy,sz);group.add(m);return m;
 }
 const throne=new T.Group();throne.name='kwon-ruined-sword-throne';
 throne.position.set(0,0,KWON_ROYAL_LAYOUT.throneZ);root.add(throne);
 block(throne,'kwon-throne-plinth',marble,0,.7,0,12,1.4,8);
 block(throne,'kwon-throne-seat',marble,0,2,0,7,1.2,4.5);
 block(throne,'kwon-throne-broken-back',marble,0,8,-2.7,8.5,12,1.6);
 for(const side of [-1,1]){
  const arm=block(throne,'kwon-throne-gilded-armrest',gold,side*5.2,3.6,0,1.7,2.2,6);
  arm.rotation.z=side*.14;
  const finial=block(throne,'kwon-throne-shattered-filigree',gold,side*3.7,14.2,-2.7,2.1,3,1.7);
  finial.rotation.z=side*(side===1?.25:.32);
  const banner=block(throne,'kwon-throne-torn-velvet',velvet,side*4.2,8,-3.8,1.8,11,.08);
  banner.rotation.z=side*.15;
 }
 // Sword-shaped reliquary around the broken throne.
 const crown=new T.Mesh(new T.TorusGeometry(8.4,.21,8,coarse?24:44,Math.PI*1.65),gold);
 crown.name='kwon-shattered-crown-arch';crown.position.set(0,13,-3);throne.add(crown);
 // Ancient swords are rooted in the earth, outside the combat arena.
 const blades=[],guards=[],positions=[];
 for(let i=0;i<(coarse?22:44);i++){
  const a=i*2.399963,r=KWON_ROYAL_LAYOUT.outerSwordRadius+(i%7)*1.2;
  const x=Math.sin(a)*r,z=Math.cos(a)*r,tilt=(i%5-2)*.13,scale=.7+(i%4)*.15;
  positions.push({x,z,a,tilt,scale});blades.push({x,z,a,tilt,scale});
  guards.push({x,z,a,tilt,scale});
 }
 const bladeGeometry=new T.ConeGeometry(.26,4.7,4),crossGeometry=new T.BoxGeometry(1.6,.18,.25);
 const bladeMesh=new T.InstancedMesh(bladeGeometry,steel,positions.length);
 bladeMesh.name='kwon-sword-grave-blades';bladeMesh.frustumCulled=false;root.add(bladeMesh);
 const crossMesh=new T.InstancedMesh(crossGeometry,gold,positions.length);
 crossMesh.name='kwon-sword-grave-hilts';crossMesh.frustumCulled=false;root.add(crossMesh);
 const dummy=new T.Object3D();
 const originalMatrices=[];
 function matrices(blend,time){
  positions.forEach((p,i)=>{
   const tremble=blend>0&&!reduced?Math.sin(time*12+i*1.3)*.045*blend:0;
   const levitate=blend>0?blend*.35*Math.sin(i*.41):0;
   dummy.position.set(p.x,2.6*p.scale+levitate,p.z);
   dummy.rotation.set(0,p.a,p.tilt+tremble);dummy.scale.setScalar(p.scale);
   dummy.updateMatrix();bladeMesh.setMatrixAt(i,dummy.matrix);
   dummy.position.set(p.x,4.65*p.scale+levitate,p.z);
   dummy.rotation.set(0,p.a,p.tilt+tremble);dummy.updateMatrix();crossMesh.setMatrixAt(i,dummy.matrix);
  });
  bladeMesh.instanceMatrix.needsUpdate=true;crossMesh.instanceMatrix.needsUpdate=true;
 }
 matrices(0,0);
 // Burning crimson seal traces: the two concentric bands lie flush with stone.
 const seals=[];
 for(const rad of [18.7,21.6]){
  const seal=new T.Mesh(new T.RingGeometry(rad,rad+.12,coarse?48:96).rotateX(-Math.PI/2),crimson);
  seal.name='kwon-awakened-crimson-royal-seal';seal.position.y=.045;root.add(seal);seals.push(seal);
 }
 const runes=new T.InstancedMesh(new T.BoxGeometry(.09,.015,.9),crimson,coarse?18:30);
 runes.name='kwon-royal-seal-runes';root.add(runes);
 for(let i=0;i<runes.count;i++){
  const a=i*Math.PI*2/runes.count,r=20.25;
  dummy.position.set(Math.sin(a)*r,.052,Math.cos(a)*r);dummy.rotation.set(0,a,0);
  dummy.scale.set(1,1,1);dummy.updateMatrix();runes.setMatrixAt(i,dummy.matrix);
 }
 runes.instanceMatrix.needsUpdate=true;
 let phase=1,morph=0,time=0,resetAt=0,lastGame=null;
 function reset(){
  phase=1;morph=0;time=0;resetAt=0;lastGame=null;
  crimson.opacity=0;steel.emissiveIntensity=0;
  throne.rotation.z=0;matrices(0,0);
 }
 function update(g,dt=0){
  if(!g)return;
  const h=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  if(lastGame!==g||(g.time||0)<time){reset();lastGame=g;}
  time=Number.isFinite(g.time)?g.time:time+h;
  const next=g.boss?.phase===2?2:1;
  if(next!==phase){phase=next;resetAt=time;}
  const target=phase===2?1:0;
  morph+=(target-morph)*(1-Math.exp(-h*1.8));
  if(Math.abs(target-morph)<.001)morph=target;
  const k=smooth(morph),silenced=g.status==='won';
  crimson.opacity=k*(silenced?.1:.71);
  steel.emissive.setHex(0xb51b39);steel.emissiveIntensity=k*(silenced?.03:.58);
  throne.rotation.z=(silenced?0:k*.052)+(reduced?0:Math.sin(time*.8)*k*.025);
  if(!reduced&&(phase===2||morph>.001))matrices(k,time);
  else if(morph>.01)matrices(k,0);
  return {phase,redSeal:k};
 }
 reset();
 return {root,update,reset,stats:()=>({phase,outerSwordRadius:KWON_ROYAL_LAYOUT.outerSwordRadius,
  swords:positions.length,damageSources:0,collidableProps:0,morph})};
}
