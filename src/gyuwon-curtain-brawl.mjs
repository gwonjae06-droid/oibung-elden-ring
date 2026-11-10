import * as T from 'three';
import {bloodVolumetricWaveGeometry} from './blood-volumetric-wave.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,q)=>a+(b-a)*q;
const HOME=[[-11,-8],[-5.5,-8],[0,-8],[5.5,-8],[11,-8],[-9,2],[-3,2],[3,2],[9,2]].map(([x,z])=>[x*.82-1.5,z]);
// One foreground incident at a time. Every miss, collateral hit and counter
// is authored on the original credit clock, never on elapsed render frames.
export const CURTAIN_BRAWL_SCORE=Object.freeze([
 {attacker:0,target:5,collateral:1,kind:'sword',response:'roll'},
 {attacker:1,target:2,kind:'mallet',response:'hit'},
 {attacker:2,target:3,kind:'die',response:'guard'},
 {attacker:3,target:6,collateral:4,kind:'wave',response:'jump'},
 {attacker:4,target:1,kind:'pages',response:'swat'},
 {attacker:5,target:0,kind:'sword',response:'guard'},
 {attacker:6,target:2,kind:'hammer',response:'roll'},
 {attacker:7,target:3,collateral:4,kind:'arrow',response:'sidestep'},
 {attacker:8,target:1,kind:'cards',response:'duck'},
 {attacker:1,target:5,kind:'mallet',response:'parry'},
 {attacker:3,target:0,kind:'wave',response:'guard'}
].map(Object.freeze));
export function curtainBrawlAt(time,duration=180){
 const start=duration*.55,progress=(time-start)/(duration*.45),local=Math.max(0,time-start);
 const weight=time<start?0:ease(local/.75)*(1-ease((progress-.80)/.10));
 const index=Math.floor(local/5.8)%CURTAIN_BRAWL_SCORE.length,event=CURTAIN_BRAWL_SCORE[index],age=local%5.8;
 const actors=HOME.map(([x,z])=>({x,z,y:.15,yaw:0,wind:0,strike:0,recoil:0,guard:0,dodge:0,roll:0,step:0}));
 const from=HOME[event.attacker],to=HOME[event.target],dx=to[0]-from[0],dz=to[1]-from[1],length=Math.hypot(dx,dz),nx=dx/length,nz=dz/length;
 const ranged=['wave','pages','arrow','cards'].includes(event.kind),reach=event.kind==='sword'&&event.attacker===0?5.1:3.2;
 const approach=ease(age/1.6)*(1-ease((age-4.1)/1.7)),wind=ease((age-1.6)/1.05)*(1-ease((age-2.65)/.45));
 const attack=ease((age-2.65)/.58)*(1-ease((age-3.45)/.85));
 const attacker=actors[event.attacker],target=actors[event.target];
 attacker.x+=nx*Math.max(0,length-(ranged?8:reach))*approach;
 attacker.z+=nz*Math.max(0,length-(ranged?8:reach))*approach;
 const facing=ease(age/.65)*(1-ease((age-4.1)/1.7));
 attacker.yaw=Math.atan2(nx,nz)*facing;attacker.wind=wind;attacker.strike=attack;attacker.step=Math.sin(Math.PI*clamp(age/1.6))+Math.sin(Math.PI*clamp((age-4.1)/1.7));attacker.kind=event.kind;
 target.yaw=Math.atan2(-nx,-nz)*facing;
 const avoid=['roll','jump','sidestep','duck','swat'].includes(event.response);
 const dodge=ease((age-2.12)/.75)*(1-ease((age-3.65)/1.4));
 target.dodge=avoid?dodge:0;target.guard=avoid?0:ease((age-2)/.7)*(1-ease((age-3.55)/1));
 if(event.response==='roll'||event.response==='sidestep'){target.x+=nz*3*dodge;target.z-=nx*3*dodge;target.roll=event.response==='roll'?ease((age-2.12)/1.2):0;}
 if(event.response==='jump')target.y+=Math.sin(Math.PI*clamp((age-2.25)/1.55))*3.3;
 if(event.response==='duck')target.duck=dodge;
 if(event.response==='swat'){target.wind=dodge;target.strike=Math.sin(Math.PI*clamp((age-2.6)/1.0));}
 const contact=3.23,impact=Math.sin(Math.PI*clamp((age-contact)/.75));
 if(!avoid)target.recoil=impact*(event.response==='hit'?1:.35);
 let struck=event.target;
 if(event.collateral!==undefined){
  const collateral=actors[event.collateral],walk=ease((age-.6)/1.45)*(1-ease((age-4)/1.8));
  collateral.x=mix(collateral.x,to[0],walk);collateral.z=mix(collateral.z,to[1],walk);
  collateral.step=Math.sin(Math.PI*clamp((age-.6)/1.45))+Math.sin(Math.PI*clamp((age-4)/1.8));collateral.yaw=Math.atan2(-nx,-nz)*facing;collateral.recoil=impact;
  collateral.x+=nx*1.3*impact;collateral.z+=nz*1.3*impact;struck=event.collateral;
 }else if(!avoid){target.x+=nx*.65*impact;target.z+=nz*.65*impact;}
 // A parried blow returns along the attacking arm, followed by recovery.
 if(event.response==='parry')attacker.recoil=impact;
 const launch=[attacker.x,attacker.y+2.4,attacker.z],hit=[to[0],2.2,to[1]];
 const flight=clamp((age-2.65)/(contact-2.65));
 return {weight,index,event,age,actors,launch,hit,flight,impact:age>=contact?impact:0,struck,contact:age>=contact&&age<contact+.2};
}
export function createCurtainBrawl(root,{roles,dancers,party,gentleman,seraphContainer,applyKwon,applyBlood,coarse=false}){
 const props=new T.Group();props.name='curtain-physical-patterns';root.add(props);
 const geos=new Set(),mats=new Set(),geo=g=>(geos.add(g),g),mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.65,...extra});mats.add(m);return m;};
 const steel=mat(0x8d9da5,{metalness:.75,roughness:.3}),wood=mat(0x5c4234),paper=mat(0xd9d0b5),blood=mat(0x8b1734,{roughness:.22,metalness:.15}),card=mat(0xd0a66b);
 const add=(p,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const hammer=new T.Group();hammer.name='curtain-clown-physical-mallet';props.add(hammer);
 add(hammer,geo(new T.CylinderGeometry(.08,.11,2,12)),wood,'clown-mallet-handle').position.y=.85;
 add(hammer,geo(new T.CylinderGeometry(.43,.43,1.1,20)),wood,'clown-mallet-head').rotation.z=Math.PI/2;
 hammer.children[1].position.y=1.9;
 const wave=add(props,geo(bloodVolumetricWaveGeometry(coarse?14:22)),blood,'curtain-original-blood-crest');
 const sheets=Array.from({length:12},()=>add(props,geo(new T.BoxGeometry(.35,.48,.018)),paper,'curtain-thrown-answer-sheet'));
 const arrows=Array.from({length:3},()=>{const p=new T.Group();props.add(p);add(p,geo(new T.CylinderGeometry(.025,.025,1.3,7)),wood,'curtain-physical-arrow-shaft').rotation.x=Math.PI/2;const tip=add(p,geo(new T.ConeGeometry(.09,.25,5)),steel,'curtain-arrowhead');tip.rotation.x=Math.PI/2;tip.position.z=.74;return p;});
 const cards=Array.from({length:5},()=>add(props,geo(new T.BoxGeometry(.30,.46,.025)),card,'curtain-thrown-card'));
 const book=new T.Group();book.name='curtain-gyuwon-handheld-book';props.add(book);
 add(book,geo(new T.BoxGeometry(.8,.12,.65)),paper,'curtain-open-book-pages');
 const cover=add(book,geo(new T.BoxGeometry(.84,.035,.69)),wood,'curtain-book-cover');cover.position.y=-.07;
 const sparkGeo=geo(new T.BoxGeometry(.025,.025,.15)),sparks=Array.from({length:6},()=>add(props,sparkGeo,steel,'curtain-contact-chip'));
 const world=new T.Vector3(),direction=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3();
 let state=null;
 function update(m,dt=0){
  state=curtainBrawlAt(m.time,m.clock?.duration||180);const w=state.weight;props.visible=w>.001;if(w<=.001)return;
  const {event,actors,age}=state;
  // The dice uses its original rolling body, while Blood keeps the original
  // articulated arms and wings. All wrappers face their current counterpart.
  roles.forEach((node,i)=>{
   const a=actors[i];node.position.lerp(world.set(a.x,a.y,a.z),w);node.rotation.y=T.MathUtils.lerp(node.rotation.y,a.yaw,w);
   node.rotation.z+=a.recoil*.30*w;node.rotation.x+=(-a.wind*.10+a.strike*.16)*w;
   if(i===2){gentleman.visible=false;party.actors[2].root.visible=true;const die=party.actors[2].root;
    die.rotation.x=(event.attacker===2?Math.PI*4*ease((age-1.6)/1.63)*(1-ease((age-4)/1.8)):a.recoil*4)*w;
    if(event.attacker===2){const roll=ease((age-1.6)/1.63)*(1-ease((age-3.8)/2));node.position.x=mix(node.position.x,state.hit[0]-.6,roll*w);node.position.z=mix(node.position.z,state.hit[2],roll*w);}
   }
   if(i===4){for(const [side,name]of [[-1,'gyuwon-left-shoulder-rig'],[1,'gyuwon-right-shoulder-rig']]){const arm=node.getObjectByName(name);if(arm){arm.rotation.set(-.15-a.wind*1.1-a.strike*.6,0,side*(.08+a.strike*.18));const elbow=arm.getObjectByName('gyuwon-elbow-pivot');if(elbow)elbow.rotation.x=-.3-a.wind*.8;}}}
  });
  applyKwon(actors[0],state);applyBlood(actors[3],state,dt);seraphContainer.visible=false;
  dancers.forEach((p,i)=>{const a=actors[i+5];p.rig.position.lerp(world.set(a.x,a.y,a.z),w);p.rig.rotation.set(-a.duck*.5||0,a.yaw*w,a.roll*Math.PI*2*w+a.recoil*.35*w);const angle=a.roll*Math.PI*2*w;p.rig.position.x+=Math.cos(a.yaw)*Math.sin(angle)*1.5;p.rig.position.z-=Math.sin(a.yaw)*Math.sin(angle)*1.5;p.rig.position.y+=(1-Math.cos(angle))*1.5;p.body.rotation.x=a.duck?.55*a.duck:0;
   p.pivot.rotation.x=(-a.wind*1.0+a.strike*1.15)*w;
   for(const [key,side]of [['L',-1],['R',1]]){p.arms[key].rotation.set(-.18-a.wind*.7-a.strike*(side>0?1.2:.4)-a.guard*.8,0,side*.1);p.elbows[key].rotation.x=-.25-a.wind*.8-a.guard*.9;p.legs[key].rotation.x=Math.sin(m.time*9+side)*a.step*.4;}
  });
  root.updateWorldMatrix(true,true);
  const held=(object,owner,name,fallback,pick=0)=>{const hand=owner.getObjectsByProperty('name',name)[pick];if(hand)hand.getWorldPosition(world);else world.set(...fallback).applyMatrix4(root.matrixWorld);props.worldToLocal(world);object.position.copy(world);};
  held(hammer,roles[1],'five-finger-gloved-hand',[actors[1].x,2.4,actors[1].z],1);hammer.visible=event.attacker===1||actors[1].guard>.1;
  hammer.rotation.set(-actors[1].wind*1.9+actors[1].strike*1.25,actors[1].yaw,.18);
  held(book,roles[4],'gyuwon-wrist-pivot',[actors[4].x,2,actors[4].z]);book.visible=event.attacker===4;book.rotation.set(-.2,actors[4].yaw,0);
  from.set(...state.launch);to.set(...state.hit);const fly=state.flight;
  direction.subVectors(to,from).normalize();
  wave.visible=event.kind==='wave'&&age>1.7&&age<3.8;
  if(wave.visible){wave.position.copy(from).lerp(to,fly);wave.position.y=.12;wave.rotation.y=Math.atan2(direction.x,direction.z);const rise=ease((age-1.7)/.9)*(1-ease((age-3.3)/.5));wave.scale.set(2.0,Math.max(.05,rise*2.3),.6);}
  const projectiles=(list,kind,spread)=>list.forEach((o,i)=>{o.visible=event.kind===kind&&age>=2.65&&age<3.55;if(!o.visible)return;const q=clamp(fly-i*.025);o.position.copy(from).lerp(to,q);o.position.x+=(Math.sin(q*Math.PI)+q*.45)*(i-(list.length-1)/2)*spread;o.position.y+=Math.sin(q*Math.PI)*(kind==='pages'?1.2:.25);o.rotation.set(kind==='arrow'?0:q*4,Math.atan2(direction.x,direction.z),kind==='pages'?q*6+i*.7:i*.1);});
  projectiles(sheets,'pages',.25);projectiles(arrows,'arrow',.18);projectiles(cards,'cards',.24);
  sparks.forEach((o,i)=>{o.visible=state.impact>0&&state.impact<.9&&age<3.55;if(o.visible){const a=actors[state.struck],q=(age-3.23)/.32;o.position.set(a.x+Math.sin(i*2.4)*q*.7,2+Math.cos(i)*q*.5,a.z+Math.cos(i*2.4)*q*.7);o.rotation.set(i,q*4,i*.4);o.scale.setScalar(Math.max(.01,1-q));}});
 }
 return {update,stats:()=>({active:!!state&&state.weight>.001,event:state?.event.kind,attacker:state?.event.attacker,target:state?.event.target,contact:state?.contact,hpDamage:0}),dispose(){props.removeFromParent();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
