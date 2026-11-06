// Pure combat-to-mesh adapter. No gameplay collision/damage changes.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const ease=x=>{const t=sat(x);return t*t*(3-2*t);};
export function clownMutationPose(g,time=0){
 const c=g?.clown||{},boss=g?.boss||{},stage=Math.max(1,Math.min(3,c.horrorStage||1));
 const name=c.state==='pattern'?c.name||'':'';
 const health=boss.maxHp>0?sat(boss.hp/boss.maxHp):1;
 const phaseBase=stage===3?.8:stage===2?.42:.11;
 const timeIn=ease((c.pt||0)/.85);
 const is=name=>name===name;
 const folded=name==='foldedCrawl',mask=name==='stolenFace'||name==='porcelainRain',
  mouth=name==='mouthOfTheAudience'||name==='clockOfTeeth',
  shadow=name==='livingShadow',doubles=name==='wrongTwin',rupture=name==='stageRupture'||name==='curtainNightmare';
 const special=folded||mask||mouth||shadow||doubles||rupture;
 const force=special?timeIn:0,anger=sat(phaseBase+(1-health)*.2+.25*force);
 const t=Number.isFinite(time)?time:0;
 return Object.freeze({
  stage,pattern:name,anger,
  eyeAsymmetry:sat(.18+anger*.72+(shadow?.18*force:0)),
  pupilDrift:sat(.08+anger*.31+(doubles?.2*force:0)),
  smile:sat(.28+anger*.65+(mouth?.2*force:0)),
  jaw:sat(.1+anger*.58+(mouth?.3*force:0)),
  maskSplit:sat((mask?.8:rupture?.55:stage===3?.26:.04)*(.55+.45*force)),
  skeletalFold:sat((folded?.78:stage===3?.25:.05)*(.55+.45*force)),
  shadowArms:sat(anger*.45+(shadow?.45*force:0)),
  shake:sat((stage>=2?.07:.025)+force*(mouth?.24:.11)),
  gaze:Math.sin(t*(stage>=2?.85:.48))*(.08+.18*anger),
 });
}
