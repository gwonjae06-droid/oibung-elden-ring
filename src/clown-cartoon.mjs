export const CARTOON_DURATIONS={laughBomb:5.1,dash:4.5,juggle:4.5,clap:3.4,bounce:3.6,shove:1.6,tripleBomb:6.65,rollingSmile:5,inverseBow:3.8,lastClap:5.35,confettiCurtain:4.6,hornFan:4.1,drumMarch:4.8,balloonBouquet:5,carousel:5.6,curtainCall:7.2};
const sat=t=>Math.max(0,Math.min(1,t));
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a));
export function cartoonPose(name,time=0,phase=1,active=true){
 const neutral={bodyX:1,bodyY:1,bodyZ:1,arms:1,glove:1,shoe:1,lift:0,lean:0,twist:0,smear:0};
 if(!active||!Object.hasOwn(CARTOON_DURATIONS,name)||!Number.isFinite(time))return neutral;
 const t=Math.max(0,time),d=CARTOON_DURATIONS[name];if(t>=d)return neutral;
 const a={...neutral},power=phase===2?1.15:1;
 const inflate=(p)=>{a.bodyX+=p*.55;a.bodyZ+=p*.4;a.bodyY-=p*.3;};
 switch(name){
  case 'laughBomb':case 'tripleBomb':{const p=pulse(t,0,1.65);inflate(p);a.arms+=p*.8;a.glove+=pulse(t,1.5,2.05)*1.6;a.lean=-pulse(t,1.65,2.25)*.5;break;}
  case 'dash':{const p=Math.max(pulse(t,.65,1.6),phase===2?pulse(t,2.45,3.4):0);a.bodyX-=p*.3;a.bodyY-=p*.25;a.bodyZ+=p*.9;a.arms+=p*1.7;a.shoe+=p*1.1;a.lean=p*.85;a.smear=p;break;}
  case 'juggle':case 'confettiCurtain':a.arms+=Math.abs(Math.sin(t*8))*1.6*pulse(t,0,3);a.glove+=pulse(t,0,3)*.6;a.bodyY+=pulse(t,0,3)*.3;a.twist=Math.sin(t*5)*.2*pulse(t,0,3);break;
  case 'clap':case 'lastClap':{const p=pulse(t,0,1.25);a.glove+=p*2.6;a.arms+=p*1.3;inflate(p*.65);a.lean=-pulse(t,.85,1.5)*.3;break;}
  case 'bounce':{inflate(pulse(t,0,.7));const up=pulse(t,.65,1.05);a.lift=up>0?3.8*Math.min(1,up*2.4):0;a.bodyY+=up*.7;a.bodyX-=up*.22;inflate(pulse(t,1.05,1.65));a.shoe+=pulse(t,1.05,1.65)*1.4;break;}
  case 'shove':inflate(pulse(t,0,.9));a.glove+=pulse(t,.2,1)*1.5;a.arms+=pulse(t,.2,1)*1.2;break;
  case 'rollingSmile':a.arms+=pulse(t,.65,1.5)*2;a.lean=pulse(t,.8,1.7)*1.05;a.shoe+=pulse(t,.8,1.7);a.smear=pulse(t,1.1,2.5);break;
  case 'inverseBow':a.bodyY+=pulse(t,.2,1.9)*.75;a.bodyX-=pulse(t,.2,1.9)*.25;a.arms+=pulse(t,.2,1.9)*1.4;a.lean=pulse(t,.2,1.9)*.45;break;
  case 'hornFan':inflate(pulse(t,0,2.6));a.arms+=pulse(t,0,2.6)*1.1;a.glove+=pulse(t,0,2.6)*1.5;a.lean=-pulse(t,.8,1.4)*.35;break;
  case 'drumMarch':{const p=Math.abs(Math.sin(t*Math.PI/ .65))*pulse(t,0,3.5);a.arms+=p*1.4;a.glove+=p*1.7;a.bodyY+=p*.35;a.shoe+=p*.7;break;}
  case 'balloonBouquet':inflate(pulse(t,0,2.2));a.arms+=pulse(t,0,2.6)*2;a.glove+=pulse(t,0,2.6);a.lift=pulse(t,.5,2)*.8;break;
  case 'carousel':a.twist=Math.sin(t*9)*.6*pulse(t,0,4);a.arms+=pulse(t,0,4)*2;a.glove+=pulse(t,0,4)*.8;a.bodyY+=pulse(t,0,4)*.4;a.smear=pulse(t,0,4);break;
  case 'curtainCall':a.arms+=pulse(t,0,5.2)*1.6;a.glove+=pulse(t,3.2,4.8)*2.3;inflate(pulse(t,3.2,4.8));a.lift=pulse(t,2.8,4.8)*2.5;a.twist=Math.sin(t*8)*.35*pulse(t,0,5.2);a.smear=pulse(t,3.6,4.8);break;
 }
 const fade=Math.min(1,t/.12,(d-t)/.35);
 for(const k of Object.keys(a))a[k]=neutral[k]+(a[k]-neutral[k])*fade*power;
 return a;
}
