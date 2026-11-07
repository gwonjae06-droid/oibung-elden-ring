import * as THREE from 'three';
import {disposeScene} from './runtime/scene-resources.mjs';

// Scenic modes never change arena bounds, hitboxes, player visibility,
// spotlit attack telegraphs or physical boss positions.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const SMOOTH=(x)=>{const k=clamp(x);return k*k*(3-2*k);};
export const NIGHTMARE_PALETTES=Object.freeze({
 carnival: Object.freeze({sky:0x29272a,fog:0x3c3533,glow:0xd7ad82}),
 mirror: Object.freeze({sky:0x191b29,fog:0x29283a,glow:0x9cabc3}),
 audience: Object.freeze({sky:0x16121d,fog:0x342832,glow:0x9f7282}),
 inversion: Object.freeze({sky:0x111721,fog:0x292e43,glow:0x9a8aac}),
 flesh: Object.freeze({sky:0x2a111e,fog:0x40202b,glow:0xbb6e7a}),
 void: Object.freeze({sky:0x090a12,fog:0x201827,glow:0xa08caa}),
});
export function nightmareWorldState(game){
 const c=game?.clown||{},b=game?.boss||{},stage=clamp(c.horrorStage||1,1,3);
 const pattern=c.state==='pattern'?c.name:null, t=Number.isFinite(c.time)?c.time:0;
 let mode='carnival';
 if(['wrongTwin','mirrorStage','facePeelHunt','vanishingAct'].includes(pattern))mode='mirror';
 else if(pattern==='synchronizedHush'||pattern==='mouthlessLament')mode='audience';
 else if(pattern==='corpseMarionetteReprise')mode='flesh';
 else if(pattern==='allCastRequiem'||pattern==='midnightGrandFinale')mode='void';
 else if(['emptyAudience','echoApplause','offbeatClap','funeralParade','audienceJudgement'].includes(pattern))mode='audience';
 else if(['curtainNightmare','stageCapsize','stageRupture','ceilingPounce'].includes(pattern))mode='inversion';
 else if(['foldedCrawl','hatchingBalloons','stolenFace','feralSkitter','reverseCrawl','brokenHorses','marionetteDevour'].includes(pattern))mode='flesh';
 else if(['livingShadow','clockOfTeeth','mouthOfTheAudience','unhingedClap'].includes(pattern))mode='void';
 else if(stage>=2){
  // Rotate scenery even between special attacks so the venue feels alive.
  const deck=stage===3?['void','flesh','mirror','inversion','audience']:['mirror','audience','inversion'];
  mode=deck[Math.floor(t/11)%deck.length];
 }
 const hp=Number.isFinite(b.hp)&&b.maxHp>0?clamp(b.hp/b.maxHp):1;
 return {mode,stage,exposure:clamp((stage-1)*.34+(1-hp)*.36,0,.98),pulse:pattern?1:.42};
}
export function createClownLivingWorld(scene,{coarse=false,reduced=false,keyLight=null,ambientLight=null}={}){
 const root=new THREE.Group();root.name='living-nightmare-world';root.userData.decorativeOnly=true;scene.add(root);
 const originalBackground=scene.background?.isColor?scene.background.clone():null;
 const originalFog=scene.fog?.color?.clone?.()||null;
 const originalKey=keyLight?.intensity,originalAmbient=ambientLight?.intensity;
 const palette=new THREE.Color(),targetColor=new THREE.Color(),fogColor=new THREE.Color(),glowColor=new THREE.Color();
 const blendedSky=new THREE.Color(NIGHTMARE_PALETTES.carnival.sky),blendedFog=new THREE.Color(NIGHTMARE_PALETTES.carnival.fog);
 const veil=new THREE.MeshBasicMaterial({color:0x6f3347,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
 const mirror=new THREE.MeshStandardMaterial({color:0x172439,metalness:.67,roughness:.26,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,emissive:0x121c2b,emissiveIntensity:.38});
 const ivory=new THREE.MeshStandardMaterial({color:0xcab0b2,roughness:.72,transparent:true,opacity:0,depthWrite:false});
 const black=new THREE.MeshBasicMaterial({color:0x0d0710,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const rim=new THREE.MeshBasicMaterial({color:0x78485e,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const materials=[veil,mirror,ivory,black,rim];
 const group=(name)=>{const o=new THREE.Group();o.name=name;root.add(o);return o;};
 const add=(parent,geo,mat,name)=>{const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;};
 const corridor=group('impossible-mirror-corridor');
 const panelGeo=new THREE.PlaneGeometry(5.5,15,1,1);
 const portals=[];
 for(let i=0;i<(coarse?7:12);i++){
  const a=i*Math.PI*2/(coarse?7:12),p=add(corridor,panelGeo,mirror,'mirror-that-does-not-reflect');
  p.position.set(Math.sin(a)*37,10,Math.cos(a)*37);
  p.rotation.y=a+Math.PI;portals.push(p);
 }
 const galleries=group('upside-down-circus-arches');
 const archGeo=new THREE.TorusGeometry(7.8,.26,5,28,Math.PI);
 const arches=[];
 for(let i=0;i<(coarse?4:7);i++){
  const a=(i+.2)*Math.PI*2/(coarse?4:7),m=add(galleries,archGeo,rim,'inverted-levitating-arch');
  m.position.set(Math.sin(a)*33,15+2*(i%2),Math.cos(a)*33);m.rotation.set(Math.PI/2,a,.35);arches.push(m);
 }
 const curtains=group('breathing-velvet-walls');
 const clothGeo=new THREE.PlaneGeometry(14,28,coarse?2:8,coarse?2:6);
 const fabric=[];
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+Math.PI/4,m=add(curtains,clothGeo,veil,'enormous-breathing-curtain');
  m.position.set(Math.sin(a)*40,15,Math.cos(a)*40);m.rotation.y=a;fabric.push(m);
 }
 const face=group('colossal-impossible-smiling-face');
 face.position.set(0,16,-48);
 const faceGeo=new THREE.SphereGeometry(1,coarse?12:22,coarse?9:16);
 const skull=add(face,faceGeo,ivory,'gigantic-mask-on-distant-curtain');
 skull.scale.set(10,12,3.7);
 const sockets=[];
 for(const sign of [-1,1]){
  const hole=add(face,new THREE.SphereGeometry(1,12,9),black,'giant-asymmetric-empty-socket');
  hole.position.set(sign*3.8,2.8,3.2);hole.scale.set(sign<0?1.7:2.15,sign<0?2:3.0,.55);sockets.push(hole);
 }
 const grin=add(face,new THREE.TorusGeometry(5.8,.25,5,36,Math.PI),black,'moonwide-grinning-jaw');
 grin.position.set(0,-3.6,3.3);grin.scale.y=.75;grin.rotation.z=Math.PI;
 const fangGeo=new THREE.ConeGeometry(.32,1.35,5),fangs=[];
 for(let i=0;i<(coarse?7:11);i++){
  const f=add(face,fangGeo,black,'mask-molar');
  f.position.set((i-(coarse?3:5))*1.05,-4.6+Math.abs(i-(coarse?3:5))*.15,3.5);fangs.push(f);
 }
 // This harmless edge treatment cannot resemble a red combat telegraph.
 const floor=group('unchanging-collision-floor-illusion');
 const lines=[];
 for(let i=0;i<(coarse?3:5);i++){
  const m=add(floor,new THREE.RingGeometry(28.2+i*1.05,28.25+i*1.05,64).rotateX(-Math.PI/2),rim,'outer-theatre-seam');
  m.position.y=.028+i*.002;lines.push(m);
 }
 let clock=0,pulse=0,disposed=false,mode='carnival',weight=0,stage=1;
 function event(e){
  if(disposed||!e)return;
  if(e.type==='clown-phase3')pulse=1.4;
  else if(e.type==='clown-horror'&&['curtain','teeth','shadow','porcelain','face','stage-break','claw-scrape','reverse-crawl','ceiling-pounce','landing','unhinged-clap','teeth-end','audience','fold','mask-fall','seats'].includes(e.cue))
   pulse=Math.min(1,pulse+.55);
 }
 function reset(){
  clock=0;pulse=0;mode='carnival';weight=0;stage=1;root.visible=true;
  blendedSky.setHex(NIGHTMARE_PALETTES.carnival.sky);blendedFog.setHex(NIGHTMARE_PALETTES.carnival.fog);
  if(originalBackground&&scene.background?.isColor)scene.background.copy(originalBackground);
  if(originalFog&&scene.fog?.color)scene.fog.color.copy(originalFog);
  if(keyLight&&Number.isFinite(originalKey))keyLight.intensity=originalKey;
  if(ambientLight&&Number.isFinite(originalAmbient))ambientLight.intensity=originalAmbient;
  for(const material of materials)material.opacity=0;
  face.visible=false;
 }
 function update(g,dt=0){
  if(disposed||!g)return;
  const h=clamp(dt,0,.05),target=nightmareWorldState(g);
  clock+=h;pulse=Math.max(0,pulse-h*.65);stage=target.stage;
  const live=g.status==='playing'&&g.boss?.state!=='transition';
  mode=target.mode;
  const goal=live?target.exposure:0,blend=1-Math.exp(-h*(reduced?2.3:1.8));
  weight+=(goal-weight)*blend;
  const c=NIGHTMARE_PALETTES[mode],fade=1-Math.exp(-h*(reduced?1.8:1.15));
  targetColor.setHex(c.sky);blendedSky.lerp(targetColor,fade);
  if(scene.background?.isColor){
   const base=palette.setHex(NIGHTMARE_PALETTES.carnival.sky);
   scene.background.lerpColors(base,blendedSky,weight);
  }
  if(scene.fog?.color){
   fogColor.setHex(c.fog);blendedFog.lerp(fogColor,fade);
   targetColor.setHex(NIGHTMARE_PALETTES.carnival.fog);
   scene.fog.color.lerpColors(targetColor,blendedFog,weight*.82);
  }
  glowColor.setHex(c.glow);rim.color.copy(glowColor);veil.color.copy(glowColor);
  const v=SMOOTH(weight),mirrored=mode==='mirror',upside=mode==='inversion',visage=mode==='void'||mode==='flesh';
  mirror.opacity=(mirrored?.72:.08)*v;
  veil.opacity=(upside?.55:.17)*v;
  ivory.opacity=(visage?.46:.06)*v;
  black.opacity=(visage?.67:.11)*v;
  rim.opacity=(upside?.5:.15)*v;
  if(keyLight&&Number.isFinite(originalKey))keyLight.intensity=originalKey*(1-.17*v);
  if(ambientLight&&Number.isFinite(originalAmbient))ambientLight.intensity=originalAmbient*(1-.12*v);
  // The foreground and real attack spotlights remain visible even in the void.
  face.visible=v>.05&&visage;
  if(face.visible){
   face.rotation.y=reduced?0:Math.sin(clock*.32)*.09;
   const breathe=reduced?0:Math.sin(clock*.86)*.035;
   skull.scale.y=12*(1+breathe);
   face.position.y=16+(reduced?0:Math.sin(clock*.65)*.6);
   grin.scale.y=.75+(mode==='flesh'?.3:.08)*(.5+.5*Math.sin(clock*2.1));
   for(let i=0;i<sockets.length;i++)sockets[i].scale.y=(i?3:2)*(1+(reduced?0:.22*Math.sin(clock*1.33+i)));
  }
  for(let i=0;i<fabric.length;i++){
   const f=fabric[i],breath=reduced?0:Math.sin(clock*.72+i*1.4);
   f.visible=v>.04;
   f.scale.set(1+(upside?.4:.12)*v*(.65+.35*breath),1+(reduced?0:.055*breath),1);
   f.rotation.z=(reduced?0:Math.sin(clock*.41+i)*.035)*v;
  }
  for(let i=0;i<portals.length;i++){
   const p=portals[i];p.visible=v>.04;
   p.rotation.z=(reduced?0:Math.sin(clock*.57+i)*.06)*v;
   p.position.y=10+(reduced?0:Math.sin(clock*.67+i)*.35)*v;
  }
  for(let i=0;i<arches.length;i++){
   const a=arches[i];a.visible=v>.04;
   a.rotation.z=.35+(!reduced?Math.sin(clock*.32+i*.7)*.16*v:0);
   a.position.y=15+2*(i%2)+(reduced?0:Math.sin(clock*.4+i)*1.1*v);
  }
  for(let i=0;i<lines.length;i++){
   lines[i].visible=v>.05;
   lines[i].rotation.y=reduced?0:clock*.01*(i%2?-1:1);
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;reset();root.parent?.remove(root);disposeScene(root);
 }
 reset();
 return {root,reset,update,event,dispose,stats:()=>({portals:portals.length,arches:arches.length,curtains:fabric.length,decorativeOnly:true}),
  get mode(){return mode;},get stage(){return stage;}};
}
