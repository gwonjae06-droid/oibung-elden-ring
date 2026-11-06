import * as THREE from 'three';
export function createGyuwonActor(stage){
 const root=new THREE.Group();root.name='gyuwon-student';stage.add(root);
 const cloth=new THREE.MeshStandardMaterial({color:0xd7dce3,roughness:.9}),pants=new THREE.MeshStandardMaterial({color:0x202b41}),skin=new THREE.MeshStandardMaterial({color:0xcab397}),hair=new THREE.MeshStandardMaterial({color:0x181e29});
 const mesh=(parent,geo,material,x,y,z)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 mesh(root,new THREE.CylinderGeometry(.55,.68,1.55,12),cloth,0,1.95,0);
 for(const x of [-.32,.32]){mesh(root,new THREE.CylinderGeometry(.22,.18,1.1,8),pants,x,.65,0);const foot=mesh(root,new THREE.SphereGeometry(.25,8,6),hair,x,.15,.15);foot.scale.z=1.6;}
 const bodyMaterials=[cloth,pants,skin,hair],originalColors=bodyMaterials.map(m=>m.color.clone()),goldColor=new THREE.Color(0xffd56d);
 const arms=[];for(const side of [-1,1]){const joint=new THREE.Group();joint.position.set(side*.64,2.55,0);root.add(joint);mesh(joint,new THREE.CylinderGeometry(.19,.15,1.2,8),cloth,side*.12,-.5,0);mesh(joint,new THREE.SphereGeometry(.17,8,6),skin,side*.12,-1.15,0);arms.push(joint);}
 const head=new THREE.Group();head.name='gyuwon-head';head.position.y=3.15;root.add(head);const face=mesh(head,new THREE.SphereGeometry(.5,16,12),skin,0,0,0);face.scale.set(.88,1.15,.9);mesh(head,new THREE.SphereGeometry(.51,16,8,0,Math.PI*2,0,Math.PI*.55),hair,0,.1,-.03);
 for(const x of [-.17,.17]){mesh(head,new THREE.BoxGeometry(.12,.04,.025),hair,x,.03,.44);mesh(head,new THREE.BoxGeometry(.17,.025,.025),hair,x,-.06,.43);}
 const book=new THREE.Group();arms[0].add(book);book.position.set(-.1,-1,.35);book.rotation.x=-.6;mesh(book,new THREE.BoxGeometry(.7,.1,.9),new THREE.MeshStandardMaterial({color:0x243947}),0,0,0);mesh(book,new THREE.BoxGeometry(.64,.08,.83),cloth,0,.07,0);
 const halo=mesh(root,new THREE.TorusGeometry(.7,.035,8,64),new THREE.MeshBasicMaterial({color:0xffd56d}),0,3.45,0);
 const pages=[];for(let i=0;i<6;i++){const page=mesh(root,new THREE.PlaneGeometry(.45,.65),new THREE.MeshBasicMaterial({color:0xf9dd97,side:THREE.DoubleSide,transparent:true,opacity:.65}),0,0,0);pages.push(page);}
 return {root,update(g,death){const s=g.gyuwon,b=g.boss;bodyMaterials.forEach((m,i)=>m.color.copy(originalColors[i]).lerp(goldColor,g.status==='won'?Math.min(1,death/2):0));const transition=b.state==='transition';root.position.set(b.x,g.status==='won'?death*death*1.5:0,b.z);root.rotation.y=Math.atan2(g.player.x-b.x,g.player.z-b.z);root.scale.setScalar(g.status==='won'?Math.max(.03,1-death/9):1);head.scale.setScalar(b.phase===1?1:b.phase===2&&transition?Math.max(.001,1-s.t/3):.001);head.visible=head.scale.x>.01;halo.visible=b.phase>1;halo.rotation.z=g.time*.3;arms[1].rotation.x=b.state==='pattern'?-.9-Math.sin(s.t*2)*.3:0;arms[0].rotation.x=-.5;for(let i=0;i<pages.length;i++){const p=pages[i],a=g.time*.6+i*Math.PI/3;p.visible=b.phase>1;p.position.set(Math.sin(a)*1.6,2+Math.sin(a*2)*.4,Math.cos(a)*1.6);p.rotation.set(.3,a,.2);}}};
}
