export function diceTempo(boss){
 const ratio=Number.isFinite(boss.hp)&&Number.isFinite(boss.maxHp)&&boss.maxHp>0?Math.max(0,Math.min(1,boss.hp/boss.maxHp)):1;
 return .65+.35*ratio;
}
export function syncDiceClock(g){const d=g.dice;if(d.clockState!==d.state){d.clockState=d.state;d.tempo=diceTempo(g.boss);}return d.tempo;}
export function updateDicePhase(g){
 if(g.status!=='playing'||g.boss.hp<=0||!(g.boss.maxHp>0)||(g.boss.phase||1)>=2||g.boss.hp>g.boss.maxHp*.5)return false;
 g.boss.phase=2;g.boss.phase2PendingDesign=true;g.events.push({type:'dice-phase-change',phase:2,pendingDesign:true});return true;
}
