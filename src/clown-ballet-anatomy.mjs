// Reference-guided ballet anatomy. These lofts replace the stacked cylinder
// silhouette with continuous, elliptical human contours (wood-carved in the
// ballerina, anatomical stage sculpture for the male lead). Pure geometry:
// never allocate new buffers inside an animation frame.
export const BALLET_REFERENCE_MODEL=Object.freeze({
 female:'ivory-white sleeveless leotard, classical bun, one pointe, high passe and backward arched arms',
 male:'bare articulated back and ribcage, matte black high-waisted tights, airborne side-bent ballet leap'
});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const lerp=(a,b,t)=>a+(b-a)*t;
// A tension-reduced cubic Hermite curve. Continuous derivatives, no sharp
// rings or inflated overshoots at the waist, neck, knees and ankles.
function interpolate(profile,y,key){
 let i=0;
 while(i<profile.length-2&&profile[i+1].y<y)i++;
 const p=profile[i],q=profile[i+1],a=profile[Math.max(0,i-1)],b=profile[Math.min(profile.length-1,i+2)];
 const dy=q.y-p.y,t=clamp((y-p.y)/Math.max(.001,dy),0,1),t2=t*t,t3=t2*t;
 const m0=(q[key]-a[key])/Math.max(.001,q.y-a.y)*dy;
 const m1=(b[key]-p[key])/Math.max(.001,b.y-p.y)*dy;
 return (2*t3-3*t2+1)*p[key]+(t3-2*t2+t)*m0+(-2*t3+3*t2)*q[key]+(t3-t2)*m1;
}
const r=(y,x,z,offset=0)=>({y,x,z,offset});
// Anatomical shoulder ridge, narrow sculpted midriff, flattened belly,
// projecting sternum and real pelvis, expressed as one continuous surface.
const MALE=[
 r(1.40,.12,.19),r(1.46,.39,.31),r(1.67,.53,.39),r(1.92,.51,.35),
 r(2.08,.39,.31),r(2.28,.40,.30),r(2.57,.49,.35),r(2.86,.57,.40),
 r(3.08,.67,.44,.035),r(3.29,.77,.43,.055),r(3.48,.73,.39,.01),
 r(3.61,.48,.31,-.015),r(3.78,.19,.19,-.045),r(3.92,.13,.16,-.045)
];
const FEMALE=[
 r(1.40,.13,.20),r(1.48,.36,.32),r(1.63,.54,.39),r(1.86,.53,.37),
 r(2.05,.35,.28),r(2.22,.29,.25),r(2.45,.32,.28),r(2.75,.38,.33),
 r(3.04,.47,.39,.025),r(3.27,.53,.35,.025),r(3.45,.55,.32,-.015),
 r(3.59,.37,.26,-.025),r(3.77,.16,.16,-.045),r(3.94,.12,.14,-.045)
];

function makeLoft(THREE,profile,{coarse=false,materialAt=()=>0}={}){
 const radial=coarse?24:56,rows=coarse?42:104;
 const lo=profile[0].y,hi=profile[profile.length-1].y;
 const positions=[],uv=[],indices=[],groups=[];
 for(let k=0;k<=rows;k++){
  const t=k/rows,y=lerp(lo,hi,t);
  const rx=interpolate(profile,y,'x'),rz=interpolate(profile,y,'z');
  const offset=interpolate(profile,y,'offset');
  for(let j=0;j<=radial;j++){
   const a=j*Math.PI*2/radial,s=Math.sin(a),c=Math.cos(a);
   // a modest clavicle ridge and abdominal-plane transition avoid a perfectly
   // rotational surface. All deforming parts still remain a stable silhouette.
   const upper=clamp((y-2.8)/.65,0,1),front=Math.max(0,c);
   const sculpt=1+front*upper*.075*(1-.5*Math.abs(s));
   positions.push(s*rx,y,offset+c*rz*sculpt);
   uv.push(j/radial,t);
  }
 }
 for(let k=0;k<rows;k++){
  const start=indices.length;
  for(let j=0;j<radial;j++){
   const a=k*(radial+1)+j,b=a+radial+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
  groups.push([start,radial*6,materialAt((k+.5)/rows)]);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);
 for(const [start,count,mat] of groups)geo.addGroup(start,count,mat);
 geo.computeVertexNormals();geo.computeBoundingSphere();
 return geo;
}
export function createBalletTorsoGeometry(THREE,{lead=false,coarse=false}={}){
 return makeLoft(THREE,lead?MALE:FEMALE,{
  coarse,
  // slot 0 = flesh/wood, slot 1 = garment.
  materialAt:t=>lead?(t<.25?1:0):(t>.88?0:1)
 });
}
export function createBalletMuscleLimbGeometry(THREE,{kind='forearm',coarse=false}={}){
 const profiles={
  upperArm:[.75,1,1.14,1.04,.89,.72],
  forearm:[.65,.83,1.06,1,.75,.53],
  thigh:[.73,1.02,1.23,1.11,.92,.72],
  calf:[.57,.76,1.14,1.13,.83,.55]
 };
 const radii=profiles[kind]||profiles.forearm;
 const radial=coarse?14:32,rows=coarse?12:26;
 const positions=[],uv=[],indices=[];
 for(let k=0;k<=rows;k++){
  const t=k/rows,segment=Math.min(4,Math.floor(t*5)),sub=t*5-segment;
  const radius=lerp(radii[segment],radii[segment+1],sub);
  const y=t-.5;
  for(let j=0;j<=radial;j++){
   const a=j*2*Math.PI/radial;
   // Calf/thigh mass differs in frontal and sagittal views.
   const depth=(kind==='calf'||kind==='thigh')?.88:.92;
   positions.push(Math.sin(a)*radius,y,Math.cos(a)*radius*depth);
   uv.push(j/radial,t);
  }
 }
 for(let k=0;k<rows;k++)for(let j=0;j<radial;j++){
  const a=k*(radial+1)+j,b=a+radial+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 return geo;
}
