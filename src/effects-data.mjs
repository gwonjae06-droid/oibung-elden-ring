export const FX_LIMIT=240;
export function createParticlePool(limit=FX_LIMIT,random=Math.random){
  const particles=[];
  return {
    particles,
    emit(x,y,z,count,color,dust=false){
      for(let i=0;i<count&&particles.length<limit;i++){
        const a=random()*Math.PI*2,s=(dust?1.5:3)+random()*(dust?2:5),life=(dust?.6:.22)+random()*.4;
        particles.push({x,y,z,vx:Math.cos(a)*s,vy:1+random()*(dust?1:5),vz:Math.sin(a)*s,life,max:life,color:[...color],dust});
      }
    },
    step(dt){
      const h=Math.max(0,Math.min(dt,.05));
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];p.life-=h;
        if(p.life<=0){particles.splice(i,1);continue;}
        p.vy-=(p.dust?2:12)*h;p.x+=p.vx*h;p.y=Math.max(.025,p.y+p.vy*h);p.z+=p.vz*h;
      }
    },
    clear(){particles.length=0;}
  };
}
export function impactDue(b,activeDuration){
  return b.state==='active'&&((b.pattern==='slam'&&b.t>=activeDuration*.84)||(b.pattern==='leap'&&b.t>=activeDuration*.7));
}
export function trailAllowed(b){return b.state==='active'&&!['wave','retreat'].includes(b.pattern);}
