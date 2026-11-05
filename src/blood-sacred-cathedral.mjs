import * as THREE from 'three';

// An open combat nave surrounded by detailed, non-colliding Gothic architecture.
// The cathedral occupies space OUTSIDE the authoritative radius-28 arena.
// This scene is built once; no decorative geometry is allocated during update.
const TAU=Math.PI*2, v=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function seededNoise(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function marbleTexture(){
 if(!globalThis.document?.createElement)return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const image=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const n=seededNoise(x,y),vein=Math.sin(x*.072+y*.054+Math.sin(y*.017)*3.8+Math.sin(x*.039)*1.6);
  const shade=clamp(233+n*12-18*Math.pow(Math.max(0,vein),15),172,255),k=(y*256+x)*4;
  image.data[k]=shade;image.data[k+1]=Math.min(255,shade+2);image.data[k+2]=Math.min(255,shade+5);image.data[k+3]=255;
 }
 ctx.putImageData(image,0,0);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(4,4);tex.anisotropy=4;
 return tex;
}
function mesh(parent,geometry,material,x=0,y=0,z=0){
 const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;
}
function tube(parent,points,radius,mat,segments=20){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>v(...p)));
 return mesh(parent,new THREE.TubeGeometry(curve,segments,radius,coarseRings(radius),false),mat);
}
function coarseRings(radius){return radius<.09?4:7;}
function box(parent,mat,sx,sy,sz,x,y,z){
 const m=mesh(parent,new THREE.BoxGeometry(sx,sy,sz),mat,x,y,z);
 return m;
}
function pointedArch(parent,{halfWidth,base,peak,z=0,material,radius=.22,segments=24}){
 const points=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,x=-halfWidth+2*halfWidth*t;
  const y=base+(peak-base)*Math.pow(1-Math.abs(2*t-1),.68);
  points.push([x,y,z]);
 }
 return tube(parent,points,radius,material,segments*2);
}
function glassGeometry({coarse=false,palette=0}={}){
 const verts=[],colors=[],indices=[],rows=coarse?9:15,cols=coarse?6:10;
 const tones=[0x80c7df,0xf3ce78,0xf6a06f,0x93a7e8,0xecc7ab,0xb6dbb9,0xce9bc2].map(n=>new THREE.Color(n));
 const temp=new THREE.Color();
 for(let j=0;j<rows;j++){
  const ya=-7+j*14/rows,yb=-7+(j+1)*14/rows;
  const widthAt=y=>3.35*(y<=3.8?1:clamp((7.01-y)/3.21,.015,1));
  for(let i=0;i<cols;i++){
   const shift=((j+i*3)%5)*.014;
   const x0=-1+2*i/cols,x1=-1+2*(i+1)/cols;
   const points=[[x0*widthAt(ya),ya],[x1*widthAt(ya),ya],[x0*widthAt(yb),yb],[x1*widthAt(yb),yb]];
   const k=verts.length/3,offset=(seededNoise(i*9+palette*11,j*7)-.5)*.03;
   for(const [px,py]of points){
    verts.push(px+shift,py,-.03+offset);
    const dist=Math.abs(i-cols/2)/cols;
    temp.copy(tones[(i*3+j*5+palette)%tones.length]).multiplyScalar(1.05-dist*.35+(seededNoise(i+palette,j)-.5)*.16);
    colors.push(temp.r,temp.g,temp.b);
   }
   indices.push(k,k+1,k+2,k+1,k+3,k+2);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function vaultGeometry({coarse=false}={}){
 const cols=coarse?20:40,rows=coarse?8:16,verts=[],colors=[],ids=[];
 const marble=new THREE.Color(0xe0e0dc),tint=new THREE.Color();
 for(let z=0;z<=rows;z++)for(let x=0;x<=cols;x++){
  const u=x/cols,across=(u-.5)*2;
  const px=across*39,py=27.3+11.2*Math.pow(Math.max(0,1-Math.abs(across)),.86);
  const pz=-38+76*z/rows;verts.push(px,py+.14*Math.sin(u*TAU*3),pz);
  tint.copy(marble).multiplyScalar(.95+seededNoise(x,z)*.09);
  colors.push(tint.r,tint.g,tint.b);
 }
 for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){
  const a=z*(cols+1)+x,b=a+cols+1;ids.push(a,b,a+1,a+1,b,b+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(ids);
 geo.computeVertexNormals();return geo;
}
function beamGeometry(){
 const geo=new THREE.CylinderGeometry(.85,6,1,12,1,true);
 geo.translate(0,0,0);return geo;
}
function angel(master,white,trim,{coarse=false}={}){
 const body=mesh(master,new THREE.SphereGeometry(.38,coarse?8:16,coarse?8:12),white,0,.25,0);
 body.scale.set(.9,1.7,.72);
 mesh(master,new THREE.SphereGeometry(.28,coarse?8:12,10),white,0,.95,0);
 const skirt=mesh(master,new THREE.ConeGeometry(.49,1.12,coarse?8:16),white,0,-.67,0);
 skirt.rotation.z=.05;
 for(const side of [-1,1]){
  const wing=mesh(master,new THREE.ConeGeometry(.28,1.6,coarse?6:10),white,side*.48,.56,-.24);
  wing.rotation.z=-side*.65;
  tube(master,[[side*.35,.55,.12],[side*.6,1.08,-.14],[side*.75,1.31,-.25]],.045,trim,10);
  const arm=mesh(master,new THREE.CylinderGeometry(.12,.16,.8,8),white,side*.48,.25,.18);
  arm.rotation.z=side*.6;
 }
 return master;
}
function altarSculpture(parent,white,stone,gold,{coarse=false}={}){
 const altar=new THREE.Group();altar.position.set(0,0,-42);parent.add(altar);
 box(altar,white,14,.85,7,0,.46,0);box(altar,stone,11,1.05,5.6,0,1.36,-.2);
 box(altar,white,8,.85,4.4,0,2.29,-.28);
 box(altar,gold,8.4,.09,4.6,0,2.75,-.3);
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const k=i*.55;box(altar,stone,1.1,.24,4.1,side*(5.5+i*.21),1.46+k*.2,-.12);
 }
 // A three-dimensional ivory devotional sculpture, not a picture billboard.
 const cross=new THREE.Group();cross.position.set(0,0,-2.1);altar.add(cross);
 box(cross,stone,1.32,18.4,1.12,0,16.3,-.78);
 box(cross,stone,12.6,1.18,1.12,0,21.1,-.78);
 box(cross,gold,1.54,.11,1.31,0,25.1,-.75);
 const figure=new THREE.Group();figure.position.set(0,0,.29);cross.add(figure);
 const torso=mesh(figure,new THREE.SphereGeometry(.89,coarse?14:28,coarse?12:24),white,0,18.32,0);
 torso.scale.set(.88,1.42,.6);
 const waist=mesh(figure,new THREE.SphereGeometry(.66,coarse?12:20,12),white,0,16.77,.03);
 waist.scale.set(1,.78,.7);
 mesh(figure,new THREE.SphereGeometry(.49,16,12),white,.09,20.42,.18).scale.set(.8,1.02,.72);
 const hair=mesh(figure,new THREE.SphereGeometry(.51,12,12),stone,.09,20.67,-.02);hair.scale.set(.9,.6,.8);
 for(const side of [-1,1]){
  const arm=mesh(figure,new THREE.CylinderGeometry(.19,.29,3.03,coarse?8:14),white,side*2.11,19.55,.08);
  arm.rotation.z=side*Math.PI/2.18;
  const forearm=mesh(figure,new THREE.CylinderGeometry(.13,.2,2.15,coarse?8:12),white,side*4.3,20.18,.03);
  forearm.rotation.z=side*1.48;
  mesh(figure,new THREE.SphereGeometry(.24,10,8),white,side*5.39,20.25,.04).scale.set(.72,.46,.7);
  const leg=mesh(figure,new THREE.CylinderGeometry(.28,.22,3.95,coarse?8:16),white,side*.29,14.55,.02);
  leg.rotation.z=side*.065;
  mesh(figure,new THREE.SphereGeometry(.28,12,8),white,side*.41,12.61,.2).scale.set(1.4,.47,.75);
  tube(figure,[[side*.19,19.2,.69],[side*.57,18.6,.62],[side*.64,17.9,.41]],.075,stone,12);
 }
 const robe=mesh(figure,new THREE.LatheGeometry([
  new THREE.Vector2(.57,0),new THREE.Vector2(.75,.27),new THREE.Vector2(.83,.9),
  new THREE.Vector2(.61,1.34),new THREE.Vector2(.57,1.53)
 ],coarse?16:32),white,0,15.75,.05);robe.rotation.z=.08;
 // The altar is visible from the nave, while never taking part in boss hitboxes.
 return {altar,cross};
}
export function createSacredCathedral(scene,{coarse=false,reduced=false,radius=28}={}){
 const root=new THREE.Group();root.name='sacred-white-cathedral';scene.add(root);
 const texture=coarse?null:marbleTexture();
 const stone=new THREE.MeshStandardMaterial({color:0xeeeae4,map:texture,roughness:.77,metalness:0,bumpMap:texture,bumpScale:.035});
 const trim=new THREE.MeshStandardMaterial({color:0xc7b99f,metalness:.17,roughness:.55});
 const ivory=new THREE.MeshStandardMaterial({color:0xf7f5ec,roughness:.46,metalness:0});
 const marble=new THREE.MeshStandardMaterial({color:0xeeece8,map:texture,roughness:.34,metalness:.04,bumpMap:texture,bumpScale:.015});
 const deep=new THREE.MeshStandardMaterial({color:0x645b58,roughness:.92});
 const gold=new THREE.MeshStandardMaterial({color:0xc7aa70,metalness:.55,roughness:.38});
 const oak=new THREE.MeshStandardMaterial({color:0x988777,roughness:.75});
 const glassMat=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,transparent:false});
 const vaultMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.89});
 const raysMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  uniforms:{uTint:{value:new THREE.Color(0xffeecb)},uStrength:{value:coarse?.025:.07}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 vUv; uniform vec3 uTint;uniform float uStrength;void main(){float fade=pow(sin(vUv.y*3.14159265),1.15);float ribs=.85+.15*cos(vUv.x*6.2831853);gl_FragColor=vec4(uTint,uStrength*fade*ribs);}'
 });
 // Grand nave, six repeating bays: masonry around each tall pointed glass lancet.
 const bays=[-30,-18,-6,6,18,30],occluders=[],windowMeshes=[],pointLights=[];
 const shaftGeo=new THREE.CylinderGeometry(.75,.84,25,coarse?10:16),capitalGeo=new THREE.CylinderGeometry(1.1,.82,.7,coarse?10:16);
 const baseGeo=new THREE.CylinderGeometry(1.35,1.5,.55,coarse?10:16);
 const glassGeo=glassGeometry({coarse}),ringGeo=new THREE.TorusGeometry(.61,.08,6,12);
 for(const side of [-1,1]){
  const sideRoot=new THREE.Group();sideRoot.name=side<0?'left-aisle':'right-aisle';root.add(sideRoot);
  const windowGroups=[];
  for(let b=0;b<bays.length;b++){
   const z=bays[b];
   // Wall is NOT placed behind stained glass: the opening is genuinely translucent.
   box(sideRoot,stone,.9,9.7,11.7,side*39.6,4.9,z);
   box(sideRoot,stone,.9,6.1,11.7,side*39.6,30.9,z);
   for(const edge of [-1,1])box(sideRoot,stone,1.1,17.5,1.4,side*39.6,18.5,z+edge*5.55);
   const w=new THREE.Group();w.position.set(side*39.1,19.9,z);w.rotation.y=-side*Math.PI/2;sideRoot.add(w);
   const bgShape=new THREE.Shape();bgShape.moveTo(-3.4,-7);bgShape.lineTo(3.4,-7);bgShape.lineTo(3.4,3.8);bgShape.lineTo(0,7.0);bgShape.lineTo(-3.4,3.8);bgShape.closePath();
   mesh(w,new THREE.ShapeGeometry(bgShape,coarse?4:8),deep,0,0,-.07);
   const panel=mesh(w,glassGeo,glassMat);panel.name='cathedral-stained-glass';windowMeshes.push(panel);
   pointedArch(w,{halfWidth:3.46,base:3.75,peak:7.14,material:ivory,radius:.24});
   for(const x of [-3.42,3.42])box(w,ivory,.27,10.8,.28,x,-1.62,.07);
   box(w,ivory,7,.3,.4,0,-6.95,.06);
   for(const x of [-1.62,1.62])box(w,trim,.12,10.5,.18,x,-1.6,.13);
   for(const y of [-3.5,.3,3.25])box(w,trim,6.6,.095,.19,0,y,.12);
   for(const k of [-1,1]){
    tube(w,[[k*.06,5.95,.16],[k*1,5.15,.16],[k*2.15,3.8,.16]],.082,ivory,14);
    mesh(w,new THREE.TorusGeometry(.77,.09,6,24),ivory,k*.76,4.6,.18).scale.set(.7,1.2,1);
   }
   windowGroups.push(w);
   if(b%2===0){
    const ledge=box(sideRoot,trim,1.2,.28,8.4,side*38.85,10.1,z);
    ledge.receiveShadow=true;
   }
   // Column clusters and springers create a real aisled silhouette in perspective.
   if(b<5){
    const archGroup=new THREE.Group();archGroup.position.set(side*31,0,0);sideRoot.add(archGroup);
    const mid=(z+bays[b+1])/2,span=(bays[b+1]-z)*.5;
    const pts=[];
    for(let i=0;i<=16;i++){const t=i/16,pz=mid-span+span*2*t,py=22+5.8*Math.pow(1-Math.abs(2*t-1),.66);pts.push([0,py,pz]);}
    tube(archGroup,pts,.36,ivory,28);
    tube(archGroup,pts.map(([x,y,zv])=>[x+side*.17,y-.51,zv]),.11,gold,28);
   }
  }
  const pillarGroup=new THREE.Group();sideRoot.add(pillarGroup);
  for(const z of [-36,-24,-12,0,12,24,36]){
   const x=side*31.2;
   const shaft=mesh(pillarGroup,shaftGeo,stone,x,12.5,z);shaft.castShadow=!coarse;
   mesh(pillarGroup,capitalGeo,ivory,x,24.7,z);
   mesh(pillarGroup,baseGeo,marble,x,.3,z);
   for(const dx of [-.5,.5])for(const dz of [-.5,.5]){
    const rod=mesh(pillarGroup,new THREE.CylinderGeometry(.19,.22,23,8),ivory,x+dx,12,z+dz);
    rod.castShadow=false;
   }
   for(const height of [1.1,20.7,23.9])mesh(pillarGroup,ringGeo,gold,x,height,z).rotation.x=Math.PI/2;
  }
  // The near-side aisle is hidden if the camera moves outside its wall.
  occluders.push({root:sideRoot,side});
 }
 // Vault is above the combat camera, with ribbed stone intersections like the reference.
 const roof=new THREE.Group();root.add(roof);roof.name='ribbed-gothic-vault';
 mesh(roof,vaultGeometry({coarse}),vaultMat);
 for(const z of [-36,-24,-12,0,12,24,36]){
  const pts=[];
  for(let i=0;i<=32;i++){
   const x=-39+78*i/32,r=Math.abs(x/39);
   pts.push([x,27.3+11.2*Math.pow(Math.max(0,1-r),.86)+.12,z]);
  }
  tube(roof,pts,.3,ivory,48);
  tube(roof,pts.map(([x,y,zz])=>[x,y-.32,zz]),.065,gold,40);
 }
 for(let z=-36;z<36;z+=12)for(const side of [-1,1]){
  const pts=[];
  for(let i=0;i<=12;i++){
   const t=i/12,x=side*(39-39*t),y=27.3+11.2*Math.pow(t,.86)+.12,zz=z+6*t;
   pts.push([x,y,zz]);
  }
  tube(roof,pts,.18,trim,18);
 }
 // A rose window over the far end balances the tall side lancets.
 const apse=new THREE.Group();apse.position.set(0,0,-45);root.add(apse);
 box(apse,stone,78,9.8,1.1,0,4.9,-.1);
 box(apse,stone,78,7.9,1.1,0,33,-.1);
 for(const x of [-31,-20,-10,10,20,31])box(apse,stone,5,16.8,1.1,x,20,-.1);
 for(const x of [-24,-12,0,12,24]){
  const w=new THREE.Group();w.position.set(x,20,.7);apse.add(w);
  mesh(w,glassGeo,glassMat);
  pointedArch(w,{halfWidth:3.45,base:3.75,peak:7.1,material:ivory,radius:.24});
  for(const edge of [-1,1])box(w,ivory,.25,10.8,.25,edge*3.43,-1.6,.14);
 }
 const rose=mesh(apse,new THREE.CircleGeometry(4.1,48),glassMat,0,29.6,.68);
 rose.material=new THREE.MeshBasicMaterial({color:0xe7dcc7,side:THREE.DoubleSide});
 mesh(apse,new THREE.TorusGeometry(4.3,.38,10,48),ivory,0,29.6,.8);
 for(let i=0;i<12;i++){
  const a=i*TAU/12;
  const spoke=box(apse,gold,.12,4.15,.23,Math.sin(a)*2.04,29.6+Math.cos(a)*2.04,.89);
  spoke.rotation.z=-a;
 }
 altarSculpture(root,ivory,marble,gold,{coarse});
 // Side benches remain outside the radius-28 collision space.
 for(const side of [-1,1])for(const z of [-24,-13,-2,9,20,30]){
  const x=side*34.4,bench=new THREE.Group();bench.position.set(x,0,z);root.add(bench);
  box(bench,oak,7.5,.23,1.5,0,1.38,0);
  box(bench,oak,7.7,1.2,.23,0,1.94,-.63);
  for(const xx of [-3.4,0,3.4]){
   box(bench,oak,.29,1.4,.33,xx,.73,.49);
   box(bench,oak,.29,2.28,.32,xx,1.2,-.63);
  }
 }
 // Angel-like marble statues on the choir balconies, mounted high enough
 // to avoid covering combat tells or becoming fake obstacles.
 if(!coarse){
  const original=angel(new THREE.Group(),ivory,trim);
  for(const side of [-1,1])for(const z of [-20,4,28]){
   const plinth=box(root,marble,1.8,.45,1.8,side*32.1,18.2,z);
   const copy=original.clone();copy.position.set(side*32.1,19.25,z);copy.rotation.y=-side*Math.PI/2;root.add(copy);
  }
  for(const candleZ of [-21,3,27])for(const side of [-1,1]){
   const x=side*25,group=new THREE.Group();group.position.set(x,23,candleZ);root.add(group);
   tube(group,[[0,12,0],[0,0,0]],.045,trim,8);
   const ring=mesh(group,new THREE.TorusGeometry(1.45,.09,8,32),gold,0,0,0);ring.rotation.x=Math.PI/2;
   for(let i=0;i<8;i++){
    const a=i*TAU/8,px=Math.cos(a)*1.45,pz=Math.sin(a)*1.45;
    tube(group,[[0,0,0],[px,-.14,pz],[px,.12,pz]],.045,gold,10);
    box(group,ivory,.12,.43,.12,px,.27,pz);
    mesh(group,new THREE.SphereGeometry(.11,8,6),new THREE.MeshBasicMaterial({color:0xffdf9d}),px,.57,pz);
   }
  }
 }
 const shafts=[];
 const rayGeo=beamGeometry();
 const rayMaterial=raysMat;
 for(const side of [-1,1])for(const z of [-20,4,28]){
  const p=new THREE.Vector3(side*37,24,z),q=new THREE.Vector3(side*8,1.7,z-5);
  const dir=q.clone().sub(p),ray=mesh(root,rayGeo,rayMaterial);
  ray.position.copy(p).add(q).multiplyScalar(.5);ray.quaternion.setFromUnitVectors(v(0,1,0),dir.clone().normalize());
  ray.scale.set(1,dir.length(),1);ray.userData.beam=true;shafts.push(ray);
 }
 if(!coarse){
  const p=v(0,36,-29),q=v(0,2,-28),dir=q.clone().sub(p);
  const beam=mesh(root,rayGeo,rayMaterial);beam.position.copy(p).add(q).multiplyScalar(.5);
  beam.quaternion.setFromUnitVectors(v(0,1,0),dir.clone().normalize());beam.scale.set(.9,dir.length(),.9);shafts.push(beam);
 }
 const sanctum=new THREE.PointLight(0xfff4de,coarse?5:12,48,2);sanctum.position.set(0,20,-38);root.add(sanctum);pointLights.push(sanctum);
 function update(g,c,env){
  const phase=g?.boss?.phase??1,night=c?.darkness||0,dim=env?.light??1,dead=g?.status==='won';
  glassMat.color.setHex(phase===2?0xffdad9:0xffffff);
  rayMaterial.uniforms.uTint.value.setHex(phase===2?0xffbbbb:0xfff1d7);
  rayMaterial.uniforms.uStrength.value=(coarse?.021:.064)*clamp(dim,.3,1.4)*(1-night*.7)*(dead?.35:1);
  sanctum.intensity=(coarse?5:12)*clamp(dim,.22,1.4)*(dead?.45:1);
 }
 // Hide only exterior architecture that would otherwise stand between the
 // third-person camera and the combatants. The playable floor never disappears.
 function occlude(camera){
  for(const {root:sideRoot,side}of occluders)sideRoot.visible=camera.position.x*side<37.4;
  roof.visible=camera.position.y<29.6;
  apse.visible=camera.position.z>-44;
 }
 return {root,occlude,update,
  stats:()=>({windows:windowMeshes.length,beams:shafts.length,occluders:occluders.length}),
  dispose(){// Geometry/material resources are traversed by the scene owner.
   texture?.dispose();
  }};
}
