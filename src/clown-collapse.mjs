import {createCollapseClock} from './boss-collapse.mjs';
export function createClownCollapse(){const clock=createCollapseClock();return {update(g,dt,hidden=false){const p=clock.step(g.boss,dt,hidden);if(g.status!=='won'||!p)return null;return {fall:p.fall,roll:1.35*p.fall,pitch:.15*p.fall,bodyDrop:4*p.fall,mountDrop:.55*p.fall,ballShift:3*p.fall,done:p.done};}};}
