// Course geometry, obstacle footprints and collectible paths share world units.
export function runnerRewardHeight(m,x){
 const roads=m.platforms||[],under=roads.filter(p=>!p.bonus&&x>=p.x&&x<=p.end),floor=Math.max(0,...under.map(p=>p.y||0));
 const near=(m.obstacles||[]).filter(o=>!o.hit&&Math.abs(o.x-x)<7).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
 if(near){
  const base=near.floorY||0,dx=Math.abs(near.x-x);
  if(near.kind==='low')return base+.43;
  const lift=near.challenge==='spire'?3.15:2.25;
  return base+.85+lift*Math.max(0,1-(dx/7)**2);
 }
 if(under.length)return floor+.9;
 const left=roads.filter(p=>p.end<x).sort((a,b)=>b.end-a.end)[0],right=roads.filter(p=>p.x>x).sort((a,b)=>a.x-b.x)[0];
 if(!left||!right)return null;
 const q=(x-left.end)/(right.x-left.end);
 return (left.y||0)*(1-q)+(right.y||0)*q+.9+Math.sin(q*Math.PI)*1.65;
}
export function runnerPlaceObstacle(g,m,{kind='high',challenge=kind,variant='plank',falling=false,x=24,lyricId=null}={}){
 if(falling)kind='high';
 if(m.platforms.some(p=>p.bonus&&x>p.x-2&&x<p.end+2))return false;
 const road=m.platforms.find(p=>x>=p.x+5&&x<=p.end-4);
 if(!road||m.obstacles.some(o=>!o.hit&&Math.abs(o.x-x)<Math.max(11,m.runnerSpeed*1.1)))return false;
 const height=challenge==='spire'?2.1:1.3;
 m.obstacles.push({id:g.nextId++,x,kind,challenge,variant,falling,floorY:road.y||0,
  bottom:falling?4.2:0,height,width:challenge==='spire'?1.5:1.3,hit:false,section:m.runnerScene.key,spawnTime:m.time,lyricId});
 // Replace stray old rewards in the new footprint with a visible safe route.
 m.jellies=m.jellies.filter(j=>Math.abs(j.x-x)>7);
 for(let dx=-6;dx<=6;dx+=2){const y=runnerRewardHeight(m,x+dx);if(y!==null)m.jellies.push({id:g.nextId++,x:x+dx,y,kind:dx===0?'gold':'jelly',course:true});}
 return true;
}
export function runnerExtendCourse(m,last,scene){
 const index=m.courseIndex=(m.courseIndex||0)+1,hard=['bridge','rain','skyroad','final-sprint'].includes(scene.key);
 const gap=scene.relief?0:hard?7+(index%3)*2:4.8+(index%2)*1.5;
 const top=scene.relief?0:hard?[0,.65,1.15,.35][index%4]:[0,.35,0][index%3];
 if(hard&&index%2===0)m.platforms.push({x:last.end+gap*.42,end:last.end+gap*.42+2.4,y:Math.max(last.y||0,top)+.65,stepping:true});
 const next={x:last.end+gap,end:last.end+gap+(hard?17:22)+(index%3)*2,y:top};
 if(hard&&index%3===1){
  const balcony={x:next.x+4,end:next.x+10,y:top+1.35,bonus:true};m.platforms.push(balcony);
  for(let i=0;i<4;i++)m.jellies.push({id:'balcony-'+index+'-'+i,x:balcony.x+.7+i*1.4,y:balcony.y+.9,kind:i===3?'gold':'jelly',bonusRoute:true});
 }
 m.platforms.push(next);return next;
}
