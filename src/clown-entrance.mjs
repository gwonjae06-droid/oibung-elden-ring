import * as THREE from 'three';
import {createClownHead} from './clown-head.mjs';

export function buildEntrance(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x100b12);scene.fog=new THREE.Fog(0x100b12,25,65);
 const camera=new THREE.PerspectiveCamera(50,1,.1,100);scene.add(new THREE.HemisphereLight(0xffead2,0x271825,1.2));
 const key=new THREE.DirectionalLight(0xffcf9f,2.8);key.position.set(8,17,12);scene.add(key);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(27,64),new THREE.MeshStandardMaterial({color:0x29212b,roughness:.85}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.RingGeometry(12,12.2,64),new THREE.MeshBasicMaterial({color:0x8d7043,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;scene.add(ring);
 const actor=new THREE.Group();scene.add(actor);
 const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');for(let i=0;i<16;i++){ctx.fillStyle=i%2?'#dfcfad':'#a61c33';ctx.fillRect(i*16,0,16,128);}ctx.fillStyle='#d4a83b';ctx.fillRect(0,56,256,16);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const ball=new THREE.Mesh(new THREE.SphereGeometry(2.6,48,32),new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:.1}));ball.position.y=2.6;actor.add(ball);
 const costume=new THREE.Group();actor.add(costume);
 const red=new THREE.MeshStandardMaterial({color:0x981d38,roughness:.72}),ivory=new THREE.MeshStandardMaterial({color:0xe8d5ad,roughness:.8}),black=new THREE.MeshStandardMaterial({color:0x16101a,roughness:.6});
 const mesh=(geo,mat,x,y,z,parent=costume)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 mesh(new THREE.SphereGeometry(1.05,24,18),red,0,7.25,0).scale.set(1,1.2,.75);
 mesh(new THREE.SphereGeometry(.65,18,12),red,0,6.45,0).scale.set(1,.6,.9);
 for(const s of[-1,1]){mesh(new THREE.CylinderGeometry(.24,.3,1.3,10),s<0?ivory:red,s*.45,5.85,0);mesh(new THREE.SphereGeometry(.26,12,10),s<0?ivory:red,s*.45,5.85,.07);mesh(new THREE.SphereGeometry(.4,16,12),black,s*.55,5.3,.3).scale.set(1.3,.55,1.7);}
 const arms=[];for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.8,7.7,0);costume.add(a);const sleeve=mesh(new THREE.CylinderGeometry(.23,.3,1.5,12),s<0?red:ivory,s*.65,-.15,0,a);sleeve.rotation.z=s*Math.PI/2;mesh(new THREE.SphereGeometry(.26,12,10),s<0?red:ivory,s*.7,-.15,0,a);mesh(new THREE.SphereGeometry(.4,16,12),ivory,s*1.4,-.15,0,a);arms.push(a);}
 mesh(new THREE.CylinderGeometry(.23,.28,.7,16),ivory,0,8.7,0);
 const head=createClownHead();head.group.position.set(0,9.9,0);costume.add(head.group);
 const collar=mesh(new THREE.TorusGeometry(.72,.19,8,24),ivory,0,8.3,0);collar.rotation.x=Math.PI/2;
 costume.position.y=5.2;for(const child of costume.children)child.position.y-=5.2;
 let width=0,height=0;
 function render(p,t){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}actor.position.x=(1-p.entry)*15;actor.position.z=-2;ball.rotation.z=-actor.position.x/2.6;costume.rotation.z=Math.sin(t*2.8)*.04*(1-p.entry);costume.rotation.x=p.bow*.65;arms[0].rotation.z=(-.25-Math.sin(t*2)*.12)*(1-p.bow)+p.bow*.7;arms[1].rotation.z=(.3+Math.sin(t*3)*.18)*(1-p.bow)-p.bow*.7;head.group.rotation.x=p.bow*.1;head.setPose(p.stage==='bow'?'idle':p.entry<.95?'idle':'laugh',(t*.3)%1,t);camera.position.set(7-3*p.entry,8.5,23-4*p.entry);camera.lookAt(1,6.2,-2);renderer.render(scene,camera);}
 function dispose(){const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){ms.add(m);if(m.map)ts.add(m.map);}});for(const g of gs)g.dispose();for(const m of ms)m.dispose();for(const t of ts)t.dispose();renderer.dispose();}
 return {render,dispose};
}
