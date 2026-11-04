import * as THREE from 'three';
import {loadSurfaceTexture} from './kwon-surface.mjs';
import {reducedMotion} from './display-preferences.mjs';

export function installKwonVisuals({scene,renderer,ground,boss,sun,sanctuary,runtime}){
 let low=false;try{low=localStorage.getItem('oibung.quality')==='low';}catch{}
 low=low||globalThis.matchMedia?.('(pointer:coarse)').matches;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 sun.color.setHex(0xb5cde5);sun.position.set(-24,34,-22);sun.intensity=3.2;
 sun.shadow.mapSize.set(low?1024:2048,low?1024:2048);sun.shadow.normalBias=.035;
 if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 sun.shadow.camera.left=sun.shadow.camera.bottom=-27;sun.shadow.camera.right=sun.shadow.camera.top=27;
 sun.shadow.camera.far=95;sun.shadow.camera.updateProjectionMatrix();sun.shadow.needsUpdate=true;
 // Keep the boss readable from the player's side without flattening the moonlit rim.
 const fill=new THREE.DirectionalLight(0xffd9ab,.95);fill.position.set(10,12,18);scene.add(fill);
 scene.traverse(n=>{if(n.isHemisphereLight)n.intensity=.65;});
 scene.fog.color.setHex(0x15202a);scene.fog.near=38;scene.fog.far=90;
 const anisotropy=Math.min(low?2:8,renderer.capabilities.getMaxAnisotropy());
 const surface=(id,repeat)=>{
  const get=(suffix,color=false)=>loadSurfaceTexture(THREE,runtime,{url:new URL('../assets/materials/kwon/'+id+'_'+suffix+'_1k.jpg',import.meta.url).href,repeat,color,anisotropy});
  return {map:get('diff',true),normalMap:get('nor_gl'),roughnessMap:get('rough')};
 };
 const paving=surface('marble_01',4.5),stone=surface('castle_brick_broken_06',2);
 if(ground.material.map)runtime.own(ground.material.map);
 Object.assign(ground.material,paving,{roughness:.92});ground.material.color.setHex(0x929ea9);
 ground.material.normalScale.set(.75,.75);ground.material.needsUpdate=true;
 const materials=new Set();
 sanctuary?.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){
  if(!m?.isMeshStandardMaterial||m.roughness<.9||m.side===THREE.DoubleSide||materials.has(m))continue;
  materials.add(m);Object.assign(m,stone);m.color.setHex(0x929ba5);m.normalScale.set(.65,.65);m.needsUpdate=true;n.receiveShadow=true;
 }});
 // A softly graded reflection environment gives bone and shell broad, physical highlights.
 const sky=document.createElement('canvas');sky.width=128;sky.height=64;
 const ctx=sky.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,64);
 for(const [p,c] of [[0,'#b0c4dc'],[.35,'#526378'],[.6,'#242a30'],[1,'#50402c']])gradient.addColorStop(p,c);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,128,64);
 const environment=runtime.own(new THREE.CanvasTexture(sky));environment.colorSpace=THREE.SRGBColorSpace;
 environment.mapping=THREE.EquirectangularReflectionMapping;scene.environment=environment;scene.environmentIntensity=.55;
 // Fine shell ridges and pores change light response without changing combat geometry.
 const shell=document.createElement('canvas');shell.width=shell.height=256;const g=shell.getContext('2d');
 const pixels=g.createImageData(256,256);let seed=71;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  seed=seed*16807%2147483647;const grain=seed/2147483647;
  const value=124+Math.sin(x*.23+Math.sin(y*.08)*2)*17+Math.sin(y*.13)*9+grain*24;
  const i=(y*256+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
 }
 g.putImageData(pixels,0,0);const bump=runtime.own(new THREE.CanvasTexture(shell));
 bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(3,2);
 boss.carapace.bumpMap=bump;boss.carapace.bumpScale=.085;boss.carapace.color.setHex(0xbfa68d);
 boss.carapace.roughness=.4;boss.carapace.metalness=.03;boss.carapace.needsUpdate=true;
 boss.joint.color.setHex(0x493a31);boss.joint.roughness=.68;boss.boneMat.roughness=.32;
 const armourMaterials=new Set();boss.root.traverse(n=>{if(n.material?.isMeshStandardMaterial&&n.material.metalness>.5&&n.material.color.getHex()===0x272a32)armourMaterials.add(n.material);});
 for(const material of armourMaterials){material.bumpMap=bump;material.bumpScale=.045;material.roughness=.59;material.needsUpdate=true;}
 // Replace the existing square pillar shafts in place; the playable boundary stays fixed.
 const columns=[];sanctuary?.traverse(n=>{if(n.isMesh&&n.geometry?.type==='BoxGeometry'&&n.scale.y===12&&n.position.y===6)columns.push(n);});
 const shaft=new THREE.CylinderGeometry(1.02,1.15,11.2,low?12:24),moulding=new THREE.CylinderGeometry(1.42,1.5,.3,low?12:24);
 if(!columns.length){shaft.dispose();moulding.dispose();}
 for(const column of columns){column.visible=false;const parent=column.parent;
  const body=new THREE.Mesh(shaft,column.material);body.position.y=6;body.castShadow=true;body.receiveShadow=true;parent.add(body);
  for(const y of [.45,1.05,11.55]){const ring=new THREE.Mesh(moulding,column.material);ring.position.y=y;ring.castShadow=true;ring.receiveShadow=true;parent.add(ring);}
 }
 // One inexpensive point batch; no per-particle objects, lights or collision changes.
 const count=low?32:100,positions=new Float32Array(count*3),base=new Float32Array(count*3);
 for(let i=0;i<count;i++){const a=i*2.39996,r=8+(i*13%27);base[i*3]=Math.cos(a)*r;base[i*3+1]=.6+(i*7%90)/10;base[i*3+2]=Math.sin(a)*r;}
 positions.set(base);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const motes=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xb6c7d8,size:.045,transparent:true,opacity:.32,depthWrite:false}));
 motes.name='kwon-moonlit-dust';const reduced=reducedMotion();
 let dustTime=0,silenced=false;sanctuary.userData.updateVisualMood=(game,dt)=>{if(game.time<.1&&game.boss.phase===1)dustTime=0;if(game.status==='playing')dustTime+=Math.max(0,dt);silenced=game.status==='won';motes.material.opacity=silenced?.06:.32;};
 motes.onBeforeRender=()=>{if(reduced||silenced)return;const t=dustTime*.15;for(let i=0;i<count;i++){positions[i*3]=base[i*3]+Math.sin(t+i)*.35;positions[i*3+1]=base[i*3+1]+Math.sin(t*.8+i)*.25;}geometry.attributes.position.needsUpdate=true;};scene.add(motes);
}
