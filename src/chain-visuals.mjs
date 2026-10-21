import * as THREE from 'three';
import {createClownHead} from './clown-head.mjs';
import {chainRevealPose,chainLinkPose} from './chain-reveal-data.mjs';
export function createChainVisuals(layer,{mobile=false,reduced=false,count=48}={}){
 const canvas=layer.ownerDocument.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:3;filter:drop-shadow(4px 7px 5px #000b);pointer-events:none';
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:'low-power'});}catch(error){console.warn('3D chain renderer unavailable',error);return null;}
 layer.appendChild(canvas);renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,mobile?1:1.5));renderer.setClearColor(0,0);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);camera.position.z=100;
 scene.add(new THREE.HemisphereLight(0x9aa4b7,0x08090c,1));const key=new THREE.DirectionalLight(0xc4ccd8,3);key.position.set(-80,120,100);scene.add(key);const rim=new THREE.DirectionalLight(0x555f75,2);rim.position.set(100,-30,50);scene.add(rim);
 const links=mobile?28:36,geo=new THREE.TorusGeometry(1,.32,6,mobile?10:14),mat=new THREE.MeshStandardMaterial({color:0x171a20,metalness:.72,roughness:.38}),mesh=new THREE.InstancedMesh(geo,mat,count*links);mesh.frustumCulled=false;scene.add(mesh);
 const head=createClownHead();scene.add(head.group);const box=new THREE.Box3().setFromObject(head.group),size=new THREE.Vector3();box.getSize(size);const headSize=Math.max(size.x,size.y,size.z,1),dummy=new THREE.Object3D();let w=0,h=0,disposed=false;
 head.ready.then(()=>{if(disposed)head.dispose();});
 function update(bindPose,pull,width,height){if(disposed)return;if(width!==w||height!==h){w=width;h=height;renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
 const r=chainRevealPose(pull);head.group.visible=r.headOpacity>0;head.group.position.set(0,h*(.5-r.y),-6);head.group.rotation.set(0,reduced?0:(1-r.gather)*-.3,0);head.group.scale.setScalar(Math.min(w,h)*.62/headSize);head.group.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.transparent=true;m.opacity=r.headOpacity;}});
 for(let i=0;i<count;i++)for(let j=0;j<links;j++){const p=chainLinkPose(i,j,count,links,w,h,bindPose.reach,bindPose.tension,pull,reduced);dummy.position.set(p.x-w/2,h/2-p.y,p.z);dummy.rotation.set(0,p.turn,0);dummy.scale.set(p.rx,p.ry,9);dummy.updateMatrix();mesh.setMatrixAt(i*links+j,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.visible=bindPose.reach>0&&pull<1;renderer.render(scene,camera);
 }
 function dispose(){if(disposed)return;disposed=true;head.dispose();geo.dispose();mat.dispose();renderer.dispose();canvas.remove();}
 return {update,dispose};
}
