import * as THREE from 'three';
import {runThreeStartup} from './runtime/three-startup.mjs';
import {clownFaceCanvas} from './clown-head.mjs';
import {clownPhase2Beat} from './clown-phase2-score.mjs';
import {CLOWN_FACE} from './clown-face.mjs';
import {clownBeastPose,clownBeastPaw} from './clown-beast-pose.mjs';
import {clownContactFrame} from './clown-grounded-physics.mjs';
import {ringmasterPerformance,ringmasterGesture} from './clown-ringmaster-pose.mjs';
import {createClownGait} from './clown-gait.mjs';
import {createClownMarionetteCross} from './clown-marionette-cross.mjs';
import {solveFixedLimb,smoothYaw,stageFootTarget} from './clown-performance-rig.mjs';
import {createSpringBank} from './secondary-physics.mjs';
// The original *recognizable O Seulwoo portrait* belongs on the real
// ringmaster's curved, articulated 3D face, never on a projectile or a flat
// camera-facing billboard. The head-and-body rig remains grounded.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
export function createClownActor({coarse=false}={}){
 return runThreeStartup(THREE,(T)=>{
 const root=new T.Group();root.name='seulwoo-ringmaster-rebuilt';
 const body=new T.Group();body.name='seulwoo-grounded-physical-rig';root.add(body);
 const velvet=new T.MeshPhysicalMaterial({color:0x32111e,roughness:.94,sheen:.58,sheenColor:0x723040,side:T.DoubleSide});
 const crimson=new T.MeshPhysicalMaterial({color:0x7d2433,roughness:.90,sheen:.43,sheenColor:0x9f4752,side:T.DoubleSide});
 const lining=new T.MeshStandardMaterial({color:0x15131e,roughness:.96,side:T.DoubleSide});
 const bone=new T.MeshPhysicalMaterial({color:0xbeb3a3,roughness:.78,sheen:.08});
 const chalk=new T.MeshPhysicalMaterial({color:0xdbcfbe,roughness:.87,clearcoat:.12,clearcoatRoughness:.88});
 const metal=new T.MeshStandardMaterial({color:0xa5875b,roughness:.43,metalness:.76});
 const leather=new T.MeshStandardMaterial({color:0x171116,roughness:.88});
 const black=new T.MeshStandardMaterial({color:0x100f16,roughness:.36,metalness:.13});
 const voidMat=new T.MeshStandardMaterial({color:0x0c090f,roughness:.85});
 const eyeMat=new T.MeshPhysicalMaterial({color:0xe7c6a5,roughness:.12,metalness:0,clearcoat:.8,clearcoatRoughness:.08,emissive:0x3a160e,emissiveIntensity:.45});
 const blood=new T.MeshStandardMaterial({color:0x702336,roughness:.78});
 const sphere=new T.SphereGeometry(1,coarse?14:32,coarse?10:22);
 const cylinder=new T.CylinderGeometry(1,1,1,coarse?10:20,1);
 const up=new T.Vector3(0,1,0),from=new T.Vector3(),to=new T.Vector3(),delta=new T.Vector3();
 const add=(parent,geo,mat,name,x=0,y=0,z=0)=>{
  const m=new T.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);
   m.castShadow=!coarse&&/torso|waist|skull|porcelain-face|tall-hat|upper-arm|forearm|trouser|calf|stage-shoe|coat-tail/.test(name);
   m.receiveShadow=false;parent.add(m);return m;
 };
 const blob=(parent,mat,name,pos,scale)=>{const m=add(parent,sphere,mat,name,...pos);m.scale.set(...scale);return m;};
 const rod=(parent,mat,name,r1,r2)=>add(parent,new T.CylinderGeometry(r1,r2,1,coarse?8:16),mat,name);
 function link(m,A,B){from.set(...A);to.set(...B);delta.copy(to).sub(from);m.position.copy(from).add(to).multiplyScalar(.5);
  m.scale.y=Math.max(.001,delta.length());m.quaternion.setFromUnitVectors(up,delta.normalize());}
 const makeCurve=(parent,points,r,mat,name)=>{
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  return add(parent,new T.TubeGeometry(curve,Math.max(10,points.length*5),r,coarse?5:8,false),mat,name);
 };
 // Heavy sculpted coat: silhouette is a taper, not cylinders stacked in space.
 const chest=add(body,new T.LatheGeometry([
   [0,0],[.65,.03],[.88,.30],[.80,.85],[.72,1.42],
   [.94,1.87],[.86,2.24],[.41,2.46],[0,2.52]
  ].map(([r,y])=>new T.Vector2(r,y)),coarse?28:56),velvet,'tailored-velvet-torso',0,1.45,0);
 chest.scale.z=.77;
 const pelvis=blob(body,velvet,'waist-and-hips',[0,1.65,0],[.69,.48,.47]);
 // Separate cloth tails pivot at the waist, with inertia and a visible lining.
 const tails=[];
 for(const side of [-1,1]){
  for(const [i,shade] of [[0,velvet],[1,crimson]]){
   const pivot=new T.Group();pivot.position.set(side*(.38+i*.17),2.10,i?-.23:-.42);body.add(pivot);
   const shape=new T.Shape();shape.moveTo(-.22,0);shape.lineTo(.30,0);shape.lineTo(side*.39,-1.5-i*.2);shape.quadraticCurveTo(-.28,-2.18-i*.16,-.37,-1.47);shape.closePath();
   const flap=add(pivot,new T.ShapeGeometry(shape,coarse?6:16),shade,'independently-rigged-coat-tail');
   flap.position.z=i?-.055:0;tails.push({pivot,side,i});
  }
 }
 // Front panels with controlled angular design, stitched cuffs and gilt braid.
 for(const side of [-1,1]){
  const lapel=new T.Shape();lapel.moveTo(side*.10,3.77);lapel.lineTo(side*.82,3.58);
  lapel.lineTo(side*.44,2.76);lapel.lineTo(side*.19,2.15);lapel.lineTo(side*.30,3.1);lapel.closePath();
  const panel=add(body,new T.ShapeGeometry(lapel),side<0?crimson:bone,'asymmetric-tailcoat-lapel',0,0,.66);
  panel.material.side=T.DoubleSide;
  makeCurve(body,[[side*.64,3.58,.47],[side*.48,3.11,.64],[side*.30,2.45,.63]],
    .035,metal,'tailcoat-gold-hand-stitched-piping');
  blob(body,metal,'engraved-epaulette',[side*.85,3.65,0],[.40,.15,.55]);
 }
 for(let i=0;i<4;i++)blob(body,metal,'aged-brass-coat-button',[.17,2.05+i*.37,.67],[.065,.065,.042]);
  // Narrow layered stitch seams read as fabric under raking stage light.
  // They use real mesh depth rather than a flat coloured decal.
  for(const s of[-1,1])for(let i=0;i<7;i++){
   const h=1.66+i*.29,r=.74+(i>3?-.05:0);
   const stitch=blob(body,i%3===0?metal:lining,'hand-stitched-velvet-coat-seam',
    [s*r,h,.23],[.013,.032,.023]);stitch.rotation.z=s*.22;
  }
 makeCurve(body,[[-.46,3.78,.12],[0,3.96,.10],[.46,3.78,.12]],.09,bone,'frayed-stage-collar');
 // Authentic head proportions with its own brow, nose, jaw, mask and hair.
 const neck=blob(body,bone,'long-exposed-neck',[0,4.18,0],[.20,.53,.22]);
 const head=new T.Group();head.name='sculpted-ringmaster-face';head.position.set(0,4.73,0);body.add(head);
 blob(head,leather,'slick-back-skull',[0,0,-.08],[.76,.99,.62]);
 const porcelainFace=blob(head,chalk,'hand-sculpted-porcelain-face',[0,-.025,.14],[.68,.89,.49]);
 const portraitSuppress=[];
 const brow=blob(head,bone,'furrowed-brow',[0,.40,.51],[.58,.16,.14]);brow.rotation.z=-.07;
 portraitSuppress.push(brow);
 for(const side of [-1,1]){
  const socket=blob(head,voidMat,'sunken-eye-socket',[side*.31,.22,.552],[.245,.24,.09]);socket.rotation.z=side*.13;
  portraitSuppress.push(socket);
  portraitSuppress.push(blob(head,eyeMat,'asymmetric-amber-glassy-eye',[side*.30,.21,.626],[side<0?.075:.093,.097,.04]));
  portraitSuppress.push(blob(head,black,'constricted-pupil',[side*.30,.21,.665],[.039,.06,.017]));
  blob(head,blood,'cracked-red-tear-paint',[side*.37,-.11,.576],[.045,.27,.018]);
  makeCurve(head,[[side*.43,-.28,.48],[side*.57,-.52,.34],[side*.48,-.67,.27]],
    .018,blood,'hairline-porcelain-crack');
  for(let n=0;n<5;n++){
   const tuft=blob(head,black,'swept-back-hair-strand',[side*(.15+n*.10),.64+(n%2)*.13,-.12-n*.03],[.10,.40,.18]);
   tuft.rotation.z=side*(.25+n*.09);
  }
 }
 portraitSuppress.push(blob(head,velvet,'long-crooked-nose',[.02,-.04,.61],[.14,.20,.17]));
 portraitSuppress.push(blob(head,blood,'red-nose-scar',[.02,-.15,.72],[.11,.065,.05]));
 const jaw=new T.Group();jaw.position.set(0,-.45,.28);head.add(jaw);
 blob(jaw,voidMat,'deep-open-grin',[0,-.10,.32],[.43,.27,.11]);
 blob(jaw,chalk,'lower-porcelain-jaw',[0,-.30,.30],[.43,.15,.24]);
 portraitSuppress.push(makeCurve(head,[[-.53,-.31,.45],[-.27,-.49,.60],[0,-.54,.62],[.27,-.49,.60],[.53,-.31,.45]],.052,blood,'painted-permanent-grin'));
 for(let i=0;i<9;i++){const x=(i-4)*.081;
  const tooth=add(jaw,new T.ConeGeometry(.039,.17,coarse?5:9),bone,'uneven-individual-tooth',x,-.11,.423);
  tooth.rotation.z=i%2?.09:-.05;
 }
 // The source is the original face already bundled in this repository.
 // Wrap it onto a FRONT HEMISPHERE of the actual sculpted face. The curved
 // vertex normals share the skull's coordinate system, so every turn, jaw
 // motion and cutscene keeps the human face attached in world 3D space.
 const patchGeo=new T.SphereGeometry(1,coarse?28:56,coarse?20:42,0,Math.PI);
 const uv=patchGeo.attributes.uv,pos=patchGeo.attributes.position;
 const {crop}=CLOWN_FACE;
 for(let i=0;i<pos.count;i++){
  const X=pos.getX(i),Y=pos.getY(i);
  const u=crop.x0+(crop.x1-crop.x0)*(.5+.5*X);
  const v=1-(crop.y0+(crop.y1-crop.y0)*(.5-.5*Y));
  uv.setXY(i,u,v);
 }
 uv.needsUpdate=true;
 const portraitMaterial=new T.MeshPhysicalMaterial({
  color:0xffffff,roughness:.87,metalness:0,clearcoat:.06,
  transparent:true,alphaTest:.075,side:T.FrontSide,depthWrite:true,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
 });
 const portrait=new T.Mesh(patchGeo,portraitMaterial);
 portrait.name='o-seulwoo-original-face-curved-uv-skin';
 portrait.position.set(0,-.025,.14);
 portrait.scale.set(.687,.897,.499);
 portrait.castShadow=!coarse;portrait.visible=false;
 head.add(portrait);
 // A feathered photographic complexion blends naturally into the sculpted
 // cheek and jaw. No paper plane, billboard or entire sphere photo sticker.
 let portraitTexture=null,portraitDisposed=false;
 const portraitReady=clownFaceCanvas().then(source=>{
  if(!source||portraitDisposed||typeof document==='undefined')return false;
  const canvas=document.createElement('canvas');
  canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d');if(!ctx)return false;
  ctx.drawImage(source,0,0);
  const image=ctx.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const u=((x+.5)/w-crop.x0)/(crop.x1-crop.x0);
   const v=((y+.5)/h-crop.y0)/(crop.y1-crop.y0);
   const edge=Math.min(u,1-u,v,1-v),f=Math.max(0,Math.min(1,edge/.135));
   const feather=f*f*(3-2*f);
   image.data[(y*w+x)*4+3]=Math.round(image.data[(y*w+x)*4+3]*feather);
  }
  ctx.putImageData(image,0,0);
  if(portraitDisposed)return false;
  portraitTexture=new T.CanvasTexture(canvas);
  portraitTexture.colorSpace=T.SRGBColorSpace;
  portraitTexture.anisotropy=coarse?1:4;
  portraitMaterial.map=portraitTexture;
  portraitMaterial.needsUpdate=true;
  portrait.visible=true;
  // The original photographed eyes are authoritative. Do not paint a
  // second set of pupils over the recognizable human face.
  for(const detail of portraitSuppress)detail.visible=false;
  return true;
 }).catch(()=>false);
 // Scene-resource disposal is invoked by the battle startup owner; the
 // promise checks attachment so it cannot materialize after a teardown.
 // Tall ringmaster hat: layered crown, curved brim, hatband and iron laurels.
 const hat=new T.Group();hat.position.set(0,.92,-.05);head.add(hat);
 const brim=add(hat,new T.CylinderGeometry(.88,.91,.1,coarse?20:48),leather,'real-thickness-tall-hat-brim');
 brim.position.y=.14;
 const crown=add(hat,new T.CylinderGeometry(.43,.60,1.18,coarse?18:40),leather,'tall-concave-ringmaster-hat',0,.72,0);
 crown.rotation.z=-.035;
 add(hat,new T.CylinderGeometry(.58,.59,.13,coarse?18:40),crimson,'crimson-hat-band',0,.32,0);
 makeCurve(hat,[[-.48,.32,.24],[.1,.35,.56],[.49,.39,.23]],.065,metal,'hat-brass-braid');
 for(let s of [-1,1])blob(hat,metal,'broken-gilt-mask-ornament',[s*.41,.55,.44],[.09,.19,.06]);
 // Weighted linked bones: feet and wrists are constrained to articulated IK.
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const shoulder=[side*.87,3.47,0],a=rod(body,velvet,'upper-arm-sculpture',.22,.30),
   b=rod(body,crimson,'forearm-sculpture',.17,.21),
   elbow=blob(body,velvet,'elbow-joint',[0,0,0],[.25,.25,.25]),
   cuff=blob(body,bone,'gathered-tailored-cuff',[0,0,0],[.24,.18,.26]),
   hand=blob(body,chalk,'five-finger-gloved-hand',[0,0,0],[.29,.34,.22]);
  const fingers=[];
  for(let i=0;i<4;i++){
   const finger=rod(body,chalk,'articulated-glove-finger',.047,.065);fingers.push(finger);
  }
  arms.push({side,shoulder,upper:a,lower:b,elbow,cuff,hand,fingers,previous:null,smoothed:null});
  const thigh=rod(body,lining,'full-length-tailored-trouser',.26,.33),
   shin=rod(body,velvet,'stitched-calf-and-garter',.21,.24),
   knee=blob(body,velvet,'articulated-knee',[0,0,0],[.27,.26,.25]),
   shoe=blob(body,leather,'solid-floor-contact-shoe',[0,0,0],[.33,.29,.51]);
  blob(shoe,metal,'antique-buckle',[0,.13,.50],[.25,.08,.08]);
  legs.push({side,thigh,shin,knee,shoe});
 }
 const baton=rod(body,metal,'antique-conductor-baton',.04,.04);
 const razor=rod(body,metal,'real-director-razor-edged-baton',.086,.016);razor.visible=false;
 const wireGeo=new T.BufferGeometry(),wirePoints=new Float32Array(15);
 wireGeo.setAttribute('position',new T.BufferAttribute(wirePoints,3));
 const livingLash=new T.Line(wireGeo,new T.LineBasicMaterial({color:0x9f8c90,transparent:true,opacity:.72}));
 livingLash.name='directors-own-living-marionette-weapon';livingLash.visible=false;body.add(livingLash);
 const batonTip=blob(body,metal,'baton-gilded-tip',[0,0,0],[.14,.14,.14]);
 // Thin real ornamental strings belong to the coat, not the attack collider.
 const threads=[];
 for(const side of [-1,1]){
  const thread=makeCurve(body,[[side*.75,3.62,-.15],[side*1.05,3.8,-.36],[side*1.1,2.95,-.55]],
    .014,metal,'living-marionette-string');threads.push(thread);
 }
 const puppetCross=createClownMarionetteCross({root,body,head,arms,legs,coarse});
 const gait=createClownGait(),springs=createSpringBank();
 const down=new T.Vector3(),wristWorld=new T.Vector3();
 let previousGame=null,lastTime=-1,previousYaw=null;
 function update(g,dt=1/60){
  if(!g?.boss||!g?.clown)return;
  const b=g.boss,c=g.clown,v=c.vis||{},q=clownBeastPose(g),p=ringmasterPerformance(g),
   perf=ringmasterGesture(g),contact=clownContactFrame(g,p,q),time=(c.time||0)+(b.state==='transition'?b.t:0),
   step=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0)),
   transform=clownPhase2Beat(g);
  if(previousGame!==g||time<lastTime){springs.reset();gait.reset();previousYaw=null;for(const a of arms){a.smoothed=null;a.previous=null;}previousGame=g;}
  lastTime=time;root.position.set(b.x,0,b.z);
  const desiredYaw=p.facingYaw??c.yaw??b.yaw??0,
   combatFacing=c.state==='pattern'||b.state==='transition';
  // Limit decorative turning in neutral. In attacks the mesh tracks the
  // same authored collision yaw promptly, never visually aiming elsewhere.
  previousYaw=previousYaw===null?desiredYaw:smoothYaw(previousYaw,desiredYaw,step,combatFacing?22:9);
  root.rotation.y=previousYaw;
  const phase=b.phase===2,entrance=b.state==='transition',cut=entrance?clamp((b.t||0)/5.2,0,1):1,
   bow=entrance?Math.sin(Math.PI*Math.min(1,cut*1.3))*.30:0;
  // One compact grounding frame: neither the performer nor a shoe floats
  // on the vanished head/ball. The cutscene is a human-scale transformation.
  const contactHeight=contact.height;
  const foot=gait.update(g,step,{bodyHeight:contactHeight,pitch:contact.pitch,supportY:phase?0:0});
  body.position.set(0,Math.max(0,contactHeight+(v.jump||0)*1.1),0);
  body.scale.set(p.bodyX,p.bodyY,p.bodyZ);
  const roll=clamp((v.tilt||0)*.11+(foot.roll||0),-.15,.15);
  // Independent inertial channels soften shoulders and costume while every
  // attack collider remains attached to the authoritative simulation pose.
  const weightPitch=springs.step('spine-pitch',clamp(contact.pitch+bow+transform.chestArch,-.3,1.10),step,14),
   weightTwist=springs.step('spine-twist',clamp((p.twist||0)*.32,-.32,.32),step,13),
   weightRoll=springs.step('spine-roll',roll,step,12);
  body.rotation.set(weightPitch,weightTwist,weightRoll);
  // The centre of mass leads the costumed action; follow-through is delayed.
  const breath=Math.sin(time*(phase?1.7:1.15))*.015;
  chest.scale.y=1+breath+Math.min(.08,(p.glove-1)*.08);
  head.rotation.y=springs.step('head-yaw',clamp((v.tilt||0)*.32+Math.sin(time*.46)*.045+
    transform.headTurn,-.62,.62),step,14);
  head.rotation.x=springs.step('head-pitch',-q.headCounter*.88+Math.sin(time*.88)*.022,step,15);
  head.rotation.z=springs.step('head-roll',clamp((v.tilt||0)*.18+perf.offBeat*perf.director*.07,-.17,.17),step,12);
  head.scale.setScalar(p.headScale*(1+.08*transform.fracture*transform.alive));
  // His original photographed smile is the neutral facial identity. The
  // separate sculptural jaw only tears open during authored horror attacks.
  jaw.visible=!portrait.visible||(c.state==='pattern'&&
   /directorCackle|unhingedClap|facePeelHunt|mouthOfTheAudience/.test(c.name||'')&&
   c.pt>.78||transform.fracture>.35&&transform.command<.9);
  jaw.rotation.x=springs.step('jaw',clamp((perf.director*.25)+(phase?.10:.035)+Math.max(0,perf.offBeat)*.09+
    (perf.act?.mode==='cackle'?.36+.10*Math.max(0,perf.act.beat):0),0,.72),step,20);
  hat.rotation.x=springs.step('hat-tilt',perf.act?.mode==='drum'?.07*perf.act.beat:
    perf.act?.mode==='mirror'?.14*perf.act.weight:0,step,10);
  hat.rotation.z=Math.sin(time*.6)*.024;
  for(const tail of tails){
   const target=-.10+(phase?-.08:0)+Math.sin(time*2.2+tail.side+tail.i)*.08+(foot.activity||0)*.27;
   tail.pivot.rotation.x=springs.step('tail-x-'+tail.side+'-'+tail.i,target,step,8);
   tail.pivot.rotation.z=springs.step('tail-z-'+tail.side+'-'+tail.i,tail.side*.12+roll*.5,step,9);
  }
  for(const a of arms){
   const s=a.side,gesture=perf.director,fight=c.state==='pattern'&&g.status==='playing',
    shoulder=[s*.88,3.5-(v.crouch||0)*.13,0];
   let target=[s*(1.45+.34*gesture),2.28+.5*gesture,.30+gesture*.75];
   // Bespoke director gestures define which musician is expected to answer.
   // Wrist IK retains constant bone lengths as the baton follows each cue.
   const action=perf.act,weight=action.weight,beat=action.beat;
   if(weight>.001){
    const mode=action.mode;
    let special=target;
    if(mode==='drum')special=[s*1.16,2.05+(s>0?beat:-beat)*.43,1.12];
    else if(mode==='juggle')special=[s*1.57,2.66+((s>0?beat:-beat)+1)*.34,1.01];
    else if(mode==='vault')special=[s*2.10,3.03,.42];
    else if(mode==='sing'||mode==='finale')special=[s*1.72,3.44+beat*.17,.66];
    else if(mode==='strings'||mode==='trapdoor')special=[s*1.80,3.0+(s>0?beat:-beat)*.21,1.26];
    else if(mode==='hoop')special=[s*1.93,3.26,1.0];
    else if(mode==='mirror')special=[s*1.46,2.92+.24*beat,.92];
    else if(mode==='hush')special=[s*1.40,2.34,.66];
    else if(mode==='cannon')special=[s*1.32,2.32,1.84];
    else if(mode==='curtain')special=[s*2.18,2.88,1.28];
    else if(mode==='baton')special=[s*(1.17+.27*Math.abs(beat)),s>0?3.72+.28*beat:2.21,1.08+.37*beat];
    else if(mode==='veil')special=[s*1.49,2.26+.27*beat,1.15];
    else if(mode==='cackle')special=[s*1.96,3.52+.16*beat,.43];
    else if(mode==='lash')special=[s*1.62,3.24+.36*beat,2.18];
    else if(mode==='hunt')special=[s*1.05,2.08,2.07];
    else if(mode==='verdict')special=[s*2.16,3.21+.22*beat,1.54];
    target=target.map((x,i)=>x*(1-weight)+special[i]*weight);
   }
   if(fight&&!gesture&&(!perf.act||perf.act.weight<.01)){target=[s*(1.16+.27*(p.arms-1)),2.25+(p.glove-1)*.3,1.0+(p.glove-1)*.5];}
   if(q.active){
    const paw=clownBeastPaw(q,s,foot.activity);
    target=target.map((x,i)=>x*(1-q.entry)+paw[i]*q.entry);
   }
   if(entrance){
     // The director first bows, is dragged upright by his own strings, then
     // tears the chorus faces from their owners with both gloved hands.
     const spread=transform.armSpread;
     if(transform.command>.12)
      target=[s*(2.0+spread*.62),3.55+.15*Math.sin(time*2+s),1.25+spread*.58];
     else if(transform.bind>.12)
      target=[s*(1.18+spread*.37),3.16+spread*.27,1.27+transform.bind*.43];
     else target=[s*(1.5+spread*.85),2.4+spread*.9,1.1+spread*.7];
    }
   const frameRate=1-Math.exp(-step*18);
   if(!a.smoothed)a.smoothed=target;else a.smoothed=a.smoothed.map((x,i)=>x+(target[i]-x)*frameRate);
   if(phase&&q.active){
    // World-space contact correction after pitch/lean; never bury a hand.
    body.updateWorldMatrix(true,false);down.set(...a.smoothed);
    body.localToWorld(down);
    if(down.y<.38){down.y=.38;body.worldToLocal(down);a.smoothed=down.toArray();}
   }
   const rig=solveFixedLimb(shoulder,a.smoothed,{
    upper:1.38,lower:1.32,pole:[s*.9,-.18,.35],previous:a.previous});
   a.previous=rig.joint;link(a.upper,rig.start,rig.joint);link(a.lower,rig.joint,rig.end);
   a.elbow.position.set(...rig.joint);a.cuff.position.set(...rig.end);
   a.hand.position.set(...rig.end);
   for(let i=0;i<a.fingers.length;i++){
    const x=(i-1.5)*.105;
    const grasp=.12+Math.max(0,perf.director)*.28;
    link(a.fingers[i],[rig.end[0]+x,rig.end[1]-.20,rig.end[2]+.10],
     [rig.end[0]+x*1.09,rig.end[1]-.49+grasp,rig.end[2]+.14+grasp*.4]);
   }
  }
  for(const l of legs){
   const info=foot.legs[l.side<0?0:1],hip=[l.side*.50,1.32-(v.crouch||0)*.12,0];
   const stepWanted=info.foot.slice();
   // Leg IK starts from a physically planted shoe target. The transform
   // accounts for phase pitch, breathing scale and the boss root scale.
   body.updateWorldMatrix(true,false);
   const plant=!entrance&&(v.jump||0)<.01&&p.lift<.22&&info.planted,
    grounded=stageFootTarget(stepWanted,
      q=>body.localToWorld(new T.Vector3(...q)).toArray(),
      q=>body.worldToLocal(new T.Vector3(...q)).toArray(),
      {floor:0,soleRadius:.29,worldScale:1.25*p.bodyY,plant});
   const rig=solveFixedLimb(hip,grounded,{
    upper:.92,lower:.92,pole:[l.side*.45,.08,.56]});
   link(l.thigh,rig.start,rig.joint);
   link(l.shin,rig.joint,rig.end);
   l.knee.position.set(...rig.joint);
   l.shoe.position.set(...rig.end);
   l.shoe.rotation.x=info.anklePitch-weightPitch;
   l.shoe.rotation.z=clamp(-weightRoll*.8,-.15,.15);
  }
  const held=perf.director>0.03||g.status==='playing'&&c.state==='idle';
  baton.visible=batonTip.visible=held;
  if(held){
   const hand=arms[1].hand.position;
   const tip=[hand.x+.42,hand.y+.2+perf.director*.35,hand.z+.35];
   link(baton,[hand.x,hand.y,hand.z],tip);baton.scale.y*=1.8;
   batonTip.position.set(...tip);
   const direct=['baton','veil','verdict'].includes(perf.act?.mode);
   razor.visible=direct;
   if(direct)link(razor,tip,[tip[0]+.24,tip[1]+.15+perf.act.beat*.17,tip[2]+1.48]);
  }
  if(!held)razor.visible=false;
  livingLash.visible=perf.act?.mode==='lash'&&perf.act.weight>.04;
  if(livingLash.visible){
   const hand=arms[1].hand.position;
   for(let i=0;i<5;i++){
    const u=i/4,offset=Math.sin(u*Math.PI*2.3+time*5)*.22;
    wirePoints[i*3]=hand.x+(i===0?0:.1*u)+offset*u;
    wirePoints[i*3+1]=hand.y+Math.sin(u*Math.PI)*.16-u*.58;
    wirePoints[i*3+2]=hand.z+u*7.6;
   }
   wireGeo.attributes.position.needsUpdate=true;
  }
  for(const t of threads)t.visible=phase||perf.puppets||perf.director>.2||livingLash.visible;
  puppetCross.update(g);
  eyeMat.emissiveIntensity=phase?1.9:1.1;
  velvet.color.setHex(phase?0x200e17:0x32111e);
  crimson.color.setHex(phase?0x591425:0x7d2433);
  if(g.status==='won'){body.rotation.z=clamp((c.time||0)*.2,0,1.15);}
 }
 function disposePortrait(){
  portraitDisposed=true;
  portraitTexture?.dispose();portraitTexture=null;
  portrait.visible=false;portraitMaterial.map=null;
  puppetCross.dispose();
 }
 return {root,update,disposePortrait,
  prewarmMarionette:()=>{puppetCross.root.visible=true;},
  finishPrewarmMarionette:()=>{puppetCross.root.visible=false;},
  marionette:puppetCross,
  head:{ready:portraitReady,portrait,source:'clown-face.mjs'},
  maskStyle:'sculpted-with-original-face',isRebuiltRingmaster:true};
 });
}
