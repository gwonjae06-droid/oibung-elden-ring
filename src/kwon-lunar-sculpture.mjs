// Sculpted, non-spherical lunar rocks shared by the cinematic and meteor pool.
// Every mesh is made from fixed triangulated stone planes; no GPU tessellation,
// extra render targets or physics colliders are created in this visual module.
const TAU=Math.PI*2;
const hash=(n)=>{const v=Math.sin(n*127.1+78.233)*43758.5453;return v-Math.floor(v);};
function build(T,outer,interior){
 const data=[...outer.flat(),...interior.flat()],geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(data,3));
 geometry.clearGroups();
 geometry.addGroup(0,outer.length*3,0);
 geometry.addGroup(outer.length*3,interior.length*3,1);
 geometry.computeVertexNormals();
 return geometry;
}
export function createFracturedMeteorGeometry(T,{variant=0,coarse=false}={}){
 const n=coarse?8:11,top=[],bottom=[],outer=[],interior=[];
 const topPeak=[.08,2.34,.08],bottomPeak=[-.22,-1.55,-.18];
 for(let i=0;i<n;i++){
  const theta=TAU*i/n+.12*Math.sin(i*2.7+variant);
  const r=.80+.24*hash(i*2.7+variant*9);
  const x=Math.cos(theta)*r,z=Math.sin(theta)*r;
  top.push([x,.88+1.0*hash(i*3.11+variant*7),z]);
  bottom.push([x*(.78+.12*hash(i+variant)), -1.08-.48*hash(i*3.8+variant),z*(.78+.12*hash(i+variant))]);
 }
 for(let i=0;i<n;i++){
  const next=(i+1)%n,a=top[i],b=top[next],c=bottom[i],d=bottom[next];
  outer.push([topPeak,a,b],[c,d,b],[c,b,a]);
  // Exposed pale-grey inner fracture planes are genuinely parts of the rock,
  // not circular pieces attached to a sphere.
  interior.push([bottomPeak,d,c]);
 }
 const geometry=build(T,outer,interior);
 geometry.userData.sculpture='asymmetric-cracked-lunar-slab';
 geometry.userData.facets=n;
 return geometry;
}
export function createSplitMoonBandGeometry(T,{radius=9.2,bottom=-9.2,top=9.2,coarse=false,variant=0}={}){
 const segments=coarse?24:40,rows=coarse?6:10,outer=[],interior=[];
 const rings=[];
 for(let j=0;j<=rows;j++){
  const y=bottom+(top-bottom)*j/rows,rr=Math.sqrt(Math.max(0,radius*radius-y*y));
  const ring=[];
  for(let i=0;i<segments;i++){
   const a=TAU*i/segments,jitter=1+.024*Math.sin(a*13.1+y*.48+variant)+.018*Math.sin(a*27.2-y*.72);
   const r=rr*jitter;
   ring.push([Math.cos(a)*r,y+.045*Math.sin(a*13+y*.71),Math.sin(a)*r]);
  }
  rings.push(ring);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
  const k=(i+1)%segments,a=rings[j][i],b=rings[j][k],c=rings[j+1][i],d=rings[j+1][k];
  outer.push([a,b,c],[b,d,c]);
 }
 // Solid rock cross-sections physically appear as the four moon sections
 // separate. Triangulated caps make it impossible to see through the moon.
 for(const [j,sign] of [[0,-1],[rows,1]]){
  const centre=[0,(j===0?bottom:top),0],ring=rings[j];
  for(let i=0;i<segments;i++){
   const k=(i+1)%segments;
   interior.push(sign<0?[centre,ring[k],ring[i]]:[centre,ring[i],ring[k]]);
  }
 }
 const geometry=build(T,outer,interior);
 geometry.userData.sculpture='solid-section-of-sliced-moon';
 geometry.userData.cutBottom=bottom;geometry.userData.cutTop=top;
 return geometry;
}
export function createCelestialJawBladeGeometry(T){
 const outer=[],interior=[];
 const upper=[[-16,-.75,0],[-11,-1.75,0],[-6,-2.5,-.3],[.5,-2.7,-.4],[7,-1.85,-.3],[14.8,0,0]];
 const lower=[[-16,.75,0],[-11,1.75,0],[-6,2.5,.2],[.5,2.7,.4],[7,1.85,.3],[14.8,0,0]];
 for(let i=0;i<upper.length-1;i++){
  const [a,b,c,d]=[upper[i],lower[i],upper[i+1],lower[i+1]];
  const mid=[(a[0]+b[0]+c[0]+d[0])*.25,(a[1]+b[1]+c[1]+d[1])*.25,1.3];
  outer.push([a,b,mid],[b,d,mid],[d,c,mid],[c,a,mid]);
  const back=[mid[0],mid[1],-1];
  interior.push([b,a,back],[d,b,back],[c,d,back],[a,c,back]);
 }
 const geometry=build(T,outer,interior);
 geometry.userData.sculpture='heavy-asymmetric-jaw-shaped-celestial-sword';
 return geometry;
}
