// Large-scale theatre attacks inspired by Gyuwon's Seulwoo memory, authored
// for the clown's real warning-zone, projectile and four-paw movement systems.
// Scenery cues have no damage; every hit is spawned through the combat engine.
const TAU=Math.PI*2;
const cross=(a,t,v)=>a<v&&t>=v;
const bound=p=>{const r=Math.hypot(p.x,p.z),k=r>24?24/r:1;return {x:p.x*k,z:p.z*k};};
const offset=(p,a,r)=>bound({x:p.x+Math.sin(a)*r,z:p.z+Math.cos(a)*r});
const look=(b,p)=>Math.atan2(p.x-b.x,p.z-b.z);
const circle=(api,g,p,r,warn,damage,sound)=>api.zone(g,{shape:'circle',...bound(p),r,warn,damage,blast:true,major:true,sound});
const tell=(api,g,c,id)=>api.once(c,'horror-intro',()=>api.emit(g,'clown-horror',{cue:id,stage:c.horrorStage||1}));
export const EXTRA_HORROR_DEFINITIONS=Object.freeze([
 ['vanishingAct','사라진 마술사의 세 번째 인사',6.3,1.4,[1],1],
 ['funeralParade','객석에서 행진하는 장례 악단',7.9,1.5,[2],2],
 ['brokenHorses','목이 꺾인 회전목마',7.8,1.5,[2],2],
 ['audienceJudgement','빈 객석의 마지막 판결',8.2,1.7,[2],3],
 ['marionetteDevour','인형줄에 매달린 포식자',8.8,1.7,[2],3]
]);
function vanishingAct(g,c,a,t,api){
 tell(api,g,c,'face');c.vis.glove=t<3.3?.8:0;
 c.vis.neck=t<3.3?.36:0;c.vis.tilt=.38*Math.sin(t*4);
 const p=api.once(c,'vanishing-anchor',()=>bound(g.player));
 if(cross(a,t,.32)){circle(api,g,p,3.5,1.45,24,'wrongTwin');api.emit(g,'clown-horror',{cue:'face',x:p.x,z:p.z});}
 if(cross(a,t,1.84)){const q=offset(p,c.seq%2?1.2:-1.2,5.9);
  circle(api,g,q,3.4,1.4,26,'wrongTwin');api.emit(g,'clown-horror',{cue:'face',x:q.x,z:q.z});}
 if(cross(a,t,3.5)){const q=bound(g.player);circle(api,g,q,3.1,1.35,27,'echoApplause');
  api.emit(g,'clown-horror',{cue:'clap-delay',x:q.x,z:q.z});}
}
// Alternating four giant projectile impacts and a three-beat procession.
// A gap remains between narrow lanes and every projectile is visibly thrown.
function funeralParade(g,c,a,t,api){
 tell(api,g,c,'audience');c.vis.juggle=t<4.2?1:0;
 c.vis.glove=.35+.45*Math.abs(Math.sin(t*3.6));c.vis.neck=.25+.18*Math.sin(t*5);
 const p=api.once(c,'parade-anchor',()=>bound(g.player));
 for(let i=0;i<4;i++)if(cross(a,t,.35+i*1.02)){
  const q=offset(p,c.seq*.36+i*TAU/4,5.6),r=3.05,z=circle(api,g,q,r,1.45,27,'hatchingBalloons');
  api.bomb(g,{kind:'ball',...q,r,fly:1.05,warn:1.45,zone:z.id});
  api.emit(g,'clown-horror',{cue:'mask-fall',x:q.x,z:q.z});
 }
 for(let i=0;i<3;i++)if(cross(a,t,1.22+i*1.38)){
  const x=Math.max(-20,Math.min(20,p.x+[-7,7,0][i]));
  api.zone(g,{shape:'lane',x,z:-19,yaw:0,len:38,w:3.4,
   warn:1.5,damage:i===2?30:26,blast:true,major:true,sound:'stageRupture'});
  api.emit(g,'clown-horror',{cue:'seats',x,z:0});
 }
}
function brokenHorses(g,c,a,t,api){
 tell(api,g,c,'reverse-crawl');c.vis.crouch=.96;c.vis.neck=.76;
 c.vis.tilt=.55*Math.sin(t*6);c.vis.shake=.2+.2*Math.abs(Math.sin(t*13));
 api.crawlPart(g,c,a,t,.48,'broken-horse-left',{reach:13,anticipation:.9,travel:1.15,damage:30,angleOffset:.72});
 if(cross(a,t,2.36)){const q=offset(bound(g.player),c.seq%2?1.2:-1.2,4.8);
  circle(api,g,q,3.4,1.35,26,'foldedCrawl');}
 api.crawlPart(g,c,a,t,3.58,'broken-horse-right',{reach:12,anticipation:.85,travel:1.1,damage:31,angleOffset:-.82});
 if(cross(a,t,5.62)){const q=bound(g.player);circle(api,g,q,3.25,1.35,29,'foldedCrawl');
  api.emit(g,'clown-horror',{cue:'landing',x:q.x,z:q.z});}
}
// Ten audience lights ignite in sequence, deliberately missing two adjacent
// sectors. Two later diagonal seams are separately warned, never instant.
function audienceJudgement(g,c,a,t,api){
 tell(api,g,c,'audience');c.vis.glove=.82;c.vis.neck=.65;
 c.vis.tilt=.34*Math.sin(t*3.5);
 const p=api.once(c,'judgement-anchor',()=>bound(g.player)),gap=c.seq%10;
 for(let i=0;i<10;i++)if(i!==gap&&i!==(gap+1)%10&&cross(a,t,.35+i*.43)){
  const q=offset(p,i*TAU/10,7.3);
  circle(api,g,q,2.05,1.35,23,'clockOfTeeth');
  api.emit(g,'clown-horror',{cue:'seats',x:q.x,z:q.z});
 }
 for(let i=0;i<2;i++)if(cross(a,t,4.45+i)){
  const yaw=look(g.boss,g.player)+(i?-.56:.56);
  api.zone(g,{shape:'lane',x:g.boss.x,z:g.boss.z,yaw,len:19,w:3,
   warn:1.55,damage:31,blast:true,major:true,sound:'stageRupture'});
 }
}
function marionetteDevour(g,c,a,t,api){
 tell(api,g,c,'fold');c.vis.crouch=1;c.vis.neck=.96;
 c.vis.glove=.7+.25*Math.abs(Math.sin(t*7));
 c.vis.tilt=.69*Math.sin(t*6.8);c.vis.shake=.22+.2*Math.abs(Math.sin(t*14));
 api.crawlPart(g,c,a,t,.5,'marionette-first',{reach:12,anticipation:.95,travel:1.12,damage:29,angleOffset:.66});
 api.crawlPart(g,c,a,t,3,'marionette-second',{reach:12,anticipation:.9,travel:1.05,damage:31,angleOffset:-.75});
 api.crawlPart(g,c,a,t,5.45,'marionette-last',{reach:11,anticipation:.95,travel:1.05,damage:33});
 if(cross(a,t,6.72)){const q=offset(bound(g.player),c.seq%2?.8:-.8,4.2);
  circle(api,g,q,3.4,1.35,29,'stolenFace');
  api.emit(g,'clown-horror',{cue:'face',x:q.x,z:q.z});}
}
export const EXTRA_HORROR_RUN=Object.freeze({
 vanishingAct,funeralParade,brokenHorses,audienceJudgement,marionetteDevour
});
