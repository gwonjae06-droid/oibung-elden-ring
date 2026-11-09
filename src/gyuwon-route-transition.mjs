import {gyuwonCurtainBridge} from './gyuwon-musical-route.mjs';
// The house curtain covers only the two changes back into 3D/end-song.
// Earlier changes carry their physical path or the outgoing 2D picture.
export function createGyuwonRouteTransition(doc,shell){
 const canvas=doc.createElement('canvas');canvas.className='gy-route-curtain';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'25',pointerEvents:'none'});shell.append(canvas);const c=canvas.getContext('2d');
 return {update(g){const m=g.gyuwon?.years?.musical,{cover}=gyuwonCurtainBridge(m);canvas.hidden=cover<.001;if(canvas.hidden)return;
  const r=shell.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}c.clearRect(0,0,w,h);
  for(const side of [-1,1]){const edge=side<0?w*.5*cover:w-w*.5*cover,x=side<0?0:edge,width=w*.5*cover;
   c.fillStyle='#64253e';c.fillRect(x,0,width,h);c.strokeStyle='#281b2c';c.lineWidth=4;c.beginPath();c.moveTo(edge,0);c.lineTo(edge+side*3,h*.5);c.lineTo(edge,h);c.stroke();
   for(let i=0;i<12;i++){const q=(i+.5)/12,fold=x+width*q;c.strokeStyle=i%2?'#9b4058':'#3a2031';c.lineWidth=i%2?7:4;c.beginPath();c.moveTo(fold,0);c.bezierCurveTo(fold+9,h*.3,fold-7,h*.7,fold+3,h);c.stroke();}
  }
 },dispose(){canvas.remove();}};
}
