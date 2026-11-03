const sat=t=>Math.max(0,Math.min(1,t));
export const PLAYER_COLORS={sword:0x8cdeff,hammer:0xffb76c,bow:0xb9ef9a,cards:0xdba6ff};
export function playerPose(g,phase=0,speed=0){
 phase=Number.isFinite(phase)?phase:0;speed=Number.isFinite(speed)?Math.max(0,speed):0;
 const a=g.player.action,s=sat(speed/4.7),sw=Math.sin(phase)*.8*s,p={legL:sw,legR:-sw,kneeL:Math.max(0,-sw)*.7,kneeR:Math.max(0,sw)*.7,armL:-sw*.65,armR:sw*.65,elbowL:.15,elbowR:.15,pivotX:0,pivotZ:0,twist:0,sway:Math.sin(phase)*.025*s,lean:.1*s,lift:0,pull:0,trail:false};
 if(!a||g.boss.state==='transition')return p;
 const u=sat(a.t/a.total),pulse=Math.sin(Math.PI*u);
 if(a.kind==='attack'||a.kind==='skill'){
  const wind=Math.max(.01,a.wind),active=Math.max(.01,a.active),end=Math.max(.01,a.total-wind-active),k=sat((a.t-wind)/active),angle=a.t<wind?-1.5*a.t/wind:a.t<wind+active?-1.5+2.9*k:1.4*(1-sat((a.t-wind-active)/end));
  p.legL=-.15*pulse;p.legR=.18*pulse;p.armL=-.3*pulse;p.armR=0;p.pivotX=angle;p.twist=-.25*Math.sin(u*Math.PI*2);p.trail=a.t>=wind&&a.t<=wind+active;
  if(g.weapon==='sword'){p.pivotZ=-.35*pulse;p.lean=.12*pulse;p.elbowR=.25*pulse;}
  if(g.weapon==='hammer'){p.armL=-.9*pulse;p.elbowL=.6*pulse;p.pivotX=angle*1.25;p.lean=.3*pulse;p.lift=-.12*pulse;}
  if(g.weapon==='bow'){p.armL=-1.25;p.armR=-1.15;p.elbowL=-.8*pulse;p.elbowR=.4;p.pivotX=0;p.twist=-.12;p.pull=a.t<wind?sat(a.t/wind):0;p.trail=false;}
  if(g.weapon==='cards'){p.armR=-.65*pulse;p.elbowR=.5*pulse;p.pivotX=angle*.2;p.pivotZ=.85*Math.sin(u*Math.PI*2);p.trail=false;}
 }else if(a.kind==='roll'){p.legL=p.legR=-.45;p.kneeL=p.kneeR=1;p.armL=p.armR=-.4;p.elbowL=p.elbowR=.8;p.lift=-.14*pulse;p.sway=.16*pulse;}
 else if(a.kind==='heal'){p.armL=-1.8*pulse;p.armR=-1.1*pulse;p.elbowL=.9*pulse;p.pivotX=-.8*pulse;}
 else if(a.kind==='hurt'){p.lean=-.35;p.armL=p.armR=.35;p.elbowL=p.elbowR=.6;}
 return p;
}
export function findPlayerParts(scene){
 if(!scene||!Array.isArray(scene.children))return null;
 for(const rig of scene.children){const parts=rig.presentationParts;if(parts&&parts.rig===rig&&rig.parent===scene)return parts;}
 return null;
}
export function playerSoundRecipe(key,weapon='sword'){
 if(key==='step')return [['n',340,160,.055,.025],['t',75,45,.06,.012]];
 if(key==='roll')return [['n',850,250,.22,.035]];
 if(key==='heal')return [['t',440,660,.22,.025],['t',660,880,.2,.02]];
 if(key==='swing')return weapon==='hammer'?[['n',550,180,.24,.035]]:[['n',1900,600,.15,.03]];
 if(key==='shot')return weapon==='bow'?[['t',380,210,.16,.03],['n',2600,1700,.05,.025]]:[['n',3400,2100,.08,.025]];
 if(key==='hit')return weapon==='hammer'?[['t',85,32,.24,.05],['n',800,220,.12,.03]]:weapon==='sword'?[['t',950,380,.08,.025],['n',2100,900,.07,.025]]:[['t',560,180,.09,.025]];
 return [];
}
