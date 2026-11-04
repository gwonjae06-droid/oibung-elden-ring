const sat=(v,a,b)=>Math.max(a,Math.min(b,v));
export function clownDebris(seed=0,count=48){
 let s=(seed+1)>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 return Array.from({length:sat(Math.floor(Number.isFinite(count)?count:0),0,128)},(_,i)=>{
  const angle=random()*Math.PI*2,speed=2+random()*7,life=.8+random()*1.2;
  return {kind:i%3===0?'rubber':'paper',x:0,y:.7,z:0,vx:Math.sin(angle)*speed,vy:3+random()*5,vz:Math.cos(angle)*speed,rx:random()*6,ry:random()*6,rz:random()*6,spin:(random()-.5)*12,scale:.14+random()*.2,color:i%3,life,max:life};
 });
}
export function stepClownDebris(p,dt){
 const h=Number.isFinite(dt)?sat(dt,0,.05):0;p.life=Math.max(0,p.life-h);if(!h)return p;
 const paper=p.kind==='paper',drag=Math.exp(-(paper?1.7:.55)*h);p.vx*=drag;p.vz*=drag;p.vy-=(paper?4.8:10)*h;
 p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;p.rx+=p.spin*h;p.ry+=p.spin*.7*h;p.rz+=p.spin*1.3*h;
 if(p.y<.08){p.y=.08;if(!paper&&Math.abs(p.vy)>.4)p.vy=-p.vy*.32;else p.vy=0;}
 return p;
}
