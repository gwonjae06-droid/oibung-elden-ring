const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const toward=(a,b,len)=>{const d=b.map((v,i)=>v-a[i]),n=Math.hypot(...d);return a.map((v,i)=>v+(n>1e-9?d[i]/n:i===1?1:0)*len);};
export function solveKwonLeg(rest,target){
 const p=rest.map(v=>[...v]);if(!target?.every(Number.isFinite))return p;
 const root=[...p[0]],lengths=p.slice(1).map((v,i)=>distance(v,p[i])),reach=lengths.reduce((a,b)=>a+b,0);
 if(distance(root,target)>=reach){for(let i=0;i<lengths.length;i++)p[i+1]=toward(p[i],target,lengths[i]);return p;}
 for(let n=0;n<40;n++){p[p.length-1]=[...target];for(let i=p.length-2;i>=0;i--)p[i]=toward(p[i+1],p[i],lengths[i]);p[0]=[...root];for(let i=0;i<lengths.length;i++)p[i+1]=toward(p[i],p[i+1],lengths[i]);if(distance(p.at(-1),target)<1e-6)break;}
 return p;
}
export function kwonStepPoint(from,to,u,height){const t=ease(u);return from.map((v,i)=>v+(to[i]-v)*t+(i===1?Math.sin(Math.PI*t)*height:0));}
function poseBones(L,points){
 const {T,pivots,lengths}=L,parent=new T.Quaternion(),absolute=new T.Quaternion(),up=new T.Vector3(0,1,0),dir=new T.Vector3();
 for(let i=0;i<3;i++){dir.set(...points[i+1]).sub(L.v.set(...points[i])).normalize();absolute.setFromUnitVectors(up,dir);pivots[i].quaternion.copy(parent).invert().multiply(absolute);if(i)pivots[i].position.set(0,lengths[i-1],0);parent.copy(absolute);}
 L.tip.quaternion.copy(parent).invert().multiply(absolute.setFromUnitVectors(up,dir.set(0,-1,0)));L.solved=points;
}
export function buildKwonLeg(T,plan,carapace,joint,clawMat){
 const g=new T.Group();g.name='kwon-articulated-leg-'+plan.index;g.position.set(...plan.root);g.rotation.y=plan.yaw;
 const rest=plan.points.map(v=>[...v]),lengths=rest.slice(1).map((v,i)=>distance(v,rest[i])),pivots=[],radii=[.22,.17,.115,.07];let parent=g;
 for(let i=0;i<3;i++){const pivot=new T.Group();pivot.name='kwon-leg-'+plan.index+'-joint-'+i;parent.add(pivot);const segment=new T.Mesh(new T.CylinderGeometry(radii[i+1],radii[i],lengths[i],14).translate(0,lengths[i]/2,0),carapace);segment.castShadow=true;pivot.add(segment);const ball=new T.Mesh(new T.SphereGeometry(radii[i]*1.1,12,10),joint);ball.castShadow=true;pivot.add(ball);pivots.push(pivot);parent=pivot;}
 const tip=new T.Group();tip.position.y=lengths[2];parent.add(tip);const claw=new T.Mesh(new T.ConeGeometry(.07,.38,8),clawMat);claw.position.y=-.12;claw.castShadow=true;tip.add(claw);
 const L={T,g,plan,baseYaw:plan.yaw,baseY:plan.root[1],rest,lengths,pivots,tip,v:new T.Vector3(),state:null,articulated:true};poseBones(L,rest);return L;
}
export function poseKwonLeg(L,phase,speed){
 if(!Number.isFinite(phase)||!Number.isFinite(speed))return;L.g.updateWorldMatrix(true,false);
 const world=p=>L.g.localToWorld(L.v.set(...p)).toArray(),root=L.g.getWorldPosition(L.v).toArray(),nominal=world(L.rest[3]);let s=L.state;
 if(!s||phase<s.lastPhase||distance(root,s.root)>6){L.state={root,lastPhase:phase,ground:nominal[1],anchor:[...nominal],foot:[...nominal],progress:((L.plan.k+(L.plan.side>0?1:0))%2)*.5+L.plan.k*.035,swing:false};poseBones(L,L.rest);return;}
 const delta=phase-s.lastPhase;if(!(delta>0))return;
 const moving=speed>.15||distance(root,s.root)>.002,dt=clamp(delta/(2+clamp(speed,0,14)*1.1),.001,.1);s.lastPhase=phase;
 if(moving||s.swing)s.progress+=delta/(Math.PI*2);
 if(s.swing&&s.progress>=s.end){s.anchor=[...s.to];s.swing=false;}
 if(!s.swing&&moving&&s.progress%1>=.64){
  const lead=root.map((v,i)=>(v-s.root[i])*.1/dt);lead[1]=0;const d=Math.hypot(...lead),k=d>.75?.75/d:1;
  s.from=[...s.foot];s.to=nominal.map((v,i)=>i===1?s.ground:v+lead[i]*k);s.begin=s.progress;s.end=Math.floor(s.progress)+1;s.swing=true;
 }
 s.foot=s.swing?kwonStepPoint(s.from,s.to,(s.progress-s.begin)/Math.max(.001,s.end-s.begin),.22+clamp(speed,0,14)*.02):[...s.anchor];s.root=root;
 const local=L.g.worldToLocal(L.v.set(...s.foot)).toArray();poseBones(L,solveKwonLeg(L.rest,local));
}
