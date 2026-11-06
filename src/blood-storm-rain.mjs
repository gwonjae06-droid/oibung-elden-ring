import * as THREE from 'three';
const hash=n=>{const a=Math.sin(n*127.19+19.31)*43758.5453;return a-Math.floor(a);};

// Every streak is a fixed GPU instance. No 28-Hz CPU vertex rewrites or
// per-particle allocations; a single time uniform animates the entire storm.
export function createBloodInstancedRain(root,{coarse=false,reduced=false}={}){
 const count=coarse?104:reduced?128:384;
 const cross=new Float32Array([
  -.022,0,0, .022,0,0, -.022,1,0, .022,1,0,
  0,0,-.022, 0,0,.022, 0,1,-.022, 0,1,.022
 ]);
 const indices=[0,1,2,2,1,3,4,5,6,6,5,7];
 const geometry=new THREE.InstancedBufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(cross,3));
 geometry.setIndex(indices);
 const seeds=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  const k=i*4;
  seeds[k]=(hash(i*3+17)*2-1)*54;
  seeds[k+1]=(hash(i*5+19)*2-1)*54;
  seeds[k+2]=hash(i*7+5)*52;
  seeds[k+3]=13+hash(i*11+31)*16;
 }
 geometry.setAttribute('aRainSeed',new THREE.InstancedBufferAttribute(seeds,4));
 geometry.instanceCount=count;
 const uniforms={uTime:{value:0},uOpacity:{value:0},uMotion:{value:reduced?.26:1}};
 const material=new THREE.ShaderMaterial({
  uniforms,transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:String.raw`
attribute vec4 aRainSeed;
uniform float uTime,uMotion;
varying float vRainHeight;
void main(){
 float speed=uTime*aRainSeed.w*uMotion;
 float y=mod(aRainSeed.z-speed,52.0);
 vec3 p=position;
 float length=1.1+mod(aRainSeed.w*3.7,2.0);
 p.x+=aRainSeed.x-.24*p.y+sin(aRainSeed.z+uTime*.27)*.11;
 p.y=y-p.y*length+2.0;
 p.z+=aRainSeed.y-.11*p.y;
 vRainHeight=1.0-p.y;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}
`,
  fragmentShader:String.raw`
precision mediump float;
uniform float uOpacity;
varying float vRainHeight;
void main(){
 float fade=.58+.42*vRainHeight;
 gl_FragColor=vec4(.57,.095,.17,uOpacity*fade);
}
`
 });
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name='blood-perpetual-rain';mesh.frustumCulled=false;mesh.visible=false;root.add(mesh);
 let disposed=false;
 function update(time,opacity){
  if(disposed)return;
  uniforms.uTime.value=Number.isFinite(time)?Math.max(0,time):0;
  uniforms.uOpacity.value=Math.max(0,Math.min(.7,opacity||0));
  mesh.visible=uniforms.uOpacity.value>.045;
 }
 function dispose(){if(disposed)return;disposed=true;root.remove(mesh);geometry.dispose();material.dispose();}
 return {mesh,update,dispose,stats:()=>({rainStreaks:count,gpuInstanced:true,cpuVertexUpdates:0,
  allocatedPositions:cross.length/3,seedCount:count})};
}
