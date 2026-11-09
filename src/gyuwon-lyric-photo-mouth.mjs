// Song-clock-synchronised photo-surface mouth deformation for 11su/ending.
// Word periods are evenly interpolated inside ASR phrases; exact phoneme
// alignment is still subject to manual audio review.
import * as THREE from 'three';
import {gyuwonLyricActionAt} from './gyuwon-lyric-actions.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export function gyuwonLyricMouthAt(year,time){
 const cue=gyuwonLyricActionAt(year,time);
 if(!cue)return {openness:0,roundness:0,word:null,cue:null};
 const words=cue.en.match(/[A-Za-z']+/g)||[];
 if(!words.length)return {openness:0,roundness:0,word:null,cue};
 const u=clamp(cue.phase)*words.length,i=Math.min(words.length-1,Math.floor(u)),
  progress=u-i,word=words[i],vowel=/[aeiou]/i.test(word),
  openness=Math.sin(Math.PI*progress)*(vowel?.82:.42),
  roundness=/[ouw]/i.test(word)?1:.2;
 return {openness:clamp(openness)*Math.min(1,Math.max(0,cue.weight*3+.15)),
  roundness,word,cue:cue.id};
}
export function createGyuwonLyricPhotoMouth(head,{coarse=false}={}){
 const face=head?.getObjectByName('gyuwon-anatomical-face');
 if(!face?.isMesh||!face.geometry?.attributes?.position)
  return {update:()=>{},dispose:()=>{},get last(){return null;}};
 const original=face.geometry,geometry=original.clone();face.geometry=geometry;
 const positions=geometry.attributes.position,base=Float32Array.from(positions.array),affected=[];
 for(let i=0;i<positions.count;i++){
  const j=i*3,x=base[j],y=base[j+1],z=base[j+2];
  const weight=smooth(1-Math.abs(x)/.31)*smooth(1-Math.abs(y+.19)/.17)*smooth((z-.15)/.24);
  if(weight>.003)affected.push([j,weight,y]);
 }
 const inside=new THREE.Mesh(new THREE.SphereGeometry(1,coarse?12:23,coarse?10:16),
  new THREE.MeshBasicMaterial({color:0x39202b,transparent:true,opacity:.70,depthWrite:false,side:THREE.DoubleSide}));
 inside.name='gyuwon-song-photo-mouth';inside.position.set(0,-.19,.463);
 inside.scale.set(.14,.009,.013);inside.visible=false;head.add(inside);
 let last=null,prior=-1,disposed=false;
 function update(year,time){
  if(disposed)return;
  last=gyuwonLyricMouthAt(year,time);const o=last.openness;
  inside.visible=o>.08;inside.scale.y=.009+o*.05;inside.scale.x=.13+last.roundness*.028;
  if(Math.abs(prior-o)<.004)return;
  for(const [j,w,y] of affected){
   positions.array[j+1]=base[j+1]+(y<-.19?-.046:.019)*o*w;
   positions.array[j+2]=base[j+2]-.011*o*w;
  }
  positions.needsUpdate=true;prior=o;
 }
 function dispose(){if(disposed)return;disposed=true;face.geometry=original;geometry.dispose();
  inside.removeFromParent();inside.geometry.dispose();inside.material.dispose();}
 return {update,dispose,get last(){return last;}};
}
