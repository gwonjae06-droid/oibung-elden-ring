import {updateClownCurtains,restoreClownCurtains} from './clown-curtain-gag.mjs';
export function clownLensCue(g){
 const c=g?.clown,t=c?.pt;
 if(g?.status!=='playing'||g?.boss?.state==='transition'||c?.state!=='pattern'||!Number.isFinite(t)||t<0)return {roll:0,scale:1,active:false};
 const swell=u=>{const v=Math.max(0,Math.min(1,u)),e=v*v*(3-2*v);return Math.max(0,Math.sin(Math.PI*e));};
 if(c.showKey==='headReturn'&&c.stageKey==='photo'){if(t>=1)return {roll:0,scale:1,active:false};const k=swell(t);return {roll:10*k,scale:1+.18*k,active:k>0};}
 if(c.showKey==='runaway'&&c.stageKey==='tilt'){const u=t<.5?t:t>=2.3&&t<2.8?t-2.3:-1;if(u<0)return {roll:0,scale:1,active:false};const k=swell(u/.5);return {roll:(t<.5?-12:12)*k,scale:1+.22*k,active:k>0};}
 const photo=c.name==='spotlightSweep',tilt=c.name==='carousel',duration=photo?.72:.7;
 if((!photo&&!tilt)||t>=duration)return {roll:0,scale:1,active:false};
 const k=Math.sin(Math.PI*t/duration);return {roll:(photo?1.4:-2)*k,scale:1+.06*k,active:k>0};
}
export function restoreClownLens(canvas){restoreClownCurtains(canvas);}
export function updateClownLens(g,doc=globalThis.document){const canvas=doc?.getElementById?.('clown-battle')?.firstElementChild?.shadowRoot?.getElementById?.('world');if(canvas?.style)updateClownCurtains(g,canvas);}
