export function circusLayout(mobile=false){
 const rows=mobile?2:3,columns=mobile?40:72,crowd=[];
 for(let row=0;row<rows;row++)for(let i=0;i<columns;i++){const angle=(i+.5*(row%2))/columns*Math.PI*2,r=27+row*2;crowd.push({x:Math.sin(angle)*r,z:Math.cos(angle)*r,y:1+row*1.2,scale:.8+((i*13+row*7)%9)/30,color:(i+row)%5,angle});}
 return {crowd,bulbs:mobile?64:128,flags:mobile?16:24,balloons:mobile?16:32,roofPanels:24,spotlights:mobile?1:2};
}
export function circusMotion(time=0,phase=1,reduced=false){const t=Number.isFinite(time)?Math.max(0,time):0,rate=phase===2?1.35:1;return {sweep:reduced?0:Math.sin(t*.35*rate)*.65,bob:reduced?0:Math.sin(t*1.1*rate)*.22,flutter:reduced?0:Math.sin(t*1.7*rate)*.12};}
