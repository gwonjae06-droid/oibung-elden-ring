// Fixed-budget casino set dressing. Breakable furniture stays beyond the
// 67.5m playable square: render transforms NEVER enter the giant's hit tests.
const sat=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const ease=v=>{const u=sat(v);return u*u*(3-2*u);};
const GOLDEN_ANGLE=2.399963229728653;
export function casinoFurniturePose(age,side,part,impact=0){
 const shatter=ease(age/1.05),drop=ease((age-.38)/1.45);
 const sign=(part%2?1:-1)*side;
 return {x:sign*shatter*(1.4+part*.63),y:-drop*(2.6+part*.19)+impact*.32,
  z:shatter*(part<2?1.6:-1.7),pitch:shatter*(part<2?.24:-.37),
  roll:sign*shatter*(.16+part*.045)+impact*.045};
}
export function createCasinoBreakawayTables(T,parent,{coarse=false,reduced=false}={}){
 const root=new T.Group();root.name='casino-furniture-breakaway';root.userData.decorativeOnly=true;parent.add(root);
 const wood=new T.MeshStandardMaterial({color:0x2a111a,roughness:.57,metalness:.1}),
  felt=new T.MeshStandardMaterial({color:0x253a35,roughness:.87,metalness:0}),
  brass=new T.MeshStandardMaterial({color:0xc7a065,roughness:.33,metalness:.7});
 const geo=new T.BoxGeometry(1,1,1),splinterGeo=new T.TetrahedronGeometry(1);
 const tables=[],parts=[];
 const add=(p,m,x,y,z,w,h,d,name)=>{
  const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.name=name;o.castShadow=!coarse;p.add(o);return o;
 };
 for(const side of [-1,1]){
  const table=new T.Group();table.name='casino-spectator-table';table.position.set(side*110,0,-102);root.add(table);tables.push(table);
  for(const x of [-10.5,10.5])for(const z of [-5.5,5.5]){
   const leg=add(table,wood,x,3.3,z,1.5,6.6,1.5,'casino-table-leg');
   add(table,brass,x,1.3,z,1.85,.45,1.85,'casino-table-brass-foot');leg.rotation.y=.02*side;
  }
  for(let j=0;j<4;j++){
   const x=(j%2?1:-1)*7.2,z=(j<2?-1:1)*4.6,
    chunk=new T.Group();chunk.name='casino-breakaway-felt-panel';chunk.position.set(x,7.2,z);table.add(chunk);
   add(chunk,wood,0,0,0,14.1,1.25,9.1,'casino-carved-mahogany-slab');
   add(chunk,felt,0,.68,0,13.3,.12,8.3,'casino-split-green-felt');
   add(chunk,brass,0,.36,(j<2?-1:1)*4.49,14.1,.3,.15,'casino-brass-rim');
   parts.push({chunk,side,part:j,x,z});
  }
 }
 const count=coarse?20:64,fragments=new T.InstancedMesh(splinterGeo,brass,count);
 fragments.name='casino-physical-gold-and-wood-fragments';fragments.instanceMatrix.setUsage(T.DynamicDrawUsage);
 fragments.frustumCulled=false;fragments.count=0;root.add(fragments);
 const dummy=new T.Object3D();let owner=null,lastTime=-Infinity,shatterTime=null,phase=1;
 function clear(){
  shatterTime=null;phase=1;fragments.count=0;
  for(const p of parts){p.chunk.position.set(p.x,7.2,p.z);p.chunk.rotation.set(0,0,0);}
 }
 function update(g,time=0){
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if(owner!==g||t<lastTime-.05){owner=g;clear();}
  lastTime=t;
  const next=g?.boss?.phase===3||g?.dice?.giant?.temperament==='feral'?3:g?.boss?.phase===2||g?.dice?.giant?2:1;
  phase=next;if(next===3&&shatterTime===null)shatterTime=t;
  const age=shatterTime===null?0:Math.max(0,t-shatterTime);
  const s=g?.dice?.giant;
  let impact=0;
  if(s?.state==='attack'&&Array.isArray(s.hazards)){
   for(const h of s.hazards){
    if(h.cancelled||!h.headSlam||!Number.isFinite(h.start)||!Number.isFinite(h.warn))continue;
    const delta=s.t-h.start-h.warn;
    if(delta>=0&&delta<.4)impact=Math.max(impact,1-ease(delta/.4));
   }
  }
  for(const p of parts){
   const q=shatterTime===null?null:casinoFurniturePose(age,p.side,p.part,impact);
   if(q){p.chunk.position.set(p.x+q.x,7.2+q.y,p.z+q.z);p.chunk.rotation.set(q.pitch,0,q.roll);}
  }
  const flying=shatterTime!==null&&age<2.8&&!reduced;
  fragments.count=flying?count:0;
  if(flying){
   for(let i=0;i<count;i++){
    const which=i%2,side=which?1:-1,a=i*GOLDEN_ANGLE,r=2+(i%9)*.76,
     drift=age*(13+(i%7)*2.2),lift=age*(12+(i%5)*3)-20*age*age;
    dummy.position.set(side*110+Math.cos(a)*(r+drift),Math.max(.14,7.7+lift),-102+Math.sin(a)*(r+drift));
    dummy.rotation.set(age*(2+i%4),a+age*(1.5+i%3),age*(2.2+i%5));
    const size=(.34+(i%6)*.13)*(1-ease((age-1.8)/1));
    dummy.scale.set(size*2,size*.36,size*1.5);dummy.updateMatrix();
    fragments.setMatrixAt(i,dummy.matrix);
   }
   fragments.instanceMatrix.needsUpdate=true;
  }
 }
 return {root,update,reset:clear,stats:()=>({
  phase,tableCount:tables.length,panels:parts.length,activeFragments:fragments.count,
  fragmentCapacity:count,decorativeOnly:true,collidable:false})};
}
