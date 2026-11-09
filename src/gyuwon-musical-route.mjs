// Stable recording IDs keep the original lyrics, choreography and save/debug
// references intact. Only these five recordings belong to the live campaign.
export const GYUWON_PERFORMANCE_ROUTE=Object.freeze([5,6,8,9,11]);
export const gyuwonActNumber=year=>GYUWON_PERFORMANCE_ROUTE.indexOf(year)+1;
export const gyuwonDisplayYear=(year,{finishing=false}={})=>finishing?10:gyuwonActNumber(year)>0?gyuwonActNumber(year)+4:year;
export const gyuwonNextPerformance=year=>GYUWON_PERFORMANCE_ROUTE.find(y=>y>year)??'ending';
export const gyuwonPerformanceProgress=(year,progress)=>Math.max(0,Math.min(1,(Math.max(0,gyuwonActNumber(year)-1)+progress)/GYUWON_PERFORMANCE_ROUTE.length));
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function gyuwonCurtainBridge(m){
 if(!m)return {cover:0,pair:null};
 const duration=m.clock?.duration||180,t=m.time;
 const pair=m.finishing?'dedication':m.year===11?'curtain-call':null;
 const incoming=(m.finishing||m.year===11&&m.fromYear===9)?1-ease(t/2.4):0;
 const outgoing=m.year===9||m.year===11&&!m.finishing?ease((t-(duration-1.8))/1.8):0;
 return {cover:Math.max(incoming,outgoing,!m.finishing&&m.songEnded&&[9,11].includes(m.year)?1:0),pair};
}
