import * as T from 'three';
import {actFiveMouthAt} from './gyuwon-act-five-vocal-acting.mjs';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const soft=x=>{const a=clamp(x);return a*a*(3-2*a);};
// The photographed face remains the source of the facial features. Only its
// own mouth-region vertices are deformed. No second face texture is painted.
export function createActFivePhotoMouth(head,{coarse=false}={}){
 const face=head?.getObjectByName('gyuwon-anatomical-face');
 if(!face?.isMesh||!face.geometry?.attributes?.position)return {update:()=>null,dispose:()=>{},get last(){return null;}};
 const oldGeometry=face.geometry,geometry=oldGeometry.clone();face.geometry=geometry;
 const positions=geometry.attributes.position,base=new Float32Array(positions.array);
 const affected=[];
 for(let i=0;i<positions.count;i++){
  const j=i*3,x=base[j],y=base[j+1],z=base[j+2];
  const influence=soft(1-Math.abs(x)/.31)*soft(1-Math.abs(y+.19)/.17)*soft((z-.15)/.24);
  if(influence>.003)affected.push({j,influence,y});
 }
 const interior=new T.Mesh(new T.SphereGeometry(1,coarse?14:26,coarse?10:18),
  new T.MeshBasicMaterial({color:0x351823,transparent:true,opacity:.78,depthWrite:false,side:T.DoubleSide}));
 interior.name='gyuwon-photograph-singing-mouth';
 interior.position.set(0,-.2,.463);interior.scale.set(.16,.009,.014);
 interior.visible=false;interior.renderOrder=3;head.add(interior);
 let last=null,lastOpen=-1;
 function update(time){
  last=actFiveMouthAt(time);
  const o=last.openness;
  if(Math.abs(o-lastOpen)<.003)return last;
  for(const {j,influence,y} of affected){
   positions.array[j+1]=base[j+1]+(y<-.19?-.055:.026)*o*influence;
   positions.array[j+2]=base[j+2]-.014*o*influence;
  }
  positions.needsUpdate=true;lastOpen=o;
  interior.visible=o>.08;
  interior.position.y=-.195-.018*o;
  interior.scale.set(.14+.025*last.roundness,.009+o*.055,.013+o*.007);
  return last;
 }
 function dispose(){
  face.geometry=oldGeometry;geometry.dispose();interior.removeFromParent();
  interior.geometry.dispose();interior.material.dispose();
 }
 return {update,dispose,interior,face,affected:affected.length,get last(){return last;}};
}
