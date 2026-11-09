import * as T from 'three';
import {gyuwonRunnerBridgeAt} from './gyuwon-runner-director.mjs';
// A visible, continuous set transformation. The old 3D stage remains under
// the opening painted VI road: nothing in this group owns a hit collider.
export function createGyuwonFiveSixBridge(parent,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-five-six-physical-stage-metamorphosis';root.visible=false;parent.add(root);
 const geos=new Set(),mats=new Set();
 const geometry=g=>(geos.add(g),g),material=(c,opts={})=>{const m=new T.MeshStandardMaterial({color:c,roughness:.62,...opts});mats.add(m);return m;};
 const gold=material(0xe0b766,{metalness:.55,emissive:0x9c5a23,emissiveIntensity:.3});
 const grass=material(0x8ebd80,{emissive:0x244c2a,emissiveIntensity:.12});
 const paper=material(0xf7e9bd,{side:T.DoubleSide});
 const sky=material(0x9edfeb,{transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide,emissive:0x276173,emissiveIntensity:.5});
 const brown=material(0x7a5540);
 const box=geometry(new T.BoxGeometry(1,1,1)),torus=geometry(new T.TorusGeometry(1,.13,coarse?6:10,coarse?28:48));
 const ball=geometry(new T.IcosahedronGeometry(1,1));
 const add=(p,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;p.add(o);return o;};
 const gate=new T.Group();gate.name='gyuwon-five-six-open-meadow-gate';gate.position.set(0,10,-22);root.add(gate);
 const rim=add(gate,torus,gold,'runner-gate-gold-arch');rim.scale.set(10,11,10);
 const inner=add(gate,torus,sky,'runner-gate-glowing-exit');inner.scale.set(8.5,9.3,8.5);
 const threshold=add(gate,box,paper,'runner-gate-bright-sill');threshold.position.y=-10;threshold.scale.set(18,.45,2);
 const skyDisk=add(gate,geometry(new T.PlaneGeometry(18,18,1,1)),sky,'runner-gate-visible-world');skyDisk.position.z=-.4;
 const roads=[];
 for(let i=0;i<14;i++){
  const panel=add(root,box,i%3?grass:gold,'runner-stage-becoming-meadow-road');
  panel.position.set(0,.2,24-i*3.7);panel.scale.set(9,.38,3.58);roads.push(panel);
 }
 const foliage=[];
 for(const side of [-1,1])for(let i=0;i<16;i++){
  const stem=add(root,box,grass,'runner-3d-paper-flower-stem');
  stem.position.set(side*(6+(i%4)*1.9),1.1,20-i*2.8);stem.scale.set(.12,1.7,.14);
  const bloom=add(root,ball,i%3?paper:gold,'runner-3d-flower-bloom');
  bloom.position.set(stem.position.x,2.2,stem.position.z);bloom.scale.setScalar(.45+i%4*.10);
  foliage.push({stem,bloom,index:i,side});
 }
 const fragments=new T.InstancedMesh(geometry(new T.PlaneGeometry(.9,1.65)),paper,coarse?24:48);
 fragments.name='runner-curtain-becoming-flying-paper-flowers';root.add(fragments);
 const q=new T.Quaternion(),p=new T.Vector3(),s=new T.Vector3(),matrix=new T.Matrix4(),axis=new T.Vector3(0,1,0);
 let disposed=false;
 function update({exit=0,entryTime=null}={}){
  if(disposed)return;
  const stage=entryTime==null?null:gyuwonRunnerBridgeAt(entryTime);
  const x=Math.max(0,Math.min(1,exit)),e=stage?.progress||0;
  const reveal=Math.max(x,e),meadow=stage?stage.gate:Math.max(0,(x-.48)/.52);
  root.visible=reveal>.003;if(!root.visible)return;
  gate.scale.setScalar(.38+reveal*.62);
  gate.position.y=10+Math.sin(reveal*Math.PI)*1.1;
  gate.position.z=-22+Math.sin(reveal*Math.PI)*3;
  gate.rotation.z=Math.sin(reveal*Math.PI)*.03;
  rim.rotation.z=reveal*.22;rim.material.emissiveIntensity=.28+meadow*.6;
  inner.scale.set((7.2+meadow*1.3),(8.1+meadow*1.2),8.5);
  skyDisk.material.opacity=Math.min(.88,.25+meadow*.60);
  skyDisk.scale.setScalar(.6+meadow*.4);
  roads.forEach((tile,i)=>{
   const t=i/13,spread=(1-t)*reveal;
   tile.visible=reveal>t*.48;
   tile.position.y=-.12+spread*.45+Math.sin(reveal*5-i*.5)*.08;
   tile.position.x=Math.sin(i*.75)*.28*reveal;
   tile.scale.x=(4+5*reveal)*(1-.22*Math.sin(t*Math.PI));
   tile.rotation.y=Math.sin(i*.7)*.015*(1-meadow);
  });
  foliage.forEach(({stem,bloom,index,side})=>{
   const rise=Math.max(0,Math.min(1,(meadow-index*.022)*2.4));
   stem.visible=bloom.visible=rise>.03;
   if(!stem.visible)return;
   stem.scale.y=1.7*rise;stem.position.y=1.0*rise;
   bloom.position.y=1.9*rise+.2+Math.sin((stage?.time||reveal*6)*2+index)*.16;
   bloom.scale.setScalar((.34+index%4*.11)*rise);
   bloom.rotation.y=(stage?.time||reveal*6)*.8+index;
  });
  for(let i=0;i<fragments.count;i++){
   const t=i/fragments.count,a=i*2.399,progress=(stage?.time||reveal*12);
   p.set(Math.sin(a)*((3+17*t)*reveal),4+20*t+(progress*.8+i*.31)%8,
    -18+Math.cos(a)*10+Math.sin(progress*.8+i)*2);
   q.setFromAxisAngle(axis,a+progress*.38);
   s.setScalar(Math.max(.001,reveal)*(.3+.8*(i%6)/6));
   matrix.compose(p,q,s);fragments.setMatrixAt(i,matrix);
  }
  fragments.instanceMatrix.needsUpdate=true;
 }
 return {root,gate,roads,foliage,update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();fragments.dispose();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
