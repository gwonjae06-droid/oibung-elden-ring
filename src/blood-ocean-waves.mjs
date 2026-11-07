import * as THREE from 'three';

// Horizon mesh spends vertices near the play area, not in fogged-out water.
// At ~700 world units there is no visible square shoreline; a handful of
// logarithmic rings cost less than the former uniformly tessellated plane.
// All height and foam animation lives on the GPU. This mesh is decorative.
export function bloodOceanRadii({coarse=false}={}){
 return coarse?
  [2,12,24,27.5,29,33,39,48,62,83,115,160,224,312,430,560,700]:
  [1,7,15,23,27.5,29,31,34,38,43,50,60,75,94,120,157,205,270,352,450,570,700];
}
export function bloodOceanGeometry({coarse=false}={}){
 const segments=coarse?64:112,radii=bloodOceanRadii({coarse});
 const pos=[0,0,0],uv=[.5,.5],indices=[];
 for(const radius of radii){
  for(let j=0;j<segments;j++){
   const a=j*2*Math.PI/segments,x=radius*Math.cos(a),z=radius*Math.sin(a);
   pos.push(x,0,z);uv.push((x/1400)+.5,(z/1400)+.5);
  }
 }
 for(let j=0;j<segments;j++)indices.push(0,1+(j+1)%segments,1+j);
 for(let ring=0;ring<radii.length-1;ring++){
  const inner=1+ring*segments,outer=inner+segments;
  for(let j=0;j<segments;j++){
   const next=(j+1)%segments,a=inner+j,b=inner+next,c=outer+j,d=outer+next;
   indices.push(a,b,c,b,d,c);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}

// Shared wave function is evaluated in the vertex shader and again at two
// small offsets to compute a *moving* normal. Multi-band swells and crossing
// currents give physical volume without GPU fluid simulation or CPU writes.
export const BLOOD_OCEAN_VERTEX_FUNCTIONS=String.raw`
uniform float uSeaTime;
uniform float uSeaFrenzy;
uniform float uSeaDetail;
varying float vSeaSheen;
varying vec2 vSeaCoord;
varying float vSeaCrest;
float bloodSeaHeight(vec2 p){
 float d=length(p);
 float shore=smoothstep(27.8,54.0,d);
 float time=uSeaTime*(1.0+min(2.0,uSeaFrenzy)*.16);
 vec2 a=normalize(vec2(.93,.38));
 vec2 b=normalize(vec2(-.46,.89));
 float swell=.90*sin(dot(p,a)*.071-time*.74+
  .39*sin(dot(p,b)*.025+time*.22));
 float cross=.48*sin(dot(p,b)*.133-time*1.05);
 float chop=.19*sin(dot(p,vec2(.29,-.18))-time*1.43+
  .4*sin(dot(p,vec2(.07,.09))+time*.31));
 float micro=uSeaDetail*.045*sin(dot(p,vec2(1.33,.79))-time*2.3);
 float rage=1.0+.69*min(2.1,uSeaFrenzy);
 return shore*(swell+cross+chop+micro)*rage;
}
`;
export const BLOOD_OCEAN_FRAGMENT_FUNCTIONS=String.raw`
uniform float uSeaTime;
uniform float uSeaFrenzy;
varying float vSeaSheen;
varying vec2 vSeaCoord;
varying float vSeaCrest;
`;
