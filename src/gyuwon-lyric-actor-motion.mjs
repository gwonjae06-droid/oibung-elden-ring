// All upper-body/leg motions in the 11th-year finale and original ending
// are driven by source-master phrase progress; never by performance.now().
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export function gyuwonLyricActorMotion(lyric,time=0){
 if(!lyric)return null;
 const g=lyric.gesture,phase=clamp(lyric.phase),w=Math.sin(phase*Math.PI),
   pulse=Math.sin(time*6.5),step=Math.sin(time*9);
 const out={torsoX:0,torsoY:0,torsoZ:0,headX:0,headY:0,
  leftArm:0,rightArm:0,leftElbow:0,rightElbow:0,step:0,lift:0,twist:0};
 if(['walk','run'].includes(g)){out.step=(g==='run'?.88:.45)*w;
  out.torsoX=.12*w;out.leftArm=.22*step*w;out.rightArm=-.22*step*w;
  out.lift=Math.abs(step)*.08*w;}
 else if(g==='jump'||g==='fly'){out.lift=.32*w;out.torsoX=-.12*w;out.leftArm=-.68*w;out.rightArm=-.68*w;}
 else if(['raise','open','cast','conduct'].includes(g)){out.leftArm=-.95*w;out.rightArm=-.95*w;out.headX=-.16*w;}
 else if(['reach','point','offer','present','invite'].includes(g)){
  out.rightArm=-.8*w;out.rightElbow=-.36*w;out.torsoY=.18*w;out.headY=.12*w;}
 else if(['sing','heart'].includes(g)){
  out.leftArm=-.39*w;out.rightArm=-.39*w;out.leftElbow=-.48*w;out.rightElbow=-.48*w;out.headX=-.12*w;}
 else if(['ponder','listen','whisper','ask','search','lookback'].includes(g)){
  out.headY=Math.sin(phase*Math.PI*1.3)*.24;out.headX=.14*w;
  out.rightArm=-.5*w;out.rightElbow=-.63*w;}
 else if(['dance','spin','sway','tap','stepleft','stepright'].includes(g)){
  out.twist=.45*w*Math.sin(phase*Math.PI*2);
  out.torsoZ=.14*Math.sin(time*5)*w;
  out.leftArm=-.55*w;out.rightArm=-.55*w;
  out.step=.38*w;out.lift=.11*Math.abs(pulse)*w;}
 else if(['bow','fall','still','fade'].includes(g)){
  out.torsoX=(g==='bow'?.44:g==='fall'?.54:g==='still'?.02:.2)*w;
  out.headX=.22*w;out.leftArm=.22*w;out.rightArm=.22*w;}
 else if(['fight','stepstrike','jab','kick','slam'].includes(g)){
  out.torsoY=.2*w;out.rightArm=-.65*w;out.leftArm=.2*w;out.step=.45*w;}
 else if(['clap','snap'].includes(g)){
  out.leftArm=-.63*w;out.rightArm=-.63*w;
  out.leftElbow=-.72*w;out.rightElbow=-.72*w;}
 else if(g==='tease'||g==='shrug'){out.leftArm=-.35*w;out.rightArm=-.35*w;out.headY=.2*w;}
 else if(g==='transform'){out.torsoY=.4*w;out.leftArm=-.8*w;out.rightArm=-.8*w;}
 else{out.torsoX=.025*Math.sin(time*1.9)*w;out.headX=.04*w;}
 return out;
}
