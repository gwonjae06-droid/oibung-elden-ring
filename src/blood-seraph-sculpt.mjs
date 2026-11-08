import * as THREE from 'three';

// The Seraph's anatomy is sculpted geometry, not a planar reference image.
// Model scale, shaders and textures belong to the combat model's parent,
 // which owns the resources and disposes them on battle exit.
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const smooth=t=>{const v=clamp(t);return v*v*(3-2*v);};
function mesh(parent,geometry,material,name,x=0,y=0,z=0){
 const item=new THREE.Mesh(geometry,material);item.name=name;
 item.position.set(x,y,z);parent.add(item);return item;
}
function tube(parent,points,r,material,name,coarse){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return mesh(parent,new THREE.TubeGeometry(curve,coarse?9:18,r,5,false),
  material,name);
}
export function sculptBloodSeraph(root,{coarse=false,reduced=false,wings=[],featherGeometry}={}){
 const ivory=new THREE.MeshPhysicalMaterial({color:0xffd4c3,emissive:0x632536,
  emissiveIntensity:.42,metalness:.37,roughness:.23,clearcoat:.82});
 const roseGold=new THREE.MeshStandardMaterial({color:0xe4aabb,emissive:0x871c44,
  emissiveIntensity:.52,metalness:.48,roughness:.30});
 const glass=new THREE.MeshPhysicalMaterial({color:0x9b1937,emissive:0x4c1023,
  emissiveIntensity:.33,metalness:.08,roughness:.22,clearcoat:.9,
  transparent:true,opacity:.79,depthWrite:false,side:THREE.DoubleSide});
 const velvet=new THREE.MeshStandardMaterial({color:0x4d071e,
  emissive:0x20040d,emissiveIntensity:.20,metalness:.12,roughness:.37,
  side:THREE.DoubleSide});
 // Three sculpted, non-flat contiguous cloth shells taper into a suspended
 // cathedral cope. Keep the original 3P collision vessel unchanged.
 const robe=[];
 for(let layer=0;layer<3;layer++){
  const profile=[[.18,-5.45],[.42,-4.90],[.56,-4.1],[.72,-3.18],
   [.94,-2.02],[1.07,-.81],[1.00,.18],[.66,1.12]].map(([r,y])=>
    new THREE.Vector2(r*(1+layer*.08),y+layer*.06));
  const r=mesh(root,new THREE.LatheGeometry(profile,coarse?14:30),
   layer===1?glass:layer===2?roseGold:velvet,
   'blood-seraph-sculpted-sacred-robe-'+layer,0,-.26,-.32);
  r.scale.z=.84;robe.push(r);
 }
 const chest=mesh(root,new THREE.IcosahedronGeometry(1,coarse?1:2),glass,
  'blood-seraph-sculpted-chest-reliquary-armor',0,1.05,1.06);
 chest.scale.set(1.40,1.65,.53);
 const heart=mesh(root,new THREE.OctahedronGeometry(.45,coarse?0:1),roseGold,
  'blood-seraph-living-blood-sacrament',0,.84,1.66);
 const rings=[];
 for(let i=0;i<3;i++){
  const ring=mesh(root,new THREE.TorusGeometry(.73+i*.23,.053,7,coarse?24:52),
   i===1?ivory:roseGold,'blood-seraph-sacred-heart-halo-'+i,0,.84,1.71);
  ring.rotation.y=i*.17;rings.push(ring);
 }
 for(const side of [-1,1]){
  tube(root,[[side*.17,2.51,1.14],[side*.86,2.09,1.38],
   [side*1.29,1.28,1.29],[side*.66,.40,1.39]],
   .075,ivory,'blood-seraph-anatomical-pectoral-filigree-'+side,coarse);
  tube(root,[[side*.28,.15,1.23],[side*.70,-.72,1.07],
   [side*.45,-2.24,.67]],.057,roseGold,
   'blood-seraph-consecrated-rib-filament-'+side,coarse);
 }
 // An attached six-pointed bishop's coronet; no floating paper decal.
 const crown=[];
 for(let i=0;i<6;i++){
  const a=2*Math.PI*i/6;
  const spike=mesh(root,new THREE.ConeGeometry(.13,.9+(i%2)*.50,coarse?6:9),
   i%2?ivory:roseGold,'blood-seraph-ivory-altar-crown-'+i,
   Math.sin(a)*.98,5.37+(i%2)*.38,Math.cos(a)*.76-.42);
  spike.rotation.z=-Math.sin(a)*.17;crown.push(spike);
 }
 // A second row of distinct sculptural feathers beneath each of the six
 // existing animated wing joints; all follow the natural hinge rig.
 const secondary=[];
 const dummy=new THREE.Object3D(),tint=new THREE.Color();
 if(featherGeometry)for(const wing of wings){
  const count=coarse?8:14,form=wing.form;
  const m=new THREE.InstancedMesh(featherGeometry,
   new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x351224,
    emissiveIntensity:.25,roughness:.48,side:THREE.DoubleSide}),count);
  m.name='blood-seraph-rosy-secondary-feathers-'+wing.pair+'-'+wing.side;
  m.frustumCulled=false;
  for(let i=0;i<count;i++){
   const u=(i+.35)/count;
   dummy.position.set(form.span*u*.71,form.rise*u*.61-.21,
    form.depth*u*.62+.25);
   dummy.rotation.set(.12,0,-1.57+wing.pair*.12-u*.24);
   dummy.scale.set(.58,1.15+1.2*u,.82);
   dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
   tint.setHex(i%3?0x8a2949:0xf1b5c4);m.setColorAt(i,tint);
  }
  m.instanceMatrix.needsUpdate=true;
  if(m.instanceColor)m.instanceColor.needsUpdate=true;
  wing.pivot.add(m);secondary.push(m);
 }
 function update(g,c){
  const clock=g.time||0,active=c.active&&g.boss.phase===3;
  const sanctity=active?c.haloBirth??0:1;
  const pulse=.96+.04*Math.sin(clock*2.0);
  heart.rotation.y=clock*.37;
  heart.scale.setScalar((.42+.58*sanctity)*pulse);
  rings.forEach((ring,i)=>{
   const t=(active?.15+.85*sanctity:1)*pulse;
   ring.scale.setScalar(t);
   ring.rotation.z=clock*(i%2?-.22:.24)+i*.18;
  });
  crown.forEach((spike,i)=>{spike.scale.y=.72+.28*(active?smooth((c.faceReveal??0)*1.5):1);});
 }
 return {update,robe,heart,secondary,
  stats:()=>({robeLayers:robe.length,crownProngs:crown.length,
   secondaryFeathers:secondary.reduce((n,m)=>n+m.count,0),heart:!!heart})};
}
