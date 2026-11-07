// A purely visual stage-light projection: the simulation remains the single
// source of truth for every damaging zone. No attack timing/hitboxes are added.
const safe=n=>Number.isFinite(n)?n:0;
// Choreographed colours belong to the physical act, never an arbitrary UI
// danger circle. Avoid losing the real hitbox silhouette in warm stage haze.
export function clownCuePalette(z){
 const s=String(z?.sound||z?.waveKind||'');
 if(/choir|clap|choral|applause|chorus/i.test(s))return {color:0x91d6d5,rim:0xd5fff5};
 if(/infernal|fire|hoop|cinder|flame/i.test(s))return {color:0xf4884b,rim:0xffce83};
 if(/puppet|marionette|string|funeral/i.test(s))return {color:0xb8a4da,rim:0xe6d0ff};
 if(/acrobat|stampede|dash/i.test(s))return {color:0xdc9a72,rim:0xffdbc0};
 if(/mimic|false|twin|mirror/i.test(s))return {color:0xd49aaf,rim:0xffd9e4};
 return {color:0xd9ae86,rim:0xffdfb0};
}
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));

export function clownDangerSpotlightCue(z){
 return !!(z&&z.state==='warn'&&!z.visual&&!z.waveKind&&
  (safe(z.damage)>0||z.kind==='push')&&
  ['circle','lane','cone'].includes(z.shape)&&
  Number.isFinite(z.x)&&Number.isFinite(z.z)&&
  Number.isFinite(z.warn)&&z.warn>0);
}
export function clownSpotlightLayout(z){
 if(!clownDangerSpotlightCue(z))return null;
 const yaw=safe(z.yaw);
 if(z.shape==='lane'){
  const len=Math.max(.1,safe(z.len)),w=Math.max(.1,safe(z.w));
  return {x:z.x+Math.sin(yaw)*len/2,z:z.z+Math.cos(yaw)*len/2,
   sx:w/2,sz:len/2,yaw,shape:1,half:0,beamSize:Math.min(w,5.5)};
 }
 const r=Math.max(.1,safe(z.r));
 return {x:z.x,z:z.z,sx:r,sz:r,yaw,shape:z.shape==='cone'?2:0,
  half:cap(safe(z.half),.03,Math.PI),beamSize:Math.min(r,6)};
}

const vertexShader=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const fragmentShader=`
precision mediump float;
varying vec2 vUv;
uniform float uShape,uHalf,uAlpha,uProgress;
uniform vec3 uTint;
void main(){
 vec2 p=vec2(2.0*vUv.x-1.0,1.0-2.0*vUv.y);
 float r=length(p);
 float mask=1.0-smoothstep(.88,1.0,r);
 if(uShape>.5 && uShape<1.5){
  float d=max(abs(p.x),abs(p.y));
  mask=1.0-smoothstep(.86,1.0,d);
 }else if(uShape>1.5){
  float theta=abs(atan(p.x,p.y));
  mask*=1.0-smoothstep(max(.01,uHalf-.07),uHalf+.01,theta);
  mask*=smoothstep(-.03,.04,p.y);
 }
 // An actual theatre gobo: diffuse lamp pool, a legible physical edge
 // and two inward-moving rings which show the remaining cast time.
 float contour=uShape<.5?abs(r-.89):
    uShape<1.5?abs(max(abs(p.x),abs(p.y))-.89):
    abs(r-.89);
 float rim=1.0-smoothstep(.012,.06,contour);
 float ripple=1.0-smoothstep(.02,.075,abs(r-(.48+.39*uProgress)));
 float glow=(.12+.17*(1.0-r))*mask+.46*rim+.18*ripple*mask;
 float alpha=uAlpha*glow;
 gl_FragColor=vec4(uTint,alpha);
}
`;
export function createClownDangerSpotlight(THREE,scene,z,{reduced=false}={}){
 const group=new THREE.Group();group.name='clown-damage-synced-stage-spotlight';
 const layout=clownSpotlightLayout(z);
 const floorGeometry=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
 const floorMat=new THREE.ShaderMaterial({uniforms:{
  uShape:{value:layout.shape},uHalf:{value:layout.half},uAlpha:{value:0},
  uProgress:{value:0},uTint:{value:new THREE.Color(clownCuePalette(z).color)}},
  vertexShader,fragmentShader,transparent:true,depthWrite:false,
  side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const floor=new THREE.Mesh(floorGeometry,floorMat);
 floor.name='clown-spotlit-danger-footprint';floor.renderOrder=3;group.add(floor);
 const rays=[],lightMat=new THREE.MeshBasicMaterial({color:clownCuePalette(z).rim,
  transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending});
 const rayGeometry=new THREE.ConeGeometry(1,21,14,1,true).translate(0,10.5,0);
 const count=z.shape==='lane'?Math.min(4,Math.max(1,Math.ceil(safe(z.len)/8))):
  z.shape==='cone'?2:1;
 for(let i=0;i<count;i++){
  const ray=new THREE.Mesh(rayGeometry,lightMat);ray.name='clown-stage-spotlight-beam';
  ray.renderOrder=2;group.add(ray);rays.push(ray);
 }
 function update(zone){
  const geo=clownSpotlightLayout(zone);if(!geo){group.visible=false;return;}
  group.visible=true;group.position.set(geo.x,.095,geo.z);group.rotation.y=geo.yaw;
  floor.scale.set(geo.sx,1,geo.sz);
  floorMat.uniforms.uShape.value=geo.shape;
  floorMat.uniforms.uHalf.value=geo.half;
  const palette=clownCuePalette(zone);
  floorMat.uniforms.uTint.value.setHex(palette.color);lightMat.color.setHex(palette.rim);
  const charge=cap(safe(zone.age)/Math.max(.01,zone.warn),0,1);
  floorMat.uniforms.uProgress.value=charge;
  // Allow time to react before the spotlight reaches full intensity.
  const glow=(.55+.45*charge)*(reduced?.72:1);
  floorMat.uniforms.uAlpha.value=.70*glow;
  lightMat.opacity=.10*glow;
  for(let i=0;i<rays.length;i++){
   const ray=rays[i],offset=(i+.5)/rays.length-.5;
   ray.position.set(0,-.04,geo.shape===1?offset*geo.sz*1.8:
    geo.shape===2?Math.max(0,geo.sz*.35):0);
   const width=(geo.shape===1?geo.beamSize*.45:geo.beamSize*.78)*(reduced?.85:1);
   ray.scale.set(width,1,width);
  }
 }
 group.userData.spotlightUpdate=update;scene.add(group);update(z);return group;
}
