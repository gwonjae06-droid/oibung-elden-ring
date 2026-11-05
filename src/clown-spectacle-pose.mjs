const sat=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const k=sat(v);return k*k*(3-2*k);};
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*ease((t-a)/(b-a)));
const close=(t,a,hit,end)=>t<a||t>=end?0:t<=hit?ease((t-a)/(hit-a)):1-ease((t-hit)/(end-hit));
export function clownPhotoYaw(g){const c=g?.clown,b=g?.boss,z=[...(c?.zones||[])].reverse().find(z=>z.sound==='photoShow'&&z.shape==='circle'&&z.state==='warn'),p=z||g?.player;return [b?.x,b?.z,p?.x,p?.z].every(Number.isFinite)?Math.atan2(p.x-b.x,p.z-b.z):Number.isFinite(c?.yaw)?c.yaw:0;}
export function clownSpectaclePose(g,base={}){
 const c=g?.clown,t=c?.pt,key=c?.showKey,d={headReturn:4.8,offbeatClap:6.5,runaway:5.8}[key];
 const extra={headScale:1,armSpread:0,neckWidth:1,clapClose:null,cameraGrip:false,facingYaw:null};
 if(!d||g.status!=='playing'||g.boss?.state==='transition'||c.state!=='pattern'||!Number.isFinite(t)||t<0||t>=d)return {...base,...extra};
 const mode=key==='offbeatClap'?'clap':c.stageKey||key;
 if(!(key==='headReturn'?['headReturn','photo','confetti','curtain']:key==='runaway'?['runaway','tilt','encore']:['clap']).includes(mode))return {...base,...extra};
 const a={bodyX:1,bodyY:1,bodyZ:1,arms:1,glove:1,shoe:1,lift:0,lean:0,twist:0,smear:0,...extra};
 const clap=(x,spread=6.5)=>{a.clapClose=x;a.glove=1+1.9*x;a.armSpread=spread;a.arms=1+1.5*x;a.bodyX=1+.6*x;a.bodyY=1-.18*x;};
 if(mode==='headReturn'){
  const w=ease(t/.65)*(1-ease((t-.8)/.3)),shot=pulse(t,.65,1.2),panic=pulse(t,1.4,3.3);
  a.headScale=1+(g.boss.phase===2?.55:1.3)*w;a.bodyX+=.9*w;a.bodyY-=.36*w;a.bodyZ+=.55*w;a.arms+=2.8*shot+2*panic;a.armSpread=3*shot+1.8*panic;a.glove+=1.5*shot;a.lean=-.8*shot+.55*panic;a.twist=Math.sin(t*15)*.6*panic;a.shoe+=1.6*panic;
 }else if(mode==='clap'){
  const x=Math.max(close(t,0,.8,1.1),close(t,1.05,1.6,1.95),close(t,3.3,4.1,4.55)),s=pulse(t,2,3.15);clap(x);a.twist=1.2*s;a.arms+=2*s;a.armSpread+=2*s;a.lean=-.65*pulse(t,4.1,5.1);
 }else if(mode==='runaway'){
  const dash=Math.max(pulse(t,.7,1.5),pulse(t,2.6,3.4)),fall=pulse(t,3.3,5.1);a.bodyX-=.33*dash;a.bodyY-=.32*dash+.26*fall;a.bodyX+=.9*fall;a.bodyZ+=1.7*dash;a.arms+=2.8*dash+2*fall;a.armSpread=2*fall;a.shoe+=1.9*dash;a.lean=.95*dash+.75*fall;a.twist=Math.sin(t*12)*.7*fall;a.smear=1.5*dash;
 }else if(mode==='photo'){
  a.cameraGrip=t<=2.2;a.facingYaw=clownPhotoYaw(g);a.glove=1.8+.45*pulse(t,0,2.2);a.shoe+=.7*pulse(t,0,1.2);if(t>2.2){a.lean=-.65*pulse(t,2.2,3.3);a.arms+=2*pulse(t,2.2,3.3);}
 }else if(mode==='confetti'){
  const w=pulse(t,0,.7),j=pulse(t,.7,3.1);a.headScale+=.9*w;a.bodyX+=.7*w;a.bodyY-=.3*w;a.arms+=2.8*j;a.armSpread=2.5*j;a.glove+=1.1*j;a.twist=Math.sin(t*7)*.7*j;a.shoe+=j;a.smear=j;
 }else if(mode==='curtain'){
  const n=ease((t-.5)/.85)*(1-ease((t-1.5)/.7)),r=pulse(t,1.5,2.5);a.headScale+=(g.boss.phase===2?.35:1.75)*n;a.neckWidth+=2.4*n;a.bodyX+=.45*n;a.bodyY-=.22*n;a.arms+=2*r;a.armSpread=2*pulse(t,0,.5);a.lean=-.4*n+.5*r;a.shoe+=.8*r;
 }else if(mode==='tilt'){
  const left=pulse(t,0,.5),right=pulse(t,2.3,2.8),w=left+right,j=pulse(t,.5,4.3);a.arms+=2.8*w+1.5*j;a.armSpread=3*w+1.5*j;a.glove+=1.2*w;a.bodyY+=.4*w;a.twist=.95*(right-left);a.lean=.35*(right-left);a.smear=j;
 }else{
  const bow=pulse(t,0,.6),shot=pulse(t,.4,1),dash=pulse(t,2.9,3.6),x=close(t,3.6,4.25,4.7);clap(x,5.5);a.bodyY-=.4*bow+.25*dash;a.lean=.95*bow+.85*dash;a.armSpread+=5*bow;a.arms+=2.5*shot+2*dash;a.headScale+=.35*bow;a.shoe+=1.7*dash;a.bodyZ+=1.4*dash;a.smear=dash;
 }
 const f=ease(t/.12)*ease((d-t)/.35);
 for(const k of ['bodyX','bodyY','bodyZ','arms','glove','shoe','headScale','neckWidth'])a[k]=1+(a[k]-1)*f;
 for(const k of ['lift','lean','twist','smear','armSpread'])a[k]*=f;
 if(a.clapClose!==null)a.clapClose*=f;
 return a;
}
