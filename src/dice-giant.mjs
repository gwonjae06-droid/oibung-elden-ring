import {applyBossHitTrait} from './boss-hit-traits.mjs';
import {diceInvulnerable} from './dice-defense.mjs';
import {POSSESSION,cinematicBeat,possessionPose} from './dice-giant-cinematic-data.mjs';
export const GIANT={transition:POSSESSION.end,recovery:2.4,feralRecovery:1.5,handHp:340,crumble:1.15,rageBeat:1.2,rageHp:1/3,handDisable:8,handRecover:.6};
export const GIANT_NAMES=['거인의 손가락','칩 정렬','운명의 다이스','코인 플립','체스의 행마','양손 압박','룰렛 선언','교차 내려찍기','운명의 손도장'];
export const FERAL_NAMES=['광란의 내려찍기','탁자 쓸어버리기','주사위 머리 박기','짐승의 양손 압박','부서진 체스판','분노의 난타','최후의 올인','머리 떨림 · 5연속 박치기','폭주하는 룰렛','짐승의 삼연속 박치기'];
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
 const x=clamp(player.x,-48,48),z=clamp(player.z,-48,48),slot=index%GIANT_NAMES.length;let hazards=[];const turn=Math.floor(index/7),coinFace=turn%2?'tails':'heads',chessPiece=['rook','bishop','knight'][turn%3];
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
 if(slot===7)hazards=[{...rect(-28,z,23,38,0,1),handIndex:0},{...rect(28,z,23,38,.6,1),handIndex:1},
  {...circle(x-12,z,10,1.4,.95,36),handIndex:0},{...circle(x+12,z,10,2.0,.95,36),handIndex:1}];
 if(slot===8)hazards=Array.from({length:6},(_,i)=>({...circle(clamp(x+(i%2?17:-17)),clamp(z+(i%3-1)*8),9,i*.46,.85,30),handIndex:i%2,active:.27}));
 return {slot,name:GIANT_NAMES[slot]+(slot===3?' · '+(coinFace==='heads'?'앞면':'뒷면'):slot===4?' · '+({rook:'룩',bishop:'비숍',knight:'나이트'})[chessPiece]:''),coinFace:slot===3?coinFace:null,chessPiece:slot===4?chessPiece:null,hazards:hazards.map((h,i)=>({...h,id:i,handIndex:Number.isInteger(h.handIndex)?h.handIndex:handKind({slot,temperament},h)?i%2:null,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
}
function feralPattern(index,player,healthRatio=1){
 const x=clamp(player.x,-45,45),z=clamp(player.z,-45,45),slot=index%FERAL_NAMES.length;let hazards=[];
 if(slot===0)hazards=[circle(x-13,z,11,0,1.25,35),circle(x+13,z,11,.6,1.2,35),circle(x,z-8,12,1.2,1.2,40)];
 if(slot===1)hazards=Array.from({length:4},(_,i)=>rect(-42+i*28,z,28,24,i*.32,1.25));
 if(slot===2){
  // Consecutive head slams. Only the slam itself hurts; the table ripple it causes is purely visual (see dice-ripple.mjs).
  const repeats=healthRatio<=.12?4:healthRatio<=.19?3:2;
  for(let i=0;i<repeats;i++){
   const shift=i===0?0:i%2?-12:12,start=i*3.3,headX=clamp(x+shift,-26,26),headZ=clamp(z,-51,-34);
   hazards.push({...circle(headX,headZ,15,start,1.2,42),headSlam:true,active:1.5,hold:1.5});
  }
 }
 if(slot===3)hazards=[rect(-31,z,26,33,0,1.5),rect(31,z,26,33,.45,1.4)];
 if(slot===4)hazards=[[0,0],[-25,-25],[25,25],[-25,25],[25,-25]].map(([a,b],i)=>circle(x+a,z+b,9,i*.27,1.1));
 if(slot===5)hazards=Array.from({length:5},(_,i)=>circle(x+(i%2?16:-16),z+(i-2)*7,9,i*.43,1.0,32));
 if(slot===6)hazards=[...feralPattern(1,player).hazards.slice(0,3),...feralPattern(0,player).hazards.map(h=>({...h,start:h.start+3})),...feralPattern(2,player,healthRatio).hazards.map(h=>({...h,start:h.start+6}))];
 if(slot===7){
  // First the head vibrates in place for a full second, then strikes five times in rapid succession.
  hazards=Array.from({length:5},(_,i)=>({...circle(clamp(x+(i%2?8:-8),-26,26),clamp(z+(i%3-1)*5,-51,-34),13,1+i*.88,.46,35),headSlam:true,rapid:true,active:.2}));
 }
 if(slot===8)hazards=Array.from({length:6},(_,i)=>({...rect(-42+i*17,z+(i%2?9:-9),16,38,i*.3,.8),handIndex:i%2,active:.23,damage:34}));
 if(slot===9)hazards=Array.from({length:3},(_,i)=>({...circle(clamp(x+(i-1)*13,-26,26),clamp(z+(i%2?5:-5),-51,-34),14,.75+i*1.85,.72,42),headSlam:true,rapid:true,active:.34}));
 return {slot,name:FERAL_NAMES[slot],hazards:hazards.map((h,i)=>({...h,id:i,handIndex:Number.isInteger(h.handIndex)?h.handIndex:handKind({slot,temperament:'feral'},h)?i%2:null,hit:false})),duration:Math.max(...hazards.map(h=>h.start+h.warn+h.active))};
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
 if(s.temperament==='feral')return [0,1,3,4,5,6,8].includes(s.slot)?'reach':null;
 if(giantPropType(s,h))return 'throw';
 return [0,5,6,7,8].includes(s.slot)?'reach':null;
}
export const handCanAttack=(s,i)=>Boolean(s&&!s.destroyed?.[i]&&!(s.revive?.[i]>0));
export function beginGiant(g){
 g.boss.name='운명의 찬탈자 박성원';const d=g.dice;d.giant={state:'transition',t:0,ordinal:0,temperament:'controlled',rageTriggered:false,rageBeat:0,cinematicBeat:'still',hands:[GIANT.handHp,GIANT.handHp],destroyed:[false,false],disabledFor:[0,0],revive:[0,0],crumble:[0,0],smooth:HAND_REST.map(h=>({...h})),hazards:[],from:{...d.pose,rotation:[...d.pose.rotation]}};
 d.state='giant';d.telegraph=d.pips=d.groundSpikes=null;d.frenzyRemaining=d.chainCharges=0;d.stun=0;
 g.player.action=null;if(g.projectiles)g.projectiles.length=0;g.boss.phase2PendingDesign=false;g.events.push({type:'dice-possession',duration:GIANT.transition});
}
export function beginFeral(g){
 const q=g.dice.giant;
 if(!q||q.rageTriggered||q.state==='dead')return false;
 if(q.state==='transition'){q.pendingFeral=true;return true;}
 q.pendingFeral=false;q.rageTriggered=true;q.temperament='feral';q.rageBeat=GIANT.rageBeat;
 q.state='recovery';q.t=-GIANT.rageBeat;q.hazards=[];
 q.hands=[GIANT.handHp,GIANT.handHp];q.destroyed=[false,false];q.disabledFor=[0,0];q.revive=[GIANT.handRecover,GIANT.handRecover];q.crumble=[0,0];
 g.player.action=null;if(g.projectiles)g.projectiles.length=0;
 g.events.push({type:'dice-giant-feral',duration:GIANT.rageBeat});return true;
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
  if(s.slot===7&&s.t<1){
   const tremor=ease(s.t/.65),shake=Math.sin(s.t*76)*.85*tremor;
   return {lean:.13*tremor,bodyX:shake*.6,head:{...rest,x:shake*2,y:58+Math.sin(s.t*98)*1.25*tremor,z:-106+Math.cos(s.t*70)*1.2*tremor}};
  }
  // Keep the forehead pressed into the table for 1.5s on the heavy single/combo slam.
  // The special five-hit barrage withdraws rapidly for each subsequent strike.
  const h=s.hazards?.find(h=>h.headSlam&&s.t>=h.start-(h.rapid?.28:.35)&&s.t<=h.start+h.warn+h.active+(h.rapid?.25:.65));
  if(h){
   const age=s.t-h.start,rapid=Boolean(h.rapid),dropTime=rapid?.10:.14;
   const drop0=h.warn-dropTime,wind=ease((age+(rapid?.28:0))/Math.max(.25,drop0+(rapid?.28:0)));
   const drop=ease((age-drop0)/dropTime);
   const withdraw=ease((age-h.warn-h.active)/(rapid?.24:.62));
   const lean=(.40*wind+.60*drop)*(1-withdraw);
   return {lean,bodyX:h.x*.65*lean,head:{x:lerp(0,h.x,lean),y:lerp(58,7,lean),z:lerp(-106,h.z,lean),rotation}};
  }
 }
 if(s.state==='attack'&&s.temperament==='controlled'){
  const h=s.hazards?.find(h=>h.handIndex!=null&&!h.cancelled&&handCanAttack(s,h.handIndex)&&s.t>=h.start-.5&&s.t<=h.start+h.warn+h.active+.2);
  if(h){const bend=.2*ease((s.t-h.start+.5)/Math.max(.4,h.warn+.5));
   return {lean:bend,bodyX:h.x*bend*.35,head:{...rest,x:h.x*bend*.3,y:58-8*bend,z:-106+12*bend}};
  }
 }
 return {lean:0,bodyX:0,head:rest};
}
export function giantHeadPose(g){return giantPosture(g).head;}
export function giantHazards(g){const s=g.dice.giant;if(s?.state!=='attack')return [];return s.hazards.filter(h=>!h.cancelled&&(h.handIndex==null||handCanAttack(s,h.handIndex))&&s.t>=h.start&&s.t<h.start+h.warn+h.active).map(h=>({...h,age:s.t-h.start,live:s.t>=h.start+h.warn,r:h.shape==='ring'?Math.max(0,(s.t-h.start-h.warn)/h.active)*62:h.r}));}
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
 if(!handCanAttack(s,index))return {...rest,y:s.destroyed?.[index]?.6:2,fist:0};
 if(s.state==='transition')return {...rest,y:2+25*(1-ease((s.t-4.7)/1.0)),fist:0};
 if(s.state==='dead')return {...rest,y:.8,fist:0};
 const feral=s.temperament==='feral',time=g.time||0;
 let x=rest.x,z=rest.z,y=rest.y+(feral?.42*Math.sin(time*7+index*2):.16*Math.sin(time*1.8+index*2)),fist=feral?.85:0;
 if(s.state!=='attack')return {x,y,z,fist};
 const mine=(s.hazards||[]).filter(h=>!h.cancelled&&handKind(s,h)&&h.handIndex===index).sort((a,b)=>a.start-b.start);
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
 if(!s||['transition','dead'].includes(s.state)||!handCanAttack(s,index))return t;
 const p=s.smooth?.[index];return p?{x:p.x,y:p.y,z:p.z,fist:t.fist}:t;
}
export function giantHeadExposed(g){
 const s=g.dice.giant;
 return Boolean(s?.state==='attack'&&s.temperament==='feral'&&s.hazards?.some(h=>h.headSlam&&s.t>=h.start+h.warn&&s.t<=h.start+h.warn+h.active+.85));
}
export function giantAim(g){const s=g.dice.giant;if(!s)return g.dice.pose;if(giantHeadExposed(g))return giantHeadPose(g);const hands=[0,1].filter(i=>handCanAttack(s,i)).map(i=>giantHandPose(g,i));if(!hands.length)return giantHeadPose(g);return hands.sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];}
export function stepGiant(g,dt,frozen=false){
 const q=g.dice.giant;if(!q||q.state==='dead')return;
 if(q.state==='transition'){
  const before=q.t;q.t=Math.min(GIANT.transition,q.t+dt);
  if(before<POSSESSION.launchEnd&&q.t>=POSSESSION.launchEnd)g.events.push({type:'dice-giant-neck-impact'});
  q.cinematicBeat=cinematicBeat(q.t);
  if(q.t>=GIANT.transition){q.state='recovery';q.t=0;g.events.push({type:'dice-possessed'});if(q.pendingFeral)beginFeral(g);}
  g.dice.pose=giantHeadPose(g);return;
 }
 if(frozen)return;
 if(g.boss.phase===3&&!q.rageTriggered)beginFeral(g);
 q.rageBeat=Math.max(0,(q.rageBeat||0)-dt);q.t+=dt;
 q.crumble=q.crumble||[0,0];q.revive=q.revive||[0,0];q.disabledFor=q.disabledFor||[0,0];
 for(const i of [0,1]){
  if(q.destroyed[i]){
   q.crumble[i]+=dt;q.disabledFor[i]=Math.max(0,q.disabledFor[i]-dt);
   if(q.disabledFor[i]<=0){
    q.destroyed[i]=false;q.hands[i]=GIANT.handHp;q.crumble[i]=0;q.revive[i]=GIANT.handRecover;
    g.events.push({type:'dice-giant-hand-recovered',index:i});
   }
  }else q.revive[i]=Math.max(0,q.revive[i]-dt);
 }
 if(q.state==='recovery'&&q.t>=(q.temperament==='feral'?GIANT.feralRecovery:GIANT.recovery)){
  const ordinal=q.ordinal++,pattern=giantPattern(ordinal,g.player,q.temperament,g.boss.hp/g.boss.maxHp);
  Object.assign(q,{state:'attack',t:0,slot:pattern.slot,name:pattern.name,currentPattern:q.temperament+':'+pattern.slot,coinFace:pattern.coinFace||null,chessPiece:pattern.chessPiece||null,hazards:pattern.hazards,duration:pattern.duration});
  g.events.push({type:'dice-giant-warning',name:q.name});
 }
 if(q.state==='attack'){
  for(const h of giantHazards(g)){
   const original=q.hazards[h.id];
   if(!h.live||original.hit||!(h.damage>0)||!hazardContains(h,g.player))continue;
   original.hit=true;if(diceInvulnerable(g.player))continue;
   const amount=Math.min(g.player.hp,h.damage);g.player.hp-=amount;g.player.invuln=.55;applyBossHitTrait(g,amount,{boss:'dice'});g.events.push({type:'player-hit',amount,source:'giant'});
   if(g.player.hp<=0){g.status='lost';q.hazards=[];g.events.push({type:'death'});return;}
  }
  if(q.t>=q.duration+.65){q.state='recovery';q.t=0;q.hazards=[];}
 }
 moveHands(g,dt);g.dice.pose=giantHeadPose(g);
}
// Shattered palms cannot move or attack until their independent timer expires.
export function strikeGiantHand(g,index,amount){
 const q=g.dice.giant;
 if(!q||!Number.isFinite(amount)||amount<=0||(index!==0&&index!==1)||!handCanAttack(q,index)||['transition','dead'].includes(q.state))return 0;
 const dealt=Math.min(q.hands[index],amount);q.hands[index]-=dealt;
 g.events.push({type:'dice-giant-hand-hit',index,amount:dealt});
 if(q.hands[index]<=0){
  q.hands[index]=0;q.destroyed[index]=true;q.disabledFor[index]=q.temperament==='feral'?5:GIANT.handDisable;q.revive[index]=0;q.crumble[index]=0;
  for(const h of q.hazards||[])if(h.handIndex===index)h.cancelled=true;
  g.events.push({type:'dice-giant-hand-destroyed',index,remaining:q.destroyed.filter(v=>!v).length,duration:q.disabledFor[index]});
 }
 return dealt;
}
