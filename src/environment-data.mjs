export function environmentPlan(seed=2718){
  let state=seed;
  const rand=()=>{state=(state*16807)%2147483647;return state/2147483647;};
  const polar=(r,a)=>({x:Math.sin(a)*r,z:Math.cos(a)*r});
  const rubble=[],grass=[],walls=[],arches=[],cracks=[];
  for(let i=0;i<180;i++){
    const s=.25+rand()*.8,a=rand()*Math.PI*2,r=28+rand()*6;
    rubble.push({...polar(r,a),s,y:s*.3,yaw:rand()*Math.PI,tilt:(rand()-.5)*.5});
  }
  for(let i=0;i<260;i++){
    const r=18+rand()*7,a=rand()*Math.PI*2;
    grass.push({...polar(r,a),h:.08+rand()*.2,yaw:rand()*Math.PI});
  }
  for(let i=0;i<36;i++){
    if(i%9===0)continue;
    const a=i*Math.PI*2/36;
    walls.push({...polar(34,a),yaw:a,h:4+rand()*3,w:5.5,d:1.6});
  }
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    arches.push({...polar(34,a),yaw:a,broken:i%2===1});
  }
  for(let i=0;i<90;i++){
    const p=polar(rand()*23,rand()*Math.PI*2);
    const a=rand()*Math.PI*2,len=.3+rand()*1.8;
    const end={x:p.x+Math.sin(a)*len,z:p.z+Math.cos(a)*len};
    if(Math.hypot(end.x,end.z)<24)cracks.push({a:p,b:end});
  }
  return {rubble,grass,walls,arches,cracks};
}
