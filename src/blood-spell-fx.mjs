import * as THREE from 'three';
import {hazardPosition} from './blood-data.mjs';
import {onsetTime} from './blood-stage.mjs';
import {bloodEnvironmentCue} from './environmental-telegraphs.mjs';
import {bloodWaveVisualPose} from './blood-volumetric-wave.mjs';

export const BLOOD_SPELL_FORMS=Object.freeze({wave:'crest',fountain:'fountain',burst:'implosion',orbs:'comet',chain:'braid',orbit:'orbit',vortex:'vortex',dive:'landing',eclipse:'corona',rain:'rain',wing:'blade',pulse:'heartbeat',pursuit:'wake',tide:'tide',lances:'martyr-lance',cross:'crossing-walls',judgement:'heavenly-sword',ritual:'cathedral-rite',bloodScissors:'crisscross-sanguine',heartCage:'caged-heart',wingShear:'winged-shears',rosary:'rosary-procession'});
// Visual-only settle time after a hazard stops dealing damage: blood sinks and spreads instead of vanishing.
const TAIL=1.4;
const clamp01=v=>Math.max(0,Math.min(1,v));
const easeOut=u=>1-Math.pow(1-clamp01(u),3);
const smooth=u=>{u=clamp01(u);return u*u*(3-2*u);};
const reach=(h,c)=>h.shape==='lane'?Math.max(1.8,h.width*1.2):h.shape==='cone'?Math.max(2.5,h.r*.4):h.shape==='ring'?Math.max(1.5,h.width*1.5):Math.max(1.2,c.r);
export function createBloodSpellFx(parent,fluid,particles,{reduced=false}={}){
 const live=new Map(),ghosts=new Set(),pool=new Map();let stamp=0,clock=0;
 const sprayDummy=new THREE.Object3D(),sprayCount=reduced?8:20;
 const mesh=(geo,group)=>{const m=new THREE.Mesh(geo,fluid.material);group.add(m);return m;};
 function acquire(pattern){
  const free=pool.get(pattern)||[];pool.set(pattern,free);let item=free.pop();
  if(!item){
   const group=new THREE.Group();group.userData.spellForm=BLOOD_SPELL_FORMS[pattern];parent.add(group);const parts=[];
   const forms={wave:['surge','undertow','sphere'],fountain:['column','column','sphere'],burst:['sphere','torus'],orbs:['sphere','column'],chain:['tendril','tendril','torus'],orbit:['torus','torus'],vortex:['spiral','spiral','sphere'],dive:['torus','column','column'],eclipse:['sphere','torus','torus'],rain:['column','sphere','sphere'],wing:['blade','blade'],pulse:['torus','torus','sphere'],pursuit:['sheet','column'],tide:['surge','undertow','torus'],lances:['lance','torus','tendril'],cross:['surge','undertow','tendril'],judgement:['lance','judgement','judgement'],ritual:['ritual','torus','tendril','tendril'],bloodScissors:['surge','undertow','tendril'],heartCage:['tendril','tendril','torus'],wingShear:['blade','blade'],rosary:['column','sphere','sphere']}[pattern];
   for(const form of forms)parts.push(mesh(fluid[form],group));
    const omens=Array.from({length:3},()=>mesh(fluid.tendril,group));
    const liquidWave=['wave','tide','cross','bloodScissors'].includes(pattern);
    let spray=null;
    if(liquidWave){
     spray=new THREE.InstancedMesh(fluid.sphere,fluid.material,sprayCount);
     spray.name='blood-wave-crest-spray';spray.count=0;spray.frustumCulled=false;
     spray.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(spray);
    }
    item={group,parts,omens,spray,pattern,stamp:0};
  }
  item.group.visible=true;item.fired=false;item.h=null;item.post=0;item.nextReady=item.nextRise=item.nextRun=0;item.runIndex=0;return item;
 }
 function release(item){item.group.visible=false;if(item.spray)item.spray.count=0;pool.get(item.pattern).push(item);}
 function anchor(h,c,item){
  if(h.shape!=='ring')return {x:c.x,z:c.z};
  const a=h.id*1.7+item.runIndex++*2.4;return {x:c.x+Math.sin(a)*c.r,z:c.z+Math.cos(a)*c.r};
 }
 // Stages: ready (age<warn) -> start (first onset) -> run (spreading) -> done (post>0, sinking); recovery is drained by the particle system.
 function pose(item,h,g,post){
  const {group,parts,pattern}=item,c=hazardPosition(h),active=h.age>=h.warn,t=Math.max(0,h.age-h.warn),charge=clamp01(h.age/h.warn);
  const span=reach(h,c),life=Math.max(.2,h.life),surge=active?easeOut(t/(onsetTime(h)+.25)):0,p=active?.45+.55*surge:smooth(charge)*.45,tail=clamp01(post/TAIL);
  group.position.set(c.x,.12,c.z);group.rotation.set(0,h.yaw||0,0);group.scale.set(1+tail*.1,Math.max(.001,1-smooth(tail)),1+tail*.1);
  for(const m of parts){m.visible=true;m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.set(1,1,1);}
   // Three-dimensional blood veins draw toward the impact point, but never trace the radius.
   item.omens.forEach((m,i)=>{
    m.visible=(Boolean(bloodEnvironmentCue(pattern))||['lances','cross','judgement','ritual'].includes(pattern))&&!active&&charge>.08;
    if(!m.visible)return;
    const a=i*Math.PI*2/3+(reduced?0:clock*.6),spread=Math.min(3.2,Math.max(1.1,span*.28));
    m.position.set(Math.cos(a)*spread,.4+.8*charge,Math.sin(a)*spread);
    m.rotation.set(Math.sin(a)*.3,a,-Math.cos(a)*.35);
    m.scale.set(.18+charge*.16,.35+charge*2.5,.18+charge*.16);
   });
  const swirl=reduced?0:g.time*2.4;
  switch(pattern){
   case 'wave':case 'tide':case 'cross':case 'bloodScissors':{
    // A real CLOSED 3D body, not a vertical sheet. The forward crest rolls
    // over a thick undertow, with spray riding just above the front lip.
    const v=bloodWaveVisualPose(h,post,clock,{reduced,tide:pattern==='tide'});
    const main=parts[0],under=parts[1];
    main.position.set(0,.08,v.crestForward*.24);
    main.rotation.set(0,0,v.wobble);
    main.scale.set(v.width*.54,v.height,(pattern==='tide'?3.65:2.95));
    under.position.set(0,.08,-1.3-v.phase*.65);
    under.scale.set(v.width*.58,Math.max(1.3,v.height*.53),5.3);
    if(pattern==='wave'){
     parts[2].position.set(0,.12,-1.7);
     parts[2].scale.set(v.width*.48,.38,Math.max(2.4,h.length*.58));
    }else if(pattern==='cross'||pattern==='bloodScissors'){
     parts[2].position.set(0,v.height*.43,.05);
     parts[2].scale.set(.95,Math.max(1.2,v.height*.85),.9);
    }else{
     parts[2].rotation.x=Math.PI/2;
     parts[2].position.y=.19;parts[2].scale.set(h.width,h.width,1);
    }
    if(item.spray){
     const spray=item.spray;
     spray.count=v.spray?sprayCount:0;
     if(v.spray){
      const swell=active?Math.min(1,(t+.04)/Math.min(.3,life*.35)):0;
      for(let i=0;i<sprayCount;i++){
       const lateral=(i+.5)/sprayCount*2-1,edge=Math.pow(Math.max(0,1-lateral*lateral),.65),
        phase=(clock*1.75+i*2.399+h.id*.61)%6.283185,
        rise=(.55+.45*Math.sin(phase))*v.height*.14,
        mass=.10+.12*(.5+.5*Math.sin(i*2.41));
       sprayDummy.position.set(lateral*v.width*.48,Math.max(.3,v.height*(.72+.15*edge)+rise)*swell,
        v.crestForward+1.3+Math.sin(phase)*.42);
       sprayDummy.rotation.set(.42*Math.sin(phase),phase*.35,-lateral*.3);
       sprayDummy.scale.set(mass,mass*(1.3+edge*2),mass);
       sprayDummy.updateMatrix();spray.setMatrixAt(i,sprayDummy.matrix);
      }
      spray.instanceMatrix.needsUpdate=true;
     }
    }
    break;
   }
   case 'fountain':case 'rain':case 'rosary':{
    const height=active?Math.max(.2,Math.sin(Math.min(1,t/h.life)*Math.PI)*24):smooth(charge)*1.1;
    parts[0].scale.set(c.r*.8,height,c.r*.8);parts[0].position.y=height*.5;
    parts[1].scale.set(c.r*.6,(pattern==='rain'||pattern==='rosary')?1:height*.8,c.r*.6);parts[1].position.set(c.r*.25,(pattern==='rain'||pattern==='rosary')?(1-charge)*15:height*.65,0);parts[1].rotation.z=.18;
    parts[2].scale.set(c.r*.65,.3,c.r*.65);parts[2].position.y=height;break;
   }
   case 'burst':{const r=active?c.r*(.4+.6*easeOut(t/(h.life*.9))):1.8*charge;parts[0].position.y=active?.45:2;parts[0].scale.set(r,active?.4:r*.8,r);parts[1].rotation.x=Math.PI/2;parts[1].scale.setScalar(active?r:charge*2);break;}
   case 'orbs':{parts[0].position.y=1.25;parts[0].scale.set(c.r*p,c.r*p*(1+Math.sin(swirl)*.08),c.r*p);parts[1].position.set(0,1.1,-c.r*1.4);parts[1].rotation.x=Math.PI/2;parts[1].scale.set(.6,3*p,.6);break;}
   case 'chain':case 'heartCage':{for(let i=0;i<2;i++){const m=parts[i];m.position.set(Math.sin(swirl+i*Math.PI)*c.r*.4,1.2,Math.cos(swirl+i*Math.PI)*c.r*.4);m.rotation.z=Math.sin(swirl+i)*.4;m.scale.set(.35,3.5*p,.35);}parts[2].rotation.x=Math.PI/2;parts[2].scale.set(c.r*.8,c.r*.8,1);break;}
   case 'orbit':case 'pulse':{for(let i=0;i<2;i++){parts[i].rotation.set(Math.PI/2+i*.08,0,swirl*(i?-1:1));parts[i].position.y=.25+i*.35;parts[i].scale.set(c.r,c.r,h.width*3);}if(parts[2]){parts[2].position.y=.45;parts[2].scale.set(.7,.2,.7);}break;}
   case 'vortex':{for(let i=0;i<2;i++){parts[i].rotation.y=swirl*(i?-1:1);parts[i].position.y=.12+i*.3;parts[i].scale.set(c.r*(1-i*.2)*p,1,c.r*(1-i*.2)*p);}parts[2].scale.set(c.r*.45,.05,c.r*.45);break;}
   case 'dive':{parts[0].rotation.x=Math.PI/2;parts[0].scale.setScalar(active?c.r*(.6+.4*easeOut(t/h.life)):c.r*charge);for(let i=1;i<3;i++){parts[i].position.set((i===1?-1:1)*c.r*.5,active?1.5:.1,0);parts[i].rotation.z=(i===1?-1:1)*.65;parts[i].scale.set(.8,active?4:charge*.5,.8);}break;}
   case 'eclipse':{const grow=smooth(charge);parts[0].position.y=19;parts[0].scale.setScalar(8*grow);parts[1].position.y=19;parts[1].scale.setScalar(9*grow);parts[1].rotation.z=swirl*.25;parts[2].rotation.x=Math.PI/2;parts[2].position.y=.25;parts[2].scale.set(c.r,c.r,h.width*5);break;}
   case 'wing':case 'wingShear':{for(let i=0;i<2;i++){parts[i].position.y=1.2+i*.35;parts[i].rotation.y=active?Math.sin(t/h.life*Math.PI)*.08:0;parts[i].scale.set(c.r*(1-i*.08),active?1:.35,c.r*(1-i*.08));}break;}
   case 'pursuit':{if(h.shape==='circle'){parts[0].rotation.x=-Math.PI/2;parts[0].scale.set(c.r*1.5,c.r*1.5,1);parts[1].scale.set(c.r*.3,active?3:.3,c.r*.3);break;}parts[0].position.set(0,.65,0);parts[0].rotation.x=Math.PI/2;parts[0].scale.set(h.width*1.7,h.length,1);parts[1].position.y=.8;parts[1].rotation.x=Math.PI/2;parts[1].scale.set(.8,h.length*.8,.8);break;}
   case 'lances':{
    parts[0].position.y=active?0:8+(1-charge)*15;parts[0].rotation.z=active?0:.12*(1-charge);parts[0].scale.set(c.r*.4,active?25:18,c.r*.4);
    parts[1].rotation.x=Math.PI/2;parts[1].scale.setScalar(c.r*(active?1:.35+.65*charge));parts[1].position.y=.2;
    parts[2].position.y=active?4:1;parts[2].scale.set(.65,active?10:2*charge,.65);break;
   }
   case 'judgement':{
    parts[0].position.set(0,active?1:14,0);parts[0].rotation.x=active?Math.PI/2:-.25;parts[0].scale.set(1.3,c.r,1.3);
    for(let i=1;i<3;i++){parts[i].visible=active;parts[i].position.y=.2+i*.35;parts[i].scale.setScalar(c.r);}break;
   }
   case 'ritual':{
    const ring=h.shape==='ring';parts[0].visible=!ring&&active;parts[1].visible=ring;
    if(!ring){parts[0].scale.set(c.r,active?4:.4,c.r);parts[0].position.y=.2;}
    else{parts[1].rotation.x=Math.PI/2;parts[1].scale.set(c.r,c.r,h.width*3);parts[1].position.y=.25;}
    for(let i=2;i<4;i++){const a=(i===2?-1:1)*(h.arc||.45),r=ring?c.r:c.r*.7;parts[i].position.set(Math.sin(a)*r,active?5:charge*2,Math.cos(a)*r);parts[i].scale.set(.8,active?18:charge*4,.8);}break;
   }
  }
  // Gentle jelly sway so the blood visibly sloshes while it is held in shape.
  if(!reduced){const w=clock*2.4,sway=active?1:.4;parts.forEach((m,i)=>{const a=Math.sin(w+i*1.9+h.id),b=Math.cos(w*.8+i*1.3);m.scale.x*=1+a*.04*sway;m.scale.z*=1+b*.04*sway;m.scale.y*=1+a*.05*sway;});}
  if(post>0)return;
  if(!active){
   if(h.age>=item.nextReady){item.nextReady=h.age+.6;particles.ripple(c.x,c.z,{from:Math.max(1,span*.95),to:.25,duration:.95,power:.7});}
   if(h.age>=item.nextRise){item.nextRise=h.age+(reduced?.5:.22);const a=anchor(h,c,item);particles.rise(a.x,a.z,{r:Math.min(span*.7,6),count:reduced?1:2});}
   return;
  }
  if(!item.fired){
   item.fired=true;item.nextRun=.55;const big=pattern==='burst'||pattern==='dive';
   particles.burst(c.x,pattern==='rain'?1:1.5,c.z,{count:big?34:16,power:big?9:5.5,lift:.9});
   particles.puddle(c.x,c.z,Math.min(1.7,c.r*.3));
   particles.ripple(c.x,c.z,{from:.3,to:span*1.05,duration:Math.max(1.5,life*1.3)});
   particles.ripple(c.x,c.z,{from:.2,to:span*.8,duration:Math.max(1.2,life),delay:.28,power:.6});
   return;
  }
  if(t<life&&t>=item.nextRun){
   item.nextRun+=.6;const a=anchor(h,c,item);
   particles.ripple(a.x,a.z,{from:span*.25,to:h.shape==='ring'?1.6:span,duration:1.5,power:.45});
   if(!reduced)particles.burst(a.x,.9,a.z,{count:2,power:2,lift:.55});
  }
 }
 // Damage is over: leave residual puddles that keep spreading slowly, and let the shape sink back down.
 function settle(item){
  const h=item.h;if(!h){release(item);return;}
  if(h.age>=h.warn){
   const c=hazardPosition(h),span=reach(h,c),a=anchor(h,c,item),b=anchor(h,c,item);
   particles.puddle(a.x,a.z,Math.min(2.2,Math.max(.7,span*.4)));
   if(!reduced)particles.puddle(b.x+Math.sin(h.id*2.1)*.9,b.z+Math.cos(h.id*2.1)*.9,Math.min(1.5,Math.max(.5,span*.25)));
   particles.ripple(c.x,c.z,{from:span*.5,to:span*1.2,duration:2.2,power:.5});
  }
  item.post=.0001;ghosts.add(item);
 }
 function update(g,dt=0){
  stamp++;clock+=dt;
  for(const h of g.blood.hazards){let item=live.get(h.id);if(!item){item=acquire(g.blood.pattern);live.set(h.id,item);}item.stamp=stamp;item.h=h;pose(item,h,g,0);}
  for(const[id,item]of live)if(item.stamp!==stamp){live.delete(id);settle(item);}
  for(const item of ghosts){item.post+=dt;if(item.post>=TAIL){ghosts.delete(item);release(item);continue;}pose(item,item.h,g,item.post);}
 }
 function clear(){for(const item of live.values())release(item);live.clear();for(const item of ghosts)release(item);ghosts.clear();particles.clear();}
 return {update,clear,get active(){return live.size;},get settling(){return ghosts.size;}};
}
