const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export function createChipState(delay=1,duration=.35){
 let target=1,shown=1,hold=0,elapsed=0,from=1;
 const value=()=>({actual:target,delayed:shown,width:Math.max(0,shown-target)});
 function reset(v=1){target=shown=from=sat(v);hold=elapsed=0;return value();}
 function step(dt,v){v=sat(v);const h=Number.isFinite(dt)?Math.max(0,dt):0;if(v<target-1e-9){target=v;hold=delay;from=shown;elapsed=0;return value();}if(v>target+1e-9)return reset(v);let move=h;if(hold>0){move=Math.max(0,h-hold);hold=Math.max(0,hold-h);}if(move>0&&shown>target){elapsed+=move;const t=Math.min(1,elapsed/duration),ease=t*t*(3-2*t);shown=Math.max(target,from+(target-from)*ease);}return value();}
 return {reset,step,value};
}
export function createBossChip(doc=globalThis.document){
 const state=createChipState();let meter=null,bar=null,lastGame=null,lastMax=null,oldPosition='',changed=false;
 function clear(){bar?.remove();if(changed&&meter?.style.position==='relative')meter.style.position=oldPosition;meter=bar=lastGame=lastMax=null;changed=false;state.reset();}
 function update(dt,g){
  if(!doc||!g?.boss)return;const root=g.clown?doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot:doc,fill=root?.getElementById('boss-fill'),next=fill?.parentElement;if(!next){clear();return;}
  const max=g.boss.maxHp,ratio=max>0?sat(g.boss.hp/max):0;
  if(next!==meter){clear();meter=next;oldPosition=meter.style.position;const position=doc.defaultView?.getComputedStyle?.(meter)?.position||oldPosition||'static';changed=position==='static';if(changed)meter.style.position='relative';for(const stale of meter.querySelectorAll?.('.boss-chip')||[])stale.remove();bar=doc.createElement('i');bar.className='boss-chip';bar.setAttribute('aria-hidden','true');bar.style.cssText='position:absolute;top:0;bottom:0;height:100%;left:100%;width:0;background:#a8a8a8;opacity:.85;pointer-events:none;transform:none;transition:none;z-index:1';meter.appendChild(bar);}
  let v;if(lastGame!==g||lastMax!==max){lastGame=g;lastMax=max;v=state.reset(ratio);}else v=state.step(dt,ratio);
  bar.style.left=(v.actual*100)+'%';bar.style.width=(v.width*100)+'%';
 }
 return {update,clear};
}
