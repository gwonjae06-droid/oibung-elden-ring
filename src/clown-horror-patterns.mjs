// The nightmare programme uses the original zone/bomb engine. Every damaging
// prop has an authored delay and a real floor spotlight; uncanny silhouettes,
// harmless false performers, and environmental effects NEVER call hurt().
const TAU=Math.PI*2;
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const cross=(a,t,v)=>a<v&&t>=v;
const yawTo=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const bound=p=>{const d=Math.hypot(p.x,p.z),m=d>20?20/d:1;return {x:p.x*m,z:p.z*m};};
export const HORROR_DEFINITIONS=Object.freeze([
 ['echoApplause','반 박자 늦은 박수',5.7,1.3,[1,2],1],
 ['wrongTwin','누가 진짜 광대일까요',5.5,1.5,[1,2],1],
 ['livingShadow','그림자가 먼저 웃는다',5.4,1.55,[1,2],1],
 ['hatchingBalloons','풍선은 터지지 않고 태어난다',6.2,1.55,[1,2],1],
 ['porcelainRain','관객의 얼굴이 떨어진다',6.3,1.7,[2],2],
 ['foldedCrawl','접힌 몸으로 기어오는 것',5.5,1.65,[2],2],
 ['emptyAudience','아무도 없는 객석의 박수',6.1,1.65,[2],2],
 ['curtainNightmare','커튼 뒤의 무대',6.6,1.85,[2],3],
 ['clockOfTeeth','열두 개의 미소',6.5,1.8,[2],3],
]);
export const HORROR_PATTERNS=Object.freeze(HORROR_DEFINITIONS.map(([key])=>key));
export const horrorMinStage=key=>HORROR_DEFINITIONS.find(a=>a[0]===key)?.[5]??1;
const tell=(api,g,c,key)=>api.once(c,'horror-intro',()=>{
 api.emit(g,'clown-horror',{cue:key,stage:c.horrorStage||1});
});
const circle=(api,g,p,r,warn,damage,sound)=>api.zone(g,{
 shape:'circle',...bound(p),r,warn,damage,blast:true,major:true,sound
});
const offset=(p,angle,r)=>bound({x:p.x+Math.sin(angle)*r,z:p.z+Math.cos(angle)*r});
function echoApplause(g,c,a,t,api){
 tell(api,g,c,'echo');c.vis.glove=.25+.7*Math.abs(Math.sin(t*3.5));
 c.vis.tilt=Math.sin(t*3.7)*.13;
 for(let i=0;i<3;i++)if(cross(a,t,.24+i*1.23)){
  const p=bound(g.player),q=offset(p,c.seq*1.7+i*2.2,i===0?0:4.7);
  circle(api,g,q,3.5+i*.45,1.08,23+i*3,'echoApplause');
  api.emit(g,'clown-horror',{cue:i===2?'echo-final':'clap-delay',x:q.x,z:q.z});
 }
}
function wrongTwin(g,c,a,t,api){
 tell(api,g,c,'double');
 c.vis.tilt=t<2.9?Math.sin(t*6)*.27:0;
 c.vis.neck=t<2.5?.24:0;
 const p=api.once(c,'twin-anchor',()=>bound(g.player));
 // Four visible decoys are scenery; only the one physically lit by the
 // ordinary damage-zone spotlight can ever hurt.
 if(cross(a,t,.35)){
  const angle=(c.seq%4)*Math.PI/2;
  const real=offset(p,angle,4.1);
  circle(api,g,real,3.4,1.55,30,'wrongTwin');
  c.f.trueTwin=real;
 }
 if(cross(a,t,2.1)){
  const q=offset(bound(g.player),(c.seq%2?.85:-.85),2.6);
  circle(api,g,q,3.1,1.2,26,'wrongTwin');
 }
}
function livingShadow(g,c,a,t,api){
 tell(api,g,c,'shadow');
 c.vis.tilt=t<2.7?.3*Math.sin(t*7):0;
 c.vis.glove=t<1.7?.15:0;
 if(cross(a,t,.32)){
  const anchor=bound(g.player),from=bound({x:g.boss.x,z:g.boss.z});
  const yaw=yawTo(from,anchor),len=Math.max(6,Math.min(15,Math.hypot(anchor.x-from.x,anchor.z-from.z)+3));
  // The shadow visibly stretches on the same lane that the spotlight warns.
  c.f.shadowLane={x:from.x,z:from.z,yaw,len};
  api.zone(g,{shape:'lane',x:from.x,z:from.z,yaw,len,w:3.7,warn:1.5,damage:29,blast:true,sound:'livingShadow'});
 }
 if(cross(a,t,2.55)){
  const q=bound(g.player);
  circle(api,g,q,3.4,1.12,24,'livingShadow');
 }
}
function hatchingBalloons(g,c,a,t,api){
 tell(api,g,c,'hatch');c.vis.juggle=t<2.7?1:0;
 c.vis.crouch=.25*Math.abs(Math.sin(t*4));
 const anchor=api.once(c,'hatch-anchor',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.28+i*.57)){
  const q=offset(anchor,i*TAU/4+.35,4.9);
  const warn=1.5+i*.12,r=2.6;
  const z=circle(api,g,q,r,warn,25,'hatchingBalloons');
  api.bomb(g,{kind:'head',...q,r,fly:.72,warn,zone:z.id});
  api.emit(g,'clown-horror',{cue:'hatch-twist',x:q.x,z:q.z});
 }
 if(cross(a,t,3.6)){
  circle(api,g,anchor,3.0,1.08,28,'hatchingBalloons');
 }
}
function porcelainRain(g,c,a,t,api){
 tell(api,g,c,'porcelain');
 c.vis.juggle=t<3?1:0;c.vis.glove=Math.min(1,t/1.4);
 const p=api.once(c,'masks-anchor',()=>bound(g.player));
 for(let i=0;i<6;i++)if(cross(a,t,.45+i*.5)){
  // Deliberate holes in the fall pattern: read the falling masks, not a
  // random instant strike at the player's current feet.
  const q=offset(p,i*TAU/6+c.seq*.31,i%2?5.9:3.2),warn=1.3;
  circle(api,g,q,2.7,warn,23+i%2*3,'porcelainRain');
  api.emit(g,'clown-horror',{cue:'mask-fall',x:q.x,z:q.z});
 }
}
function foldedCrawl(g,c,a,t,api){
 tell(api,g,c,'fold');
 const u=t;
 c.vis.crouch=u<3.4?.92:Math.max(0,1-(u-3.4)*1.2);
 c.vis.tilt=u<3.5?Math.sin(u*11)*.49:0;
 c.vis.neck=u<3.5?.75:0;
 c.vis.shake=u<3.5?.3:0;
 // Reuse the battle's real physics-aware charge instead of a fabricated
 // lane damage area. The lane warning comes before the body starts moving.
 api.dashPart(g,c,a,t,.65,'folded-charge');
 if(cross(a,t,2.25)){
  const q=bound(g.player);
  circle(api,g,q,3.7,1.25,28,'foldedCrawl');
 }
}
function emptyAudience(g,c,a,t,api){
 tell(api,g,c,'audience');c.vis.glove=.2+.55*Math.abs(Math.sin(t*2));
 c.vis.tilt=t<3?Math.sin(t*3)*.2:0;
 const anchor=api.once(c,'audience-anchor',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.4+i*.95)){
  const q=offset(anchor,c.seq*1.32+i*TAU/4,5);
  circle(api,g,q,3.2,1.1,25,'emptyAudience');
  api.emit(g,'clown-horror',{cue:'seats',x:q.x,z:q.z});
 }
}
function curtainNightmare(g,c,a,t,api){
 tell(api,g,c,'curtain');c.vis.tilt=t<2.7?Math.sin(t*4)*.31:0;
 c.vis.glove=t<3?1:Math.max(0,1-(t-3)*.7);
 const anchor=api.once(c,'curtain-anchor',()=>bound(g.player));
 // Curtains shift the scenery; the lethal areas stay completely visible
 // through warm footlight spots and leave a deliberate escape gap.
 for(let i=0;i<3;i++)if(cross(a,t,.38+i*1.08)){
  const q=offset(anchor,i*TAU/3+.24,5.2);
  circle(api,g,q,4.0,1.35,32,'curtainNightmare');
  api.emit(g,'clown-horror',{cue:'curtain-hit',x:q.x,z:q.z});
 }
 if(cross(a,t,3.1))circle(api,g,anchor,3.6,1.2,30,'curtainNightmare');
}
function clockOfTeeth(g,c,a,t,api){
 tell(api,g,c,'teeth');c.vis.glove=.8;
 c.vis.neck=t<3.7?.4:0;c.vis.tilt=Math.sin(t*6)*.29;
 const center=api.once(c,'teeth-center',()=>bound(g.player));
 // A rotating clock with three missing teeth that always leave a safe
 // corridor: no unavoidable arena-wide punishment.
 for(let i=0;i<9;i++)if(cross(a,t,.23+i*.37)){
  const a=i*TAU/12+c.seq*.27;
  const q=offset(center,a,6.4);
  circle(api,g,q,2.2,1.15,21,'clockOfTeeth');
 }
 if(cross(a,t,4.4))api.emit(g,'clown-horror',{cue:'teeth-end'});
}
export const HORROR_RUN=Object.freeze({
 echoApplause,wrongTwin,livingShadow,hatchingBalloons,
 porcelainRain,foldedCrawl,emptyAudience,curtainNightmare,clockOfTeeth
});
