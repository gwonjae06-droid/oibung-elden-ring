import * as THREE from 'three';
import {patternConfig} from './combat.mjs';

// Cinematic-only effect for 천추 처형. Damage, targeting and dodge timing
// remain exclusively in combat.mjs's existing slam attackZone.
export function createKwonSkySwordView(scene,{reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-sky-judgement';scene.add(root);
 const blade=new THREE.Group();blade.name='sky-falling-greatsword';root.add(blade);
 const materials=[],geometries=[];
 const material=(args)=>{const m=new THREE.MeshBasicMaterial(args);materials.push(m);return m;};
 const steel=material({color:0xc9e5ff,side:THREE.DoubleSide});
 const shine=material({color:0xffdbc5,transparent:true,opacity:reduced?.32:.53,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const gold=material({color:0xffc782});
 const flare=material({color:0xff624b,transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const glow=material({color:0xffb88d,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const mesh=(geo,mat,parent=blade)=>{geometries.push(geo);const m=new THREE.Mesh(geo,mat);parent.add(m);return m;};
 // The tip is at y=0. Height 12m gives the falling weapon a looming silhouette.
 const outline=new THREE.Shape();outline.moveTo(0,0);outline.lineTo(-1.3,4.9);
 outline.lineTo(-1.38,8.7);outline.lineTo(1.38,8.7);outline.lineTo(1.3,4.9);outline.closePath();
 const sword=mesh(new THREE.ExtrudeGeometry(outline,{depth:.36,steps:1,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:2}),steel);
 sword.position.z=-.18;
 const aura=mesh(new THREE.ShapeGeometry(outline),shine);aura.scale.set(1.28,1.04,1);aura.position.z=-.4;
 // A brilliant central fuller, crossguard and long hilt make this a sword, not a pillar.
 const ridge=mesh(new THREE.CylinderGeometry(.095,.02,7.1,8),gold);ridge.position.set(0,4.3,.3);
 const guard=mesh(new THREE.BoxGeometry(4.5,.44,.62),gold);guard.position.set(0,8.85,0);
 const guardHalo=mesh(new THREE.BoxGeometry(5.2,.7,.74),shine);guardHalo.position.set(0,8.85,-.02);
 const hilt=mesh(new THREE.CylinderGeometry(.3,.3,2.8,12),steel);hilt.position.set(0,10.35,0);
 const pommel=mesh(new THREE.IcosahedronGeometry(.56,1),gold);pommel.position.y=11.85;
 const crown=mesh(new THREE.SphereGeometry(.53,12,8),shine);crown.position.y=11.85;
 const ring=mesh(new THREE.RingGeometry(.85,1.03,64).rotateX(-Math.PI/2),glow,root);ring.position.y=.065;
 const impact=mesh(new THREE.CylinderGeometry(.2,1.8,8,20,1,true),flare,root);
 impact.position.y=4;impact.visible=false;
 const light=new THREE.PointLight(0xffa66a,0,19);light.position.y=2;root.add(light);
 const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
 const fall=t=>Math.pow(Math.max(0,Math.min(1,t)),2.8);
 const hide=()=>{root.visible=false;impact.visible=false;light.intensity=0;};
 function update(b){
  if(!b||b.pattern!=='slam'||!b.zone||!['windup','active','recovery'].includes(b.state)){hide();return;}
  const cfg=patternConfig(b),w=b.state==='windup'?ease(b.t/cfg.wind):1;
  const strike=b.state==='active'?Math.max(0,Math.min(1,b.t/(cfg.active*.84))):b.state==='recovery'?1:0;
  const finished=b.state==='recovery';
  if(finished&&b.t>.27){hide();return;}
  root.visible=true;root.position.set(b.zone.x,0,b.zone.z);
  blade.visible=!finished;blade.position.y=b.state==='windup'?20-4*w:.09+16*(1-fall(strike));
  blade.scale.setScalar(reduced?.84:1);
  blade.rotation.set(.06,Math.sin((b.t||0)*1.8)*.1+(b.yaw||0),0);
  ring.visible=true;ring.scale.setScalar(1.7+1.1*w);
  glow.opacity=finished?.3*(1-ease(b.t/.27)):.13+.2*w;
  const hit=b.state==='active'&&strike>=1||finished;
  impact.visible=hit&&!reduced;
  if(hit){
   const left=finished?1-ease(b.t/.27):1;
   impact.scale.setScalar(.85+.6*(1-left));
   flare.opacity=.48*left;light.intensity=3.8*left;
  }else{flare.opacity=0;light.intensity=.25+.65*w;}
 }
 function clear(){hide();}
 function dispose(){clear();root.parent?.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();light.dispose?.();}
 hide();return {update,clear,dispose,root};
}
