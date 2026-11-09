import {KWON_THREE} from './kwon-third-phase.mjs';
const emit=(g,type,data={})=>g.events.push({type,...data});
export function damageArenaBoss(g,amount,poise=0,{developer=false,point=null,dot=false}={}){
 const b=g?.boss;
 if(g?.status!=='playing'||!Number.isFinite(amount)||amount<=0||!Number.isFinite(poise)||poise<0||!Number.isFinite(b?.hp)||b.hp<=0||['transition','moonCinematic','moonStorm'].includes(b.state))return 0;
 // The clown has only two acts. Clamp oversized hits to the one real
 // 50% phase-two threshold so the unskippable transformation still plays.
 // Once in phase two, HP can reach zero normally without another curtain.
 const nextCurtain=g.clown&&b.phase===1?b.maxHp*.5:null;
 const available=nextCurtain===null?b.hp:Math.max(0,b.hp-nextCurtain);
 const damage=Math.min(b.hp,available,amount*(!developer&&b.state==='stagger'?1.25:1)),
  big=developer||damage>=150;
 b.hp-=damage;
 if(nextCurtain!==null&&damage===available)b.hp=nextCurtain;
 if(g.stats){g.stats.damage+=damage;if(!dot)g.stats.hits++;}
 if(!developer&&!dot)b.poise+=poise;
 const impact=point&&[point.x,point.y,point.z].every(Number.isFinite)
  ?{x:point.x,y:point.y,z:point.z,part:point.part}:{};
 if(!dot)emit(g,'boss-hit',{amount:Math.round(damage),big,...impact,...(developer?{developer:true}:{})});
 if(!developer&&!dot)g.hitstop=Math.max(g.hitstop||0,big?.09:.035);
 if(b.hp<=0){
  b.hp=0;b.state='dead';b.queue=[];g.status='won';g.projectiles=[];g.bossShots=[];
  if(Array.isArray(g.kwonFractures))g.kwonFractures.length=0;
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'defeated'});
  emit(g,'victory');return damage;
 }
 // Clown: phase one 100-50%, phase two 50-0%; no third act.
 // Kwon's independent three-phase contract must remain unchanged.
 const nextPhase=b.phase===1&&b.hp<=b.maxHp*(g.clown?.5:KWON_THREE.first)?2:
  !g.clown&&b.phase===2&&b.hp<=b.maxHp*KWON_THREE.second?3:null;
 if(nextPhase!==null){
  // Perform the remaining second-act curtain on authoritative damage.
  Object.assign(b,{phase:nextPhase,state:'transition',t:0,queue:[],poise:0,
   stun:0,punishable:false,from:null,motionFrom:null,riftFired:false,
   pendingOpening:null,closeCooldown:0,hug:0});
  g.projectiles=[];g.bossShots=[];g.player.action=null;
  if(Array.isArray(g.kwonFractures))g.kwonFractures.length=0;
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'transition',name:null,f:{},punish:false,noSeparate:false});
  emit(g,'phase',{phase:nextPhase});
 }else if(!developer&&b.poise>=(b.phase>=2?280:180)&&!['transition','moonCinematic','moonStorm','stagger'].includes(b.state)){
  Object.assign(b,{poise:0,state:'stagger',t:0,queue:[],punishable:false});emit(g,'stagger');
 }
 return damage;
}
