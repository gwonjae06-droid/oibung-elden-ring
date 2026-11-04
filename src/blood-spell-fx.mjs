import * as THREE from 'three';
import {hazardPosition} from './blood-data.mjs';

export const BLOOD_SPELL_FORMS=Object.freeze({wave:'crest',fountain:'fountain',burst:'implosion',orbs:'comet',chain:'braid',orbit:'orbit',vortex:'vortex',dive:'landing',eclipse:'corona',rain:'rain',wing:'blade',pulse:'heartbeat',pursuit:'wake',tide:'tide'});
export function createBloodSpellFx(parent,fluid,particles,{reduced=false}={}){
 const live=new Map(),pool=new Map(),position=new THREE.Vector3();let stamp=0;
 const mesh=(geo,group)=>{const m=new THREE.Mesh(geo,fluid.material);group.add(m);return m;};
 function acquire(pattern){
  const free=pool.get(pattern)||[];pool.set(pattern,free);let item=free.pop();if(item){item.group.visible=true;return item;}
  const group=new THREE.Group();group.userData.spellForm=BLOOD_SPELL_FORMS[pattern];parent.add(group);const parts=[];
  const forms={wave:['sheet','sheet','sphere'],fountain:['column','column','sphere'],burst:['sphere','torus'],orbs:['sphere','column'],chain:['column','column','torus'],orbit:['torus','torus'],vortex:['torus','torus','sphere'],dive:['torus','column','column'],eclipse:['sphere','torus'],rain:['column','sphere','sphere'],wing:['sheet','sheet'],pulse:['torus','torus','sphere'],pursuit:['sheet','column'],tide:['sheet','sheet','torus']}[pattern];
  for(const form of forms)parts.push(mesh(fluid[form],group));item={group,parts,pattern,stamp:0,fired:false};return item;
 }
 function release(item){item.group.visible=false;pool.get(item.pattern).push(item);}
 function pose(item,h,g){
  const {group,parts,pattern}=item,c=hazardPosition(h),active=h.age>=h.warn,t=Math.max(0,h.age-h.warn),charge=Math.min(1,h.age/h.warn),exit=Math.min(1,(h.warn+h.life-h.age)/.18),p=active?1:charge*.45;
  group.position.set(c.x,.12,c.z);group.rotation.set(0,h.yaw||0,0);group.scale.setScalar(Math.max(.001,exit));
  for(const m of parts){m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);}
  const swirl=reduced?0:g.time*2.4;
  switch(pattern){
   case 'wave':case 'tide':{
    for(let i=0;i<2;i++){const m=parts[i];m.position.set(0,active?1.5+i*.4:.3, i*.6);m.rotation.x=-.22-i*.3;m.scale.set(h.width*1.8,(active?3.8:1)*p,1);}
    if(pattern==='wave'){parts[2].scale.set(h.width*.8,.3,h.length*.48);parts[2].position.y=.12;}
    else {parts[2].rotation.x=Math.PI/2;parts[2].scale.set(h.width,h.width,1);}break;
   }
   case 'fountain':case 'rain':{
    const height=active?Math.max(.2,Math.sin(Math.min(1,t/h.life)*Math.PI)*12):charge*.65;
    parts[0].scale.set(c.r*.8,height,c.r*.8);parts[0].position.y=height*.5;
    parts[1].scale.set(c.r*.6,pattern==='rain'?1:height*.8,c.r*.6);parts[1].position.set(c.r*.25,pattern==='rain'?(1-charge)*15:height*.65,0);parts[1].rotation.z=.18;
    parts[2].scale.set(c.r*.65,.3,c.r*.65);parts[2].position.y=height;break;
   }
   case 'burst':{const r=active?c.r*(.35+.65*t/h.life):1.8*charge;parts[0].position.y=active?.45:2;parts[0].scale.set(r,active?.4:r*.8,r);parts[1].rotation.x=Math.PI/2;parts[1].scale.setScalar(active?r:charge*2);break;}
   case 'orbs':{parts[0].position.y=1.25;parts[0].scale.set(c.r*p,c.r*p*(1+Math.sin(swirl)*.08),c.r*p);parts[1].position.set(0,1.1,-c.r*1.4);parts[1].rotation.x=Math.PI/2;parts[1].scale.set(.6,3*p,.6);break;}
   case 'chain':{for(let i=0;i<2;i++){const m=parts[i];m.position.set(Math.sin(swirl+i*Math.PI)*c.r*.4,1.2,Math.cos(swirl+i*Math.PI)*c.r*.4);m.rotation.z=Math.sin(swirl+i)*.4;m.scale.set(.35,3.5*p,.35);}parts[2].rotation.x=Math.PI/2;parts[2].scale.set(c.r*.8,c.r*.8,1);break;}
   case 'orbit':case 'pulse':{for(let i=0;i<2;i++){parts[i].rotation.set(Math.PI/2+i*.08,0,swirl*(i?-1:1));parts[i].position.y=.25+i*.35;parts[i].scale.set(c.r,c.r,h.width*3);}if(parts[2]){parts[2].position.y=.45;parts[2].scale.set(.7,.2,.7);}break;}
   case 'vortex':{for(let i=0;i<2;i++){parts[i].rotation.set(Math.PI/2,.1,swirl*(i?-1:1));parts[i].position.y=.12+i*.3;parts[i].scale.set(c.r*(1-i*.38)*p,c.r*(1-i*.38)*p,2);}parts[2].scale.set(c.r*.45,.05,c.r*.45);break;}
   case 'dive':{parts[0].rotation.x=Math.PI/2;parts[0].scale.setScalar(active?c.r*(.6+t/h.life*.4):c.r*charge);for(let i=1;i<3;i++){parts[i].position.set((i===1?-1:1)*c.r*.5,active?1.5:.1,0);parts[i].rotation.z=(i===1?-1:1)*.65;parts[i].scale.set(.8,active?4:charge*.5,.8);}break;}
   case 'eclipse':{parts[0].position.y=14;parts[0].scale.setScalar(3.6*charge);parts[1].position.y=14;parts[1].scale.setScalar(4.1*charge);parts[1].rotation.z=swirl*.25;break;}
   case 'wing':{for(let i=0;i<2;i++){parts[i].position.set((i?1:-1)*c.r*.22,1.2,c.r*.42);parts[i].rotation.set(0,(i?1:-1)*.5,-.25);parts[i].scale.set(c.r*.75,active?.8:charge*.3,1);}break;}
   case 'pursuit':{if(h.shape==='circle'){parts[0].rotation.x=-Math.PI/2;parts[0].scale.set(c.r*1.5,c.r*1.5,1);parts[1].scale.set(c.r*.3,active?3:.3,c.r*.3);break;}parts[0].position.set(0,.65,0);parts[0].rotation.x=Math.PI/2;parts[0].scale.set(h.width*1.7,h.length,1);parts[1].position.y=.8;parts[1].rotation.x=Math.PI/2;parts[1].scale.set(.8,h.length*.8,.8);break;}
  }
  if(active&&!item.fired){item.fired=true;particles.burst(c.x,pattern==='rain'?1:1.5,c.z,{count:pattern==='burst'||pattern==='dive'?26:12,power:pattern==='burst'?10:6});particles.puddle(c.x,c.z,Math.min(1.7,c.r*.3));}
 }
 function update(g){stamp++;for(const h of g.blood.hazards){let item=live.get(h.id);if(!item){item=acquire(g.blood.pattern);item.fired=false;live.set(h.id,item);}item.stamp=stamp;pose(item,h,g);}for(const[id,item]of live)if(item.stamp!==stamp){release(item);live.delete(id);}}
 function clear(){for(const item of live.values())release(item);live.clear();particles.clear();}
 return {update,clear,get active(){return live.size;}};
}
