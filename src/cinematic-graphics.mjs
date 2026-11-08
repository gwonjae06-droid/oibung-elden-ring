import * as THREE from 'three';
import {cinematicLightCue} from './cinematic-light-cues.mjs';

export const CINEMATIC_PROFILES=Object.freeze({
 kwon:Object.freeze({exposure:1.1,reflection:.6,rim:0xa5b9ca,fill:.62,defaultSurface:'stone'}),
 clown:Object.freeze({exposure:1.08,reflection:.57,rim:0xf2c89f,fill:.58,defaultSurface:'velvet'}),
 dice:Object.freeze({exposure:1.09,reflection:.64,rim:0xe6c8a1,fill:.58,defaultSurface:'wood'}),
 blood:Object.freeze({exposure:1.07,reflection:.68,rim:0xdcd4d4,fill:.62,defaultSurface:'marble'}),
 gyuwon:Object.freeze({exposure:1.05,reflection:.58,rim:0xaab8d4,fill:.5,defaultSurface:'stone'})
});
export const CINEMATIC_SURFACES=Object.freeze({
 marble:Object.freeze({roughness:.43,metalness:0,bump:.25}),
 stone:Object.freeze({roughness:.86,metalness:0,bump:.58}),
 velvet:Object.freeze({roughness:.91,metalness:0,bump:.2}),
 wood:Object.freeze({roughness:.66,metalness:0,bump:.41}),
 metal:Object.freeze({roughness:.38,metalness:.78,bump:.19}),
 leather:Object.freeze({roughness:.75,metalness:0,bump:.35}),
 skin:Object.freeze({roughness:.58,metalness:0,bump:.14}),
 blood:Object.freeze({roughness:.22,metalness:0,bump:.19})
});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const frac=v=>v-Math.floor(v);
function hash(x,y,seed){return frac(Math.sin(x*127.1+y*311.7+seed*73.31)*43758.5453);}
function noise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 return (hash(ix,iy,seed)*(1-u)+hash(ix+1,iy,seed)*u)*(1-v)+(hash(ix,iy+1,seed)*(1-u)+hash(ix+1,iy+1,seed)*u)*v;
}
function heightAt(type,x,y,seed){
 const small=noise(x*11,y*11,seed),medium=noise(x*27,y*27,seed+13),coarse=noise(x*4,y*4,seed+29),grain=noise(x*73,y*73,seed+67);
 switch(type){
  case 'marble':return .15+.32*coarse+.33*Math.pow(Math.max(0,Math.sin(x*17+Math.sin(y*11+coarse*3)*5)),15)+.16*small+.04*grain;
  case 'stone':return .18+.4*coarse+.25*small+.15*medium+.16*Math.pow(grain,3);
  case 'wood':return .22+.39*Math.abs(Math.sin(x*38+Math.sin(y*9)*3+coarse*6))+.22*small+.06*grain;
  case 'velvet':return .4+.15*Math.abs(Math.sin(x*95+Math.sin(y*8)))+.14*small+.06*grain;
  case 'metal':return .3+.19*Math.abs(Math.sin(y*225))+.18*medium+.07*grain;
  case 'leather':return .27+.2*coarse+.25*Math.pow(medium,2)+.2*grain;
  case 'skin':return .42+.14*small+.11*medium+.08*grain;
  case 'blood':return .3+.3*coarse+.14*Math.abs(Math.sin(x*15+y*18))+.13*small;
  default:return coarse;
 }
}
function bytes(width,height=width){return new Uint8Array(width*height*4);}
const cachedSurfaceData=new Map();
function cachedTextureData(type,size,seed){
 const key=type+':'+size+':'+seed;
 if(!cachedSurfaceData.has(key))cachedSurfaceData.set(key,textureData(type,size,seed));
 return cachedSurfaceData.get(key);
}
function textureData(type,size,seed){
 const color=bytes(size),normal=bytes(size),roughness=bytes(size);
 const shade={marble:[240,236,229],stone:[221,219,213],velvet:[235,229,232],wood:[228,218,209],metal:[233,235,241],leather:[233,223,217],skin:[242,224,209],blood:[220,217,223]}[type];
 const heights=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)heights[y*size+x]=heightAt(type,x/size,y/size,seed);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const h=heights[y*size+x],dx=heights[y*size+Math.min(size-1,x+1)]-heights[y*size+Math.max(0,x-1)],dy=heights[Math.min(size-1,y+1)*size+x]-heights[Math.max(0,y-1)*size+x];
  const length=Math.hypot(dx*1.3,dy*1.3,1),j=(y*size+x)*4,grain=.88+h*.19,veil=type==='marble'&&h>.65?.75:1;
  for(let k=0;k<3;k++)color[j+k]=Math.round(clamp(shade[k]*grain*veil,3,255));
  color[j+3]=255;
  normal[j]=Math.round(clamp(.5-dx*.65,0,1)*255);normal[j+1]=Math.round(clamp(.5-dy*.65,0,1)*255);normal[j+2]=Math.round(clamp(.5+1/(length*2),0,1)*255);normal[j+3]=255;
  const rv=Math.round(clamp(.77+h*.22,0,1)*255);
  roughness[j]=roughness[j+1]=roughness[j+2]=rv;roughness[j+3]=255;
 }
 return {color,normal,roughness,size,type};
}
export function buildCinematicTextureData(type='stone',size=128,seed=47){
 if(!CINEMATIC_SURFACES[type])throw new RangeError('Unknown physical surface '+type);
 if(!Number.isInteger(size)||size<16||size>512)throw new RangeError('Invalid physical texture size');
 return textureData(type,size,seed);
}
function mapFromData(data,size,color=false){
 const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;
 if(color)t.colorSpace=THREE.SRGBColorSpace;
 t.needsUpdate=true;return t;
}
function probe(profile,coarse){
 const w=coarse?32:64,h=coarse?16:32,arr=bytes(w,h),tint=new THREE.Color(profile.rim);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,sky=.29+.38*Math.pow(1-v,1.8),hotspot=Math.exp(-Math.pow((u-.75)*10,2)-Math.pow((v-.31)*11,2)),j=(y*w+x)*4;
  arr[j]=Math.round(255*clamp(sky*(.72+.3*tint.r)+.52*hotspot));
  arr[j+1]=Math.round(255*clamp(sky*(.74+.3*tint.g)+.48*hotspot));
  arr[j+2]=Math.round(255*clamp(sky*(.77+.3*tint.b)+.4*hotspot));arr[j+3]=255;
 }
 const t=new THREE.DataTexture(arr,w,h,THREE.RGBAFormat,THREE.UnsignedByteType);t.colorSpace=THREE.SRGBColorSpace;
 t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.mapping=THREE.EquirectangularReflectionMapping;t.needsUpdate=true;return t;
}
function category(mesh,profile){
 const name=(mesh.name||'').toLowerCase();
 if(/water|liquid|blood-sea|blood-pool|puddle/.test(name))return 'blood';
 if(/curtain|canopy|velvet|fabric|drape|banner|cloth|cape/.test(name))return 'velvet';
 if(/marble|floor|tile|aisle|ivory|altar/.test(name))return profile==='dice'?'wood':'marble';
 if(/wood|pew|casino-slot|board|roulette|stage|seat|desk/.test(name))return 'wood';
 if(/pillar|arch|cathedral|ruin|sanctuary|brick|stone|throne|column|wall/.test(name))return 'stone';
 if(/gild|metal|gold|brass|blade|sword|armor|armour|chandelier|coin|pip/.test(name))return 'metal';
 if(/face|head|hand|skin|finger/.test(name))return 'skin';
 if(/leather|body|jacket|coat|torso/.test(name))return 'leather';
 if(mesh.material?.metalness>.36)return 'metal';
 return profile==='clown'?'velvet':CINEMATIC_PROFILES[profile].defaultSurface;
}
export function createCinematicWorld(scene,renderer,{profile='kwon',coarse=false,reduced=false}={}){
 if(!CINEMATIC_PROFILES[profile])throw new RangeError('Unknown boss graphics profile '+profile);
 const settings=CINEMATIC_PROFILES[profile],original={toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure,outputColorSpace:renderer.outputColorSpace,environment:scene.environment,environmentIntensity:scene.environmentIntensity};
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=settings.exposure;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const env=probe(settings,coarse);scene.environment=env;scene.environmentIntensity=settings.reflection;
 const rim=new THREE.DirectionalLight(settings.rim,coarse?0:settings.fill);rim.name='cinematic-boss-silhouette-fill';rim.position.set(-15,17,-19);rim.castShadow=false;scene.add(rim);
 const rimBase=new THREE.Color(settings.rim),rimSecond=new THREE.Color(({blood:0xe8a6b3,clown:0xe7b99f,dice:0xefb585,kwon:0xb3c7e6})[profile]||settings.rim);
 let rimWarmth=0,closed=false;
 const surfaces=new Map(),applied=new Set(),saved=new Map(),owned=new Set([env]);
 // Clown has several simultaneous scenic layers. Bound generated detail only;
 // authored face images, geometry, telegraphs and other boss profiles are unchanged.
 const surfaceSize=coarse?64:profile==='clown'?128:256;
 function texturePack(kind){
  if(surfaces.has(kind))return surfaces.get(kind);
  const n=surfaceSize,d=cachedTextureData(kind,n,47),pack={map:mapFromData(d.color,n,true),normalMap:mapFromData(d.normal,n),roughnessMap:mapFromData(d.roughness,n)};
  for(const t of Object.values(pack))owned.add(t);
  surfaces.set(kind,pack);return pack;
 }
 function apply(root,{actor=false}={}){
  if(closed||!root)return 0;
  let changed=0;
  root.traverse(o=>{
   if(!o.isMesh||!o.geometry?.getAttribute('uv')||o.userData?.skipCinematicMaterial)return;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   for(const m of materials){
    if(!m?.isMeshStandardMaterial&&!m?.isMeshPhysicalMaterial)continue;
    if(m.transparent&&m.opacity<.6)continue;
    if(applied.has(m))continue;
    const kind=actor?(m.metalness>.24?'metal':/skin|face|head|hand/i.test(o.name)?'skin':'leather'):category(o,profile),surface=CINEMATIC_SURFACES[kind],maps=texturePack(kind);
    saved.set(m,{map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,normalScale:m.normalScale?.clone(),roughness:m.roughness,metalness:m.metalness,envMapIntensity:m.envMapIntensity});
    if(!m.map)m.map=maps.map;
    const generatedNormal=!m.normalMap;
    if(generatedNormal)m.normalMap=maps.normalMap;
    if(!m.roughnessMap)m.roughnessMap=maps.roughnessMap;
    if(!m.metalness||m.metalness<.2)m.metalness=surface.metalness;
    m.roughness=clamp(m.roughness*.48+surface.roughness*.52,.13,.97);
    if(generatedNormal&&m.normalScale)m.normalScale.set(surface.bump,surface.bump);
    m.envMapIntensity=(m.envMapIntensity??1)*(coarse?.75:1);m.needsUpdate=true;applied.add(m);changed++;
   }
  });return changed;
 }
 function update(game,dt=0){
  if(closed||!game)return;
  const second=(game?.boss?.phase||1)>1,h=clamp(Number.isFinite(dt)?dt:0,0,.05),cue=cinematicLightCue(game,profile),target=settings.reflection*(second?.88:1)*(1+cue.environment);
  scene.environmentIntensity+=(target-scene.environmentIntensity)*(1-Math.exp(-1.5*h));
  if(!coarse){rim.intensity+=(settings.fill*(1+cue.rim)-rim.intensity)*(1-Math.exp(-8*h));rimWarmth+=(cue.warmth-rimWarmth)*(1-Math.exp(-3*h));rim.color.copy(rimBase).lerp(rimSecond,rimWarmth);}
 }
 function dispose(){
  if(closed)return;closed=true;rim.parent?.remove(rim);
  for(const [m,old]of saved){
   Object.assign(m,{map:old.map,normalMap:old.normalMap,roughnessMap:old.roughnessMap,roughness:old.roughness,metalness:old.metalness,envMapIntensity:old.envMapIntensity});
   if(old.normalScale&&m.normalScale)m.normalScale.copy(old.normalScale);
   m.needsUpdate=true;
  }
  saved.clear();applied.clear();for(const t of owned)t.dispose();owned.clear();
  if(scene.environment===env)scene.environment=original.environment;
  scene.environmentIntensity=original.environmentIntensity;renderer.toneMapping=original.toneMapping;renderer.toneMappingExposure=original.exposure;renderer.outputColorSpace=original.outputColorSpace;
 }
 return {apply,update,dispose,profile,quality:coarse?'mobile':'desktop',stats:()=>({profile,surfaces:surfaces.size,materials:applied.size,shadowLightsAdded:0,rimLightsAdded:coarse?0:1,procedural:true,externalModels:0,surfaceSize})};
}
