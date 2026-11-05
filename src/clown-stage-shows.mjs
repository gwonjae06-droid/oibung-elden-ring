import {runEncoreVariant} from './clown-encore-shows.mjs';
const cross=(a,t,v)=>a<v&&t>=v;
export function runStageVariant(name,g,c,a,t,api){
 if(!['headReturn','runaway'].includes(name))return false;
 if(!Object.hasOwn(c.f,'stageVariant')){c.stageCounts??={};const n=c.stageCounts[name]||0;c.stageCounts[name]=n+1;const modes=name==='headReturn'?['original','photo','confetti','curtain']:['original','tilt','encore'];c.f.stageVariant=modes[n%modes.length];c.stageKey=c.f.stageVariant==='original'?null:c.f.stageVariant;}
 const mode=c.f.stageVariant;if(mode==='original')return false;
 if(runEncoreVariant(mode,g,c,a,t,api))return true;
 if(mode==='photo'){
  api.once(c,'stage-intro',()=>{api.emit(g,'clown-telegraph',{name:'이쪽 보세요, 찰칵!',key:'photoShow'});api.emit(g,'clown-inflate');});
  c.vis.glove=t<1.1?1:Math.max(0,1-(t-1.1)*2);c.vis.tilt=t<1.1?-.5:0;
  api.head(c,t<1.1?'hold':'regrow',t<1.1?1:Math.min(1,(t-1.1)/3),'small');
  for(const at of g.boss.phase===2?[1.2,1.9]:[1.2])if(cross(a,t,at)){
   const p={x:g.player.x,z:g.player.z};api.emit(g,'clown-shutter',p);
   const z=api.zone(g,{shape:'circle',...p,r:6,warn:1.4,damage:34,blast:true,major:true,sound:'photoShow'});
   api.bomb(g,{kind:'head',...p,r:6,fly:.9,warn:1.4,zone:z.id});
  }
  return true;
 }
 api.once(c,'stage-intro',()=>api.emit(g,'clown-telegraph',{name:'무대 좀 돌리겠습니다',key:'tiltShow'}));
 c.vis.juggle=t<4.3?1:0;c.vis.tilt=t<.5?-.7:t>=2.3&&t<2.8?.7:0;c.vis.crouch=t>=4.3?.7:0;
 for(let round=0;round<2;round++){
  const start=round===0?.5:2.8,key='stage-volley-'+round;
  if(cross(a,t,start)){
   const direction=g.player.z>=0?1:-1,gap=((c.seq||0)+round*2)%5,heads=[];
   for(let lane=0;lane<5;lane++)if(lane!==gap){const x=(lane-2)*6,from={x,y:2.1,z:-14*direction},to={x,z:14*direction};heads.push({from,to});api.bomb(g,{kind:'head',from,...from,fly:.001,warn:.7,r:2.1});}
   c.f[key]=heads;api.emit(g,'clown-stomp');
  }
  if(cross(a,t,start+.7))for(const h of c.f[key]||[]){api.bomb(g,{kind:'roll',from:{...h.from},x:h.to.x,z:h.to.z,px:h.from.x,pz:h.from.z,fly:0,travel:.8,warn:.8,r:2.1});api.emit(g,'clown-roll');}
 }
 return true;
}
