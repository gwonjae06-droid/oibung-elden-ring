// Shared simulation/presentation data. Environment animation never invents damage.
export const GYUWON_YEAR_WORLDS=Object.freeze([
 {name:'자유의 운동장',sky:0xe5a17c,floor:0x9d7252,fog:.0035,sun:0xffd5a1,light:2.8},
 {name:'기숙학원',sky:0x0d1724,floor:0x68726c,fog:.011,sun:0xc2ded7,light:1.9},
 {name:'지식의 감옥',sky:0x1f1818,floor:0x5d4b3d,fog:.009,sun:0xf2dbac,light:2.1},
 {name:'210발의 전쟁터',sky:0x777c80,floor:0x716d63,fog:.006,sun:0xf2d5b5,light:2.5},
 {name:'썩어가는 세계',sky:0x142321,floor:0x37473d,fog:.012,sun:0xb9d7b1,light:2.1},
 {name:'망상의 성역',sky:0x251b35,floor:0x8e7b97,fog:.005,sun:0xeac5e6,light:2.6},
 {name:'끝없는 방송국',sky:0x101324,floor:0x354451,fog:.005,sun:0xd4d4f2,light:2.6},
 {name:'심해의 학교',sky:0x062839,floor:0x345b65,fog:.012,sun:0x8fd6e7,light:2.7},
 {name:'기억의 파편',sky:0xe9e6df,floor:0xbcb2a1,fog:.0035,sun:0xffe4af,light:2.3},
 {name:'붕괴된 인과',sky:0xded7d0,floor:0x8d807c,fog:.0035,sun:0xffd5b1,light:2.4},
 {name:'마지막 시험장',sky:0x010207,floor:0x777b84,fog:.004,sun:0xe1e7ff,light:2.8}
].map(Object.freeze));
export const worldEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function annualWorldLayers(year,seed=1){
 if(year<=11)return [Math.max(1,year)];
 let x=((seed>>>0)^Math.imul(year,0x9e3779b9))>>>0;
 x^=x<<13;x^=x>>>17;x^=x<<5;
 const first=(x>>>0)%11+1;const second=((Math.imul(x,1664525)+1013904223)>>>0)%10+1;
 return [first,second>=first?second+1:second];
}
// Grade scenes are the transformation window: collapse old architecture then
// raise the next world. No input skip or new combat invulnerability is added.
export function annualWorldBlend(g){
 const e=g.gyuwon.years;
 if(e.mode==='result')return {from:e.year,to:e.year+1,t:worldEase((e.gradeT-.65)/2.35)};
 return {from:e.year,to:e.year,t:1};
}
export const OMR_FLOOR_PANELS=Object.freeze([-1,1].map(side=>Object.freeze({side,hingeX:side*21,width:6,length:42})));
export function omrFloorAngle(g){
 const e=g.gyuwon?.years;if(e?.year<11||e?.cast!=='nightmare365')return 0;
 const t=e.castT;
 return .46*worldEase((t-16.6)/1.4)*(1-worldEase((t-18)/1.5));
}
export function annualFloorHeight(g,x,z){
 if(Math.abs(z)>21)return 0;
 const angle=omrFloorAngle(g);if(angle<=0)return 0;
 for(const p of OMR_FLOOR_PANELS){const across=p.side*(p.hingeX-x);
  if(across>=0&&across<=p.width*Math.cos(angle))return across*Math.tan(angle);
 }return 0;
}
// A raised paper edge is solid. Approach its ramp from the hinge or wait for
// the slam; do not teleport the player up through a vertical edge.
export function resolveAnnualWorldMotion(g,from,to){
 const before=annualFloorHeight(g,from.x,from.z),after=annualFloorHeight(g,to.x,to.z);
 if(after-before<=.3)return to;
 const crossesEnd=Math.abs(from.z)>21&&Math.abs(to.z)<=21;
 return crossesEnd?{x:to.x,z:from.z}:{x:from.x,z:to.z};
}
