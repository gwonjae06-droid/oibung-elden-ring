import * as THREE from 'three';
import {BLOOD_TSUNAMI} from './blood-tsunami.mjs';

/**
 * Transparent, flowing rose-pink blood INSIDE the tsunami's real collision-free
 * opening. Travels with both crests; nothing is projected onto the arena floor.
 * Two shared, GPU-warped skins per crest imply viscous depth. This component
 * owns no collision and performs no per-frame geometry allocations.
 */
export function createBloodTsunamiSafeFill(parent,{coarse=false,reduced=false}={}){
 const width=BLOOD_TSUNAMI.safeHalfWidth*2;
 const height=BLOOD_TSUNAMI.primaryHeight;
 const geometry=new THREE.PlaneGeometry(width,height,
  coarse?10:22,coarse?12:26);
 const uniforms={
  uSafeTime:{value:0},
  uSafeSurge:{value:0},
  uSafeOpacity:{value:reduced?.72:1}
 };
 const material=new THREE.ShaderMaterial({
  uniforms,side:THREE.DoubleSide,transparent:true,depthTest:true,depthWrite:false,
  vertexShader:String.raw`
uniform float uSafeTime,uSafeSurge;
varying vec2 vSafeUv;
varying float vSafeFold;
void main(){
 vSafeUv=uv;
 vec3 p=position;
 float clock=uSafeTime*(1.0+.16*uSafeSurge);
 float slow=sin(p.y*.27-clock*.96+sin(p.x*.55+clock*.35)*.57);
 float twist=sin(p.x*1.05+p.y*.46-clock*1.52);
 float ripple=sin(p.y*1.15-p.x*.72-clock*2.18);
 float lip=smoothstep(.04,.45,uv.y);
 // Never alter x: the visual gap stays exactly the collision-free width.
 p.z+=(.42*slow+.17*twist+.055*ripple)*(.3+.7*lip);
 p.y+=.09*sin(p.x*.91+p.y*.38-clock*.8)*lip;
 vSafeFold=.56+.24*slow+.13*twist+.07*ripple;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}
`,
  fragmentShader:String.raw`
precision mediump float;
uniform float uSafeTime,uSafeSurge,uSafeOpacity;
varying vec2 vSafeUv;
varying float vSafeFold;
void main(){
 float x=vSafeUv.x,y=vSafeUv.y;
 float drift=uSafeTime*(.77+.11*uSafeSurge);
 float stream=sin(y*24.0+x*9.1-drift*1.3+
  .67*sin(x*13.0-y*6.0+drift*.61));
 float cross=sin(x*19.0-y*11.0+drift*.83);
 float wet=clamp(.52+.21*stream+.16*cross+.2*(vSafeFold-.5),0.,1.);
 // Clear, pale rose blood instead of a saturated danger-red wall.
 vec3 blush=mix(vec3(.83,.35,.45),vec3(1.0,.72,.78),wet);
 float rim=pow(abs(x-.5)*2.0,8.0);
 blush+=vec3(.12,.12,.12)*rim;
 float top=1.0-smoothstep(.88,1.,y)*.36;
 float bottom=smoothstep(0.,.08,y);
 float alpha=(.21+.10*wet+.13*rim)*top*(.65+.35*bottom)*uSafeOpacity;
 gl_FragColor=vec4(blush,clamp(alpha,0.,.52));
}
`
 });
 const skins=Array.from({length:2},(_,row)=>Array.from({length:2},(_,layer)=>{
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='blood-tsunami-safe-pink-liquid-'+row+'-'+layer;
  mesh.position.y=height*.5;
  mesh.frustumCulled=false;mesh.renderOrder=4;
  mesh.visible=false;parent.add(mesh);
  return mesh;
 }));
 let disposed=false;
 function setRow(row,z,visible,closeness=1){
  if(disposed)return;
  const pair=skins[row];
  if(!pair)return;
  for(let i=0;i<pair.length;i++){
   const mesh=pair[i];mesh.visible=Boolean(visible);
   if(!visible)continue;
   mesh.position.z=z+(i===0?-.22:.22);
   mesh.scale.y=.83+.17*Math.max(0,Math.min(1,closeness));
  }
 }
 function update(time,surge){
  if(disposed)return;
  uniforms.uSafeTime.value=Number.isFinite(time)?time:0;
  uniforms.uSafeSurge.value=Number.isFinite(surge)?Math.max(0,surge):0;
 }
 function reset(){for(const row of skins)for(const mesh of row)mesh.visible=false;}
 function dispose(){
  if(disposed)return;disposed=true;reset();
  for(const row of skins)for(const mesh of row)mesh.parent?.remove(mesh);
  geometry.dispose();material.dispose();
 }
 return {skins,material,geometry,setRow,update,reset,dispose,
  stats:()=>({surfaceCount:4,drawCallsMax:4,geometryVertices:geometry.getAttribute('position').count,
   safeHalfWidth:BLOOD_TSUNAMI.safeHalfWidth,floorMarker:false,decorativeOnly:true,damageSources:0})};
}
