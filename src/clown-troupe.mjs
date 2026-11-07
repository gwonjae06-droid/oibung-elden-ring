// Independently simulated, targetable nightmare-circus ensemble.
// Every attack uses the same telegraphed zone engine as the ringmaster.
// There is no decorative "mob" which can damage without a real cue.
const TAU=Math.PI*2;
// Orchestra members only attack autonomously between the director's shows.
// During any authored ringmaster move, their action is scripted explicitly;
// free-spawning simultaneous hits would steal the lead and break recovery.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
const ROLES=Object.freeze(['chorister','acrobat','puppeteer','firekeeper','mimic','chorister','acrobat','puppeteer']);
export const CIRCUS_ROLES=Object.freeze({
 chorister:{hp:80,speed:2.3,range:13,attack:13,wind:1.35},
 acrobat:{hp:85,speed:5.2,range:7.5,attack:16,wind:1.05},
 puppeteer:{hp:100,speed:2.0,range:11,attack:15,wind:1.4},
 firekeeper:{hp:90,speed:2.1,range:9.7,attack:16,wind:1.45},
 mimic:{hp:65,speed:4.4,range:8.2,attack:12,wind:1.20}
});
const targetCount=stage=>stage>=3?7:stage===2?5:3;
const away=p=>{const d=Math.hypot(p.x,p.z);return d>23?{x:p.x*23/d,z:p.z*23/d}:p};
function spawn(g,i){
 const role=ROLES[i%ROLES.length],a=i*TAU/8+.55,r=11+(i%3)*2,origin=g.boss;
 return {id:g.nextId++,role,x:origin.x+Math.sin(a)*r,z:origin.z+Math.cos(a)*r,
  vx:0,vz:0,yaw:a+Math.PI,life:CIRCUS_ROLES[role].hp,maxHp:CIRCUS_ROLES[role].hp,
  age:0,cast:0,cooldown:2.0+(i%4)*1.3,down:false,death:0,flash:0,step:0,
  target:null,showCue:null,seenHit:null,routine:null};
}
export function createCircusTroupe(g){
 return {members:[],fallen:[],reprise:null,hush:null,faceSync:null,stage:0,cycle:0,show:'',showAge:0,cue:0,globalCooldown:1.7,beat:0};
}
export function setCircusAct(g,stage){
 if(!g?.clown)return;
 const t=g.clown.troupe||(g.clown.troupe=createCircusTroupe(g));
 if(stage<=t.stage)return;
 // After the unskippable transformation, a different corps enters from
 // the perimeter; corpses do not instant-respawn in the middle of a hit.
 t.stage=stage;t.members=[];t.cycle=0;t.globalCooldown=1.4;
 t.reprise=null;t.hush=null;t.faceSync=null;
 for(let i=0;i<targetCount(stage);i++)t.members.push(spawn(g,i));
}
export function clearCircusTroupe(g){
 const t=g?.clown?.troupe;if(!t)return;
 t.members=[];t.fallen=[];t.reprise=null;t.hush=null;t.faceSync=null;
 t.show='';t.showAge=0;t.globalCooldown=3;
}
export function cueCircusShow(g,show){
 const t=g?.clown?.troupe;if(!t)return;
 t.show=show;t.showAge=0;t.cue++;
 const now=g.clown?.time||0;
 // Unison is an authored stage trick: brief motion silence, NOT a freeze
 // of combat, warning clocks, player controls or their attack hitboxes.
 if(show==='hush')t.hush={start:now,end:now+1.65};
 if(show==='finale'&&(g.clown?.horrorStage||1)>=3)
  t.faceSync={start:now+.6,end:now+9.0};

 // A real performer ensemble must be onstage before a choir, fire or
 // mirror attack can originate from their location. Reinforcements always
 // enter from the perimeter, and are capped to prevent an endless mob flood.
 const roleFor={chorus:'chorister',puppets:'puppeteer',fire:'firekeeper',
  twins:'mimic',stampede:'acrobat',finale:'chorister',
  juggle:'acrobat',drums:'acrobat',trapeze:'acrobat',
  cannon:'mimic',curtain:'chorister',hush:'mimic',mouthless:'chorister',reprise:'puppeteer'}[show];
 const required=show==='chorus'||show==='mouthless'?3:show==='twins'?2:show==='stampede'?3:
  show==='finale'?3:show==='fire'?2:show==='drums'?3:2;
 let count=t.members.filter(m=>!m.down&&m.role===roleFor).length;
 const cap=targetCount(t.stage||1)+3;
 for(let i=0;i<required*2&&count<required&&t.members.filter(m=>!m.down).length<cap;i++){
  const roleIndex=ROLES.indexOf(roleFor);if(roleIndex<0)break;
  const guest=spawn(g,roleIndex);guest.showGuest=true;
  const r=18,angle=(t.cue+i)*TAU/9;
  guest.x=g.boss.x+Math.sin(angle)*r;guest.z=g.boss.z+Math.cos(angle)*r;
  const bound=away(guest);guest.x=bound.x;guest.z=bound.z;
  guest.cooldown=1.6;
  t.members.push(guest);count++;
 }
 // If an act starts after a player has eliminated most of the cast,
 // the next entrance is deliberate, not an instant silent resurrection.
 if(t.members.every(m=>m.down)&&t.members.length<cap)
  t.members.push(spawn(g,t.cycle++));
}
export function circusTroupeAlive(g){return g?.clown?.troupe?.members?.filter(m=>!m.down)||[];}
// Store the *last defeated people* as scenery-only corpses, not extra HP
// or unkillable enemies. The last three can be pulled on literal puppet wires.
export function beginCircusReprise(g,{duration=7.4}={}){
 const t=g?.clown?.troupe;if(!t)return null;
 const now=g.clown.time||0,p=g.player||g.boss;
 const recent=(t.fallen||[]).slice(0,3);
 const bodies=recent.map((m,i)=>({
  id:'fallen-'+m.id,role:m.role,x:m.x,z:m.z,yaw:m.yaw,realCorpse:true,order:i
 }));
 // If no performer has died yet, discarded stage mannequins are used.
 // They are visibly posed as inanimate dolls, not falsely resurrected NPCs.
 for(let i=bodies.length;i<3;i++){
  const angle=(i*2*Math.PI/3)+(t.cue||0)*.29,r=10.2;
  const point=away({x:p.x+Math.sin(angle)*r,z:p.z+Math.cos(angle)*r});
  bodies.push({id:'discarded-'+t.cue+'-'+i,role:'puppeteer',
   x:point.x,z:point.z,yaw:angle+Math.PI,realCorpse:false,order:i});
 }
 t.reprise={start:now,end:now+Math.max(5,duration),bodies};
 return t.reprise;
}
const smooth01=n=>{const t=clamp(n,0,1);return t*t*(3-2*t)};
export function circusUncannyFrame(g){
 const t=g?.clown?.troupe,now=g?.clown?.time||0;
 if(!t)return {hush:0,face:0,unison:0};
 const hush=t.hush&&now>=t.hush.start&&now<t.hush.end
  ?smooth01((now-t.hush.start)/.24)*(1-smooth01((now-(t.hush.end-.25))/.25)):0;
 const sync=t.faceSync,unison=sync&&now>=sync.start&&now<sync.end
  ?smooth01((now-sync.start)/.9)*(1-smooth01((now-(sync.end-.7))/.7)):0;
 return {hush,face:unison,unison};
}

