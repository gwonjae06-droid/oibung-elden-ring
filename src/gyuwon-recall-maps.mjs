import * as THREE from 'three';
import {buildEnvironment} from './environment.mjs';
import {buildCircus} from './circus-environment.mjs';
import {buildDiceBoard} from './dice-actor.mjs';
import {createWhiteCathedral} from './blood-white-cathedral.mjs';
import {createCameraVisibility} from './camera-visibility.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

export const RECALL_MAP_NAMES=Object.freeze({sword:'ruined-courtyard',circus:'clown-circus',gamble:'roulette-table-arena',tsunami:'blood-white-cathedral'});
// Use the owning boss factories. Each receives its own scene so fog, lighting
// and stage callbacks cannot overwrite the live white void or player lighting.
export function createGyuwonRecallMaps(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-real-boss-maps';scene.add(root);
 const maps=new Map();let active=null,disposed=false,focus=null;
 const visibility=createCameraVisibility(scene,{roots:()=>active?[active.group]:[],targets:()=>focus?[{x:focus.player.x,y:1.5,z:focus.player.z},{x:focus.boss.x,y:2.5,z:focus.boss.z},...(focus.gyuwon?.hazards?.some(h=>h.shape==='wave')?[{x:focus.gyuwon.hazards.find(h=>h.shape==='wave').gap,y:18,z:-180,radius:20}]:[])]:[]});
 function prepare(id){
  if(maps.has(id))return maps.get(id);
  const isolated=new THREE.Scene();isolated.background=new THREE.Color(0xffffff);isolated.fog=new THREE.Fog(0xffffff,100,650);
  const group=new THREE.Group();group.name='recalled-map-'+id;root.add(group);let control=null;
  try{
   if(id==='sword'){const ground=new THREE.Mesh(new THREE.CircleGeometry(28,80).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}));ground.name='kwon-recalled-paving';ground.position.y=-.04;isolated.add(ground);control=buildEnvironment(isolated,ground);}
   if(id==='circus')control=buildCircus(isolated,{mobile:coarse,reduced});
   if(id==='gamble'){control=buildDiceBoard(isolated);control.root.scale.setScalar(.3);}
   if(id==='tsunami')control=createWhiteCathedral(isolated,{coarse,reduced,radius:28});
   for(const child of [...isolated.children])group.add(child);
   // Preserve the actual map's geometry, textures and colours. Gold is a light
   // memory tint, not a replacement model or a flat proxy for the map.
   group.traverse(o=>{if(o.renderOrder<0&&o.material?.fog===false)o.visible=false;if(o.isLight)o.castShadow=false;if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.isMeshStandardMaterial){m.color.lerp(new THREE.Color(0xf1cb78),.12);m.emissive?.setHex(0x2b1c06);m.emissiveIntensity=.08;}}});
   group.visible=false;const entry={id,group,control,isolated};maps.set(id,entry);return entry;
  }catch(error){disposeScene(group);disposeScene(isolated);group.removeFromParent();throw error;}
 }
 // Construct once before gameplay. Rapid transitions only switch visibility.
 for(const id of Object.keys(RECALL_MAP_NAMES))prepare(id);
 function update(g){focus=g;const id=g.status==='playing'&&g.boss.phase===3?g.gyuwon.stageMemory:null;active=maps.get(id)||null;for(const entry of maps.values())entry.group.visible=entry===active;}
 return {root,update,clear(){focus=null;active=null;visibility.restore();for(const entry of maps.values())entry.group.visible=false;},stats(){return {active:active?.group.name||null,loaded:maps.size,builds:maps.size,originalRoot:active?.group.getObjectByName(RECALL_MAP_NAMES[active.id])?.name||null};},dispose(){if(disposed)return;disposed=true;visibility.dispose();for(const {group,control,isolated}of maps.values()){control?.hide?.();disposeScene(group);group.removeFromParent();isolated.clear();}maps.clear();root.removeFromParent();}};
}
