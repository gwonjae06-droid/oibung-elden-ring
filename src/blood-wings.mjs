import * as THREE from 'three';
import {smooth} from './blood-transformation.mjs';

// Closed, curved membrane strips have two skins and a stitched edge, with real thickness.
function membrane(length,lift,segments){
 const vertices=[],indices=[],cols=segments,rows=5,stride=(cols+1)*(rows+1);
 for(let skin=0;skin<2;skin++)for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
  const u=x/cols,v=y/rows,span=Math.sin(u*Math.PI)*.8+.15;
  vertices.push(u*length,Math.sin(u*Math.PI*.75)*lift+(v-.5)*span*1.7,Math.sin(u*Math.PI)*.8+(v-.5)*(v-.5)*.55+(skin?-.065:.065));
 }
 for(let skin=0;skin<2;skin++)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const a=skin*stride+y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
  if(skin)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);
 }
 for(let x=0;x<cols;x++)for(const y of [0,rows]){const a=y*(cols+1)+x,b=a+1;indices.push(a,a+stride,b,b,a+stride,b+stride);}
 for(let y=0;y<rows;y++)for(const x of [0,cols]){const a=y*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+stride,b,b+stride,a+stride);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function createBloodWings(parent,fluid,quality,{reduced=false}={}){
 const sides=[],veins=[];
 const veinMaterial=fluid.material.clone();veinMaterial.color.setHex(0x9e1532);veinMaterial.emissive.setHex(0x6b1028);veinMaterial.emissiveIntensity=.65;
 for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(side*.7,3.3,-.35);pivot.scale.x=side;parent.add(pivot);const ribs=[];
  for(let i=0;i<quality.wingRibs;i++){
   const bone=new THREE.Group();bone.rotation.z=.6-i*.23;pivot.add(bone);const length=6.8-i*.55,lift=2.6-i*.12;
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(length*.3,lift*.7,.6),new THREE.Vector3(length*.7,lift,.7),new THREE.Vector3(length,lift*.72,.1)]);
   const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,quality.segments,.1-i*.007,5,false),veinMaterial);bone.add(rib);
   const tip=new THREE.Mesh(fluid.sphere,fluid.material);tip.position.set(length,lift*.72,.1);tip.scale.setScalar(.1);bone.add(tip);
   const skin=new THREE.Mesh(membrane(length,lift,quality.segments),fluid.material);bone.add(skin);ribs.push({bone,rib,skin,tip,length});veins.push(rib);
  }
  sides.push({pivot,ribs,side});
 }
 let previousYaw=0,inertia=0;
 function update(g,c,dt){
  const moving=g.boss.state==='pattern',d=Math.atan2(Math.sin(g.boss.yaw-previousYaw),Math.cos(g.boss.yaw-previousYaw));previousYaw=g.boss.yaw;
  inertia+=(Math.max(-.4,Math.min(.4,-d*3))-inertia)*(1-Math.exp(-dt*7));
  const flap=reduced?0:Math.sin(g.time*(moving?3.7:1.8))*.1,fold=g.blood.pattern==='dive'&&moving?smooth(.9,1.5,g.blood.t)*(1-smooth(1.6,2,g.blood.t)):0;
  for(const {pivot,ribs,side}of sides){pivot.visible=c.bones>0;pivot.rotation.y=side*(.16+flap+fold*.9)+inertia;
   for(let i=0;i<ribs.length;i++){const {bone,rib,skin,tip,length}=ribs[i],delay=i*.055,birth=c.active?smooth(1.8+delay,2.9+delay,c.t):c.bones,mem=c.active?smooth(2.6+delay,3.55+delay,c.t):c.membrane;
    rib.scale.setScalar(Math.max(.001,birth));skin.scale.set(Math.max(.001,mem),Math.max(.001,mem),1);skin.visible=mem>0;
    bone.rotation.y=reduced?0:Math.sin(g.time*2.3-i*.55)*(.04+i*.009)+inertia*(i+1)*.2;
    bone.rotation.x=reduced?0:Math.sin(g.time*1.8-i*.45)*.035;
    tip.visible=mem>.9;tip.position.x=length+(reduced?0:Math.sin(g.time*3-i)*.09);tip.scale.set(.09,.12+(reduced?0:Math.sin(g.time*4+i)*.035),.09);
   }
  }
 }
 return {update,sides,veins};
}
