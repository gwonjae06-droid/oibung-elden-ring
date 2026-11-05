// Scenic only. The central 11 x 11 dice arena and its contact/face rules are untouched.
export const CASINO_SHOW_LAYOUT=Object.freeze({arenaHalf:67.5,rouletteZ:-117,signZ:-121,decorMinimumRadius:99});
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export const casinoShowPhase=game=>game?.boss?.phase===3||game?.dice?.giant?.temperament==='feral'?3:game?.boss?.phase===2||game?.dice?.giant?2:1;
export function buildCasinoPhaseTheatre(T,parent,{coarse=false,reduced=false}={}){
 const root=new T.Group();root.name='casino-three-act-theatre';root.userData.decorativeOnly=true;parent.add(root);
 const trim=new T.MeshStandardMaterial({color:0xc6a166,roughness:.32,metalness:.72,
   emissive:0x4d3112,emissiveIntensity:.25});
 const black=new T.MeshStandardMaterial({color:0x22111d,roughness:.55,metalness:.2});
 const scarlet=new T.MeshBasicMaterial({color:0x671a32,transparent:true,opacity:.01,depthWrite:false,side:T.DoubleSide});
 const neon=new T.MeshBasicMaterial({color:0xffdb85,toneMapped:false});
 const jackpot=new T.MeshBasicMaterial({color:0xf9d288,toneMapped:false});
 const fracture=new T.MeshBasicMaterial({color:0xa63144,transparent:true,opacity:0,depthWrite:false});
 const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,coarse?8:12,8);
 function block(group,x,y,z,w,h,d,material,name=''){
  const mesh=new T.Mesh(box,material);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.name=name;group.add(mesh);return mesh;
 }
 const roulette=new T.Group();roulette.name='casino-giant-roulette-sign';
 roulette.position.set(0,25,CASINO_SHOW_LAYOUT.rouletteZ);root.add(roulette);
 const wheel=new T.Group();wheel.name='casino-roulette-spinning-face';roulette.add(wheel);
 const goldTorus=new T.TorusGeometry(18,1.5,coarse?6:10,coarse?32:64);
 wheel.add(new T.Mesh(goldTorus,trim));
 const inner=new T.Mesh(new T.CircleGeometry(16.7,coarse?36:72),black);inner.position.z=.45;wheel.add(inner);
 const pockets=[],dummy=new T.Object3D();
 for(let i=0;i<36;i++){
  const a=i*Math.PI/18,r=15.8;
  pockets.push({x:Math.sin(a)*r,y:Math.cos(a)*r,a});
 }
 const segments=new T.InstancedMesh(new T.BoxGeometry(1,1,1),neon,pockets.length);
 segments.name='casino-roulette-number-lamps';
 pockets.forEach((p,i)=>{dummy.position.set(p.x,p.y,.55);dummy.rotation.set(0,0,-p.a);
  dummy.scale.set(.65,1.35,.35);dummy.updateMatrix();segments.setMatrixAt(i,dummy.matrix);
  segments.setColorAt(i,new T.Color(i%3===0?0xffeabc:i%2?0xed5c70:0xf7cb82));
 });
 segments.instanceMatrix.needsUpdate=true;segments.instanceColor.needsUpdate=true;wheel.add(segments);
 const arrow=block(roulette,0,0,1,1.3,9,.65,trim,'casino-roulette-pointer');
 arrow.rotation.z=-.35;
 // Outboard slot cabinets, far away from the square's physical perimeter.
 const cabinetBodies=[],cabinetScreens=[],cabinetCount=coarse?5:9;
 for(let i=0;i<cabinetCount;i++){
  const x=(i-(cabinetCount-1)/2)*(coarse?23:14),z=-111-Math.abs(x)*.09;
  const machine=new T.Group();machine.name='casino-slot-machine';machine.position.set(x,0,z);root.add(machine);
  cabinetBodies.push(block(machine,0,5,0,8,11,5,black));
  block(machine,0,10.7,0,8.5,.75,5.5,trim);
  const face=block(machine,0,6.3,2.55,6.5,4.8,.3,neon,'casino-slot-screen');cabinetScreens.push(face);
  for(const side of [-1,1])block(machine,side*3.5,5,2.7,.35,7,.2,trim);
 }
 // A three-digit seven-segment JACKPOT board without font textures.
 const scoreboard=new T.Group();scoreboard.name='casino-jackpot-board';
 scoreboard.position.set(0,70,CASINO_SHOW_LAYOUT.signZ);root.add(scoreboard);
 block(scoreboard,0,0,0,50,17,2,black,'casino-scoreboard-body');
 const sevenSegment=[[0,5,0,5.8,.65],[-3,2.6,0,.65,4.9],[3,2.6,0,.65,4.9],[0,0,0,5.8,.65],[-3,-2.6,0,.65,4.9],[3,-2.6,0,.65,4.9],[0,-5,0,5.8,.65]];
 const digits=[],numberTable=[
  [0,1,2,4,5,6],
  [2,5],
  [0,2,3,4,6],
  [0,2,3,5,6],
  [1,2,3,5],
  [0,1,3,5,6],
  [0,1,3,4,5,6],
  [0,2,5],
  [0,1,2,3,4,5,6],
  [0,1,2,3,5,6]
 ];
 for(let index=0;index<3;index++){
  digits[index]=sevenSegment.map(([dx,dy,dz,w,h],j)=>{
   const piece=block(scoreboard,(index-1)*15+dx,dy,1.23,w,h,.2,jackpot,'casino-jackpot-digit-segment');
   return piece;
  });
 }
 const cracks=new T.Group();cracks.name='casino-fractured-wall-silhouettes';root.add(cracks);
 const splinters=new T.Group();splinters.name='casino-gilded-fractures';root.add(splinters);
 for(let i=0;i<(coarse?10:20);i++){
  const a=i*2.399963,pR=132+(i%4)*7,x=Math.sin(a)*pR,z=Math.cos(a)*pR,
        height=8+i%4*4;
  const f=block(cracks,x,height/2,z,1.3,height,.18,fracture,'casino-scarlet-wall-fracture');
  f.rotation.y=a;f.rotation.z=(i%2?1:-1)*.3;
  const chip=block(splinters,x,height+1,z,2+i%4,5,.9,trim,'casino-hanging-gold-shard');
  chip.rotation.z=.45+(i%3)*.3;chip.userData.baseline=chip.rotation.z;
 }
 const crown=new T.Mesh(new T.RingGeometry(94,102,coarse?48:96).rotateX(-Math.PI/2),scarlet);
 crown.position.y=.03;crown.name='casino-collapse-ring';root.add(crown);
 const banner=new T.Group();banner.name='casino-failing-chandelier-ornament';
 banner.position.set(0,95,-45);root.add(banner);
 const bell=new T.Mesh(new T.TorusGeometry(15,.75,8,coarse?24:48),trim);bell.rotation.x=Math.PI/2;banner.add(bell);
 const crystals=[];
 for(let i=0;i<(coarse?8:16);i++){
  const a=i*Math.PI*2/(coarse?8:16);
  const crystal=new T.Mesh(new T.OctahedronGeometry(2.1),trim);
  crystal.position.set(Math.sin(a)*14,-5-(i%4)*2,Math.cos(a)*14);banner.add(crystal);crystals.push(crystal);
 }
 let phase=1,lastTime=0,phaseAt=0,age=0;
 const warm=new T.Color(0xf9d288),alert=new T.Color(0xee5376),hell=new T.Color(0xff263d);
 const digitDisplay=number=>digits.forEach((group,index)=>{
  const value=Math.floor(number/Math.pow(10,2-index))%10,lit=numberTable[value];
  group.forEach((segment,i)=>segment.visible=lit.includes(i));
 });
 digitDisplay(777);
 function update(g,t=0,dt=0){
  const next=casinoShowPhase(g),safeTime=Number.isFinite(t)?Math.max(0,t):0;
  if(next!==phase||safeTime<lastTime){phase=next;phaseAt=safeTime;}
  lastTime=safeTime;age=Math.max(0,safeTime-phaseAt);
  const p2=phase>=2?smooth(age/2.3):0;
  const p3=phase===3?smooth(age/3.2):0;
  roulette.rotation.z=(phase===3?.24:phase===2?.045:0)+(reduced?0:Math.sin(safeTime*(phase===3?1.8:.35))*.017);
  roulette.rotation.y=(phase===3?.34:0);
  wheel.rotation.z=reduced?0:safeTime*(phase===3?.95:phase===2?.45:.12);
  scoreboard.rotation.z=(phase===3?-.13:0)+(reduced?0:Math.sin(safeTime*.75)*p3*.026);
  cabinetScreens.forEach((m,i)=>{m.visible=phase===1||reduced||Math.sin(safeTime*(phase===3?19:9)+i*1.4)>.1;});
  const number=phase===1?777:phase===2?Math.floor(safeTime*4)%2?666:777:Math.floor(safeTime*7)%3?666:999;
  digitDisplay(number);
  jackpot.color.copy(phase===1?warm:phase===2?alert:hell);
  neon.color.copy(warm).lerp(phase===3?hell:alert,p3*.95+p2*.65);
  fracture.opacity=p3*.66;
  scarlet.opacity=p3*.48;
  trim.emissiveIntensity=.24+p3*.37;
  banner.rotation.z=(phase===3?-.22:phase===2?-.05:0)+(reduced?0:Math.sin(safeTime*(phase===3?1.5:.7))*(.02+p3*.06));
  splinters.children.forEach((m,i)=>{m.rotation.z=m.userData.baseline+p3*(i%2?-.25:.33);
   m.position.y=(8+i%4*4)+1-p3*(i%3)*3;});
  return {phase,p2,p3,number};
 }
 function reset(){phase=1;phaseAt=0;lastTime=0;age=0;update({boss:{phase:1},time:0},0,0);}
 reset();
 return {root,update,reset,stats:()=>({phase,rouletteZ:CASINO_SHOW_LAYOUT.rouletteZ,
  cabinetCount,fractures:cracks.children.length,realLights:0,decorativeOnly:true})};
}
