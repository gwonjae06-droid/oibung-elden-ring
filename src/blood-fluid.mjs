import * as THREE from 'three';
import {bloodSculptureGeometries} from './blood-sculpture.mjs';

export function bloodQuality({coarse=false}={}){
 return {low:coarse,segments:coarse?12:20,drops:coarse?192:360,puddles:coarse?28:44,ripples:coarse?16:28,wingRibs:6};
}
// A single shared wet dielectric material. The shader deforms the surface, never collision.
export function createBloodFluid(quality){
 const uniforms={time:{value:0},energy:{value:0}};
 const material=new THREE.MeshPhysicalMaterial({color:0x760821,emissive:0x290211,emissiveIntensity:.35,roughness:.24,metalness:0,clearcoat:.65,clearcoatRoughness:.18,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBloodTime=uniforms.time;shader.uniforms.uBloodEnergy=uniforms.energy;
  shader.vertexShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness; varying vec3 vBloodCoord;\n'+shader.vertexShader;
  // Two gently advected waves move along one shared flow direction; the
  // smaller wave responds to energy rather than vibrating at random speeds.
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec2 currentDir=normalize(vec2(0.84,0.54));
   float along=dot(position.xz,currentDir);
   float crossFlow=dot(position.xz,vec2(-currentDir.y,currentDir.x));
   float flow=sin(along*2.4-uBloodTime*(1.06+uBloodEnergy*0.25)
      +sin(crossFlow*1.25+uBloodTime*0.24)*0.48);
   float secondary=${quality.low?'0.0':'sin(along*4.1-uBloodTime*1.44+crossFlow*0.77)*0.023'};
   float wave=flow*(0.046+uBloodEnergy*0.03)+secondary;
   transformed+=normal*wave;
   vBloodThickness=flow*0.5+0.5;
   vBloodCoord=position.xyz;`);
  shader.fragmentShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness; varying vec3 vBloodCoord;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    // Highlights ride downstream with the liquid, not across the surface.
    vec2 currentDir=normalize(vec2(0.84,0.54));
    float along=dot(vBloodCoord.xz,currentDir);
    float across=dot(vBloodCoord.xz,vec2(-currentDir.y,currentDir.x));
    float bend=sin(across*1.5+uBloodTime*.23)*.52;
    float current=sin(along*3.4-uBloodTime*(1.04+uBloodEnergy*.16)+bend);
    float eddy=sin(across*2.8+along*.68-uBloodTime*.47);
    float sheen=clamp(.49+.19*current+.085*eddy+.19*(vBloodThickness-.5),0.,1.);
    diffuseColor.rgb*=mix(vec3(.7,.52,.58),vec3(1.14,.91,.87),sheen);
  `);
 };
 const geometry=bloodSculptureGeometries(quality.segments);
 return {material,...geometry,resources:[material,...Object.values(geometry)],update(time,energy=0){uniforms.time.value=time;uniforms.energy.value=energy;}};
}
