import {applyBossHitTrait,tickBossHitTraits,playerIncapacitated} from './boss-hit-traits.mjs';
import {BOSS_TEMPO} from './boss-tempo.mjs';
import {stepGiant} from './dice-giant.mjs';
import {stepDiceFaceAttacks} from './dice-face-attacks.mjs';
import {beginChainSweep} from './dice-chain-sweep.mjs';
import {stepPortraitBarrage} from './dice-portrait-barrage.mjs';
import {playerIncomingDamage,weaponStats} from './weapon-stats.mjs';
import {createPatternShuffle,drawPatternShuffle} from './pattern-shuffle.mjs';
import {nextDiceRoamTile} from './dice-autonomy.mjs';
import {diceInvulnerable} from './dice-defense.mjs';
import {DICE_RULES as R,DICE_BOARD,onDiceBoard,nearestDiceTile,diceDirection,diceRollPose} from './dice-data.mjs';
import {resolveDiceContact} from './dice-contact.mjs';
import {diceTopFace} from './dice-orientation.mjs';
import {beginDiceRoulette,stepDiceRoulette,clearDiceRoulette} from './dice-roulette-attack.mjs';
import {diceSlowFactor,stepDiceSlow,clearDiceFaceAttack} from './dice-slow.mjs';
import {syncDiceClock,updateDicePhase} from './dice-pressure.mjs';
import {squareContains} from './dice-square.mjs';
import {FRENZY_WINDUP,advanceFrenzyWindup} from './dice-frenzy-windup.mjs';
export const DICE_PATTERNS=Object.freeze({chargeWarning:1.12*BOSS_TEMPO.windup,chargeTime:.5,jumpWarning:1.3*BOSS_TEMPO.windup,jumpTime:1.6,jumpHeight:17,stompRadius:14,stompDamage:44,frenzyRolls:4,frenzyWarning:Math.max(.8,.82*BOSS_TEMPO.windup),frenzyRollTime:.38,chainWarning:1.3*BOSS_TEMPO.windup,pipWarning:1.35*BOSS_TEMPO.windup,pipWarningP2:1.2*BOSS_TEMPO.windup,pipDamage:34,pipDamageP2:38,pipFlash:.4,pipHalf:6});
const PIP_LAYOUT=Object.freeze({1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]});
const emit=(g,type,data={})=>{const tempo=syncDiceClock(g);g.events.push({type,...data,...(data.duration===undefined?{}:{duration:data.duration*tempo})});};
function prepare(g,announce=true){const d=g.dice;d.from=DICE_BOARD[d.index];d.to=DICE_BOARD[nextDiceRoamTile(d,g.player)];d.base=[...d.rotation];d.warningTime=d.frenzyRemaining>0&&!d.frenzyFirst?DICE_PATTERNS.frenzyWarning:R.warning;d.rollTime=d.frenzyRemaining>0?DICE_PATTERNS.frenzyRollTime:R.rollTime;d.frenzyFirst=false;d.state='warning';d.t=0;d.longRecovery=false;d.pose=diceRollPose(d.from,d.to,0,d.base);if(announce)emit(g,'dice-warning',{from:d.from.index,to:d.to.index,duration:d.warningTime,frenzy:d.frenzyRemaining>0});}
export function createDiceGame({seed}={}){const p=DICE_BOARD[DICE_BOARD.length-1],g={status:'playing',time:0,events:[],player:{x:p.x,z:p.z,hp:120,maxHp:120},boss:{name:R.name,hp:R.hp,maxHp:R.hp,phase:1},dice:{index:0,state:'idle',t:0,rotation:[0,0,0,1],base:[0,0,0,1],pose:null,from:null,to:null,moves:0,patternCount:0,patternShuffle:createPatternShuffle(seed),lastAttackSlot:null,pendingPattern:false,telegraph:null,groundSpikes:null,spikeCooldown:0,facePattern:null,frenzyRemaining:0,longRecovery:false,chainCharges:0,pips:null,roulette:null,rouletteShots:[],rouletteTurn:0}};g.dice.roamBias=g.dice.patternShuffle.seed%3;prepare(g);return g;}
function clearHazards(g){clearDiceRoulette(g);clearDiceFaceAttack(g);Object.assign(g.dice,{telegraph:null,groundSpikes:null,facePattern:null,frenzyRemaining:0,chainCharges:0,pips:null});}
export function damageDice(g,amount,point=null,{dot=false}={}){if(g.status!=='playing'||g.dice.giant?.state==='transition'||!Number.isFinite(amount)||amount<=0)return 0;const n=Math.min(g.boss.hp,amount);g.boss.hp-=n;if(!dot)emit(g,'boss-hit',{amount:n,...(point?{x:point.x,y:point.y,z:point.z}:{})});if(g.boss.hp===0){g.status='won';if(g.dice.giant){g.dice.giant.deathFrom={...g.dice.pose,rotation:[...g.dice.pose.rotation]};g.dice.giant.state='dead';g.dice.giant.hazards=[];}clearHazards(g);g.dice.state='dead';emit(g,'victory',{boss:'dice'});}else updateDicePhase(g);return n;}
function ordinaryHit(g,damage,source){const p=g.player;if(diceInvulnerable(p))return false;const amount=Math.min(p.hp,playerIncomingDamage(g,damage));p.hp-=amount;p.invuln=Math.max(p.invuln||0,.32);applyBossHitTrait(g,amount,{boss:'dice'});emit(g,'player-hit',{amount,source});if(p.hp>0)return false;g.status='lost';g.deathCause=source;clearHazards(g);emit(g,'death');return true;}
function crushBody(g){
 if(g.dice.state!=='rolling')return false;
 const p=g.player;
 if(g.boss.phase===1){if(g.dice.crushCooldown>0)return false;const amount=Math.min(p.hp,playerIncomingDamage(g,DICE_PATTERNS.stompDamage));g.dice.crushCooldown=1.1;p.hp-=amount;p.invuln=Math.max(p.invuln||0,1.05);applyBossHitTrait(g,amount,{boss:'dice'});emit(g,'player-crushed',{boss:'dice',instant:false,amount});if(p.hp>0)return false;}else{p.hp=0;emit(g,'player-crushed',{boss:'dice',instant:true});}
 g.status='lost';g.deathCause='crush';clearHazards(g);emit(g,'death');return true;
}
function contact(g,moving){const q=resolveDiceContact(g.player,g.dice.pose,moving);if(q.crushed)return crushBody(g);g.player.x=q.x;g.player.z=q.z;return false;}
export function diceBottomFace(rotation){const top=diceTopFace(rotation);return top?{face:top.face^1,pips:7-top.pips}:null;}
function beginPips(g,afterRoll=false){
 const d=g.dice,phase2=g.boss.phase===2,face=afterRoll?diceBottomFace(d.rotation):diceTopFace(d.rotation),pips=face?.pips||1,c=DICE_BOARD[nearestDiceTile(g.player)],n=R.side;
 const col=Math.max(1,Math.min(n-2,c.index%n)),row=Math.max(1,Math.min(n-2,Math.floor(c.index/n))),tiles=PIP_LAYOUT[pips].map(([dx,dz])=>(row+dz)*n+col+dx);
 d.state='pip-warning';d.t=0;d.chargeWarnTime=undefined;d.chainCharges=0;d.telegraph=null;d.pips={tiles,pips,face:face?.face,afterRoll,warn:phase2?DICE_PATTERNS.pipWarningP2:DICE_PATTERNS.pipWarning,damage:phase2?DICE_PATTERNS.pipDamageP2:DICE_PATTERNS.pipDamage,flash:0,burst:false};emit(g,'dice-pip-warning',{tiles,pips,face:face?.face,bottom:afterRoll,duration:d.pips.warn});
}
function burstPips(g){const d=g.dice,p=g.player,pp=d.pips,tiles=pp.tiles.map(i=>DICE_BOARD[i]),reach=DICE_PATTERNS.pipHalf+R.playerRadius,hit=tiles.some(t=>Math.abs(p.x-t.x)<=reach&&Math.abs(p.z-t.z)<=reach);pp.flash=DICE_PATTERNS.pipFlash;pp.burst=true;d.state='recovery';d.t=0;for(const t of tiles)emit(g,'dice-impact',{x:t.x,z:t.z,source:'dice-pip'});emit(g,'dice-pip-burst',{tiles:pp.tiles,pips:pp.pips});if(hit&&ordinaryHit(g,pp.damage,'dice-pip'))return;if(pp.afterRoll&&g.status==='playing')completeRoll(g);}
function beginPattern(g){const d=g.dice;d.pendingPattern=false;d.from=DICE_BOARD[d.index];d.t=0;d.topFace=diceTopFace(d.rotation);const phase2=g.boss.phase===2,slots=phase2?[0,1,2,3,4,5,6,7,8]:[0,1,2];
 const distance=Math.hypot(g.player.x-d.pose.x,g.player.z-d.pose.z);
 const preferred=distance<14?[1,0,2,8]:distance>22?(phase2?[7,5,6,0,3,4,2]:[0,2]):[];
 // Forced slots are an explicit diagnostics/test seam; ordinary gameplay
 // always consumes the phase-specific randomized, fully balanced shuffle bag.
 const slot=Number.isInteger(d.forcedPatternSlot)
  ?slots.includes(d.forcedPatternSlot)?d.forcedPatternSlot:slots[0]
  :drawPatternShuffle(d.patternShuffle,'dice-'+(phase2?2:1),slots,{preferred,avoid:d.lastAttackSlot});
 delete d.forcedPatternSlot;d.patternCount++;d.lastAttackSlot=slot;
 // Both archived phase-two techniques now have exclusive, fully warned
 // slots rather than firing invisibly on top of a charge or a roulette.
 if(phase2&&slot>=7){
  d.state='face-pattern';d.t=0;d.facePattern=slot===7?'portrait':'chain';
  d.telegraph=null;
  if(slot===8)beginChainSweep(g);
  else{
   d.nextFaceAttack='portrait';
   stepPortraitBarrage(g,.0001,false,R.edge,65,R.playerRadius,true);
  }
  return;
 }
 // The roulette visibly announces its count before any physical chip is fired.
 if(phase2&&slot>=5){beginDiceRoulette(g,slot===6?'jackpot':'count');return;}
 if(slot===2){d.frenzyRemaining=DICE_PATTERNS.frenzyRolls;d.frenzyFirst=true;prepare(g,false);d.state='frenzy-windup';d.t=0;g.events.push({type:'dice-frenzy-windup',duration:FRENZY_WINDUP,rolls:d.frenzyRemaining});return;}if(phase2&&slot===4){beginPips(g);return;}const jump=slot===1;d.chargeWarnTime=undefined;d.chainCharges=phase2&&slot===3?1:0;d.state=jump?'jump-warning':'charge-warning';if(jump)d.to=DICE_BOARD[nearestDiceTile(g.player)];else{const dir=diceDirection(d.index,nearestDiceTile(g.player));let i=d.index;for(let k=0;k<3;k++){const a=DICE_BOARD[i],b=DICE_BOARD[i+dir];if(!b||Math.abs(b.x-a.x)+Math.abs(b.z-a.z)>R.edge+.001)break;i+=dir;}d.to=DICE_BOARD[i];}d.telegraph={kind:jump?'circle':'line',shape:jump?'square':'rectangle',from:{x:d.from.x,z:d.from.z},to:{x:d.to.x,z:d.to.z},radius:DICE_PATTERNS.stompRadius,width:R.edge+R.playerRadius*2};emit(g,jump?'dice-jump-warning':'dice-charge-warning',{...d.telegraph,topFace:d.topFace,duration:jump?DICE_PATTERNS.jumpWarning:DICE_PATTERNS.chargeWarning});}
