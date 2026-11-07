// Six large-scale concert acts. No pattern text, no decorative fake attacks:
// every strike is an ordinary delayed combat zone with an escape route.
import {cueCircusShow,stageCircusBeat} from './clown-troupe.mjs';
const TAU=Math.PI*2;
const cross=(a,t,x)=>a<x&&t>=x;
const safe=p=>{const r=Math.hypot(p.x,p.z);return r>22.5?{x:p.x*22.5/r,z:p.z*22.5/r}:p;};
const point=(p,a,r)=>safe({x:p.x+Math.sin(a)*r,z:p.z+Math.cos(a)*r});
const performer=(g,role,index=0)=>{
 const cast=(g.clown?.troupe?.members||[]).filter(m=>!m.down&&m.role===role);
 return cast[index%Math.max(1,cast.length)]||g.boss;
};
const shout=(g,c,api,show)=>api.once(c,'troupe-show-'+show,()=>{
 cueCircusShow(g,show);api.emit(g,'clown-troupe-show',{show});return true;
});
export const TROUPE_DEFINITIONS=Object.freeze([
 ['ghostProcession','복면 환영들의 입장',6.8,1.5,[1,2],1],
 ['puppetOverture','빈 객석의 인형극',7.4,1.65,[1,2],1],
 ['infernalHoops','화염 고리의 공중곡예',8.3,1.7,[1,2],1],
 ['choirOfAshes','유령 악단의 합창',8.4,1.7,[2],2],
 ['curtainStampede','장막 속 단원들의 습격',8.7,1.8,[2],2],
 ['midnightGrandFinale','악몽 서커스의 전원 피날레',10.2,2.2,[2],3],
 ['mimicMirrorExchange','거울 가면의 교대',6.7,1.6,[1,2],1],
 ['acrobatKnifeWaltz','끝없이 뒤집히는 곡예',7.8,1.65,[2],2],
 ['puppetMarionetteScissors','인형줄의 교차 절단',8.2,1.65,[2],2],
 ['choristerThroatCanon','목소리가 엇갈리는 합창',8.4,1.7,[2],2],
 ['firekeeperCinderSpiral','불꽃 봉화의 공전',8.5,1.75,[2],2],
 ['grandCastCounterpoint','서커스 전원의 불협화음',10.4,2.1,[2],3]
]);
function ghostProcession(g,c,a,t,api){
 shout(g,c,api,'twins');
 const p=api.once(c,'ghost-position',()=>safe({...g.player}));
 for(let i=0;i<4;i++)if(cross(a,t,.25+i*1.08)){
  const angle=i*TAU/4+.5,q=point(p,angle,5.8);
  api.zone(g,{shape:'circle',...q,r:2.8,warn:1.2,damage:22,major:true,sound:'falseRingmaster'});
  api.emit(g,'clown-troupe-cast',{role:'mimic',wind:1.2,x:q.x,z:q.z});
 }
}
function puppetOverture(g,c,a,t,api){
 shout(g,c,api,'puppets');
 const p=api.once(c,'puppet-centre',()=>safe({...g.player}));
 for(let i=0;i<5;i++)if(cross(a,t,.3+i*.9)){
  const doll=performer(g,'puppeteer',i),q=safe({x:doll.x,z:doll.z}),
   towards=Math.atan2(p.x-q.x,p.z-q.z),distance=Math.hypot(p.x-q.x,p.z-q.z);
  doll.cast=Math.max(doll.cast||0,1.35);
  api.zone(g,{shape:'lane',x:q.x,z:q.z,yaw:towards,len:Math.min(19,distance+2),w:2.7,warn:1.35,damage:22,sound:'puppet'});
 }
}
function infernalHoops(g,c,a,t,api){
 shout(g,c,api,'fire');
 const p=api.once(c,'fire-centre',()=>safe({...g.player}));
 const gap=(c.seq||0)%8;
 for(let i=0;i<8;i++)if(cross(a,t,.24+i*.43)&&i!==gap&&i!==(gap+1)%8){
  const q=point(p,i*TAU/8,7);
  api.zone(g,{shape:'circle',...q,r:2.1,warn:1.42,damage:22,blast:true,sound:'infernalHoops'});
  api.emit(g,'clown-troupe-cast',{role:'firekeeper',x:q.x,z:q.z,wind:1.42});
 }
 if(cross(a,t,4.6))api.zone(g,{shape:'circle',...safe({...g.player}),r:3.3,warn:1.45,damage:28,blast:true,sound:'infernalHoops'});
}
function choirOfAshes(g,c,a,t,api){
 shout(g,c,api,'chorus');
 const p=api.once(c,'choir-centre',()=>safe({...g.player})),gap=(c.seq||0)%6;
 // Alternate notes come from physically present choristers, never
 // all directions at once. A pair of adjacent aisles is always free.
 for(let i=0;i<6;i++)if(cross(a,t,.35+i*.82)&&i!==gap&&i!==(gap+1)%6){
  const singer=performer(g,'chorister',i),edge=safe({x:singer.x,z:singer.z}),
   yaw=Math.atan2(p.x-edge.x,p.z-edge.z),len=Math.min(20,Math.hypot(p.x-edge.x,p.z-edge.z)+2);
  singer.cast=Math.max(singer.cast||0,1.36);
  api.zone(g,{shape:'lane',...edge,yaw,len,w:2.7,warn:1.36,damage:24,sound:'choir'});
 }
 if(cross(a,t,5.15))api.zone(g,{shape:'circle',...p,r:4.7,warn:1.45,damage:28,sound:'choir'});
}
function curtainStampede(g,c,a,t,api){
 shout(g,c,api,'stampede');
 const target=api.once(c,'stampede-anchor',()=>safe({...g.player}));
 const holes=(c.seq||0)%5;
 for(let side=0;side<2;side++)for(let i=0;i<5;i++)if(i!==holes&&cross(a,t,.4+side*3+i*.48)){
  const off=(i-2)*5.3;
  api.zone(g,{shape:'lane',x:off,z:side===0?-16:16,yaw:side===0?0:Math.PI,
   len:32,w:2.25,warn:1.42,damage:25,sound:'acrobat'});
 }
 if(cross(a,t,6.35))api.zone(g,{shape:'circle',...target,r:3.1,warn:1.35,damage:27,sound:'puppet'});
}
function midnightGrandFinale(g,c,a,t,api){
 shout(g,c,api,'finale');
 const p=api.once(c,'finale-anchor',()=>safe({...g.player})),gap=(c.seq||0)%10;
 // Three distinct beats. Each circle is warned before it can hurt.
 for(let i=0;i<10;i++)if(i!==gap&&i!==(gap+1)%10&&cross(a,t,.2+i*.27)){
  const q=point(p,i*TAU/10,9.0);
  api.zone(g,{shape:'circle',...q,r:2.35,warn:1.45,damage:25,blast:i%3===0,sound:i%2?'choir':'infernalHoops'});
 }
 for(let i=0;i<3;i++)if(cross(a,t,4.1+i*1.1)){
  const q=point(p,Math.PI+i*.65,6.4);
  api.zone(g,{shape:'lane',...q,yaw:Math.atan2(p.x-q.x,p.z-q.z),len:13,w:2.5,
   warn:1.4,damage:29,sound:'puppet'});
 }
 if(cross(a,t,7.75)){
  const q=safe({...g.player});
  api.zone(g,{shape:'circle',...q,r:3.2,warn:1.45,damage:34,blast:true,sound:'choir'});
 }
}

