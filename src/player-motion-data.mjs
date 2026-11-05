const sat=x=>Math.max(0,Math.min(1,Number(x)||0)),ease=x=>{x=sat(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
// Angles are in the same authored skeleton space in every encounter. Timings
// come from the authoritative action; animation never extends an attack window.
export function samplePlayerMotion(g,phase=0,speed=0,context={}){
 phase=Number.isFinite(phase)?phase:0;speed=Number.isFinite(speed)?Math.max(0,speed):0;
 const weapon=g.weapon||'sword',a=g.player.action??context.cast??null,moving=sat(speed/4.7),walk=Math.sin(phase)*.58*moving;
 const breathing=Math.sin((context.time??g.time??0)*2.1),forward=context.moveZ??1,side=context.moveX??0;
 const p={legL:walk,legR:-walk,kneeL:.06+Math.max(0,-walk)*.85,kneeR:.06+Math.max(0,walk)*.85,ankleL:-walk*.20,ankleR:walk*.20,
  armL:-walk*.42-.08,armR:walk*.20-.12,armZL:.10,armZR:-.10,elbowL:.16,elbowR:.27,pivotX:-.86,pivotY:0,pivotZ:-.10,
  twist:Math.sin(phase)*.035*moving,sway:Math.sin(phase)*.018*moving,lean:.055*moving*forward,lift:Math.abs(Math.sin(phase))*.025*moving,
  bob:breathing*.009*(1-moving)+Math.cos(phase*2)*.009*moving,headX:-Math.sin(phase)*.015*moving,headY:-side*.022*moving,pull:0,draw:0,trail:false,spin:0,strideX:side*.035*moving,strideZ:0,support:0,heal:0,charge:0,grip:0,handX:.03,handY:.55,handZ:.22,grounded:true,locomotion:true};
 p.legZL=p.legZR=-side*.13*moving;
  if(weapon==='hammer'){p.pivotX=-.48;p.armR=-.22;p.elbowR=.44;p.armL=-.24;p.handY=.46;}
  if(weapon==='bow'){p.pivotX=0;p.pivotZ=0;p.armL=-.30;p.elbowL=.35;p.armR=-.15;}
 if(weapon==='cards'){p.pivotX=-.12;p.pivotZ=.14;p.armR=-.32;p.elbowR=.35;}
 if(!a||g.boss.state==='transition')return p;
 p.locomotion=false;
 if(a.kind==='charging'){
  const u=ease((a.t??0)/.45);p.pivotX=mix(-.86,-1.82,u);p.armR=-.42*u;p.elbowR=.45*u;p.twist=-.30*u;p.lean=-.09*u;p.kneeL=p.kneeR=.12*u;p.lift=-.055*u;p.charge=u;p.support=u;return p;
 }
 const u=sat(a.t/Math.max(.001,a.total||1)),pulse=Math.sin(Math.PI*u);
 if(a.kind==='attack'||a.kind==='skill'){
  const wind=Math.max(.001,a.wind??.2),active=Math.max(.001,a.active??.14),rest=Math.max(.001,a.total-wind-active),t=Math.max(0,a.t||0);
  const w=ease(t/wind),hit=ease((t-wind)/active),back=ease((t-wind-active)/rest);
  const curve=(idle,prepare,strike)=>t<wind?mix(idle,prepare,w):t<wind+active?mix(prepare,strike,hit):mix(strike,idle,back);
  const effort=t<wind?w:t<wind+active?1:1-back;
  p.trail=t>=wind&&t<=wind+active;p.grip=effort;p.legL=curve(0,-.20,-.33);p.legR=curve(0,.14,.20);p.kneeL=curve(.06,.18,.35);p.kneeR=curve(.06,.12,.17);p.strideZ=curve(0,-.025,.15);
  if(weapon==='sword'){
   const variation=(context.variant??0)%3,sign=variation===1?-1:1;
   p.pivotX=curve(-.86,variation===2?-.65:-1.88,variation===2?-.03:.28);
   p.pivotY=curve(0,-sign*.66,sign*.58);p.pivotZ=curve(-.10,-sign*.46,sign*.23);
   p.armR=curve(-.12,-.45,-.22);p.elbowR=curve(.27,.66,.13);p.armL=curve(-.08,-.22,.10);
   p.twist=curve(0,-sign*.30,sign*.44);p.lean=curve(0,-.045,.16);p.lift=curve(0,-.035,-.065);
   if(variation===2){p.strideZ=curve(0,-.06,.24);p.pivotY=curve(0,-.08,.06);p.twist=curve(0,-.12,.17);}
   if(a.charged){p.pivotX=t<wind?mix(-1.82,-2.05,w):t<wind+active?mix(-2.05,.48,hit):mix(.48,-.86,back);p.twist*=1.25;p.support=t<wind+active?1:1-back;p.handY=curve(.55,.90,.60);}
  }else if(weapon==='hammer'){
   p.pivotX=curve(-.48,-1.85,.40);p.armR=curve(-.22,-.75,-.30);p.elbowR=curve(.44,.36,.24);
   p.twist=curve(0,-.20,.13);p.lean=curve(0,-.17,.31);p.lift=curve(0,.04,-.15);p.support=1;
   p.handX=curve(.03,.13,0);p.handY=curve(.46,.92,.60);p.handZ=curve(.22,.11,.28);
   p.armL=curve(-.24,-.80,-.25);p.elbowL=curve(.16,.55,.30);p.trail=t>=wind&&t<wind+active*.9;
   if(a.kind==='skill'){p.lean*=1.15;p.lift*=1.15;}
  }else if(weapon==='bow'){
   p.pivotX=0;p.pivotY=0;p.pivotZ=0;p.twist=-.17*effort;p.lean=-.025*effort;p.pull=t<wind?w:t<wind+active?1-hit:0;p.draw=effort;
   p.armL=mix(-.30,-1.28,effort);p.armR=mix(-.15,-1.10,effort);p.elbowL=mix(.35,.12,effort);p.elbowR=mix(.27,.90,effort);p.trail=false;p.grip=effort;
  }else{
   p.armR=curve(-.32,-.94,-1.08);p.elbowR=curve(.35,1.05,.12);p.pivotX=curve(-.12,-.50,.06);p.pivotZ=curve(.14,-.70,.48);p.pivotY=curve(0,-.30,.24);
   p.twist=curve(0,-.24,.26);p.armL=curve(-.08,-.50,-.16);p.trail=false;
  }
  // Short-lived bracing and shoulder/head counter-movement follows the
  // authoritative attack timeline. All offsets return to zero at the end.
  const bodyWeight=Math.sin(Math.PI*ease(t/Math.max(.001,a.total||1)));
  p.headX-=bodyWeight*(weapon==='hammer'?.060:weapon==='sword'?.042:.028);
  p.headY+=bodyWeight*(weapon==='bow'?.025:-.014);
  p.sway+=bodyWeight*(weapon==='hammer'?.022:.013);
  p.kneeL+=bodyWeight*(weapon==='hammer'?.045:.020);
  p.kneeR+=bodyWeight*(weapon==='hammer'?.038:.016);
 }else if(a.kind==='roll'){
  p.grounded=false;
  const tuck=ease(Math.min(u/.17,(1-u)/.17));p.legL=p.legR=-.70*tuck;p.kneeL=p.kneeR=tuck;p.armL=p.armR=-.38*tuck;p.elbowL=p.elbowR=.90*tuck;
  p.spin=Math.PI*2*ease(u);p.lift=.45*(1-Math.cos(p.spin))+.08*pulse;p.strideZ=-.45*Math.sin(p.spin);p.sway=0;p.lean=0;p.headX=-.25*tuck;p.pivotX=-.25;p.pivotY=-1.35;p.pivotZ=.20;
 }else if(a.kind==='heal'){
  const raise=ease(Math.min(u/.25,(1-u)/.22));p.armL=-1.92*raise;p.elbowL=.92*raise;p.armR=-.18;p.pivotX=-1.04;p.headX=.13*raise;p.heal=raise;p.lift=-.04*raise;
 }else if(a.kind==='hurt'){
  const k=(1-ease(u))*(.7+.3*Math.cos(u*Math.PI*3));p.headX=-.14*k;p.headY=.045*k;p.sway=.035*k;p.lean=-.30*k;p.twist=.14*k;p.armL=.35*k;p.armR=.25*k;p.elbowL=p.elbowR=.65*k;p.kneeL=p.kneeR=.22*k;p.lift=-.12*k;
 }
 return p;
}
