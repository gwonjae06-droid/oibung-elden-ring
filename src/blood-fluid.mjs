import * as THREE from 'three';
import {bloodSculptureGeometries} from './blood-sculpture.mjs';

export function bloodQuality({coarse=false}={}){
 return {low:false,segments:coarse?12:20,drops:coarse?192:360,puddles:coarse?28:44,ripples:coarse?16:28,wingRibs:6};
}
// A single shared wet dielectric material. The shader deforms the surface, never collision.
export function createBloodFluid(quality){
 const uniforms={time:{value:0},energy:{value:0}};
 const material=new THREE.MeshPhysicalMaterial({color:0x760821,emissive:0x290211,emissiveIntensity:.35,roughness:.24,metalness:0,clearcoat:.65,clearcoatRoughness:.18,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBloodTime=uniforms.time;shader.uniforms.uBloodEnergy=uniforms.energy;
  shader.vertexShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness;\n'+shader.vertexShader;
  // Slower, larger swell than before so the surface laps like thick liquid instead of buzzing.
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float flow=sin(position.y*3.1+position.x*2.3-uBloodTime*1.5)${quality.low?'':'*sin(position.z*2.7+uBloodTime*1.1)'};
   float ripple=${quality.low?'0.0':'sin(position.x*7.0+position.y*4.0+uBloodTime*2.0)*0.03'};
   transformed+=normal*(flow*(0.06+uBloodEnergy*0.035)+ripple);
   vBloodThickness=flow*0.5+0.5;`);
  shader.fragmentShader='varying float vBloodThickness;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= mix(vec3(0.50,0.33,0.40),vec3(1.25,0.85,0.70),vBloodThickness);');
 };
 const geometry=bloodSculptureGeometries(quality.segments);
 return {material,...geometry,resources:[material,...Object.values(geometry)],update(time,energy=0){uniforms.time.value=time;uniforms.energy.value=energy;}};
}
