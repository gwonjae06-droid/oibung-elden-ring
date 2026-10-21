import * as THREE from 'three';
import {createBossSfx} from './boss-sfx.mjs';
import {createPhaseDialogue} from './phase-dialogue.mjs';
import {createParticlePool,FX_LIMIT} from './effects-data.mjs';
import {SKILL_COLORS,SKILL_HEX} from './skills.mjs';

export function createSkillFx(scene,reduced=false){
  const bossSfx=createBossSfx(),phaseDialogue=createPhaseDialogue();
  const limit=reduced?70:Math.min(FX_LIMIT,260),pool=createParticlePool(limit),root=new THREE.Group();root.name='skill-effects';scene.add(root);
  const geo=new THREE.BufferGeometry(),positions=new Float32Array(limit*3),colors=new Float32Array(limit*3);
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setDrawRange(0,0);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const c=canvas.getContext('2d'),gradient=c.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.35,'#ffffffaa');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.fillRect(0,0,32,32);
  const material=new THREE.PointsMaterial({size:.34,map:new THREE.CanvasTexture(canvas),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const points=new THREE.Points(geo,material);points.frustumCulled=false;root.add(points);
  const rings=[],ringGeo=new THREE.RingGeometry(.9,1,64);
  for(let i=0;i<6;i++){const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;root.add(m);rings.push({m,life:0,max:.7,radius:2});}
  let acc=0,lastGame=null;
  const n=k=>reduced?Math.ceil(k/3):k;
  function ring(x,z,radius,hex,max=.7){const r=rings.find(q=>q.life<=0)||rings[0];r.life=r.max=max;r.radius=radius;r.m.position.set(x,.05,z);r.m.material.color.setHex(hex);r.m.visible=true;r.m.scale.setScalar(.1);}
  function clear(){phaseDialogue.clear();bossSfx.clear();pool.clear();geo.setDrawRange(0,0);for(const r of rings){r.life=0;r.m.visible=false;}acc=0;}
  function event(ev,g){
    if(lastGame!==g){clear();lastGame=g;}
    bossSfx.event(ev,g);
    const p=g.player,b=g.boss,f=ev.flavor,col=SKILL_COLORS[f]||SKILL_COLORS.white;
    if(ev.type==='skill-cast'){
      const fx=p.x+Math.sin(p.yaw)*3.2,fz=p.z+Math.cos(p.yaw)*3.2;
      if(f==='sword'){ring(p.x,p.z,2.6,SKILL_HEX.sword);pool.emit(p.x,1.2,p.z,n(34),col);}
      else if(f==='hammer'){ring(fx,fz,5,SKILL_HEX.hammer,.9);pool.emit(fx,.2,fz,n(42),[.7,.4,.22],true);pool.emit(fx,.5,fz,n(26),col);}
      else if(f==='bow'){ring(p.x,p.z,1.4,SKILL_HEX.bow,.5);pool.emit(p.x+Math.sin(p.yaw)*2,1.2,p.z+Math.cos(p.yaw)*2,n(24),col);}
      else{ring(p.x,p.z,f==='yellow'?3:2.2,SKILL_HEX[f]);pool.emit(p.x,1.4,p.z,n(f==='blue'?30:38),col);}
    }else if(ev.type==='skill-stun'){ring(b.x,b.z,3.8,SKILL_HEX.yellow,.8);pool.emit(b.x,3,b.z,n(36),SKILL_COLORS.yellow);}
    else if(ev.type==='skill-heal'){ring(p.x,p.z,1.8,SKILL_HEX.heal);pool.emit(p.x,.6,p.z,n(24),SKILL_COLORS.heal);}
    else if(ev.type==='skill-ready'){ring(p.x,p.z,1.6,SKILL_HEX[f]||0xffffff,.55);pool.emit(p.x,1,p.z,n(14),col);}
    else if(ev.type==='skill-pierce')pool.emit(p.x+Math.sin(p.yaw)*5,1.3,p.z+Math.cos(p.yaw)*5,n(14),SKILL_COLORS.bow);
  }
  function update(dt,g){
    if(lastGame!==g){clear();lastGame=g;}
    bossSfx.update(dt,g);
    phaseDialogue.update(g);
    const h=Math.max(0,Math.min(dt,.05));pool.step(h);acc+=h;
    const every=reduced?.2:.07;
    if(h>0&&acc>=every){
      acc=0;const p=g.player,s=p.skill,jx=()=>(Math.random()-.5)*1.2;
      if(s.haste>0)pool.emit(p.x+jx(),1.1+Math.random()*.8,p.z+jx(),n(3),SKILL_COLORS.sword);
      if(s.blue>0)pool.emit(p.x+jx(),.2,p.z+jx(),n(3),SKILL_COLORS.blue);
      if(s.nextRed)pool.emit(p.x+jx()*.6,1.7+Math.random()*.4,p.z+jx()*.6,n(2),SKILL_COLORS.red);
      if(s.nextYellow)pool.emit(p.x+jx()*.6,1.8+Math.random()*.4,p.z+jx()*.6,n(2),SKILL_COLORS.yellow);
      if(g.weapon==='hammer'&&s.hammerHits>=4)pool.emit(p.x+jx(),.4,p.z+jx(),n(2),SKILL_COLORS.hammer);
      for(const q of g.projectiles)if(q.skill)pool.emit(q.x,q.y,q.z,n(2),SKILL_COLORS.bow);
    }
    let i=0;
    for(const q of pool.particles){const fade=Math.max(0,q.life/q.max);positions[i*3]=q.x;positions[i*3+1]=q.y;positions[i*3+2]=q.z;for(let j=0;j<3;j++)colors[i*3+j]=q.color[j]*fade*(q.dust?.4:1);i++;}
    geo.setDrawRange(0,i);geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
    for(const r of rings){if(r.life<=0)continue;r.life-=h;r.m.visible=r.life>0;const t=1-Math.max(0,r.life/r.max);r.m.scale.setScalar(.1+r.radius*t);r.m.material.opacity=(1-t)*.6;}
  }
  return {event,update,clear};
}
