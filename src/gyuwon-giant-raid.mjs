// Simulation owns both visible limb positions and their contact volumes.
// The giant's part HP is local performance state; only the song ends an act.
export const GIANT_RAID_SCENES=Object.freeze([[0,'invitation'],[20,'hands'],[40,'lighting'],[90,'mask'],[109,'ensemble'],[140,'grand-stage'],[165,'finish']]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const point=a=>({x:a.x,y:a.y||2,z:a.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function setupGiantRaid(g,m,party){
 m.giantRaid=true;m.skillPoints=3;m.maxSkillPoints=5;m.targetIndex=0;m.wave=1;m.turnCount=0;m.supportClock=0;m.partBreaks=0;m.shield=0;m.partyAmp=0;m.usedAbilities=[[],[],[],[]];m.raidHistory=[];
 m.party=party.map((p,i)=>({...p,id:'ally'+i,team:1,index:i,x:-10+i*6.5,y:0,z:9+(i%2)*2,homeX:-10+i*6.5,homeZ:9+(i%2)*2,hp:i===1?175:125,maxHp:i===1?175:125,energy:75+i*7,av:10000/p.speed}));
 const defs=[['왼손',-13,2.7,-3,780,0,0],['오른손',13,2.7,-3,780,1,0],['무대 조명핵',-21,23,-18,1000,2,40],['얼굴의 가면',0,28,-25,900,0,90],['무대 중심핵',0,3,-9,1500,3,109]];
 m.enemies=defs.map(([name,x,y,z,hp,weakness,unlock],i)=>({name,x,y,z,homeX:x,homeY:y,homeZ:z,id:'enemy'+i,index:i,team:-1,hp,maxHp:hp,toughness:100,maxToughness:100,weakness,unlock,active:unlock===0,destroyed:false,broken:0,bleed:0,bleedClock:0,bind:0,speed:75+i*3,av:10000/(75+i*3)}));
 m.raidScene='invitation';m.raidSceneIndex=0;m.raidAttack=null;m.finishProgress=0;nextRaidTurn(m);
}
const live=m=>m.enemies.filter(e=>e.active&&!e.destroyed&&e.hp>0);
export function nextRaidTurn(m){
 const actors=[...m.party.filter(p=>p.hp>0),...live(m)];
 if(!actors.length){m.turn='support';m.turnActor=null;return;}
 actors.sort((a,b)=>a.av-b.av||a.id.localeCompare(b.id));const actor=actors[0],min=actor.av;
 for(const a of actors)a.av=Math.max(0,a.av-min);actor.av+=10000/actor.speed;
 m.turnActor=actor.id;m.turn=actor.team===1?'player':'boss';m.turnElapsed=0;m.turnWind=1.4;m.turnCount++;m.enemyHit=false;
 m.queue=actors.map(a=>({id:a.id,name:a.name,team:a.team,weapon:a.weapon,av:a.av})).sort((a,b)=>a.av-b.av);
 m.enemyVictim=m.party.filter(p=>p.hp>0)[m.turnCount%Math.max(1,m.party.filter(p=>p.hp>0).length)]?.id;
}
function hitPart(g,m,e,damage,p,c,type){
 if(!e?.active||e.destroyed||e.hp<=0)return;
 const weak=e.weakness===p.index,amplified=m.partyAmp>0?1.3:1,broken=e.broken>0?1.35:1;
 e.hp=Math.max(0,e.hp-damage*(weak?1.25:1)*amplified*broken);
 e.toughness=Math.max(0,e.toughness-(type==='skill'&&p.index===0?64:weak?38:18));
 if(e.toughness===0&&e.broken<=0){e.broken=4;e.av+=50;m.raidHistory.push({at:m.time,event:'break',part:e.index});c.deal(g,180,c.emit);}
 p.energy=Math.min(100,p.energy+(type==='ultimate'?0:19));
 c.deal(g,Math.round(damage),c.emit);m.hitTarget=e.id;m.hitTargetUntil=m.time+.35;
 if(e.hp===0){e.destroyed=true;m.partBreaks++;m.raidHistory.push({at:m.time,event:'destroy',part:e.index});c.deal(g,300,c.emit);for(const ally of m.party){ally.energy=Math.min(100,ally.energy+12);ally.av=Math.max(0,ally.av-14);}}
}
function beginAttack(m,type,p){
 const selected=m.enemies[m.targetIndex];const e=selected?.active&&!selected.destroyed&&selected.hp>0?selected:live(m)[0];if(!e)return false;
 m.targetIndex=e.index;
 const multi=type!=='light'&&(p.index===1||p.index===3),targets=multi?live(m):[e];
 m.actorMotion={actorId:p.id,targetId:e.id,type,age:0,hitAt:type==='ultimate'?1.5:1.05,duration:type==='ultimate'?2.65:1.8,fromX:p.x,fromY:p.y,fromZ:p.z,hit:false,
  projectiles:targets.map(target=>({part:target.index,from:{x:p.x,y:3,z:p.z},to:point(target),x:p.x,y:3,z:p.z,hit:false,visible:false,kind:['blade','circus','dice','blood'][p.index]}))};
 m.returnTurn=m.turn;m.turn='animation';if(!m.usedAbilities[p.index].includes(type))m.usedAbilities[p.index].push(type);
 if(p.index===2)m.actorMotion.diceValue=(m.turnCount*7+m.usedAbilities[2].length)%6+1;
 return true;
}
export function actGiantRaid(g,m,type,c){
 if(m.turn==='finish')return false;
 if(type==='target-next'||type==='target-prev'){
  const step=type==='target-next'?1:-1;for(let i=0;i<5;i++){m.targetIndex=(m.targetIndex+step+5)%5;const e=m.enemies[m.targetIndex];if(e.active&&!e.destroyed)return true;}return false;
 }
 if(/^target[0-4]$/.test(type)){const e=m.enemies[+type.slice(6)];if(!e.active||e.destroyed)return false;m.targetIndex=e.index;return true;}
 if(type.startsWith('ultimate')){const p=m.party[+type.slice(8)];if(!p||p.hp<=0||p.energy<100||m.actorMotion)return false;if(!beginAttack(m,'ultimate',p))return false;p.energy=0;return true;}
 if(m.turn!=='player'||m.actorMotion)return false;
 const p=m.party.find(p=>p.id===m.turnActor);if(!p)return false;
 if(type==='light'){if(!beginAttack(m,type,p))return false;m.skillPoints=Math.min(5,m.skillPoints+1);return true;}
 if(type==='skill'&&m.skillPoints>0){if(!beginAttack(m,type,p))return false;m.skillPoints--;return true;}
 if(type==='roll'||type==='support'){for(const ally of m.party)ally.hp=Math.min(ally.maxHp,ally.hp+(ally.hp<=0?35:10));p.energy=Math.min(100,p.energy+15);m.shield=2;nextRaidTurn(m);return true;}
 return false;
}
function attackContact(g,m,a,p,c){
 const type=a.type,ulti=type==='ultimate',skill=type==='skill';
 for(const shot of a.projectiles){
  const e=m.enemies[shot.part];if(shot.hit||!e.active||e.destroyed)continue;
  // Melee hits at the leap's physical contact; other roles hit when their
  // visible puppet/die/blood projectile reaches the corresponding part.
  if((p.index===0?distance({x:p.x,y:p.y+2,z:p.z},e):distance(shot,e))>3.7)continue;
  shot.hit=true;
  const damage=ulti?[280,115,245,125][p.index]:skill?[88,42,65,38][p.index]:[46,30,38,28][p.index];
  hitPart(g,m,e,damage,p,c,type);
  if(p.index===1&&(skill||ulti)){e.bind=ulti?5:2.5;e.av+=35;}
  if(p.index===3&&(skill||ulti)){e.bleed=ulti?8:6;e.bleedClock=1;e.broken+=e.broken>0?1:0;}
 }
 if(a.hit)return;a.hit=true;
 if(p.index===2&&(skill||ulti)){
  m.diceResult=a.diceValue;
  if(ulti||m.diceResult>=5)m.partyAmp=10;
  if(ulti||m.diceResult<=2)for(const ally of m.party)ally.energy=Math.min(100,ally.energy+18);
  if(m.diceResult===3||m.diceResult===4){const e=m.enemies[m.targetIndex];hitPart(g,m,e,35,p,c,type);}
 }
 if(p.index===3&&(skill||ulti)){for(const ally of m.party)ally.hp=Math.min(ally.maxHp,ally.hp+(ulti?45:14));m.shield=ulti?7:2;}
}
export function tickGiantRaid(g,m,dt,c){
 m.shield=Math.max(0,m.shield-dt);m.partyAmp=Math.max(0,m.partyAmp-dt);
 let scene=0;for(let i=1;i<GIANT_RAID_SCENES.length&&m.time>=GIANT_RAID_SCENES[i][0];i++)scene=i;
 m.raidSceneIndex=scene;m.raidScene=GIANT_RAID_SCENES[scene][1];
 m.finishProgress=ease((m.time-165)/13);m.finishStrength=m.partBreaks+m.usedAbilities.reduce((s,a)=>s+a.length,0);
 for(const e of m.enemies){
  if(!e.active&&m.time>=e.unlock){e.active=true;e.av=0;m.raidHistory.push({at:m.time,event:'expose',part:e.index});}
  e.broken=Math.max(0,e.broken-dt);e.bind=Math.max(0,e.bind-dt);
  if(!e.destroyed&&e.bleed>0){e.bleed-=dt;e.bleedClock-=dt;if(e.bleedClock<=0){e.bleedClock=1;hitPart(g,m,e,8,m.party[3],c,'bleed');}}
  if(!e.destroyed&&e.broken===0&&e.toughness===0)e.toughness=e.maxToughness;
 }
 if(!m.enemies[m.targetIndex]?.active||m.enemies[m.targetIndex]?.destroyed){const e=live(m)[0];if(e)m.targetIndex=e.index;}
 // A KO is recoverable support state, never a deadlock or a song skip.
 m.supportClock+=dt;if(m.supportClock>=6){m.supportClock=0;const fallen=m.party.find(p=>p.hp<=0);if(fallen){fallen.hp=35;fallen.av=0;m.raidHistory.push({at:m.time,event:'support',ally:fallen.index});if(m.turn==='support')nextRaidTurn(m);}}
 if(m.time>=165){
  if(m.actorMotion){const p=m.party.find(p=>p.id===m.actorMotion.actorId);p.x=lerp(p.x,p.homeX,1-Math.exp(-dt*5));p.z=lerp(p.z,p.homeZ,1-Math.exp(-dt*5));p.y*=Math.exp(-dt*5);m.actorMotion=null;}
  m.raidAttack=null;m.turn='finish';m.ensembleJump=Math.sin(m.finishProgress*Math.PI)*7;
  for(const p of m.party)if(p.hp<=0)p.hp=35;
  return;
 }
 const a=m.actorMotion;
 if(a){
  const p=m.party.find(p=>p.id===a.actorId),e=m.enemies.find(e=>e.id===a.targetId);a.age+=dt;
  const out=ease(a.age/a.hitAt),back=ease((a.age-a.hitAt-.12)/(a.duration-a.hitAt-.12));
  if(p.index===0){p.x=lerp(a.fromX,e.x,out)*(1-back)+p.homeX*back;p.z=lerp(a.fromZ,e.z+1.5,out)*(1-back)+p.homeZ*back;p.y=Math.max(0,(e.y-1.6)*out*(1-back)+Math.sin(out*Math.PI)*(a.type==='ultimate'?14:3)*(1-back));}
  for(const shot of a.projectiles){const q=ease((a.age-.42)/Math.max(.1,a.hitAt-.42));shot.visible=a.age>=.42&&a.age<=a.hitAt+.1;shot.x=lerp(shot.from.x,shot.to.x,q);shot.z=lerp(shot.from.z,shot.to.z,q);shot.y=lerp(shot.from.y,shot.to.y,q)+Math.sin(q*Math.PI)*(p.index===2?7:2);}
  if(a.age>=a.hitAt)attackContact(g,m,a,p,c);
  if(a.age>=a.duration){p.x=p.homeX;p.z=p.homeZ;p.y=0;m.actorMotion=null;if(a.type==='ultimate')m.turn=m.returnTurn;else nextRaidTurn(m);}
 }else if(m.turn==='boss'){
  const e=m.enemies.find(e=>e.id===m.turnActor);if(!e||e.destroyed||!e.active||e.broken>0||e.bind>0){m.raidAttack=null;nextRaidTurn(m);return;}
  const victim=m.party.find(p=>p.id===m.enemyVictim&&p.hp>0)||m.party.find(p=>p.hp>0);
  if(!victim){m.turn='support';m.raidAttack=null;return;}
  if(!m.raidAttack)m.raidAttack={part:e.index,victim:victim.id,age:0,wind:1.4,impactAt:2.1,duration:3.15,from:point(e),to:{x:victim.x,y:1.8,z:victim.z},x:e.x,y:e.y,z:e.z,hit:false};
  const b=m.raidAttack;b.age+=dt;m.turnElapsed=b.age;m.turnWind=Math.max(0,b.wind-b.age);
  const q=ease((b.age-b.wind)/(b.impactAt-b.wind)),recover=ease((b.age-b.impactAt-.2)/.85);
  b.x=lerp(b.from.x,b.to.x,q);b.z=lerp(b.from.z,b.to.z,q);b.y=lerp(b.from.y+Math.sin(clamp(b.age/b.wind,0,1)*Math.PI)*5,b.to.y,q);
  if(b.age>=b.impactAt&&!b.hit){b.hit=true;if(distance(b,{x:victim.x,y:victim.y+1.8,z:victim.z})<4.5){const amount=m.shield>0?7:18;victim.hp=Math.max(0,victim.hp-amount);victim.energy=Math.min(100,victim.energy+18);c.take(g,amount,c.emit);}}
  if(e.index<2){e.x=lerp(b.x,e.homeX,recover);e.y=lerp(b.y,e.homeY,recover);e.z=lerp(b.z,e.homeZ,recover);}
  if(b.age>=b.duration){e.x=e.homeX;e.y=e.homeY;e.z=e.homeZ;m.raidAttack=null;nextRaidTurn(m);}
 }
 g.boss.x=0;g.boss.z=-25;
}
