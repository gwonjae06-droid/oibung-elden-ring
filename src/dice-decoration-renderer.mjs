import {diceDecorations,dicePortraitUv} from './dice-decoration-data.mjs';
export function buildDiceDecorations(THREE,root,edge,style){
 const portrait=new THREE.MeshStandardMaterial({color:0xffdfb3,roughness:.55,metalness:0}),ember=new THREE.MeshStandardMaterial({color:style.ember,emissive:style.emissive,emissiveIntensity:1.5,roughness:.4});
 const sphere=new THREE.SphereGeometry(1,24,16),cone=new THREE.ConeGeometry(1,1,10),pos=sphere.attributes.position,uv=sphere.attributes.uv;
 for(let i=0;i<pos.count;i++)uv.setXY(i,...dicePortraitUv(pos.getX(i),pos.getY(i),1));uv.needsUpdate=true;
 for(const plan of diceDecorations(edge)){const face=new THREE.Group(),normal=new THREE.Vector3(...plan.normal);face.name='dice-decoration-face-'+plan.face;face.position.copy(normal).multiplyScalar(edge/2);face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);root.add(face);
 for(const [x,y]of plan.points){const pip=new THREE.Mesh(sphere,portrait);pip.name='sungwon-face-pip';pip.position.set(x,y,plan.offset);pip.scale.set(plan.radius,plan.radius,plan.depth);pip.castShadow=pip.receiveShadow=true;face.add(pip);}
 for(const [x,y]of plan.spikes){const spike=new THREE.Mesh(cone,ember);spike.name='dice-face-spike';spike.position.set(x,y,plan.spikeHeight/2);spike.rotation.x=Math.PI/2;spike.scale.set(plan.spikeRadius,plan.spikeHeight,plan.spikeRadius);spike.castShadow=true;face.add(spike);}}
 return {setTexture(texture){portrait.map=texture;portrait.color.setHex(0xffffff);portrait.needsUpdate=true;},update(time=0){ember.emissiveIntensity=1.4+.3*Math.sin((Number.isFinite(time)?time:0)*6);}};
}
