// Three-act ballet score. Pure simulation data shared by combat and the
// presentation rig; a duet uses one boss HP pool and two physical silhouettes.
export const CLOWN_BALLET_THRESHOLDS=Object.freeze({second:.70,third:1/3});
export const BALLET_DEFINITIONS=Object.freeze([
 ['balletPasDeDeux','두 사람의 파드되',6.1,1.55,[3]],
 ['balletMirrorVeils','거울처럼 감기는 팔',6.6,1.55,[3]],
 ['balletFouette','끝나지 않는 푸에테',6.9,1.65,[3]],
 ['balletFinalBow','마지막 인사',8.0,2.0,[3]]
]);
export const BALLET_PATTERNS=Object.freeze(BALLET_DEFINITIONS.map(([key])=>key));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const smooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x)};
const cross=(a,b,t)=>a<t&&b>=t;
const yaw=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const bounded=p=>{const d=Math.hypot(p.x,p.z);const s=d>21?21/d:1;return {x:p.x*s,z:p.z*s}};
export function balletPartnerFrame(g){
 const b=g?.boss||{},c=g?.clown||{},phase=b.phase===3;
 const transition=phase&&b.state==='transition';
 const t=transition?clamp(b.t||0,0,5.2):Math.max(0,c.pt||0);
 const orbit=Number.isFinite(c.duetOrbitYaw)?c.duetOrbitYaw:(c.yaw||0);
 // A consistent onstage pair, not a projectile or an invulnerable illusion.
 // The distance is held while a pattern owns its precise contact geometry.
 const angle=orbit+Math.PI/2;
 const enter=transition?smooth((t-.8)/3.6):1;
 const radius=4.4+(1-enter)*9.5;
 const p=bounded({x:(b.x||0)+Math.sin(angle)*radius,z:(b.z||0)+Math.cos(angle)*radius});
 const name=c.name||'';
 const attack=phase&&!transition&&c.state==='pattern';
 const spin=attack?Math.sin(Math.max(0,t-.5)*3.0)*(.45+(name==='balletFouette'?.75:0)):0;
 const bow=transition?Math.sin(Math.PI*smooth((t-3.6)/1.6))*.30:0;
 const pulse=attack?smooth((t-.4)/.75)*(1-smooth((t-5.6)/1.1)):0;
 return {active:phase,transition,enter,orbit,
  lead:{x:b.x||0,z:b.z||0,yaw:(c.yaw||b.yaw||0)+spin,bow,pulse,spin},
  partner:{x:p.x,z:p.z,yaw:orbit-Math.PI/2-spin*.9,bow,pulse,spin:-spin*.9},
  pattern:name,time:t};
}
function flash(g,c,api,key){api.once(c,'ballet-intro',()=>api.emit(g,'clown-ballet-beat',{pattern:key}));}
function strike(g,c,a,t,api,{at,who='lead',type='circle',radius=3.2,damage=25,delay=1.08,offset=0,index=0}){
 if(!cross(a,t,at))return;
 const f=balletPartnerFrame(g),from=who==='partner'?f.partner:f.lead;
 const target=bounded({x:g.player.x,z:g.player.z});
 if(type==='lane'){
  const direction=yaw(from,target)+offset;
  const length=clamp(Math.hypot(target.x-from.x,target.z-from.z)+2,6,16);
  api.zone(g,{shape:'lane',x:from.x,z:from.z,yaw:direction,len:length,w:2.55,
   warn:delay,damage,blast:false,visual:false,sound:'balletSilkStrike'});
 }else{
  api.zone(g,{shape:'circle',x:from.x,z:from.z,r:radius,warn:delay,
   damage,blast:false,visual:false,sound:'balletWoodenPirouette'});
 }
 api.emit(g,'clown-ballet-cue',{who,index,type,x:from.x,z:from.z,delay});
}
export const BALLET_RUN=Object.freeze({
 balletPasDeDeux(g,c,a,t,api){
  flash(g,c,api,'pas');c.vis.glove=.42;c.vis.tilt=.13*Math.sin(t*2.4);
  strike(g,c,a,t,api,{at:.35,who:'partner',damage:24,index:0,delay:1.18});
  strike(g,c,a,t,api,{at:2.15,who:'lead',damage:27,index:1,delay:1.16});
  strike(g,c,a,t,api,{at:3.83,who:'partner',damage:24,index:2,delay:1.12});
 },
 balletMirrorVeils(g,c,a,t,api){
  flash(g,c,api,'veils');c.vis.glove=.75;c.vis.tilt=.16*Math.sin(t*2);
  strike(g,c,a,t,api,{at:.32,who:'lead',type:'lane',damage:28,delay:1.22,index:0});
  strike(g,c,a,t,api,{at:2.20,who:'partner',type:'lane',damage:28,delay:1.22,index:1});
  strike(g,c,a,t,api,{at:4.10,who:'lead',type:'lane',damage:30,delay:1.20,index:2,offset:.36});
 },
 balletFouette(g,c,a,t,api){
  flash(g,c,api,'fouette');c.vis.glove=.65;c.vis.juggle=.75;
  for(let i=0;i<4;i++)strike(g,c,a,t,api,{at:.45+i*1.30,
   who:i%2?'lead':'partner',radius:3.4,damage:25+i,delay:1.08,index:i});
 },
 balletFinalBow(g,c,a,t,api){
  flash(g,c,api,'finale');c.vis.crouch=.28;c.vis.glove=.55;
  strike(g,c,a,t,api,{at:.50,who:'lead',radius:3.65,damage:29,delay:1.32,index:0});
  strike(g,c,a,t,api,{at:2.45,who:'partner',radius:3.65,damage:29,delay:1.30,index:1});
  strike(g,c,a,t,api,{at:4.45,who:'lead',type:'lane',damage:33,delay:1.42,index:2});
 }
});
