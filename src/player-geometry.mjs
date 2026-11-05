// Authored profiles, not assembled Three.js primitives. Geometry is generated
// once at startup; all animation moves joints or the small cloth vertex grid.
export function loft(T,rings,sides=12,axis='y'){
 const p=[],uv=[],indices=[];
 for(let j=0;j<rings.length;j++){
  const [h,rx,rz,cx=0,cz=0]=rings[j];
  for(let i=0;i<=sides;i++){
   const a=i/sides*Math.PI*2,x=cx+Math.cos(a)*rx,z=cz+Math.sin(a)*rz;
   p.push(x,axis==='y'?h:z,axis==='y'?z:h);uv.push(i/sides,j/(rings.length-1));
   if(j&&i){const k=j*(sides+1)+i;indices.push(k-sides-2,k-1,k,k-sides-2,k,k-sides-1);}
  }
 }
 // Closed ends share the existing profile so no separate caps draw is needed.
 for(const j of [0,rings.length-1])for(let i=1;i<sides-1;i++){
  const k=j*(sides+1);if(j===0)indices.push(k,k+i,k+i+1);else indices.push(k,k+i+1,k+i);
 }
 if(axis==='z')for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function plate(T,outline,depth=.035){
 const p=[],uv=[],points=outline.map(([x,y])=>new T.Vector2(x,y));
 const faces=T.ShapeUtils.triangulateShape(points,[]);
 const add=(x,y,z)=>{p.push(x,y,z);uv.push(x+.5,y+.5);};
 for(const side of [-1,1])for(const f of faces){const ids=side>0?f:[...f].reverse();for(const i of ids)add(...outline[i],side*depth/2);}
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length];
  for(const v of [[...a,-depth/2],[...b,-depth/2],[...a,depth/2],[...a,depth/2],[...b,-depth/2],[...b,depth/2]])add(...v);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function beam(T,path,sides=8){
 const p=[],uv=[],idx=[],forward=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3();
 for(let j=0;j<path.length;j++){
  const q=path[j],a=path[Math.max(0,j-1)],b=path[Math.min(path.length-1,j+1)];
  forward.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
  up.set(Math.abs(forward.y)>.9?1:0,Math.abs(forward.y)>.9?0:1,0);right.crossVectors(forward,up).normalize();up.crossVectors(right,forward);
  for(let i=0;i<=sides;i++){
   const angle=i/sides*Math.PI*2,c=Math.cos(angle)*(q[3]??.03),s=Math.sin(angle)*(q[4]??q[3]??.03);
   p.push(q[0]+right.x*c+up.x*s,q[1]+right.y*c+up.y*s,q[2]+right.z*c+up.z*s);uv.push(i/sides,j/(path.length-1));
   if(i&&j){const k=j*(sides+1)+i;idx.push(k-sides-2,k-1,k,k-sides-2,k,k-sides-1);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function addMesh(T,parent,geometry,material,name,x=0,y=0,z=0){
 const m=new T.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;m.userData.skipCinematicMaterial=true;parent.add(m);return m;
}
// One draw per material per rigid joint, including trims and fine sculpt details.
export function mergeRigid(T,parent){
 const groups=new Map();
 for(const m of [...parent.children])if(m.isMesh&&!Array.isArray(m.material)){
  const a=groups.get(m.material)||[];a.push(m);groups.set(m.material,a);
 }
 for(const [material,meshes]of groups){if(meshes.length<2)continue;
  const p=[],n=[],uv=[],v=new T.Vector3(),normalMatrix=new T.Matrix3();
  for(const m of meshes){m.updateMatrix();normalMatrix.getNormalMatrix(m.matrix);const g=m.geometry,a=g.attributes.position,b=g.attributes.normal,t=g.attributes.uv;
   const size=g.index?.count??a.count;
   for(let i=0;i<size;i++){const k=g.index?g.index.getX(i):i;v.fromBufferAttribute(a,k).applyMatrix4(m.matrix);p.push(v.x,v.y,v.z);v.fromBufferAttribute(b,k).applyMatrix3(normalMatrix).normalize();n.push(v.x,v.y,v.z);uv.push(t?.getX(k)??0,t?.getY(k)??0);}
   parent.remove(m);g.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));addMesh(T,parent,g,material,meshes[0].name+'-details');
 }
}
// Tiny flying props retain authored colours in one draw rather than repeating
// three material passes for each arrow/card in a volley.
export function mergeTinted(T,parent,material){
 const p=[],n=[],uv=[],color=[],v=new T.Vector3(),nm=new T.Matrix3();
 for(const mesh of [...parent.children])if(mesh.isMesh){
  mesh.updateMatrix();nm.getNormalMatrix(mesh.matrix);const g=mesh.geometry,a=g.attributes.position,b=g.attributes.normal,t=g.attributes.uv,c=mesh.material.color;
  for(let i=0;i<(g.index?.count??a.count);i++){const k=g.index?g.index.getX(i):i;v.fromBufferAttribute(a,k).applyMatrix4(mesh.matrix);p.push(v.x,v.y,v.z);v.fromBufferAttribute(b,k).applyMatrix3(nm).normalize();n.push(v.x,v.y,v.z);uv.push(t?.getX(k)??0,t?.getY(k)??0);color.push(c.r,c.g,c.b);}
  parent.remove(mesh);g.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));const mesh=addMesh(T,parent,g,material,'player-crafted-flight-model');mesh.castShadow=mesh.receiveShadow=false;
}
