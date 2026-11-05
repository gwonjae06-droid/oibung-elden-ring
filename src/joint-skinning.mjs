import {loft} from './player-geometry.mjs';

// A deliberately small, real GPU-skinned flexible underlayer between two
// existing rigid armor joints. The rigid plates, animation hierarchy, bone
// lengths, hurtboxes and attack clocks remain untouched.
export function createWeightedJoint(T,parent,child,material,{
 name='articulated-joint',radius=.10,length=.22,sides=10,rows=6,
 offsetX=0,offsetZ=0
}={}){
 if(!parent?.isObject3D||!child?.isObject3D||!material)throw new TypeError('joint needs two groups and a material');
 const n=Math.max(6,Math.min(16,Math.floor(sides)));
 const r=Math.max(4,Math.min(9,Math.floor(rows)));
 const half=Math.max(.035,Math.min(.22,Number.isFinite(length)?length/2:.11));
 const centerX=child.position.x+offsetX,centerY=child.position.y,centerZ=child.position.z+offsetZ;
 const rings=[];
 for(let j=0;j<=r;j++){
  const t=j/r,y=centerY+half-2*half*t;
  // Flexible lining narrows slightly at both armor lips; the central pleat
  // stays broad enough not to disappear during a sharp knee/elbow bend.
  const fold=.85+.15*Math.sin(Math.PI*t);
  rings.push([y,radius*fold,radius*fold*.92,centerX,centerZ]);
 }
 const geometry=loft(T,rings,n);
 const positions=geometry.attributes.position;
 const indices=new Uint16Array(positions.count*4),weights=new Float32Array(positions.count*4);
 for(let i=0;i<positions.count;i++){
  const t=Math.max(0,Math.min(1,(centerY+half-positions.getY(i))/(2*half)));
  const smoothed=t*t*(3-2*t);
  indices[i*4]=0;indices[i*4+1]=1;
  weights[i*4]=1-smoothed;weights[i*4+1]=smoothed;
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const top=new T.Bone();top.name=name+'-upper-skin-bone';parent.add(top);
 const bottom=new T.Bone();bottom.name=name+'-lower-skin-bone';child.add(bottom);
 const mesh=new T.SkinnedMesh(geometry,material);
 mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
 mesh.userData.skipCinematicMaterial=true;
 parent.add(mesh);
 // Bind after both proxy bones and mesh have valid world transforms. No
 // per-frame vertex upload or additional animation update is necessary.
 top.updateWorldMatrix(true,false);bottom.updateWorldMatrix(true,false);
 mesh.updateWorldMatrix(true,false);
 mesh.bind(new T.Skeleton([top,bottom]));
 return mesh;
}
