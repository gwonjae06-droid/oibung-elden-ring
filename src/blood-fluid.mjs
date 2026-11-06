import * as THREE from 'three';
import {bloodSculptureGeometries} from './blood-sculpture.mjs';

export function bloodQuality({coarse=false}={}){
 return {low:coarse,segments:coarse?12:20,drops:coarse?192:360,puddles:coarse?28:44,ripples:coarse?16:28,wingRibs:6};
}
// A single shared wet dielectric material. The shader deforms the surface, never collision.
export function createBloodFluid(quality){
 const uniforms={time:{value:0},energy:{value:0}};
 const Material=quality.low?THREE.MeshStandardMaterial:THREE.MeshPhysicalMaterial;
 const material=new Material({color:0x760821,emissive:0x290211,emissiveIntensity:.35,
  roughness:quality.low?.29:.24,metalness:.07,side:THREE.DoubleSide,
  ...(quality.low?{}:{clearcoat:.58,clearcoatRoughness:.2})});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBloodTime=uniforms.time;shader.uniforms.uBloodEnergy=uniforms.energy;
  shader.vertexShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness; varying vec3 vBloodCoord;\n'+shader.vertexShader;
  // Deform every existing reusable blood mesh in local coordinates: swells,
  // pulsing shells, sticky sheets and bending chains without CPU sim work.
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec2 currentDir=normalize(vec2(.84,.54));
   float along=dot(position.xz,currentDir);
   float crossFlow=dot(position.xz,vec2(-currentDir.y,currentDir.x));
   float slow=uBloodTime*(1.0+uBloodEnergy*.23);
   float swirl=sin(along*3.1-slow*.96+sin(position.y*4.7+slow*.3)*.45);
   float pulse=sin(position.y*5.3+crossFlow*2.2+slow*.68);
   float curl=sin(position.x*7.2+position.z*5.4-slow*1.36);
   float rip=${quality.low?'0.0':'sin(along*10.3+position.y*7.2-slow*1.82)*.014'};
   float wave=(.052+.043*uBloodEnergy)*swirl+.036*pulse+.019*curl+rip;
   transformed+=normal*wave;
   transformed.x+=.035*sin(position.y*6.1+slow*.8+crossFlow*3.8);
   transformed.z+=.031*sin(position.y*5.0-slow*.61+along*2.9);
   vBloodThickness=.5+.28*swirl+.18*pulse;
   vBloodCoord=position.xyz;`);
  shader.fragmentShader='uniform float uBloodTime; uniform float uBloodEnergy; varying float vBloodThickness; varying vec3 vBloodCoord;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 bloodDir=normalize(vec2(.84,.54));
    float along=dot(vBloodCoord.xz,bloodDir);
    float across=dot(vBloodCoord.xz,vec2(-bloodDir.y,bloodDir.x));
    float deep=sin(along*3.9-uBloodTime*(.81+uBloodEnergy*.18)
      +sin(vBloodCoord.y*3.1+across*1.4+uBloodTime*.21)*.55);
    float counter=sin(across*4.8+vBloodCoord.y*3.7-uBloodTime*1.06);
    float veins=sin(vBloodCoord.y*9.1+along*7.2-uBloodTime*1.42);
    float wet=clamp(.42+.21*deep+.12*counter+.19*(vBloodThickness-.5),0.,1.);
    diffuseColor.rgb*=mix(vec3(.58,.38,.47),vec3(1.43,1.03,1.0),wet);
    diffuseColor.rgb+=vec3(.09,.016,.038)*smoothstep(.79,.99,veins*.5+.5);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 viscousNormal=vec3(
      sin(vBloodCoord.z*9.0-uBloodTime*.92),
      sin(vBloodCoord.x*10.1+uBloodTime*.73),
      cos(vBloodCoord.y*8.2-uBloodTime*.86));
    normal=normalize(normal+viscousNormal*${quality.low?'.065':'.12'});
  `);
 };
 const geometry=bloodSculptureGeometries(quality.segments);
 return {material,...geometry,resources:[material,...Object.values(geometry)],update(time,energy=0){uniforms.time.value=time;uniforms.energy.value=energy;}};
}
