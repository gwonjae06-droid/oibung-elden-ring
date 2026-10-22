export const DICE_ARMOR_STYLE=Object.freeze({black:0x090a0e,red:0x650d19,gold:0xdba632});
export function diceArmorPlan(edge){
 if(!Number.isFinite(edge)||edge<=0)throw new RangeError('Invalid edge');
 const h=edge/2,thickness=edge*.055,cap=edge*.105,beams=[],caps=[],panels=[];
 for(let axis=0;axis<3;axis++){
  const keys=[0,1,2].filter(k=>k!==axis);
  for(const a of [-1,1])for(const b of [-1,1]){
   const position=[0,0,0],size=[thickness,thickness,thickness];
   position[keys[0]]=a*h;position[keys[1]]=b*h;size[axis]=edge;
   beams.push({position,size});
  }
  for(const sign of [-1,1]){
   if(axis===0&&sign===1)continue;
   const inner=edge*.34,outer=edge*.45,width=outer-inner;
   for(const side of [-1,1])for(let k=0;k<2;k++){
    const position=[0,0,0],size=[.004,.004,.004];
    position[axis]=sign*(h+.002);position[keys[k]]=side*(inner+width/2);
    size[keys[k]]=width;size[keys[1-k]]=outer*2;
    panels.push({position,size});
   }
  }
 }
 for(const x of [-h,h])for(const y of [-h,h])for(const z of [-h,h])caps.push({position:[x,y,z],size:[cap,cap,cap]});
 return {beams,caps,panels};
}
export function buildDiceArmor(THREE,root,edge){
 const plan=diceArmorPlan(edge),geometry=new THREE.BoxGeometry(1,1,1);
 const gold=new THREE.MeshStandardMaterial({color:DICE_ARMOR_STYLE.gold,metalness:.88,roughness:.3});
 const red=new THREE.MeshStandardMaterial({color:DICE_ARMOR_STYLE.red,metalness:.5,roughness:.42,emissive:0x240005,emissiveIntensity:.25});
 function add(parts,material,name){for(const p of parts){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...p.position);m.scale.set(...p.size);m.castShadow=m.receiveShadow=true;root.add(m);}}
 add(plan.panels,red,'dice-crimson-inlay');add(plan.beams,gold,'dice-solid-gold-edge');add(plan.caps,gold,'dice-gold-corner-cap');
 return {plan};
}
