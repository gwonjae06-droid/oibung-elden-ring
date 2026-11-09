import * as T from 'three';
import {createGyuwonBossParty} from './gyuwon-party-portraits.mjs';
import {createGiantGyuwon} from './gyuwon-giant-actor.mjs';
import {createActFiveStagecraft} from './gyuwon-act-five-stagecraft.mjs';
import {ACT_FIVE_SCORE,scoreEase} from './gyuwon-act-five-score.mjs';
export function createGyuwonTurnStage(scene,{boss,coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-three-dimensional-giant-raid';root.visible=false;scene.add(root);
 const mats=new Set(),geos=new Set(),mat=o=>{const m=new T.MeshStandardMaterial(o);mats.add(m);return m;},geo=g=>(geos.add(g),g);
 const wood=mat({color:0x6b422d,roughness:.74}),gold=mat({color:0xb89b63,roughness:.35,metalness:.72}),iron=mat({color:0x2a2634,roughness:.5,metalness:.65}),red=mat({color:0x5b1728,roughness:.95,side:T.DoubleSide}),cream=mat({color:0xd5d0b8,roughness:.73}),black=mat({color:0x191420,roughness:.75});
 const glow=mat({color:0xffdf8d,emissive:0xe5a739,emissiveIntensity:.9,roughness:.3,metalness:.45}),blood=mat({color:0x8e173c,emissive:0x470c24,emissiveIntensity:.6,roughness:.35});
 const box=geo(new T.BoxGeometry(1,1,1)),sphere=geo(new T.SphereGeometry(1,coarse?14:24,coarse?10:16)),ring=geo(new T.TorusGeometry(1,.06,8,coarse?40:72)),cyl=geo(new T.CylinderGeometry(1,1,1,16)),pageGeo=geo(new T.PlaneGeometry(1,1.4,3,4));
 const mesh=(p,g,m,name='')=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const floor=new T.InstancedMesh(box,wood,96);floor.name='raid-deformable-stage-planks';floor.receiveShadow=true;root.add(floor);
 const matrix=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),s=new T.Vector3();
 const footing=mesh(root,box,iron);footing.position.set(0,-1.2,-1);footing.scale.set(65,1.8,61);
 for(const side of [-1,1]){const frame=mesh(root,box,gold);frame.position.set(side*32,20,-30);frame.scale.set(1.3,40,2);}
 const upper=mesh(root,box,gold);upper.position.set(0,40,-30);upper.scale.set(65,1.2,2);
 const curtainGeo=geo(new T.PlaneGeometry(33,42,coarse?24:64,16));const pos=curtainGeo.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.cos(pos.getX(i)*1.45)*.55);curtainGeo.computeVertexNormals();
 const curtains=[-1,1].map(side=>{const o=mesh(root,curtainGeo,red,'giant-opening-curtain');o.position.set(side*16.5,20,-30);return o;});
 const canopy=mesh(root,box,red);canopy.position.set(0,40,-28);canopy.scale.set(67,3,5);
 const guestParty=createGyuwonBossParty({coarse}),allies=guestParty.roles;for(const a of allies)root.add(a);
 const fill=new T.HemisphereLight(0xffdec2,0x27172c,1.15);root.add(fill);
 const key=new T.DirectionalLight(0xffe5c5,2.3);key.position.set(-18,34,25);root.add(key);
 const rim=new T.DirectionalLight(0x8bbddb,1.5);rim.position.set(25,30,-30);root.add(rim);
 const footlight=new T.DirectionalLight(0xf0e6d6,1.6);footlight.position.set(0,9,23);footlight.target.position.set(0,2,8);root.add(footlight,footlight.target);
 const giant=createGiantGyuwon(root,boss,{coarse});
 const stagecraft=createActFiveStagecraft(root,giant.head,{coarse});
 const backStage=mesh(root,box,iron,'giant-waist-stage-front');backStage.position.set(0,3.4,-26);backStage.scale.set(20,6.8,6);
 const lighting=new T.Group();lighting.name='raid-lighting-core';root.add(lighting);
 const crystal=mesh(lighting,geo(new T.OctahedronGeometry(2.2,1)),glow);crystal.position.y=0;
 for(let i=0;i<8;i++){const a=i*Math.PI/4,lamp=mesh(lighting,cyl,iron);lamp.position.set(Math.cos(a)*4,0,Math.sin(a)*2);lamp.scale.set(.8,1.8,.8);lamp.rotation.x=Math.PI/3;const bulb=mesh(lamp,sphere,glow);bulb.position.y=-.6;bulb.scale.set(.6,.25,.6);}
 const wire=mesh(root,cyl,iron);wire.position.set(-21,31.5,-18);wire.scale.set(.09,17,.09);
 const center=new T.Group();center.name='raid-stage-center-core';root.add(center);const heart=mesh(center,geo(new T.IcosahedronGeometry(2,2)),glow),petals=[];
 for(let i=0;i<12;i++){const a=i*Math.PI/6,p=mesh(center,box,i%2?gold:iron);p.position.set(Math.sin(a)*2.4,0,Math.cos(a)*2.4);p.rotation.y=a;p.scale.set(.7,3.2,1);petals.push(p);}
 const projectiles=Array.from({length:8},()=>{
  const group=new T.Group();root.add(group);group.visible=false;
  const blade=mesh(group,box,cream);blade.scale.set(.18,3.4,.4);
  const die=mesh(group,box,gold);die.scale.setScalar(1.6);for(let i=0;i<3;i++)for(const side of [-1,1]){const pip=mesh(die,sphere,black);pip.position.set((i-1)*.19,side*.51,0);pip.scale.setScalar(.055);}
  const pips=Array.from({length:9},(_,i)=>{const p=mesh(die,sphere,black);p.position.set((i%3-1)*.27,(Math.floor(i/3)-1)*.27,.51);p.scale.setScalar(.065);return p;});
  const puppet=new T.Group();group.add(puppet);const coat=mesh(puppet,geo(new T.LatheGeometry([[0,0],[.3,0],[.5,.5],[.35,1.4],[0,1.5]].map(x=>new T.Vector2(...x)),16)),red);const face=mesh(puppet,sphere,cream);face.position.y=1.7;face.scale.set(.38,.46,.33);const hat=mesh(puppet,cyl,black);hat.position.y=2.18;hat.scale.set(.38,.5,.38);for(const side of [-1,1]){const arm=mesh(puppet,cyl,cream);arm.position.set(side*.65,.85,0);arm.rotation.z=side*1.0;arm.scale.set(.09,1,.09);}
  const bloodBall=mesh(group,sphere,blood);bloodBall.scale.set(.6,.85,.6);const bloodRing=mesh(bloodBall,ring,blood);bloodRing.scale.setScalar(1.5);
  const circusWave=mesh(group,ring,glow);circusWave.scale.setScalar(1.1);
  return {group,items:[blade,puppet,die,bloodBall],circusWave,pips};
 });
 const enemyShots=Array.from({length:3},()=>{const group=new T.Group();group.name='raid-sung-pattern-projectile';root.add(group);group.visible=false;
  const orb=mesh(group,sphere,glow),wave=mesh(group,ring,glow),star=mesh(group,stagecraft.starGeometry,glow);orb.scale.setScalar(.7);wave.scale.set(1.7,1.4,1.7);star.scale.setScalar(1.25);return {group,items:[orb,wave,star]};});
 const notes=Array.from({length:9},()=>{const p=mesh(root,pageGeo,cream,'raid-floating-score');p.visible=false;return p;});
 const waves=Array.from({length:4},(_,i)=>{const m=mesh(root,ring,i===3?blood:glow,'raid-physical-wave');m.rotation.x=-Math.PI/2;m.visible=false;return m;});
 const shields=Array.from({length:4},()=>{const m=mesh(root,ring,blood,'raid-blood-protective-wing-ring');m.scale.set(2.3,3.1,1);m.visible=false;return m;});
 const bindings=Array.from({length:5},()=>{const m=mesh(root,ring,gold,'raid-circus-binding');m.scale.setScalar(2.7);m.visible=false;return m;});
 const fragments=Array.from({length:40},(_,i)=>{const p=mesh(root,i%3===0?box:geo(new T.TetrahedronGeometry(.4,0)),i%2?gold:cream,'raid-pooled-fragment');p.visible=false;return {mesh:p,at:-99,from:new T.Vector3(),index:i};});
 const seen=new Set(),project=new T.Vector3();let disposed=false,last=0,owner=null;
 function update(g){
  const m=g.gyuwon?.years?.musical;root.visible=!!m?.giantRaid&&!m.finishing&&g.status==='playing';if(!root.visible){for(const a of allies)if(a.parent===root)a.scale.setScalar(1);return;}
  const dt=owner===g?Math.max(0,Math.min(.05,m.time-last)):.016;if(owner!==g){seen.clear();owner=g;}last=m.time;
  scene.background.setHex(0x111d30);scene.fog.color.setHex(0x111d30);scene.fog.density=.0006;
  for(const a of allies){if(a.parent!==root)root.add(a);a.scale.setScalar(1.25);}
  guestParty.update(m);giant.update(m,dt);stagecraft.update(m);
  for(let i=0;i<2;i++){const side=i?-1:1;curtains[i].position.x=-side*(16.5+T.MathUtils.smoothstep(m.time,.2,7)*22);curtains[i].rotation.y=side*.035*Math.sin(m.time*.7);}
  const curtainLift=T.MathUtils.smoothstep(m.time,ACT_FIVE_SCORE[11].start,ACT_FIVE_SCORE[11].end);canopy.position.y=40+curtainLift*7;curtains.forEach(o=>o.position.y=20+curtainLift*5);
  const a=m.raidAttack,compression=a&&a.part<2&&a.age>a.impactAt&&a.age<a.impactAt+.6?Math.sin((a.age-a.impactAt)/.6*Math.PI):0;
  for(let i=0;i<96;i++){const x=(i%16-7.5)*4,z=(Math.floor(i/16)-2.5)*10;const bend=compression*Math.max(0,1-Math.hypot(x-(a?.to.x||0),z-(a?.to.z||0))/8)*.38;v.set(x,-bend,z);s.set(3.96,.3,9.96);matrix.compose(v,q,s);floor.setMatrixAt(i,matrix);}floor.instanceMatrix.needsUpdate=true;
  const light=m.enemies[2];lighting.visible=!light.destroyed;lighting.position.set(light.x,light.y,light.z);crystal.rotation.y=m.time*.4;
  const core=m.enemies[4];center.visible=core.active;center.position.set(core.x,core.y,core.z);heart.rotation.y=m.time*.5;heart.visible=!core.destroyed;
  petals.forEach((p,i)=>{p.rotation.z=(i%2?1:-1)*(core.active?Math.min(1,(m.time-core.unlock)/3):0)*.85;p.position.y=-Math.min(2,Math.max(0,m.time-core.unlock)*.6);});
  projectiles.forEach(p=>p.group.visible=false);const motion=m.actorMotion,role=motion?m.party.find(p=>p.id===motion.actorId):null;
  motion?.projectiles?.forEach((shot,i)=>{const fx=projectiles[i];if(!fx)return;fx.group.visible=shot.visible&&role.index!==0;fx.group.position.set(shot.x,shot.y,shot.z);fx.group.rotation.set(m.time*3,m.time*4,m.time*2);const shock=role.index===1&&motion.type==='light';fx.items.forEach((o,k)=>o.visible=k===role.index&&!shock);fx.circusWave.visible=shock;fx.group.scale.setScalar(motion.type==='ultimate'?2.3:1);const layout=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]][motion.diceValue||1];fx.pips.forEach((o,k)=>o.visible=layout.includes(k));});
  enemyShots.forEach((fx,i)=>{const shot=a?.shots?.[i];fx.group.visible=!!shot&&a.part>=2&&a.age<a.impactAt+.1;if(!fx.group.visible)return;
   fx.group.position.set(shot.x,shot.y,shot.z);fx.group.scale.setScalar(a.age<a.wind?.18+.82*scoreEase(a.age/a.wind):1);fx.group.rotation.set(0,m.time*.6,m.time*.9+i);
   const shape=a.kind==='stars'?2:['wave','crown'].includes(a.kind)?1:0;fx.items.forEach((o,k)=>o.visible=k===shape);
  });
  for(let i=0;i<notes.length;i++){const n=notes[i];n.visible=!!a&&(a.part===1||a.part===3)&&a.age<a.impactAt;if(n.visible){const u=i/8;n.position.set(a.from.x+Math.sin(m.time*2+i)*3,a.from.y+Math.cos(m.time*2+i)*2,a.from.z+u*5);n.rotation.set(.4,m.time+i,.3);}}
  waves.forEach((w,i)=>{const contact=motion&&motion.age>=motion.hitAt&&motion.age<motion.hitAt+.4;w.visible=contact&&i===role.index||m.finishProgress>0&&m.finishProgress<.92;if(w.visible){const target=m.enemies[m.targetIndex];w.position.set(m.finishProgress>0?0:target.x,m.finishProgress>0?5:target.y,m.finishProgress>0?-9:target.z);w.scale.setScalar(m.finishProgress>0?2+m.finishProgress*(10+m.finishStrength*.4):1+(motion.age-motion.hitAt)*13);}});
  shields.forEach((o,i)=>{o.visible=m.shield>0;const p=m.party[i];o.position.set(p.x,2.5+(p.y||0),p.z-.6);o.rotation.y=Math.sin(m.time*1.5)*.15;});
  bindings.forEach((o,i)=>{const e=m.enemies[i];o.visible=e.bind>0&&!e.destroyed;o.position.set(e.x,e.y,e.z);o.rotation.set(m.time*.7,m.time*.3,0);});
  for(const h of m.raidHistory){if(h.event!=='destroy'||seen.has(h.part))continue;seen.add(h.part);const e=m.enemies[h.part];for(let i=0;i<8;i++){const f=fragments[h.part*8+i];f.at=m.time;f.from.set(e.homeX,e.homeY,e.homeZ);}}
  fragments.forEach(f=>{const age=m.time-f.at;f.mesh.visible=age>=0&&age<3;if(f.mesh.visible){const a=f.index*2.4;f.mesh.position.copy(f.from);f.mesh.position.x+=Math.sin(a)*age*3;f.mesh.position.z+=Math.cos(a)*age*3;f.mesh.position.y+=age*4-age*age*4.9;f.mesh.rotation.set(age*3,age*4,a);}});
 }
 function projectTargets(g,camera,canvas,shell){const m=g.gyuwon?.years?.musical;if(!root.visible||!m)return;camera.updateMatrixWorld();const r=canvas.getBoundingClientRect(),s=shell.getBoundingClientRect();m.targetScreens=m.enemies.map(e=>{project.set(e.x,e.y+3,e.z).project(camera);return {left:Math.min(r.width-65,Math.max(65,r.left-s.left+(project.x*.5+.5)*r.width+(e.index===3?95:0))),top:Math.max(r.height>500?185:115,r.top-s.top+(-project.y*.5+.5)*r.height-(e.index<2?10:0)),visible:project.z<1&&e.active&&!e.destroyed};});}
 function cameraFrame(m,aspect=1.6){const portrait=aspect<1,position={x:0,y:21.5,z:portrait?85:53},target={x:0,y:10.8,z:-9};const motion=m.actorMotion;if(motion?.type==='ultimate'){const e=m.enemies[m.targetIndex],p=m.party.find(p=>p.id===motion.actorId),k=Math.sin(Math.min(1,motion.age/motion.duration)*Math.PI);position.x=p.homeX*.3*k;position.z-=9*k;position.y+=k*2;target.x=e.x*.3*k;target.y+=k*((e.y+4)*.45-10.8)*.4;}return {position,target};}
 async function prewarm(renderer,camera){await guestParty.ready;const visible=root.visible,previous=renderer.getRenderTarget(),target=new T.WebGLRenderTarget(16,16);root.visible=true;try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);renderer.setRenderTarget(target);renderer.render(scene,camera);}finally{renderer.setRenderTarget(previous);root.visible=visible;target.dispose();}}
 return {root,update,projectTargets,cameraFrame,prewarm,ensembleRoles:allies,stats:()=>({allies:4,enemies:5,dimension:3,giant:true,sourcePhases:guestParty.sourcePhases,phaseOneClown:guestParty.actors[1].isRebuiltRingmaster===true,bloodJoints:guestParty.actors[3].regalia.jointSkins.length}),dispose(){if(disposed)return;disposed=true;guestParty.dispose();stagecraft.dispose();giant.dispose();root.removeFromParent();for(const m of mats)m.dispose();for(const g of geos)g.dispose();}};
}
