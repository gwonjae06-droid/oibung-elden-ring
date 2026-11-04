import {diceInvulnerable} from './dice-defense.mjs';
import {POSSESSION,cinematicBeat,possessionPose} from './dice-giant-cinematic-data.mjs';
export const GIANT={transition:POSSESSION.end,recovery:2.4,feralRecovery:1.5,handHp:340,crumble:1.15,rageBeat:1.2,rageHp:.275};
export const GIANT_NAMES=['거인의 손가락','칩 정렬','운명의 다이스','코인 플립','체스의 행마','양손 압박','룰렛 선언'];
export const FERAL_NAMES=['광란의 내려찍기','탁자 쓸어버리기','주사위 머리 박기','짐승의 양손 압박','부서진 체스판','분노의 난타','최후의 올인'];
// Both palms rest on the SINGLE table edge directly in front of the giant, close to the shoulders.
export const HAND_REST=Object.freeze([{x:-22,y:2,z:-64},{x:22,y:2,z:-64}]);
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
  // Consecutive head slams: the more the boss is hurt, the more times he bangs his head into the table.
  const repeats=healthRatio<=.12?4:healthRatio<=.19?3:2;
  for(let i=0;i<repeats;i++){
   const shift=i===0?0:i%2?-12:12,start=i*2.4,headX=clamp(x+shift,-26,26),headZ=clamp(z,-51,-34);
   hazards.push({...circle(headX,headZ,15,start,1.2,42),headSlam:true});
   hazards.push({...circle(headX,headZ,0,start+1.4,.65,24),shape:'ring',active:1.0,band:3});
  }
 }
 if(slot===3)hazards=[rect(-31,z,26,33,0,1.5),rect(31,z,26,33,.45,1.4)];
 if(slot===4)hazards=[[0,0],[-25,-25],[25,25],[-25,25],[25,-25]].map(([a,b],i)=>circle(x+a,z+b,9,i*.27,1.1));
 if(slot===5)hazards=Array.from({length:5},(_,i)=>circle(x+(i%2?16:-16),z+(i-2)*7,9,i*.43,1.0,32));
 if(slot===6)hazards=[...feralPattern(1,player).hazards.slice(0,3),...feralPattern(0,player).hazards.map(h=>({...h,start:h.start+3})),...feralPattern(2,player,healthRatio).hazards.map(h=>({...h,start:h.start+6}))];
 return {slot,name:FERAL_NAMES[slot],hazards:hazards.map((h,i)=>({...h,id:i,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
}
// Which table object a hazard is built from. The view and the hands both read this so they always agree.
export function giantPropType(s,h){
 if(!s||!h||h.headSlam||h.shape==='ring')return null;
 if(s.temperament==='feral')return s.slot===4?'chess':s.slot===1||(s.slot===6&&h.start<3)?'chip':null;
 if(s.slot===6)return h.start<2.7?null:h.start<5.1?'dice':'chip';
 return ({1:'chip',2:'dice',3:'coin',4:'chess'})[s.slot]||null;
}
// 'throw' = polite flick/lowering of a hand in front of the body, 'reach' = the hand goes to the target and slams.
function handKind(s,h){
 if(h.headSlam||h.shape==='ring')return null;
 if(s.temperament==='feral')return [0,1,3,4,5,6].includes(s.slot)?'reach':null;
 if(giantPropType(s,h))return 'throw';
 return [0,5,6].includes(s.slot)?'reach':null;
}
export function beginGiant(g){
 g.boss.name='운명의 찬탈자 박성원';const d=g.dice;d.giant={state:'transition',t:0,ordinal:0,temperament:'controlled',rageTriggered:false,rageBeat:0,cinematicBeat:'still',hands:[GIANT.handHp,GIANT.handHp],destroyed:[false,false],crumble:[0,0],smooth:HAND_REST.map(h=>({...h})),hazards:[],from:{...d.pose,rotation:[...d.pose.rotation]}};
 d.state='giant';d.telegraph=d.pips=d.groundSpikes=null;d.frenzyRemaining=d.chainCharges=0;d.stun=0;
 g.player.action=null;if(g.projectiles)g.projectiles.length=0;g.boss.phase2PendingDesign=false;g.events.push({type:'dice-possession',duration:GIANT.transition});
}
export function skipGiant(g){const s=g.dice.giant;if(s?.state!=='transition')return false;s.t=GIANT.transition;return true;}
// Shared skeletal posture: chest and head pitch/fall together, never lengthening the neck.
export function giantPosture(g){
 const s=g.dice.giant,rotation=[0,-Math.SQRT1_2,0,Math.SQRT1_2],rest={x:0,y:58,z:-106,rotation};
 if(!s)return {lean:0,bodyX:0,head:rest};
 if(s.state==='transition')return {lean:0,bodyX:0,head:possessionPose(s.from,s.t)};
 if(s.state==='dead'){
  const t=sat((s.deathVisual||0)/3),from=s.deathFrom||rest,q=from.rotation.map((v,i)=>v*(1-t)+(i===3?t:0)),n=Math.hypot(...q)||1;
  return {lean:0,bodyX:0,head:{x:from.x+Math.sin(t*8)*7,y:6+(from.y-6)*(1-t)**2+Math.sin(t*Math.PI)*6,z:from.z+(-22-from.z)*t,rotation:q.map(v=>v/n)}};
 }
 if(s.state==='attack'&&s.temperament==='feral'){
  // Pick the first slam that has not finished withdrawing, so consecutive slams chain without a pop.
  const h=s.hazards?.find(h=>h.headSlam&&s.t>=h.start-.35&&s.t<=h.start+h.warn+h.active+.9);
  if(h){
   const age=s.t-h.start,drop0=h.warn-.14;
   // Slow wind-up (head rears over the table), then a violent 0.14s drop, then a heavy withdrawal.
   const wind=ease(age/Math.max(.3,drop0)),drop=ease((age-drop0)/.14),withdraw=ease((age-h.warn-h.active-.1)/.8),lean=(.55*wind+.45*drop)*(1-withdraw);
   return {lean,bodyX:h.x*.65*lean,head:{x:lerp(0,h.x,lean),y:lerp(58,7,lean),z:lerp(-106,h.z,lean),rotation}};
  }
 }
 return {lean:0,bodyX:0,head:rest};
}
export function giantHeadPose(g){return giantPosture(g).head;}
export function giantHazards(g){const s=g.dice.giant;if(s?.state!=='attack')return [];return s.hazards.filter(h=>s.t>=h.start&&s.t<h.start+h.warn+h.active).map(h=>({...h,age:s.t-h.start,live:s.t>=h.start+h.warn,r:h.shape==='ring'?Math.max(0,(s.t-h.start-h.warn)/h.active)*62:h.r}));}
export function hazardContains(h,p,pad=.42){
 if(h.shape==='rect'||h.shape==='rotated-rect'){
  const x=p.x-h.x,z=p.z-h.z,a=h.shape==='rotated-rect'?h.yaw:0;
  const rx=x*Math.cos(a)+z*Math.sin(a),rz=-x*Math.sin(a)+z*Math.cos(a);
  return Math.abs(rx)<=h.w/2+pad&&Math.abs(rz)<=h.h/2+pad;
 }
 const d=Math.hypot(p.x-h.x,p.z-h.z);return h.shape==='ring'?Math.abs(d-h.r)<=h.band+pad:d<=h.r+pad;
}
// [lift, side sway, forward push] of the polite flick used for each table object.
const THROW={chip:[5,4,2],dice:[9,5,4],coin:[11,4,3],chess:[6,0,5]};
// Where the hand wants to be right now. giantHandPose() smooths this so every motion flows into the next.
function handTarget(g,index){
 const s=g.dice.giant,rest=HAND_REST[index];
 if(!s)return {...rest,fist:0};
 if(s.destroyed?.[index])return {...rest,y:.6,fist:0};
 if(s.state==='transition')return {...rest,y:2+25*(1-ease((s.t-4.7)/1.0)),fist:0};
 if(s.state==='dead')return {...rest,y:.8,fist:0};
 const feral=s.temperament==='feral',time=g.time||0;
 let x=rest.x,z=rest.z,y=rest.y+(feral?.42*Math.sin(time*7+index*2):.16*Math.sin(time*1.8+index*2)),fist=feral?.85:0;
 if(s.state!=='attack')return {x,y,z,fist};
 const alive=[0,1].filter(i=>!s.destroyed?.[i]);
 const mine=(s.hazards||[]).filter(h=>handKind(s,h)&&(alive.length===1||h.id%2===index)).sort((a,b)=>a.start-b.start);
 let reach=null;
 for(const h of mine){
  const age=s.t-h.start;
  if(handKind(s,h)==='throw'){
   const u=(age+.45)/.7;
   if(u>0&&u<1){const [lift,sway,push]=THROW[giantPropType(s,h)];y+=lift*Math.sin(Math.PI*u);x+=(index?-1:1)*sway*Math.sin(2*Math.PI*u);z+=push*Math.sin(Math.PI*u);}
  }else if(!reach&&age>-.7&&age<h.warn+h.active+.9)reach={h,age};
 }
 if(reach){
  const {h,age}=reach,drop0=h.warn-.12,wind=ease((age+.7)/Math.max(.3,drop0+.7)),slam=ease((age-drop0)/.12),retreat=ease((age-h.warn-h.active-.05)/.4),r=wind*(1-retreat);
  x=lerp(rest.x,h.x,r);z=lerp(rest.z,h.z,r);
  y=2+(feral?27:21)*wind*(1-slam)+6*Math.sin(Math.PI*retreat);
  fist=feral?.35+.65*wind:.1*wind;
 }
 return {x,y,z,fist};
}
function moveHands(g,dt){
 const s=g.dice.giant;s.smooth=s.smooth||HAND_REST.map(h=>({...h}));
 const feral=s.temperament==='feral';
 for(const i of [0,1]){
  const t=handTarget(g,i),p=s.smooth[i],kxz=1-Math.exp(-dt*(feral?16:9)),ky=1-Math.exp(-dt*(t.y<p.y?(feral?70:40):9));
  p.x+=(t.x-p.x)*kxz;p.y+=(t.y-p.y)*ky;p.z+=(t.z-p.z)*kxz;
 }
}
export function giantHandPose(g,index){
 const s=g.dice.giant,t=handTarget(g,index);
 if(!s||['transition','dead'].includes(s.state)||s.destroyed?.[index])return t;
 const p=s.smooth?.[index];return p?{x:p.x,y:p.y,z:p.z,fist:t.fist}:t;
}
export function giantHeadExposed(g){
 const s=g.dice.giant;
 return Boolean(s?.state==='attack'&&s.temperament==='feral'&&s.hazards?.some(h=>h.headSlam&&s.t>=h.start+h.warn&&s.t<=h.start+h.warn+h.active+.85));
}
export function giantAim(g){const s=g.dice.giant;if(!s)return g.dice.pose;if(giantHeadExposed(g))return giantHeadPose(g);const hands=[0,1].filter(i=>!s.destroyed?.[i]).map(i=>giantHandPose(g,i));if(!hands.length)return giantHeadPose(g);return hands.sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];}
export function stepGiant(g,dt,frozen=false){
 const s=g.dice.giant;if(!s||s.state==='dead')return;
 if(s.state==='transition'){const before=s.t;s.t=Math.min(GIANT.transition,s.t+dt);if(before<POSSESSION.launchEnd&&s.t>=POSSESSION.launchEnd)g.events.push({type:'dice-giant-neck-impact'});s.cinematicBeat=cinematicBeat(s.t);if(s.t>=GIANT.transition){s.state='recovery';s.t=0;g.events.push({type:'dice-possessed'});}g.dice.pose=giantHeadPose(g);return;}
 if(frozen)return;
 // Phase three: the polite gambler loses his mind once both hands are gone or his health runs low.
 // The change waits for the current pattern to finish so nothing is cut off mid-telegraph.
 if(!s.rageTriggered&&s.state==='recovery'&&s.t>=0&&(g.boss.hp/g.boss.maxHp<=GIANT.rageHp||s.destroyed?.every(Boolean))){
  s.rageTriggered=true;s.temperament='feral';s.rageBeat=GIANT.rageBeat;s.hazards=[];s.t=-GIANT.rageBeat;
  g.events.push({type:'dice-giant-feral',duration:GIANT.rageBeat});
 }
 s.rageBeat=Math.max(0,s.rageBeat-dt);s.t+=dt;
 s.crumble=s.crumble||[0,0];s.destroyed?.forEach((lost,i)=>{if(lost)s.crumble[i]+=dt;});
 if(s.state==='recovery'&&s.t>=(s.temperament==='feral'?GIANT.feralRecovery:GIANT.recovery)){
  const alive=s.destroyed.filter(v=>!v).length,ordinal=s.ordinal++;
  const selected=alive===0?[2,4,2,2,4][ordinal%5]:alive===1?[2,0,1,2,3,4,5][ordinal%7]:ordinal;
  const pattern=giantPattern(selected,g.player,s.temperament,g.boss.hp/g.boss.maxHp);Object.assign(s,{state:'attack',t:0,slot:pattern.slot,name:pattern.name,currentPattern:s.temperament+':'+pattern.slot,coinFace:pattern.coinFace||null,chessPiece:pattern.chessPiece||null,hazards:pattern.hazards,duration:pattern.duration});g.events.push({type:'dice-giant-warning',name:s.name});}
 if(s.state==='attack'){
  for(const h of giantHazards(g)){const original=s.hazards[h.id];if(!h.live||original.hit||!hazardContains(h,g.player))continue;original.hit=true;if(diceInvulnerable(g.player))continue;
   const amount=Math.min(g.player.hp,h.damage);g.player.hp-=amount;g.player.invuln=.55;g.events.push({type:'player-hit',amount,source:'giant'});
   if(g.player.hp<=0){g.status='lost';s.hazards=[];g.events.push({type:'death'});return;}
  }
  if(s.t>=s.duration+.65){s.state='recovery';s.t=0;s.hazards=[];}
 }
 moveHands(g,dt);
 g.dice.pose=giantHeadPose(g);
}
// Each hand is a persistent mini-boss HP pool; destroyed palms do not recover and never stagger the giant.
// The damage dealt to a hand drains the boss one-to-one, so phase two progresses through the hands.
export function strikeGiantHand(g,index,amount){
 const s=g.dice.giant;if(!s||!Number.isFinite(amount)||amount<=0||index!==0&&index!==1||s.destroyed[index]||['transition','dead'].includes(s.state))return 0;
 const dealt=Math.min(s.hands[index],amount);
 s.hands[index]-=dealt;
 g.events.push({type:'dice-giant-hand-hit',index,amount:dealt});
 if(s.hands[index]<=0){
  s.hands[index]=0;s.destroyed[index]=true;s.crumble=s.crumble||[0,0];s.crumble[index]=0;
  g.events.push({type:'dice-giant-hand-destroyed',index,remaining:s.destroyed.filter(v=>!v).length});
 }
 return Math.max(.01,dealt);
}
