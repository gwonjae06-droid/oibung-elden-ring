import * as THREE from 'three';
// Actual handheld objects on the sculpted actor's wrist joints. No duplicate
// 'rifle and bow at once' prop can be spawned in world space.
export function createGyuwonYearWeaponProps({wrists,coarse=false}={}){
 const materials=[],geometries=[],groups=[];
 const material=(color,opts={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.65,...opts});materials.push(m);return m;};
 const geo=g=>{geometries.push(g);return g;};
 const metal=material(0x383e49,{metalness:.82,roughness:.29});
 const barrel=material(0x85888d,{metalness:.88,roughness:.20});
 const stock=material(0x302c2c,{roughness:.86});
 const wood=material(0x795438,{roughness:.68});
 const paper=material(0xeedfc6,{roughness:.93});
 const filter=material(0xc89d67,{roughness:.81});
 const ember=material(0xfb743d,{emissive:0xed3f19,emissiveIntensity:1.7});
 const stringMat=material(0xcfc1a2,{roughness:.88});
 const smoke=material(0xb9c4c5,{transparent:true,opacity:.19,depthWrite:false});
 function add(p,g,m,name,x=0,y=0,z=0){
  const item=new THREE.Mesh(geo(g),m);item.name=name;item.position.set(x,y,z);
  item.castShadow=true;p.add(item);return item;
 }
 const mount=(joint,name)=>{const group=new THREE.Group();group.name=name;joint.add(group);groups.push(group);return group;};
 const cigarette=mount(wrists[1],'gyuwon-cigarette-handheld-rig');
 cigarette.position.set(.025,-.12,.14);
 const shaft=add(cigarette,new THREE.CylinderGeometry(.037,.037,.57,coarse?10:18),paper,'gyuwon-cigarette-white-paper',0,-.02,.22);
 shaft.rotation.x=Math.PI/2;
 const tip=add(cigarette,new THREE.CylinderGeometry(.039,.039,.14,12),filter,'gyuwon-cigarette-filter',0,-.02,-.075);
 tip.rotation.x=Math.PI/2;
 const ash=add(cigarette,new THREE.CylinderGeometry(.04,.035,.045,12),ember,'gyuwon-cigarette-glowing-ember',0,-.02,.54);
 ash.rotation.x=Math.PI/2;
 const smokePuffs=[];
 for(let i=0;i<(coarse?4:7);i++){
  const m=smoke.clone();materials.push(m);
  const puff=add(cigarette,new THREE.SphereGeometry(.09,coarse?8:12,coarse?5:8),m,
   'gyuwon-cigarette-actual-exhaled-smoke');
  smokePuffs.push(puff);
 }
 const gun=mount(wrists[1],'gyuwon-fourth-year-rifle-rig');
 gun.position.set(.015,-.12,.18);
 const receiver=add(gun,new THREE.BoxGeometry(.33,.31,1.22),metal,'gyuwon-rifle-receiver',0,0,.72);
 add(gun,new THREE.BoxGeometry(.27,.25,.8),wood,'gyuwon-rifle-wooden-stock',0,-.04,-.29);
 const muzzle=add(gun,new THREE.CylinderGeometry(.07,.085,1.5,coarse?10:18),barrel,
  'gyuwon-rifle-long-barrel',0,.025,1.87);muzzle.rotation.x=Math.PI/2;
 const flashSuppressor=add(gun,new THREE.CylinderGeometry(.10,.087,.23,14),metal,
  'gyuwon-rifle-muzzle-brake',0,.025,2.68);flashSuppressor.rotation.x=Math.PI/2;
 const handle=add(gun,new THREE.BoxGeometry(.15,.51,.25),stock,
  'gyuwon-rifle-trigger-grip',0,-.37,.38);handle.rotation.x=-.26;
 add(gun,new THREE.BoxGeometry(.34,.055,.46),barrel,'gyuwon-rifle-chamber',0,.18,.67);
 const scope=add(gun,new THREE.CylinderGeometry(.14,.14,.63,coarse?10:18),metal,
  'gyuwon-rifle-optic',0,.33,.85);scope.rotation.x=Math.PI/2;
 add(gun,new THREE.CylinderGeometry(.09,.09,.035,16),barrel,
  'gyuwon-rifle-scope-lens',0,.33,1.17).rotation.x=Math.PI/2;
 const magazine=add(gun,new THREE.BoxGeometry(.19,.44,.29),metal,
  'gyuwon-rifle-magazine',0,-.37,.84);magazine.rotation.x=.14;
 const supportingHand=mount(wrists[0],'gyuwon-rifle-left-support-grip');
 const glove=add(supportingHand,new THREE.BoxGeometry(.19,.12,.26),stock,
  'gyuwon-rifle-front-handhold',0,-.14,.18);
 // Dedicated longbow and separate nocked arrow. They do not share the gun.
 const bow=mount(wrists[0],'gyuwon-fourth-year-bow-rig');
 bow.position.set(0,-.08,.35);
 const upper=[[-.03,-1.26,.17],[-.01,-1.08,.42],[0,-.60,.59],[0,0,.64]];
 const lower=[[0,0,.64],[0,.60,.59],[.01,1.08,.42],[.03,1.26,.17]];
 const bowGeo=pts=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),
  coarse?12:28,.075,coarse?7:12,false);
 add(bow,bowGeo(upper),wood,'gyuwon-bow-recurved-upper-limb');
 add(bow,bowGeo(lower),wood,'gyuwon-bow-recurved-lower-limb');
 add(bow,new THREE.BoxGeometry(.17,.4,.16),stock,'gyuwon-bow-hand-grip',0,0,.61);
 const drawLine=geo(new THREE.BufferGeometry());
 drawLine.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));
 const bowString=new THREE.Line(drawLine,new THREE.LineBasicMaterial({color:0xf4eac8}));
 materials.push(bowString.material);bowString.name='gyuwon-bow-live-drawn-string';bow.add(bowString);
 const arrow=mount(wrists[1],'gyuwon-fourth-year-nocked-arrow');
 arrow.position.set(0,-.16,.18);
 const arrowShaft=add(arrow,new THREE.CylinderGeometry(.031,.031,1.55,coarse?8:12),
  wood,'gyuwon-bow-separate-arrow-shaft',0,0,.67);arrowShaft.rotation.x=Math.PI/2;
 const point=add(arrow,new THREE.ConeGeometry(.105,.34,coarse?7:12),
  barrel,'gyuwon-bow-arrowhead',0,0,1.49);point.rotation.x=Math.PI/2;
 const feathers=add(arrow,new THREE.BoxGeometry(.26,.022,.24),paper,
  'gyuwon-bow-feather-fletching',0,.06,-.01);feathers.rotation.z=.4;
 let disposed=false;
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,year=e?.year,cast=e?.mode==='combat'?e.cast:null,t=e?.castT||0;
  cigarette.visible=cast==='smoke'||cast==='ultimateSmoke'||cast==='nightmare365'&&t>=2.7&&t<4.55;
  gun.visible=cast==='sniper'||cast==='crossfire'||cast==='ultimateMarksman'||cast==='nightmare365'&&t>=4.25&&t<6.25;
  supportingHand.visible=gun.visible;
  bow.visible=cast==='archery'||cast==='ultimateMarksman'&&t>=3.8||cast==='nightmare365'&&t>=5.5&&t<6.6;
  arrow.visible=bow.visible;
  const smoking=Math.max(0,Math.min(1,t/1.2));
  cigarette.rotation.set(-.24-.55*smoking,0,.16);
  ember.emissiveIntensity=1.1+.7*Math.max(0,Math.sin(t*8));
  smokePuffs.forEach((p,i)=>{
   const u=((t*.55+i/smokePuffs.length)%1);
   p.visible=cigarette.visible&&t>.47;
   p.position.set(.11*Math.sin(t*1.9+i*2.1)+u*.21,.03+u*1.1,.57+u*.45);
   p.scale.setScalar(.4+u*2.9);
   p.material.opacity=(1-u)*.18;
  });
  const shot=gun.visible&&g.gyuwon?.hazards?.some(h=>h.visual==='year-bullet'&&
   h.age>=h.warn&&h.age<h.warn+.13);
  gun.position.z=.18-(shot?.15:0);
  gun.rotation.x=shot?.13:0;
  // Every arrow remains a genuine 3D bolt while the separate string bends
  // smoothly toward the pulling hand. Nock recoils on its authored beat.
  const draw=bow.visible?Math.min(1,t/1.16):0;
  const released=(e?.cast==='archery'||e?.cast==='ultimateMarksman')&&g.gyuwon?.hazards?.some(h=>h.visual==='year-arrow'&&h.fired);
  const pull=draw*(released?.13:1);
  const positions=drawLine.getAttribute('position');
  positions.setXYZ(0,0,-1.26,.17);
  positions.setXYZ(1,0,0,.17-pull*.72);
  positions.setXYZ(2,0,1.26,.17);
  positions.needsUpdate=true;
  arrow.position.z=.18-pull*.54;arrow.rotation.x=.12*pull;
 }
 function dispose(){if(disposed)return;disposed=true;
  groups.forEach(g=>g.removeFromParent());
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
 }
 return {update,dispose,stats:()=>({cigarette:cigarette.visible,gun:gun.visible,bow:bow.visible})};
}
