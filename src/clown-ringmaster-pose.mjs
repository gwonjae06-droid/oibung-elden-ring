// One restrained performance vocabulary for the visual rig and its hurtboxes.
// Never drive combat timings or health from smoothing / animation frames.
import {cartoonPose} from './clown-cartoon.mjs';
import {clownSpectaclePose} from './clown-spectacle-pose.mjs';
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,finite(v,1)));
export function ringmasterPerformance(g){
 const c=g?.clown||{},b=g?.boss||{},active=g?.status==='playing'&&b.state!=='transition'&&c.state==='pattern';
 const a=clownSpectaclePose(g,cartoonPose(c.name,c.pt,b.phase,active));
 return {...a,
  bodyX:clamp(a.bodyX,.84,1.28),bodyY:clamp(a.bodyY,.87,1.20),
  bodyZ:clamp(a.bodyZ,.84,1.24),headScale:clamp(a.headScale||1,.83,1.24),
  lift:clamp(a.lift||0,0,2.4),arms:clamp(a.arms||1,.8,2.0),
  glove:clamp(a.glove||1,.8,1.5),lean:clamp(a.lean||0,-.55,.55),
  twist:clamp(a.twist||0,-.8,.8),shoe:clamp(a.shoe||1,.83,1.32)};
}
export function ringmasterGesture(g){
 const c=g?.clown||{},name=c.name||'',stage=c.horrorStage||1,t=finite(c.pt);
 const conducting=/choir|Chorus|choral|finale|Finale|conductor|orchestra|choirOf/i.test(name);
 const puppets=/puppet|marionette|funeral|strings|procession/i.test(name);
 const flames=/hoop|fire|infernal|cinder/i.test(name);
 const phantom=/twin|ghost|double|vanishing/i.test(name);
 const active=g?.status==='playing'&&c.state==='pattern';
 const pulse=active?Math.min(1,t/.65)*Math.max(0,Math.min(1,(8-t)/.9)):0;
 return {conducting,puppets,flames,phantom,stage,
  director:pulse*(conducting?1:puppets?.8:flames?.7:phantom?.55:0),
  offBeat:active?Math.sin(t*(stage===3?7:4.1)):0};
}
