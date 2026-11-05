import {buildCinematicTextureData} from './cinematic-graphics.mjs';
// Small shared surface maps: brushed steel, woven cloth and worn leather are
// distinguished by light response rather than extra geometry or large images.
export function finishPlayerSurfaces(T,materials,capeMaterial){
 const packs=new Map();
 function pack(kind){
  if(packs.has(kind))return packs.get(kind);const d=buildCinematicTextureData(kind,64,97),maps={};
  for(const [key,data]of [['map',d.color],['normalMap',d.normal],['roughnessMap',d.roughness]]){
   const t=new T.DataTexture(data,64,64,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='velvet'?3:2,3);t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;if(key==='map')t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;maps[key]=t;
  }
  packs.set(kind,maps);return maps;
 }
 for(const[key,m]of Object.entries(materials)){
  if(!m.isMeshStandardMaterial||['gem','ivory','cardRed','etched'].includes(key))continue;
  const kind=key==='wood'?'wood':key==='leather'?'leather':key==='cloth'?'velvet':'metal';
  Object.assign(m,pack(kind));m.normalScale.set(kind==='metal'?.10:.24,kind==='metal'?.10:.24);
 }
 const cloth=pack('velvet');capeMaterial.normalMap=cloth.normalMap;capeMaterial.roughnessMap=cloth.roughnessMap;capeMaterial.normalScale.set(.20,.20);
}
