import * as THREE from 'three';
import {createClownEncoreTent} from './clown-tent-transformation.mjs';
import {createClownStageMachinery} from './clown-stage-machinery.mjs';

export const CIRCUS_SCENERY_SPREAD=27/23;
// All scenic construction is non-collidable and beyond the playable radius.
// Only the decorated floor enters the arena. No damage/hitbox code lives here.
export const CIRCUS_LAYOUT=Object.freeze({
 playableRadius:27, floorRadius:25*CIRCUS_SCENERY_SPREAD, columnsRadius:31.2*CIRCUS_SCENERY_SPREAD,
 curtainsRadius:35*CIRCUS_SCENERY_SPREAD, audienceRadius:39*CIRCUS_SCENERY_SPREAD, stageHeight:21,
});
export const CIRCUS_PALETTE=Object.freeze({
 ivory:0xf0dbb8,cream:0xf3e3c3,crimson:0x8c253b,
 scarlet:0xae3945,gold:0xe9be73,teal:0x54c8c1,
 magenta:0xd65d9f,violet:0x9573d0
});
const TAU=Math.PI*2,up=new THREE.Vector3(0,1,0);
const polar=(r,a,y=0)=>[Math.sin(a)*r,y,Math.cos(a)*r];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const material=(color,roughness=.77,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
function put(group,geometry,mat,x=0,y=0,z=0,name=''){
 const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.name=name;group.add(m);return m;
}
function ring(group,r,width,y,mat,name){
 const mesh=put(group,new THREE.RingGeometry(r,r+width,128).rotateX(-Math.PI/2),mat,0,y,0,name);
 return mesh;
}
function tube(group,points,r,mat,name,segments=18){
 return put(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,7,false),mat,0,0,0,name);
}
function batch(group,geometry,mat,placements,name){
 const mesh=new THREE.InstancedMesh(geometry,mat,placements.length),dummy=new THREE.Object3D();
 mesh.name=name;
 placements.forEach(({p,rotation,scale,color},i)=>{
  dummy.position.set(...p);dummy.rotation.set(...(rotation||[0,0,0]));
  dummy.scale.set(...(scale||[1,1,1]));dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
  if(color)mesh.setColorAt(i,new THREE.Color(color));
 });
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.frustumCulled=false;group.add(mesh);return mesh;
}
function makeFloor(group,coarse,ivory,brass){
 const positions=[],colors=[];
 const segments=coarse?48:96;
 const radii=[0,7,15,22.8,25];
 const cream=new THREE.Color(0xf2dfba),pale=new THREE.Color(0xe8d0a7),
       crimson=new THREE.Color(0x99354c),red=new THREE.Color(0xb6474c),
       shadow=new THREE.Color(0x624047),brassFloor=new THREE.Color(0xc69b5a);
 const vertices=(p,q,r,c)=>{
  for(const a of [p,q,r]){positions.push(...a);colors.push(c.r,c.g,c.b);}
 };
 for(let band=0;band<radii.length-1;band++)for(let i=0;i<segments;i++){
  const a=i*TAU/segments,b=(i+1)*TAU/segments,
        sector=Math.floor(i/(segments/16)),alt=sector%2;
  const palette=band===0?(alt?cream:pale):band===1?(alt?red:crimson):band===2?(alt?pale:cream):shadow;
  const v0=polar(radii[band],a),v1=polar(radii[band+1],a),v2=polar(radii[band+1],b),v3=polar(radii[band],b);
  vertices(v0,v2,v1,palette);vertices(v0,v3,v2,palette);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const floor=put(group,geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.73,metalness:.08}),0,0,0,'circus-ivory-crimson-floor');
 floor.receiveShadow=true;
 for(const r of [7.05,14.85,22.7,24.55])ring(group,r,r>22?.18:.1,.036,brass,'circus-gold-floor-inlay');
 // A starburst medallion makes the ring readable even under neutral lighting.
 const star=new THREE.Shape(),tips=24;
 for(let i=0;i<tips;i++){
  const a=i*Math.PI*2/tips,r=i%2?3.9:6.7,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(!i)star.moveTo(x,z);else star.lineTo(x,z);
 }
 star.closePath();
 const mosaic=put(group,new THREE.ShapeGeometry(star).rotateX(-Math.PI/2),material(0xd3ac6b,.48,.37),0,.045,0,'circus-central-star-medallion');
 mosaic.receiveShadow=true;
 ring(group,2.35,.11,.056,ivory,'circus-star-inner-ring');
 const rays=Array.from({length:16},(_,i)=>{const angle=i*TAU/16;return {p:polar(18.9,angle,.05),rotation:[0,angle,0]};});
 batch(group,new THREE.BoxGeometry(.075,.026,7.25),brass,rays,'circus-gilded-radial-rays');
 // The dais lip and its staircase are outside the original hit-test circle.
 const base=put(group,new THREE.CylinderGeometry(26.8,28.4,.72,coarse?64:96),material(0x4c2937,.78),0,-.47,0,'circus-polished-stage-rim');
 base.receiveShadow=true;
 ring(group,25.0,.27,.016,brass,'circus-brass-stage-edge');
 return floor;
}
function curtainPanel(root,a,b,mat,idx){
 const pts=[],uv=[],indices=[],horizontal=14,vertical=8;
 for(let y=0;y<=vertical;y++)for(let x=0;x<=horizontal;x++){
  const u=x/horizontal,v=y/vertical,theta=a+(b-a)*u;
  const wave=Math.sin(u*Math.PI*9+idx*.7)*(.34+.17*v);
  const r=CIRCUS_LAYOUT.curtainsRadius/CIRCUS_SCENERY_SPREAD+wave;
  const h=2.2+v*16.2- (1-v)*.36*Math.cos(u*Math.PI*4);
  pts.push(...polar(r,theta,h));uv.push(u,v);
 }
 for(let y=0;y<vertical;y++)for(let x=0;x<horizontal;x++){
  const i=y*(horizontal+1)+x,j=i+horizontal+1;
  indices.push(i,j,i+1,i+1,j,j+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 put(root,geometry,mat,0,0,0,'circus-scalloped-velvet-curtain');
 // Gold tassels hang at the edges of each drape, out of combat.
 tube(root,[polar(34.85,a,18.4),polar(34.9,(a+b)/2,16.8),polar(34.85,b,18.4)],.085,
      new THREE.MeshStandardMaterial({color:0xd3a65d,roughness:.49,metalness:.4}),'circus-curtain-gold-swag',12);
}
function makeChandelier(root,x,z,coarse,gold,bulbMat){
 const group=new THREE.Group();group.name='circus-gilded-chandelier';group.position.set(x,22,z);root.add(group);
 tube(group,[[0,5,0],[0,1,0],[0,-1.3,0]],.075,gold,'circus-chandelier-chain',9);
 const crown=put(group,new THREE.TorusGeometry(2.35,.13,9,coarse?28:48),gold,0,-1.6,0);
 crown.rotation.x=Math.PI/2;
 const inner=put(group,new THREE.TorusGeometry(1.45,.08,8,coarse?24:36),gold,0,-1.1,0);
 inner.rotation.x=Math.PI/2;
 const bulbs=[],rods=[];
 for(let i=0;i<10;i++){
  const a=i*TAU/10,p=polar(2.35,a,-1.4);
  bulbs.push({p:[p[0],p[1]-.02,p[2]]});
  rods.push({p:[p[0],-1.05,p[2]]});
 }
 batch(group,new THREE.CylinderGeometry(.045,.045,.7,6),gold,rods,'circus-chandelier-metal-branches');
 batch(group,new THREE.SphereGeometry(.19,coarse?8:12,coarse?6:8),bulbMat,bulbs,'circus-chandelier-warm-bulbs');
 return group;
}
function makeCanopy(root,coarse,gold){
 // A lofty striped ceiling makes the theatre feel illuminated and enclosed,
 // while leaving a large central oculus and plenty of boss/camera clearance.
 const sides=coarse?12:16,radial=5,lateral=4,points=[],colors=[],indices=[];
 const cream=new THREE.Color(0xf2dbb2),wine=new THREE.Color(0x823449),muted=new THREE.Color(0xd5ad85);
 const n=sides*lateral;
 for(let i=0;i<=n;i++){
  const a=i*TAU/n,sector=Math.floor((i%n)/lateral),stripe=sector%4===0?muted:sector%2?wine:cream;
  for(let j=0;j<=radial;j++){
   const u=j/radial,r=5.3+u*29.6,h=40.8-u*15+Math.sin(u*Math.PI)*.65;
   points.push(...polar(r,a,h));
   colors.push(stripe.r,stripe.g,stripe.b);
  }
 }
 for(let i=0;i<n;i++)for(let j=0;j<radial;j++){
  const a=i*(radial+1)+j,b=(i+1)*(radial+1)+j;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 put(root,geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.88,metalness:0}),0,0,0,'circus-vaulted-ivory-velvet-canopy');
 ring(root,5.3,.32,40.77,gold,'circus-canopy-oculus');
 for(let i=0;i<sides;i++){
  const a=i*TAU/sides;
  tube(root,[polar(5.4,a,40.8),polar(19,a,34.5),polar(34.5,a,25.8)],.09,gold,'circus-gilded-canopy-rib',coarse?9:16);
 }
}
function makeScenery(root,coarse){
 const ivory=material(0xece0ce,.67),gold=material(0xc5a163,.38,.63,{emissive:0x382713,emissiveIntensity:.2}),
       darkGold=material(0x967342,.51,.45),velvet=material(0xa7374c,.96,0,{side:THREE.DoubleSide}),
       velvetShade=material(0x762b40,.96,0,{side:THREE.DoubleSide}),
       wood=material(0x57343b,.82),shadow=material(0x342831,.92);
 makeFloor(root,coarse,ivory,gold);
 makeCanopy(root,coarse,gold);
 const n=coarse?12:16,r=CIRCUS_LAYOUT.columnsRadius/CIRCUS_SCENERY_SPREAD;
 const columns=[],bases=[],caps=[],finials=[];
 for(let i=0;i<n;i++){
  const a=i*TAU/n,at=polar(r,a);
  columns.push({p:[at[0],8.3,at[2]]});bases.push({p:[at[0],.85,at[2]]});
  caps.push({p:[at[0],15.85,at[2]]});finials.push({p:[at[0],18.2,at[2]]});
  const mid=(i+.5)*TAU/n,at0=polar(r,a,15.8),at1=polar(r,a+TAU/n,15.8),
        apex=polar(r+.35,mid,21);
  tube(root,[at0,polar(r,mid-TAU/n/5,19.3),apex,polar(r,mid+TAU/n/5,19.3),at1],.19,
       gold,'circus-gilded-theatre-arch',coarse?10:19);
  curtainPanel(root,a+.025,a+TAU/n-.025,i%2?velvet:velvetShade,i);
 }
 batch(root,new THREE.CylinderGeometry(.55,.77,14.9,coarse?10:16),ivory,columns,'circus-ivory-pilasters');
 batch(root,new THREE.CylinderGeometry(1.12,1.3,1.4,coarse?12:16),darkGold,bases,'circus-pilaster-plinths');
 batch(root,new THREE.CylinderGeometry(.94,.65,1.2,coarse?10:16),gold,caps,'circus-pilaster-gold-capitals');
 batch(root,new THREE.SphereGeometry(.62,coarse?10:16,9),gold,finials,'circus-marquee-finials');
 ring(root,30.7,.26,19.1,gold,'circus-upper-marquee-ring');
 ring(root,31,.2,16.55,gold,'circus-marquee-bulb-rail');
 // Stepped theatre galleries and dark audience silhouettes make the space deep.
 for(const [rad,y]of [[36.3,1.6],[38.1,3.1],[40.1,4.65]]){
  const tier=put(root,new THREE.RingGeometry(rad,rad+1.7,coarse?64:96).rotateX(-Math.PI/2),wood,0,y,0,'circus-audience-tier');
  tier.receiveShadow=false;
  ring(root,rad,.11,y+.035,darkGold,'circus-audience-gilt-trim');
 }
 const crowd=[],heads=[],eyes=[];
 for(let i=0;i<(coarse?50:96);i++){
  const a=i*2.399963,r=36.8+(i%3)*1.6,h=2.4+(i%3)*1.45;
  const p=polar(r,a),bodyY=h+.42;
  crowd.push({p:[p[0],bodyY,p[2]],scale:[.74,1.5,.6]});
  heads.push({p:[p[0],bodyY+1.2,p[2]],scale:[.55,.65,.6]});
  if(i%3===0)eyes.push({p:[p[0]*.99,bodyY+1.28,p[2]*.99],scale:[.13,.1,.13]});
 }
 batch(root,new THREE.ConeGeometry(.72,1.4,coarse?6:9),shadow,crowd,'circus-silhouette-audience');
 batch(root,new THREE.SphereGeometry(.57,coarse?6:10,8),shadow,heads,'circus-shadow-audience-faces');
 batch(root,new THREE.SphereGeometry(.13,6,5),new THREE.MeshBasicMaterial({color:0xf9cf91}),eyes,'circus-audience-candle-glints');
 // Marquee bulbs are emissive sprites/instances, not hundreds of point lights.
 const bulbs=[],halos=[],count=coarse?96:192;
 for(let i=0;i<count;i++){
  const a=TAU*i/(count/2),tier=i>=count/2,r=tier?30.95:31.3;
  const p=polar(r,a,tier?13.6:17.4);
  bulbs.push({p,color:i%5===0?0xffe3a7:0xffc878});
  halos.push(...p);
 }
 const bulbMat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 const marquee=batch(root,new THREE.SphereGeometry(coarse?.17:.18,coarse?7:10,coarse?5:8),bulbMat,bulbs,'circus-instanced-marquee-bulbs');
 const haloGeo=new THREE.BufferGeometry();
 haloGeo.setAttribute('position',new THREE.Float32BufferAttribute(halos,3));
 const haloMat=new THREE.PointsMaterial({color:0xffdb9c,size:coarse?.62:.83,opacity:coarse?.2:.3,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
 const glow=new THREE.Points(haloGeo,haloMat);glow.name='circus-marquee-lamp-halos';root.add(glow);
 makeChandelier(root,-10,-12,coarse,gold,bulbMat);
 makeChandelier(root,10,12,coarse,gold,bulbMat);
 return {marquee,bulbMat,haloMat,bulbCount:count,columns:n};
}
function makeLights(root,coarse){
 // Two actual, shadowless moving spotlights; every other "lamp" is a mesh.
 const left=new THREE.SpotLight(0xffe7b6,coarse?75:105,76,Math.PI/4,.76,1.3);
 const right=new THREE.SpotLight(0xffdb98,coarse?0:86,72,Math.PI/5,.8,1.2);
 left.name='circus-gold-follow-spot';
 right.name='circus-second-follow-spot';
 left.position.set(-17,29,4);right.position.set(16,28,-10);
 left.castShadow=right.castShadow=false;
 root.add(left,left.target,right,right.target);
 left.target.position.set(0,1,0);right.target.position.set(4,1,-4);
 const shafts=[];
 if(!coarse){
  for(const light of [left,right]){
   const beamMaterial=new THREE.MeshBasicMaterial({color:0xffecc0,side:THREE.DoubleSide,transparent:true,
     opacity:.018,depthWrite:false,blending:THREE.AdditiveBlending});
   const cone=put(root,new THREE.ConeGeometry(11.5,30,20,1,true),beamMaterial,0,0,0,'circus-soft-theatrical-light-shaft');
   cone.renderOrder=1;shafts.push({cone,light});
  }
 }
 // Extra broad roof lamps light the entire ring, not attack warnings.
 const fill=[],settings=[
  {pos:[-16,28,12],aim:[-8,.12,7],color:0xffefd0},
  {pos:[16,28,12],aim:[8,.12,7],color:0xffe4ba},
  {pos:[0,29,-17],aim:[0,.12,-11],color:0xffe9c9}
 ];
 for(const i of (coarse?[0,2]:[0,1,2])){
  const a=settings[i],light=new THREE.SpotLight(a.color,coarse?96:128,85,.60,.85,1.35);
  light.name='circus-wide-floor-spot-'+i;light.castShadow=false;light.position.set(...a.pos);
  light.target.position.set(...a.aim);root.add(light,light.target);
  const fixture=new THREE.Group();fixture.name='circus-wide-spotlight-fixture';fixture.position.copy(light.position);root.add(fixture);
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(.42,.54,.68,12),new THREE.MeshStandardMaterial({color:0x3c3140,metalness:.64,roughness:.48}));
  shell.position.y=.34;fixture.add(shell);
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.38,14).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:a.color,side:THREE.DoubleSide}));
  lens.position.y=.005;fixture.add(lens);
  let beam=null;
  if(!coarse){beam=new THREE.Mesh(new THREE.ConeGeometry(1,1,16,1,true).translate(0,-.5,0),
    new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.009,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    beam.name='circus-wide-soft-spotlight-cone';beam.renderOrder=1;root.add(beam);}
  fill.push({light,fixture,lens,beam,color:a.color,base:coarse?96:128});
 }
 return {left,right,shafts,fill,down:new THREE.Vector3(0,-1,0)};
}
const WARM=[0xffe4a9,0xffcf7f,0xffd49a];
const FRENZY=[0xf5cb80,0xf389b8,0x8bd8d3,0xb08ff2,0xffe4a9];
const NIGHTMARE=[0xb98691,0x70405a,0xc7a79c,0x8c334a,0x8a788e];
export function createClownCircusStage(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='clown-radiant-nightmare-circus';scene.add(root);
 const stageScenery=new THREE.Group();stageScenery.name='clown-expanded-theatre';root.add(stageScenery);
 stageScenery.scale.set(CIRCUS_SCENERY_SPREAD,1,CIRCUS_SCENERY_SPREAD);
 // Lighting is intentionally kept unscaled so its aim tracks real boss positions.
 const scenery=makeScenery(stageScenery,coarse),lights=makeLights(root,coarse),
  tent=createClownEncoreTent(stageScenery,{coarse,reduced}),
  machinery=createClownStageMachinery(stageScenery,{coarse,reduced});
 let phase=0,clock=0,pulse=0,beat=0,spotMode='gold',cueLeft=0,focus=null,disposed=false;
 const box=new THREE.Vector3(),aim=new THREE.Vector3(),tmp=new THREE.Vector3();
 function recolor(next){
  if(phase===next)return;phase=next;
  const colors=next===3?NIGHTMARE:next===2?FRENZY:WARM;
  for(let i=0;i<scenery.bulbCount;i++)scenery.marquee.setColorAt(i,new THREE.Color(colors[(i+(next===2?Math.floor(i/12):0))%colors.length]));
  scenery.marquee.instanceColor.needsUpdate=true;
  scenery.haloMat.color.setHex(next===3?0x9b637a:next===2?0xffb8cc:0xffdb9c);
 }
 function reset(){
  tent.reset();machinery.reset();clock=0;pulse=0;beat=0;cueLeft=0;focus=null;spotMode='gold';
  phase=0;recolor(1);
  lights.left.target.position.set(0,1,0);lights.right.target.position.set(4,1,-4);
 }
 function event(e,g){
  if(disposed||!e)return;
  const type=e.type;machinery.event(e);
  if(type==='clown-ballet-start'||type==='clown-ballet-armed'||(type==='phase'&&e.phase===3)){
   recolor(3);pulse=.3;spotMode='gold';cueLeft=2.2;
  }
  else if(type==='clown-ballet-cue'){pulse=Math.max(pulse,.22);spotMode='gold';cueLeft=.7;
   focus=Number.isFinite(e.x)&&Number.isFinite(e.z)?{x:e.x,z:e.z}:null;
  }
  else if(type==='clown-phase3'){recolor(3);pulse=.7;spotMode='crimson';cueLeft=2.2;}
  else if(type==='clown-horror'){pulse=Math.max(pulse,.28);spotMode='crimson';cueLeft=Math.max(cueLeft,.55);focus=Number.isFinite(e.x)&&Number.isFinite(e.z)?{x:e.x,z:e.z}:null;}
  else if(type==='phase'||type==='clown-phase2'){recolor(2);pulse=.45;spotMode='frenzy';cueLeft=1.8;}
  else if(type==='clown-clap'||type==='clown-bounce'){pulse=Math.max(pulse,.5);spotMode='gold';cueLeft=.8;}
  else if(type==='clown-blast'||type==='clown-throw'||type==='clown-roll'){
   pulse=Math.max(pulse,.65);spotMode='crimson';cueLeft=.85;
   focus=Number.isFinite(e.x)&&Number.isFinite(e.z)?{x:e.x,z:e.z}:null;
  }else if(type==='clown-dash'||type==='clown-telegraph'){
   spotMode=type==='clown-dash'?'frenzy':'gold';cueLeft=.7;
  }else if(type==='clown-shutter'){pulse=Math.max(pulse,.35);cueLeft=.4;}
  else if(type==='victory'||type==='death'){pulse=0;cueLeft=0;spotMode='gold';}
 }
 function update(g,dt=0){
  if(disposed||!g)return;
  const h=clamp(Number.isFinite(dt)?dt:0,0,.05),live=g.status==='playing';
  tent.update(g,h);machinery.update(g,h);
  clock+=h;pulse=Math.max(0,pulse-h*1.6);cueLeft=Math.max(0,cueLeft-h);
  if(g?.clown?.horrorStage===3)recolor(3);
  else if(g?.boss?.phase===2)recolor(2);else if(g?.boss?.phase===1&&g.boss.state!=='transition')recolor(1);
  const p=g.boss||{x:0,z:0},mode=cueLeft>0?spotMode:(phase===3?'gold':phase===2?'frenzy':'gold');
  const colorA=mode==='crimson'?0xffb09d:mode==='frenzy'?0xff9fcb:0xffe5b6;
  const colorB=mode==='frenzy'?0x8de5dc:mode==='crimson'?0xffd2a0:0xffcf8a;
  lights.left.color.setHex(colorA);lights.right.color.setHex(colorB);
  const movement=reduced?0:Math.sin(clock*(phase===2?1.8:.55))*(phase===2?5:2.5);
  aim.set(Number.isFinite(p.x)?p.x:0,1.15,Number.isFinite(p.z)?p.z:0);
  // Follow the actor, never a warning zone: attacks remain visually distinct.
  lights.left.target.position.lerp(aim,clamp(h*4,0,1));
  if(focus&&cueLeft>0)tmp.set(focus.x,.8,focus.z);
  else tmp.set(-movement,1.2,-2+Math.cos(clock*.7)*3);
  lights.right.target.position.lerp(tmp,clamp(h*3,0,1));
  lights.left.intensity=(coarse?72:100)*(live?1:.78)*(phase===3?.8:1)*(1+pulse*.32);
  lights.right.intensity=coarse?0:(phase>=2?98:75)*(live?1:.7)*(phase===3?.78:1)*(1+pulse*.2);
  for(const {light,fixture,lens,beam,color,base}of lights.fill){
   light.color.setHex(phase===2?0xffd1ce:color);
   light.intensity=base*(live?1:.78)*(1+Math.min(.22,pulse*.10));
   tmp.copy(light.target.position).sub(light.position);
   const length=tmp.length();tmp.normalize();fixture.quaternion.setFromUnitVectors(lights.down,tmp);
   lens.material.color.copy(light.color);
   if(beam){beam.position.copy(light.position);beam.scale.set(Math.tan(light.angle)*length,length,Math.tan(light.angle)*length);
    beam.quaternion.copy(fixture.quaternion);beam.material.color.copy(light.color);beam.material.opacity=live?.009:.006;}
  }
  if(!reduced){scenery.haloMat.opacity=(coarse?.2:.28)+(phase===2?.07:0)+pulse*.09;}
  for(const {cone,light}of lights.shafts){
   box.copy(light.position).add(light.target.position).multiplyScalar(.5);
   cone.position.copy(box);
   tmp.copy(light.position).sub(light.target.position).normalize();
   cone.quaternion.setFromUnitVectors(up,tmp);
   cone.material.color.copy(light.color);
   cone.material.opacity=(phase===2?.019:.015)*(live?1:.55)+(reduced?0:pulse*.004);
  }
  return {phase,mode,pulse};
 }
 function dispose(){
  if(disposed)return;disposed=true;
  tent.dispose();machinery.dispose();
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{
   if(o.geometry)geometries.add(o.geometry);
   for(const mat of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(mat);
  });
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
  root.parent?.remove(root);
 }
 reset();
 return {root,event,update,reset,dispose,lights,tent,
  stats:()=>({bulbs:scenery.bulbCount,columns:scenery.columns,machinery:machinery.stats(),realSpotlights:2+lights.fill.length,wideSpotlights:lights.fill.length,collidableProps:0,playableRadius:CIRCUS_LAYOUT.playableRadius}),
  get phase(){return phase;},get disposed(){return disposed;}};
}
