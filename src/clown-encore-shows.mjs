const cross=(a,t,v)=>a<v&&t>=v,sat=v=>Math.max(0,Math.min(1,v));
const bounded=p=>{const r=Math.hypot(p.x,p.z),k=r>21?21/r:1;return {x:p.x*k,z:p.z*k};};
function ball(g,p,r,warn,damage,api,kind='ball'){const z=api.zone(g,{shape:'circle',...p,r,warn,damage,blast:true,major:false});api.bomb(g,{kind,...p,r,fly:Math.min(.6,warn),warn,zone:z.id});}
export function runEncoreVariant(mode,g,c,a,t,api){
 if(!['confetti','curtain','encore'].includes(mode))return false;
 api.once(c,'encore-intro',()=>api.emit(g,'clown-telegraph',{name:{confetti:'폭탄인 줄 알았죠?',curtain:'커튼 뒤에 뭐가 있을까요',encore:'공연 종료 — 앙코르!'}[mode],key:mode}));
 if(mode==='confetti'){
  const p=api.once(c,'fake-target',()=>{api.emit(g,'clown-inflate');const p=bounded(g.player);api.bomb(g,{kind:'head',...p,r:2.5,fly:.7,warn:.7});return p;});
  api.head(c,t<.7?'inflate':'regrow',t<.7?t/.7:sat((t-.7)/3),'small');c.vis.juggle=t>.7&&t<2.9?1:0;
  if(cross(a,t,.7)){api.emit(g,'clown-confetti');api.emit(g,'clown-blast',{...p,r:2.5,harmless:true});}
  if(cross(a,t,.9))for(let i=0;i<4;i++){const yaw=i*Math.PI/2;ball(g,bounded({x:p.x+Math.sin(yaw)*4.5,z:p.z+Math.cos(yaw)*4.5}),2,.95+i*.2,22,api);}
  if(cross(a,t,2))ball(g,p,3,.9,28,api,'head');
  return true;
 }
 if(mode==='curtain'){
  c.vis.crouch=t<.5?.8:0;c.vis.tilt=t<.5?.5:0;
  if(cross(a,t,.5)){c.f.curtainTarget=bounded(g.player);api.zone(g,{shape:'circle',...c.f.curtainTarget,r:3.2,warn:1,damage:32,blast:true,major:false});api.emit(g,'clown-stomp');}
  c.vis.neckTarget=c.f.curtainTarget||null;c.vis.neck=t<.5?0:t<1.5?sat((t-.5)/1):1-sat((t-1.5)/.7);
  if(cross(a,t,1.5))api.emit(g,'clown-slam',c.f.curtainTarget);
  if(cross(a,t,1.7))for(const side of[-1,1])ball(g,bounded({x:c.f.curtainTarget.x+side*4.5,z:c.f.curtainTarget.z}),1.8,.9,22,api);
  return true;
 }
 c.vis.crouch=t<.6?.9:t>4.25?.6:0;c.vis.tilt=t<.6?.6:t>4.25?-.3:0;
 const path=api.once(c,'encore-path',()=>{const from={x:g.boss.x,z:g.boss.z},yaw=Math.atan2(g.player.x-from.x,g.player.z-from.z),len=api.fitLen(from,yaw,24);return {from,to:{x:from.x+Math.sin(yaw)*len,z:from.z+Math.cos(yaw)*len}};});
 if(cross(a,t,.6))api.bomb(g,{kind:'head',from:{...path.from,y:2.1},...path.from,fly:.001,warn:.8,r:2.1});
 if(cross(a,t,1.4)){api.bomb(g,{kind:'roll',from:{...path.from,y:2.1},...path.to,px:path.from.x,pz:path.from.z,fly:0,travel:.65,warn:.65,r:2.1});api.emit(g,'clown-roll');}
 api.dashPart(g,c,a,t,2.2,'encore-dash');
 if(cross(a,t,3.6)){c.yaw=Math.atan2(g.player.x-g.boss.x,g.player.z-g.boss.z);api.cone(g,c.yaw,.65,12,.9,32,'clap');}
 c.vis.glove=t>=3.6&&t<4.25?sat((t-3.6)/.65):0;
 return true;
}
