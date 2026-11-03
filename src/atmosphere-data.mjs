export const AMBIENT_LIMIT=140;
export const AMBIENT_RADIUS=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function atmosphereMood(g){
 const phase=g&&g.boss&&g.boss.phase===2?2:1;
 if(g&&g.clown)return {kind:'circus',phase,a:phase===2?[1,.3,.55]:[1,.78,.3],b:phase===2?[.55,.35,1]:[.45,.78,1],rise:.5,sway:.9,speed:phase===2?1.25:1,alpha:phase===2?.95:.8};
 return {kind:'ruins',phase,a:phase===2?[1,.28,.16]:[1,.62,.3],b:phase===2?[1,.55,.2]:[.7,.78,.65],rise:phase===2?1.5:.9,sway:.5,speed:phase===2?1.5:1,alpha:phase===2?1:.75};
}
function spawn(radius,random,anywhere){const a=random()*Math.PI*2,r=Math.sqrt(random())*radius;return {x:Math.sin(a)*r,y:anywhere?random()*9:random()*.6,z:Math.cos(a)*r,seed:random()*Math.PI*2,tint:random(),rise:.4+random()*.9,twinkle:.6+random()*1.4,alpha:1};}
export function createAmbientField({count=AMBIENT_LIMIT,radius=AMBIENT_RADIUS,random=Math.random}={}){
 const n=Number.isFinite(count)?Math.max(0,Math.min(AMBIENT_LIMIT,Math.floor(count))):0,particles=[];
 for(let i=0;i<n;i++)particles.push(spawn(radius,random,true));
 return {radius,random,particles};
}
export function stepAmbientField(field,dt,time,mood){
 const h=Number.isFinite(dt)?clamp(dt,0,.05):0;
 if(!h)return;
 const m=mood||atmosphereMood(null),t=Number.isFinite(time)?time:0;
 for(const p of field.particles){
  p.y+=p.rise*m.rise*m.speed*h;
  p.x+=Math.sin(t*.7+p.seed)*m.sway*h*.8;
  p.z+=Math.cos(t*.5+p.seed*1.3)*m.sway*h*.8;
  p.alpha=clamp(.35+.65*Math.abs(Math.sin(t*p.twinkle+p.seed)),0,1)*m.alpha*clamp((9-p.y)/3,0,1);
  if(p.y>9||Math.hypot(p.x,p.z)>field.radius+2)Object.assign(p,spawn(field.radius,field.random,false));
 }
}
