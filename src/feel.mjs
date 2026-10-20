import * as THREE from 'three';
import {createImpactAudio} from './impact-audio.mjs';

const HIT_SOUND={sword:'hit-slash',hammer:'hit-blunt',bow:'hit-pierce',cards:'hit-slash'};

export function createFeel(scene,reduced=false){
  const sfx=createImpactAudio();
  let armed=false;
  const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch(e){return false;}};
  const say=name=>{
    if(!armed)return;
    if(muted()){if(sfx.enabled)sfx.setEnabled(false);return;}
    if(!sfx.enabled&&!sfx.setEnabled(true))return;
    sfx.play(name);
  };
  for(const t of ['pointerdown','keydown'])addEventListener(t,()=>{armed=true;},{passive:true});

  const root=new THREE.Group();root.name='impact-feel';scene.add(root);
  const dropGeo=new THREE.SphereGeometry(.07,5,4),decalGeo=new THREE.CircleGeometry(1,14).rotateX(-Math.PI/2);
  const bloodMat=new THREE.MeshBasicMaterial({color:0x8a0c12}),sparkMat=new THREE.MeshBasicMaterial({color:0xfff0b0});
  const MAXD=reduced?36:110,MAXC=reduced?10:36;
  const drops=[],decals=[];
  let decalN=0,shakeT=0,lastGame=null;

  function addDecal(x,z,r){
    if(Math.hypot(x,z)>24)return;
    let d;
    if(decals.length<MAXC){
      const m=new THREE.Mesh(decalGeo,new THREE.MeshBasicMaterial({color:0x4a0407,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
      root.add(m);d={m,age:0};decals.push(d);
    }else d=decals[decalN++%decals.length];
    d.age=0;d.m.position.set(x,.03+Math.random()*.01,z);d.m.rotation.y=Math.random()*6.28;d.m.scale.setScalar(r);d.m.visible=true;d.m.material.opacity=.8;
  }
  function drop(kind,x,y,z,vx,vy,vz,life){
    if(drops.length>=MAXD){const o=drops.shift();root.remove(o.m);}
    const m=new THREE.Mesh(dropGeo,kind==='spark'?sparkMat:bloodMat);
    m.position.set(x,y,z);m.scale.setScalar(kind==='spark'?.7:.6+Math.random()*.9);root.add(m);
    drops.push({m,kind,vx,vy,vz,life});
  }
  function spray(kind,x,y,z,dx,dz,n,power){
    const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    for(let i=0;i<n;i++){
      const s=1.5+Math.random()*power,a=(Math.random()-.5)*1.6,c=Math.cos(a),sn=Math.sin(a);
      drop(kind,x,y,z,(dx*c-dz*sn)*s,1+Math.random()*power*.7,(dx*sn+dz*c)*s,kind==='spark'?.22+Math.random()*.15:3);
    }
  }
  const kick=v=>{if(!reduced)shakeT=Math.max(shakeT,v);};
  function clear(){
    for(const o of drops)root.remove(o.m);drops.length=0;
    for(const d of decals){d.m.visible=false;d.age=0;}
    shakeT=0;scene.position.set(0,0,0);
  }
  function event(ev,g){
    if(lastGame!==g){clear();lastGame=g;}
    const p=g.player,b=g.boss;
    if(ev.type==='boss-hit'){
      const big=Boolean(ev.big),x=b.x+(p.x-b.x)*.35,z=b.z+(p.z-b.z)*.35,y=1.6+Math.random()*1.4;
      spray('blood',x,y,z,p.x-b.x,p.z-b.z,big?30:ev.amount>=60?16:10,big?6:4);
      if(g.weapon==='sword'||g.weapon==='hammer')spray('spark',x,y,z,p.x-b.x,p.z-b.z,big?14:8,7);
      say(HIT_SOUND[g.weapon]||'hit-slash');say('blood-splat');if(big)say('hit-crit');
      kick(big?.32:.1);
    }else if(ev.type==='player-hit'){
      spray('blood',p.x,1.3,p.z,p.x-b.x,p.z-b.z,18,5);say('hit-flesh');say('blood-splat');kick(.25);
    }else if(ev.type==='stagger'){
      spray('blood',b.x,2.4,b.z,p.x-b.x,p.z-b.z,22,6);say('hit-crit');kick(.3);
    }else if(ev.type==='victory'){
      spray('blood',b.x,2.5,b.z,p.x-b.x,p.z-b.z,70,8);say('hit-crit');kick(.45);
    }else if(ev.type==='skill-cast'&&ev.flavor==='hammer')kick(.25);
    else if(ev.type==='phase')kick(.4);
  }
  function update(dt,g){
    if(lastGame!==g){clear();lastGame=g;}
    const h=Math.max(0,Math.min(dt,.05));
    if(h>0){
      for(let i=drops.length-1;i>=0;i--){
        const o=drops[i];o.life-=h;
        if(o.kind==='blood')o.vy-=16*h;
        o.m.position.x+=o.vx*h;o.m.position.y+=o.vy*h;o.m.position.z+=o.vz*h;
        if(o.life<=0||(o.kind==='blood'&&o.m.position.y<=.03)){
          if(o.kind==='blood'&&o.m.position.y<=.1)addDecal(o.m.position.x,o.m.position.z,.15+Math.random()*.3);
          root.remove(o.m);drops.splice(i,1);
        }
      }
      for(const d of decals){
        if(!d.m.visible)continue;d.age+=h;
        d.m.material.opacity=.8*Math.max(0,Math.min(1,1-(d.age-12)/6));if(d.age>18)d.m.visible=false;
      }
      shakeT=Math.max(0,shakeT-h);
    }
    if(shakeT>0)scene.position.set((Math.random()-.5)*shakeT*.9,(Math.random()-.5)*shakeT*.6,(Math.random()-.5)*shakeT*.9);
    else if(scene.position.x||scene.position.y||scene.position.z)scene.position.set(0,0,0);
  }
  return {event,update,clear};
}
