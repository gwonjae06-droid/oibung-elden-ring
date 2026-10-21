import {createGame,step as baseStep,rolling,clamp,angleDelta} from './combat.mjs';
export const ARENA=23,BALL_LIMIT=19.5,BODY_R=3.3,CLOWN_HP=2000,FLY=.9,SWELL=.55,HUG_DIST=3.8,HUG_TIME=2.2,HEAD_Y=9.9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),toward=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const emit=(g,type,data={})=>g.events.push({type,...data});
const crossed=(a,t,at)=>a<at&&t>=at;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const confineTo=(o,r)=>{const d=Math.hypot(o.x,o.z);if(d>r){o.x*=r/d;o.z*=r/d;}};
const newVis=()=>({pose:'idle',k:0,mode:'full',crouch:0,glove:0,neck:0,neckTarget:null,tilt:0,juggle:0,jump:0,shake:0,throwK:0,stomp:0});
const resetVis=c=>{c.vis=newVis();};
const setHead=(c,pose,k,mode='full')=>{c.vis.pose=pose;c.vis.k=clamp(k,0,1);c.vis.mode=mode;};
export function inZone(z,p){
 if(z.shape==='lane'){const dx=p.x-z.x,dz=p.z-z.z,along=dx*Math.sin(z.yaw)+dz*Math.cos(z.yaw),lat=dx*Math.cos(z.yaw)-dz*Math.sin(z.yaw);return along>=0&&along<=z.len&&Math.abs(lat)<=z.w/2;}
 if(dist(z,p)>=z.r)return false;
 return z.shape==='circle'||Math.abs(angleDelta(z.yaw,toward(z,p)))<z.half;
}
export function hurt(g,damage,src){
 const p=g.player,c=g.clown;if(g.status!=='playing'||g.boss.state==='transition')return false;
 c.hits.push({src,t:g.time});if(c.hits.length>128)c.hits.shift();
 if(p.invuln>0)return false;
 if(rolling(p)){g.stats.dodges++;emit(g,'dodge');return false;}
 p.hp=Math.max(0,p.hp-damage);p.invuln=.32;p.action={kind:'hurt',t:0,total:.22};emit(g,'player-hit',{amount:damage});g.hitstop=Math.max(g.hitstop||0,.07);
 if(!p.hp){g.status='lost';emit(g,'death');}return true;
}
function addZone(g,z){const zone={id:g.nextId++,age:0,state:'warn',fade:0,kind:'danger',damage:0,final:0,blast:false,visual:false,...z};g.clown.zones.push(zone);emit(g,'clown-zone',{id:zone.id,shape:zone.shape,warn:zone.warn});return zone;}
function updateZones(g,dt){
 for(const z of g.clown.zones){if(z.state==='warn'){z.age+=dt;if(z.age>=z.warn){z.state='burst';z.fade=.28;
  if(!z.visual&&inZone(z,g.player)){if(z.kind==='push'){if(!rolling(g.player)){const a=dist(z,g.player)<.001?g.player.yaw+Math.PI:toward(z,g.player);g.player.x+=Math.sin(a)*2.5;g.player.z+=Math.cos(a)*2.5;confineTo(g.player,ARENA);emit(g,'clown-shove');}}else if(z.damage>0)hurt(g,z.damage,z.id);}
  if(!z.visual)emit(g,'clown-impact',{key:z.sound||g.clown.name,x:z.x,z:z.z});
  if(z.blast)emit(g,'clown-blast',{x:z.x,z:z.z,r:z.r});
 }}else z.fade-=dt;}
 g.clown.zones=g.clown.zones.filter(z=>z.state==='warn'||z.fade>0);
}
function spawnBomb(g,o){const b=g.boss,bomb={id:g.nextId++,t:0,fly:FLY,warn:FLY+SWELL,from:{x:b.x,y:HEAD_Y,z:b.z},...o};g.clown.bombs.push(bomb);emit(g,'clown-throw',{kind:bomb.kind});return bomb;}
function lockTarget(g,limit=ARENA-1){const p={x:g.player.x,z:g.player.z};confineTo(p,limit);return p;}
function bombAt(g,p,r=1.9,damage=22,fly=.85,kind='ball',swell=0){const warn=fly+swell,z=addZone(g,{shape:'circle',...p,r,warn,damage,final:swell||.3,blast:true});return spawnBomb(g,{kind,...p,r,fly,warn,zone:z.id});}
function throwHead(g,r,damage){return bombAt(g,lockTarget(g),r,damage,FLY,'head',SWELL);}
function throwBall(g){return bombAt(g,lockTarget(g));}
function fitLen(b,yaw,len){for(let i=0;i<64&&Math.hypot(b.x+Math.sin(yaw)*len,b.z+Math.cos(yaw)*len)>BALL_LIMIT;i++)len=Math.max(0,len-.5);return len;}
function cone(g,yaw,warn,r=10,half=.32,damage=27,sound='hornFan'){return addZone(g,{shape:'cone',x:g.boss.x,z:g.boss.z,yaw,r,half,warn,damage,sound});}
function rosette(g,center,radius,warn,count=10,damage=25,gap=0){for(let i=0;i<count;i++){if(i===gap||i===(gap+1)%count)continue;const a=i/count*Math.PI*2,p={x:center.x+Math.sin(a)*radius,z:center.z+Math.cos(a)*radius};if(Math.hypot(p.x,p.z)<ARENA-1)addZone(g,{shape:'circle',...p,r:1.7,warn,damage,blast:true});}}
export const PATTERNS={
 laughBomb:{name:'웃음 폭탄',dur:5.1,recover:1.4,phases:[1,2]},
 dash:{name:'곡예 돌진',dur:4.5,recover:1.1,phases:[1,2]},
 juggle:{name:'저글링 낙하',dur:4.5,recover:1.2,phases:[1,2]},
 clap:{name:'풍선 박수',dur:3.4,recover:1.1,phases:[1,2]},
 bounce:{name:'공 튀기기',dur:3.6,recover:1.1,phases:[1,2]},
 shove:{name:'관객 밀어내기',dur:1.6,recover:1,phases:[1,2]},
 tripleBomb:{name:'삼중 웃음 폭탄',dur:6.65,recover:2.1,phases:[2]},
 rollingSmile:{name:'굴러오는 미소',dur:5,recover:1.7,phases:[2]},
 inverseBow:{name:'거꾸로 된 인사',dur:3.8,recover:1.1,phases:[2]},
 lastClap:{name:'마지막 박수',dur:5.35,recover:1.7,phases:[2]},
 confettiCurtain:{name:'색종이 커튼',dur:4.6,recover:1.2,phases:[1,2]},
 hornFan:{name:'나팔 부채꼴',dur:4.1,recover:1.1,phases:[1,2]},
 drumMarch:{name:'행진 북 연타',dur:4.8,recover:1.2,phases:[1,2]},
 balloonBouquet:{name:'풍선 꽃다발',dur:5,recover:1.2,phases:[1,2]},
 carousel:{name:'회전목마',dur:5.6,recover:1.2,phases:[1,2]},
 curtainCall:{name:'커튼콜',dur:7.2,recover:1.5,phases:[2]}
};
function dashPart(g,c,a,t,start,key){
 const b=g.boss;if(t<start)return;
 if(!c.f[key]){const yaw=toward(b,g.player);c.f[key]={x:b.x,z:b.z,yaw,len:fitLen(b,yaw,12),hit:false};c.yaw=yaw;addZone(g,{shape:'lane',...c.f[key],w:BODY_R*2,warn:.95,visual:true});emit(g,'clown-stomp');}
 const L=c.f[key],u=t-start;c.vis.stomp=u<.9?Math.abs(Math.sin(u*16)):0;c.vis.crouch=u<.9?smooth(u/.9):0;
 if(crossed(a,t,start+.9))emit(g,'clown-dash');
 if(u>=.9&&u<=1.35){const k=clamp((u-.9)/.45,0,1),x=L.x+Math.sin(L.yaw)*L.len*k,z=L.z+Math.cos(L.yaw)*L.len*k;c.odo+=Math.hypot(x-b.x,z-b.z);b.x=x;b.z=z;c.noSeparate=true;if(!L.hit&&dist(g.player,b)<BODY_R){L.hit=true;hurt(g,30,'dash'+key);}}
 else if(u>1.35&&!L.done){const x=L.x+Math.sin(L.yaw)*L.len,z=L.z+Math.cos(L.yaw)*L.len;c.odo+=Math.hypot(x-b.x,z-b.z);b.x=x;b.z=z;L.done=true;c.noSeparate=false;}
}
const RUN={
 laughBomb(g,c,a,t){if(!c.f.s){c.f.s=1;emit(g,'clown-inflate');}if(t<1.4){setHead(c,'inflate',t/1.4);c.vis.shake=t/1.4;}else if(t<1.65)setHead(c,'hold',1);if(crossed(a,t,1.4))emit(g,'clown-silence');if(crossed(a,t,1.65)){throwHead(g,3.2,34);if(g.boss.phase===2)c.f.echo=lockTarget(g);}if(c.f.echo&&crossed(a,t,2.6))addZone(g,{shape:'circle',...c.f.echo,r:4,warn:.9,damage:24,blast:true});if(t>=1.65){c.vis.throwK=clamp((t-1.65)/.35,0,1);setHead(c,'regrow',(t-1.65)/3.45,'small');}},
 dash(g,c,a,t){dashPart(g,c,a,t,0,'lane');if(g.boss.phase===2)dashPart(g,c,a,t,1.8,'returnLane');},
 juggle(g,c,a,t){if(!c.f.s){c.f.s=1;emit(g,'clown-juggle');}c.vis.juggle=t<2.6?1:0;for(const at of(g.boss.phase===2?[.8,1.15,1.5,1.85,2.2]:[.9,1.25,1.6]))if(crossed(a,t,at))throwBall(g);},
 clap(g,c,a,t){if(!c.f.z){c.f.z=1;c.yaw=toward(g.boss,g.player);cone(g,c.yaw,.85,4.8,.873,28,'clap');}c.vis.glove=t<.85?smooth(t/.85):smooth(1-(t-.85));if(crossed(a,t,.85))emit(g,'clown-clap');if(g.boss.phase===2&&crossed(a,t,1.1)){cone(g,c.yaw-.65,.75,5.4,.43,26,'clap');cone(g,c.yaw+.65,1.1,5.4,.43,26,'clap');}},
 bounce(g,c,a,t){if(!c.f.z)c.f.z=addZone(g,{shape:'circle',x:g.boss.x,z:g.boss.z,r:4.8,warn:1,damage:30});c.vis.crouch=t<.7?smooth(t/.7):0;c.vis.jump=t>=.7&&t<=1?Math.sin(Math.PI*(t-.7)/.3):0;if(crossed(a,t,1)){emit(g,'clown-bounce');rosette(g,g.boss,7,.8,10,24,c.seq%10);if(g.boss.phase===2)rosette(g,g.boss,10,1.3,12,26,c.seq%12);}},
 shove(g,c,a,t){if(!c.f.z){c.shoveCd=4;c.f.z=addZone(g,{shape:'circle',x:g.boss.x,z:g.boss.z,r:3.5,warn:.6,kind:'push'});}c.vis.tilt=t<.6?smooth(t/.6):smooth(1-(t-.6)/.4);},
 tripleBomb(g,c,a,t){const T=[1.2,2.05,2.9],S=[0,1.2,2.05];if(!c.f.s){c.f.s=1;emit(g,'clown-inflate');}if(t<2.9){const i=t<1.2?0:t<2.05?1:2;setHead(c,'inflate',(t-S[i])/(T[i]-S[i]));c.vis.shake=.6;}for(let i=0;i<T.length;i++)if(crossed(a,t,T[i]))bombAt(g,lockTarget(g),2.7+i*.2,30,FLY,'head',.4+i*.15);if(t>=2.9)setHead(c,'regrow',(t-2.9)/3.75,'small');},
 rollingSmile(g,c,a,t){if(!c.f.lane){const b=g.boss,yaw=toward(b,g.player),len=fitLen(b,yaw,14),ex=b.x+Math.sin(yaw)*len,ez=b.z+Math.cos(yaw)*len;c.f.lane={x:b.x,z:b.z,yaw,len,ex,ez};c.yaw=yaw;addZone(g,{shape:'lane',x:b.x,z:b.z,yaw,len,w:4,warn:2.3,visual:true});addZone(g,{shape:'circle',x:ex,z:ez,r:3.6,warn:3,damage:34,final:.7,blast:true});}const L=c.f.lane;if(t<1.1)setHead(c,'hold',1);else setHead(c,'regrow',(t-1.1)/3.9,'small');if(crossed(a,t,1.1)){c.f.roll=spawnBomb(g,{kind:'roll',fly:0,warn:1.9,x:L.ex,z:L.ez,r:3.6,px:L.x,pz:L.z});emit(g,'clown-roll');}if(c.f.roll){const k=clamp((t-1.1)/1.2,0,1);c.f.roll.px=L.x+(L.ex-L.x)*k;c.f.roll.pz=L.z+(L.ez-L.z)*k;if(t<=2.3&&!c.f.hit&&dist(g.player,{x:c.f.roll.px,z:c.f.roll.pz})<2){c.f.hit=1;hurt(g,26,'roll'+c.f.roll.id);}}},
 inverseBow(g,c,a,t){if(crossed(a,t,.2)){const b=g.boss,p=lockTarget(g),d=dist(p,b);if(d>10){p.x=b.x+(p.x-b.x)*10/d;p.z=b.z+(p.z-b.z)*10/d;}c.f.tgt=p;addZone(g,{shape:'circle',...p,r:3.2,warn:1,damage:40,blast:true});}c.vis.neckTarget=c.f.tgt||null;c.vis.crouch=smooth(t/.2);c.vis.neck=t<.2?0:t<1.2?smooth((t-.2)/.8):1-smooth(t-1.2);if(crossed(a,t,1.2)){emit(g,'clown-slam',c.f.tgt);rosette(g,c.f.tgt,5,.85,10,23,c.seq%10);}},
 lastClap(g,c,a,t){if(!c.f.z){c.f.z=1;c.yaw=toward(g.boss,g.player);cone(g,c.yaw,.9,5,.873,28,'clap');}c.vis.glove=t<.9?smooth(t/.9):smooth(1-(t-.9)/.6);if(crossed(a,t,.9)){emit(g,'clown-clap');emit(g,'clown-inflate');}if(t>=.9&&t<1.7)setHead(c,'inflate',(t-.9)/.8);if(crossed(a,t,1.7))throwHead(g,3,34);if(t>=1.7)setHead(c,'regrow',(t-1.7)/3.65,'small');},
 confettiCurtain(g,c,a,t){c.vis.juggle=t<3?1:0;for(let row=0;row<(g.boss.phase===2?3:2);row++)if(crossed(a,t,.15+row*.75)){const p=lockTarget(g),gap=(c.seq+row)%5;for(let i=0;i<5;i++){if(i===gap)continue;const q={x:clamp(p.x+(i-2)*4.5,-19,19),z:clamp(p.z+(row-1)*4,-19,19)};if(Math.hypot(q.x,q.z)<22)addZone(g,{shape:'circle',...q,r:1.8,warn:1,damage:23,blast:true,sound:'confettiCurtain'});}emit(g,'clown-confetti');}},
 hornFan(g,c,a,t){c.vis.glove=.5;for(let i=0;i<(g.boss.phase===2?3:1);i++)if(crossed(a,t,.1+i*.8)){if(i===0)c.f.aim=toward(g.boss,g.player);c.yaw=c.f.aim;cone(g,c.f.aim+(i===0?0:i===1?-.7:.7),.9,18,.3,28);emit(g,'clown-horn');}},
 drumMarch(g,c,a,t){c.vis.stomp=Math.abs(Math.sin(t*9));const times=g.boss.phase===2?[.1,.75,1.4,2.05]:[.1,1,1.9];for(let i=0;i<times.length;i++)if(crossed(a,t,times[i])){const final=i===times.length-1,p=lockTarget(g);addZone(g,{shape:'circle',...p,r:final?3.5:2.3,warn:final?1.1:.8,damage:final?34:21,blast:true,sound:'drumMarch'});emit(g,'clown-drum',{final});}},
 balloonBouquet(g,c,a,t){c.vis.juggle=t<3?1:0;if(!c.f.s){c.f.s=1;const p=lockTarget(g),n=g.boss.phase===2?7:5;for(let i=0;i<n;i++){const angle=i/n*Math.PI*2,q={x:p.x+Math.sin(angle)*4.8,z:p.z+Math.cos(angle)*4.8};confineTo(q,21);bombAt(g,q,2.1,26,.9,'ball',.6+i*.28);}emit(g,'clown-balloon');}},
 carousel(g,c,a,t){if(!c.f.s){c.f.s=1;c.f.aim=toward(g.boss,g.player);}const n=g.boss.phase===2?6:4;for(let i=0;i<n;i++)if(crossed(a,t,.1+i*.55)){const yaw=c.f.aim+i*Math.PI/3;c.yaw=yaw;cone(g,yaw,.85,12,.4,27,'carousel');emit(g,'clown-carousel');}c.vis.tilt=Math.sin(t*5)*.6;},
 curtainCall(g,c,a,t){c.vis.juggle=t<4?1:0;if(crossed(a,t,.1)){c.f.aim=toward(g.boss,g.player);cone(g,c.f.aim,1,16,.35,30,'curtainCall');emit(g,'clown-horn');}for(const at of[1.4,2.1,2.8])if(crossed(a,t,at))throwBall(g);if(crossed(a,t,3.6)){const p=lockTarget(g);addZone(g,{shape:'circle',...p,r:3.6,warn:1.2,damage:36,blast:true,sound:'curtainCall'});rosette(g,p,7,1.5,10,25,c.seq%10);emit(g,'clown-finale');}}
};
export function choosePattern(g){
 const c=g.clown,phase=g.boss.phase===2?2:1,d=dist(g.boss,g.player);c.used||={};
 let list=Object.keys(PATTERNS).filter(k=>PATTERNS[k].phases.includes(phase)&&k!==c.last&&k!=='shove');
 if(d<4&&c.shoveCd<=0&&c.seq%4===0){c.seq++;return 'shove';}
 const min=Math.min(...list.map(k=>c.used[k]||0));list=list.filter(k=>(c.used[k]||0)===min);
 const close=new Set(['clap','bounce','inverseBow','lastClap','carousel']),preferred=list.filter(k=>d<5.5?close.has(k):d>12?!close.has(k):true);
 if(preferred.length)list=preferred;return list[(c.seq++)%list.length];
}
export function startClownPattern(g,name){if(!PATTERNS[name])throw new Error('Unknown clown pattern');const c=g.clown;c.used||={};c.used[name]=(c.used[name]||0)+1;c.state='pattern';c.name=name;c.pt=0;c.f={};c.punish=false;c.noSeparate=false;resetVis(c);emit(g,'clown-telegraph',{name:PATTERNS[name].name,key:name});}
function finishPattern(g){const c=g.clown;c.last=c.name;c.state='idle';c.name=null;c.f={};c.wait=g.boss.phase===2?.5:.7;c.punish=false;c.noSeparate=false;resetVis(c);}
function tickClown(g,dt){const c=g.clown,b=g.boss,p=g.player;if(c.state==='idle'){c.yaw+=clamp(angleDelta(c.yaw,toward(b,p)),-dt*2.5,dt*2.5);const d=dist(b,p);if(d>9){const s=Math.min((b.phase===2?5:4)*dt,d-9),a=toward(b,p);b.x+=Math.sin(a)*s;b.z+=Math.cos(a)*s;confineTo(b,BALL_LIMIT);c.odo+=s;}c.wait-=dt;if(c.wait<=0)startClownPattern(g,c.hug>HUG_TIME&&c.shoveCd<=0?'shove':choosePattern(g));}else if(c.state==='pattern'){const def=PATTERNS[c.name],a=c.pt;c.pt+=dt;RUN[c.name](g,c,a,c.pt);c.punish=c.pt>=def.dur-def.recover&&!c.zones.some(z=>!z.visual&&z.state==='warn');if(c.pt>=def.dur)finishPattern(g);}}
function updateClown(g,dt){const c=g.clown,b=g.boss,p=g.player;c.time+=dt;c.hug=dist(p,b)<HUG_DIST?c.hug+dt:0;c.shoveCd=Math.max(0,c.shoveCd-dt);for(const q of c.bombs)q.t+=dt;c.bombs=c.bombs.filter(q=>q.t<q.warn+.3);updateZones(g,dt);if(g.status!=='playing')return;if(c.stunT>0)c.stunT=Math.max(0,c.stunT-dt);else tickClown(g,dt);b.yaw=c.yaw;if(!c.noSeparate&&dist(p,b)<BODY_R){const a=dist(p,b)<.001?p.yaw:toward(b,p);p.x=b.x+Math.sin(a)*BODY_R;p.z=b.z+Math.cos(a)*BODY_R;confineTo(p,ARENA);}}
export function createClownGame(weapon='sword'){const g=createGame(weapon);Object.assign(g.boss,{x:0,z:-6,hp:CLOWN_HP,maxHp:CLOWN_HP,state:'clown',phase:1,stun:1e9,poise:0});g.player.z=14;g.clown={state:'idle',wait:1.4,pt:0,name:null,f:{},last:null,seq:0,used:{},zones:[],bombs:[],stunT:0,hug:0,shoveCd:0,punish:false,noSeparate:false,odo:0,yaw:0,time:0,hits:[],vis:newVis()};return g;}
export function stepClown(g,dt,input={}){if(g.status!=='playing')return;const b=g.boss,c=g.clown;dt=clamp(dt,0,1/30);if(b.state!=='transition'){b.state='clown';b.stun=1e9;b.poise=0;}const frozen=g.hitstop>0,from=g.events.length;baseStep(g,dt,input);for(let i=from;i<g.events.length;i++){const e=g.events[i];if(e.type==='skill-stun')c.stunT=1;else if(e.type==='phase'){c.zones=[];c.bombs=[];c.state='transition';c.name=null;c.f={};c.punish=false;c.noSeparate=false;resetVis(c);}else if(e.type==='armed'){b.state='clown';b.stun=1e9;b.poise=0;c.state='idle';c.wait=1.2;c.used={};emit(g,'clown-phase2');}else if(e.type==='victory'){c.zones=[];c.bombs=[];c.state='defeated';resetVis(c);}}if(frozen||g.status!=='playing'||b.state==='transition'||b.state==='dead')return;b.state='clown';b.stun=1e9;b.poise=0;updateClown(g,dt);}
export function clownView(g){const c=g.clown,b=g.boss;let action='공연이 시작됩니다.';if(b.state==='transition')action='웃음이 멈추었습니다…';else if(c.stunT>0)action='기절! 지금이 기회입니다';else if(c.punish)action='빈틈 — 지금 반격하세요';else if(c.state==='pattern')action=PATTERNS[c.name].name;return {name:'광대 오슬우',sub:b.phase===2?'끝나지 않는 앙코르':'즐거운 공연',phase:b.phase,hp:b.hp,maxHp:b.maxHp,action};}
