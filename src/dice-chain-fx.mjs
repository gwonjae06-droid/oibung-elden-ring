import {CHAIN_SWEEP,chainLane,chainBand} from './dice-chain-sweep.mjs';
export function buildChainSweepVisuals(THREE,root){
 const group=new THREE.Group();group.name='dice-golden-chain-sweep';group.visible=false;root.add(group);
 const red=new THREE.MeshBasicMaterial({color:0xdb1531,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide});
 const lane=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),red);group.add(lane);
 const chain=new THREE.Group();group.add(chain);
 const gold=new THREE.MeshStandardMaterial({color:0xe5b53b,metalness:.85,roughness:.3,emissive:0x820d20,emissiveIntensity:.4});
 const geometry=new THREE.TorusGeometry(.45,.11,5,10),links=[],count=84;
 for(const side of [-1,1])for(let i=0;i<count;i++){
   const link=new THREE.Mesh(geometry,gold);link.name='dice-chain-link';link.rotation.x=i%2?Math.PI/2:0;
   chain.add(link);links.push({link,i,side});
 }
 return {update(g){
   const w=g.dice.groundSpikes;
   group.visible=g.status==='playing'&&w?.kind==='chain-sweep';if(!group.visible)return;
   const area=chainLane(w.plan),band=chainBand(w.plan,w.stage==='warning'?0:Math.min(1,w.t/CHAIN_SWEEP.sweepTime));
   lane.position.set(area.cx,.12,area.cz);lane.scale.set(area.halfX*2,1,area.halfZ*2);
   const time=Number.isFinite(g.time)?g.time:0;
   red.opacity=w.stage==='warning'?.28+.12*(.5+.5*Math.sin(time*12)):.15;
   chain.position.set(band.cx,0,band.cz);chain.rotation.y=w.plan.axis==='x'?0:Math.PI/2;
   const spacing=w.plan.limit*2/count;
   gold.emissiveIntensity=w.stage==='warning'?.25+.2*(.5+.5*Math.sin(time*15)):.7;
   for(const {link,i,side}of links){link.position.set(-w.plan.limit+(i+.5)*spacing,.75,side*.65);link.scale.set(spacing/.85,1,1);}
 }};
}
