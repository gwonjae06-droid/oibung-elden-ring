import * as BASE_THREE from 'three';
import {runThreeStartup} from './runtime/three-startup.mjs';
import {loft,plate,beam,addMesh,mergeRigid} from './player-geometry.mjs';
import {buildPlayerWeapons} from './player-weapons.mjs';
import {finishPlayerSurfaces} from './player-surfaces.mjs';
import {createWeightedJoint} from './joint-skinning.mjs';

export function buildPlayerAvatar(weaponKeys,namespace=BASE_THREE){
 return runThreeStartup(namespace,T=>{
  const material=(name,color,metalness,roughness,extra={})=>{const m=new T.MeshStandardMaterial({color,metalness,roughness,...extra});m.name=name;return m;};
  const m={steel:material('player-tempered-silver',0x9caeb7,.78,.34),darkSteel:material('player-blued-steel',0x273d50,.65,.43),gold:material('player-aged-brass',0xb99b58,.72,.38),
   cloth:material('player-midnight-tabard',0x264e6d,0,.9),leather:material('player-oxblood-leather',0x30242a,0,.88),
   etched:material('player-inset-engraving',0x142732,.45,.51),gem:material('player-oath-sapphire',0x90d8e1,.38,.25,{emissive:0x17485c,emissiveIntensity:.45}),
   ivory:material('player-ivory-parchment',0xe8dcc2,0,.64),wood:material('player-burnished-yew',0x775033,.08,.63),cardRed:material('player-crimson-suit',0x842a3d,.2,.48)};
  m.string=new T.LineBasicMaterial({color:0xded5b7});
  const rig=new T.Group();rig.name='player';rig.userData.playerQuality='oathwarden-v1';
  const shadowGeo=new T.BufferGeometry(),shadowPositions=[0,.012,0],shadowColors=[0,0,0,.26],shadowIndices=[];
  for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;shadowPositions.push(Math.cos(a)*.40,.012,Math.sin(a)*.25);shadowColors.push(0,0,0,0);if(i)shadowIndices.push(0,i+1,i);}
  shadowGeo.setAttribute('position',new T.Float32BufferAttribute(shadowPositions,3));shadowGeo.setAttribute('color',new T.Float32BufferAttribute(shadowColors,4));shadowGeo.setIndex(shadowIndices);shadowGeo.computeVertexNormals();
  shadowGeo.setAttribute('uv',new T.Float32BufferAttribute(shadowPositions.flatMap((_,i)=>i%3===0?[shadowPositions[i]/.8+.5,shadowPositions[i+2]/.5+.5]:[]),2));
  const shadow=new T.Mesh(shadowGeo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));shadow.name='player-contact-shadow';shadow.userData.skipCinematicMaterial=true;rig.add(shadow);
  const body=new T.Group();body.name='player-articulated-body';body.position.y=1;rig.add(body);
  const put=(parent,geo,mat,name,x=0,y=0,z=0)=>addMesh(T,parent,geo,mat,name,x,y,z);
  const shell=(parent,name,mat,rings,sides=12,x=0,y=0,z=0)=>put(parent,loft(T,rings,sides),mat,name,x,y,z);
  // The chest has a fitted waist, a raised breast ridge and a separate gorget.
  shell(body,'player-tailored-arming-coat',m.cloth,[[.03,.26,.17],[.17,.28,.19],[.34,.30,.21],[.62,.40,.23],[.83,.36,.20],[.92,.22,.16]],16);
  shell(body,'player-ridged-cuirass',m.darkSteel,[[.22,.27,.17],[.32,.30,.20],[.56,.38,.245],[.73,.37,.22],[.84,.30,.18]],16,0,0,.025);
  const chest=plate(T,[[-.28,.19],[-.28,.48],[-.20,.63],[0,.70],[.20,.63],[.28,.48],[.25,.20],[0,.08]],.045);
  put(body,chest,m.steel,'player-raised-breastplate',0,.12,.23);
  put(body,plate(T,[[0,.22],[.033,.12],[.025,-.05],[0,-.11],[-.025,-.05],[-.033,.12]],.028),m.gold,'player-oath-chest-crest',0,.48,.267);
  for(let i=0;i<3;i++)shell(body,'player-overlapping-waist-lame',i%2?m.darkSteel:m.steel,[[.08+i*.06,.28+i*.014,.19],[.12+i*.06,.29+i*.014,.20]],14);
  shell(body,'player-gorget',m.steel,[[.84,.18,.14],[.93,.20,.16],[1.02,.15,.13]],14);
  shell(body,'player-waist-belt',m.leather,[[.055,.294,.207],[.14,.30,.211]],16);
  put(body,plate(T,[[-.07,-.04],[.07,-.04],[.07,.04],[-.07,.04]],.03),m.gold,'player-belt-clasp',0,.10,.223);
  for(const side of [-1,1]){
   const panel=put(body,plate(T,[[-.17,.10],[.16,.10],[.20,-.33],[.10,-.43],[-.14,-.37]],.018),m.cloth,'player-split-tabard',side*.18,-.04,.18);panel.rotation.y=side*.18;
   const strap=put(body,beam(T,[[side*.16,.16,.237,.023,.012],[side*.11,.48,.265,.022,.012],[side*.26,.77,.21,.025,.012]],6),m.gold,'player-cuirass-inlay');
   strap.castShadow=false;
  }
  shell(body,'player-waist-satchel',m.leather,[[-.20,.11,.09],[-.17,.14,.11],[.03,.13,.10],[.09,.10,.07]],10,-.35,.08,-.02);
  for(const side of [-1,1])shell(body,'player-belt-vial',m.gold,[[-.16,.055,.045],[-.09,.07,.055],[.05,.06,.045],[.10,.035,.03],[.15,.035,.03]],10,side*.17,.12,-.23);
  const scabbard=put(body,loft(T,[[-.7,.055,.025],[.62,.075,.03],[.66,.08,.033]],8),m.leather,'player-sword-scabbard',-.36,-.15,-.20);scabbard.rotation.z=-.30;

  const head=new T.Group();head.name='player-helmet-joint';head.position.set(0,1.25,0);body.add(head);
  shell(head,'player-helmet-skull',m.darkSteel,[[-.20,.15,.145],[-.10,.205,.175],[.08,.215,.18],[.22,.16,.145],[.28,.06,.075],[.29,.001,.001]],18);
  put(head,plate(T,[[-.18,.12],[-.13,.19],[0,.21],[.13,.19],[.18,.12],[.16,-.11],[.08,-.21],[0,-.23],[-.08,-.21],[-.16,-.11]],.045),m.steel,'player-sculpted-visor',0,0,.17);
  for(const side of [-1,1]){
   const slit=put(head,plate(T,[[-.072,-.012],[.068,-.005],[.072,.018],[-.067,.023]],.005),m.etched,'player-visor-eye-slit',side*.09,.04,.198);slit.rotation.z=side*-.07;
   for(let j=0;j<3;j++)put(head,plate(T,[[-.008,-.025],[.008,-.025],[.007,.025],[-.007,.025]],.005),m.etched,'player-visor-vent',side*(.052+j*.035),-.084,.197-j*.002);
  }
  put(head,beam(T,[[0,-.20,.199,.016,.012],[0,.0,.205,.02,.018],[0,.22,.20,.016,.012],[0,.29,.08,.014,.014],[0,.23,-.13,.01,.01]],6),m.gold,'player-helmet-central-ridge');
  const crest=put(head,plate(T,[[-.035,0],[.035,0],[.035,.18],[0,.29],[-.035,.18]],.14),m.darkSteel,'player-low-helmet-crest',0,.23,-.03);crest.rotation.y=Math.PI/2;
  mergeRigid(T,head);

  const legs={},knees={},ankles={},arms={},elbows={},hands={},wrists={},capeParts=[];
  const hand=(parent,key)=>{
   const wrist=new T.Group();wrist.position.y=-.39;wrist.name='player-wrist-'+key;parent.add(wrist);wrists[key]=wrist;
   shell(wrist,'player-articulated-gauntlet',m.steel,[[-.10,.066,.05],[-.04,.08,.06],[.045,.075,.055],[.10,.06,.05]],10,0,-.01,0);
   for(let j=0;j<4;j++){
    const finger=put(wrist,beam(T,[[(j-1.5)*.035,-.06,.035,.018],[(j-1.5)*.035,-.13,.05,.019],[(j-1.5)*.035,-.14,.10,.016]],6),m.leather,'player-curled-grip-finger');finger.castShadow=false;
   }
   const thumbSide=key==='L'?1:-1;
   put(wrist,beam(T,[[thumbSide*.065,.01,.0,.027],[thumbSide*.085,-.05,.06,.026],[thumbSide*.045,-.10,.09,.021]],7),m.leather,'player-grip-thumb');
   mergeRigid(T,wrist);hands[key]=wrist;
  };
  for(const side of [-1,1]){
   const key=side<0?'L':'R',hip=new T.Group();hip.name='player-hip-'+key;hip.position.set(side*.18,.0,0);body.add(hip);legs[key]=hip;
   shell(hip,'player-fitted-cuisses',m.darkSteel,[[-.44,.105,.105],[-.34,.12,.12],[-.12,.15,.145],[.03,.13,.13]],12);
   shell(hip,'player-thigh-edge',m.gold,[[-.40,.108,.11],[-.37,.113,.116]],12);
   const knee=new T.Group();knee.name='player-knee-'+key;knee.position.y=-.47;hip.add(knee);knees[key]=knee;
   shell(knee,'player-fluted-greave',m.steel,[[-.40,.09,.09],[-.35,.11,.10],[-.12,.115,.115],[.02,.10,.10]],12);
   put(knee,plate(T,[[-.11,-.10],[0,-.17],[.11,-.10],[.13,.05],[0,.13],[-.13,.05]],.045),m.darkSteel,'player-pointed-poleyn',0,-.01,.105);
   const ankle=new T.Group();ankle.name='player-ankle-'+key;ankle.position.y=-.42;knee.add(ankle);ankles[key]=ankle;
   shell(ankle,'player-articulated-sabaton',m.darkSteel,[[-.10,.105,.18],[-.06,.12,.22],[.025,.115,.23],[.10,.09,.14]],12,0,0,.08);
   const shoulder=new T.Group();shoulder.name='player-shoulder-'+key;shoulder.position.set(side*.43,.87,0);body.add(shoulder);arms[key]=shoulder;
   shell(shoulder,'player-upper-arm-mail',m.leather,[[-.39,.08,.085],[-.16,.11,.105],[.03,.12,.11]],12);
   shell(shoulder,'player-layered-pauldron',m.steel,[[-.12,.17,.16],[-.04,.205,.19],[.07,.18,.16],[.13,.10,.10]],14,side*.045,0,0);
   shell(shoulder,'player-pauldron-brass-rim',m.gold,[[-.13,.174,.164],[-.10,.184,.174]],14,side*.045,0,0);
   const elbow=new T.Group();elbow.name='player-elbow-'+key;elbow.position.y=-.40;shoulder.add(elbow);elbows[key]=elbow;
   shell(elbow,'player-braced-vambrace',m.steel,[[-.35,.078,.07],[-.29,.087,.082],[-.09,.10,.095],[.035,.08,.075]],12);
   shell(elbow,'player-elbow-couter',m.darkSteel,[[-.04,.115,.10],[.02,.13,.12],[.08,.09,.09]],12);
   shell(elbow,'player-vambrace-rim',m.gold,[[-.32,.085,.078],[-.29,.09,.083]],12);hand(elbow,key);
   mergeRigid(T,hip);mergeRigid(T,knee);mergeRigid(T,ankle);mergeRigid(T,shoulder);mergeRigid(T,elbow);
  }

  const cape=new T.Group();cape.name='player-woven-cape';cape.position.set(0,.86,-.22);body.add(cape);
  const clothGeo=new T.BufferGeometry(),positions=[],uv=[],colors=[],indices=[],cols=20,rows=18;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const u=i/cols,v=j/rows,width=.36+v*.16,x=(u-.5)*2*width,y=-v*1.40+Math.sin(u*Math.PI*12)*.025*Math.pow(v,8),z=-.04-v*.12+Math.sin(u*Math.PI*6)*(.015+v*.025);
   positions.push(x,y,z);uv.push(u,v);
   const edge=u<.035||u>.965||v>.96,crest=Math.abs(u-.5)<.04&&v>.22&&v<.60||Math.abs(v-.38)<.025&&Math.abs(u-.5)<.15;
   const c=new T.Color(edge?0xba9c63:crest?0xc6b087:0x602331).multiplyScalar(.82+.18*Math.cos(u*Math.PI*6));colors.push(c.r,c.g,c.b);
   if(i&&j){const k=j*(cols+1)+i;indices.push(k-cols-2,k-1,k,k-cols-2,k,k-cols-1);}
  }
  clothGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));clothGeo.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(positions.length),3));clothGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));clothGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));clothGeo.setIndex(indices);clothGeo.computeVertexNormals();
  const capeMat=material('player-woven-crimson-cape',0xffffff,0,.95,{vertexColors:true,side:T.DoubleSide});
  finishPlayerSurfaces(T,m,capeMat);
  const capeMesh=put(cape,clothGeo,capeMat,'player-continuous-cloth');capeMesh.frustumCulled=false;
  const capeRest=new Float32Array(positions);capeParts.push(cape);
  const pivot=new T.Group();pivot.name='player-weapon-grip';pivot.position.set(0,-.105,.07);hands.R.add(pivot);
  const {weapons:weaponRigs,details:weaponDetails}=buildPlayerWeapons(T,m);
  for(const key of weaponKeys)if(!weaponRigs[key])throw Error('Unknown player weapon '+key);
  for(const weapon of Object.values(weaponRigs)){weapon.visible=false;pivot.add(weapon);}
  weaponRigs.sword.position.z=-.10;weaponRigs.hammer.position.z=-.08;weaponRigs.bow.position.z=-.16;weaponRigs.cards.position.z=-.12;
  const flask=new T.Group();flask.name='player-healing-flask';flask.visible=false;hands.L.add(flask);
  shell(flask,'player-flask-glass',m.gem,[[-.12,.04,.04],[-.08,.075,.065],[.07,.07,.06],[.13,.035,.03],[.17,.035,.03]],12,0,-.07,.08);
  shell(flask,'player-flask-stopper',m.gold,[[.15,.04,.035],[.20,.04,.035]],10,0,-.07,.08);
  mergeRigid(T,body);mergeRigid(T,flask);
  // Flexible material now closes the gaps between rigid armor plates.
  // Add AFTER rigid mesh batching so skin weights and Skeleton cannot be
  // flattened into a static merged mesh.
  const jointSkins=[];
  for(const key of ['L','R']){
   jointSkins.push(
    createWeightedJoint(T,arms[key],elbows[key],m.leather,{name:'player-skinned-elbow-'+key,radius:.085,length:.22,sides:9}),
    createWeightedJoint(T,elbows[key],wrists[key],m.leather,{name:'player-skinned-wrist-'+key,radius:.068,length:.17,sides:8}),
    createWeightedJoint(T,legs[key],knees[key],m.leather,{name:'player-skinned-knee-'+key,radius:.100,length:.22,sides:9}),
    createWeightedJoint(T,knees[key],ankles[key],m.darkSteel,{name:'player-skinned-ankle-'+key,radius:.085,length:.17,sides:8})
   );
  }
  const presentationParts=Object.freeze({quality:'oathwarden-v1',rig,body,pivot,head,shadow,arms:Object.freeze([arms.L,arms.R]),elbows:Object.freeze([elbows.L,elbows.R]),hands:Object.freeze([hands.L,hands.R]),wrists:Object.freeze([wrists.L,wrists.R]),legs:Object.freeze([legs.L,legs.R]),knees:Object.freeze([knees.L,knees.R]),ankles:Object.freeze([ankles.L,ankles.R]),weapons:Object.freeze({...weaponRigs}),weaponDetails,cape,capeMesh,capeRest,flask,jointSkins:Object.freeze(jointSkins),materials:m});
  Object.defineProperty(rig,'presentationParts',{value:presentationParts});
  return {rig,body,pivot,mats:Object.values(m).filter(v=>v.isMeshStandardMaterial),weaponRigs,legs,knees,ankles,arms,elbows,hands,cape,capeParts,cloth:m.cloth,presentationParts};
 });
}
