import {diceInvulnerable} from './dice-defense.mjs';
import {POSSESSION,cinematicBeat,possessionPose} from './dice-giant-cinematic-data.mjs';
export const GIANT={transition:POSSESSION.end,recovery:3,stagger:11,handPoise:190};
export const GIANT_NAMES=['거인의 손가락','칩 정렬','운명의 다이스','코인 플립','체스의 행마','양손 압박','룰렛 선언'];
export const FERAL_NAMES=['광란의 내려찍기','탁자 쓸어버리기','주사위 머리 박기','짐승의 양손 압박','부서진 체스판','분노의 난타','최후의 올인'];
export const HAND_REST=Object.freeze([{x:-64,y:2,z:22},{x:64,y:2,z:22}]);
const sat=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const t=sat(v);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a=-59,b=59)=>Math.max(a,Math.min(b,v));
const circle=(x,z,r,start=0,warn=1.15,damage=26)=>({shape:'circle',x:clamp(x),z:clamp(z),r,start,warn,active:.3,damage});
const rect=(x,z,w,h,start=0,warn=1.2)=>({shape:'rect',x,z,w,h,start,warn,active:.35,damage:32});
export function giantPattern(index,player,temperament='controlled',healthRatio=1){
 if(temperament==='feral')return feralPattern(index,player,healthRatio);
 const x=clamp(player.x,-48,48),z=clamp(player.z,-48,48),slot=index%7;let hazards=[];const turn=Math.floor(index/7),coinFace=turn%2?'tails':'heads',chessPiece=['rook','bishop','knight'][turn%3];
 if(slot===0)hazards=Array.from({length:5},(_,i)=>circle(x+(i-2)*10,z,6,i*.4,1.1));
 if(slot===1)hazards=Array.from({length:5},(_,i)=>rect(-48+i*24,z,24,22,i*.24,1.15));
 if(slot===2)hazards=[[0,0],[-24,0],[24,0],[0,-24],[0,24]].map(([a,b],i)=>circle(x+a,z+b,8,i*.18,1.4));
 if(slot===3)hazards=coinFace==='heads'?[circle(x,z,12,0,1.5,38)]:[rect(-28,z,17,36,0,1.5),rect(28,z,17,36,.18,1.45)];
 if(slot===4){
  if(chessPiece==='rook')hazards=[rect(x,0,12,128,0,1.4),rect(0,z,128,12,.28,1.4)];
  if(chessPiece==='bishop')hazards=[{...rect(x,z,10,123,0,1.5),shape:'rotated-rect',yaw:Math.PI/4},{...rect(x,z,10,123,.24,1.5),shape:'rotated-rect',yaw:-Math.PI/4}];
  if(chessPiece==='knight')hazards=[circle(x+24,z+12,11,0,1.4),circle(x-24,z+12,11,.65,1.4)];
 }
 if(slot===5)hazards=[rect(-15,z,18,26,0,1.6),rect(15,z,18,26,0,1.6)];
 if(slot===6){hazards=[...giantPattern(0,player).hazards.slice(0,3),...giantPattern(2,player).hazards.map(h=>({...h,start:h.start+2.7})),...giantPattern(1,player).hazards.map(h=>({...h,start:h.start+5.1}))];}
 return {slot,name:GIANT_NAMES[slot]+(slot===3?' · '+(coinFace==='heads'?'앞면':'뒷면'):slot===4?' · '+({rook:'룩',bishop:'비숍',knight:'나이트'})[chessPiece]:''),coinFace:slot===3?coinFace:null,chessPiece:slot===4?chessPiece:null,hazards:hazards.map((h,i)=>({...h,id:i,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
}
function feralPattern(index,player,healthRatio=1){
 const x=clamp(player.x,-45,45),z=clamp(player.z,-45,45),slot=index%7;let hazards=[];
 if(slot===0)hazards=[circle(x-13,z,11,0,1.25,35),circle(x+13,z,11,.6,1.2,35),circle(x,z-8,12,1.2,1.2,40)];
 if(slot===1)hazards=Array.from({length:4},(_,i)=>rect(-42+i*28,z,28,24,i*.32,1.25));
 if(slot===2){
  const repeats=healthRatio<=.12?3:healthRatio<=.19?2:1;
  for(let i=0;i<repeats;i++){
   const shift=i===0?0:i%2?-12:12,start=i*2.35;
   hazards.push({...circle(x+shift,z,15,start,1.4,42),headSlam:true});
   hazards.push({...circle(x+shift,z,0,start+1.72,.65,24),shape:'ring',active:1.0,band:3});
  }
 }
 if(slot===3)hazards=[rect(-31,z,26,33,0,1.5),rect(31,z,26,33,.45,1.4)];
 if(slot===4)hazards=[[0,0],[-25,-25],[25,25],[-25,25],[25,-25]].map(([a,b],i)=>circle(x+a,z+b,9,i*.27,1.1));
 if(slot===5)hazards=Array.from({length:5},(_,i)=>circle(x+(i%2?16:-16),z+(i-2)*7,9,i*.43,1.0,32));
 if(slot===6)hazards=[...feralPattern(1,player).hazards.slice(0,3),...feralPattern(0,player).hazards.map(h=>({...h,start:h.start+3})),...feralPattern(2,player,healthRatio).hazards.map(h=>({...h,start:h.start+6}))];
 return {slot,name:FERAL_NAMES[slot],hazards:hazards.map((h,i)=>({...h,id:i,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
}
export function beginGiant(g){
 g.boss.name='운명의 찬탈자 박성원';const d=g.dice;d.giant={state:'transition',t:0,ordinal:0,temperament:'controlled',rageTriggered:false,rageBeat:0,cinematicBeat:'still',hands:[GIANT.handPoise,GIANT.handPoise],hazards:[],from:{...d.pose,rotation:[...d.pose.rotation]}};
 d.state='giant';d.telegraph=d.pips=d.groundSpikes=null;d.frenzyRemaining=d.chainCharges=0;d.stun=0;
 g.player.action=null;if(g.projectiles)g.projectiles.length=0;g.boss.phase2PendingDesign=false;g.events.push({type:'dice-possession',duration:GIANT.transition});
}
export function skipGiant(g){const s=g.dice.giant;if(s?.state!=='transition')return false;s.t=GIANT.transition;return true;}
export function giantHeadPose(g){
 const s=g.dice.giant,rotation=[0,-Math.SQRT1_2,0,Math.SQRT1_2];if(!s)return g.dice.pose;
 if(s.state==='transition')return possessionPose(s.from,s.t);
 if(s.state==='stagger'){const u=Math.min(1,s.t/.8),v=u*u*(3-2*u);return {x:0,y:58-52*v,z:-106+98*v,rotation};}
 if(s.state==='recovery'&&s.lifting){const u=Math.min(1,s.t/.8);return {x:0,y:6+52*u,z:-8-98*u,rotation};}
 if(s.state==='dead'){const t=Math.min(1,(s.deathVisual||0)/3),from=s.deathFrom||{x:0,y:58,z:-106,rotation},q=from.rotation.map((v,i)=>v*(1-t)+(i===3?t:0)),n=Math.hypot(...q);return {x:from.x+Math.sin(t*8)*7,y:6+(from.y-6)*(1-t)**2+Math.sin(t*Math.PI)*6,z:from.z+(-22-from.z)*t,rotation:q.map(v=>v/n)};}
 if(s.state==='attack'&&s.temperament==='feral'&&[2,6].includes(s.slot)){
  const h=s.hazards?.find(h=>h.headSlam&&s.t>=h.start-.35&&s.t<=h.start+h.warn+h.active+.7);
  if(h){
   const age=s.t-h.start,approach=ease((age-.2)/Math.max(.25,h.warn-.2)),withdraw=ease((age-h.warn-h.active)/.65);
   const reach=approach*(1-withdraw);
   return {x:lerp(0,h.x,reach),y:lerp(58,6,reach),z:lerp(-106,h.z,reach),rotation};
  }
 }
 return {x:0,y:58,z:-106,rotation};
}
export function giantHazards(g){const s=g.dice.giant;if(s?.state!=='attack')return [];return s.hazards.filter(h=>s.t>=h.start&&s.t<h.start+h.warn+h.active).map(h=>({...h,age:s.t-h.start,live:s.t>=h.start+h.warn,r:h.shape==='ring'?Math.max(0,(s.t-h.start-h.warn)/h.active)*62:h.r}));}
export function hazardContains(h,p,pad=.42){
 if(h.shape==='rect'||h.shape==='rotated-rect'){
  const x=p.x-h.x,z=p.z-h.z,a=h.shape==='rotated-rect'?h.yaw:0;
  const rx=x*Math.cos(a)+z*Math.sin(a),rz=-x*Math.sin(a)+z*Math.cos(a);
  return Math.abs(rx)<=h.w/2+pad&&Math.abs(rz)<=h.h/2+pad;
 }
 const d=Math.hypot(p.x-h.x,p.z-h.z);return h.shape==='ring'?Math.abs(d-h.r)<=h.band+pad:d<=h.r+pad;
}
export function giantHandPose(g,index){
 const s=g.dice.giant,rest=HAND_REST[index];if(!s)return {...rest};
 if(s.state==='transition'){
  const land=ease((s.t-4.7)/1.0);
  return {...rest,y:2+25*(1-land)};
 }
 if(s.state==='stagger'){
  const from=s.staggerHands?.[index]||rest,u=ease(s.t/.8);
  return {x:lerp(from.x,rest.x,u),y:lerp(from.y,rest.y,u),z:lerp(from.z,rest.z,u)};
 }
 if(s.state==='dead')return {...rest,y:.8};
 if(s.state!=='attack'){
  const idle= s.temperament==='feral'?.45*Math.sin((g.time||0)*7+index*2):.2*Math.sin((g.time||0)*1.8+index*2);
  return {...rest,y:rest.y+idle};
 }
 const physical=s.temperament==='feral'?[0,1,3,5,6].includes(s.slot):[0,3,5,6].includes(s.slot);
 if(!physical)return {...rest,y:rest.y+Math.sin(s.t*2+index)*.35};
 if(s.temperament==='feral'&&s.slot===2)return {...rest};
 const candidates=s.hazards?.filter(h=>!h.headSlam&&h.id%2===index)||[];
 const h=candidates.find(h=>s.t>=h.start-.35&&s.t<=h.start+h.warn+h.active+.6);
 if(!h)return {...rest};
 const age=s.t-h.start,approach=ease((age+.35)/Math.max(.4,h.warn*.75)),retreat=ease((age-h.warn-h.active)/.55),reach=approach*(1-retreat);
 const x=lerp(rest.x,h.x,reach),z=lerp(rest.z,h.z,reach);
 const rise=22*Math.sin(Math.PI*sat((age+.3)/Math.max(.3,h.warn+.3)))*(1-retreat);
 return {x,y:2+rise,z};
}
export function giantHeadExposed(g){
 const s=g.dice.giant;
 return Boolean(s?.state==='attack'&&s.temperament==='feral'&&s.hazards?.some(h=>h.headSlam&&s.t>=h.start+h.warn&&s.t<=h.start+h.warn+h.active+.35));
}
export function giantAim(g){const s=g.dice.giant;if(!s)return g.dice.pose;if(s.state==='stagger'||giantHeadExposed(g))return giantHeadPose(g);const hands=[giantHandPose(g,0),giantHandPose(g,1)];return hands.sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];}
export function stepGiant(g,dt,frozen=false){
 const s=g.dice.giant;if(!s||s.state==='dead')return;
 if(s.state==='transition'){s.t=Math.min(GIANT.transition,s.t+dt);s.cinematicBeat=cinematicBeat(s.t);if(s.t>=GIANT.transition){s.state='recovery';s.t=0;g.events.push({type:'dice-possessed'});}g.dice.pose=giantHeadPose(g);return;}
 if(frozen)return;
 if(!s.rageTriggered&&g.boss.hp/g.boss.maxHp<=.275){
   s.rageTriggered=true;s.temperament='feral';s.rageBeat=1.2;
   s.hazards=[];s.state='recovery';s.t=-1.2;s.lifting=false;
   g.events.push({type:'dice-giant-feral',duration:1.2});
 }
 s.rageBeat=Math.max(0,s.rageBeat-dt);s.t+=dt;
 if(s.state==='stagger'&&s.t>=GIANT.stagger){s.state='recovery';s.t=0;s.lifting=true;s.hands.fill(GIANT.handPoise);}
 if(s.state==='recovery'&&s.t>=GIANT.recovery){const pattern=giantPattern(s.ordinal++,g.player,s.temperament,g.boss.hp/g.boss.maxHp);Object.assign(s,{state:'attack',t:0,slot:pattern.slot,name:pattern.name,currentPattern:s.temperament+':'+pattern.slot,coinFace:pattern.coinFace||null,chessPiece:pattern.chessPiece||null,hazards:pattern.hazards,duration:pattern.duration});g.events.push({type:'dice-giant-warning',name:s.name});}
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
 if(s.hands[index]===0){s.staggerHands=[giantHandPose(g,0),giantHandPose(g,1)];s.state='stagger';s.t=0;s.hazards=[];g.dice.pose=giantHeadPose(g);g.events.push({type:'dice-giant-stagger'});}
 return amount*.3;
}
