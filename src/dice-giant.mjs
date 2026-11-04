import {diceInvulnerable} from './dice-defense.mjs';
export const GIANT={transition:5,recovery:3,stagger:11,handPoise:190};
export const GIANT_NAMES=['거인의 손가락','판돈 쓸어 담기','카지노 칩 폭격','주먹 강타','운명의 룰렛','양손 압박','최후의 올인'];
const clamp=(v,a=-59,b=59)=>Math.max(a,Math.min(b,v));
const circle=(x,z,r,start=0,warn=1.15,damage=26)=>({shape:'circle',x:clamp(x),z:clamp(z),r,start,warn,active:.3,damage});
const rect=(x,z,w,h,start=0,warn=1.2)=>({shape:'rect',x,z,w,h,start,warn,active:.35,damage:32});
export function giantPattern(index,player){
 const x=clamp(player.x,-48,48),z=clamp(player.z,-48,48),slot=index%7;let hazards=[];
 if(slot===0)hazards=Array.from({length:5},(_,i)=>circle(x+(i-2)*10,z,6,i*.4,1.1));
 if(slot===1)hazards=Array.from({length:5},(_,i)=>rect(-48+i*24,z,24,22,i*.24,1.15));
 if(slot===2)hazards=[[0,0],[-24,0],[24,0],[0,-24],[0,24]].map(([a,b],i)=>circle(x+a,z+b,8,i*.18,1.4));
 if(slot===3)hazards=[circle(x,z,10,0,1.5,38),{...circle(x,z,0,1.8,.65,26),shape:'ring',active:1.25,band:3}];
 if(slot===4)hazards=[-52,-26,0,26,52].map(a=>rect(a,0,12,134,0,1.5));
 if(slot===5)hazards=[rect(-15,z,18,26,0,1.6),rect(15,z,18,26,0,1.6)];
 if(slot===6){hazards=[...giantPattern(0,player).hazards.slice(0,3),...giantPattern(2,player).hazards.map(h=>({...h,start:h.start+2.7})),...giantPattern(1,player).hazards.map(h=>({...h,start:h.start+5.1}))];}
 return {slot,name:GIANT_NAMES[slot],hazards:hazards.map((h,i)=>({...h,id:i,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
}
export function beginGiant(g){
 g.boss.name='운명의 찬탈자 박성원';const d=g.dice;d.giant={state:'transition',t:0,ordinal:0,hands:[GIANT.handPoise,GIANT.handPoise],hazards:[],from:{...d.pose,rotation:[...d.pose.rotation]}};
 d.state='giant';d.telegraph=d.pips=d.groundSpikes=null;d.frenzyRemaining=d.chainCharges=0;d.stun=0;
 g.player.action=null;if(g.projectiles)g.projectiles.length=0;g.boss.phase2PendingDesign=false;g.events.push({type:'dice-possession',duration:GIANT.transition});
}
export function skipGiant(g){const s=g.dice.giant;if(s?.state!=='transition')return false;s.t=GIANT.transition;return true;}
function blendRotation(a,b,t){const sign=a.reduce((v,n,i)=>v+n*b[i],0)<0?-1:1,q=a.map((n,i)=>n*(1-t)+b[i]*t*sign),length=Math.hypot(...q);return q.map(n=>n/length);}
export function giantHeadPose(g){
 const s=g.dice.giant,rotation=[0,-Math.SQRT1_2,0,Math.SQRT1_2];if(!s)return g.dice.pose;
 if(s.state==='transition'){const u=Math.max(0,Math.min(1,(s.t-.7)/1.2)),v=Math.max(0,Math.min(1,(s.t-2)/2)),yaw=Math.atan2(127+s.from.z,-s.from.x),look=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)],turn=u>0?blendRotation(look,rotation,u):blendRotation(s.from.rotation,look,Math.min(1,s.t/.7));return {x:s.from.x*(1-u),y:s.from.y+(43-s.from.y)*u+Math.sin(u*Math.PI)*55+15*v,z:s.from.z+(-127-s.from.z)*u+21*v,rotation:turn};}
 if(s.state==='stagger'){const u=Math.min(1,s.t/.8),v=u*u*(3-2*u);return {x:0,y:58-52*v,z:-106+98*v,rotation};}
 if(s.state==='recovery'&&s.lifting){const u=Math.min(1,s.t/.8);return {x:0,y:6+52*u,z:-8-98*u,rotation};}
 if(s.state==='dead'){const t=Math.min(1,(s.deathVisual||0)/3),from=s.deathFrom||{x:0,y:58,z:-106,rotation},q=from.rotation.map((v,i)=>v*(1-t)+(i===3?t:0)),n=Math.hypot(...q);return {x:from.x+Math.sin(t*8)*7,y:6+(from.y-6)*(1-t)**2+Math.sin(t*Math.PI)*6,z:from.z+(-22-from.z)*t,rotation:q.map(v=>v/n)};}
 return {x:0,y:58,z:-106,rotation};
}
export function giantHazards(g){const s=g.dice.giant;if(s?.state!=='attack')return [];return s.hazards.filter(h=>s.t>=h.start&&s.t<h.start+h.warn+h.active).map(h=>({...h,age:s.t-h.start,live:s.t>=h.start+h.warn,r:h.shape==='ring'?Math.max(0,(s.t-h.start-h.warn)/h.active)*62:h.r}));}
export function hazardContains(h,p,pad=.42){
 if(h.shape==='rect')return Math.abs(p.x-h.x)<=h.w/2+pad&&Math.abs(p.z-h.z)<=h.h/2+pad;
 const d=Math.hypot(p.x-h.x,p.z-h.z);return h.shape==='ring'?Math.abs(d-h.r)<=h.band+pad:d<=h.r+pad;
}
export function giantHandPose(g,index){
 const s=g.dice.giant,rest={x:index?24:-24,y:2,z:12};if(!s)return rest;
 if(s.state==='transition')return {...rest,y:28*(1-Math.min(1,s.t/5))+2};
 if(s.state==='stagger'||s.state==='dead')return {...rest,y:1};
 const h=giantHazards(g).find(h=>s.slot===5?h.id===index:h.id%2===index);
 if(!h||s.slot===2||s.slot===4||s.slot===6&&h.start>=2.7&&h.start<5.1)return rest;
 return {x:h.x,y:h.live?2:2+22*Math.sin(Math.min(1,h.age/h.warn)*Math.PI),z:h.z};
}
export function giantAim(g){const s=g.dice.giant;if(!s)return g.dice.pose;if(s.state==='stagger')return giantHeadPose(g);const hands=[giantHandPose(g,0),giantHandPose(g,1)];return hands.sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];}
export function stepGiant(g,dt,frozen=false){
 const s=g.dice.giant;if(!s||s.state==='dead')return;
 if(s.state==='transition'){s.t+=dt;if(s.t>=GIANT.transition){s.state='recovery';s.t=0;g.events.push({type:'dice-possessed'});}g.dice.pose=giantHeadPose(g);return;}
 if(frozen)return;s.t+=dt;
 if(s.state==='stagger'&&s.t>=GIANT.stagger){s.state='recovery';s.t=0;s.lifting=true;s.hands.fill(GIANT.handPoise);}
 if(s.state==='recovery'&&s.t>=GIANT.recovery){const pattern=giantPattern(s.ordinal++,g.player);Object.assign(s,{state:'attack',t:0,slot:pattern.slot,name:pattern.name,hazards:pattern.hazards,duration:pattern.duration});g.events.push({type:'dice-giant-warning',name:s.name});}
 if(s.state==='attack'){
  for(const h of giantHazards(g)){const original=s.hazards[h.id];if(!h.live||original.hit||!hazardContains(h,g.player))continue;original.hit=true;if(diceInvulnerable(g.player))continue;
   const amount=Math.min(g.player.hp,h.damage);g.player.hp-=amount;g.player.invuln=.55;g.events.push({type:'player-hit',amount,source:'giant'});
   if(g.player.hp<=0){g.status='lost';s.hazards=[];g.events.push({type:'death'});return;}
  }
  if(s.t>=s.duration+.65){s.state='recovery';s.t=0;s.hazards=[];}
 }
 g.dice.pose=giantHeadPose(g);
}
export function strikeGiantHand(g,index,amount){
 const s=g.dice.giant;if(!s||['transition','stagger','dead'].includes(s.state))return 0;
 s.hands[index]=Math.max(0,s.hands[index]-amount);
 if(s.hands[index]===0){s.state='stagger';s.t=0;s.hazards=[];g.dice.pose=giantHeadPose(g);g.events.push({type:'dice-giant-stagger'});}
 return amount*.3;
}
