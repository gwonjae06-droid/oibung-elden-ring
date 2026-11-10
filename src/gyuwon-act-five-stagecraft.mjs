import * as T from 'three';
// A single concrete prop when the words need one. The actor supplies the rest.
export function createActFiveStagecraft(parent,head,{coarse=false,hands=[]}={}){
 const root=new T.Group();root.name='act-five-literal-stage-props';root.userData.decorativeOnly=true;parent.add(root);
 const geos=new Set(),mats=new Set(),geo=g=>(geos.add(g),g),mat=color=>{const m=new T.MeshStandardMaterial({color,roughness:.73,metalness:color===0xc7a25e?.45:0});mats.add(m);return m;};
 const gold=mat(0xc7a25e),ivory=mat(0xdbd6c3),wood=mat(0x775441),blue=mat(0x315d73);
 const box=geo(new T.BoxGeometry(1,1,1)),ring=geo(new T.TorusGeometry(1,.07,8,32)),cyl=geo(new T.CylinderGeometry(1,1,1,coarse?12:20));
 const add=(p,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;};
 const crown=new T.Group();crown.name='act-five-sung-crown';head.add(crown);add(crown,ring,gold,0,.56,0,.57,.57,.57).rotation.x=Math.PI/2;
 const tip=geo(new T.ConeGeometry(.075,.32,8));for(let i=0;i<7;i++){const a=i*Math.PI*2/7;add(crown,tip,gold,Math.sin(a)*.52,.72,Math.cos(a)*.52);}
 const door=new T.Group();door.name='act-five-single-opening-door';door.position.set(-26,0,-30);root.add(door);
 for(const side of [-1,1])add(door,box,ivory,side*4.5,7,0,.45,14,.6);add(door,box,gold,0,14,0,9.5,.4,.7);
 const hinge=new T.Group();hinge.position.x=-4.25;door.add(hinge);add(hinge,box,wood,4.25,7,0,8.5,14,.3);
 const path=new T.Group();path.name='act-five-unseen-roads';root.add(path);for(let i=0;i<10;i++)add(path,box,wood,Math.sin(i*.22)*3,.04,-21+i*3.1,5.5,.08,3);
 const sea=add(root,geo(new T.PlaneGeometry(66,15,12,3)),blue,0,.12,-25);sea.rotation.x=-Math.PI/2;sea.name='act-five-quiet-sea';
 const horn=new T.Group();horn.name='act-five-held-trumpet';(hands[1]||root).add(horn);horn.position.set(-5,2,-3);
 add(horn,cyl,gold,0,0,3,.38,6,.38).rotation.x=Math.PI/2;
 add(horn,geo(new T.ConeGeometry(1.6,2.6,coarse?16:28,1,true)),gold,0,0,7.2).rotation.x=-Math.PI/2;
 const loop=add(horn,ring,gold,1.15,-.7,2.5,1.6,1.15,1);loop.rotation.y=Math.PI/2;
 for(let i=0;i<3;i++)add(horn,cyl,gold,.65,.4,1.6+i*.8,.15,1.1,.15);
 const sword=new T.Group();sword.name='act-five-held-knight-sword';(hands[1]||root).add(sword);
 add(sword,cyl,wood,0,0,1,.3,3,.3).rotation.x=Math.PI/2;add(sword,box,gold,0,0,3,4,.5,.6);add(sword,box,ivory,0,0,8,.7,.35,10);add(sword,geo(new T.ConeGeometry(.5,2.8,4)),ivory,0,0,14).rotation.x=Math.PI/2;
 const star=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.42:1;i?star.lineTo(Math.sin(a)*r,Math.cos(a)*r):star.moveTo(Math.sin(a)*r,Math.cos(a)*r);}star.closePath();
 // Geometry is shared only by real raid targets/projectiles, never a star swarm.
 const starGeometry=geo(new T.ExtrudeGeometry(star,{depth:.16,bevelEnabled:false}));
 function update(m){const p=m.songPerformance||{},g=m.handPose?.action||p.gesture,w=p.weight||0;
  crown.visible=false;crown.scale.setScalar(Math.max(.001,w));
  door.visible=g==='doors'&&w>.05;hinge.rotation.y=-1.75*(p.progress||0)*w;
  path.visible=g==='roads'&&w>.05;sea.visible=g==='sea'&&w>.05;
  horn.visible=false;sword.visible=false;
 }
 return {root,update,starGeometry,stats:()=>({visibleProps:[crown,door,path,sea,horn,sword].filter(o=>o.visible).map(o=>o.name)}),dispose(){root.removeFromParent();crown.removeFromParent();horn.removeFromParent();sword.removeFromParent();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
