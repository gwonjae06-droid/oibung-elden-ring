const neutral=()=>({bodyX:1,bodyY:1,bodyZ:1,arms:1,glove:1,shoe:1,lift:0,lean:0,twist:0,smear:0});
const sat=t=>Math.max(0,Math.min(1,t));
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a));
export function clownShowPose(name,time=0,phase=1,active=true){
 const show=name==='laughBomb'?'head':name==='clap'?'clap':name==='dash'&&phase===2?'run':null;
 if(!show)return null;
 const n=neutral();if(!active||!Number.isFinite(time))return n;
 const t=Math.max(0,time),d=show==='head'?4.8:show==='clap'?6.5:5.8;if(t>=d)return n;
 const a={...n},inflate=p=>{a.bodyX+=p*.55;a.bodyZ+=p*.4;a.bodyY-=p*.3;};
 if(show==='head'){
  const wind=pulse(t,0,.8),throwing=pulse(t,.65,1.05),panic=pulse(t,1.4,3.3);
  inflate(wind);a.arms+=wind*.9+throwing*1.8+panic*.9;a.glove+=throwing*1.4;a.lean=-throwing*.55+panic*.3;a.twist=Math.sin(t*17)*panic*.3;
  a.shoe+=Math.abs(Math.sin(t*18))*panic*.7;inflate(pulse(t,2.65,3.15)*.6);
 }else if(show==='clap'){
  const hit=Math.max(pulse(t,.5,1.1),pulse(t,1.3,1.9),pulse(t,3.8,4.4)),hold=pulse(t,1.65,3.3),sweep=pulse(t,2.4,3.1);
  a.glove+=hit*2.1+hold*.7;a.arms+=hit+hold*.5+sweep*1.3;inflate(hit*.5);a.twist=sweep*.9;a.lean=-pulse(t,4.1,4.9)*.55;
 }else{
  const dash=Math.max(pulse(t,.7,1.45),pulse(t,2.6,3.35)),tumble=pulse(t,3.25,4.9);
  a.bodyX-=dash*.27;a.bodyY-=dash*.22;a.bodyZ+=dash*.85;a.arms+=dash*1.7;a.shoe+=dash;a.lean=dash*.8+tumble*.65;a.smear=dash;
  a.twist=Math.sin(t*13)*tumble*.4;inflate(tumble*.65);
 }
 const fade=Math.min(1,t/.12,(d-t)/.35),power=phase===2?1.15:1;
 for(const k of Object.keys(a))a[k]=n[k]+(a[k]-n[k])*fade*power;
 return a;
}
