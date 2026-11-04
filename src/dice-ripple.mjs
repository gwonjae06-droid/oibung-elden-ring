import * as T from 'three';
// Head slams send a water-like ripple across the felt and its gold grid. It deals no damage.
export const RIPPLE=Object.freeze({speed:46,life:3.2,amp:1.5});
export function rippleHeight(ripples,x,z,time){
 let y=0;
 for(const r of ripples){
  const age=time-r.t0;if(age<0||age>RIPPLE.life)continue;
  const k=Math.hypot(x-r.x,z-r.z)-age*RIPPLE.speed;
  y+=r.amp*Math.exp(-1.1*age)*Math.sin(k*.34)*Math.exp(-k*k/300);
 }
 return y*Math.max(0,Math.min(1,(100-Math.hypot(x,z))/12));
}
export function createBoardRipple(root,{coarse=false}={}){
 let felt=null,lines=null,feltBase=null,lineBase=null,disposed=false,dirty=false,last=null,ripples=[];
 const seen=new WeakSet();
 root.traverse(o=>{
  if(!felt&&o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.geometry.parameters?.radius===97.5)felt=o;
  if(!lines&&o.isLineSegments&&o.position.y===.05)lines=o;
 });
 if(felt){
  const old=felt.geometry;
  felt.geometry=new T.RingGeometry(.01,97.5,coarse?72:96,coarse?24:40).rotateX(-Math.PI/2);
  old.dispose();feltBase=Float32Array.from(felt.geometry.attributes.position.array);
 }
 if(lines){
  const src=lines.geometry.attributes.position.array,split=coarse?10:18,out=new Float32Array(Math.floor(src.length/6)*split*6);
  let k=0;
  for(let i=0;i+5<src.length;i+=6)for(let s=0;s<split;s++)for(const u of [s/split,(s+1)/split]){
   out[k++]=src[i]+(src[i+3]-src[i])*u;out[k++]=src[i+1]+(src[i+4]-src[i+1])*u;out[k++]=src[i+2]+(src[i+5]-src[i+2])*u;
  }
  const old=lines.geometry;lines.geometry=new T.BufferGeometry();
  lines.geometry.setAttribute('position',new T.BufferAttribute(out,3));
  old.dispose();lineBase=Float32Array.from(out);
 }
 function write(time){
  if(felt){const p=felt.geometry.attributes.position;for(let i=0;i<p.count;i++)p.array[i*3+1]=feltBase[i*3+1]+rippleHeight(ripples,feltBase[i*3],feltBase[i*3+2],time);p.needsUpdate=true;felt.geometry.computeVertexNormals();}
  if(lines){const p=lines.geometry.attributes.position;for(let i=0;i<p.count;i++)p.array[i*3+1]=lineBase[i*3+1]+(ripples.length?rippleHeight(ripples,lineBase[i*3],lineBase[i*3+2],time)+.12:0);p.needsUpdate=true;}
 }
 return {
  get ripples(){return ripples.length;},
  update(g){
   if(disposed)return;
   if(last!==g){last=g;ripples=[];if(dirty){write(0);dirty=false;}}
   const s=g.dice?.giant;
   if(s?.state==='attack'&&s.temperament==='feral')for(const h of s.hazards||[])if(h.headSlam&&s.t>=h.start+h.warn&&!seen.has(h)){seen.add(h);ripples.push({x:h.x,z:h.z,t0:g.time,amp:RIPPLE.amp});}
   ripples=ripples.filter(r=>g.time-r.t0<RIPPLE.life);
   if(!ripples.length){if(dirty){write(g.time);dirty=false;}return;}
   dirty=true;write(g.time);
  },
  dispose(){if(disposed)return;disposed=true;felt?.geometry?.dispose();lines?.geometry?.dispose();}
 };
}
