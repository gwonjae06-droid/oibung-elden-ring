// Anatomical uncanny-valley additions to the existing articulated clown.
// The photograph-covered face remains visible; these are thin deformable
// brow sockets, teeth, split makeup and ragged shadow appendages, not armor.
export function createClownNightmareAnatomy(T,{body,head,mount}){
 const skin=new T.MeshStandardMaterial({color:0x38252c,roughness:.93,transparent:true,opacity:0,side:T.DoubleSide});
 const scar=new T.MeshStandardMaterial({color:0x7d2439,roughness:.81,transparent:true,opacity:0,emissive:0x280309});
 const pearl=new T.MeshStandardMaterial({color:0xd0c1a7,roughness:.5,transparent:true,opacity:0});
 const pupil=new T.MeshStandardMaterial({color:0x09080e,roughness:.16,transparent:true,opacity:0});
 const groups=[],eyes=[],teeth=[],fingers=[];
 function mesh(parent,geometry,mat,name,x=0,y=0,z=0){
  const m=new T.Mesh(geometry,mat);m.name=name;m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
 }
 function face(root,name){
  const g=new T.Group();g.name=name;root.add(g);groups.push(g);
  const eyeGeo=new T.TorusGeometry(.175,.034,6,22),pupilGeo=new T.SphereGeometry(.1,10,8);
  for(const s of [-1,1]){
   const eye=mesh(g,eyeGeo,skin,'unblinking-unequal-eye',s*.34,.18,.868);
   eye.scale.set(s<0?1:1.18,s<0?.82:1.48,1);eye.rotation.z=s*.19;eyes.push(eye);
   const dot=mesh(g,pupilGeo,pupil,'independent-lifeless-pupil',s*.34,.17,.897);
   dot.scale.set(.65,.88,.23);eyes.push(dot);
  }
  const mouth=mesh(g,new T.TorusGeometry(.35,.025,5,28,Math.PI),scar,'too-wide-silent-smile',0,-.43,.84);
  mouth.scale.set(1.1,.65,.75);mouth.rotation.z=Math.PI;
  const toothGeo=new T.ConeGeometry(.037,.18,5);
  for(let i=0;i<9;i++){
   const x=(i-4)*.072;
   const t=mesh(g,toothGeo,pearl,'porcelain-teeth-'+i,x,-.49+Math.abs(i-4)*.016,.884);
   t.rotation.z=i%2?.18:-.18;t.rotation.x=Math.PI/8;teeth.push(t);
  }
  const tear=mesh(g,new T.PlaneGeometry(.043,.33),scar,'paint-soaked-flesh-tear',.47,-.12,.75);
  tear.rotation.z=.23;
 }
 face(head.group,'clown-original-face-anomaly');
 face(mount.group,'clown-enlarged-face-anomaly');
 // A moving split costume resembles black puppet limbs only in the silhouette;
 // these never extend the gameplay hurtboxes.
 const ragMat=new T.MeshStandardMaterial({color:0x351923,roughness:.98,side:T.DoubleSide,transparent:true,opacity:0});
 const twistGeo=new T.CylinderGeometry(.10,.04,2.1,6);
 for(let i=0;i<4;i++){
  const base=new T.Group();base.name='puppet-shadow-appendage';base.position.set((i-1.5)*.32,2.45,-.68);body.add(base);
  const strip=mesh(base,twistGeo,ragMat,'ribbon-not-a-collision-limb',0,-.76,-.47);
  strip.rotation.z=(i-1.5)*.39;strip.rotation.x=-.28;
  const tip=mesh(base,new T.ConeGeometry(.17,.62,5),skin,'bent-finger-silhouette',0,-1.76,-.65);
  tip.rotation.z=i%2?.28:-.22;
  fingers.push(base);
 }
 function update(g,time=0,reduced=false){
  const stage=g?.clown?.horrorStage||1,attack=g?.clown?.name||'',active=g?.status==='playing';
  const amount=!active?0:stage===3?1:stage===2?.61:.18;
  skin.opacity=.77*amount;scar.opacity=.83*amount;
  pupil.opacity=.65*amount;pearl.opacity=.94*amount;ragMat.opacity=.56*amount;
  const t=Number.isFinite(time)?time:0,evil=attack==='foldedCrawl'||attack==='livingShadow'||attack==='wrongTwin';
  for(let i=0;i<eyes.length;i++){
   const e=eyes[i];e.position.y=(i%2?.17:.18)+(!reduced?.014*Math.sin(t*(i%2?2.1:1.6)+i):0);
   if(i%2)e.position.x=(i<2?-.34:.34)+Math.sin(t*.9+i)*.014*amount;
  }
  for(let i=0;i<teeth.length;i++)teeth[i].rotation.z=(i%2?.18:-.18)+(reduced?0:Math.sin(t*3+i)*.08*amount);
  for(let i=0;i<fingers.length;i++){
   const f=fingers[i];f.rotation.z=(i-1.5)*.13+(evil?(i%2?.23:-.23):0)+(!reduced?Math.sin(t*1.4+i)*.12*amount:0);
   f.rotation.x=(stage===3?.24:.05)+(!reduced?Math.sin(t*.9+i)*.12*amount:0);
  }
  const twitch=evil&&!reduced?Math.sin(t*19)*.02*amount:0;
  for(const e of eyes.filter((_,i)=>i%2===0))e.rotation.z=twitch;
 }
 return {update,groupNames:groups.map(g=>g.name)};
}
