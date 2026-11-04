const saved=new WeakMap();
export function clownLensCue(g){
 const c=g?.clown,t=c?.pt;
 if(g?.status!=='playing'||g?.boss?.state==='transition'||c?.state!=='pattern'||!Number.isFinite(t)||t<0)return {roll:0,scale:1,active:false};
 if(c.showKey&&c.stageKey==='photo'){if(t>=1)return {roll:0,scale:1,active:false};const k=Math.sin(Math.PI*t);return {roll:4*k,scale:1+.1*k,active:k>0};}
 if(c.showKey&&c.stageKey==='tilt'){const u=t<.5?t:t>=2.3&&t<2.8?t-2.3:-1;if(u<0)return {roll:0,scale:1,active:false};const k=Math.sin(Math.PI*u/.5);return {roll:(t<.5?-4:4)*k,scale:1+.1*k,active:k>0};}
 const photo=c.name==='spotlightSweep',tilt=c.name==='carousel',duration=photo?.72:.7;
 if((!photo&&!tilt)||t>=duration)return {roll:0,scale:1,active:false};
 const k=Math.sin(Math.PI*t/duration);return {roll:(photo?1.4:-2)*k,scale:1+.06*k,active:k>0};
}
export function restoreClownLens(canvas){const old=canvas&&saved.get(canvas);if(!old)return;canvas.style.transform=old.transform;canvas.style.transformOrigin=old.origin;saved.delete(canvas);}
export function updateClownLens(g,doc=globalThis.document){
 const canvas=doc?.getElementById?.('clown-battle')?.firstElementChild?.shadowRoot?.getElementById?.('world');if(!canvas?.style)return;
 let old=saved.get(canvas);if(old&&old.game!==g){restoreClownLens(canvas);old=null;}
 const cue=clownLensCue(g);if(!cue.active){restoreClownLens(canvas);return;}
 if(!old){old={game:g,transform:canvas.style.transform,origin:canvas.style.transformOrigin};saved.set(canvas,old);}
 canvas.style.transformOrigin='50% 50%';canvas.style.transform=(old.transform?old.transform+' ':'')+'rotate('+cue.roll.toFixed(4)+'deg) scale('+cue.scale.toFixed(5)+')';
}
