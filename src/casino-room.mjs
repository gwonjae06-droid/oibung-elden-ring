import {createChapterClock} from './chapter-environment.mjs';
export function casinoRoomPlan(mobile=false){
 const count=mobile?4:8,radius=150;
 return Array.from({length:count},(_,i)=>{const a=i===0?-Math.PI/2:(i+.5)/count*Math.PI*2,c=Math.cos(a),s=Math.sin(a);return {x:c*radius,z:s*radius,yaw:Math.atan2(-c,-s),seed:i*1.37};});
}
export function buildCasinoRoom(T,parent,{coarse=false,reduced=false}={}){
 const root=new T.Group();root.name='giant-casino-lounge';parent.add(root);
 const suit=new T.MeshStandardMaterial({color:0x10101b,roughness:.85}),skin=new T.MeshStandardMaterial({color:0x29212a,roughness:.95}),gold=new T.MeshStandardMaterial({color:0xb59152,metalness:.65,roughness:.4}),wood=new T.MeshStandardMaterial({color:0x24131b,roughness:.7}),ivory=new T.MeshStandardMaterial({color:0xaaa28d,roughness:.8}),neon=new T.MeshBasicMaterial({color:0xe6b35e});
 const sphere=new T.SphereGeometry(1,16,12),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,16);
 const mesh=(geometry,material,p,size,group=root)=>{const m=new T.Mesh(geometry,material);m.position.set(...p);m.scale.set(...size);group.add(m);return m;};
 const patrons=[];
 for(const p of casinoRoomPlan(coarse)){
  const guest=new T.Group();guest.name='watching-casino-guest';guest.position.set(p.x,0,p.z);guest.rotation.y=p.yaw;root.add(guest);
  const torso=mesh(sphere,suit,[0,5,0],[18,30,12],guest);torso.rotation.x=.2;
  mesh(cylinder,skin,[0,32,13],[5,9,5],guest);
  const head=mesh(sphere,skin,[0,43,23],[10,12,9],guest);head.rotation.x=.22;
  mesh(box,suit,[0,52,24],[24,1.8,16],guest);mesh(cylinder,suit,[0,57,23],[10,9,8],guest);
  for(const side of [-1,1]){
   const lapel=mesh(box,ivory,[side*5,20,13],[5,16,1],guest);lapel.rotation.z=side*.35;
   mesh(sphere,gold,[side*3,44,31.2],[.65,.4,.25],guest);
  }
  mesh(box,gold,[0,18,14],[2,7,1],guest);
  const hands=[];
  for(const side of [-1,1]){
   const arm=mesh(sphere,suit,[side*20,8,18],[7,12,22],guest);arm.rotation.x=-.25;
   mesh(box,ivory,[side*20,4,36],[10,4,5],guest);
   const hand=new T.Group();hand.position.set(side*20,3,42);guest.add(hand);
   mesh(sphere,skin,[0,0,0],[7,3,9],hand);
   for(let finger=0;finger<4;finger++)mesh(sphere,skin,[(finger-1.5)*2.7,-.4,7],[1.25,1.6,6],hand);
   mesh(cylinder,gold,[side*20,6,41],[5,2,5],guest);hands.push(hand);
  }
  const seat=new T.Group();seat.position.set(p.x,0,p.z);seat.rotation.y=p.yaw;root.add(seat);mesh(box,wood,[0,8,-18],[34,38,5],seat);patrons.push({guest,torso,head,hands,seed:p.seed,x:p.x,z:p.z,yaw:p.yaw});
 }
 const half=250;
 for(let side=0;side<4;side++){
  const wall=new T.Group();wall.rotation.y=side*Math.PI/2;root.add(wall);
  mesh(box,wood,[0,0,-half],[half*2,180,3],wall);mesh(box,gold,[0,68,-half+2],[half*2,1,1],wall);
  for(let i=0;i<(coarse?3:5);i++){const x=(i-2)*45;mesh(box,suit,[x,-35,-half+12],[23,47,15],wall);mesh(box,gold,[x,-25,-half+20],[19,26,1],wall);mesh(box,neon,[x,-25,-half+21],[17,23,.5],wall);}
 }
 for(const x of [-75,75]){mesh(cylinder,gold,[x,110,0],[.5,80,.5]);mesh(sphere,neon,[x,70,0],[18,3,18]);}
 const hoop=new T.TorusGeometry(16,.65,6,coarse?20:40),crystal=new T.OctahedronGeometry(1.8),glass=new T.MeshStandardMaterial({color:0xeadcc0,metalness:.25,roughness:.2}),chandeliers=[];
 for(const x of [-75,75]){const ring=mesh(hoop,gold,[x,68,0],[1,1,1]);chandeliers.push(ring);ring.rotation.x=Math.PI/2;for(let i=0;i<(coarse?8:16);i++){const a=i/(coarse?8:16)*Math.PI*2;mesh(crystal,glass,[x+Math.sin(a)*16,64-(i%3)*2,Math.cos(a)*16],[1,2,1]);}}
 root.userData.decorativeOnly=true;
 const clock=createChapterClock(),warm=new T.Color(0xe6b35e),alarm=new T.Color(0xc65639);
 return {root,update(time=0,game,dt){
  const mood=clock.update(time,game?.boss.phase||1,game?.status==='won',dt),t=Number.isFinite(time)?time:0;
  const giant=game?.dice?.giant,cinematicTime=giant?.state==='transition'?giant.t:giant?7:0;
  const alarmMix=Math.max(0,Math.min(1,(cinematicTime-3.85)/2.3));
  const feral=giant?.temperament==='feral',rage=giant?.rageBeat||0;
  const impact=giant?.state==='attack'&&giant.hazards?.some(h=>giant.t>=h.start+h.warn&&giant.t<h.start+h.warn+.18)?1:0;
  neon.color.copy(warm).lerp(alarm,alarmMix).multiplyScalar((1-mood.silence*.85)*(1+(feral?.16:0)+impact*.17));
  chandeliers.forEach((ring,i)=>{ring.rotation.z=reduced?0:Math.sin(t*(feral?2.6:1.25)+i)*(.02+.05*alarmMix)+impact*.035;});
  for(const [index,p] of patrons.entries()){
   const fleeStart=3.9+index*.12,escape=giant&&index!==0?Math.max(0,Math.min(1,(cinematicTime-fleeStart)/1.9)):0;
   const flee=escape*escape*(3-2*escape);
   p.guest.visible=!(index===0&&giant&&cinematicTime>=4.35)&&flee<.98;
   p.guest.position.x=p.x*(1+mood.collapse*.04+flee*.62);
   p.guest.position.z=p.z*(1+mood.collapse*.04+flee*.62);
   p.guest.rotation.y=p.yaw+(index%2?1:-1)*flee*1.65;
   p.torso.rotation.x=.2+(reduced||mood.dead?0:Math.sin(t*.35+p.seed)*.018)+flee*.38;
   const dx=(game?.boss?.x||0)-p.guest.position.x,dz=(game?.boss?.z||0)-p.guest.position.z;
   const relative=Math.atan2(dx,dz)-p.guest.rotation.y;
   p.head.rotation.y=Math.atan2(Math.sin(relative),Math.cos(relative))*.45*(1-flee)+(reduced?0:Math.sin(t*.27+p.seed)*.04);
   p.head.rotation.x=.22+alarmMix*.08+flee*.3;
   p.hands.forEach((hand,i)=>{hand.position.y=3+(reduced?0:Math.max(0,Math.sin(t*.65+p.seed+i*3))*(1+alarmMix*.4))+flee*(i?9:13);});
  }
 }};

}
