import * as T from 'three';
export function createReverieSets(parent,{coarse=false}={}){
 const geometries=new Set(),materials=new Set(),textures=new Set(),geo=g=>(geometries.add(g),g);
 const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.8,...extra});materials.add(m);return m;};
 const wood=mat(0x6b4b35),cream=mat(0xd7d0bc),metal=mat(0x58656a,{metalness:.67,roughness:.35}),dark=mat(0x1d2630),blue=mat(0x3d5770),green=mat(0x345c50),paper=mat(0xe5ddc9),glass=mat(0xa5c6d7,{transparent:true,opacity:.18,roughness:.18,metalness:.3}),light=mat(0xffdeb0,{emissive:0xffc685,emissiveIntensity:1.3});
 const box=geo(new T.BoxGeometry(1,1,1)),cyl=geo(new T.CylinderGeometry(1,1,1,16)),ball=geo(new T.SphereGeometry(1,24,16));
 const mesh=(p,g,m,pos,scale,name='')=>{const o=new T.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);o.name=name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 const b=(p,m,x,y,z,sx,sy,sz,name='')=>mesh(p,box,m,[x,y,z],[sx,sy,sz],name);
 function label(p,text,x,y,z,w=1,h=.35,color='#ded8bd',bg='#263b35'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 54px "Malgun Gothic",sans-serif';ctx.fillText(text,256,65,480);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);const m=new T.MeshStandardMaterial({map:texture,roughness:.9});materials.add(m);return mesh(p,geo(new T.PlaneGeometry(w,h)),m,[x,y,z],[1,1,1]);
 }
 const shop=new T.Group(),school=new T.Group(),room=new T.Group();shop.name='reverie-convenience-store';school.name='reverie-school-classroom';room.name='reverie-bedroom';parent.add(shop,school,room);
 function shell(p,wall){b(p,wood,0,-.1,0,12,.2,12);b(p,wall,0,3.1,-4.3,12,6.2,.18);b(p,wall,-5.5,3.1,0,.18,6.2,9);}
 shell(shop,cream);shell(school,cream);shell(room,mat(0x535c68));
 // A working checkout, stocked shelves, lit price rail and a glazed storefront.
 b(shop,green,0,.75,1.3,4.2,1.5,1.1);b(shop,cream,0,1.54,1.3,4.4,.14,1.3);b(shop,dark,1.35,1.86,1.3,.8,.45,.55);
 const display=b(shop,metal,1.35,2.1,1.35,.72,.5,.06);display.rotation.x=-.25;label(shop,'₩ 2,400',1.35,2.14,1.42,.62,.2,'#a9d6b1','#152f2a');
 b(shop,dark,.15,1.64,1.65,.38,.07,.28);b(shop,glass,3.9,2.8,2.4,.08,5.5,5);b(shop,metal,3.9,2.8,2.4,.12,5.6,.12);
 for(let r=0;r<4;r++)b(shop,metal,0,.8+r*.9,-3.35,9,.12,.9);
 for(let i=0;i<48;i++){const x=(i%12-5.5)*.7,y=1.05+Math.floor(i/12)*.9;const product=mesh(shop,i%3?box:cyl,i%3===0?green:i%3===1?paper:blue,[x,y,-3.3],[.27,.45,.28]);if(i%3===0)product.scale.set(.12,.4,.12);}
 label(shop,'생활 · 편의',0,4.7,-4.18,3.1,.7);for(const x of [-2.5,2.5])b(shop,light,x,5.4,-.2,2.5,.1,.32);
 // Real desks/chairs and a board make the second stop a school, not another shop.
 const desk=(p,x,z)=>{b(p,wood,x,1.43,z,2.2,.15,1.35);for(const side of [-1,1]){b(p,metal,x+side*.85,.7,z,.08,1.4,.8);b(p,metal,x+side*.6,.48,z-1.1,.06,.95,.06);}b(p,wood,x,.98,z-1.15,1.4,.14,1.2);b(p,wood,x,1.55,z-1.66,1.4,1.05,.1);};
 for(const x of [-3.4,0,3.4])for(const z of [-2.5,-.1])desk(school,x,z);desk(school,0,1.2);
 b(school,wood,0,3.2,-4.05,8.4,2.4,.2);b(school,green,0,3.2,-3.92,8,2.1,.05);label(school,'f(x) = ax² + bx + c',0,3.4,-3.87,5,.55,'#d9ded0','#345c50');
 for(const x of [-3.6,3.6]){b(school,glass,x,3.8,-4,1.7,2.8,.04);b(school,cream,x,3.8,-3.9,.06,2.8,.07);}
 label(school,'강의실',-4.5,5,-4.18,1.4,.4);
 for(const p of [school,room]){b(p,paper,0,1.54,1.15,1.05,.04,.7);for(let i=0;i<7;i++)b(p,blue,.02,1.565,1+(i-3)*.07,.77,.003,.009);}
 // Small room: desk and lamp, used books, calendar, bed, window and backpack.
 desk(room,0,1.2);b(room,wood,-4,.35,-1.5,2.3,.7,4.8);b(room,blue,-4,.85,-1.45,2.25,.35,4.6);mesh(room,ball,cream,[-4,1.08,-3.1],[.85,.18,.43]);
 for(let i=0;i<5;i++){b(room,i%2?green:blue,-1.55,1.58+i*.1,.95,.55,.09,.84);}
 const stem=mesh(room,cyl,metal,[-1.5,2.04,1.2],[.035,.8,.035]);const shade=mesh(room,geo(new T.ConeGeometry(.4,.45,32,1,true)),light,[-1.5,2.5,1.2],[1,1,1]);shade.rotation.x=Math.PI;
 const lamp=new T.PointLight(0xffc58a,35,13,2);lamp.position.set(-1.4,2.35,1.3);room.add(lamp);
 b(room,wood,3.1,2.8,-4.1,3.3,3.1,.2);b(room,mat(0x17283e,{emissive:0x14243b,emissiveIntensity:.5}),3.1,2.8,-3.96,3.1,2.9,.04);b(room,cream,3.1,2.8,-3.9,.07,3,.06);b(room,cream,3.1,2.8,-3.9,3.2,.07,.06);
 label(room,'4',-3,3.85,-4.16,1.15,.72,'#9c4e4e','#ded8c4');for(let i=0;i<4;i++)label(room,'01  02  03  04  05',-3,3.35-i*.15,-4.15,1.15,.12,'#55545a','#ded8c4');
 mesh(room,ball,green,[2,.52,-3.55],[.55,.65,.3]);b(room,metal,2,1.2,-3.55,.3,.1,.08);
 const roomMats=new Map();room.traverse(o=>{if(!o.isMesh)return;const old=o.material;if(!roomMats.has(old)){const m=old.clone();m.transparent=true;roomMats.set(old,m);materials.add(m);}o.material=roomMats.get(old);});
 const ceiling=mesh(shop,box,cream,[0,5.6,0],[11,.1,9]);
 return {shop,school,room,setRoomOpacity(value){for(const m of roomMats.values())m.opacity=value;},dispose(){shop.removeFromParent();school.removeFromParent();room.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}

export function createReverieCloud(parent,{coarse=false}={}){
 const size=40,data=new Uint8Array(size**3);
 for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=[x,y,z].map(v=>(v/(size-1)-.5)*2);let density=0;
  for(const [a,b,c,r]of [[-.36,-.05,0,.30],[.31,.0,.03,.34],[0,.30,-.04,.27],[.02,-.15,.27,.25]])density+=Math.exp(-((p[0]-a)**2+(p[1]-b)**2+(p[2]-c)**2)/r);
  const noise=.82+.12*Math.sin(p[0]*17+p[1]*7)*Math.sin(p[2]*14-p[0]*4);const edge=Math.max(0,Math.min(1,(1-Math.hypot(...p))*4));
  data[x+size*(y+size*z)]=Math.min(255,Math.max(0,(density*noise-.22)*edge*170));
 }
 const texture=new T.Data3DTexture(data,size,size,size);texture.format=T.RedFormat;texture.type=T.UnsignedByteType;texture.minFilter=texture.magFilter=T.LinearFilter;texture.unpackAlignment=1;texture.needsUpdate=true;
 const material=new T.ShaderMaterial({glslVersion:T.GLSL3,transparent:true,depthWrite:false,side:T.BackSide,uniforms:{density:{value:texture},cameraLocal:{value:new T.Vector3(0,0,5)},opacity:{value:1}},
  vertexShader:'out vec3 localPoint;void main(){localPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`precision highp sampler3D;in vec3 localPoint;uniform sampler3D density;uniform vec3 cameraLocal;uniform float opacity;out vec4 cloudColor;
   void main(){vec3 ray=normalize(localPoint-cameraLocal);float b=dot(cameraLocal,ray);float c=dot(cameraLocal,cameraLocal)-1.;float disc=b*b-c;if(disc<0.)discard;float nearT=max(0.,-b-sqrt(disc));float farT=-b+sqrt(disc);float stepT=(farT-nearT)/${coarse?'12.':'20.'};float alpha=0.;vec3 color=vec3(0.);
   for(int i=0;i<${coarse?'12':'20'};i++){vec3 p=cameraLocal+ray*(nearT+(float(i)+.5)*stepT);float d=texture(density,p*.5+.5).r;float a=1.-exp(-d*stepT*8.);vec3 tint=mix(vec3(.62,.68,.82),vec3(1.,.98,.92),clamp(p.y*.6+.65,0.,1.));color+=(1.-alpha)*a*tint;alpha+=(1.-alpha)*a;}if(alpha<.003)discard;cloudColor=vec4(color/max(alpha,.001),alpha*opacity);}`});
 const geometry=new T.SphereGeometry(1,coarse?28:48,coarse?20:32),root=new T.Mesh(geometry,material);root.name='gyuwon-volumetric-imagination-cloud';root.position.set(0,4.75,-.3);root.visible=false;parent.add(root);
 const bubbleMat=new T.MeshStandardMaterial({color:0xe9e7f2,roughness:.95,transparent:true,opacity:.78}),bubbles=Array.from({length:3},(_,i)=>{const o=new T.Mesh(geometry,bubbleMat);o.position.set(-.18+i*.02,3.25+i*.35,-.05);o.scale.setScalar(.07+i*.045);o.visible=false;parent.add(o);return o;});
 return {root,texture,update(frame,camera){root.visible=frame.cloud>0;root.scale.set(2.9*frame.cloud,1.55*frame.cloud,2.1*frame.cloud);root.rotation.y=frame.time*.045;bubbles.forEach((o,i)=>{o.visible=frame.time>44+i*.4&&frame.time<53;o.scale.setScalar((.07+i*.045)*Math.min(1,(frame.time-44-i*.4)*2));});root.updateMatrixWorld();material.uniforms.cameraLocal.value.copy(camera.position);if(root.visible)root.worldToLocal(material.uniforms.cameraLocal.value);},dispose(){root.removeFromParent();bubbles.forEach(b=>b.removeFromParent());texture.dispose();material.dispose();bubbleMat.dispose();geometry.dispose();}};
}
