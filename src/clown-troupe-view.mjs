import * as THREE from 'three';
import {CIRCUS_ROLES,circusUncannyFrame} from './clown-troupe.mjs';
import {solveFixedLimb,stageFootTarget,circusFootPhasing,smoothYaw} from './clown-performance-rig.mjs';
import {createSpringBank} from './secondary-physics.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {createClownTheatreCues} from './clown-theatre-cues.mjs';
import {troupeBeatMotion,ENSEMBLE_DISPLAY_STYLE} from './clown-ensemble-poses.mjs';
// PBR geometry, articulating legs, role-specific apparatus, frame-independent
// movement and real theatrical cues. The troupe exists in the combat state;
// this view can never manufacture a damaging hitbox.
export function createCircusTroupeView(scene,{coarse=false,reduced=false,onActorCreated=null}={}){
 const root=new THREE.Group();root.name='seulwoo-living-circus-troupe';scene.add(root);
 const live=new Map(),hoops=new Map(),puppetGhosts=new Map();
 const standby=new Map(),prewarmRoles=['chorister','strongman','acrobat','bladeDancer','puppeteer','firekeeper','mimic','chorister'];
 let prepared=false,preview=false;
 const theatreCues=createClownTheatreCues(root,{coarse,reduced});
 const direction=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 function bone(mesh,a,b){from.set(...a);to.set(...b);direction.copy(to).sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.y=Math.max(.001,direction.length());
  mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
 const geo=new THREE.SphereGeometry(1,coarse?12:22,coarse?8:16),
  cylinder=new THREE.CylinderGeometry(1,1,1,coarse?8:15);
 const mat={
  velvet:new THREE.MeshPhysicalMaterial({color:0x381621,roughness:.94,sheen:.47,sheenColor:0x73384a}),
  crimson:new THREE.MeshPhysicalMaterial({color:0x763044,roughness:.86,sheen:.36,sheenColor:0xa35d61}),
  ivory:new THREE.MeshPhysicalMaterial({color:0xcbbfb2,roughness:.79,clearcoat:.14,clearcoatRoughness:.81}),
  black:new THREE.MeshStandardMaterial({color:0x100e16,roughness:.52}),
  gilt:new THREE.MeshStandardMaterial({color:0x8e7759,metalness:.73,roughness:.43}),
  cyan:new THREE.MeshStandardMaterial({color:0x70a9a4,roughness:.67,emissive:0x12362e}),
  ember:new THREE.MeshStandardMaterial({color:0xe18a51,roughness:.54,emissive:0x9d3118,emissiveIntensity:.78})
 };
 const add=(parent,g,m,name,x=0,y=0,z=0)=>{
  const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);
   o.castShadow=!coarse&&/costume|mask-shadow-back|stage-shoe|ragged-velvet-coat-hem/.test(name);
   parent.add(o);return o;
 };
 const oval=(parent,m,name,x,y,z,rx,ry,rz)=>{const o=add(parent,geo,m,name,x,y,z);o.scale.set(rx,ry,rz);return o;};
 const tube=(parent,m,name,x,y,z,radius,length)=>{const o=add(parent,cylinder,m,name,x,y,z);o.scale.set(radius,length,radius);return o;};
 function actor(role){
  const group=new THREE.Group();group.name='circus-member-'+role;root.add(group);
  const body=new THREE.Group();group.add(body);let mask,shoulders=[],legs=[],fire=[],strings=[],head,jaw;
  const clothes=role==='acrobat'?mat.cyan:role==='firekeeper'||role==='strongman'?mat.crimson:role==='bladeDancer'?mat.black:mat.velvet;
  const torso=oval(body,clothes,'volumetric-theatre-costume',0,1.42,0,.56,.9,.36);
  const skirt=add(body,new THREE.ConeGeometry(.73,1.14,coarse?10:22,1,true),clothes,'ragged-velvet-coat-hem',0,.7,0);
  skirt.rotation.y=.21;
  const springs=createSpringBank();
  for(const s of [-1,1]){
   // Each troupe member has real, fixed-length thigh, knee, calf and shoe.
   // The old one-piece swinging trouser sent shoes through the stage.
   const thigh=tube(body,mat.black,'articulated-troupe-thigh',0,0,0,.16,1);
   const shin=tube(body,clothes,'articulated-troupe-shin',0,0,0,.14,1);
   const knee=oval(body,clothes,'constrained-troupe-knee',0,0,0,.19,.21,.2);
   const shoe=oval(body,mat.black,'solid-stage-shoe',0,0,0,.23,.15,.39);
   legs.push({side:s,thigh,shin,knee,shoe});
   const arm=new THREE.Group();arm.position.set(s*.52,1.94,0);body.add(arm);shoulders.push(arm);
   tube(arm,clothes,'articulated-performer-arm',s*.10,-.33,0,.16,.79);
   oval(arm,mat.ivory,'separate-gloved-hand',s*.17,-.75,.09,.17,.19,.20);
  }
  head=new THREE.Group();head.position.set(0,2.46,0);body.add(head);
  oval(head,mat.black,'mask-shadow-back',0,-.02,-.06,.43,.51,.39);
  mask=oval(head,mat.ivory,'hand-carved-rigid-performance-mask',0,0,.22,.40,.49,.25);
  for(const s of [-1,1]){
   oval(head,mat.black,'unlit-eye-socket',s*.17,.12,.42,.11,.15,.048);
   oval(head,mat.gilt,'thin-hairline-crack',s*.25,-.13,.424,.017,.20,.008);
  }
  jaw=oval(head,mat.black,'singing-mask-mouth',0,-.20,.438,.24,.08,.037);
  oval(head,mat.ivory,'chin-porcelain',0,-.38,.27,.26,.11,.14);
  // A porcelain singer has no mouth; its ribcage performs the vocals.
  const seal=role==='chorister'?oval(head,mat.ivory,'seamless-mouthless-porcelain-seal',
    0,-.21,.495,.265,.145,.059):null;
  const cracks=[];
  if(seal)for(let i=0;i<3;i++){
   const crack=oval(head,mat.crimson,'singing-face-stress-fracture',
     (i-1)*.105,-.19,.558,.012,.06,.009);
   crack.rotation.z=(i-1)*.28;cracks.push(crack);
  }
  // All 3rd-act performers grow the ringmaster's identical fixed red grin.
  // Geometry is shared, with no texture allocation per frame.
  const unisonMask=new THREE.Group();unisonMask.name='all-performers-share-ringmaster-face';
  head.add(unisonMask);unisonMask.visible=false;
  oval(unisonMask,mat.ivory,'unison-ringmaster-ivory-face',0,0,.52,.43,.50,.22);
  for(const side of [-1,1]){
   oval(unisonMask,mat.black,'unison-unblinking-eyes',side*.19,.13,.72,.115,.154,.045);
   const grin=oval(unisonMask,mat.crimson,'unison-stretched-crimson-smile',
     side*.17,-.27,.754,.20,.036,.027);grin.rotation.z=side*.20;
  }
  oval(unisonMask,mat.crimson,'unison-crooked-blood-red-nose',0,-.08,.77,.115,.085,.056);
  oval(unisonMask,mat.black,'unison-too-wide-locked-smile',0,-.34,.752,.33,.045,.027);

  if(role==='chorister'){
   const hood=add(head,new THREE.ConeGeometry(.55,.95,coarse?12:22),clothes,'open-hood-and-choir-veil',0,.30,-.13);
   hood.rotation.x=-.11;
   for(let i=0;i<3;i++){const ring=add(head,new THREE.TorusGeometry(.30+i*.11,.017,6,coarse?14:36),mat.gilt,'harmonic-voice-ring',0,.03,.51+i*.05);ring.visible=true;}
  }
  if(role==='puppeteer'){
   for(const s of [-1,1]){
    const line=add(body,new THREE.CylinderGeometry(.008,.008,1.8,4),mat.gilt,'puppet-control-string',s*.8,.18,.50);strings.push(line);
    const puppet=oval(body,mat.ivory,'hanging-doll-face',s*.8,-.66,.50,.22,.28,.15);strings.push(puppet);
   }
  }
  if(role==='firekeeper'){
   for(const s of [-1,1]){
    const torch=add(body,new THREE.CylinderGeometry(.08,.12,1.2,10),mat.gilt,'burning-circus-torch',s*.79,1.62,.25);
    const flame=add(body,new THREE.ConeGeometry(.27,.9,coarse?8:16),mat.ember,'actual-visible-fire-cue',s*.79,2.62,.25);
    fire.push(flame);
   }
  }
  if(role==='acrobat'){
   const wreath=add(body,new THREE.TorusGeometry(1.06,.06,8,coarse?24:52),mat.gilt,'rear-acrobat-hoop',0,1.55,-.33);
   wreath.rotation.y=.3;
   oval(body,mat.crimson,'harlequin-shoulder-pennant',-.72,1.75,-.12,.23,.25,.40);
  }
  if(role==='strongman'){
   // Physically gripped cudgel attached to the right arm's animated joint.
   const right=shoulders[1];
   const grip=add(right,new THREE.CylinderGeometry(.075,.095,1.45,coarse?8:13),
    mat.gilt,'strongman-held-cudgel-handle',.17,-1.19,.38);
   grip.rotation.x=.25;
   const club=add(right,new THREE.CylinderGeometry(.41,.48,.8,coarse?10:18),
    mat.black,'strongman-weighted-stage-mallet',.17,-1.91,.49);
   club.rotation.z=Math.PI/2;
   for(const side of[-1,1])oval(body,mat.gilt,'strongman-heavy-shoulder-plate',
    side*.58,1.95,0,.27,.29,.28);
  }
  if(role==='bladeDancer'){
   for(const side of[-1,1]){
    const hand=shoulders[side>0?1:0];
    const guard=add(hand,new THREE.CylinderGeometry(.16,.16,.11,8),
     mat.gilt,'blade-dancer-handguard',side*.19,-.77,.24);
    guard.rotation.z=Math.PI/2;
    const blade=add(hand,new THREE.ConeGeometry(.15,1.22,coarse?6:12),
     mat.ivory,'blade-dancer-handheld-scythe',side*.2,-1.36,.41);
    blade.rotation.x=-.42;blade.rotation.z=side*.13;
   }
   const plume=add(head,new THREE.ConeGeometry(.34,.9,coarse?8:14),mat.crimson,
    'blade-dancer-torn-feather-plume',0,.76,-.12);
   plume.rotation.z=.28;
  }
  if(role==='mimic'){
   const hat=add(head,new THREE.CylinderGeometry(.29,.43,.75,coarse?12:24),mat.black,'false-ringmaster-tall-hat',0,.88,-.1);
   hat.rotation.z=-.1;
   add(head,new THREE.CylinderGeometry(.66,.66,.045,coarse?15:28),mat.gilt,'false-ringmaster-hat-brim',0,.53,-.1);
   const wing=add(body,new THREE.ConeGeometry(.62,1.4,coarse?8:15,1,true),mat.crimson,'false-ringmaster-short-coat',0,.63,-.35);
   wing.rotation.x=-.18;
  }
  // Real stage instruments remain attached to the skinned performer, not a
  // free-floating attack visual. Hide them outside the authored show pose.
  const props={};
  if(role==='acrobat'){
   const drum=new THREE.Group();drum.name='antique-circus-drum-and-sticks';body.add(drum);
   const barrel=add(drum,new THREE.CylinderGeometry(.55,.55,.42,coarse?10:22),mat.crimson,'real-drum-barrel',0,1.10,.6);
   barrel.rotation.x=Math.PI/2;
   add(drum,new THREE.TorusGeometry(.55,.05,6,coarse?16:32),mat.gilt,'aged-drum-rim',0,1.10,.85);
   for(const side of[-1,1]){const stick=add(drum,new THREE.CylinderGeometry(.025,.03,.8,6),mat.gilt,
     'beating-drumstick',side*.3,1.85,.45);stick.rotation.x=.6;}
   drum.visible=false;props.drum=drum;
   const blades=[];
   for(let i=0;i<3;i++){
    const blade=add(body,new THREE.ConeGeometry(.09,.62,coarse?5:9),mat.gilt,'juggled-metal-knife');
    blade.visible=false;blades.push(blade);
   }
   props.blades=blades;
   const trapeze=new THREE.Group();trapeze.name='high-wire-trapeze-bar-and-ropes';body.add(trapeze);
   for(const side of[-1,1])add(trapeze,new THREE.CylinderGeometry(.025,.025,2.5,6),mat.gilt,
     'trapeze-rigged-rope',side*.78,3.0,.15);
   const bar=add(trapeze,new THREE.CylinderGeometry(.055,.055,1.55,8),mat.gilt,
     'trapeze-handheld-bar',0,1.75,.15);bar.rotation.z=Math.PI/2;
   trapeze.visible=false;props.trapeze=trapeze;
  }
  if(role==='mimic'){
   const cannon=new THREE.Group();cannon.name='forged-circus-cannon';body.add(cannon);
   const gun=add(cannon,new THREE.CylinderGeometry(.35,.5,1.42,coarse?12:24),mat.gilt,
     'iron-cannon-barrel',0,1.09,1.15);gun.rotation.x=Math.PI/2;
   add(cannon,new THREE.TorusGeometry(.4,.06,8,coarse?20:40),mat.black,
    'cannon-muzzle-lip',0,1.09,1.88);
   cannon.visible=false;props.cannon=cannon;
  }
  if(role==='chorister'){
   const candles=new THREE.Group();candles.name='choir-real-candle-pair';body.add(candles);
   for(const side of[-1,1]){
    add(candles,new THREE.CylinderGeometry(.075,.085,.6,7),mat.ivory,
      'melted-choir-candle',side*.66,1.36,.58);
    add(candles,new THREE.ConeGeometry(.12,.36,coarse?5:9),mat.ember,
      'flickering-candle-flame',side*.66,1.86,.58);
   }
   candles.visible=false;props.candles=candles;
  }
  if(role==='firekeeper'){
   const hoop=new THREE.Group();hoop.name='raised-ringmasters-fire-hoop';body.add(hoop);
   add(hoop,new THREE.TorusGeometry(.94,.09,8,coarse?20:42),mat.gilt,
      'antique-iron-fire-hoop',0,2.2,.65);
   hoop.visible=false;props.hoop=hoop;
  }
  // Newly summoned performers receive the same prefiltered PBR maps and
  // physically based environment shading as the boss, once at entrance.
  if(typeof onActorCreated==='function')onActorCreated(group);
  return {group,body,head,jaw,mask,seal,cracks,unisonMask,torso,shoulders,legs,fire,strings,skirt,springs,props,yaw:null,role};
 }
 // Build the anticipated stage-one and stage-two cast while the loading veil
 // is present. Never create a full performer rig on the first attack frame.
 function prewarm(){
  if(prepared)return;
  prepared=true;
  for(const role of prewarmRoles){
   const v=actor(role);v.group.visible=false;
   if(!standby.has(role))standby.set(role,[]);
   standby.get(role).push(v);
  }
 }
 function prepareGpuWarmup(){
  prewarm();preview=true;
  for(const stack of standby.values())for(const v of stack){
   v.group.visible=true;v.group.position.set(0,0,0);v.group.scale.setScalar(.85);
  }
 }
 function finishGpuWarmup(){
  preview=false;
  for(const stack of standby.values())for(const v of stack)v.group.visible=false;
 }
 function take(role){
  const stack=standby.get(role);
  return stack?.length?stack.pop():actor(role);
 }
 function createHoop(z){
  const group=new THREE.Group();group.name='real-infernal-hoop-performance-cue';root.add(group);
  const material=new THREE.MeshBasicMaterial({color:0xf08145,transparent:true,opacity:.64,side:THREE.DoubleSide,depthWrite:false});
  const ring=add(group,new THREE.TorusGeometry(1,.10,8,coarse?28:54),material,'vertical-flame-arc');ring.rotation.y=.28;
  const core=add(group,new THREE.TorusGeometry(.89,.035,6,coarse?26:52),new THREE.MeshBasicMaterial({
   color:0xffdf8b,transparent:true,opacity:.72,depthWrite:false}),'bright-hot-hoop-interior');
  // Low-drawcall flaring flames: only a single instanced render batch.
  const count=coarse?12:22,flameGeo=new THREE.ConeGeometry(.11,.54,5),
   flameMat=new THREE.MeshBasicMaterial({color:0xffa45d,transparent:true,
    opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,toneMapped:false}),
   tongues=new THREE.InstancedMesh(flameGeo,flameMat,count);
  tongues.name='individually-flaring-circus-fire-tongues';
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),direction=new THREE.Vector3(),
   quat=new THREE.Quaternion(),scale=new THREE.Vector3(),upAxis=new THREE.Vector3(0,1,0);
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count,r=1.02+(i%3)*.038;
   point.set(Math.cos(a)*r,Math.sin(a)*r,0);
   direction.set(Math.cos(a),Math.sin(a),0);
   quat.setFromUnitVectors(upAxis,direction);
   scale.set(.76+(i%3)*.15,.86+(i%4)*.12,1);
   matrix.compose(point,quat,scale);tongues.setMatrixAt(i,matrix);
  }
  tongues.instanceMatrix.needsUpdate=true;
  tongues.frustumCulled=false;tongues.renderOrder=5;group.add(tongues);
  return {group,ring,core,tongues};
 }
 // A brief, low-drawcall sculptural "second life" for the actual dead cast.
 // These marionettes are scenery: no physics collider, HP or autonomous AI.
 function createRepriseGhost(snapshot){
  const group=new THREE.Group();group.name='dead-performer-lifted-on-strings';
  group.userData.decorativeOnly=true;root.add(group);
  const body=new THREE.Group();group.add(body);
  const cloth=snapshot.role==='acrobat'?mat.cyan:snapshot.role==='firekeeper'?mat.crimson:mat.velvet;
  oval(body,cloth,'creased-corpse-costume',0,1.36,0,.52,.77,.32);
  const face=oval(body,mat.ivory,'fractured-dead-performer-face',0,2.32,.18,.40,.50,.26);
  face.rotation.z=.15;
  for(const side of [-1,1]){
   oval(body,mat.black,'motionless-corpse-eye-socket',side*.18,2.46,.40,.115,.14,.035);
   const tear=oval(body,mat.crimson,'marionette-death-mask-crack',side*.2,2.14,.41,.017,.24,.02);
   tear.rotation.z=side*.25;
  }
  const arms=[],legs=[],wires=[];
  for(const side of [-1,1]){
   const upper=tube(body,cloth,'reanimated-corpse-upper-arm',0,0,0,.15,1),
     lower=tube(body,mat.ivory,'reanimated-corpse-glove',0,0,0,.13,1),
     thigh=tube(body,mat.black,'reanimated-corpse-thigh',0,0,0,.18,1),
     shin=tube(body,cloth,'reanimated-corpse-shin',0,0,0,.145,1);
   arms.push({side,upper,lower});legs.push({side,thigh,shin});
   wires.push(tube(group,mat.gilt,'visible-strings-lifting-dead-performer',0,0,0,.012,1));
  }
  const neckWire=tube(group,mat.gilt,'face-controlled-by-ceiling-wire',0,0,0,.015,1);
  return {group,body,arms,legs,wires,neckWire};
 }
 const easing=n=>{const a=Math.max(0,Math.min(1,n));return a*a*(3-2*a)};
 function updateRepriseGhosts(g){
  const troupe=g?.clown?.troupe,reprise=troupe?.reprise,
   t=g?.clown?.time||0,seen=new Set();
  if(reprise&&t>=reprise.start&&t<reprise.end){
   const elapsed=t-reprise.start,total=reprise.end-reprise.start;
   const rise=easing((elapsed-.22)/1.18),drop=1-easing((elapsed-(total-1.0))/.9);
   for(const corpse of reprise.bodies){
    const key=reprise.start+'-'+corpse.id;
    seen.add(key);
    let v=puppetGhosts.get(key);
    if(!v){v=createRepriseGhost(corpse);puppetGhosts.set(key,v);}
    const pulse=rise*drop,
      snap=Math.sin(Math.max(0,elapsed-1.0)*4.8+corpse.order*.42),
      jerk=Math.pow(Math.abs(snap),9);
    v.group.position.set(corpse.x,-.08*(1-rise),corpse.z);
    v.group.rotation.y=corpse.yaw||0;
    v.group.visible=drop>.001;
    v.group.scale.setScalar(Math.max(.025,.76+.17*drop));
    // The corpse starts folded face-down. The taut strings haul the ribcage
    // upward in delayed, jointed steps, then cut loose at the show's end.
    v.body.rotation.set(1.14*(1-rise)-.08*pulse*jerk,0,.12*(1-rise)+
      .08*pulse*Math.sin(elapsed*3.1));
    v.body.position.y=-.25*(1-rise)+.16*pulse*jerk;
    for(let i=0;i<2;i++){
     const side=i?1:-1,arm=v.arms[i],leg=v.legs[i],
      shoulder=[side*.51,1.89,0],
      elbow=[side*.90,1.32+rise*.22,.13],
      wrist=[side*(1.07+.23*jerk),1.88+.52*pulse*jerk,.53];
     bone(arm.upper,shoulder,elbow);
     bone(arm.lower,elbow,wrist);
     const hip=[side*.3,.91,0],knee=[side*.36,.47,.26],
      ankle=[side*.34,.17,.27];
     bone(leg.thigh,hip,knee);bone(leg.shin,knee,ankle);
     bone(v.wires[i],[side*.52,6.0,.08],[
      side*(1.07+.23*jerk),1.88+.52*pulse*jerk,.53]);
    }
    bone(v.neckWire,[0,6.45,0],[0,2.84,.2]);
   }
  }
  for(const [key,v] of puppetGhosts)if(!seen.has(key)){
   root.remove(v.group);puppetGhosts.delete(key);
   // All puppet props use the shared sphere and cylinder geometries.
  }
 }
 function update(g,dt=1/60){
  const troupe=g?.clown?.troupe,alive=(troupe?.members||[]).filter(m=>!m.legacy),seen=new Set(),time=g?.time||0,
   uncanny=circusUncannyFrame(g),h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  for(const m of alive){
   seen.add(m.id);let v=live.get(m.id);if(!v){v=take(m.role);live.set(m.id,v);}
   const sway=(reduced?0:Math.sin(time*2.5+m.id*.9))*.06,
    routine=troupeBeatMotion(m,g.clown?.time||0),style=ENSEMBLE_DISPLAY_STYLE[routine.pose]||{lift:0,lean:0},
    choirRise=m.role==='chorister'&&routine.pose==='sing'?routine.weight:0;
   v.group.position.set(m.x,Math.max(0,(m.down?-.22*Math.min(1,m.death/.6):0)),m.z);
   // Curtains reveal newly summoned actors over several frames instead of
   // snapping fully formed NPCs into existence on top of the player.
   v.group.scale.setScalar(Math.min(1,Math.max(.025,m.age/.45))*(m.down?1-.25*Math.min(1,m.death):1));
   v.yaw=v.yaw===null?m.yaw:smoothYaw(v.yaw,m.yaw,h,m.cast>0?25:14);
   v.group.rotation.y=v.yaw;
   v.group.visible=!m.down||m.death<1.45;
   const moving=Math.min(1,Math.hypot(m.vx,m.vz)/Math.max(1,CIRCUS_ROLES[m.role].speed));
   v.body.position.y=v.springs.step('pelvis-rise',m.down?-Math.min(1,m.death*2)*.35:
    sway+moving*.035+style.lift*routine.weight,h,14);
   v.body.rotation.set(
    v.springs.step('pitch',m.down?Math.min(1.2,m.death*3):
     style.lean*routine.weight+((routine.pose==='crush'||routine.pose==='slash')&&routine.elapsed>=routine.wind?.40*routine.weight:0)+(m.cast>0?-.07:0)-moving*.065,h,15),0,
    v.springs.step('roll',m.down?Math.min(.8,m.death*1.2):
     sway*.4+(m.motionLean||0)+(routine.pose==='mirror'?.18*routine.weight*routine.beat:0),h,12));
   v.skirt.rotation.x=v.springs.step('skirt',-.05+moving*.2+m.cast*.024,h,9);
   v.torso.scale.x=m.role==='strongman'?.74:.56;
    v.torso.scale.y=(m.role==='strongman'?1.14:.9)*(1+.18*choirRise*(.45+.55*Math.abs(routine.beat)));
   v.head.scale.set(1+.055*choirRise,1+.10*choirRise,1+.04*choirRise);
   for(let i=0;i<2;i++){
    const side=i?1:-1,L=v.legs[i],phase=circusFootPhasing(m.step*3.0,moving,side),
      hip=[side*.30,.92,0];
    // Do not rely on a long capsule as a fake leg. Plant the actual shoe
    // after all parent transforms; swing toes leave the floor voluntarily.
    v.body.updateWorldMatrix(true,false);
    const target=stageFootTarget([side*.31,.16+phase.lift,phase.travel],
      point=>v.body.localToWorld(new THREE.Vector3(...point)).toArray(),
      point=>v.body.worldToLocal(new THREE.Vector3(...point)).toArray(),
      {floor:0,soleRadius:.15,worldScale:v.group.scale.y,plant:phase.support&&!m.down});
    const rig=solveFixedLimb(hip,target,{
      upper:.53,lower:.51,pole:[side*.34,.03,.36]});
    bone(L.thigh,rig.start,rig.joint);bone(L.shin,rig.joint,rig.end);
    L.knee.position.set(...rig.joint);L.shoe.position.set(...rig.end);
    // Keep the toe more horizontal on stage and tilt during the airborne step.
    L.shoe.rotation.x=v.springs.step('toe-'+side,phase.lift>0?-.21*phase.lift/Math.max(.02,.23):0,h,16)-v.body.rotation.x;
    const arm=v.shoulders[i];
    const pose=routine.pose,weight=routine.weight,accent=routine.beat;
    let spread=side*(m.cast>0?-.56:Math.sin(time*1.8+side)*.14),
      reach=m.cast>0?-.65:Math.sin(m.step*3.0+side*Math.PI)*.16*moving;
    if(pose==='juggle'){spread=side*(-.54-.25*weight);reach=-(1.2+accent*(side>0?1:-1)*.55)*weight;}
    else if(pose==='drum'){spread=side*(-.35-.32*weight);reach=(-1.1+.70*Math.max(0,accent)) *weight;}
    else if(pose==='vault'){spread=side*(-1.3*weight);reach=(-.75+.3*accent)*weight;}
    else if(pose==='strings'||pose==='trapdoor'){spread=side*(-.7*weight);reach=-1.8*weight+.12*accent;}
    else if(pose==='sing'||pose==='finale'){spread=side*(-1.1*weight);reach=(-.72+.18*accent)*weight;}
    else if(pose==='hoop'){spread=side*(-.7*weight);reach=(-1.75+.13*accent)*weight;}
    else if(pose==='mirror'){spread=side*(-1.15*weight);reach=(-.98+.25*accent)*weight;}
    else if(pose==='crush'){
     const nextBlow=m.melee?.impacts.find(at=>at>routine.elapsed);
     const raising=nextBlow!==undefined&&nextBlow-routine.elapsed<.55;
     const released=routine.elapsed>=routine.wind&&!raising;
     spread=side*(-.3-.2*weight);reach=(raising||!released?-2.1:.48)*weight;
    }
    else if(pose==='slash'){
     const nextBlow=m.melee?.impacts.find(at=>at>routine.elapsed);
     const raising=nextBlow!==undefined&&nextBlow-routine.elapsed<.48;
     const released=routine.elapsed>=routine.wind&&!raising;
     spread=side*(-.48-.38*weight);reach=(raising||!released?-1.65:-.12)*weight+
      (side>0?1:-1)*accent*.30*weight;
    }
    else if(pose==='cannon'){spread=side*(-.35*weight);reach=(-.85+.15*accent)*weight;}
    else if(pose==='curtain'){spread=side*(-1.35*weight);reach=(-.70+.14*accent)*weight;}
    arm.rotation.z=v.springs.step('arm-spread-'+side,spread,h,16);
    arm.rotation.x=v.springs.step('arm-reach-'+side,reach,h,17);
   }
   v.head.rotation.x=v.springs.step('mask-head',m.cast>0?-.17:Math.sin(time*.8+m.id)*.055-moving*.055,h,12);
   v.head.rotation.z=v.springs.step('mask-performer-tilt',
    uncanny.hush*.25+uncanny.unison*.19+
    (routine.pose==='mirror'?.24*routine.weight:
    routine.pose==='sing'?.09*routine.beat*routine.weight:0),h,11);
   v.head.rotation.y=v.springs.step('unison-neck-turn',
    uncanny.hush*-.34+uncanny.unison*.32+(routine.weight<.02?Math.sin(time*.9+m.id)*.14:0),h,16);
   // The mouth geometry's authored Y radius is .08, not 1. The old
   // assignment inflated singers' mouths into a giant slab on every note.
   const mouthless=m.role==='chorister'&&(troupe?.stage||1)>=2;
   v.jaw.visible=!mouthless;
   v.jaw.scale.y=.08*(1+(m.cast>0?1.1:0));
   if(v.seal)v.seal.visible=mouthless;
   for(const crack of v.cracks){
    crack.visible=mouthless&&choirRise>.20;
    crack.scale.y=.06*(.7+3.8*choirRise*Math.max(.10,Math.abs(routine.beat)));
   }
   const maskChange=uncanny.face;
   v.unisonMask.visible=maskChange>.005;
   v.unisonMask.scale.set(.2+.8*maskChange,.15+.85*maskChange,.2+.8*maskChange);
   v.mask.visible=maskChange<.96;
   v.unisonMask.rotation.z=Math.sin(time*1.2)*.025*maskChange;
   for(const f of v.fire)f.scale.y=1+(reduced?0:Math.sin(time*8+m.id)*.10);
   if(m.flash>0)v.mask.material=mat.ember;else v.mask.material=mat.ivory;
   for(const s of v.strings)s.rotation.z=Math.sin(time*3+m.id)*.03;
   const pose=routine.pose;
   if(v.props.drum){
    v.props.drum.visible=pose==='drum';
    v.props.drum.rotation.x=.03*routine.beat*routine.weight;
   }
   for(let i=0;i<(v.props.blades?.length||0);i++){
    const blade=v.props.blades[i];blade.visible=pose==='juggle';
    if(blade.visible){const angle=time*5+i*2*Math.PI/3;
     blade.position.set(Math.sin(angle)*.75,2.7+Math.cos(angle)*.55,.8);
     blade.rotation.set(time*6+i,time*4+i,Math.sin(angle));
    }
   }
   if(v.props.trapeze){v.props.trapeze.visible=pose==='vault';
    v.props.trapeze.rotation.x=Math.sin(time*2.8)*.14*routine.weight;}
   if(v.props.cannon){v.props.cannon.visible=pose==='cannon';
    v.props.cannon.rotation.x=Math.sin(time*3.7)*.06*routine.weight;}
   if(v.props.candles){v.props.candles.visible=pose==='sing';
    v.props.candles.rotation.z=Math.sin(time*2.4)*.04*routine.weight;}
   if(v.props.hoop){v.props.hoop.visible=pose==='hoop';
    v.props.hoop.rotation.z=Math.sin(time*2.5)*.11*routine.weight;}
  }
  for(const [id,v] of live)if(!seen.has(id)){
   v.group.visible=false;live.delete(id);
   if(!standby.has(v.role))standby.set(v.role,[]);
   // Reuse the whole rig and its GPU resources when the next actor enters.
   // Pool size is bounded by the live/reinforcement cap, no per-phase remesh.
   standby.get(v.role).push(v);
  }
  const hoopSet=new Set();
  for(const z of g?.clown?.zones||[]){
   if(z.sound!=='infernalHoops'||z.state!=='warn')continue;
   hoopSet.add(z.id);let v=hoops.get(z.id);if(!v){v=createHoop(z);hoops.set(z.id,v);}
   const progress=Math.min(1,z.age/Math.max(.1,z.warn));
   v.group.position.set(z.x,2.0+Math.sin(progress*Math.PI)*1.0,z.z);
   v.group.rotation.y=time*.55;v.group.scale.setScalar(Math.min(2.0,(z.r||2.0)*.43));
   v.ring.material.opacity=.30+.52*progress;
   v.group.rotation.z=Math.sin(time*1.35+z.id)*.055;
   v.tongues.material.opacity=(reduced?.55:.72)*(.55+.45*progress);
  }
  for(const [id,v] of hoops)if(!hoopSet.has(id)){
   root.remove(v.group);disposeScene(v.group);hoops.delete(id);
  }
  updateRepriseGhosts(g);
  theatreCues.update(g,h);
 }
 function dispose(){
  live.clear();standby.clear();hoops.clear();puppetGhosts.clear();
  theatreCues.dispose();root.parent?.remove(root);disposeScene(root);
  geo.dispose();cylinder.dispose();for(const x of Object.values(mat))x.dispose();
 }
 return {root,update,prewarm,prepareGpuWarmup,finishGpuWarmup,dispose,
  stats:()=>({performers:live.size,pooled:[...standby.values()].reduce((n,a)=>n+a.length,0),
   ghostPuppets:puppetGhosts.size,hoops:hoops.size,airCues:theatreCues.stats().active})};
}
