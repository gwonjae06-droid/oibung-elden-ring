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
 const platforms=[-1,1].map(side=>mesh(root,box,navy,side*25,.2,-12,9,.4,9));
 function update(m){const p=m.songPerformance||{gesture:'idle',weight:0,progress:0},g=p.gesture,w=p.weight;
  const royal=['king','crowns','roles'].includes(g);crown.visible=royal&&w>.01;crown.scale.setScalar(w);crown.rotation.y=Math.sin(m.time*.9)*.06;
  doors.visible=['doors','roads','dream','beginning','choose'].includes(g)&&w>.01;doors.scale.y=w;leaves.forEach((o,i)=>o.rotation.y=-(.15+1.9*p.progress)*w*(i%2?1:-1));
  roads.visible=['roads','adventure','run','beginning'].includes(g)&&w>.01;
  sea.visible=g==='sea'&&w>.01;sea.position.y=Math.sin(m.time*1.4)*.3;
  horns.visible=g==='brass'&&w>.01;horns.scale.setScalar(.1+.9*w);horns.rotation.y=Math.sin(m.time*4)*.015;
  stars.visible=['dream','sky','flight','roles','conduct'].includes(g)&&w>.01;
  if(stars.visible){for(let i=0;i<stars.count;i++){pos.set(Math.sin(i*7.13)*34,14+(i*17%29)+Math.sin(m.time*.65+i)*.5,-33-(i%3)*2);const s=(.25+(i%5)*.12)*w;scale.setScalar(s);rotation.setFromAxisAngle(T.Object3D.DEFAULT_UP,m.time*.3+i);matrix.compose(pos,rotation,scale);stars.setMatrixAt(i,matrix);}stars.instanceMatrix.needsUpdate=true;}
  platforms.forEach((o,i)=>{o.visible=['stage','dance','together','conduct'].includes(g);o.position.y=.2+(g==='stage'?p.progress:.8)*w;o.rotation.z=Math.sin(m.time*1.2+i)*.005;});
 }
 return {update,starGeometry:starGeo,dispose(){root.removeFromParent();crown.removeFromParent();stars.dispose();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
