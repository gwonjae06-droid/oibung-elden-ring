import * as T from 'three';

// One tangible pair, hinged into the performer's back. No star cloud, orbit,
// expanding rings or translucent full-screen wash accompanies the word flight.
export function createActFiveWings(back,{coarse=false}={}){
 const root=new T.Group();root.name='act-five-literal-back-wings';root.visible=false;back.add(root);
 const ivory=new T.MeshStandardMaterial({color:0xe3dfcc,roughness:.78,side:T.DoubleSide}),blue=new T.MeshStandardMaterial({color:0x456884,roughness:.84,side:T.DoubleSide});
 const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(2,-1.2,7.6,-1.5,10,-.3);shape.bezierCurveTo(8.2,.9,3.4,1.5,0,0);
 const feather=new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelThickness:.09,bevelSize:.1,bevelSegments:coarse?1:2,curveSegments:coarse?7:12});
 const bone=new T.CapsuleGeometry(.42,7,4,coarse?8:12).rotateZ(Math.PI/2);
 const instances=[],dummy=new T.Object3D();
 const wings=[-1,1].map(side=>{
  const hinge=new T.Group();hinge.position.set(side*4.8,13,-3.5);hinge.scale.x=side;root.add(hinge);
  const upper=new T.Mesh(bone,blue);upper.position.x=3.6;hinge.add(upper);
  const tip=new T.Group();tip.position.set(7,0,0);hinge.add(tip);
  for(const colored of [false,true]){
   const indices=Array.from({length:9},(_,i)=>i).filter(i=>(i%3===0)===colored);
   const feathers=new T.InstancedMesh(feather,colored?blue:ivory,indices.length);feathers.name='giant-wing-primary-feathers';feathers.castShadow=!coarse;tip.add(feathers);instances.push(feathers);
   indices.forEach((i,n)=>{dummy.position.set(i*.92,i*.40,-.12*i);dummy.rotation.set(0,0,.08+i*.1);dummy.scale.set(1.12-i*.045,.95,1);dummy.updateMatrix();feathers.setMatrixAt(n,dummy.matrix);});feathers.instanceMatrix.needsUpdate=true;
  }
  const secondaries=new T.InstancedMesh(feather,ivory,6);secondaries.name='giant-wing-secondary-feathers';hinge.add(secondaries);instances.push(secondaries);
  for(let i=0;i<6;i++){dummy.position.set(i*1.15,-.7,-.1);dummy.rotation.set(0,0,-.8);dummy.scale.set(.65,.75,1);dummy.updateMatrix();secondaries.setMatrixAt(i,dummy.matrix);}secondaries.instanceMatrix.needsUpdate=true;
  return {hinge,tip,side};
 });
 let weight=0,disposed=false;
 function update(m,dt){if(disposed)return;const p=m.songPerformance||{},wanted=p.gesture==='flight'&&!p.instrumental?p.weight:0;
  if(dt>0)weight+=(wanted-weight)*(1-Math.exp(-Math.min(.05,dt)*10));
  root.visible=weight>.015;
  const flap=Math.sin(m.time*Math.PI*(m.bpm||136)/60);
  wings.forEach(({hinge,tip,side})=>{const scale=Math.max(.001,weight*1.3);hinge.scale.set(side*scale,scale,scale);hinge.rotation.set(.08,-side*(.10+.04*flap),side*(.05+.22*flap));tip.rotation.z=.10+.16*flap;});
 }
 return {root,update,stats:()=>({visible:root.visible,pairs:1,weight,feathers:30,drawCalls:8}),dispose(){if(disposed)return;disposed=true;root.removeFromParent();instances.forEach(o=>o.dispose());feather.dispose();bone.dispose();ivory.dispose();blue.dispose();}};
}
