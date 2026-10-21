import {DICE_RULES as R,DICE_BOARD,onDiceBoard,nearestDiceTile,diceDirection,diceRollPose,diceCrushes} from './dice-data.mjs';
const emit=(g,type,data={})=>g.events.push({type,...data});
function prepare(g){const d=g.dice;d.from=DICE_BOARD[d.index];d.to=DICE_BOARD[d.index+diceDirection(d.index,nearestDiceTile(g.player))];d.base=[...d.rotation];d.state='warning';d.t=0;d.pose=diceRollPose(d.from,d.to,0,d.base);emit(g,'dice-warning',{from:d.from.index,to:d.to.index,duration:R.warning});}
export function createDiceGame(){const p=DICE_BOARD[DICE_BOARD.length-1],g={status:'playing',time:0,events:[],player:{x:p.x,z:p.z,hp:120,maxHp:120},boss:{name:R.name,hp:R.hp,maxHp:R.hp},dice:{index:0,state:'idle',t:0,rotation:[0,0,0,1],base:[0,0,0,1],pose:null,from:null,to:null}};prepare(g);return g;}
export function damageDice(g,amount){if(g.status!=='playing'||!Number.isFinite(amount)||amount<=0)return 0;const n=Math.min(g.boss.hp,amount);g.boss.hp-=n;emit(g,'boss-hit',{amount:n});if(g.boss.hp===0){g.status='won';g.dice.state='dead';emit(g,'victory',{boss:'dice'});}return n;}
function crush(g){if(!diceCrushes(g.player,g.dice.pose))return false;g.player.hp=0;g.status='lost';emit(g,'player-crushed',{boss:'dice',instant:true});emit(g,'death');return true;}
function tick(g,dt,input){const p=g.player,d=g.dice,x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,n=Math.max(1,Math.hypot(x,z)),speed=input.roll?10:R.playerSpeed*(input.blue?1.5:1),nx=p.x+x/n*speed*dt,nz=p.z+z/n*speed*dt;if(onDiceBoard({x:nx,z:p.z}))p.x=nx;if(onDiceBoard({x:p.x,z:nz}))p.z=nz;g.time+=dt;if(input.freezeBoss){crush(g);return;}d.t+=dt;
 if(d.state==='warning'&&d.t>=R.warning){d.state='rolling';d.t=0;emit(g,'dice-roll');}
 else if(d.state==='rolling'){const u=Math.min(1,d.t/R.rollTime);d.pose=diceRollPose(d.from,d.to,u,d.base);if(crush(g))return;if(u===1){d.index=d.to.index;d.rotation=[...d.pose.rotation];d.state='recovery';d.t=0;emit(g,'dice-impact',{x:d.pose.x,z:d.pose.z});}}
 else if(d.state==='recovery'&&d.t>=R.recovery)prepare(g);
 if(g.status==='playing')crush(g);
}
export function stepDice(g,dt,input={}){if(g.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,.1);while(left>1e-9&&g.status==='playing'){const h=Math.min(left,1/120);tick(g,h,input);left-=h;}}
