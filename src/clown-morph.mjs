export const HEAD_RADII={x:.84,y:1,z:.88};
export const BIG=3.4;
export const POSES=['idle','laugh','inflate','hold','throw','detonate','regrow'];
export const NEUTRAL={inflate:1,stretch:0,puff:0,jaw:0,bulge:0,wobble:0};
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function uvFor(x,y,crop){return [crop.x0+(crop.x1-crop.x0)*(x/(2*HEAD_RADII.x)+.5),1-(crop.y0+(crop.y1-crop.y0)*(.5-y/(2*HEAD_RADII.y)))];}
export function morphHead(base,out,p,time=0){
 const q={...NEUTRAL,...p},R=HEAD_RADII,s=1/Math.sqrt(1+q.stretch);
 for(let i=0;i<base.length;i+=3){const bx=base[i],by=base[i+1],bz=base[i+2],a=bx/R.x,b=by/R.y,c=bz/R.z,low=ease((-b-.05)/.55),mid=1-Math.min(1,a*a*.7),cheek=ease(1-Math.abs(b+.1)*1.3)*Math.min(1,Math.abs(a)*1.4);
 let x=bx+Math.sign(bx)*q.puff*.45*R.x*cheek,y=by-q.jaw*.55*R.y*low*mid,z=bz+q.jaw*.08*R.z*low*mid+q.puff*.12*R.z*cheek*(c>0?1:0)+q.bulge*R.z*.5*(c>0?ease(1-a*a-b*b):0);
 y*=1+q.stretch;x*=s;z*=s;const w=q.wobble*.06;x+=Math.sin(time*11+by*4.2)*w*R.x;y+=Math.sin(time*9+bx*3.1)*w*R.y*.6;z+=Math.cos(time*10+by*3.7)*w*R.z;
 out[i]=x*q.inflate;out[i+1]=y*q.inflate;out[i+2]=z*q.inflate;}return out;
}
export function headPose(name,t=0){t=clamp(t);const e=ease(t);switch(name){
 case 'laugh':{const w=Math.abs(Math.sin(t*Math.PI*5));return {jaw:.15+.35*w,puff:.15*w,wobble:.25,bulge:.1};}
 case 'inflate':return {inflate:1+2.4*e,puff:.7*e,jaw:.1*e,stretch:-.12*e,bulge:.25*e,wobble:.2+.3*e};
 case 'hold':return {inflate:BIG,puff:.7,jaw:0,stretch:-.12,bulge:.3,wobble:.35};
 case 'throw':return {inflate:BIG*(1-.08*e),puff:.7-.35*e,stretch:-.12+.44*e,jaw:.25*e,bulge:.25,wobble:.15};
 case 'detonate':return {inflate:BIG*(.92+.28*e)*(1+.025*(Math.sin(t*Math.PI*14)+1)),puff:.55+.35*e,stretch:.1+.2*e,jaw:.35+.65*e,bulge:.35,wobble:.3+.6*e};
 case 'regrow':return {inflate:.3+.7*e+Math.sin(e*Math.PI)*.18,puff:.1*(1-e),jaw:.2*(1-e),stretch:-.05*Math.sin(e*Math.PI*2),wobble:.35*(1-e)};
 default:return {wobble:.04};}}
