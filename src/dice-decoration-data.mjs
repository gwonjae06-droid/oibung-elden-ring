const PIPS=[[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[-1,1],[1,-1],[1,1]],[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]];
const COUNTS=[1,6,2,5,3,4],NORMALS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function diceDecorations(edge=8){
 if(!Number.isFinite(edge)||edge<=0)throw Error('Invalid dice edge');
 return COUNTS.map((count,face)=>({face,count,normal:[...NORMALS[face]],radius:edge*.09,depth:edge*.081,offset:edge*.02,spikeRadius:edge*.028,spikeHeight:edge*.16,points:PIPS[count-1].map(([x,y])=>[x*edge*.21875,y*edge*.21875]),spikes:Array.from({length:count},(_,i)=>{const a=2*Math.PI*i/count;return [Math.cos(a)*edge*.44,Math.sin(a)*edge*.44];})}));
}
export function dicePortraitUv(x,y,radius){return [Math.max(0,Math.min(1,.5+x/(2*radius))),Math.max(0,Math.min(1,.5+y/(2*radius)))];}