// Master MP3 is pulled down for less than two seconds when all figures
// freeze simultaneously; it is never stopped, restarted or desynchronized.
export function circusHorrorMusicGain(g){
 const t=g?.clown?.troupe,c=g?.clown;if(!t||!c)return 1;
 const now=c.time||0;
 if(t.hush&&now>=t.hush.start&&now<t.hush.end)
  return Math.max(.08,1-.92*circusUncannyFrame(g).hush);
 const sync=t.faceSync;
 if(sync&&now>=sync.start&&now<sync.start+1.12){
  const u=(now-sync.start)/1.12;
  return Math.max(.13,1-.87*Math.sin(Math.PI*u));
 }
 return 1;
}
// A real stage actor rehearses this exact beat. UI cannot create damage.
export function stageCircusBeat(g,{role,index=0,pose='conductor',wind=1.3,hold=1.8}={}){
 const alive=circusTroupeAlive(g).filter(m=>m.role===role);
 if(!alive.length)return null;
 const actor=alive[index%alive.length],now=g.clown.time||0;
 actor.routine={pose,start:now,until:now+Math.max(.3,hold),wind};
 actor.cast=Math.max(actor.cast||0,Math.min(wind+.15,hold));
 actor.cooldown=Math.max(actor.cooldown||0,hold+.35);
 actor.showCue=pose;
 return actor;
}
function contactAngle(a,b){return Math.atan2(b.x-a.x,b.z-a.z);}
function damageMember(g,m,damage,emit){
 if(m.down||!(damage>0))return;
 m.life=Math.max(0,m.life-damage);m.flash=.27;
 emit(g,'clown-troupe-hit',{id:m.id,role:m.role,amount:Math.round(damage),x:m.x,z:m.z});
 if(g.stats){g.stats.hits=(g.stats.hits||0)+1;}
 if(m.life===0){m.down=true;m.death=0;
  const t=g.clown?.troupe;
  if(t){t.fallen||=[];t.fallen.unshift({id:m.id,role:m.role,x:m.x,z:m.z,yaw:m.yaw,time:g.clown.time||0});t.fallen.length=Math.min(t.fallen.length,4);}
  emit(g,'clown-troupe-down',{id:m.id,role:m.role,x:m.x,z:m.z});}
}
function playerContacts(g,t,emit){
 const p=g.player,a=p.action;
 // A visible weapon swing must face and reach a member. This does not
 // register phantom "boss hits" when an actor happens to be nearby.
 if(a?.kind==='attack'&&!a?.projectile&&Number.isFinite(a.wind)
  &&a.t>=a.wind&&a.t<=a.wind+a.active){
  for(const m of t.members){
   if(m.down||m.seenHit===a)continue;
   const d=Math.hypot(m.x-p.x,m.z-p.z);
   const yaw=contactAngle(p,m),dif=Math.atan2(Math.sin(yaw-a.yaw),Math.cos(yaw-a.yaw));
   const reach=g.weapon==='hammer'?4.0:3.6;
   if(d>reach||Math.abs(dif)>.78)continue;
   m.seenHit=a;
   damageMember(g,m,g.weapon==='hammer'?70:45,emit);
  }
 }
 // Real shots hit the members too; the projectile is consumed and cannot
 // penetrate through a singer to damage the boss on the next tick.
 for(const q of g.projectiles||[]){
  if(q.hit||q.bossHit||q.life<=0)continue;
  for(const m of t.members){
   if(m.down)continue;
   const range=m.role==='acrobat'?1.05:1.15;
   if(Math.hypot(q.x-m.x,q.z-m.z)<range){
    q.hit=true;q.life=0;
    damageMember(g,m,q.damage||32,emit);break;
   }
  }
 }
}
function castAttack(g,m,zone,emit){
 const p=g.player,role=m.role,s=CIRCUS_ROLES[role],warn=s.wind;
 const aim=away({x:p.x,z:p.z});
 m.cast=warn+.35;m.showCue=role;m.target={...aim};
 if(role==='chorister'){
  const yaw=contactAngle(m,p),len=clamp(Math.hypot(m.x-p.x,m.z-p.z)+2,3,17);
  zone(g,{shape:'lane',x:m.x,z:m.z,yaw,len,w:2.6,warn,damage:s.attack,sound:'choir'});
 }else if(role==='acrobat'){
  zone(g,{shape:'circle',...aim,r:2.35,warn,damage:s.attack,sound:'acrobat'});
 }else if(role==='puppeteer'){
  const q=away({x:p.x+Math.sin(m.age*2)*2.5,z:p.z+Math.cos(m.age*2)*2.5});
  zone(g,{shape:'circle',...q,r:2.9,warn,damage:s.attack,sound:'puppet'});
 }else if(role==='firekeeper'){
  zone(g,{shape:'circle',...aim,r:3.15,warn,damage:s.attack,sound:'infernalHoops'});
 }else{
  const side=Math.atan2(p.x-m.x,p.z-m.z)+((Math.floor(m.age)%2)?.3:-.3);
  zone(g,{shape:'lane',x:m.x,z:m.z,yaw:side,len:13,w:2.25,warn,damage:s.attack,sound:'falseRingmaster'});
 }
 emit(g,'clown-troupe-cast',{id:m.id,role,wind:warn,x:m.x,z:m.z});
}
export function stepCircusTroupe(g,dt,{zone,emit}){
 if(!g?.clown||!g?.boss||g.status!=='playing')return;
 const t=g.clown.troupe;if(!t)return;
 const c=g.clown,b=g.boss,stage=c.horrorStage||1;
 if(b.state==='transition'||b.state==='dead')return;
 setCircusAct(g,stage);
 const h=clamp(dt,0,1/30);
 t.beat+=h;t.showAge+=h;if(t.showAge>10)t.show='';
 if(t.reprise&&c.time>=t.reprise.end)t.reprise=null;
 if(t.faceSync&&c.time>=t.faceSync.end)t.faceSync=null;
 if(t.hush&&c.time>=t.hush.end)t.hush=null;
 t.globalCooldown=Math.max(0,t.globalCooldown-h);
 playerContacts(g,t,emit);
 const target=g.player,phase=b.phase,locked=Boolean(c.punish||c.stunT>0||c.noSeparate);
 for(let i=0;i<t.members.length;i++){
  const m=t.members[i],s=CIRCUS_ROLES[m.role];
  m.age+=h;m.flash=Math.max(0,m.flash-h);
  if(m.routine&&c.time>=m.routine.until)m.routine=null;
  if(m.down){m.death+=h;continue;}
  if(m.cast>0){m.cast=Math.max(0,m.cast-h);m.cooldown=Math.max(m.cooldown,m.cast+.8);}
  else m.cooldown-=h;
  // The full ensemble continually repositions, not a fixed texture
  // billboard. Accelerations and damping prevent teleporting footwork.
  const wave=i*Math.PI*.48+t.beat*.13*(phase===2?1.35:1);
  const desiredRadius=s.range+(t.show==='chorus'?-1.5:0);
  const around={x:target.x+Math.sin(wave)*desiredRadius,z:target.z+Math.cos(wave)*desiredRadius};
  const acrobatRush=m.role==='acrobat'&&m.cast>0&&m.cast<.85&&m.cast>.28;
  const silent=t.hush&&c.time<t.hush.start+.74;
  const unison=t.faceSync&&c.time>=t.faceSync.start&&c.time<t.faceSync.start+.72;
  const safe=away(acrobatRush&&m.target?m.target:around),dx=safe.x-m.x,dz=safe.z-m.z,
    len=Math.hypot(dx,dz),speed=(silent||unison)?0:acrobatRush?14:m.cast>0?.24:s.speed;
  const accel=Math.min(1,8*h);
  m.vx+=((len>1e-4?dx/len*speed:0)-m.vx)*accel;
  m.vz+=((len>1e-4?dz/len*speed:0)-m.vz)*accel;
  // Apply friction to physical velocity, then stay inside the arena.
  m.vx*=Math.exp(-h*1.1);m.vz*=Math.exp(-h*1.1);
  const oldX=m.x,oldZ=m.z;
  m.x+=m.vx*h;m.z+=m.vz*h;
  const bounded=away(m);m.x=bounded.x;m.z=bounded.z;
  m.step+=Math.hypot(m.x-oldX,m.z-oldZ);
  m.yaw=contactAngle(m,target);
  // Do not stack all performer attacks simultaneously outside a deliberate
  // choreographed show, nor attack into the boss's punish / cutscene window.
  const authored=c.state==='pattern';
  if(locked||authored||t.globalCooldown>0||m.cooldown>0||m.cast>0)continue;
  if(t.members.filter(x=>x.cast>0&&!x.down).length>= (stage===3?2:1))continue;
  castAttack(g,m,zone,emit);
  m.cooldown=3.8+i*.27;t.globalCooldown=stage===3?1.2:stage===2?1.75:2.6;
 }
 // Delete only after the exit animation has had time to finish.
 t.members=t.members.filter(m=>!m.down||m.death<1.8);
}
