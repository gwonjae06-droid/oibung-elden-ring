import * as T from 'three';
// Worn garments inherit the chest/head joints; they never float beside the actor.
export function createActFiveCostumes(torso,head,{coarse=false}={}){
 const geo=[],mats=[],outfits=[];
 const mat=(color,metalness=0)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:metalness?.36:.88});mats.push(m);return m;};
 const steel=mat(0x8c9da6,.75),velvet=mat(0x6c304c),ivory=mat(0xe7deca),gold=mat(0xc5a168,.75),blue=mat(0x335b78);
 const mesh=(p,g,m,x,y,z,sx=1,sy=1,sz=1)=>{geo.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;};
 const outfit=(name,parent=torso)=>{const o=new T.Group();o.name=name;parent.add(o);outfits.push(o);return o;};
 const knight=outfit('act-five-worn-knight-armour');
 mesh(knight,new T.SphereGeometry(.56,coarse?20:32,18,0,Math.PI*2,0,Math.PI*.82),steel,0,.12,.27,1,1.12,.68);
 for(const side of [-1,1]){mesh(knight,new T.SphereGeometry(.23,20,14),steel,side*.58,.54,.02,1.2,.7,1.1);mesh(knight,new T.BoxGeometry(.035,1.0,.04),gold,side*.24,.1,.65);}
 const clown=outfit('act-five-worn-harlequin');
 for(let i=0;i<10;i++){const a=i*Math.PI/5;mesh(clown,new T.ConeGeometry(.12,.30,8),i%2?ivory:velvet,Math.sin(a)*.27,.66,Math.cos(a)*.22).rotation.z=Math.sin(a)*.6;}
 const hat=outfit('act-five-worn-harlequin-cap',head);
 for(const side of [-1,1]){const horn=mesh(hat,new T.ConeGeometry(.18,.62,12),velvet,side*.23,.48,0);horn.rotation.z=-side*.5;mesh(hat,new T.SphereGeometry(.045,12,8),gold,side*.38,.75,0);}
 const dancer=outfit('act-five-worn-dancer-sash');
 const sash=mesh(dancer,new T.BoxGeometry(.12,1.1,.035,2,6,1),gold,0,.05,.52);sash.rotation.z=-.60;
 const tails=[];for(const side of [-1,1]){
  const g=new T.PlaneGeometry(.48,.9,6,12),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getY(i)*8)*.035);g.computeVertexNormals();
  const tail=mesh(dancer,g,velvet,side*.28,-.8,-.20);tails.push(tail);
 }
 const traveller=outfit('act-five-worn-traveller-mantle');
 const mantle=new T.LatheGeometry([[.27,.72],[.54,.50],[.64,.24],[.61,-.35],[.67,-.82]].reverse().map(p=>new T.Vector2(...p)),coarse?24:40,Math.PI*.25,Math.PI*1.5);
 mesh(traveller,mantle,blue,0,0,-.05,1,1,.95);mesh(traveller,new T.SphereGeometry(.055,16,10),gold,.22,.54,.49);
 let previous=null;
 function update(m){
  const id=m.lyricAction?.actionId||'',g=m.songPerformance?.gesture;
  const chosen=['savingKnight','heroDancerStar'].includes(id)?knight:
   ['becomeAnyone','fallAndLaugh'].includes(id)?clown:
   ['danceWorld','danceReprise','trumpetFanfare'].includes(id)?dancer:
   ['blueGoldSea','millionRoads','runFree','runReprise','adventureCall'].includes(id)?traveller:null;
  for(const o of outfits)o.visible=o===chosen||o===hat&&chosen===clown;
  tails.forEach((o,i)=>{o.rotation.x=Math.sin(m.time*2+i)*.14;o.rotation.z=Math.sin(m.time*.9+i)*.08;});
  previous=chosen;
 }
 return {update,dispose(){for(const o of outfits)o.removeFromParent();for(const g of geo)g.dispose();for(const m of mats)m.dispose();}};
}
