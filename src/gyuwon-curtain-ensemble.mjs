import {createCurtainBrawl,curtainBrawlAt} from './gyuwon-curtain-brawl.mjs';
import * as T from 'three';
import {buildBoss,poseLegs,posePlayer,swayCape} from './models.mjs';
import {createGame,swordPose,SWORD,patternConfig} from './combat.mjs';
import {createCurtainKwonSkin} from './gyuwon-curtain-kwon-skin.mjs';
import {createBossStance} from './boss-stance.mjs';
import {createClownGame} from './clown-combat.mjs';
import {createBloodGame} from './blood-combat.mjs';
import {createBloodSeraph} from './blood-seraph.mjs';
import {createGiantGyuwon} from './gyuwon-giant-actor.mjs';
import {buildGentlemanTorso,buildGentlemanHand} from './dice-giant-model.mjs';
import {gyuwonCurtainCallAt,GYUWON_CURTAIN_CAST} from './gyuwon-curtain-call.mjs';

const ease=x=>T.MathUtils.smoothstep(x,0,1);
// Original eight-count choreography. Every performer keeps their own rig and
// body mechanics, but shares the step/arm accents and faces the audience (+Z).
export function curtainDanceAt(time,index=0){
 const beat=time*(142/60),cycle=beat%16,step=Math.sin(beat*Math.PI),accent=Math.sin(beat*Math.PI*.5+index*.35);
 return {beat,step,sway:step*.07,lift:Math.max(0,Math.sin(beat*Math.PI))*.08,
  arm:cycle<4?.65+.45*accent:cycle<8?1.25+.3*step:cycle<12?.35+.8*Math.max(0,accent):1.7+.22*step,
  elbow:.38+.3*Math.max(0,-accent),turn:Math.sin(beat*Math.PI*.25)*.08,
  kick:cycle>=8&&cycle<12?Math.max(0,step)*.5:0};
}
function clonePlayer(source){
 const rig=source.rig.clone(true),map=new Map();
 function pair(a,b){map.set(a,b);a.children.forEach((c,i)=>pair(c,b.children[i]));}pair(source.rig,rig);
 const skeletons=[];for(const [a,b]of map)if(a.isSkinnedMesh){b.skeleton=new T.Skeleton(a.skeleton.bones.map(bone=>map.get(bone)),a.skeleton.boneInverses.map(m=>m.clone()));skeletons.push(b.skeleton);}
 const remap=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,map.get(v)]));
 return {...source,rig,skeletons,body:map.get(source.body),pivot:map.get(source.pivot),legs:remap(source.legs),arms:remap(source.arms),elbows:remap(source.elbows),weaponRigs:remap(source.weaponRigs),capeParts:source.capeParts.map(p=>map.get(p))};
}
export function createGyuwonCurtainEnsemble(scene,{party,player,gyuwon,coarse=false,reduced=false}){
 const root=new T.Group();root.name='curtain-call-connected-cast';root.visible=false;scene.add(root);
 const backdrop=new T.Mesh(new T.PlaneGeometry(50,25),new T.MeshBasicMaterial({color:0x18223e}));backdrop.position.set(0,10,-15);root.add(backdrop);
 const giant=createGiantGyuwon(root,gyuwon,{coarse});giant.root.visible=false;giant.root.scale.setScalar(.18);
 const halo=new T.Mesh(new T.TorusGeometry(1.4,.035,8,48),new T.MeshBasicMaterial({color:0xffce78}));root.add(halo);
 const kwon=buildBoss({coarse}),kwonSkin=createCurtainKwonSkin(kwon),stance=createBossStance(kwon),kwonRole=new T.Group();kwonRole.add(kwon.root);kwon.root.scale.setScalar(.53);root.add(kwonRole);
 const roles=[kwonRole,...party.roles.slice(1),gyuwon],cg=createClownGame('sword',{register:false}),bg=createBloodGame(),kg=createGame('sword',{register:false});
 const dancers=[player,...Array.from({length:3},()=>clonePlayer(player))];dancers.slice(1).forEach(p=>{p.rig.name='curtain-player-companion';root.add(p.rig);});
 const seraphContainer=new T.Group();seraphContainer.name='curtain-blood-third-phase';seraphContainer.scale.setScalar(.28);root.add(seraphContainer);
 const seraph=createBloodSeraph(seraphContainer,{coarse,reduced});
 const gentleman=new T.Group();gentleman.name='curtain-patron-second-and-third-phase';gentleman.scale.setScalar(.066);root.add(gentleman);
 const materials=Object.fromEntries(Object.entries({suit:0x312632,shirt:0xeee7d6,satin:0x1c1824,tie:0x9d293a,gold:0xc5a56c,skin:0xc9b395}).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:.6,metalness:k==='gold'?.65:.05})]));
 const torso=buildGentlemanTorso(T,materials,{coarse}).group;torso.position.y=44;gentleman.add(torso);
 const diceHead=party.actors[2].root.clone(true);diceHead.position.y=83;diceHead.scale.setScalar(3);gentleman.add(diceHead);
 const hands=[-1,1].map(side=>{const hand=buildGentlemanHand(T,materials,side,{coarse});hand.group.position.set(side*32,34,9);gentleman.add(hand.group);return hand;});
 const armGeo=new T.CylinderGeometry(5,6,1,coarse?10:18),arms=hands.map(()=>[0,1].map(()=>{const m=new T.Mesh(armGeo,materials.suit);gentleman.add(m);return m;}));
 const v=new T.Vector3(),u=new T.Vector3(),up=new T.Vector3(0,1,0);
 function link(mesh,a,b){v.fromArray(a);u.fromArray(b).sub(v);mesh.position.copy(v).addScaledVector(u,.5);mesh.scale.y=u.length();mesh.quaternion.setFromUnitVectors(up,u.normalize());}
 // Own only the newly built gentleman parts; the photo die shares resources
 // with the original guest actor and is disposed by that actor exactly once.
 const ownGeo=new Set(),ownMat=new Set();for(const node of [torso,...hands.map(h=>h.group),...arms.flat()])node.traverse(o=>{if(o.geometry)ownGeo.add(o.geometry);[].concat(o.material||[]).forEach(m=>ownMat.add(m));});
 const brawl=createCurtainBrawl(root,{roles,dancers,party,gentleman,seraphContainer,coarse,
  applyKwon(a,score){
   const b=kg.boss;b.phase=3;b.pattern='sweep';b.x=b.z=b.yaw=0;b.from=null;b.queue=[];
   const cfg=patternConfig(b),age=score.age;
   if(score.event.attacker===0){b.state=age<1.6?'idle':age<2.65?'windup':age<3.23?'active':'recovery';b.t=b.state==='windup'?a.wind*cfg.wind:b.state==='active'?(age-2.65)/.58*cfg.active:(age-3.23);b.recovery=1.7;}
   else{b.state='idle';b.t=0;}
   stance.update(b);const p=swordPose(b);kwon.swordGroup.position.set(p.x,p.y,p.z);kwon.swordGroup.rotation.set(p.pitch,p.yaw,0);
  },
  applyBlood(a,score,dt){
   bg.boss.phase=2;bg.boss.state='idle';bg.time=bg.blood.t=mTime;
   const pose={body:{lean:-a.wind*.15+a.strike*.2},arms:[{raise:a.wind*.9+a.guard*.8,open:.7},{raise:a.wind+a.strike*.7+a.guard*.8,open:.8}]};
   party.actors[3].regalia.update(bg,bg.blood,dt,.4,pose);
  }
 });
 let mTime=0;
 let disposed=false,frame=null;
 function update(g,dt=0){
  const m=g.gyuwon?.years?.musical,active=m?.year===11&&!m.finishing;
  root.visible=!!active;if(!active){if(frame){dancers.slice(1).forEach(p=>p.rig.visible=false);roles.slice(0,4).forEach(r=>r.visible=false);}brawl.update({time:-1,clock:{duration:180}});frame=null;return;}
  frame=m.curtainCall||gyuwonCurtainCallAt(m.time,m.clock?.duration);const t=m.time,d=curtainDanceAt(t),ensemble=frame.ensemble;
  const chaos=frame.mode==='credits'&&frame.creditsProgress<.90,beat=t*(142/60);mTime=t;const brawlFrame=curtainBrawlAt(t,m.clock?.duration||180);
  roles.slice(1,4).forEach(r=>{if(r.parent!==root)root.add(r);});
  roles.forEach((role,i)=>{
   const introduced=ensemble||i<=frame.actorIndex,focus=!ensemble&&i===frame.actorIndex;
   const exit=focus?ease((frame.local-.85)/.15):1,reunion=ensemble?1:frame.actorIndex===4?ease((frame.local-.85)/.15):0;
   const waiting=[-12,-7,7,12,11][i],slot=T.MathUtils.lerp(waiting,-11+i*5.5,reunion);
   role.visible=introduced;role.position.set(focus?slot*exit:slot,.15+(ensemble?d.lift:0),focus?-5-3*exit:-8);
   role.rotation.set(0,d.turn,ensemble?d.sway:Math.sin(t*2+i)*.025);

   const phase=ensemble?(i===2?1:i===3?2:i===1?2:3):focus?frame.phase:GYUWON_CURTAIN_CAST[i].scenes.at(-1).phase;
   if(i===0){const b=kg.boss;b.phase=phase;b.state=focus&&phase>1&&frame.beat<.6?'transition':'idle';b.t=b.state==='transition'?frame.beat/.6*5.2:t;b.x=b.z=b.yaw=0;
    poseLegs(kwon.legs,t*5,ensemble?2.4:.5);stance.update(b);
    const p=swordPose(b);if(phase===3&&kwon.swordGroup.parent!==kwon.root)kwon.root.add(kwon.swordGroup);else if(phase!==3&&kwon.swordGroup.parent!==kwon.model)kwon.model.add(kwon.swordGroup);
    kwon.swordGroup.position.set(p.x,p.y,p.z);kwon.swordGroup.rotation.set(p.pitch,p.yaw,ensemble?d.sway:0);
    const scale=p.length/SWORD.length;kwon.swordGroup.scale.set(1+(scale-1)*.58,1+(scale-1)*.58,scale);
   }else if(i===1){cg.time=t;cg.boss.phase=phase;cg.boss.x=cg.boss.z=cg.boss.yaw=0;cg.boss.state='clown';cg.clown.time=t;cg.clown.state='idle';cg.clown.curtainAttack=chaos?brawlFrame.actors[1]:null;cg.clown.curtainDance={arm:d.arm,step:d.step};party.actors[1].update(cg,dt);
   }else if(i===2){
    party.actors[2].root.visible=phase===1;party.actors[2].root.rotation.set(.08*Math.sin(t),-Math.PI/2+Math.sin(t)*.12,d.sway);party.actors[2].root.position.y=2.15+d.lift;
    gentleman.visible=introduced&&phase>=2;gentleman.position.copy(role.position);gentleman.rotation.set(phase===3?-.13:0,d.turn,d.sway);diceHead.rotation.set(.06*Math.sin(t*2),-Math.PI/2+Math.sin(t)*.12,phase===3?d.step*.15:0);
    hands.forEach((h,k)=>{const s=k?1:-1,a=ensemble?d.arm:.5+.3*Math.sin(t*2+k);h.group.position.set(s*(31+5*Math.sin(t*2)),35+12*a,12);h.group.rotation.set(-.6-a*.3,0,s*.3);h.fingers.flat().forEach(j=>j.rotation.x=phase===3?-.8:-.25);const shoulder=[s*22,63,0],elbow=[s*39,50,3],wrist=h.group.position.toArray();link(arms[k][0],shoulder,elbow);link(arms[k][1],elbow,wrist);});
   }else if(i===3){
    const source=party.actors[3];source.root.visible=phase<3;bg.time=t;bg.boss.phase=phase;bg.boss.state='idle';bg.boss.x=bg.boss.z=bg.boss.yaw=0;bg.player.x=0;bg.player.z=15;bg.blood.veins=phase>=2?1:0;bg.blood.t=t;
    const pose={body:{lean:d.sway},arms:[{raise:d.arm*.65,open:.6},{raise:d.arm*.7,open:.8}]};source.regalia.update(bg,bg.blood,dt,.4,pose);source.head.update(bg,bg.blood,dt,{cast:.4,pose});
    role.children.filter(c=>c.name==='party-blood-ultimate-wing').forEach((w,k)=>{w.visible=phase===2;w.rotation.y=(k?1:-1)*(.35+.15*Math.sin(t*2));});
    seraphContainer.visible=introduced&&phase===3;seraphContainer.position.copy(role.position);seraphContainer.rotation.z=d.sway*.5;if(phase===3)seraph.update(bg,{},dt);
   }else{
    role.scale.setScalar(1.12);
    const large=focus&&phase===3;role.visible=introduced&&!large;
    giant.root.visible=introduced&&large;giant.root.position.copy(role.position);giant.root.position.z+=4.5;
    giant.mask.visible=false;giant.waist.rotation.set(-d.arm*.035,d.turn,d.sway);
    giant.head.rotation.set(0,d.turn,d.sway*.5);
    giant.root.updateWorldMatrix(true,true);
    giant.arms.forEach(a=>{a.shoulder.set(a.side*.64,.63,0).applyMatrix4(giant.torso.matrixWorld);giant.root.worldToLocal(a.shoulder);a.hand.position.set(a.side*(11+Math.abs(d.step)*2),12+d.arm*5,-19);const elbow=a.shoulder.clone().lerp(a.hand.position,.5);elbow.x+=a.side*4;link(a.sleeve,a.shoulder.toArray(),elbow.toArray());a.sleeve.scale.x=1.8;a.sleeve.scale.z=1.5;link(a.forearm,elbow.toArray(),a.hand.position.toArray());a.forearm.scale.x=1.35;a.forearm.scale.z=1.1;a.elbow.position.copy(elbow);a.elbow.scale.setScalar(1.8);a.hand.rotation.set(-.3,0,a.side*d.sway);a.digits.flat().forEach(j=>j.rotation.x=-d.elbow*.5);});
    halo.visible=introduced&&focus&&phase===2;halo.position.copy(role.position);halo.position.y+=4.25;halo.rotation.z=t*.3;
    const book=role.getObjectByName('gyuwon-book-cover')?.parent;if(book)book.visible=focus&&phase===1;
    for(const [side,name] of [[-1,'gyuwon-left-shoulder-rig'],[1,'gyuwon-right-shoulder-rig']]){const arm=role.getObjectByName(name);if(arm){arm.rotation.set(-d.arm*.55,0,side*d.arm*.6);const elbow=arm.getObjectByName('gyuwon-elbow-pivot');if(elbow)elbow.rotation.x=-d.elbow;}}
   }
  });
  dancers.forEach((p,i)=>{p.rig.visible=true;const q=curtainDanceAt(t,i),spread=ensemble?1:frame.actorIndex===4?.48+.52*ease((frame.local-.85)/.15):.48;
   p.rig.position.set((-9+i*6)*spread+q.step*.16+(chaos?Math.sin(beat*1.1+i)*.52:0),.12+q.lift,ensemble?2:4.2);p.rig.rotation.set(0,q.turn,q.sway);p.rig.scale.setScalar(1.3);
   const walk=posePlayer(p,q.beat*Math.PI,ensemble?2.7:1);p.body.position.y=1+walk.bob;p.body.rotation.x=0;p.pivot.rotation.x=0;
   for(const [k,s] of [['L',-1],['R',1]]){p.arms[k].rotation.set(-q.arm*.55-(chaos&&k==='R'?Math.sin(beat*3+i)*.7:0),0,s*q.arm*.6);p.elbows[k].rotation.x=-q.elbow;p.legs[k].rotation.x+=q.kick*(s===1?1:-1);}
   Object.entries(p.weaponRigs).forEach(([type,rig])=>{rig.visible=ensemble&&type===['sword','hammer','bow','cards'][i];});swayCape(p,t,2);
  });
  if(ensemble)brawl.update(m,dt);else brawl.update({time:-1,clock:{duration:180}});
 }
 function stats(){return {active:!!frame,mode:frame?.mode,actorIndex:frame?.actorIndex,phase:frame?.phase,bosses:frame?(frame.ensemble?5:frame.actorIndex+1):0,players:frame?4:0,facingCamera:!!frame&&dancers.every(p=>Math.cos(p.rig.rotation.y)>.98),source:'original-boss-rigs',brawl:brawl.stats(),seraph:seraph.stats().visible};}
 return {root,update,stats,async prewarm(renderer,camera){await Promise.all([party.ready,kwonSkin.ready]);const previous=root.visible;root.visible=true;const visibility=[seraphContainer,seraph.root,gentleman,giant.root].map(o=>[o,o.visible]);visibility.forEach(([o])=>o.visible=true);try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);}finally{root.visible=previous;visibility.forEach(([o,visible])=>o.visible=visible);}},dispose(){if(disposed)return;disposed=true;kwonSkin.dispose();stance.dispose();seraph.dispose();giant.dispose();brawl.dispose();backdrop.geometry.dispose();backdrop.material.dispose();halo.geometry.dispose();halo.material.dispose();root.removeFromParent();dancers.slice(1).forEach(p=>{p.skeletons.forEach(s=>s.dispose());p.rig.removeFromParent();});const geos=new Set(),mats=new Set();kwon.root.traverse(o=>{if(o.geometry)geos.add(o.geometry);[].concat(o.material||[]).forEach(m=>mats.add(m));});geos.forEach(g=>g.dispose());const textures=new Set();mats.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});textures.forEach(t=>t.dispose());ownGeo.forEach(g=>g.dispose());ownMat.forEach(m=>m.dispose());}};
}