// New ensemble roles perform their *own* readable movements. Every attack
// position is locked when its actor bends/inhales/raises the prop; no free
// orbital AI is allowed to turn a committed warning into an invisible hit.
const rank=(g,role,i,pose,wind=1.42)=>{
 const performerOnStage=performer(g,role,i);
 const actual=stageCircusBeat(g,{role,index:i,pose,wind,hold:wind+.65});
 return actual||performerOnStage;
};
const focus=(api,c,key,p)=>api.once(c,key,()=>safe(p));
const lane=(api,g,actor,p,{warn=1.42,width=2.4,damage=19,sound='acrobat',rotation=0}={})=>{
 const theta=Math.atan2(p.x-actor.x,p.z-actor.z)+rotation;
 const len=Math.max(3,Math.min(19,Math.hypot(p.x-actor.x,p.z-actor.z)+2.5));
 return api.zone(g,{shape:'lane',x:actor.x,z:actor.z,yaw:theta,
  len,w:width,warn,damage,sound,major:false});
};
function mimicMirrorExchange(g,c,a,t,api){
 shout(g,c,api,'twins');
 const target=focus(api,c,'mimic-duel-focus',safe(g.player));
 for(let i=0;i<3;i++)if(cross(a,t,.4+i*1.35)){
  const p=rank(g,'mimic',i,'mirror');
  const aimed=point(target,(i-1)*.42,1.3);
  lane(api,g,p,aimed,{warn:1.36,width:2.4,damage:18,sound:'falseRingmaster'});
 }
}
function acrobatKnifeWaltz(g,c,a,t,api){
 shout(g,c,api,'trapeze');
 const target=focus(api,c,'knife-waltz-focus',safe(g.player));
 for(let i=0;i<5;i++)if(cross(a,t,.4+i*1.11)){
  const p=rank(g,'acrobat',i,'vault');
  const aimed=point(target,i%2?1.21:-1.21,2.8);
  lane(api,g,p,aimed,{warn:1.48,width:2.45,damage:i===4?23:19,sound:'acrobat'});
 }
}
function puppetMarionetteScissors(g,c,a,t,api){
 shout(g,c,api,'puppets');
 const target=focus(api,c,'puppet-cut-focus',safe(g.player));
 for(let i=0;i<5;i++)if(cross(a,t,.35+i*1.15)){
  const p=rank(g,'puppeteer',i,'strings');
  const aimed=point(target,i%2?1.35:-1.35,i===4?1.8:3.6);
  lane(api,g,p,aimed,{warn:1.52,width:2.3,damage:20,sound:'marionette'});
 }
}
function choristerThroatCanon(g,c,a,t,api){
 shout(g,c,api,'chorus');
 const target=focus(api,c,'throat-score-focus',safe(g.player));
 for(let i=0;i<5;i++)if(cross(a,t,.45+i*1.21)){
  const p=rank(g,'chorister',i,'sing');
  const aimed=point(target,i%2?1.02:-1.02,2.1);
  lane(api,g,p,aimed,{warn:1.50,width:2.55,damage:i===4?24:19,sound:'choir'});
 }
}
function firekeeperCinderSpiral(g,c,a,t,api){
 shout(g,c,api,'fire');
 const target=focus(api,c,'firekeeper-ring-focus',safe(g.player)),gap=c.seq%9;
 for(let i=0;i<9;i++)if(i!==gap&&i!==(gap+1)%9&&cross(a,t,.31+i*.47)){
  const p=rank(g,'firekeeper',i,'hoop');
  const q=point(target,i*TAU/9,7.3);
  api.zone(g,{shape:'circle',...q,r:2.1,warn:1.48,damage:18,
   blast:false,sound:'infernalHoops',major:false});
 }
}
function grandCastCounterpoint(g,c,a,t,api){
 shout(g,c,api,'finale');
 const target=focus(api,c,'counterpoint-focus',safe(g.player));
 const roles=['acrobat','puppeteer','chorister','mimic','firekeeper','puppeteer'];
 const modes=['vault','strings','sing','mirror','hoop','strings'];
 for(let i=0;i<6;i++)if(cross(a,t,.4+i*1.25)){
  const role=roles[i],actor=rank(g,role,i,modes[i]);
  const aimed=point(target,(i%2?1:-1)*1.1,3.5);
  lane(api,g,actor,aimed,{warn:1.48,damage:22+i%2*3,width:2.45,
   sound:role==='chorister'?'choir':role==='firekeeper'?'infernalHoops':role==='puppeteer'?'puppet':'acrobat'});
 }
}
export const TROUPE_RUN=Object.freeze({ghostProcession,puppetOverture,infernalHoops,
 choirOfAshes,curtainStampede,midnightGrandFinale,
 mimicMirrorExchange,acrobatKnifeWaltz,puppetMarionetteScissors,
 choristerThroatCanon,firekeeperCinderSpiral,grandCastCounterpoint});
