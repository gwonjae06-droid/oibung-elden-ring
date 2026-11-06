// Deterministic, presentation-only attack weight. Never used for damage,
// hitbox placement, AI selection or the authoritative action clock.
const clamp=(n,a=-1,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
const sat=n=>clamp(n,0,1);
const ease=n=>{const u=sat(n);return u*u*(3-2*u);};
const pulse=(u)=>Math.sin(Math.PI*sat(u));

export function kwonWeightAccent(b,m={}){
 const ready=sat(m.brace),strike=sat(m.strike),settle=sat(m.follow);
 const sign=/reverse|backsweep|livingSword|lastStance/.test(b?.pattern||'')?-1:1;
 return {
  waistPitch:clamp(-.026*ready+.045*strike-.014*settle,-.06,.06),
  shoulderYaw:clamp(sign*(.035*ready-.072*strike+.026*settle),-.09,.09),
  chestRoll:clamp(sign*(-.024*ready+.047*strike-.016*settle),-.06,.06),
  abdomenBrace:clamp(.024*ready-.04*strike+.012*settle,-.055,.055)
 };
}

export function clownWeightAccent(g,pose={}){
 const c=g?.clown;
 if(g?.status!=='playing'||c?.state!=='pattern'||g?.boss?.state==='transition')return {pitch:0,roll:0,counterYaw:0,compression:0};
 const t=Math.max(0,Number.isFinite(c.pt)?c.pt:0),v=c.vis||{};
 // These cues follow existing visual gestures, not a new independent hit clock.
 const hands=sat(((pose.glove||1)-1)*.37+(v.glove||0)*.22);
 const landing=sat(Math.abs(v.stomp||0)*.48+((pose.shoe||1)-1)*.18);
 const leap=sat((v.jump||0)*.65+(pose.lift||0)*.16);
 const spin=sat(Math.abs(pose.twist||0)*.35);
 const momentum=pulse(t/Math.max(.25,Math.min(1.4,.8+spin)));
 const sign=(pose.twist||0)<0?-1:1;
 const phase=g.boss.phase===2?1.15:1;
 return {
  pitch:clamp(phase*(-.065*hands+.075*landing-.045*leap)*momentum,-.13,.13),
  roll:clamp(phase*sign*(.024*hands+.036*spin)*momentum,-.09,.09),
  counterYaw:clamp(-.065*(pose.twist||0)*(.55+.45*momentum),-.09,.09),
  compression:clamp(.038*landing+.024*hands-.018*leap,-.025,.07)
 };
}

export function giantWeightAccent(s){
 const neutral={pitch:0,roll:0,yaw:0,compression:0};
 if(!s||s.state!=='attack')return neutral;
 let drive=0,brake=0,lateral=0,head=0;
 for(const hazard of s.hazards||[]){
  if(hazard.cancelled||!Number.isFinite(hazard.start)||!(hazard.warn>0))continue;
  const elapsed=s.t-hazard.start;
  if(elapsed<0||elapsed>hazard.warn+Math.max(.1,hazard.active||0)+.45)continue;
  const preparing=ease(elapsed/hazard.warn)*(1-ease((elapsed-hazard.warn+.12)/.18));
  const contact=elapsed>=hazard.warn?1-ease((elapsed-hazard.warn)/.22):0;
  drive=Math.max(drive,preparing);
  brake=Math.max(brake,contact);
  const side=hazard.handIndex===0?-1:hazard.handIndex===1?1:0;
  lateral+=side*(preparing*.48-contact*.85);
  if(hazard.headSlam)head=Math.max(head,preparing*.5+contact);
 }
 const power=s.temperament==='feral'?1.2:1;
 return {
  pitch:clamp(power*(-.055*drive+.085*brake+.035*head),-.15,.15),
  roll:clamp(lateral*.055*power,-.10,.10),
  yaw:clamp(-lateral*.07*power,-.12,.12),
  compression:clamp((.025*drive+.035*brake+.035*head)*power,0,.12)
 };
}

export function bloodWeightAccent(pose={}){
 const brace=sat(pose.anticipation),release=sat(pose.release),after=sat(pose.followThrough),hit=sat(pose.impact);
 const twist=clamp(pose.body?.twist||0,-1.5,1.5);
 const sign=twist<0?-1:1;
 return {
  pitch:clamp(-.048*brace+.065*release+.025*hit-.032*after,-.08,.12),
  roll:clamp(sign*(.032*brace-.048*release+.014*after),-.085,.085),
  lateral:clamp(-twist*.025+.018*sign*(brace-release),-.08,.08),
  kneeBrace:clamp(.037*brace+.026*hit-.025*after,0,.075),
  capeKick:clamp(.04*release+.07*hit+.03*after,0,.16)
 };
}
