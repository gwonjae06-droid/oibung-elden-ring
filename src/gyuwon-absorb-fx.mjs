import * as THREE from 'three';

// White space cannot be damaged. Instead of a silent "nothing happened", the blow is
// absorbed and dissolves into chalk glyphs that rise as if being written into the record.
// Visual only: reads gyuwon.absorbAt/absorbCount set by damageGyuwon, never alters combat.
const GLYPHS=['\u2211','\u222b','\u2200','?'];
export function createGyuwonAbsorbFx(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-white-absorb-record';stage.add(root);
 const per=coarse?6:12,LIFE=1.3;
 const layers=GLYPHS.map(ch=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f1ece0';ctx.font='54px serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(ch,32,34);
  const map=new THREE.CanvasTexture(canvas);
  const pos=new Float32Array(per*3),geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({map,color:0xf1ece0,size:coarse?1.1:.8,transparent:true,
   opacity:0,depthWrite:false,sizeAttenuation:true});
  const pts=new THREE.Points(geo,mat);pts.name='gyuwon-absorbed-glyphs';
  pts.frustumCulled=false;pts.visible=false;root.add(pts);
  return {pts,pos,mat,geo,map};
 });
 let owner=null,seen=0,startedAt=-1,origin={x:0,y:1.8,z:0};
 function hide(){for(const l of layers)l.pts.visible=false;}
 function place(age){
  const drift=reduced?.4:1;
  layers.forEach((l,k)=>{
   for(let i=0;i<per;i++){
    const seed=((((k*per+i)+1)*2654435761)>>>0)/4294967296;
    const angle=seed*Math.PI*2,speed=(1.0+((i*7+k*3)%5)*.45)*drift;
    l.pos[i*3]=origin.x+Math.cos(angle)*speed*age;
    l.pos[i*3+1]=origin.y+Math.sin(seed*17)*.4+(1.4+(i%4)*.35)*age*drift;
    l.pos[i*3+2]=origin.z+Math.sin(angle)*speed*age;
   }
   l.geo.attributes.position.needsUpdate=true;
   l.mat.opacity=Math.pow(Math.max(0,1-age/LIFE),1.5)*.9;
   l.pts.visible=true;
  });
 }
 function update(g){
  const s=g?.gyuwon,b=g?.boss;
  if(owner!==g){owner=g;seen=0;startedAt=-1;hide();}
  if(!s||!b||g.status!=='playing'||b.phase!==2){hide();return;}
  const count=s.absorbCount||0;
  if(count!==seen){seen=count;startedAt=Number.isFinite(s.absorbAt)?s.absorbAt:g.time;origin={x:b.x,y:1.8,z:b.z};}
  const age=g.time-startedAt;
  if(startedAt<0||!(age>=0)||age>LIFE){hide();return;}
  place(age);
 }
 function clear(){owner=null;seen=0;startedAt=-1;hide();}
 function dispose(){
  clear();root.removeFromParent();
  for(const l of layers){l.geo.dispose();l.mat.dispose();l.map.dispose();}
 }
 return {root,update,clear,dispose};
}
