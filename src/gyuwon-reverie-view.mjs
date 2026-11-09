import * as T from 'three';
import {gyuwonReverieFrame,reverieEase as ease} from './gyuwon-reverie.mjs';
import {createReverieActor} from './gyuwon-reverie-actor.mjs';
import {createReverieSets,createReverieCloud} from './gyuwon-reverie-sets.mjs';
import {audioChannelGain} from './audio-preferences.mjs';

export function createGyuwonReverieView(scene,{boss,player,shell,coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-fourth-year-reverie';root.visible=false;scene.add(root);
 const actor=createReverieActor(root,boss),sets=createReverieSets(root,{coarse}),cloud=createReverieCloud(root,{coarse});
 const fill=new T.HemisphereLight(0xe0e7ef,0x272333,.65),key=new T.DirectionalLight(0xffe0b9,2.1);key.position.set(3,8,7);key.castShadow=!coarse;key.shadow.mapSize.set(512,512);key.shadow.camera.left=key.shadow.camera.bottom=-10;key.shadow.camera.right=key.shadow.camera.top=10;root.add(fill,key,key.target);
 const doc=shell.ownerDocument,overlay=doc.createElement('div');overlay.className='gy-reverie-film';overlay.hidden=true;overlay.setAttribute('aria-live','polite');
 const top=doc.createElement('div'),bottom=doc.createElement('div'),caption=doc.createElement('div'),shade=doc.createElement('div');top.className='gy-film-top';bottom.className='gy-film-bottom';caption.className='gy-film-caption';shade.className='gy-film-shade';overlay.append(top,bottom,caption,shade);shell.appendChild(overlay);
 const style=doc.createElement('style');style.textContent=`.gy-reverie-film{position:absolute;inset:0;z-index:28;pointer-events:none}.gy-reverie-film[hidden]{display:none}.gy-film-top,.gy-film-bottom{position:absolute;left:0;right:0;height:6%;background:#000}.gy-film-top{top:0}.gy-film-bottom{bottom:0}.gy-film-caption{position:absolute;bottom:11%;left:4%;right:4%;text-align:center;color:#fff3dc;font:500 clamp(17px,2.2vw,29px)/1.6 "Malgun Gothic",sans-serif;letter-spacing:.04em;text-shadow:0 2px 6px #000,0 0 16px #000}.gy-film-shade{position:absolute;inset:0;background:#000;opacity:0}[data-reverie="on"] .brand,[data-reverie="on"] #player-hud,[data-reverie="on"] #boss-hud,[data-reverie="on"] #controls,[data-reverie="on"] #touch,[data-reverie="on"] #reticle,[data-reverie="on"] #skill-hud,[data-reverie="on"] #lock-label,[data-reverie="on"] .gy-dday,[data-reverie="on"] .gy-dday-center,[data-reverie="on"] .gy-dday-chat{display:none!important}[data-reverie="on"] #pause{z-index:45;top:10px;right:12px;padding:7px 10px;font-size:11px;background:#141820b0;color:#e0ddd5;border-color:#6f777a}[data-reverie="on"] #pause-screen{z-index:70}@media(max-height:500px){.gy-film-caption{font-size:17px;bottom:9%}}`;shell.appendChild(style);
 const audioFiles=['clothbreath.mp3','dragon-studio-dropping-a-coin-478359.mp3','bell.mp3','yodguard-wind-magic-5-378630.mp3'];
 const sounds=audioFiles.map(file=>{const a=new Audio(new URL('../assets/sfx/'+file,import.meta.url).href);a.preload='auto';return a;});
 const cues=[[4.1,0,.12],[10.4,1,.10],[14.2,1,.08],[17.4,2,.13],[27.2,1,.09],[32.2,0,.10],[44.7,3,.06]],played=new Set();
 const saved=new Map(),lights=new Map(),cameraStart=new T.Vector3(),targetStart=new T.Vector3(),direction=new T.Vector3(),desired=new T.Vector3(),look=new T.Vector3();
 let owner=null,lastState=null,wasActive=false,exitFade=0,disposed=false,background=null,fogColor=null,fogDensity=0,frame=null;
 const save=o=>{if(!saved.has(o))saved.set(o,o.visible);};
 function restore(){for(const [o,visible]of saved)o.visible=visible;saved.clear();for(const [o,visible]of lights)o.visible=visible;lights.clear();if(background)scene.background.copy(background);if(fogColor)scene.fog.color.copy(fogColor);if(scene.fog)scene.fog.density=fogDensity;root.visible=false;}
 const mix=(a,b,t)=>desired.set(...a).lerp(look.set(...b),t).clone();
 function cameraFrame(f,camera,origin){
  let p,target;const k=ease(f.progress);
  if(f.place==='aftermath'){
   const q=ease(f.time/5.5);p=cameraStart.clone().lerp(new T.Vector3(origin.x+2.1,origin.y+3.5,origin.z+5.6),q);target=targetStart.clone().lerp(new T.Vector3(origin.x,origin.y+2.85,origin.z),q);
  }else if(f.shot==='day-shift'){p=mix([4.8,3.8,6.4],[2.8,3.35,5],k);target=mix([0,2.2,.4],[0,2.4,.4],k);}
  else if(f.shot==='school'){p=mix([6,4.5,7],[2.4,3.3,4.6],k);target=new T.Vector3(actor.root.position.x*.6,2.35,.1);}
  else if(f.shot==='night-shift'){p=mix([-4.7,3.6,5.8],[-2.8,3.25,5],k);target=new T.Vector3(0,2.25,.3);}
  else if(f.shot==='bedroom'){p=mix([6.8,4.2,7],[3.4,3.5,5.2],k);target=mix([0,2.1,0],[0,2.55,.15],k);}
  else if(f.shot==='question'){p=mix([3.4,3.5,5.2],[1.1,3.25,3.8],k);target=mix([0,2.55,.15],[0,2.92,0],k);}
  else if(f.shot==='thought-cloud'){p=mix([1.1,3.25,3.8],[.4,4.2,5.4],k);target=mix([0,2.92,0],[0,4,-.15],k);}
  else{const q=ease(f.local/6.2);p=mix([.4,4.2,5.4],[0,4.75,-.35],q);target=mix([0,4,-.15],[0,4.75,-1.8],q);}
  if(camera.aspect<1&&f.place!=='aftermath')p.z*=1.4;
  camera.position.copy(p);camera.fov=camera.aspect<1?50:f.place==='aftermath'?48-6*ease(f.time/5.5):42;camera.updateProjectionMatrix();camera.lookAt(target);
 }
 function stopSounds(){for(const a of sounds)a.pause();}
 function update(g,camera,{active=true,muted=false,dt=0}={}){
  if(disposed)return false;
  const state=g.gyuwon.years?.mode==='reverie'?g.gyuwon.years.reverie:null;
  if(!state){
   if(lastState){restore();exitFade=1.4;lastState=null;wasActive=false;stopSounds();}
   if(exitFade>0){if(active)exitFade=Math.max(0,exitFade-dt);overlay.hidden=false;caption.textContent='';top.hidden=bottom.hidden=true;shade.style.background='#fff6e6';shade.style.opacity=String(exitFade/1.4);}
   else overlay.hidden=true;
   return false;
  }
  if(lastState!==state||owner!==g){
   if(lastState)restore();owner=g;lastState=state;exitFade=0;played.clear();stopSounds();background=scene.background.clone();fogColor=scene.fog?.color.clone();fogDensity=scene.fog?.density||0;
   for(const o of scene.children)if(o!==root){if(o.isLight)lights.set(o,o.visible);else save(o);}save(boss);save(player.rig);
   cameraStart.copy(camera.position);camera.getWorldDirection(direction);targetStart.copy(camera.position).addScaledVector(direction,12);
  }
  root.visible=true;overlay.hidden=false;top.hidden=bottom.hidden=false;frame=gyuwonReverieFrame(state.time);actor.update(frame,state.origin);
  sets.shop.visible=frame.place==='shop';sets.school.visible=frame.place==='school';sets.room.visible=frame.place==='room';sets.setRoomOpacity(frame.roomFade);
  boss.visible=player.rig.visible=false;
  if(frame.time>=9){for(const o of scene.children)if(o!==root&&!o.isLight){save(o);o.visible=false;}for(const o of lights.keys())o.visible=false;scene.background.setHex(frame.shot==='night-shift'||frame.place==='room'?0x101b2b:0x727e8a);scene.fog.color.copy(scene.background);scene.fog.density=.016;}
  key.position.set(actor.root.position.x+3,actor.root.position.y+7,actor.root.position.z+6);key.target.position.set(actor.root.position.x,2,actor.root.position.z);key.intensity=frame.place==='room'?.68:frame.shot==='night-shift'?1.2:2.1;
  cameraFrame(frame,camera,state.origin);cloud.update(frame,camera);caption.textContent=frame.subtitle;shade.style.background=frame.white>0?'#fff6e6':'#000';shade.style.opacity=String(Math.max(frame.cut,frame.white));
  if(!active){stopSounds();wasActive=false;}else{
   if(!wasActive)for(let i=0;i<sounds.length;i++)if(sounds[i].currentTime>0&&!sounds[i].ended&&played.has('resume'+i))sounds[i].play()?.catch(()=>{});
   for(const [at,index,volume]of cues)if(frame.time>=at&&!played.has(at)){played.add(at);const a=sounds[index];a.currentTime=0;a.volume=volume*audioChannelGain('ambient');a.muted=muted;played.add('resume'+index);a.play()?.catch(()=>{});}
   for(const a of sounds)a.muted=muted;wasActive=true;
  }
  return true;
 }
 async function prewarm(renderer,camera){const visible=root.visible,groups=[sets.shop,sets.school,sets.room,cloud.root],prior=groups.map(o=>o.visible),target=new T.WebGLRenderTarget(16,16),old=renderer.getRenderTarget();root.visible=true;groups.forEach(o=>o.visible=true);try{renderer.initTexture?.(cloud.texture);await renderer.compileAsync(scene,camera);renderer.setRenderTarget(target);renderer.render(scene,camera);}finally{renderer.setRenderTarget(old);target.dispose();root.visible=visible;groups.forEach((o,i)=>o.visible=prior[i]);}}
 return {root,update,prewarm,pause(){stopSounds();wasActive=false;},get active(){return !!lastState;},stats:()=>({shot:frame?.shot||null,time:frame?.time||0,cloud:frame?.cloud||0,volumeTexture:40}),dispose(){if(disposed)return;disposed=true;restore();stopSounds();for(const a of sounds){a.removeAttribute('src');a.load();}actor.dispose();sets.dispose();cloud.dispose();key.shadow.map?.dispose();root.removeFromParent();overlay.remove();style.remove();}};
}
