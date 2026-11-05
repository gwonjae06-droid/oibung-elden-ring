const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const toward=(a,b,len)=>{const d=b.map((v,i)=>v-a[i]),n=Math.hypot(...d);return a.map((v,i)=>v+(n>1e-9?d[i]/n:i===1?1:0)*len);};
export const KWON_SUPPORT=Object.freeze({ground:.06,stance:.78,swing:.22,lift:.12,liftSpeed:.004,replant:.75});
export function solveKwonLeg(rest,target){
 const p=rest.map(v=>[...v]);if(!target?.every(Number.isFinite))return p;
 const root=[...p[0]],lengths=p.slice(1).map((v,i)=>distance(v,p[i])),reach=lengths.reduce((a,b)=>a+b,0);
 if(distance(root,target)>=reach){for(let i=0;i<lengths.length;i++)p[i+1]=toward(p[i],target,lengths[i]);return p;}
 for(let n=0;n<40;n++){p[p.length-1]=[...target];for(let i=p.length-2;i>=0;i--)p[i]=toward(p[i+1],p[i],lengths[i]);p[0]=[...root];for(let i=0;i<lengths.length;i++)p[i+1]=toward(p[i],p[i+1],lengths[i]);if(distance(p.at(-1),target)<1e-6)break;}
 return p;
}
export function solveKwonSupportLeg(rest,target){
 if(!target?.every(Number.isFinite))return rest.map(v=>[...v]);
 const root=[...rest[0]],side=rest[1][0]>=root[0]?1:-1,angle=p=>Math.atan2(p[0]-root[0],p[2]-root[2]),delta=angle(target)-angle(rest[3]),yaw=.3*Math.sin(delta),c=Math.cos(yaw),s=Math.sin(yaw),v=rest[1].map((x,i)=>x-root[i]);
 const hip=[root[0]+v[0]*c+v[2]*s,rest[1][1],root[2]-v[0]*s+v[2]*c],a=distance(rest[1],rest[2]),b=distance(rest[2],rest[3]),d0=distance(hip,target),dir=d0>1e-8?target.map((x,i)=>(x-hip[i])/d0):[0,-1,0],d=clamp(d0,Math.max(Math.abs(a-b)+.08,Math.max(a,b)*.55),(a+b)*.995),end=hip.map((x,i)=>x+dir[i]*d);
 let pole=[side,0,0],dot=pole.reduce((n,x,i)=>n+x*dir[i],0),bend=pole.map((x,i)=>x-dot*dir[i]),n=Math.hypot(...bend);
 if(n<1e-6){pole=[0,1,0];dot=pole.reduce((k,x,i)=>k+x*dir[i],0);bend=pole.map((x,i)=>x-dot*dir[i]);n=Math.hypot(...bend);}
 const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along)),knee=hip.map((x,i)=>x+dir[i]*along+bend[i]/n*height);
 return [root,hip,knee,end];
}
export function kwonSwingWindow(phase,plan){const group=(plan.k+(plan.side>0?1:0))%2,u=phase/(Math.PI*2)+group*.5;return u-Math.floor(u)>=KWON_SUPPORT.stance;}
export function kwonStepPoint(from,to,u,height){const t=ease(u);return from.map((v,i)=>v+(to[i]-v)*t+(i===1?Math.sin(Math.PI*t)*height:0));}
function poseBones(L,points,toePitch=0){const {T,pivots,lengths}=L,parent=new T.Quaternion(),absolute=new T.Quaternion(),up=new T.Vector3(0,1,0),dir=new T.Vector3();for(let i=0;i<3;i++){dir.set(...points[i+1]).sub(L.v.set(...points[i])).normalize();absolute.setFromUnitVectors(up,dir);pivots[i].quaternion.copy(parent).invert().multiply(absolute);if(i)pivots[i].position.set(0,lengths[i-1],0);parent.copy(absolute);}L.tip.quaternion.copy(parent).invert().multiply(absolute.setFromUnitVectors(up,dir.set(0,-1,0)));L.tip.quaternion.multiply(L.toeQuat.setFromAxisAngle(L.toeAxis,toePitch));L.solved=points;}
export function buildKwonLeg(T,plan,carapace,joint,clawMat){
 const g=new T.Group();g.name='kwon-articulated-leg-'+plan.index;g.position.set(...plan.root);g.rotation.y=plan.yaw;
 const rest=plan.points.map(v=>[...v]),lengths=rest.slice(1).map((v,i)=>distance(v,rest[i])),pivots=[],radii=[.3,.235,.16,.095];let parent=g;
 for(let i=0;i<3;i++){const pivot=new T.Group();pivot.name='kwon-leg-'+plan.index+'-joint-'+i;parent.add(pivot);const segment=new T.Mesh(new T.CylinderGeometry(radii[i+1],radii[i],lengths[i],14).translate(0,lengths[i]/2,0),carapace);segment.castShadow=true;pivot.add(segment);const ball=new T.Mesh(new T.SphereGeometry(radii[i]*1.1,12,10),joint);ball.castShadow=true;pivot.add(ball);pivots.push(pivot);parent=pivot;}
 const tip=new T.Group();tip.position.y=lengths[2];parent.add(tip);const claw=new T.Mesh(new T.ConeGeometry(.095,.38,8),clawMat);claw.position.y=-.12;claw.castShadow=true;tip.add(claw);
 const L={T,g,plan,baseYaw:plan.yaw,baseY:plan.root[1],rest,lengths,pivots,tip,toeAxis:new T.Vector3(1,0,0),toeQuat:new T.Quaternion(),v:new T.Vector3(),state:null,articulated:true};poseBones(L,rest);return L;
}
export function poseKwonLeg(L,phase,speed){if(!Number.isFinite(phase)||!Number.isFinite(speed))return;L.pending={phase,speed};if(!L.deferKwonLeg)finishKwonLeg(L);}
export function finishKwonLeg(L,point=null,amount=0,grip=false,frozen=false){
 if(!L.pending)return;const {phase,speed}=L.pending;L.g.updateWorldMatrix(true,false);
 const world=p=>L.g.localToWorld(L.v.set(...p)).toArray(),root=L.g.getWorldPosition(L.v).toArray(),normal=world(L.rest[3]);let target=null;
 if(point?.every(Number.isFinite)){L.v.set(...point);target=L.g.parent.localToWorld(L.v).toArray();}
 const nominal=target&&!grip?blendKwonLimbTarget(normal,target,amount):normal;nominal[1]=KWON_SUPPORT.ground;let s=L.state;
 if(!s||phase<s.lastPhase||distance(root,s.root)>6)s=L.state={root,lastPhase:phase,phase:0,anchor:[...nominal],foot:[...nominal],swing:false,gripFrom:null};
 const delta=Math.max(0,phase-s.lastPhase),dt=clamp(delta/(2+clamp(speed,0,14)*1.1),.001,.05);s.lastPhase=phase;if(Number.isFinite(L.gaitPhase))s.phase=L.gaitPhase;else if(!frozen)s.phase+=delta;
 if(grip&&target&&amount>0){s.gripFrom??=[...s.foot];s.swing=false;s.foot=blendKwonLimbTarget(s.gripFrom,target,amount);const local=L.g.worldToLocal(L.v.set(...s.foot)).toArray();poseBones(L,solveKwonLeg(L.rest,local));s.root=root;return;}
 if(s.gripFrom){s.anchor=[...s.foot];s.gripFrom=null;}
 if(s.swing&&s.phase>=s.end){s.anchor=[...s.to];s.swing=false;}
 const error=Math.hypot(nominal[0]-s.anchor[0],nominal[2]-s.anchor[2]),need=speed>.25||error>(amount>0?.45:KWON_SUPPORT.replant);
 if(!frozen&&!s.swing&&need&&kwonSwingWindow(s.phase,L.plan)){const lead=root.map((x,i)=>(x-s.root[i])*.06/dt);lead[1]=0;const d=Math.hypot(...lead),k=d>.35?.35/d:1;s.from=[...s.foot];s.to=nominal.map((x,i)=>i===1?KWON_SUPPORT.ground:x+lead[i]*k);s.begin=s.phase;s.end=s.phase+KWON_SUPPORT.swing*Math.PI*2;s.swing=true;}
 s.foot=s.swing?kwonStepPoint(s.from,s.to,(s.phase-s.begin)/(s.end-s.begin),KWON_SUPPORT.lift+clamp(speed,0,14)*KWON_SUPPORT.liftSpeed):[...s.anchor];s.root=root;
 const local=L.g.worldToLocal(L.v.set(...s.foot)).toArray();
 const stepProgress=s.swing?clamp((s.phase-s.begin)/(s.end-s.begin),0,1):0;
 poseBones(L,solveKwonSupportLeg(L.rest,local),s.swing?Math.sin(Math.PI*stepProgress)*.23:0);
}
export function kwonStanceWeights(standing,reach,detach,dead=false){const unit=v=>Number.isFinite(v)?clamp(v,0,1):0;return {rear:unit(standing),front:dead?1:Math.max(unit(reach),unit(detach))};}
export function blendKwonLimbTarget(from,to,amount){const k=ease(Number.isFinite(amount)?amount:0);return from.map((v,i)=>v+(to[i]-v)*k);}
export function poseKwonLegTarget(L,point,amount){finishKwonLeg(L,point,amount,L.plan.k===0);}
export function advanceKwonGaitClock(clock,raw,frozen=false){if(!Number.isFinite(raw))return clock.phase||0;if(clock.raw===null||raw<clock.raw){clock.raw=raw;clock.phase=0;return 0;}if(!frozen)clock.phase+=Math.max(0,raw-clock.raw);clock.raw=raw;return clock.phase;}
