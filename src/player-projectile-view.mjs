import {runThreeStartup} from './runtime/three-startup.mjs';
import {playerProjectileStyle,playerProjectilePose} from './player-projectile-data.mjs';
export function createPlayerProjectileView(T,parent){return runThreeStartup(T,(T,own)=>{
 const root=new T.Group();root.name='shared-player-projectiles';parent.add(root);const items=new Map(),materials=new Map(),released=new WeakSet();let owner=null,disposed=false;
 const geos={shaft:new T.CylinderGeometry(.035,.045,1,8).rotateX(Math.PI/2),long:new T.CylinderGeometry(.035,.045,2,8).rotateX(Math.PI/2),tip:new T.ConeGeometry(.09,.25,8).rotateX(Math.PI/2),card:new T.BoxGeometry(.4,.035,.55),mark:new T.BoxGeometry(.12,.04,.16),wave:new T.TorusGeometry(.9,.065,8,32,Math.PI).rotateX(Math.PI/2),orb:new T.SphereGeometry(.15,12,8)};
 const watch=a=>a.addEventListener('dispose',()=>released.add(a));for(const g of Object.values(geos))watch(g);
 function material(color){if(!materials.has(color)){const m=new T.MeshBasicMaterial({color,side:T.DoubleSide});watch(m);materials.set(color,m);}return materials.get(color);}
 function make(style){const group=new T.Group();const add=(g,c,x=0,y=0,z=0)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);group.add(m);};if(style.kind==='bow'){add(style.length===2?geos.long:geos.shaft,style.color);add(geos.tip,style.color,0,0,style.length/2+.1);}else if(style.kind==='cards'){add(geos.card,style.color);add(geos.mark,0xe4c27c,0,.035,0);}else add(style.kind==='wave'?geos.wave:geos.orb,style.color);group.scale.setScalar(style.scale);root.add(group);return group;}
 function clear(){for(const item of items.values())item.group.removeFromParent();items.clear();owner=null;}
 function update(g){if(disposed)return;if(owner!==g){clear();owner=g;}const live=new Set();for(const q of g.projectiles||[]){if(!(q.life>0))continue;live.add(q.id);const style=playerProjectileStyle(q,g.weapon),key=JSON.stringify(style);let item=items.get(q.id);if(!item||item.key!==key){item?.group.removeFromParent();item={key,group:make(style)};items.set(q.id,item);}const p=playerProjectilePose(q,g.time);item.group.position.set(p.x,p.y,p.z);item.group.rotation.set(0,p.yaw,p.spin);}for(const [id,item]of items)if(!live.has(id)){item.group.removeFromParent();items.delete(id);}}
 function dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();for(const a of [...Object.values(geos),...materials.values()])if(!released.has(a))a.dispose();materials.clear();}
 return {root,update,clear,dispose};
 });}
