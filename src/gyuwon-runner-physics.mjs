// Act VI real-time controls and geometry. The same dimensions drive hit tests
// AND the hand-drawn knight, so crouching visibly changes collision height.
export const RUNNER_BODY_HEIGHT=2.1;
export const RUNNER_SLIDE_HEIGHT=.72;
export const RUNNER_JUMP_BUFFER=.10;
export const RUNNER_COYOTE_TIME=.105;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
export const runnerSlideAmount=m=>clamp(m?.slideVisual||0);
export const runnerBodyHeight=m=>RUNNER_BODY_HEIGHT-(RUNNER_BODY_HEIGHT-RUNNER_SLIDE_HEIGHT)*runnerSlideAmount(m);
export function runnerInitMotion(m){
 Object.assign(m,{grounded:true,coyote:RUNNER_COYOTE_TIME,jumpBuffer:0,jumpAge:0,
  landTime:0,slideVisual:0,slideAge:0,runnerPose:'run',wasGrounded:true,
  jumpY:0,jumpV:0,jumpCount:0,slide:0,slideHeld:false});
}
function launch(m,double=false){
 m.jumpV=double?8.6:9.4;
 m.jumpCount=double?2:1;
 m.grounded=false;m.coyote=0;m.jumpBuffer=0;m.jumpAge=0;
 m.slide=0;m.slideHeld=false;m.slideVisual=0;m.slideAge=0;
 m.runnerPose=double?'double':'takeoff';m.landTime=0;
}
export function runnerPressJump(m){
 if(!m||m.year!==6)return false;
 if(m.jumpCount===0&&(m.grounded||m.coyote>0)){launch(m);return true;}
 if(m.jumpCount===1&&!m.grounded&&m.jumpY>=-.05){launch(m,true);return true;}
 // Buffer only a near-landing press; don't allow a third midair jump.
 if(m.jumpCount<=2&&!m.grounded&&m.jumpV<0&&m.jumpY<.95){
  m.jumpBuffer=RUNNER_JUMP_BUFFER;return true;
 }
 return false;
}
export function runnerPressSlide(m){
 if(!m||m.year!==6)return false;
 m.slideHeld=true;m.slide=.95;m.slideVisual=1;m.slideAge=0;
 m.runnerPose='slide-start';return true;
}
export function runnerReleaseSlide(m){
 if(!m||m.year!==6)return false;
 m.slideHeld=false;m.slide=0;m.slideAge=0;
 if(m.slideVisual>0)m.runnerPose='slide-end';
 return true;
}
export function runnerStepMotion(m,hasFloor,dt,floorHeight=0){
 const t=clamp(dt,0,.05);
 m.jumpBuffer=Math.max(0,(m.jumpBuffer||0)-t);
 m.landTime=Math.max(0,(m.landTime||0)-t);
 m.slideAge=(m.slideAge||0)+t;
 m.jumpAge=(m.jumpAge||0)+t;
 // The collapse to a crouch starts on pointerdown; on release the same
 // crouch weight eases up visually and in the collision box together.
 m.slideVisual=m.slideHeld?1:Math.max(0,(m.slideVisual||0)-t/.15);
 m.slide=m.slideHeld?.95:0;
 const nextY=m.jumpY+m.jumpV*t-.5*24*t*t;
 const touching=hasFloor&&m.jumpV<=0&&m.jumpY>=floorHeight-.08&&nextY<=floorHeight+.035;
 if(touching){
  if(!m.grounded){m.landTime=.15;m.runnerPose='landing';}
  m.grounded=true;m.jumpY=floorHeight;m.jumpV=0;m.jumpCount=0;
  m.coyote=RUNNER_COYOTE_TIME;
  if(m.jumpBuffer>0)launch(m);
 }else{
  if(m.grounded&&m.jumpCount===0)m.coyote=RUNNER_COYOTE_TIME;
  m.grounded=false;m.coyote=Math.max(0,m.coyote-t);
  m.jumpY+=m.jumpV*t-.5*24*t*t;m.jumpV-=24*t;
 }
 if(m.grounded)m.runnerPose=m.slideVisual>.015?
  (m.slideHeld?'slide':'slide-end'):m.landTime>0?'landing':'run';
 else if(m.slideVisual>.5)m.runnerPose='slide-air';
 else if(m.jumpAge<.11)m.runnerPose='takeoff';
 else if(m.jumpV>2)m.runnerPose='rising';
 else if(m.jumpV< -2)m.runnerPose='falling';
 else m.runnerPose='apex';
 m.wasGrounded=m.grounded;
 return m.runnerPose;
}
export function runnerObstacleContact(m,playerX,o){
 const half=(o.width||1.3)*.5+.55-.10; // deliberate 0.1 m forgiveness
 if(Math.abs(playerX-o.x)>=half)return false;
 const bottom=m.jumpY;
 const top=bottom+runnerBodyHeight(m);
 const low=o.kind==='low';
 const base=o.floorY||0,drop=o.bottom||0;
 const lo=base+(low?1.50:drop),hi=base+(low?3.58:drop+(o.height||1.30));
 return top>lo+.055&&bottom<hi-.055;
}
export function runnerGuideReset(m,scene){
 m.guideScene=scene.key;
 m.guideRescues=['bridge','rain','skyroad','final-sprint'].includes(scene.key)?1:0;
 m.guideBridgesLeft=['bridge','skyroad','final-sprint'].includes(scene.key)?1:0;
 m.guideAction='';m.guideActionUntil=0;m.guideWarnId=null;
}
export function runnerGuideBridge(m,start,gap,time){
 if((m.guideBridgesLeft||0)<1||gap<3.5)return null;
 m.guideBridgesLeft--;
 m.guideAction='bridge';m.guideActionUntil=time+2.2;
 return {x:start+gap*.22,end:start+gap*.78,y:0,guide:true,created:time};
}
export function runnerGuideCatch(m,player,time){
 if((m.guideRescues||0)<1||m.jumpY> -3.0)return false;
 m.guideRescues--;m.guideAction='catch';m.guideActionUntil=time+1.4;
 m.jumpY=1.4;m.jumpV=6.2;m.jumpCount=1;m.grounded=false;
 m.coyote=0;m.slideHeld=false;m.slide=0;m.slideVisual=0;
 m.fallRecovery=1.5;
 m.platforms.push({x:player.x-3,end:player.x+10,y:0,guide:true,created:time});
 m.platforms.sort((a,b)=>a.x-b.x);
 return true;
}
export function runnerGuideWarning(m,playerX,time){
 if(m.guideActionUntil>time&&['bridge','catch'].includes(m.guideAction))return;
 let nearest=null;
 for(const o of m.obstacles){if(o.hit||o.x<=playerX||o.x-playerX>=20)continue;if(!nearest||o.x<nearest.x)nearest=o;}
 if(nearest){m.guideAction='warn';m.guideActionUntil=time+.45;
  m.guideWarnId=nearest.id;m.guideWarnKind=nearest.kind;}
 else if(m.guideActionUntil<=time){m.guideAction='';m.guideWarnId=null;}
}
