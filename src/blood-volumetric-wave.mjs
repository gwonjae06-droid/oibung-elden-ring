import * as THREE from 'three';

// Convex-enough closed wet masses: geometry exists ONCE per graphics tier and
// is re-used by all hazard renderers. The actual hit tests stay in blood-data.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

export function sampleBloodCrest(u,angle,{undertow=false}={}){
 const x=clamp(u)*2-1,theta=angle;
 const arch=.66+.34*Math.pow(Math.max(0,Math.sin(Math.PI*clamp(u))),.7),
  wave=(.5+.5*Math.sin(theta)),curl=smooth((wave-.52)/.48),
  ripple=Math.sin(x*17+theta*2.1)*.027+Math.sin(x*9-theta*3.1)*.02;
 const y=(undertow?.21:1.0)*arch*wave+.016,
  thickness=undertow?.62:.47,
  z=(undertow?-.35:0)+thickness*Math.cos(theta)+(undertow?.18:.52)*curl+wave*ripple;
 return [x,y,z];
}
export function bloodVolumetricWaveGeometry(segments=20,{undertow=false}={}){
 const along=Math.max(12,Math.round(segments*1.25)),around=Math.max(10,Math.round(segments*.65));
 const positions=[],uvs=[],indices=[];
 for(let i=0;i<=along;i++)for(let j=0;j<=around;j++){
  const u=i/along,v=j/around,xyz=sampleBloodCrest(u,v*Math.PI*2,{undertow});
  positions.push(...xyz);uvs.push(u,v);
 }
 for(let i=0;i<along;i++)for(let j=0;j<around;j++){
  const a=i*(around+1)+j,b=a+around+1;
  indices.push(a,a+1,b,b,a+1,b+1);
 }
 // Close each end so the silhouette reads as a heavy object from side-on.
 const left=positions.length/3;positions.push(-1,.28*(undertow?.21:1)+.016,undertow?-.35:.05);uvs.push(0,.5);
 const right=positions.length/3;positions.push(1,.28*(undertow?.21:1)+.016,undertow?-.35:.05);uvs.push(1,.5);
 for(let j=0;j<around;j++){
  indices.push(left,j,j+1);
  const k=along*(around+1)+j;indices.push(right,k+1,k);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
export function bloodWaveVisualPose(h,post=0,clock=0,{reduced=false,tide=false}={}){
 const warn=Math.max(.01,h.warn||1),life=Math.max(.08,h.life||1),
  charge=clamp(h.age/warn),age=Math.max(0,h.age-warn),
  fired=h.age>=warn,crestRise=smooth(age/Math.min(.42,life*.42)),
  retire=smooth((age-life*.66)/Math.max(.08,life*.34)),
  tail=smooth(post/1.4);
 const phase=fired?crestRise*(1-retire*.58):smooth(charge)*.25;
 const height=(fired?2.8+(tide?15.5:12.3)*phase:1.3+3.2*smooth(charge))*(1-tail);
 return {
  active:fired,charge,phase,
  height:Math.max(.001,height),
  width:Math.max(2,(h.width||4)*2),
  crestForward:(fired?1.0+2.0*phase:.15+charge*.35),
  spray:fired&&age<life&&post===0,
  wobble:reduced?0:Math.sin(clock*2.1+(h.id||0)*.7)*.065*phase
 };
}
