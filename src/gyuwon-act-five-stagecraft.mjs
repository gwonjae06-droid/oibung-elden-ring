import * as T from 'three';
// Physical stage props follow the recorded words. They are not damage zones;
// the raid simulation separately owns every attacking hand and projectile.
export function createActFiveStagecraft(parent,head,{coarse=false}={}){
 const root=new T.Group();root.name='act-five-sung-stagecraft';root.userData.decorativeOnly=true;parent.add(root);
 const geos=new Set(),mats=new Set(),geo=g=>(geos.add(g),g),mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.7,...extra});mats.add(m);return m;};
 const gold=mat(0xdfae45,{metalness:.5,roughness:.4}),navy=mat(0x253d5b),wood=mat(0x9a563d),blue=mat(0x368bb1),ivory=mat(0xf3dcaa),black=mat(0x1c2433);
 const box=geo(new T.BoxGeometry(1,1,1)),ball=geo(new T.SphereGeometry(1,16,12)),ring=geo(new T.TorusGeometry(1,.065,8,32)),cyl=geo(new T.CylinderGeometry(1,1,1,16));
 const mesh=(p,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;};
 const crown=new T.Group();crown.name='act-five-sung-crown';head.add(crown);mesh(crown,ring,gold,0,.56,0,.57,.57,.57).rotation.x=Math.PI/2;
 const tip=geo(new T.ConeGeometry(.075,.32,8));for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(crown,tip,gold,Math.sin(a)*.52,.72,Math.cos(a)*.52);}
 const doors=new T.Group();doors.name='act-five-thousand-doors';root.add(doors);const leaves=[];
 for(const x of [-22,0,22]){for(const side of [-1,1])mesh(doors,box,ivory,x+side*2.1,4,-15,.3,8,.5);mesh(doors,box,gold,x,8,-15,4.5,.3,.6);
  const hinge=new T.Group();hinge.position.set(x-1.94,0,-15);doors.add(hinge);mesh(hinge,box,wood,1.94,3.9,0,3.88,7.8,.18);mesh(hinge,ball,gold,3.4,3.9,.2,.14,.14,.14);leaves.push(hinge);
 }
 const roads=new T.Group();roads.name='act-five-unseen-roads';root.add(roads);
 for(const side of [-1,0,1]){const pts=[new T.Vector3(side*22,.25,-14),new T.Vector3(side*15,.25,-5),new T.Vector3(side*20,.25,15)];mesh(roads,geo(new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.14,6,false)),gold);}
 const sea=new T.Group();sea.name='act-five-golden-sea';root.add(sea);for(let j=0;j<3;j++){const pts=[];for(let i=0;i<=24;i++)pts.push(new T.Vector3(-32+i*64/24,2+Math.sin(i*.65+j)*.7,-17-j*2));mesh(sea,geo(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.18,6,false)),j%2?blue:gold);}
 const horns=new T.Group();horns.name='act-five-sung-trumpets';root.add(horns);for(const side of [-1,1]){const horn=new T.Group();horn.position.set(side*26,12,-13);horn.rotation.z=side*.25;horns.add(horn);
  mesh(horn,cyl,gold,0,0,0,.21,3,.21).rotation.x=Math.PI/2;mesh(horn,geo(new T.ConeGeometry(.9,1.5,24,1,true)),gold,0,0,2).rotation.x=Math.PI/2;mesh(horn,ring,gold,.65,-.25,.2,.8,.8,.8);mesh(horn,ball,black,0,0,2.7,.65,.65,.07);
 }
 const starShape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.42:1;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
 const starGeo=geo(new T.ExtrudeGeometry(starShape,{depth:.16,bevelEnabled:false}));const stars=new T.InstancedMesh(starGeo,gold,coarse?24:48);stars.name='act-five-sky-and-flight-stars';root.add(stars);
 const matrix=new T.Matrix4(),rotation=new T.Quaternion(),pos=new T.Vector3(),scale=new T.Vector3();
 // Every prop below is scenery rather than a second invisible hitbox.
 // Song phrases choose tangible items: sword, ship, orbiting stories, dancers,
 // flying wings, a heart and a compass. Nothing is spawned in the render loop.
 const rose=mat(0xd85172,{emissive:0x741a39,emissiveIntensity:.45});
 const ocean=mat(0x248dab,{transparent:true,opacity:.56,metalness:.15,roughness:.28,side:T.DoubleSide});
 const water=new T.Group();water.name='act-five-lyric-ocean';root.add(water);
 const waterSheet=mesh(water,geo(new T.PlaneGeometry(66,20,12,6)),ocean,0,1,-23);waterSheet.rotation.x=-Math.PI/2;
 const ship=new T.Group();ship.name='act-five-dream-sailboat';water.add(ship);
 mesh(ship,ball,wood,0,0,0,4,1.1,1.5);
 mesh(ship,cyl,ivory,0,3,0,.14,5.5,.14);
 const sail=mesh(ship,geo(new T.ConeGeometry(2.2,4.7,3)),ivory,1.2,3,.1,1,1,.18);sail.rotation.z=-Math.PI/6;
 const banner=mesh(ship,box,gold,0,6.1,0,2,.35,.12);
 const knight=new T.Group();knight.name='act-five-knight-sword-and-shield';knight.position.set(-17,19,-21);root.add(knight);
 mesh(knight,box,ivory,0,2,0,.65,7,.3);
 mesh(knight,geo(new T.ConeGeometry(.53,1.6,4)),ivory,0,6.2,0);
 mesh(knight,box,gold,0,-1.1,0,4,.46,.7);
 mesh(knight,cyl,wood,0,-2,0,.18,1.9,.2);
 const shield=mesh(knight,geo(new T.IcosahedronGeometry(2.6,0)),gold,-5,-.1,.2,1,.95,.3);
 mesh(shield,ball,blue,0,0,.88,.4,.4,.7);
 const heart=new T.Group();heart.name='act-five-shared-heart';heart.position.set(0,18,-23);root.add(heart);
 for(const side of [-1,1])mesh(heart,ball,rose,side*1.1,.7,0,1.65,1.65,.8);
 mesh(heart,geo(new T.ConeGeometry(2.65,3.8,4)),rose,0,-1.1,0).rotation.z=Math.PI;
 const heartRing=mesh(heart,ring,gold,0,0,-1,3.45,3.45,3.45);
 const compass=new T.Group();compass.name='act-five-unexplored-compass';compass.position.set(0,10,-23);root.add(compass);
 mesh(compass,ring,gold,0,0,0,6.6,6.6,6.6);
 const compassNeedle=mesh(compass,box,blue,0,0,0,.42,9,.45);
 const story=new T.Group();story.name='act-five-many-stories';story.position.set(0,22,-26);root.add(story);
 const pages=Array.from({length:7},(_,i)=>{const page=mesh(story,box,i%2?gold:ivory,0,0,0,2.3,3.2,.24);page.rotation.y=i*.65;return page;});
 const wings=new T.Group();wings.name='act-five-physical-dream-wings';wings.position.set(0,25,-24);root.add(wings);
 const feathers=[];for(const side of [-1,1])for(let i=0;i<4;i++){
  const feather=mesh(wings,geo(new T.ConeGeometry(.85,6.2-i*.6,7)),i%2?ivory:blue,side*(8+i*2.6),-i*.75,-2,.85,1,.5);
  feather.rotation.z=side*(Math.PI/2+i*.13);feathers.push(feather);
 }
 const dancers=new T.Group();dancers.name='act-five-dancing-roles';root.add(dancers);
 const performers=[-1,1].map(side=>{
  const person=new T.Group();person.position.set(side*27,0,-23);dancers.add(person);
  mesh(person,cyl,navy,0,3.2,0,.85,4.5,.7);
  mesh(person,ball,ivory,0,6.6,0,.9,.98,.85);
  const arms=[-1,1].map(a=>{const arm=mesh(person,cyl,ivory,a*1.9,4.7,0,.22,3.2,.25);arm.rotation.z=a*.75;return arm;});
  const legs=[-1,1].map(a=>{const leg=mesh(person,cyl,wood,a*.55,.9,0,.28,2,.28);return leg;});
  mesh(person,geo(new T.TorusGeometry(1.2,.12,6,16)),gold,0,5.65,-.35,1,1,1);
  return {person,arms,legs,side};
 });
  const platforms=[-1,1].map(side=>mesh(root,box,navy,side*25,.2,-12,9,.4,9));
 function update(m){const p=m.songPerformance||{gesture:'idle',weight:0,progress:0},g=p.gesture,w=p.weight;
  const royal=['king','crowns','roles'].includes(g);crown.visible=royal&&w>.01;crown.scale.setScalar(w);crown.rotation.y=Math.sin(m.time*.9)*.06;
  doors.visible=['doors','roads','dream','beginning','choose'].includes(g)&&w>.01;doors.scale.y=w;leaves.forEach((o,i)=>o.rotation.y=-(.15+1.9*p.progress)*w*(i%2?1:-1));
  roads.visible=['roads','adventure','run','beginning'].includes(g)&&w>.01;
  sea.visible=g==='sea'&&w>.01;sea.position.y=Math.sin(m.time*1.4)*.3;
  horns.visible=g==='brass'&&w>.01;horns.scale.setScalar(.1+.9*w);horns.rotation.y=Math.sin(m.time*4)*.015;
  stars.visible=['dream','sky','flight','roles','conduct','laugh','beginning'].includes(g)&&w>.01;
  if(stars.visible){for(let i=0;i<stars.count;i++){pos.set(Math.sin(i*7.13)*34,14+(i*17%29)+Math.sin(m.time*.65+i)*.5,-33-(i%3)*2);const s=(.25+(i%5)*.12)*w;scale.setScalar(s);rotation.setFromAxisAngle(T.Object3D.DEFAULT_UP,m.time*.3+i);matrix.compose(pos,rotation,scale);stars.setMatrixAt(i,matrix);}stars.instanceMatrix.needsUpdate=true;}
  water.visible=g==='sea'&&w>.01;
  if(water.visible){water.scale.y=.5+.5*w;waterSheet.position.y=1+Math.sin(m.time*1.3)*.38;
   ship.position.set(Math.sin(m.time*.44)*7,2.1+Math.sin(m.time*1.7)*.65,-22);
   ship.rotation.z=Math.sin(m.time*1.05)*.085;banner.rotation.y=Math.sin(m.time*2)*.08;}
  knight.visible=g==='knight'&&w>.01;
  if(knight.visible){knight.rotation.z=-.25+Math.sin(p.progress*Math.PI)*.52;shield.rotation.y=Math.sin(m.time*.75)*.18;}
  heart.visible=['heart','self','hand','together'].includes(g)&&w>.01;
  if(heart.visible){const pulse=1+.12*Math.sin(m.time*6.5);heart.scale.setScalar(w*pulse);heart.rotation.y=Math.sin(m.time*.7)*.15;heartRing.rotation.z=m.time*.22;}
  compass.visible=['roads','adventure','run','choose'].includes(g)&&w>.01;
  if(compass.visible){compass.scale.setScalar(.7+.3*w);compass.rotation.y=Math.sin(m.time*.35)*.22;compassNeedle.rotation.z=-m.time*.7;}
  story.visible=['dream','roles','costume','crowns','choose'].includes(g)&&w>.01;
  if(story.visible){pages.forEach((page,i)=>{const a=m.time*.54+i*Math.PI*2/7,r=5.8+Math.sin(i)*.9;
   page.position.set(Math.cos(a)*r,Math.sin(a)*2.2,Math.sin(a)*r*.23);
   page.rotation.y=a+Math.PI/2;page.rotation.z=Math.sin(a)*.24;});story.scale.setScalar(w);}
  wings.visible=['flight','sky','dream'].includes(g)&&w>.01;
  if(wings.visible){wings.scale.setScalar(.55+.45*w);feathers.forEach((o,i)=>{const side=i<4?-1:1;
   o.rotation.z=side*(Math.PI/2+(i%4)*.13+Math.sin(m.time*2.2+i*.48)*.19);});}
  dancers.visible=['dance','roles','stage','together','conduct'].includes(g)&&w>.01;
  if(dancers.visible)performers.forEach(({person,arms,legs,side},i)=>{
   const beat=m.time*2.6+i*Math.PI;person.position.y=Math.abs(Math.sin(beat))*.46;
   person.rotation.y=side*.18+Math.sin(beat*.5)*.27;
   arms.forEach((o,j)=>o.rotation.z=(j===0?-1:1)*(.55+Math.sin(beat+j*Math.PI)*.45));
   legs.forEach((o,j)=>o.rotation.z=Math.sin(beat+j*Math.PI)*.22);
  });
  platforms.forEach((o,i)=>{o.visible=['stage','dance','together','conduct'].includes(g);o.position.y=.2+(g==='stage'?p.progress:.8)*w;o.rotation.z=Math.sin(m.time*1.2+i)*.005;});
 }
 return {update,starGeometry:starGeo,dispose(){root.removeFromParent();crown.removeFromParent();stars.dispose();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
