import * as THREE from 'three';

export function bloodQuality({coarse=false,storage}={}){
 let low=false;try{storage??=globalThis.localStorage;low=storage?.getItem('oibung.quality')==='low';}catch{}
 return {low,segments:low?8:coarse?12:20,drops:low?64:coarse?128:240,puddles:low?10:coarse?18:28,wingRibs:low?4:6};
}
// A single shared wet dielectric material. The shader deforms the surface, never collision.
export function createBloodFluid(quality){
 const uniforms={time:{value:0},energy:{value:0}};
 const material=new THREE.MeshPhysicalMaterial({color:0x760821,emissive:0x290211,emissiveIntensity:.35,roughness:.24,metalness:0,clearcoat:.65,clearcoatRoughness:.18,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBloodTime=uniforms.time;shader.uniforms.uBloodEnergy=uniforms.energy;
  shader.vertexShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float flow=sin(position.y*3.1+position.x*2.3-uBloodTime*2.4)*sin(position.z*2.7+uBloodTime*1.7);
   float ripple=sin(position.x*7.0+position.y*4.0+uBloodTime*3.0)*0.025;
   transformed+=normal*(flow*(0.045+uBloodEnergy*0.025)+ripple);
   vBloodThickness=flow*0.5+0.5;`);
  shader.fragmentShader='varying float vBloodThickness;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= mix(vec3(0.50,0.33,0.40),vec3(1.25,0.85,0.70),vBloodThickness);');
 };
 const sphere=new THREE.SphereGeometry(1,quality.segments,Math.max(6,quality.segments/2)),column=new THREE.CylinderGeometry(.35,.75,1,quality.segments,8),sheet=new THREE.PlaneGeometry(1,1,quality.segments,8),torus=new THREE.TorusGeometry(1,.07,6,quality.segments*2);
 return {material,sphere,column,sheet,torus,update(time,energy=0){uniforms.time.value=time;uniforms.energy.value=energy;}};
}
