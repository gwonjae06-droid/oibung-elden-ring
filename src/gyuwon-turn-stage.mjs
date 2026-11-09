import * as THREE from 'three';
import {REFERENCE_PARTY} from './gyuwon-reference-rules.mjs';
export function createGyuwonTurnStage(scene,{player,boss,coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-three-dimensional-turn-arena';root.visible=false;scene.add(root);
 const mats=new Set(),geos=new Set(),ownMat=m=>(mats.add(m),m),ownGeo=g=>(geos.add(g),g);
 const steel=ownMat(new THREE.MeshStandardMaterial({color:0x243444,roughness:.48,metalness:.72})),edge=ownMat(new THREE.MeshStandardMaterial({color:0x6b869b,roughness:.38,metalness:.8})),brass=ownMat(new THREE.MeshStandardMaterial({color:0x9d8967,roughness:.45,metalness:.67})),blue=ownMat(new THREE.MeshStandardMaterial({color:0x83b7c5,emissive:0x27667b,emissiveIntensity:.55,metalness:.45,roughness:.35}));
 const box=ownGeo(new THREE.BoxGeometry(1,1,1)),circle=ownGeo(new THREE.CylinderGeometry(29,29,.18,coarse?64:112));
 const floor=new THREE.Mesh(circle,steel);floor.position.y=.05;floor.receiveShadow=true;root.add(floor);
 const panel=new THREE.InstancedMesh(box,edge,60),mat4=new THREE.Matrix4(),v=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();let n=0;
 for(let i=0;i<15;i++)for(let side of [-1,1]){
  v.set(side*28,3,i*4-26);s.set(.6,6,3.8);mat4.compose(v,q,s);panel.setMatrixAt(n++,mat4);
  v.set(i*4-28,.19,side*24);s.set(3.8,.08,.18);mat4.compose(v,q,s);panel.setMatrixAt(n++,mat4);
 }panel.instanceMatrix.needsUpdate=true;panel.receiveShadow=true;root.add(panel);
 const hoopGeo=ownGeo(new THREE.TorusGeometry(26,.13,8,coarse?64:128));
 for(const r of [1,.78,.52]){const m=new THREE.Mesh(hoopGeo,r===1?brass:edge);m.scale.setScalar(r);m.rotation.x=-Math.PI/2;m.position.y=.17;root.add(m);}
 for(let i=0;i<6;i++){
  const arch=new THREE.Group();arch.position.z=-28+i*6;root.add(arch);
  for(const side of [-1,1]){const leg=new THREE.Mesh(box,steel);leg.position.set(side*24,8,0);leg.scale.set(1.4,16,1.8);arch.add(leg);const rail=new THREE.Mesh(box,brass);rail.position.set(side*22.8,7,0);rail.scale.set(.18,14,.8);arch.add(rail);}
  const top=new THREE.Mesh(box,edge);top.position.y=15.6;top.scale.set(48,1,1.4);arch.add(top);
 }
 const back=new THREE.Mesh(box,steel);back.position.set(0,7,-29);back.scale.set(56,14,1);root.add(back);
 const gateGeo=ownGeo(new THREE.TorusGeometry(7,.45,coarse?10:18,coarse?48:96)),gate=new THREE.Mesh(gateGeo,edge);gate.position.set(0,6,-28);root.add(gate);
 const inset=new THREE.Mesh(ownGeo(new THREE.CircleGeometry(6.3,64)),ownMat(new THREE.MeshStandardMaterial({color:0x112231,roughness:.6,metalness:.5})));inset.position.set(0,6,-28.2);root.add(inset);
 for(let i=-2;i<=2;i++){const stripe=new THREE.Mesh(box,blue);stripe.position.set(i*2.6,3,-27.4);stripe.scale.set(.1,5,.08);root.add(stripe);}
 const cloneTint=(source,color)=>{const rig=source.clone(true),cache=new Map();rig.traverse(o=>{if(o.material){const values=[].concat(o.material).map(m=>{if(!cache.has(m)){const a=m.clone();if(a.color)a.color.lerp(new THREE.Color(color),.2);cache.set(m,ownMat(a));}return cache.get(m);});o.material=Array.isArray(o.material)?values:values[0];}if(/rifle|cigarette|scooter|bike|bow-rig|hammer-rig|gacha|octopus|arsenal/i.test(o.name))o.visible=false;});return rig;};
 const allies=REFERENCE_PARTY.map((p,i)=>{const a=cloneTint(player.rig,p.color);a.name='musical-party-'+i;const grip=a.getObjectByName('player-weapon-grip');if(grip)grip.children.forEach((o,k)=>o.visible=k===i);root.add(a);return a;});
 const enemies=[null,cloneTint(boss,0x7999b5),cloneTint(boss,0xa395b9)];
 for(const r of enemies)if(r)root.add(r);
 const droneGeo=ownGeo(new THREE.IcosahedronGeometry(1.3,coarse?1:2)),trimGeo=ownGeo(new THREE.TorusGeometry(1.5,.12,8,40));
 for(let i=3;i<5;i++){
  const drone=new THREE.Group();drone.name='musical-armoured-drone-'+i;
  const body=new THREE.Mesh(droneGeo,steel);body.scale.set(1,.82,.8);drone.add(body);
  for(let j=0;j<6;j++){const a=j*Math.PI/3,panel=new THREE.Mesh(box,edge);panel.position.set(Math.sin(a)*1.25,Math.cos(a)*1.25,0);panel.rotation.z=-a;panel.scale.set(.75,.8,.45);drone.add(panel);}
  const ring=new THREE.Mesh(trimGeo,brass);ring.position.z=.7;drone.add(ring);const core=new THREE.Mesh(ownGeo(new THREE.SphereGeometry(.48,24,16)),blue);core.position.z=.85;drone.add(core);enemies.push(drone);root.add(drone);
 }
 const target=new THREE.Mesh(ownGeo(new THREE.TorusGeometry(1.5,.055,8,64)),ownMat(new THREE.MeshBasicMaterial({color:0xf3d29c,transparent:true,opacity:.9})));target.name='turn-selected-enemy';root.add(target);
 const ribbons=Array.from({length:5},()=>{const a=new THREE.Mesh(ownGeo(new THREE.CylinderGeometry(.13,.2,1,12)),blue);a.visible=false;root.add(a);return a;});
 const direction=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0),project=new THREE.Vector3();let disposed=false;
 function update(g){
  const m=g.gyuwon?.years?.musical;root.visible=!!m?.reference&&m.year===5&&!m.finishing&&g.status==='playing';if(!root.visible)return;
  scene.background.setHex(0x111d2b);scene.fog.color.setHex(0x111d2b);scene.fog.density=.009;
  for(let i=0;i<allies.length;i++){
   const p=m.party[i],a=allies[i],motion=m.actorMotion?.actorId===p.id?m.actorMotion:null;
   a.visible=p.hp>0;a.position.set(p.x,.2,p.z);a.rotation.y=Math.atan2((m.enemies[m.targetIndex]?.x||0)-p.x,(m.enemies[m.targetIndex]?.z||-10)-p.z);a.scale.setScalar(1.35);
   const body=a.getObjectByName('player-articulated-body'),grip=a.getObjectByName('player-weapon-grip'),l=a.getObjectByName('player-shoulder-L'),r=a.getObjectByName('player-shoulder-R');
   const strike=motion?Math.sin(Math.min(1,motion.age/1.15)*Math.PI):0;
   if(body)body.rotation.set(-strike*.24,0,0);if(grip)grip.rotation.x=-.5-strike*2;if(l)l.rotation.x=-strike*.7;if(r)r.rotation.x=-strike*1.4;
  }
  for(let i=0;i<enemies.length;i++){
   const e=m.enemies[i],a=i===0?boss:enemies[i];a.visible=e.hp>0;a.position.set(e.x,i<3?.2:3.6+Math.sin(m.time*2+i)*.28,e.z);a.scale.setScalar(i<3?1.35:1);
   if(i===0){
    // The first musical act: Gyuwon enters from the wing, crosses to the
    // orchestra-lit center and makes a nervous bow. This is a visual entrance
    // only, not a combat teleport or a dangerous hitbox while input is locked.
    const overture=m.overture&&m.time<5.8?m.time:null;
    if(overture!==null){
     const walk=THREE.MathUtils.smoothstep(overture,1.6,4.1);
     a.position.x=-10+(e.x+10)*walk;
     a.position.y=.2+Math.sin(Math.min(1,walk)*Math.PI*7)*.13*(1-walk);
     a.rotation.x=-.16*THREE.MathUtils.smoothstep(overture,3.75,4.4)*(1-THREE.MathUtils.smoothstep(overture,4.8,5.65));
     const arm=a.getObjectByName('gyuwon-right-arm');
     if(arm)arm.rotation.z=-.55*THREE.MathUtils.smoothstep(overture,3.1,4.4)*(1-THREE.MathUtils.smoothstep(overture,4.9,5.7));
    }else{a.rotation.x=0;const arm=a.getObjectByName('gyuwon-right-arm');if(arm)arm.rotation.z=0;}
   }
   a.rotation.y=Math.atan2(m.party[0].x-e.x,m.party[0].z-e.z);
   if(i>0&&i<3){const torso=a.getObjectByName('gyuwon-tailored-torso'),arm=a.getObjectByName('gyuwon-right-arm');const power=m.turnActor===e.id&&m.turn==='boss'?Math.min(1,m.turnElapsed/1.2):0;if(torso)torso.rotation.x=-.18+power*.24;if(arm)arm.rotation.x=-.4-power;}
  }
  const selected=m.enemies[m.targetIndex];target.visible=selected?.hp>0;if(selected){target.position.set(selected.x,selected.index<3?2.5:3.8,selected.z+1.1);target.rotation.y=Math.atan2(-12-selected.x,23-selected.z);target.rotation.z=m.time*.3;}
  ribbons.forEach(a=>a.visible=false);
  const motion=m.actorMotion;
  if(motion?.type==='ultimate'&&motion.age>.55&&motion.age<1.65){const actor=m.party.find(p=>p.id===motion.actorId);for(let i=0;i<m.enemies.length;i++){const e=m.enemies[i],r=ribbons[i];r.visible=e.hp>0;const from=new THREE.Vector3(actor.x,3,actor.z),to=new THREE.Vector3(e.x,2.3,e.z);direction.subVectors(to,from);r.position.copy(from).addScaledVector(direction,.5);r.quaternion.setFromUnitVectors(axis,direction.clone().normalize());r.scale.set(1,direction.length(),1);}}
 }
 function projectTargets(g,camera,canvas,shell){const m=g.gyuwon?.years?.musical;if(!root.visible||!m)return;camera.updateMatrixWorld();const r=canvas.getBoundingClientRect(),s=shell.getBoundingClientRect();m.targetScreens=m.enemies.map(e=>{project.set(e.x,e.index<3?5.3:5.7,e.z).project(camera);return {left:r.left-s.left+(project.x*.5+.5)*r.width,top:r.top-s.top+(-project.y*.5+.5)*r.height,visible:project.z<1&&e.hp>0};});}
 async function prewarm(renderer,camera){const visible=root.visible,previous=renderer.getRenderTarget(),target=new THREE.WebGLRenderTarget(16,16);root.visible=true;try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);renderer.setRenderTarget(target);renderer.render(scene,camera);}finally{renderer.setRenderTarget(previous);root.visible=visible;target.dispose();}}
 return {root,update,projectTargets,prewarm,stats:()=>({allies:allies.length,enemies:5,dimension:3}),dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const m of mats)m.dispose();for(const g of geos)g.dispose();}};
}
