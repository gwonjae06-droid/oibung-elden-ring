import * as THREE from 'three';

export function createCathedralFx(parent,fluid,quality,{reduced=false}={}){
 const glowMat=new THREE.MeshBasicMaterial({color:0xffbd85,transparent:true,opacity:.65,depthWrite:false}),beamMat=new THREE.MeshBasicMaterial({color:0x9c1636,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide});
 const flames=[],beams=[];const flameGeo=new THREE.SphereGeometry(.16,6,5),beamGeo=new THREE.PlaneGeometry(4,20);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a)*28,z=Math.cos(a)*28;const f=new THREE.Mesh(flameGeo,glowMat);f.position.set(x,2.25,z);parent.add(f);flames.push(f);
  if(i%2===0){const beam=new THREE.Mesh(beamGeo,beamMat);beam.position.set(x*.6,8,z*.6);beam.rotation.set(-.35,a,0);parent.add(beam);beams.push(beam);}
 }
 const rain=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.low?20:quality.drops/2),dummy=new THREE.Object3D();rain.frustumCulled=false;parent.add(rain);
 const dustGeo=new THREE.BufferGeometry(),points=[];for(let i=0;i<(quality.low?24:80);i++)points.push(Math.sin(i*2.4)*26,2+i%17,Math.cos(i*1.7)*26);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xe2aab2,size:.055,transparent:true,opacity:.24,depthWrite:false}));parent.add(dust);
 function update(g,c){
  const dead=g.status==='won',phase=g.boss.phase,pattern=g.boss.state==='pattern'?g.blood.pattern:null,eclipse=pattern==='eclipse',pulse=reduced?0:Math.sin(g.time*(phase===2?7:3.2));
  flames.forEach((f,i)=>{f.visible=!dead&&!(phase===2&&i%3===0);f.scale.set(1,(reduced?1:1+Math.sin(g.time*8+i)*.14)*(1-c.darkness*.8),1);});
  beamMat.opacity=dead?.01:eclipse?.018:(phase===2?.085:.035)*(1-c.darkness*.9)+c.bell*.025;
  glowMat.opacity=.6*(1-c.darkness*.8);dust.rotation.y=reduced?0:g.time*.012;
  rain.count=dead?0:phase===2?rain.instanceMatrix.count:Math.floor(rain.instanceMatrix.count*.4);
  const time=c.active?g.time*.12:g.time;
  for(let i=0;i<rain.count;i++){const a=i*2.399,r=19+(i%11),speed=phase===2?5.5:2.2,y=22-((time*speed+i*.83)%22);dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);dummy.scale.set(.045,.13+(i%4)*.04,.045);dummy.updateMatrix();rain.setMatrixAt(i,dummy.matrix);}rain.instanceMatrix.needsUpdate=true;
  return {pulse,light:dead?.15:eclipse?.35:(phase===2?.8:1)*(1-c.darkness*.78)+c.bell*.25,red:phase===2?1.35: .5};
 }
 return {update};
}
