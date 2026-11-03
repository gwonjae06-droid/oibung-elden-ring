import {DICE_RULES as R} from './dice-data.mjs';
export const CASINO_COLORS=Object.freeze({felt:[0x0f5a38,0x0b4a2e],rim:0x2a0f0a,gold:0xd4a83b,floor:0x14060a,neon:[0xff2d95,0x2dd4ff],chips:[0xc4262e,0x1d4fa8,0x1a1a1f,0xd4a83b,0x2f8f4e],sky:0x07030a,fog:0x1a0812});
export const boardHalf=()=>(R.side-1)*R.edge/2;
export function feltIndex(row,col){return (row+col)%2;}
export function gridLines(){const h=boardHalf()+R.edge/2,n=R.side,e=R.edge,pts=[];for(let i=0;i<=n;i++){const v=-h+i*e;pts.push(-h,0,v,h,0,v);pts.push(v,0,-h,v,0,h);}return pts;}
function lcg(seed){let s=seed;return ()=>{s=s*16807%2147483647;return s/2147483647;};}
function squareRing(angle,d){const c=Math.cos(angle),s=Math.sin(angle),m=Math.max(Math.abs(c),Math.abs(s));return {x:c/m*d,z:s/m*d};}
export function chipStacks(count=28,seed=21){const rnd=lcg(seed),half=boardHalf()+R.tileWidth/2,out=[];for(let i=0;i<count;i++){const a=i/count*Math.PI*2+(rnd()-.5)*.12,d=half+10+rnd()*14,p=squareRing(a,d);out.push({x:p.x,z:p.z,height:3+Math.floor(rnd()*7),color:Math.floor(rnd()*CASINO_COLORS.chips.length)});}return out;}
export function pillars(count=12){const half=boardHalf()+R.tileWidth/2,out=[];for(let i=0;i<count;i++){const p=squareRing((i+.5)/count*Math.PI*2,half+36);out.push({x:p.x,z:p.z,height:26});}return out;}
