import * as THREE from 'three';

// The sea occupies only the sanctuary OUTSIDE the circular combat floor.
// No game logic reads these visuals for movement, hazards or collisions.
export const CATHEDRAL_BLOOD_SEA=Object.freeze({
 innerMargin:.55,halfWidth:40.4,halfLength:46.35,
 surfaceHeight:.065,minimumShoreGap:.55
});
const TAU=Math.PI*2,fract=v=>v-Math.floor(v);
const random=n=>fract(Math.sin(n*127.1+79.21)*43758.5453123);
const pointInSea=(x,z,innerRadius)=>Math.hypot(x,z)>innerRadius&&Math.abs(x)<CATHEDRAL_BLOOD_SEA.halfWidth&&Math.abs(z)<CATHEDRAL_BLOOD_SEA.halfLength;
const seaBounds=radius=>radius+CATHEDRAL_BLOOD_SEA.innerMargin;

function geometryOutsideCombat(radius,coarse){
 const {halfWidth:W,halfLength:H}=CATHEDRAL_BLOOD_SEA;
 const s=new THREE.Shape();
 s.moveTo(-W,-H);s.lineTo(W,-H);s.lineTo(W,H);s.lineTo(-W,H);s.closePath();
 const hole=new THREE.Path(),r=seaBounds(radius),segments=coarse?64:128;
 for(let i=0;i<=segments;i++){
  const a=i*TAU/segments,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(i===0)hole.moveTo(x,z);else hole.lineTo(x,z);
 }
 hole.closePath();s.holes.push(hole);
 const geo=new THREE.ShapeGeometry(s,coarse?3:6);
 geo.rotateX(-Math.PI/2);
 return geo;
}
function droplets(radius,count){
 const positions=[];
 for(let i=0;i<count;i++){
  let p=null;
  for(let k=0;k<40;k++){
   const x=(random(i*23+k*17+1)*2-1)*37.8,z=(random(i*31+k*29+13)*2-1)*43.8;
   if(pointInSea(x,z,seaBounds(radius)+1.1)){p={x,z};break;}
  }
  if(p)positions.push({...p,seed:random(i*57+32)});
 }
 return positions;
}
export function createCathedralBloodSea(parent,{coarse=false,reduced=false,radius=28}={}){
 if(!Number.isFinite(radius)||radius<=0||radius>=CATHEDRAL_BLOOD_SEA.halfWidth)throw new Error('Invalid cathedral combat radius');
 const root=new THREE.Group();root.name='cathedral-crimson-blood-sea';parent.add(root);
 const uniforms={time:{value:0},frenzy:{value:0}};
 const water=new THREE.MeshPhysicalMaterial({
  color:0x5c081d,emissive:0x28020e,emissiveIntensity:.33,
  roughness:.19,metalness:.16,clearcoat:.9,clearcoatRoughness:.12,
  side:THREE.DoubleSide
 });
 water.onBeforeCompile=shader=>{
  shader.uniforms.uSeaTime=uniforms.time;
  shader.uniforms.uSeaFrenzy=uniforms.frenzy;
  shader.vertexShader='uniform float uSeaTime; uniform float uSeaFrenzy; varying float vSeaSheen; varying vec2 vSeaCoord;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    // Long heavy swells slide across the nave, while radial return waves
    // dissipate at the dry marble shore. The shore must never rise above
    // the rim or show a red seam on the player combat floor.
    float radius=length(position.xz);
    float shoreDamping=smoothstep(${seaBounds(radius).toFixed(3)},${(seaBounds(radius)+1.5).toFixed(3)},radius);
    float directed=sin(dot(position.xz,vec2(.52,.28))-uSeaTime*.74);
    float returnWave=sin(radius*.54-uSeaTime*.96+directed*.4);
    transformed.y+=shoreDamping*(directed*.065+returnWave*.034)*(1.+uSeaFrenzy*.5);
    vSeaSheen=.5+.5*sin(position.x*.46+position.z*.26-uSeaTime*.86);
    vSeaCoord=position.xz;
   `);
  shader.fragmentShader='uniform float uSeaTime; uniform float uSeaFrenzy; varying float vSeaSheen; varying vec2 vSeaCoord;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   // Coherent downstream ribbons, with a much slower cross-current,
   // expose thickness without neon strobes or dense particles.
   float along=dot(vSeaCoord,normalize(vec2(.85,.53)));
   float crossFlow=dot(vSeaCoord,normalize(vec2(-.53,.85)));
   float bend=sin(crossFlow*.2+uSeaTime*.25)*.8;
   float current=sin(along*.66-uSeaTime*(.89+uSeaFrenzy*.17)+bend);
   float crossCurrent=sin(crossFlow*.42+along*.17-uSeaTime*.46);
   float sheen=clamp(.49+.18*current+.09*crossCurrent+.07*(vSeaSheen-.5),0.,1.);
   diffuseColor.rgb*=mix(vec3(.75,.57,.65),vec3(1.32,.96,1.04),sheen);
  `);
 };
 const surface=new THREE.Mesh(geometryOutsideCombat(radius,coarse),water);
 surface.name='cathedral-blood-sea-surface';surface.position.y=CATHEDRAL_BLOOD_SEA.surfaceHeight;
 surface.receiveShadow=false;surface.castShadow=false;root.add(surface);
 // A narrow marble-and-crimson seam sells the depth of the flooded nave.
 // Rebuild the world beyond the cathedral after the phase change. The
 // horizon plane is deliberately much larger than the camera fog distance:
 // no shoreline or square edge can appear in normal play.
 const horizon=new THREE.Mesh(
  new THREE.PlaneGeometry(1400,1400,coarse?24:64,coarse?24:64).rotateX(-Math.PI/2),water);
 horizon.name='blood-sea-to-the-horizon';horizon.position.y=.068;
 horizon.visible=false;horizon.frustumCulled=false;root.add(horizon);
 // An expanding wash covers the previously dry battle disk during the cutscene.
 // It is underneath the authoritative dark-danger/safe-red hazard overlay.
 const floodMaterial=new THREE.MeshPhysicalMaterial({
  color:0x570916,roughness:.19,metalness:.13,clearcoat:.85,
  transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide
 });
 const flood=new THREE.Mesh(
  new THREE.CircleGeometry(radius,coarse?48:96).rotateX(-Math.PI/2),floodMaterial);
 flood.name='blood-sea-floods-cathedral-floor';flood.position.y=.087;
 flood.visible=false;root.add(flood);
 const lipMat=new THREE.MeshStandardMaterial({color:0xe6dbd1,roughness:.54,metalness:.05,side:THREE.DoubleSide});
 const lip=new THREE.Mesh(new THREE.RingGeometry(radius-.08,radius+.18,coarse?64:128).rotateX(-Math.PI/2),lipMat);
 lip.position.y=.075;lip.name='cathedral-dry-marble-shoreline';root.add(lip);
 const shoreMat=new THREE.MeshBasicMaterial({color:0x9c394a,transparent:true,opacity:.52,
  depthWrite:false,side:THREE.DoubleSide});
 const shore=new THREE.Mesh(new THREE.RingGeometry(radius+.22,radius+.53,coarse?64:128).rotateX(-Math.PI/2),shoreMat);
 shore.name='cathedral-crimson-lapping-shore';shore.position.y=.082;root.add(shore);
 // Lightweight instanced ripples, not separate particle systems or lights.
 const spots=droplets(radius,coarse?10:27);
 const rippleMat=new THREE.MeshBasicMaterial({
  color:0xd97a8a,transparent:true,opacity:coarse?.27:.35,depthWrite:false,
  side:THREE.DoubleSide,blending:THREE.AdditiveBlending
 });
 const rippleGeo=new THREE.RingGeometry(.97,1.025,coarse?24:40).rotateX(-Math.PI/2);
 const ripples=new THREE.InstancedMesh(rippleGeo,rippleMat,spots.length);
 ripples.name='cathedral-blood-sea-ripple-instances';ripples.frustumCulled=false;root.add(ripples);
 // Broken stained-glass highlights sliding across the crimson surface.
 const glints=droplets(radius,coarse?7:18).map((spot,i)=>({...spot,
  tint:i%3===0?0xf5cfbe:i%3===1?0xc8a4c4:0xf19ca2}));
 const glintGeo=new THREE.PlaneGeometry(1.5,.09).rotateX(-Math.PI/2);
 const glintMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:coarse?.17:.23,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const reflections=new THREE.InstancedMesh(glintGeo,glintMat,glints.length);
 reflections.name='cathedral-blood-sea-stained-glass-reflections';reflections.frustumCulled=false;root.add(reflections);
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 glints.forEach((p,i)=>reflections.setColorAt(i,color.setHex(p.tint)));
 if(reflections.instanceColor)reflections.instanceColor.needsUpdate=true;
 const timeScale=reduced?.25:1;
 let disposed=false,lastTime=-1;
 function update(game){
  if(disposed)return;
  const t=(Number.isFinite(game?.time)?Math.max(0,game.time):0)*timeScale;
  const phase=game?.boss?.phase===2?1:0;
  const transition=game?.boss?.state==='transition';
  const phaseTime=Math.max(0,game?.blood?.t||0);
  const v=Math.max(0,Math.min(1,(phaseTime-1.7)/(4.4-1.7)));
  const eased=v*v*(3-2*v),floodLevel=phase?(transition?eased:1):0;
  const tempest=game?.boss?.state==='pattern'&&
    ['tide','requiem','eclipse'].includes(game?.blood?.pattern)?1:0;
  uniforms.time.value=t;uniforms.frenzy.value=phase+tempest*.65;
  const endless=floodLevel>.94;
  horizon.visible=endless;surface.visible=!endless;
  flood.visible=floodLevel>.01&&!endless;
  flood.scale.setScalar(Math.max(.001,floodLevel));
  floodMaterial.opacity=Math.min(.95,floodLevel*1.3);
  lip.visible=!endless;shore.visible=!endless;
  shoreMat.opacity=(1-floodLevel)*.54;
  water.emissiveIntensity=phase?.41:.33;
  shoreMat.opacity*=(reduced?1:.94+.06*Math.sin(t*1.15));
  if(lastTime>=0&&t-lastTime<1/35)return;
  lastTime=t;
  spots.forEach((p,i)=>{
   const pulse=.68+fract(t*(reduced?.035:.12)+p.seed)*.95;
   dummy.position.set(p.x,.11,p.z);dummy.rotation.set(0,i*.39,0);
   dummy.scale.set(pulse,pulse,pulse);dummy.updateMatrix();
   ripples.setMatrixAt(i,dummy.matrix);
  });
  ripples.instanceMatrix.needsUpdate=true;
  glints.forEach((p,i)=>{
   const shimmer=.65+Math.sin(t*.68+i*1.9)*.27;
   dummy.position.set(p.x,.112,p.z);dummy.rotation.set(0,i*1.14,0);
   dummy.scale.set(shimmer,1,.65);dummy.updateMatrix();
   reflections.setMatrixAt(i,dummy.matrix);
  });
  reflections.instanceMatrix.needsUpdate=true;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  const materials=new Set(),geometries=new Set();
  for(const node of [surface,horizon,flood,lip,shore,ripples,reflections]){
   geometries.add(node.geometry);materials.add(node.material);
  }
  for(const geo of geometries)geo.dispose();
  for(const material of materials)material.dispose();
  root.parent?.remove(root);
 }
 update({time:0,boss:{phase:1}});
 return {root,surface,horizon,flood,water,shore,update,dispose,
  stats:()=>({radius,innerRadius:seaBounds(radius),halfWidth:CATHEDRAL_BLOOD_SEA.halfWidth,
   halfLength:CATHEDRAL_BLOOD_SEA.halfLength,horizonRadius:700,unboundedSea:horizon.visible,
   floodVisible:flood.visible,ripples:spots.length,reflections:glints.length,
   isDecorative:true,damageSources:0})};
}
