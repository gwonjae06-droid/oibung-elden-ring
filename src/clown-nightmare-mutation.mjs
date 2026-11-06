// Pure combat-to-mesh adapter. No gameplay collision/damage changes.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const ease=x=>{const t=sat(x);return t*t*(3-2*t);};
export function clownMutationPose(g,time=0){
 const c=g?.clown||{},boss=g?.boss||{},stage=Math.max(1,Math.min(3,c.horrorStage||1));
 const name=c.state==='pattern'?c.name||'':'';
 const health=boss.maxHp>0?sat(boss.hp/boss.maxHp):1;
 const phaseBase=stage===3?.8:stage===2?.42:.11;
 const timeIn=ease((c.pt||0)/.85);
 const folded=['foldedCrawl','feralSkitter','reverseCrawl','ceilingPounce'].includes(name),mask=['stolenFace','porcelainRain','facePeelHunt'].includes(name),
  mouth=['mouthOfTheAudience','clockOfTeeth','unhingedClap'].includes(name),
  shadow=name==='livingShadow'||name==='reverseCrawl',doubles=name==='wrongTwin',rupture=['stageRupture','curtainNightmare','ceilingPounce'].includes(name);
 const special=folded||mask||mouth||shadow||doubles||rupture;
 const force=special?timeIn:0,anger=sat(phaseBase+(1-health)*.2+.25*force);
 const t=Number.isFinite(time)?time:0;
 return Object.freeze({
  stage,pattern:name,anger,
  eyeAsymmetry:sat(.22+anger*.75+(shadow?.20*force:0)),
  pupilDrift:sat(.08+anger*.31+(doubles?.2*force:0)),
  smile:sat(.28+anger*.65+(mouth?.2*force:0)),
  jaw:sat(.15+anger*.72+(mouth?.52*force:0)+(stage>=2?.23:0)),
  maskSplit:sat((mask?.95:rupture?.65:stage===3?.55:stage===2?.32:.04)*(.62+.38*force)),
  skeletalFold:sat((folded?.98:stage===3?.94:stage===2?.78:.05)*(.65+.35*force)),
  shadowArms:sat(anger*.45+(shadow?.45*force:0)),
  shake:sat((stage>=2?.07:.025)+force*(mouth?.24:.11)),
  gaze:Math.sin(t*(stage>=2?.85:.48))*(.08+.18*anger),
 });
}
