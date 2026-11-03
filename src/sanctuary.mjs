export function sanctuaryPose(phase=1,elapsed=0,dead=false){
 const t=Math.min(1,Math.max(0,elapsed/2.8));return {gold:phase===2?t:0,fall:phase===2?t*t:0,silence:dead?1:0};
}
// All decoration stays outside the existing playable circle. Resources belong to the parent scene.
export function buildSanctuary(THREE,parent){
 const root=new THREE.Group();root.name='broken-sword-sanctuary';root.userData.decorativeOnly=true;parent.add(root);
 const stone=new THREE.MeshStandardMaterial({color:0x70757b,roughness:1}),steel=new THREE.MeshStandardMaterial({color:0xb5c2cb,metalness:.65,roughness:.5}),gold=new THREE.MeshBasicMaterial({color:0xd9b76c,transparent:true,opacity:0});
 const box=new THREE.BoxGeometry(1,1,1),heads=[],swords=[];
 function block(group,x,y,z,w,h,d,mat=stone){const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;group.add(m);return m;}
 for(let i=0;i<10;i++){
  const a=i*Math.PI/5,r=28,g=new THREE.Group();g.position.set(Math.sin(a)*r,0,Math.cos(a)*r);g.rotation.y=a+Math.PI;root.add(g);
  block(g,0,.5,0,3,1,2.8);block(g,0,2.8,0,1.2,3.7,.9);block(g,0,4.3,0,2.1,.7,1);block(g,-.7,2.9,.5,.5,2,.6);block(g,.7,2.9,.5,.5,2,.6);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.57,10,8),stone);head.position.set(0,5.25,0);g.add(head);heads.push(head);
  const sword=new THREE.Group();sword.position.set(.3,.8,1.4);sword.rotation.z=(i%3-1)*.16;g.add(sword);block(sword,0,1.8,0,.16,3.2,.08,steel);block(sword,0,3.5,0,1,.12,.15,steel);block(sword,0,3.8,0,.16,.6,.12,steel);swords.push(sword);
  const pillar=new THREE.Group();pillar.position.set(Math.sin(a+.2)*34,0,Math.cos(a+.2)*34);root.add(pillar);block(pillar,0,6,0,2,12,2);block(pillar,0,12,0,3,.8,3);
  // Ruined ceiling ribs leave the central sky open to moonlight.
  if(i%3!==0){const rib=new THREE.Mesh(new THREE.TorusGeometry(32,.35,6,36,Math.PI*.28),stone);rib.position.y=12;rib.rotation.set(Math.PI/2,0,a);root.add(rib);}
 }
 const fissures=new THREE.Group();root.add(fissures);for(let i=0;i<16;i++){const a=i*Math.PI/8;const line=block(fissures,Math.sin(a)*15,.025,Math.cos(a)*15,.035,.015,5+(i%3)*2,gold);line.rotation.y=a;}
 let elapsed=0,lastPhase=1;
 return {update(game,dt){const b=game.boss;if(b.phase!==lastPhase){elapsed=0;lastPhase=b.phase;}if(game.time<.1&&b.phase===1)elapsed=0;elapsed+=Math.max(0,dt);const p=sanctuaryPose(b.phase,elapsed,b.state==='dead');gold.opacity=.65*p.gold*(p.silence?.2:1);
  heads.forEach((h,i)=>{const f=Math.max(0,Math.min(1,p.fall*2-i*.08));h.position.set(f*.8,5.25-4.8*f*f,f*.7);h.rotation.z=f*1.7;});
  swords.forEach((s,i)=>{s.rotation.z=p.silence?(i%2?1:-1)*1.2:(i%3-1)*.16+Math.sin(elapsed*18+i)*p.gold*.018;});
  if(b.phase===1){heads.forEach(h=>{h.position.set(0,5.25,0);h.rotation.z=0;});}
  return p;
 }};
}
