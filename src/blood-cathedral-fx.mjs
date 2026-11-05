import * as THREE from 'three';

// Small illuminated particles and sconces complement the volumetric architectural
// light shafts. No flat rectangle beams are placed in front of the camera.
export function createCathedralFx(parent,fluid,quality,{reduced=false}={}){
 const mobile=quality.segments<16;
 const glowMat=new THREE.MeshBasicMaterial({color:0xffd8a5,transparent:true,opacity:.43,depthWrite:false,blending:THREE.AdditiveBlending});
 const flameGeo=new THREE.SphereGeometry(.14,6,5),flames=[];
 for(const side of [-1,1])for(let i=0;i<6;i++){
  const flame=new THREE.Mesh(flameGeo,glowMat);
  flame.position.set(side*30.6,4.2,-30+i*12);parent.add(flame);flames.push(flame);
 }
 // Fixed-size dust buffer: 1 tiny draw call, deterministic drift, no new
 // geometry or particles allocated during gameplay or the 2nd-phase cutscene.
 const dustCount=mobile?90:250,positions=new Float32Array(dustCount*3),base=new Float32Array(dustCount*3),colors=new Float32Array(dustCount*3);
 const color=new THREE.Color(),gold=new THREE.Color(0xffedc9),silver=new THREE.Color(0xe3f0f4);
 const random=n=>{const x=Math.sin(n*127.1+4.78)*43758.5453;return x-Math.floor(x);};
 for(let i=0;i<dustCount;i++){
  const k=i*3,r=5+Math.sqrt(random(i*3+1))*27,ang=random(i*7+2)*Math.PI*2;
  const x=Math.sin(ang)*r,y=2+random(i*11+3)*27,z=Math.cos(ang)*r;
  base[k]=positions[k]=x;base[k+1]=positions[k+1]=y;base[k+2]=positions[k+2]=z;
  color.copy(gold).lerp(silver,random(i*13+4)*.48);
  colors[k]=color.r;colors[k+1]=color.g;colors[k+2]=color.b;
 }
 const dustGeo=new THREE.BufferGeometry();
 dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 dustGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const dustMat=new THREE.PointsMaterial({color:0xffffff,vertexColors:true,size:mobile?.065:.095,sizeAttenuation:true,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending});
 const dust=new THREE.Points(dustGeo,dustMat);dust.frustumCulled=false;parent.add(dust);
 const capacity=mobile?quality.drops/3:quality.drops/2;
 const rain=new THREE.InstancedMesh(fluid.sphere,fluid.material,Math.floor(capacity));
 rain.count=0;rain.frustumCulled=false;parent.add(rain);
 const dummy=new THREE.Object3D();
 let rainTime=0;
 function update(g,c,dt){
  const timestep=Math.max(0,Number.isFinite(dt)?dt:0);
  rainTime+=timestep*(c.active?.12:1);
  const dead=g.status==='won',phase=g.boss.phase,pattern=g.boss.state==='pattern'?g.blood.pattern:null;
  const eclipse=pattern==='eclipse',pulse=reduced?0:Math.sin(g.time*(phase===2?7:3.2));
  flames.forEach((f,i)=>{
   f.visible=!dead&&!(phase===2&&i%3===0);
   f.scale.set(1,(reduced?1:1+Math.sin(g.time*5+i*2)*.1)*(1-c.darkness*.8),1);
  });
  glowMat.opacity=(phase===2?.28:.43)*(1-c.darkness*.8);
  dustMat.opacity=(dead?.18:phase===2?.35:.53)*(1-c.darkness*.8);
  if(timestep>0&&!reduced){
   for(let i=0;i<dustCount;i++){
    const k=i*3,t=g.time;
    positions[k]=base[k]+Math.sin(t*.19+i*3.12)*.39;
    positions[k+1]=base[k+1]+Math.sin(t*.34+i*.81)*.28;
    positions[k+2]=base[k+2]+Math.cos(t*.22+i*1.43)*.36;
   }
   dustGeo.attributes.position.needsUpdate=true;
  }
  rain.count=dead?0:phase===2?rain.instanceMatrix.count:Math.floor(rain.instanceMatrix.count*.4);
  for(let i=0;i<rain.count;i++){
   const a=i*2.399,r=19+(i%11),speed=phase===2?5.5:2.2;
   const y=22-((rainTime*speed+i*.83)%22);
   dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);
   dummy.scale.set(.045,.13+(i%4)*.04,.045);dummy.updateMatrix();rain.setMatrixAt(i,dummy.matrix);
  }
  rain.instanceMatrix.needsUpdate=true;
  return {pulse,light:dead?.15:eclipse?.35:(phase===2?.86:1)*(1-c.darkness*.72)+c.bell*.25,red:phase===2?1.35:.5};
 }
 return {update,dispose(){rain.dispose();}};
}
