import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {DICE_RULES as R,DICE_BOARD} from './dice-data.mjs';
import {DICE_PHOTO_FACE,DICE_PHOTO_PATH,fitDicePhoto} from './dice-photo-data.mjs';
import {DICE_HELL_STYLE as H,diceCrackPaths,diceTelegraphView} from './dice-visual-data.mjs';
import {buildDiceDecorations,buildDiceFire} from './dice-decoration-renderer.mjs';
import {buildGroundSpikeVisuals} from './dice-ground-spikes.mjs';
import {squareDiscArgs} from './dice-square.mjs';
import {frenzyShake} from './dice-frenzy-windup.mjs';
import {buildDiceArmor,DICE_ARMOR_STYLE} from './dice-armor.mjs';
import {diceMotion} from './dice-motion-data.mjs';
import {CASINO_COLORS,feltIndex,gridLines,chipStacks,pillars} from './casino-data.mjs';
import {createAmbientField,stepAmbientField} from './atmosphere-data.mjs';
import {buildCasinoRoom} from './casino-room.mjs';
export function createDiceActor(){
 return runThreeStartup(THREE,(THREE,own)=>{
const root=new THREE.Group();root.name='park-sungwon-dice';const e=R.edge,box=new THREE.BoxGeometry(e,e,e),iron=new THREE.MeshStandardMaterial({color:DICE_ARMOR_STYLE.black,roughness:.42,metalness:.65}),photoMaterial=new THREE.MeshStandardMaterial({color:0xd5c6ac,roughness:.8,metalness:0}),materials=Array.from({length:6},(_,i)=>i===DICE_PHOTO_FACE?photoMaterial:iron),die=new THREE.Mesh(box,materials);die.castShadow=die.receiveShadow=true;root.add(die);buildDiceArmor(THREE,root,e);
 const decorations=buildDiceDecorations(THREE,root,e,H),fire=own(buildDiceFire(THREE,root,e));
 const crackMaterial=new THREE.LineBasicMaterial({color:0x9d1727});for(const path of diceCrackPaths(e,DICE_PHOTO_FACE)){const geo=new THREE.BufferGeometry().setFromPoints(path.points.map(p=>new THREE.Vector3(...p)));root.add(new THREE.Line(geo,crackMaterial));}
 let texture=null,disposed=false,image=null,finishReady=()=>{};
 const upAxis=new THREE.Vector3(),invRotation=new THREE.Quaternion();
 const ready=new Promise(resolve=>{finishReady=ok=>{if(image)image.onload=image.onerror=null;image=null;resolve(ok);};try{image=new Image();image.onload=()=>{if(disposed){finishReady(false);return;}try{const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),r=fitDicePhoto(image.naturalWidth,image.naturalHeight);ctx.fillStyle='#201a17';ctx.fillRect(0,0,512,512);ctx.drawImage(image,r.x,r.y,r.width,r.height);texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;photoMaterial.map=texture;photoMaterial.color.setHex(0xffffff);photoMaterial.needsUpdate=true;decorations.setPortrait(texture);finishReady(true);}catch(error){console.warn('Sungwon dice photo unavailable',error);finishReady(false);}};image.onerror=()=>finishReady(false);image.src=new URL(DICE_PHOTO_PATH,import.meta.url).href;}catch{finishReady(false);}});
 return {root,ready,update(g){const p=g.dice.pose,time=Number.isFinite(g.time)?g.time:0,shake=frenzyShake(g.dice),m=diceMotion(g.dice,time),jitter=Math.sin(time*57)*m.shake;root.quaternion.set(...p.rotation);if(m.sy===1&&m.sxz===1)root.scale.set(1,1,1);else{upAxis.set(0,1,0).applyQuaternion(invRotation.copy(root.quaternion).invert());const ax=Math.abs(upAxis.x)>Math.abs(upAxis.y)&&Math.abs(upAxis.x)>Math.abs(upAxis.z)?0:Math.abs(upAxis.z)>Math.abs(upAxis.y)?2:1,s=[m.sxz,m.sxz,m.sxz];s[ax]=m.sy;root.scale.set(s[0],s[1],s[2]);}root.position.set(p.x+shake.x+jitter,p.y-(1-m.sy)*e/2,p.z+shake.z);decorations.update(time);fire.update(time);iron.color.setHex(g.dice.blockFlash>0?0x6e3a22:DICE_ARMOR_STYLE.black);iron.emissive.setRGB(m.glow*.9,m.glow*.15,m.glow*.05);},dispose(){if(disposed)return;disposed=true;finishReady(false);fire.dispose();const geometries=new Set(),mats=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});texture?.dispose();for(const g of geometries)g.dispose();for(const m of mats)m.dispose();}};

 });
}
function carpetTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#14060a';g.fillRect(0,0,128,128);g.strokeStyle='rgba(212,168,59,.22)';g.lineWidth=2;g.beginPath();g.moveTo(64,6);g.lineTo(122,64);g.lineTo(64,122);g.lineTo(6,64);g.closePath();g.stroke();g.fillStyle='rgba(212,168,59,.3)';g.beginPath();g.arc(64,64,4,0,Math.PI*2);g.fill();const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(36,36);t.colorSpace=THREE.SRGBColorSpace;return t;}
function sparkTexture(){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'#ffffffff');gr.addColorStop(.4,'#ffffffaa');gr.addColorStop(1,'#ffffff00');g.fillStyle=gr;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);}
export function buildDiceBoard(scene){
 return runThreeStartup(THREE,(THREE,own)=>{
const root=new THREE.Group();root.name='lava-property-board';scene.add(root);const groundSpikes=buildGroundSpikeVisuals(THREE,root),coarse=Boolean(globalThis.matchMedia?.('(pointer:coarse)').matches),C=CASINO_COLORS;
 const room=buildCasinoRoom(THREE,root,{coarse,reduced:Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)});
 if(scene.background&&scene.background.setHex)scene.background.setHex(C.sky);
 if(scene.fog){scene.fog.color.setHex(C.fog);scene.fog.near=130;scene.fog.far=300;}
 scene.traverse(o=>{if(o.isHemisphereLight){o.color.setHex(0xffe3c4);o.groundColor.setHex(0x2a0c18);o.intensity=1.5;}else if(o.isDirectionalLight)o.color.setHex(0xfff1da);});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(420,420).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:carpetTexture(),color:0xffffff,roughness:.95}));floor.position.y=-1.4;floor.receiveShadow=true;root.add(floor);
 const rim=new THREE.Mesh(new THREE.BoxGeometry(135,1.2,135),new THREE.MeshStandardMaterial({color:C.rim,roughness:.7,metalness:.15}));rim.position.y=-.62;rim.receiveShadow=true;root.add(rim);
 const m4=new THREE.Matrix4(),col=new THREE.Color(),felt=new THREE.InstancedMesh(new THREE.BoxGeometry(R.edge-.1,1.2,R.edge-.1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),DICE_BOARD.length);
 DICE_BOARD.forEach((t,i)=>{m4.makeTranslation(t.x,-.6,t.z);felt.setMatrixAt(i,m4);felt.setColorAt(i,col.setHex(C.felt[feltIndex(Math.floor(i/R.side),i%R.side)]));});
 felt.instanceMatrix.needsUpdate=true;felt.instanceColor.needsUpdate=true;felt.receiveShadow=true;root.add(felt);
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(gridLines(),3));const lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:C.gold}));lines.position.y=.05;root.add(lines);
 const goldMat=new THREE.MeshStandardMaterial({color:C.gold,roughness:.35,metalness:.7});
 for(const t of DICE_BOARD)if(t.corner){const mark=new THREE.Mesh(new THREE.RingGeometry(1,1.4,4).rotateX(-Math.PI/2),goldMat);mark.position.set(t.x,.06,t.z);root.add(mark);}
 const ringMat=new THREE.MeshBasicMaterial({color:0xffffff}),pl=pillars(coarse?8:12),pillarMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(3,3.4,1,14),new THREE.MeshStandardMaterial({color:0x2b1410,roughness:.6,metalness:.2}),pl.length),ringMesh=new THREE.InstancedMesh(new THREE.TorusGeometry(3.6,.32,8,24).rotateX(Math.PI/2),ringMat,pl.length*3);
 pl.forEach((p,i)=>{m4.makeScale(1,p.height,1).setPosition(p.x,p.height/2-1.4,p.z);pillarMesh.setMatrixAt(i,m4);for(let k=0;k<3;k++){m4.makeTranslation(p.x,5+k*8,p.z);ringMesh.setMatrixAt(i*3+k,m4);ringMesh.setColorAt(i*3+k,col.setHex(C.neon[(i+k)%2]));}});
 pillarMesh.instanceMatrix.needsUpdate=true;ringMesh.instanceMatrix.needsUpdate=true;ringMesh.instanceColor.needsUpdate=true;pillarMesh.castShadow=true;root.add(pillarMesh,ringMesh);
 const cs=chipStacks(coarse?16:28),chipMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(2.2,2.2,1,16),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5,metalness:.1}),cs.length);
 cs.forEach((c,i)=>{m4.makeScale(1,c.height,1).setPosition(c.x,c.height/2-1.4,c.z);chipMesh.setMatrixAt(i,m4);chipMesh.setColorAt(i,col.setHex(C.chips[c.color]));});
 chipMesh.instanceMatrix.needsUpdate=true;chipMesh.instanceColor.needsUpdate=true;chipMesh.castShadow=true;root.add(chipMesh);
 const lights=[];for(let i=0;i<(coarse?2:4);i++){const L=new THREE.PointLight(C.neon[i%2],coarse?3500:5000,220,2);L.position.set(i<2?-110:110,26,i%2?-110:110);L.userData.base=L.intensity;root.add(L);lights.push(L);}
 const sparkN=coarse?40:100,field=createAmbientField({count:sparkN,radius:80}),sGeo=new THREE.BufferGeometry(),sPos=new Float32Array(sparkN*3),sCol=new Float32Array(sparkN*3);
 sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));sGeo.setAttribute('color',new THREE.BufferAttribute(sCol,3));
 const sparks=new THREE.Points(sGeo,new THREE.PointsMaterial({size:.7,map:sparkTexture(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sparks.frustumCulled=false;root.add(sparks);
 const mood={a:[1,.85,.4],b:[1,.35,.65],rise:.35,sway:.7,speed:1,alpha:.9};let lastT=null;
 function updateSparks(g){const t=Number.isFinite(g.time)?g.time:0,dt=lastT===null?0:t-lastT;lastT=t;stepAmbientField(field,dt,t,mood);for(let i=0;i<field.particles.length;i++){const q=field.particles[i];sPos[i*3]=q.x;sPos[i*3+1]=q.y+1;sPos[i*3+2]=q.z;for(let j=0;j<3;j++)sCol[i*3+j]=(mood.a[j]*(1-q.tint)+mood.b[j]*q.tint)*q.alpha;}sGeo.attributes.position.needsUpdate=true;sGeo.attributes.color.needsUpdate=true;}
 function updateNeon(g){const t=Number.isFinite(g.time)?g.time:0;ringMat.color.setScalar(.75+.25*Math.sin(t*2.2));lights.forEach((L,i)=>{L.intensity=L.userData.base*(1+.12*Math.sin(t*3.1+i*1.7));});}
 const warning=new THREE.Mesh(new THREE.PlaneGeometry(R.tileWidth-.4,R.tileWidth-.4).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffdf75,transparent:true,opacity:.35,depthWrite:false}));warning.position.y=.07;root.add(warning);
 const dangerMaterial=new THREE.MeshBasicMaterial({color:0xff4018,transparent:true,opacity:.45,depthWrite:false}),lane=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),dangerMaterial),circle=new THREE.Mesh(new THREE.CircleGeometry(...squareDiscArgs(1)).rotateX(-Math.PI/2),dangerMaterial);lane.visible=circle.visible=false;root.add(lane,circle);
 const pipGeo=new THREE.PlaneGeometry(R.edge-.6,R.edge-.6).rotateX(-Math.PI/2),dotGeo=new THREE.CircleGeometry(1.6,20).rotateX(-Math.PI/2),pipTiles=[],pipDots=[];
 for(let i=0;i<6;i++){const m=new THREE.Mesh(pipGeo,new THREE.MeshBasicMaterial({color:0xff3b1d,transparent:true,opacity:0,depthWrite:false})),dot=new THREE.Mesh(dotGeo,new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:0,depthWrite:false}));m.visible=dot.visible=false;root.add(m,dot);pipTiles.push(m);pipDots.push(dot);}
 function updatePips(g){const pp=g.dice.pips,time=Number.isFinite(g.time)?g.time:0;for(let i=0;i<6;i++){const m=pipTiles[i],dot=pipDots[i];if(!pp||i>=pp.tiles.length){m.visible=dot.visible=false;continue;}const t=DICE_BOARD[pp.tiles[i]],f=pp.flash>0?Math.min(1,pp.flash/.4):0,prog=g.dice.state==='pip-warning'?Math.min(1,g.dice.t/pp.warn):1;m.visible=dot.visible=true;m.position.set(t.x,.1,t.z);dot.position.set(t.x,.12,t.z);m.material.color.setHex(f>0?0xffd27a:0xff3b1d);m.material.opacity=f>0?.25+.65*f:.18+.4*prog+.08*Math.sin(time*18);dot.material.opacity=f>0?f:.55+.45*prog;dot.scale.setScalar(f>0?1+.6*(1-f):.8+.4*prog);}}
 return {root,update(g){room.update(g.time);groundSpikes.update(g);updatePips(g);updateNeon(g);updateSparks(g);warning.visible=g.status==='playing'&&g.dice.state==='warning';warning.position.x=g.dice.to.x;warning.position.z=g.dice.to.z;warning.material.opacity=.2+.35*Math.min(1,g.dice.t/R.warning);const v=diceTelegraphView(g,R.edge,R.playerRadius);lane.visible=v?.kind==='line';circle.visible=v?.kind==='circle';if(!v)return;dangerMaterial.opacity=v.opacity;if(lane.visible){lane.position.set(v.x,.09,v.z);lane.rotation.y=v.yaw;lane.scale.set(v.width,1,v.length);}if(circle.visible){circle.position.set(v.x,.09,v.z);circle.scale.set(v.radius,1,v.radius);}}};

 });
}