function startChainCharge(g){const d=g.dice;d.from=DICE_BOARD[d.index];d.topFace=diceTopFace(d.rotation);const dir=diceDirection(d.index,nearestDiceTile(g.player));let i=d.index;for(let k=0;k<3;k++){const a=DICE_BOARD[i],b=DICE_BOARD[i+dir];if(!b||Math.abs(b.x-a.x)+Math.abs(b.z-a.z)>R.edge+.001)break;i+=dir;}d.to=DICE_BOARD[i];d.state='charge-warning';d.t=0;d.chargeWarnTime=DICE_PATTERNS.chainWarning;d.telegraph={kind:'line',shape:'rectangle',from:{x:d.from.x,z:d.from.z},to:{x:d.to.x,z:d.to.z},radius:DICE_PATTERNS.stompRadius,width:R.edge+R.playerRadius*2};emit(g,'dice-charge-warning',{...d.telegraph,topFace:d.topFace,duration:DICE_PATTERNS.chainWarning,combo:true});}
function flatPose(d,x,z,y=R.edge/2){const dx=d.to.x-d.from.x,dz=d.to.z-d.from.z,n=Math.hypot(dx,dz);return {x,y,z,dx:n?dx/n:1,dz:n?dz/n:0,angle:0,rotation:[...d.rotation]};}
function footprint(g){const p=g.player,d=g.dice;return Math.abs(p.x-d.pose.x)<=R.edge/2+R.playerRadius&&Math.abs(p.z-d.pose.z)<=R.edge/2+R.playerRadius;}
function finishPattern(g){const d=g.dice;d.index=d.to.index;d.state='recovery';d.t=0;d.telegraph=null;emit(g,'dice-impact',{x:d.pose.x,z:d.pose.z});if(d.chainCharges>0){d.chainCharges--;startChainCharge(g);}}
function completeRoll(g){const d=g.dice;if(d.frenzyRemaining>0){d.frenzyRemaining--;if(d.frenzyRemaining>0){prepare(g);return;}d.longRecovery=true;d.pendingPattern=false;d.state='recovery';d.t=0;emit(g,'dice-frenzy-end');return;}d.moves++;d.pendingPattern=d.moves%2===0;d.state='recovery';d.t=0;syncDiceClock(g);}
function finishRoll(g){const d=g.dice;d.roamPrevious=d.index;d.index=d.to.index;d.rotation=[...d.pose.rotation];emit(g,'dice-impact',{x:d.pose.x,z:d.pose.z});if(g.boss.phase===1){beginPips(g,true);return;}completeRoll(g);}
function tick(g,dt,input){tickBossHitTraits(g,dt);g.dice.crushCooldown=Math.max(0,(g.dice.crushCooldown||0)-dt);const p=g.player,d=g.dice,locked=playerIncapacitated(p),x=!locked&&Number.isFinite(input.x)?input.x:0,z=!locked&&Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z)),speed=input.roll?(Number.isFinite(input.rollSpeed)?input.rollSpeed:10):R.playerSpeed*weaponStats(g.weapon).walkSpeed*(Number.isFinite(input.blueSpeed)?input.blueSpeed:input.blue?1.5:1)*diceSlowFactor(p),nx=p.x+(d.giant?.state==='transition'?0:x/n*speed*dt),nz=p.z+(d.giant?.state==='transition'?0:z/n*speed*dt);if(onDiceBoard({x:nx,z:p.z}))p.x=nx;if(onDiceBoard({x:p.x,z:nz}))p.z=nz;g.time+=dt;stepDiceSlow(p,dt);updateDicePhase(g);
 if(d.giant){d.pips=null;clearDiceRoulette(g);stepGiant(g,dt,Boolean(input.freezeBoss));return;}
 stepDiceRoulette(g,dt,Boolean(input.freezeBoss));if(g.status!=='playing')return;
 if(d.state==='face-pattern'){
  // One boss pattern runs at a time. Keep its telegraph and projectile/sweep
  // alive through all warning frames; never start the next move mid-flight.
  stepDiceFaceAttacks(g,dt,Boolean(input.freezeBoss),R.edge,65,R.playerRadius);
  if(!d.groundSpikes&&g.status==='playing'&&!input.freezeBoss){
   d.facePattern=null;d.state='recovery';d.t=0;d.longRecovery=false;
  }
  if(g.status==='playing')contact(g,false);
  return;
 }
 if(d.pips&&d.pips.flash>0){d.pips.flash-=dt;if(d.pips.flash<=0)d.pips=null;}
 if(input.freezeBoss){if(!['jump','charge'].includes(d.state))contact(g,false);return;}
 if(d.state==='frenzy-windup'){if(advanceFrenzyWindup(d,dt)){d.state='warning';d.t=0;emit(g,'dice-warning',{from:d.from.index,to:d.to.index,duration:d.warningTime,frenzy:true});emit(g,'dice-frenzy-start',{rolls:d.frenzyRemaining});}contact(g,false);return;}d.t+=dt/syncDiceClock(g);
 if(d.state==='warning'&&d.t>=(d.warningTime??R.warning)){d.state='rolling';d.t=0;emit(g,'dice-roll');}
 else if(d.state==='rolling'){const u=Math.min(1,d.t/(d.rollTime??R.rollTime));d.pose=diceRollPose(d.from,d.to,u,d.base);if(contact(g,true))return;if(u===1)finishRoll(g);}
 else if(d.state==='recovery'&&d.t>=R.recovery*(d.longRecovery?2:1)){d.longRecovery=false;if(d.pendingPattern)beginPattern(g);else prepare(g);}
 else if(d.state==='pip-warning'&&d.pips&&d.t>=d.pips.warn){burstPips(g);}
 else if(d.state==='charge-warning'&&d.t>=(d.chargeWarnTime??DICE_PATTERNS.chargeWarning)){d.state='charge';d.t=0;emit(g,'dice-charge');}
 else if(d.state==='charge'){const u=Math.min(1,d.t/DICE_PATTERNS.chargeTime);d.pose=flatPose(d,d.from.x+(d.to.x-d.from.x)*u,d.from.z+(d.to.z-d.from.z)*u);if(footprint(g)&&ordinaryHit(g,DICE_PATTERNS.stompDamage,'dice-charge'))return;if(u===1)finishPattern(g);}
 else if(d.state==='jump-warning'&&d.t>=DICE_PATTERNS.jumpWarning){d.state='jump';d.t=0;emit(g,'dice-jump');}
 else if(d.state==='jump'){const u=Math.min(1,d.t/DICE_PATTERNS.jumpTime),s=u*u*(3-2*u);d.pose=flatPose(d,d.from.x+(d.to.x-d.from.x)*s,d.from.z+(d.to.z-d.from.z)*s,R.edge/2+4*DICE_PATTERNS.jumpHeight*u*(1-u));if(u===1){if((footprint(g)||squareContains(p,d.to,DICE_PATTERNS.stompRadius,R.playerRadius))&&ordinaryHit(g,DICE_PATTERNS.stompDamage,'dice-stomp'))return;emit(g,'dice-stomp',{x:d.to.x,z:d.to.z,radius:DICE_PATTERNS.stompRadius,shape:'square'});if(g.status==='playing')finishPattern(g);}}
 if(g.status==='playing'&&!['charge','jump'].includes(d.state))contact(g,d.state==='rolling');
}
export function stepDice(g,dt,input={}){if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,.1);while(left>1e-9&&g.status==='playing'){const h=Math.min(left,1/120);tick(g,h,input);left-=h;}}
