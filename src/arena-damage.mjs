const emit=(g,type,data={})=>g.events.push({type,...data});
export function damageArenaBoss(g,amount,poise=0,{developer=false,point=null,dot=false}={}){
 const b=g?.boss;
 if(g?.status!=='playing'||!Number.isFinite(amount)||amount<=0||!Number.isFinite(poise)||poise<0||!Number.isFinite(b?.hp)||b.hp<=0||b.state==='transition')return 0;
 const damage=Math.min(b.hp,amount*(!developer&&b.state==='stagger'?1.25:1)),big=developer||damage>=150;
 b.hp-=damage;
 if(g.stats){g.stats.damage+=damage;if(!dot)g.stats.hits++;}
 if(!developer&&!dot)b.poise+=poise;
 const impact=point&&[point.x,point.y,point.z].every(Number.isFinite)
  ?{x:point.x,y:point.y,z:point.z,part:point.part}:{};
 if(!dot)emit(g,'boss-hit',{amount:Math.round(damage),big,...impact,...(developer?{developer:true}:{})});
 if(!developer&&!dot)g.hitstop=Math.max(g.hitstop||0,big?.09:.035);
 if(b.hp<=0){
  b.hp=0;b.state='dead';b.queue=[];g.status='won';g.projectiles=[];g.bossShots=[];
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'defeated'});
  emit(g,'victory');return damage;
 }
 if(b.phase===1&&b.hp<=b.maxHp*.5){
  Object.assign(b,{phase:2,state:'transition',t:0,queue:[],poise:0,stun:0,punishable:false});
  g.projectiles=[];g.bossShots=[];g.player.action=null;
  if(g.clown)Object.assign(g.clown,{zones:[],bombs:[],waves:[],state:'transition',name:null,f:{},punish:false,noSeparate:false});
  emit(g,'phase');
 }else if(!developer&&b.poise>=(b.phase===2?280:180)&&!['transition','stagger'].includes(b.state)){
  Object.assign(b,{poise:0,state:'stagger',t:0,queue:[],punishable:false});emit(g,'stagger');
 }
 return damage;
}
