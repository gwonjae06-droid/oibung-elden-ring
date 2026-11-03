import {DICE_RULES as R} from './dice-data.mjs';
export function casinoRoomPlan(mobile=false){
 const edge=(R.side-1)*R.edge/2+R.tileWidth/2,count=mobile?4:8;
 return Array.from({length:count},(_,i)=>{const a=(i+.5)/count*Math.PI*2,c=Math.cos(a),s=Math.sin(a),m=Math.max(Math.abs(c),Math.abs(s)),d=edge+61;return {x:c/m*d,z:s/m*d,yaw:Math.atan2(-c,-s),seed:i*1.37};});
}
export function buildCasinoRoom(T,parent,{coarse=false,reduced=false}={}){
 const root=new T.Group();root.name='giant-casino-lounge';parent.add(root);
 const black=new T.MeshStandardMaterial({color:0x050509,roughness:.82}),trim=new T.MeshStandardMaterial({color:0x997239,metalness:.55,roughness:.45}),felt=new T.MeshStandardMaterial({color:0x12543c,roughness:.9}),wood=new T.MeshStandardMaterial({color:0x25121d,roughness:.8}),pink=new T.MeshBasicMaterial({color:0xff409e}),cyan=new T.MeshBasicMaterial({color:0x50d7e8});
 const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8),cyl=new T.CylinderGeometry(1,1,1,16),ring=new T.TorusGeometry(1,.035,6,32);
 const mesh=(geo,mat,p,scale,group=root)=>{const m=new T.Mesh(geo,mat);m.position.set(...p);m.scale.set(...scale);group.add(m);return m;};
 const patrons=[];
 for(const p of casinoRoomPlan(coarse)){
  const station=new T.Group();station.position.set(p.x,0,p.z);station.rotation.y=p.yaw;root.add(station);
  mesh(cyl,wood,[0,10,9],[16,2.5,10],station);mesh(cyl,felt,[0,11.3,9],[15.3,.25,9.4],station);
  const border=mesh(ring,trim,[0,11.5,9],[15.6,9.6,1],station);border.rotation.x=-Math.PI/2;
  const roulette=mesh(cyl,trim,[-5,11.8,10],[4,.4,4],station);const wheel=mesh(ring,p.seed%2?pink:cyan,[-5,12.05,10],[3.5,3.5,1],station);wheel.rotation.x=-Math.PI/2;
  mesh(sphere,trim,[-5,12.4,10],[.45,.45,.45],station);
  for(let i=0;i<5;i++){mesh(cyl,i%2?pink:cyan,[4+i*.8,11.8+(i%3)*.4,7],[.6,.7+(i%3)*.8,.6],station);}
  const person=new T.Group();station.add(person);
  mesh(box,wood,[0,8,-7],[12,2,10],person);mesh(box,wood,[0,18,-11],[12,22,2],person);
  const torso=mesh(sphere,black,[0,21,-6],[7,12,4.8],person);torso.rotation.x=.14;
  mesh(sphere,black,[0,36,-3],[4.1,5.4,3.8],person);mesh(cyl,black,[0,30,-4],[1.8,4,1.8],person);
  for(const s of [-1,1]){mesh(box,black,[s*3.4,7,-2],[4,11,5],person);mesh(box,black,[s*3.4,1.2,1],[4.2,2.5,8],person);}
  const arms=[];
  for(const s of [-1,1]){const arm=new T.Group();arm.position.set(s*5.8,27,-5);person.add(arm);mesh(box,black,[0,-5,1],[3.2,11,3.2],arm);const fore=mesh(box,black,[0,-10,6],[3,3,12],arm);fore.rotation.x=-.1;mesh(sphere,black,[0,-10,12],[2.3,1.4,2.8],arm);arms.push(arm);}
  patrons.push({torso,arms,wheel,seed:p.seed});
 }
 const half=(R.side-1)*R.edge/2+R.tileWidth/2+96;
 for(let side=0;side<4;side++){
  const wall=new T.Group();wall.rotation.y=side*Math.PI/2;root.add(wall);
  mesh(box,wood,[0,23,-half],[half*2,49,3],wall);
  mesh(box,trim,[0,46,-half+2],[half*2,1,1],wall);mesh(box,side%2?pink:cyan,[0,42,-half+2],[half*1.9,.35,.4],wall);
  for(let i=0;i<(coarse?3:5);i++){const x=(i-((coarse?3:5)-1)/2)*22;mesh(box,black,[x,7,-half+10],[10,17,7],wall);mesh(box,trim,[x,10,-half+14],[8,9,.4],wall);mesh(box,side%2?cyan:pink,[x,10,-half+14.3],[7,7,.25],wall);for(let j=0;j<3;j++)mesh(cyl,trim,[x+(j-1)*2.1,3.8,-half+15],[.6,.6,.6],wall);}
 }
 const ceiling=mesh(box,black,[0,58,0],[half*2,2,half*2]);
 for(const s of [-1,1]){const rail=mesh(ring,s<0?pink:cyan,[0,54,0],[half*.7,half*.7,1]);rail.rotation.x=Math.PI/2;}
 root.userData.decorativeOnly=true;
 return {root,update(time){const t=Number.isFinite(time)?time:0;for(const p of patrons){p.torso.rotation.x=.14+(reduced?0:Math.sin(t*.5+p.seed)*.015);p.arms.forEach((a,i)=>{a.rotation.x=reduced?0:Math.sin(t*.65+p.seed+i*2)*.07;a.rotation.z=reduced?0:Math.sin(t*.4+p.seed+i)*.035;});p.wheel.rotation.z=reduced?0:t*.15+p.seed;}}};
}
