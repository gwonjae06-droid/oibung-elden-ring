import * as THREE from 'three';
import {SWORD,PATTERNS,swordSegment} from './combat.mjs';
import {createParticlePool,FX_LIMIT,impactDue,trailAllowed} from './effects-data.mjs';
import {createFeel} from './feel.mjs';

export function createEffects(scene,sword,reduced=false){
  const pool=createParticlePool(reduced?80:FX_LIMIT),root=new THREE.Group();root.name='combat-effects';scene.add(root);
  const feel=createFeel(scene,reduced);
  const geo=new THREE.BufferGeometry(),positions=new Float32Array(FX_LIMIT*3),colors=new Float32Array(FX_LIMIT*3);
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setDrawRange(0,0);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const c=canvas.getContext('2d'),gradient=c.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.3,'#ffffffaa');gradient.addColorStop(1,'#ffffff00');
  c.fillStyle=gradient;c.fillRect(0,0,32,32);
  const texture=new THREE.CanvasTexture(canvas);
  const material=new THREE.PointsMaterial({size:.28,map:texture,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const points=new THREE.Points(geo,material);points.frustumCulled=false;root.add(points);
  const rings=[],ringGeo=new THREE.RingGeometry(.92,1,64);
  for(let i=0;i<8;i++){
    const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xffcb7a,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
    m.rotation.x=-Math.PI/2;m.visible=false;root.add(m);rings.push({m,life:0,max:1,radius:1});
  }
  const trailGeo=new THREE.BufferGeometry(),trailPos=new Float32Array(18*18),trailColor=new Float32Array(18*18);
  trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3));trailGeo.setAttribute('color',new THREE.BufferAttribute(trailColor,3));trailGeo.setDrawRange(0,0);
  const ribbon=new THREE.Mesh(trailGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending}));
  ribbon.frustumCulled=false;root.add(ribbon);
  const history=[],a=new THREE.Vector3(),b=new THREE.Vector3();let impactId=-1,lastGame=null;
  const gold=[1,.65,.22],red=[1,.25,.14];
  function ring(x,z,radius,color=0xffcb7a){
    const r=rings.find(q=>q.life<=0)||rings[0];r.life=r.max=.65;r.radius=radius;
    r.m.position.set(x,.035,z);r.m.material.color.setHex(color);r.m.visible=true;r.m.scale.setScalar(.12);
  }
  function clear(){pool.clear();feel.clear();history.length=0;impactId=-1;geo.setDrawRange(0,0);trailGeo.setDrawRange(0,0);for(const r of rings){r.life=0;r.m.visible=false;}}
  function event(ev,g){
    if(lastGame!==g){clear();lastGame=g;}
    feel.event(ev,g);
    const p=g.player,b=g.boss;
    if(ev.type==='boss-hit'){
      pool.emit(b.x+(p.x-b.x)*.4,1.8,b.z+(p.z-b.z)*.4,reduced?10:28,gold);
    }else if(ev.type==='player-hit')pool.emit(p.x,1.1,p.z,reduced?8:20,red);
    else if(ev.type==='phase'){
      ring(b.x,b.z,7,0xff5635);pool.emit(b.x,2,b.z,reduced?20:75,red,true);
    }else if(ev.type==='stagger'){ring(b.x,b.z,3);pool.emit(b.x,2,b.z,20,gold);}
    else if(ev.type==='healed'){ring(p.x,p.z,1.4,0x81e9a0);pool.emit(p.x,.7,p.z,18,[.3,1,.55]);}
    else if(ev.type==='dodge')pool.emit(p.x,1,p.z,8,[.45,.7,1]);
    else if(ev.type==='victory'){ring(b.x,b.z,8);pool.emit(b.x,2,b.z,reduced?20:90,gold,true);}
  }
  function update(dt,g){
    if(lastGame!==g){clear();lastGame=g;}
    feel.update(dt,g);
    const h=Math.max(0,Math.min(dt,.05)),boss=g.boss;
    pool.step(h);
    if(impactDue(boss,PATTERNS[boss.pattern].active)&&boss.attackId!==impactId){
      impactId=boss.attackId;const tip=swordSegment(boss).b;
      const x=boss.pattern==='leap'?boss.x:tip.x,z=boss.pattern==='leap'?boss.z:tip.z;
      ring(x,z,boss.pattern==='leap'?4.6:2.4);pool.emit(x,.15,z,reduced?12:45,[.65,.5,.32],true);pool.emit(x,.2,z,reduced?8:24,gold);
    }
    if(h>0&&!reduced&&g.status==='playing'&&trailAllowed(boss)){
      sword.updateWorldMatrix(true,false);a.set(0,0,.4).applyMatrix4(sword.matrixWorld);b.set(0,0,SWORD.length).applyMatrix4(sword.matrixWorld);
      if(!history.length||history[0].id===boss.attackId)history.unshift({a:a.clone(),b:b.clone(),life:.16,id:boss.attackId});
      else{history.length=0;history.unshift({a:a.clone(),b:b.clone(),life:.16,id:boss.attackId});}
    }
    for(let i=history.length-1;i>=0;i--){history[i].life-=h;if(history[i].life<=0)history.splice(i,1);}
    history.length=Math.min(history.length,18);
    let n=0;
    for(let i=0;i<history.length-1;i++){
      const q=history[i],r=history[i+1],fade=Math.max(0,r.life/.16),col=boss.phase===2?red:gold;
      for(const v of [q.a,q.b,r.b,q.a,r.b,r.a]){trailPos[n*3]=v.x;trailPos[n*3+1]=v.y;trailPos[n*3+2]=v.z;trailColor[n*3]=col[0]*fade;trailColor[n*3+1]=col[1]*fade;trailColor[n*3+2]=col[2]*fade;n++;}
    }
    trailGeo.setDrawRange(0,n);trailGeo.attributes.position.needsUpdate=true;trailGeo.attributes.color.needsUpdate=true;
    let i=0;
    for(const p of pool.particles){
      const fade=Math.max(0,p.life/p.max);
      positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;
      for(let j=0;j<3;j++)colors[i*3+j]=p.color[j]*fade*(p.dust?.35:1);
      i++;
    }
    geo.setDrawRange(0,i);geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
    for(const r of rings){
      if(r.life<=0)continue;r.life-=h;r.m.visible=r.life>0;
      const t=1-Math.max(0,r.life/r.max);r.m.scale.setScalar(.12+r.radius*t);r.m.material.opacity=(1-t)*.55;
    }
  }
  return {event,update,clear};
}
