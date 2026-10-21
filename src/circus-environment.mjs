import * as THREE from 'three';
import {circusLayout,circusMotion} from './circus-data.mjs';
export function buildCircus(scene,{mobile=false,reduced=false}={}){
 const root=new THREE.Group();root.name='clown-circus';scene.add(root);const cfg=circusLayout(mobile),palette=[0xb92353,0xe6b945,0x226e91,0x61348b,0xded0ab],dummy=new THREE.Object3D(),color=new THREE.Color();
 const mat=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra});
 const mesh=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);root.add(o);return o;};
 const stand=mat(0x462537),gold=mat(0xcc9d4a),dark=mat(0x24162d);
 const ring=mesh(new THREE.RingGeometry(25,35,96).rotateX(-Math.PI/2),dark,0,-.03,0);ring.receiveShadow=true;
 const roofP=[],roofC=[];
 for(let i=0;i<cfg.roofPanels;i++){const a=i/cfg.roofPanels*Math.PI*2,b=(i+1)/cfg.roofPanels*Math.PI*2;roofP.push(0,26,0,Math.sin(a)*34,16,Math.cos(a)*34,Math.sin(b)*34,16,Math.cos(b)*34);color.setHex(i%2?0xd7bf97:0x8a1c48);for(let k=0;k<3;k++)roofC.push(color.r,color.g,color.b);}
 const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(roofP,3));roofGeo.setAttribute('color',new THREE.Float32BufferAttribute(roofC,3));roofGeo.computeVertexNormals();mesh(roofGeo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}),0,0,0);
 for(let row=0;row<(mobile?2:3);row++){const r=27+row*2,o=mesh(new THREE.TorusGeometry(r,.45,6,80),stand,0,.5+row*1.2,0);o.rotation.x=Math.PI/2;}
 const bodies=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.4,.85,6),mat(0xffffff),cfg.crowd.length),heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.23,8,6),mat(0xd5ad88),cfg.crowd.length);
 cfg.crowd.forEach((p,i)=>{dummy.position.set(p.x,p.y+.45,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);bodies.setColorAt(i,color.setHex(palette[p.color]));dummy.position.y+=.62*p.scale;dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);});root.add(bodies,heads);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a)*25.8,z=Math.cos(a)*25.8;mesh(new THREE.CylinderGeometry(.18,.24,15,8),i%2?gold:stand,x,7.5,z);mesh(new THREE.SphereGeometry(.36,8,6),gold,x,15,z);}
 const flags=[],flagGeo=new THREE.ConeGeometry(.8,2.2,3),flagMats=palette.map(c=>mat(c,{side:THREE.DoubleSide}));
 for(let i=0;i<cfg.flags;i++){const a=i/cfg.flags*Math.PI*2,o=mesh(flagGeo,flagMats[i%5],Math.sin(a)*29,12,Math.cos(a)*29);o.rotation.z=Math.PI;flags.push(o);}
 const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,6,5),new THREE.MeshBasicMaterial({color:0xffffff}),cfg.bulbs);
 for(let i=0;i<cfg.bulbs;i++){const a=i/cfg.bulbs*Math.PI*2;dummy.position.set(Math.sin(a)*25.8,13.8+Math.sin(a*6)*.35,Math.cos(a)*25.8);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();bulbs.setMatrixAt(i,dummy.matrix);bulbs.setColorAt(i,color.setHex(i%3?0xffd278:0xef8fa6));}root.add(bulbs);
 const balloonRoot=new THREE.Group();root.add(balloonRoot);const balloonGeo=new THREE.SphereGeometry(.55,10,8),cordGeo=new THREE.CylinderGeometry(.015,.015,2.4,4);
 for(let i=0;i<cfg.balloons;i++){const a=i/cfg.balloons*Math.PI*2,r=26+(i%3)*.4,x=Math.sin(a)*r,z=Math.cos(a)*r,y=6+(i%4)*.55;const o=new THREE.Mesh(balloonGeo,flagMats[i%5]);o.position.set(x,y,z);o.scale.y=1.3;balloonRoot.add(o);const cord=new THREE.Mesh(cordGeo,gold);cord.position.set(x,y-1.6,z);balloonRoot.add(cord);}
 const spots=[],beams=[],down=new THREE.Vector3(0,-1,0),direction=new THREE.Vector3();
 for(let i=0;i<cfg.spotlights;i++){const sign=i?1:-1,l=new THREE.SpotLight(i?0x65a9ff:0xffb76a,mobile?35:50,50,.24,.75,1.2);l.position.set(sign*18,16,5);l.castShadow=false;l.target.position.set(sign*23,.1,0);root.add(l,l.target);spots.push({l,sign});if(!mobile&&!reduced){const geo=new THREE.ConeGeometry(2.5,1,12,1,true).translate(0,-.5,0),beam=mesh(geo,new THREE.MeshBasicMaterial({color:l.color,transparent:true,opacity:.025,depthWrite:false,side:THREE.DoubleSide}),0,0,0);beams.push({beam,l});}}
 return {root,update(time,phase){const p=circusMotion(time,phase,reduced);root.visible=true;balloonRoot.position.y=p.bob;for(let i=0;i<flags.length;i++)flags[i].rotation.z=Math.PI+p.flutter*Math.sin(i*1.7);for(const {l,sign}of spots)l.target.position.set(sign*23*Math.cos(p.sweep),.1,23*Math.sin(p.sweep));for(const {beam,l}of beams){beam.position.copy(l.position);direction.copy(l.target.position).sub(l.position);beam.scale.set(1,direction.length(),1);beam.quaternion.setFromUnitVectors(down,direction.normalize());}},hide(){root.visible=false;}};
}
