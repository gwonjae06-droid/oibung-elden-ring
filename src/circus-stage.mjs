import * as THREE from 'three';
export function buildCircusStage(root,{mobile=false,reduced=false}={}){
 const group=new THREE.Group();group.name='circus-velvet-stage';group.userData.decorativeOnly=true;root.add(group);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=mobile?256:512;const c=canvas.getContext('2d'),s=canvas.width;
 c.fillStyle='#29232f';c.fillRect(0,0,s,s);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;c.beginPath();c.moveTo(s/2,s/2);c.arc(s/2,s/2,s*.71,a,a+Math.PI/8);c.closePath();c.fillStyle=i%2?'#352934':'#302735';c.fill();}
 for(let i=1;i<=8;i++){c.beginPath();c.arc(s/2,s/2,s*i/16,0,Math.PI*2);c.strokeStyle=i===8?'#947747':'#554353';c.lineWidth=i===8?3:1;c.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const carpet=new THREE.Mesh(new THREE.CircleGeometry(22.6,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:texture,roughness:1}));carpet.position.y=.008;carpet.receiveShadow=true;group.add(carpet);
 const velvet=new THREE.MeshStandardMaterial({color:0x461b35,roughness:1}),trim=new THREE.MeshStandardMaterial({color:0x9d7946,metalness:.45,roughness:.6}),stone=new THREE.MeshStandardMaterial({color:0x231d2b,roughness:1});
 const geo=new THREE.BoxGeometry(1,1,1),n=mobile?24:48,curtains=new THREE.InstancedMesh(geo,velvet,n),dummy=new THREE.Object3D();
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2;dummy.position.set(Math.sin(a)*32,7,Math.cos(a)*32);dummy.rotation.set(0,a,0);dummy.scale.set(mobile?7:3.8,14,1+(i%2)*.5);dummy.updateMatrix();curtains.setMatrixAt(i,dummy.matrix);}curtains.instanceMatrix.needsUpdate=true;group.add(curtains);
 const arch=new THREE.Group();arch.position.set(0,0,-30);group.add(arch);
 function block(mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);arch.add(m);return m;}
 for(const side of [-1,1]){block(stone,side*7.2,6,0,1.6,12,2);block(trim,side*7.2,12,0,2,.3,2.4);block(velvet,side*5.7,6,.2,1.6,11.6,.8);}block(trim,0,12.5,0,16,.4,2);block(velvet,0,11.5,.3,13,1.4,.8);
 const positions=new Float32Array((mobile?32:80)*3);for(let i=0;i<positions.length/3;i++){const a=i*2.399963,r=25+(i%7);positions[i*3]=Math.sin(a)*r;positions[i*3+1]=2+(i%13)*.65;positions[i*3+2]=Math.cos(a)*r;}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd2b98b,size:.055,transparent:true,opacity:.22,depthWrite:false}));group.add(dust);
 const glowMat=new THREE.MeshBasicMaterial({color:0xc69a58}),emblems=new THREE.InstancedMesh(new THREE.SphereGeometry(.12,6,4),glowMat,24);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;dummy.position.set(Math.sin(a)*25.5,1.1,Math.cos(a)*25.5);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();emblems.setMatrixAt(i,dummy.matrix);}group.add(emblems);
 const scene=root.parent,background=scene?.background?.isColor?scene.background.clone():null,fogColor=scene?.fog?.color.clone(),warm=new THREE.Color(0x130e1b),cold=new THREE.Color(0x281322),velvetTarget=new THREE.Color(),glowTarget=new THREE.Color();let lastTime=null;
 return {update(time,phase){const t=Number.isFinite(time)?time:0,dt=lastTime===null?1/60:Math.max(0,Math.min(.05,t-lastTime));lastTime=t;const k=1-Math.exp(-dt*2),second=phase===2;
 if(scene?.background?.isColor)scene.background.lerp(second?cold:warm,k);if(scene?.fog?.color)scene.fog.color.lerp(second?cold:warm,k);
 velvet.color.lerp(velvetTarget.setHex(second?0x562038:0x461b35),k);glowMat.color.lerp(glowTarget.setHex(second?0xd88c9c:0xc69a58),k);dust.rotation.y=reduced?0:t*.008;
 },hide(){lastTime=null;if(background&&scene?.background?.isColor)scene.background.copy(background);if(fogColor&&scene?.fog?.color)scene.fog.color.copy(fogColor);}};
}
