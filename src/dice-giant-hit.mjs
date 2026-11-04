import {giantHandPose} from './dice-giant.mjs';
import {diceSegmentImpact} from './dice-hit.mjs';
function boxImpact(a,b,c){let lo=0,hi=1;for(const [axis,half] of [['x',8],['y',2.5],['z',10]]){const v=b[axis]-a[axis],x=a[axis]-c[axis];if(Math.abs(v)<1e-9){if(Math.abs(x)>half)return null;continue;}let n=(-half-x)/v,f=(half-x)/v;if(n>f)[n,f]=[f,n];lo=Math.max(lo,n);hi=Math.min(hi,f);if(lo>hi)return null;}return {t:lo};}
export function giantImpact(g,a,b){
 const s=g.dice.giant;if(!s||['transition','dead'].includes(s.state))return null;
 if(s.state==='stagger'){const hit=diceSegmentImpact(a,b,g.dice.pose);return hit?{...hit,part:'head'}:null;}
 return [0,1].map(index=>{const hit=boxImpact(a,b,giantHandPose(g,index));return hit?{...hit,part:'hand',index,face:0}:null;}).filter(Boolean).sort((x,y)=>x.t-y.t)[0]||null;
}
