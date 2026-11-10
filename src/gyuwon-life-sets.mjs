import * as T from 'three';
import {createReverieSets,createReverieCloud} from './gyuwon-reverie-sets.mjs';
import {batchLifeSet} from './gyuwon-life-set-batch.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createGyuwonLifeSets(parent,{doc,coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-life-production-sets';parent.add(root);
 const geos=new Set(),mats=new Set(),textures=new Set(),batches=[];
 const g=x=>(geos.add(x),x),m=(color,extra={})=>{const a=new T.MeshPhysicalMaterial({color,roughness:.83,...extra});mats.add(a);return a;};
 const box=g(new T.BoxGeometry(1,1,1,coarse?3:4,coarse?3:4,coarse?3:4));
 const pos=box.attributes.position,v=new T.Vector3(),nearest=new T.Vector3();
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);nearest.copy(v).clampScalar(-.445,.445);v.sub(nearest).normalize().multiplyScalar(.055).add(nearest);pos.setXYZ(i,v.x,v.y,v.z);
 }box.computeVertexNormals();
 const sphere=g(new T.SphereGeometry(1,coarse?20:28,coarse?14:18)),cylinder=g(new T.CylinderGeometry(1,1,1,coarse?16:28));
 const textureCache=new Map();
 function texture(kind){
  if(textureCache.has(kind))return textureCache.get(kind);
  const c=doc.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;
  const image=ctx.createImageData(128,128);let seed=61723;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   seed=(seed*1664525+1013904223)>>>0;
   const noise=(seed/4294967296-.5)*13;
   const grain=kind==='wood'?Math.sin(x*.22+Math.sin(y*.03)*2)*12+Math.sin(x*.8+y*.025)*5:kind==='cloth'?(x%3===0||y%3===0?-15:5):Math.sin(x*.7)*Math.sin(y*.8)*4;
   const value=Math.max(0,Math.min(255,211+noise+grain)),i=(x+y*128)*4;
   image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=T.SRGBColorSpace;textures.add(t);textureCache.set(kind,t);return t;
 }
 const timber=m(0x775641,{map:texture('wood'),bumpMap:texture('wood'),bumpScale:.018,roughness:.7});
 const plaster=m(0xc9bfae,{map:texture('plaster'),bumpMap:texture('plaster'),bumpScale:.025});
 const fabric=m(0x8b7e73,{map:texture('cloth'),bumpMap:texture('cloth'),bumpScale:.022,sheen:.3,sheenRoughness:.8});
 const dark=m(0x252c31),metal=m(0x657078,{metalness:.82,roughness:.32}),paper=m(0xe4dbc7),leaf=m(0x47624d,{roughness:.94});
 const glass=m(0x8eb1c2,{transparent:true,opacity:.18,roughness:.16,metalness:.18,depthWrite:false});
 const light=m(0xffe1b7,{emissive:0xffd29d,emissiveIntensity:1.4});
 const add=(p,geo,mat,x,y,z,sx=1,sy=1,sz=1,name='')=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const b=(p,mat,x,y,z,sx,sy,sz,name)=>add(p,box,mat,x,y,z,sx,sy,sz,name);
 const cyl=(p,mat,x,y,z,r,h,name)=>add(p,cylinder,mat,x,y,z,r,h,r,name);
 const curve=(p,pts,r,mat,name)=>add(p,g(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(x=>new T.Vector3(...x))),coarse?12:28,r,coarse?6:10,false)),mat,0,0,0,1,1,1,name);
 const legacy=createReverieSets(root,{coarse});legacy.setRoomOpacity(1);
 const sets=new Map([['room',legacy.room],['school',legacy.school],['shop',legacy.shop]]);
 function make(key,outside=false){
  const p=new T.Group();p.name='gyuwon-life-set-'+key;root.add(p);sets.set(key,p);
  b(p,outside?m(0x5c695b,{roughness:1}):timber,0,-.11,0,26,.2,22,'life-foundation');
  if(!outside){
   b(p,plaster,0,3,-4.5,12,6,.2,'life-plaster-wall');b(p,plaster,-5.7,3,-1.8,.2,6,5.5,'life-side-wall');
   for(const x of [-5.5,5.5])b(p,timber,x,.18,-1.6,.1,.22,5.6,'life-baseboard');
   b(p,timber,0,.18,-4.3,11.4,.22,.08,'life-baseboard');
   b(p,timber,0,5.75,-4.25,11.4,.15,.2,'life-ceiling-cornice');
   for(let i=0;i<24;i++)b(p,timber,(i%12-5.5)*.94,-.005,-1.8+Math.floor(i/12)*3.6,.92,.035,3.58,'life-floorboard');
  }
  return p;
 }
 // The opening is the exact room asset from IV->V, with its original layout.
 const room=legacy.room;room.name='reverie-bedroom';
 room.traverse(o=>{if(o.isMesh&&o.material&&!o.material.map&&!o.material.emissive?.getHex()){o.material.bumpMap=texture('plaster');o.material.bumpScale=.008;}});
 b(room,timber,-4,1.0,-3.9,2.4,1.2,.18,'life-bedroom-bed-headboard');
 for(let i=0;i<7;i++){
  const blanket=b(room,fabric,-4,.99,-2.4+i*.48,2.20,.09,.50,'life-bedroom-woven-blanket');blanket.rotation.z=Math.sin(i*1.1)*.015;
 }
 b(room,fabric,.0,.02,.3,3.6,.025,4.4,'life-worn-bedroom-rug');
 for(let i=0;i<9;i++)b(room,paper,-1.65+i*.08,1.70,1.0,.045,.54,.75,'life-bedroom-notebook-spines');
 const cloud=createReverieCloud(root,{coarse});
 const park=make('park',true),river=make('riverside',true),office=make('office'),wedding=make('wedding',true),home=make('home');
 const bark=m(0x524339,{map:texture('wood'),roughness:1});
 function tree(p,x,z,scale=1){
  const trunk=g(new T.LatheGeometry([[.23,0],[.29,.2],[.19,1.6],[.11,3],[.02,4.4]].map(a=>new T.Vector2(...a)),coarse?16:28));
  add(p,trunk,bark,x,0,z,scale,scale,scale,'life-sculpted-tree-trunk');
  for(let i=0;i<4;i++)add(p,sphere,leaf,x+Math.sin(i*2.4)*.65,3.6+Math.sin(i)*.5,z+Math.cos(i*2.4)*.45,1.45,.8,1.2,'life-leaf-canopy');
 }
 for(const p of [park,river]){
  for(const [x,z,s]of [[-5,-3,1.1],[5,-5,1.3],[-6,3,.85],[6,2,1]])tree(p,x,z,s);
  for(let i=0;i<8;i++)b(p,timber,-4.5+i*.16,.83,-1.2,.12,.14,1.15,'life-bench-slats');
  b(p,metal,-4,.42,-1.2,1.4,.8,.14);b(p,metal,-4,.42,-.4,1.4,.8,.14);
 }
 const riverMat=m(0x4d7c85,{metalness:.46,roughness:.24});
 const water=add(river,g(new T.PlaneGeometry(32,15,coarse?24:48,8)),riverMat,0,-.02,-6);water.rotation.x=-Math.PI/2;
 b(river,timber,0,.1,.7,22,.22,1.8,'life-riverside-promenade');
 for(let i=0;i<12;i++)cyl(river,metal,-10+i*1.8,.7,-.5,.04,1.4,'life-river-railing');
 b(river,metal,0,1.4,-.5,22,.045,.045,'life-river-railing-top');
 function window(p,x,z,width=2.2){
  b(p,timber,x,3.35,z,width+.2,2.85,.12,'life-recessed-window-frame');
  b(p,glass,x,3.35,z+.08,width,2.65,.035,'life-window-glass');
  for(const side of [-1,1])b(p,paper,x+side*width*.48,3.35,z+.13,.065,2.75,.07,'life-window-mullion');
  b(p,paper,x,3.35,z+.13,.055,2.75,.07);b(p,paper,x,3.35,z+.13,width,.055,.07);
 }
 for(const x of [-3.5,0,3.5])window(office,x,-4.33);
 b(office,timber,0,1.16,.75,3.7,.16,1.8,'life-work-desk');for(const x of [-1.55,1.55])b(office,metal,x,.58,.75,.08,1.15,1.45);
 b(office,dark,.6,1.95,.05,1.9,1.25,.10,'life-monitor-frame');b(office,m(0x9baeb0,{emissive:0x283e45,emissiveIntensity:.3}),.6,1.95,.11,1.76,1.1,.02,'life-monitor-screen');
 b(office,dark,-.05,1.28,1.08,1.5,.05,.49,'life-keyboard');
 for(let i=0;i<28;i++)b(office,paper,-.65+(i%7)*.20,1.315,.9+Math.floor(i/7)*.11,.15,.014,.07,'life-keyboard-keys');
 b(office,fabric,0,1.0,-.47,1.0,.16,.95,'life-office-chair');b(office,fabric,0,1.7,-.85,1.0,1.3,.13);
 for(let i=0;i<6;i++)b(office,paper,-1.2,1.28+i*.025,.60,.53,.018,.71,'life-office-file-stack');
 const rose=m(0xaa7983,{map:texture('cloth'),roughness:.88}),ivory=m(0xe0d7c5),gold=m(0xc9ae78,{metalness:.76,roughness:.36});
 // Woven arch and actual benches replace floating symbolic wedding primitives.
 for(const side of [-1,1]){
  cyl(wedding,timber,side*1.9,2.0,-2,.07,4,'life-wedding-arch-post');
  curve(wedding,[[side*1.9,3.9,-2],[side*1.5,4.75,-2],[0,5.05,-2]],.075,timber,'life-wedding-arch');
  for(let i=0;i<8;i++)add(wedding,sphere,i%3?ivory:rose,side*(1.85-i*.20),3.9+Math.sin(i/7*Math.PI/2)*1.0,-1.98,.16,.10,.15,'life-wedding-flower');
 }
 b(wedding,ivory,0,.015,2,2.4,.025,12,'life-wedding-aisle');
 for(const side of [-1,1])for(let i=0;i<3;i++){
  b(wedding,timber,side*4,.65,1+i*2,2.7,.17,.7,'life-guest-bench');b(wedding,timber,side*4,1.23,.65+i*2,2.7,1.1,.12);for(const dx of [-1,1])b(wedding,metal,side*4+dx,.3,1+i*2,.1,.6,.6);
 }
 for(const x of [-3.6,3.6])window(home,x,-4.33,2.0);
 // Curtains have folds in the actual surface, not opaque rectangular panels.
 for(const side of [-1,1]){
  const c=g(new T.PlaneGeometry(1.1,3.6,coarse?10:24,12)),attr=c.attributes.position;
  for(let i=0;i<attr.count;i++)attr.setZ(i,Math.sin(attr.getX(i)*22)*.075);
  c.computeVertexNormals();add(home,c,fabric,3.6+side*1.15,3.15,-4.1,1,1,1,'life-folded-home-curtain');
 }
 b(home,timber,-2.9,.55,-1.7,3.8,.7,1.55,'life-sofa-frame');b(home,fabric,-2.9,1.30,-2.30,3.8,1.6,.4,'life-sofa-upholstered-back');
 for(let i=0;i<3;i++){b(home,fabric,-4.05+i*1.14,1.0,-1.55,1.08,.30,1.20,'life-sofa-cushion');b(home,i%2?rose:ivory,-4.05+i*1.14,1.52,-1.94,.68,.65,.22,'life-sofa-pillow').rotation.z=(i-1)*.12;}
 for(const x of [-4.9,-.9])b(home,fabric,x,1.1,-1.7,.28,1.0,1.65,'life-sofa-armrest');
 b(home,timber,0,.90,1.2,2.8,.14,1.5,'life-family-table');for(const x of [-1.15,1.15])for(const z of [.65,1.75])b(home,timber,x,.44,z,.11,.88,.11);
 b(home,fabric,-.5,.01,1.1,6,.025,5,'life-woven-family-rug');
 for(let i=0;i<6;i++)b(home,i%2?rose:ivory,2.3+i%3*.26,.15,.3+Math.floor(i/3)*.3,.23,.27,.23,'life-child-toy-block');
 // Nursery prop remains in the same home, linking the baby and older child.
 b(home,ivory,3.9,.65,-1.8,2.2,.14,1.1,'life-crib-mattress');
 for(let i=0;i<13;i++)for(const side of [-1,1])cyl(home,timber,2.9+i*.17,1.03,-1.8+side*.52,.023,.85,'life-crib-spindle');
 for(const side of [-1,1])b(home,timber,3.9,1.48,-1.8+side*.52,2.3,.065,.065,'life-crib-rail');
 const tableLamp=cyl(home,timber,-4.9,2.65,.3,.034,4.7,'life-home-reading-lamp');
 add(home,g(new T.LatheGeometry([[.36,0],[.52,-.56],[.50,-.59],[.33,-.02]].map(a=>new T.Vector2(...a)),coarse?20:40)),fabric,-4.9,4.9,.3);
 const practical=new T.PointLight(0xffd4a8,14,11,2);practical.position.set(-4.9,4.3,.3);home.add(practical);
 // Background context remains legible without hundreds of individual calls.
 for(const p of sets.values())batches.push(batchLifeSet(p));
 let openingWhite=1;
 function update(frame,camera){
  const key=frame.sceneKey;for(const [name,p]of sets)p.visible=name===key;
  const opening=frame.shot==='realization';
  openingWhite=opening?1-smooth(frame.time/2.5):0;
  legacy.setRoomOpacity(opening?smooth(frame.time/3):1);
  cloud.update({time:58-Math.min(14,frame.time),cloud:opening?1-smooth((frame.time-3)/7):0},camera);
  const waterAttr=water.geometry.attributes.position;
  for(let i=0;i<waterAttr.count;i++)waterAttr.setZ(i,Math.sin(waterAttr.getX(i)*1.7+frame.time*.8)*.017);
  waterAttr.needsUpdate=true;
 }
 function dispose(){cloud.dispose();for(const batch of batches)batch.dispose();legacy.dispose();for(const x of geos)x.dispose();for(const x of mats)x.dispose();for(const x of textures)x.dispose();root.removeFromParent();}
 return {root,sets,cloud,update,dispose,get openingWhite(){return openingWhite;},stats:()=>({sets:sets.size,batches:batches.reduce((n,b)=>n+b.batches,0),sharedRoom:room.name})};
}
