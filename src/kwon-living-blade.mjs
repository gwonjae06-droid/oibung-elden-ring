// Living jaw-sword anatomy. These small cartilage ridges and tendons ride the
// already-authoritative sword transform. They never change sword reach/damage.
const sat=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function livingBladePulse(b,m={}){
 if(!b||b.state==='dead')return 0;
 const base=b.phase===2?.34:.11;
 const strike=sat(m.strike),brace=sat(m.brace),follow=sat(m.follow);
 return Math.min(1,base+.25*brace+.5*strike+.16*follow+
  ((b.pattern==='livingSword'||b.pattern==='lastStance')?.16:0));
}
export function createKwonLivingBlade(T,swordGroup,{length=8.55,coarse=false}={}){
 const root=new T.Group();root.name='kwon-living-jaw-blade-rig';
 root.userData.decorativeOnly=true;swordGroup.add(root);
 const ivory=new T.MeshStandardMaterial({color:0xd0b7a1,metalness:.12,roughness:.48,
  emissive:0x2a0a0d,emissiveIntensity:.12});
 const tendon=new T.MeshPhysicalMaterial({color:0x531722,metalness:.05,roughness:.29,
  clearcoat:.6,clearcoatRoughness:.2,emissive:0x220609,emissiveIntensity:.12});
 const lengthSafe=Math.max(2,Math.min(16,Number.isFinite(length)?length:8.55));
 const geometries=[],ribs=[];
 function addGeometry(geo){geometries.push(geo);return geo;}
 // Two corded muscle bands extend from the socket toward the blade edge.
 for(const side of [-1,1]){
  const points=[];
  for(let j=0;j<=12;j++){
   const u=j/12,edge=side*(.44+.08*Math.sin(u*Math.PI*3.2));
   points.push(new T.Vector3(edge,.18+.07*Math.sin(u*12+side),.22+lengthSafe*.89*u));
  }
  const geo=addGeometry(new T.TubeGeometry(new T.CatmullRomCurve3(points),coarse?18:32,.063,coarse?5:8,false));
  const cord=new T.Mesh(geo,tendon);cord.name='kwon-living-blade-longitudinal-tendon';root.add(cord);
 }
 const segmentCount=coarse?7:13,spine=addGeometry(new T.ConeGeometry(.14,.39,coarse?6:9));
 for(let i=0;i<segmentCount;i++){
  const u=(i+.6)/(segmentCount+.6),z=.35+lengthSafe*.86*u;
  for(const side of [-1,1]){
   const segment=new T.Group();segment.position.set(side*(.48-.09*u),.18,z);root.add(segment);
   segment.name='kwon-living-blade-cartilage-rib';
   const tooth=new T.Mesh(spine,ivory);tooth.position.set(side*.085,.09,0);
   tooth.rotation.set(Math.PI*.50,0,side*.27);segment.add(tooth);
   ribs.push({group:segment,u,side,baseX:segment.position.x,baseZ:z});
  }
 }
 // A suture along the back merges into the existing teeth rather than floating.
 const seam=addGeometry(new T.TubeGeometry(new T.CatmullRomCurve3([
  new T.Vector3(0,-.08,.4),new T.Vector3(0,.12,lengthSafe*.3),
  new T.Vector3(0,.18,lengthSafe*.64),new T.Vector3(0,.08,lengthSafe*.91)]),coarse?12:24,.04,6,false));
 const nerve=new T.Mesh(seam,tendon);nerve.name='kwon-living-blade-dorsal-nerve';root.add(nerve);
 let intensity=0,disposed=false;
 function update(b,m={}){
  if(disposed)return;
  intensity=livingBladePulse(b,m);
  root.visible=b?.state!=='dead';
  const state=b?.state==='active'?1:b?.state==='windup'?.5:.15,t=Number.isFinite(b?.t)?b.t:0;
  for(const {group,u,side,baseX,baseZ}of ribs){
   const wiggle=Math.sin(t*(state?9:2.6)+u*13+side)*(.014+.04*intensity);
   group.position.set(baseX+side*wiggle,.18+.055*intensity,baseZ);
   group.rotation.y=side*(.035+.12*intensity*Math.sin(u*5+t*3));
   group.scale.set(1+.16*intensity,1+.28*intensity,1);
  }
  tendon.emissiveIntensity=.12+.28*intensity;
  ivory.emissiveIntensity=.08+.13*intensity;
 }
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  for(const geo of geometries)geo.dispose();ivory.dispose();tendon.dispose();
 }
 return {root,update,dispose,stats:()=>({ribs:ribs.length,cords:2,collidable:false,
  intensity,decorativeOnly:true})};
}
