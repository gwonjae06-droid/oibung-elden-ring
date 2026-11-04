import * as THREE from 'three';

export function bloodQuality({coarse=false,storage}={}){
 let low=false;try{storage??=globalThis.localStorage;low=storage?.getItem('oibung.quality')==='low';}catch{}
 return {low,segments:low?8:coarse?12:20,drops:low?96:coarse?192:360,puddles:low?14:coarse?28:44,ripples:low?8:coarse?16:28,wingRibs:low?4:6};
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
 const sphere=new THREE.SphereGeometry(1,quality.segments,Math.max(6,quality.segments/2)),column=new THREE.CylinderGeometry(.35,.75,1,quality.segments,8),sheet=new THREE.PlaneGeometry(1,1,quality.segments,8),torus=new THREE.TorusGeometry(1,.07,6,quality.segments*2);
 const columnPos=column.attributes.position,sheetPos=sheet.attributes.position;
 for(let i=0;i<columnPos.count;i++){const y=columnPos.getY(i)+.5;columnPos.setX(i,columnPos.getX(i)+Math.sin(y*Math.PI)*.15);columnPos.setZ(i,columnPos.getZ(i)+Math.sin(y*Math.PI*1.7)*.1);}
 for(let i=0;i<sheetPos.count;i++){const x=sheetPos.getX(i),u=sheetPos.getY(i)+.5;sheetPos.setZ(i,Math.sin(u*Math.PI*.8)*.3+u*u*.15);sheetPos.setY(i,sheetPos.getY(i)+Math.sin(x*17)*.035*u*u);}
 column.computeVertexNormals();sheet.computeVertexNormals();
 const curve=fn=>new THREE.CatmullRomCurve3(Array.from({length:33},(_,i)=>fn(i/32)));
 const tendril=new THREE.TubeGeometry(curve(u=>new THREE.Vector3(Math.sin(u*Math.PI*4)*.3,u-.5,Math.cos(u*Math.PI*4)*.3)),quality.segments*2,.12,5,false);
 const spiral=new THREE.TubeGeometry(curve(u=>new THREE.Vector3(Math.sin(u*Math.PI*5)*(.12+u*.88),u*.1,Math.cos(u*Math.PI*5)*(.12+u*.88))),quality.segments*3,.04,5,false);
 const blade=new THREE.PlaneGeometry(1,1,quality.segments,2),attr=blade.attributes.position;
 for(let i=0;i<attr.count;i++){const a=attr.getX(i)*2.3,r=.88+(attr.getY(i)+.5)*.12;attr.setXYZ(i,Math.sin(a)*r,Math.sin(a*2)*.14,Math.cos(a)*r);}blade.computeVertexNormals();
 return {material,sphere,column,sheet,torus,tendril,spiral,blade,resources:[material,sphere,column,sheet,torus,tendril,spiral,blade],update(time,energy=0){uniforms.time.value=time;uniforms.energy.value=energy;}};
}
