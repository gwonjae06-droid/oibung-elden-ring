export const KWON_SOUNDS={
 sweep:{sample:1,rate:1.05,f:340,to:100,tail:.3},reverse:{sample:2,rate:1.18,f:400,to:110,tail:.27},cross:{sample:3,rate:1.02,f:480,to:130,tail:.32},
 thrust:{sample:3,rate:1.3,f:650,to:180,tail:.22},slam:{sample:2,rate:.78,f:100,to:32,tail:.6},leap:{sample:2,rate:.86,f:140,to:38,tail:.55},
 whirl:{sample:1,rate:.92,f:270,to:75,tail:.65},rise:{sample:3,rate:1.12,f:180,to:600,tail:.35},jab:{sample:3,rate:1.42,f:760,to:240,tail:.16},
 rush:{sample:1,rate:1.25,f:520,to:90,tail:.24},retreat:{sample:2,rate:.94,f:260,to:140,tail:.2},wave:{sample:3,rate:.88,f:340,to:850,tail:.5},
 stomp:{sample:2,rate:.72,f:90,to:30,tail:.5},backsweep:{sample:2,rate:1.06,f:380,to:100,tail:.33},shove:{sample:2,rate:.82,f:130,to:45,tail:.28}
};
export function kwonSound(ev,g){
 if(ev.type!=='player-hit'||!(ev.amount>0))return null;
 const p=KWON_SOUNDS[g.boss.pattern]||KWON_SOUNDS.sweep;
 return {file:'sword'+p.sample+'.mp3',rate:p.rate*(g.boss.phase===2?1.06:1),volume:.4,f:p.f,to:p.to,cueDuration:p.tail,type:'sawtooth'};
}
