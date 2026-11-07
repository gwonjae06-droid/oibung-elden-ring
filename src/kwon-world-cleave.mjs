import {kwonThirdScreenRift,KWON_POSSESSION} from './kwon-third-phase.mjs';

// One-render screen cleave: two glass-like displaced image planes and a
// diagonal void seam. This deliberately never renders the 3D scene twice,
// never takes screenshot copies, and never modifies an attack or hitbox.
export function createKwonWorldCleave(arena,{coarse=false,reduced=false}={}){
 if(!arena?.ownerDocument)return {update(){},reset(){},dispose(){}};
 const doc=arena.ownerDocument,root=doc.createElement('div');
 root.className='kwon-world-cleave';root.setAttribute('aria-hidden','true');
 root.style.cssText='position:absolute;inset:0;z-index:29;pointer-events:none;overflow:hidden;display:none;contain:layout paint;';
 const pane=(side)=>{
  const v=doc.createElement('div');v.className='kwon-cut-world-'+side;
  const poly=side==='left'
   ?'polygon(0 0,50.8% 0,48.2% 100%,0 100%)'
   :'polygon(50.8% 0,100% 0,100% 100%,48.2% 100%)';
  v.style.cssText='position:absolute;inset:0;will-change:transform;clip-path:'+poly+
   ';background:linear-gradient('+ (side==='left'?'110':'290')+
   'deg,transparent 30%,rgba(8,3,15,.04) 58%,rgba(13,8,20,.26) 100%);'+
   ((!coarse&&!reduced)?'backdrop-filter:brightness(.86) contrast(1.12) saturate(.8);':'');
  root.appendChild(v);return v;
 };
 const left=pane('left'),right=pane('right');
 const scar=doc.createElement('div');scar.className='kwon-cut-world-void';
 scar.style.cssText='position:absolute;left:50%;top:-30%;height:160%;width:3.5%;'+
  'transform-origin:50% 50%;background:linear-gradient(90deg,transparent 0%,rgba(5,3,10,.90) 29%,#050309 44%,#180b1c 58%,rgba(113,68,70,.58) 69%,transparent 100%);'+
  'box-shadow:0 0 16px 3px rgba(17,11,23,.45);will-change:transform;opacity:0;';
 root.appendChild(scar);
 const splinter=doc.createElement('div');splinter.className='kwon-cut-world-stone';
 splinter.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at 49% 52%,rgba(45,21,31,.30),transparent 35%);opacity:0;';
 root.appendChild(splinter);arena.appendChild(root);
 let gone=false;
 function reset(){root.style.display='none';}
 function update(g){
  if(gone)return;
  const state=kwonThirdScreenRift(g),a=state.amount;
  if(a<=.015){reset();return;}
  root.style.display='block';
  const cut=Math.min(1,a),px=Math.round(cut*27),angle=(state.angle||0)*18;
  left.style.transform='translate3d('+(-px)+'px,'+(-px*.24)+'px,0)';
  right.style.transform='translate3d('+px+'px,'+(px*.24)+'px,0)';
  left.style.opacity=String(Math.min(.9,.2+cut*.7));
  right.style.opacity=String(Math.min(.9,.2+cut*.7));
  scar.style.transform='translateX(-50%) rotate('+angle+'deg) scaleX('+(.22+cut*.85)+')';
  scar.style.opacity=String(Math.min(.9,cut*.9));
  splinter.style.opacity=String(Math.min(.35,cut*.34));
 }
 function dispose(){if(gone)return;gone=true;root.remove();}
 return {root,update,reset,dispose,stats:()=>({passes:0,hasExtraWebGL:false})};
}
