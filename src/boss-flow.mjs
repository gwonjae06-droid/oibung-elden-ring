export const FLOW_RATE={windup:15,active:48,recovery:9,idle:10,stagger:18,transition:80,dead:80};
export const flowAlpha=(state,dt)=>1-Math.exp(-(FLOW_RATE[state]||12)*Math.max(0,Math.min(dt,.05)));
export const wrapDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export function createBossFlow(sword,scene){
  let root=sword;
  while(root.parent&&root.parent!==scene)root=root.parent;
  let s=null,lastGame=null;
  const read=()=>({x:sword.position.x,y:sword.position.y,z:sword.position.z,rx:sword.rotation.x,ry:sword.rotation.y,by:root.rotation.y});
  function update(dt,g){
    const t=read();
    if(!s||lastGame!==g){s=t;lastGame=g;}
    const a=flowAlpha(g.boss.state,dt);
    s.x+=(t.x-s.x)*a;s.y+=(t.y-s.y)*a;s.z+=(t.z-s.z)*a;
    s.rx+=(t.rx-s.rx)*a;s.ry+=(t.ry-s.ry)*a;
    s.by+=wrapDelta(s.by,t.by)*a;
    sword.position.x=s.x;sword.position.y=s.y;sword.position.z=s.z;
    sword.rotation.x=s.rx;sword.rotation.y=s.ry;
    root.rotation.y=s.by;
  }
  function reset(){s=null;lastGame=null;}
  return {update,reset};
}
