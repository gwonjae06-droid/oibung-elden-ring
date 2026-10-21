export const sat=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
export function bombPose(q,phase=1){
 const k=q.kind==='roll'?sat(q.t/1.2):sat(q.t/q.fly),land=q.kind==='roll'||q.t>=q.fly,final=q.kind==='roll'?sat((q.t-1.2)/.7):sat((q.t-q.fly)/Math.max(.01,q.warn-q.fly));
 const startY=q.from.y+(q.kind==='head'?1.92:0)+(phase===2?.4:0);
 return {x:q.kind==='roll'?q.px:q.from.x+(q.x-q.from.x)*k,z:q.kind==='roll'?q.pz:q.from.z+(q.z-q.from.z)*k,y:q.kind==='roll'?2.1:startY*(1-k)+2.1*k+Math.sin(Math.PI*k)*4,land,final,inflate:q.kind==='ball'?.45:land?3.1+final*.6:3.1,stretch:land?-.25*(1-final):.2,spin:q.kind==='roll'?q.t*8:k*2};
}
export function headFrame(g){
 const c=g.clown,v=c.vis,b=g.boss;let pose=v.pose,k=v.k,inflate=null,stretch=b.phase===2?.12:0,burst=false;
 if(b.state==='transition'){const t=b.t;if(t<3.2){pose='inflate';k=sat(t/3.2);inflate=1+5*smooth(k);}else{pose='regrow';k=sat((t-3.8)/1.4);burst=t<3.8;inflate=burst?.3:null;}stretch=.2;}
 else if(c.name==='tripleBomb'&&c.pt>=1.2&&c.pt<2.9)inflate=.3+3.1*smooth(k);
 return {pose,k,inflate,stretch,burst};
}
export function selectedWeapon(weapon){return ['sword','hammer','bow','cards'].includes(weapon)?weapon:'sword';}
