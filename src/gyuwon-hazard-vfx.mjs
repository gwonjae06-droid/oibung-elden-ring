import * as THREE from 'three';
import {bloodHazardFootprint} from './blood-data.mjs';

// The warning is fractured material rising from the *actual* collision footprint.
// No transparent discs, rectangular hitbox decals or separate gameplay timings.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const COLOR=Object.freeze({
 line:0x8498ad,mark:0x98898a,repeat:0xa4988c,choice:0x9b8f70,
 contradiction:0x7e899b,timetable:0x8d8fa0,blank:0xc1b6ab,
 negate:0x65748d,reverse:0x68607a,stop:0x7b7785,
 verdict:0xb19b82,mirror:0xa9c6c9,axiom:0x9297ab,
 paradox:0x976d8a,erasure:0xb6ada9,counterproof:0x7a608d,
 sword:0xa9c3d6,circus:0xb49773,gamble:0xc2a674,chalk:0xc3b8a2
});
// Each phase speaks its own material language, so the player knows where they are at a glance:
// phase one is exam paper (flat standing pages), phase two is proof (slim crossed crystal blades),
// phase three is remembered gold (three-sided ember spires). The same footprint, a different body.
const LANG={};
for(const id of ['line','mark','repeat','choice','contradiction','timetable','blank'])LANG[id]='page';
for(const id of ['negate','reverse','stop','verdict','mirror','axiom','paradox','erasure','counterproof'])LANG[id]='crystal';
for(const id of ['sword','circus','gamble','chalk'])LANG[id]='ember';
// Every pattern has its own motion language. h: fragment height, jitter: tremble while charging
// (stops at impact so the hit lands on the exact footprint), spin: ring/circle turn rate (rad/s),
// pulse: glow beat while charging, snap: how hard the strike pops. Cosmetic only: footprint,
// timing and draw-call count are untouched.
const STYLE=Object.freeze({
 // Phase one - the exam: precise strokes, scribbles and echoes.
 line:{h:1.20,jitter:0,spin:0,pulse:5,snap:.5},
 mark:{h:.90,jitter:.05,spin:0,pulse:9,snap:.4},
 repeat:{h:1.00,jitter:.03,spin:0,pulse:12,snap:.3},
 choice:{h:1.05,jitter:0,spin:0,pulse:4,snap:.6},
 contradiction:{h:1.10,jitter:.06,spin:0,pulse:7,snap:.5},
 timetable:{h:1.25,jitter:0,spin:0,pulse:3,snap:.5},
 blank:{h:.70,jitter:0,spin:.8,pulse:2,snap:1.0},
 // Phase two - proof and refutation.
 negate:{h:1.00,jitter:.05,spin:0,pulse:8,snap:.5},
 reverse:{h:1.05,jitter:0,spin:-1.2,pulse:3,snap:.5},
 stop:{h:1.45,jitter:0,spin:0,pulse:1.5,snap:.2},
 verdict:{h:1.50,jitter:0,spin:0,pulse:3,snap:.9},
 mirror:{h:1.20,jitter:.02,spin:0,pulse:6,snap:.6},
 axiom:{h:1.00,jitter:0,spin:1.5,pulse:4,snap:.7},
 paradox:{h:1.10,jitter:.05,spin:-2.0,pulse:10,snap:.7},
 erasure:{h:.80,jitter:.03,spin:0,pulse:11,snap:1.0},
 counterproof:{h:1.30,jitter:0,spin:2.0,pulse:5,snap:.8},
 // Phase three - remembered giants.
 sword:{h:2.00,jitter:0,spin:0,pulse:3,snap:1.2},
 circus:{h:1.10,jitter:.08,spin:0,pulse:8,snap:.6},
 gamble:{h:1.00,jitter:0,spin:1.0,pulse:6,snap:.7},
 chalk:{h:.90,jitter:.03,spin:0,pulse:5,snap:.5}
});
const STYLE_DEFAULT=Object.freeze({h:1,jitter:0,spin:0,pulse:5,snap:.5});
const WHITE=new THREE.Color(0xffffff),TMP=new THREE.Color(),GOLD=new THREE.Color(0xd09a2a);
// Readability: phase three and the white half of phase two sit on a white backdrop, so pale tones
// vanish. There the fragments are deepened (and phase three is pulled toward gold) instead of lightened.
function tone(pattern,bright,phase){
 TMP.setHex(COLOR[pattern]||0x9c9ca5);
 if(phase===3)TMP.lerp(GOLD,.55);
 if(bright)TMP.multiplyScalar(.6);
 return TMP;
}
// White space RECORDS a proof as graphite pencil lines on white paper; the dark space REALIZES it as
// bright violet ink fractures that glow against the black.
const PREVIEW_COLOR=0xe6e1d4,GRAPHITE=0x5d6675,INK_COLOR=0x6a4fb0,INK_GLOW=0xb28cff;
// Erased wrong answers: after a wrong-answer note is struck, a pale trace lingers and flickers
// where it was, hinting that the question will be asked again. Never a live threat: flat and dim.
const GHOST_COLOR=0xb8b2a6,GHOST_LIFE=3;
// The cleave slides the tsunami's safe corridor. Deep teal fractures rise along the TARGET corridor's
// two edges (the real safe half-width, opening-.55) before the slide begins, so the player can read where to go.
const CORRIDOR_COLOR=0x1f8f88,CORRIDOR_HALF=2.65,CORRIDOR_LENGTH=30;
export const gyuwonHazardFootprint=h=>h?.shape==='wave'?null:bloodHazardFootprint(h);

// Every fragment is upright and irregular. Its base touches the floor and its tip rises BEFORE the
// hit, like lifting stone, pages or broken glass. lang picks the body: page, crystal, ember or plain.
// Each visible hazard boundary is made from ROUND-TOPPED solid fragments,
// never single triangular planes or tapered three-sided spires.
// The rock's 8/10-sided perimeter consists of flat quadrilateral side faces
// and horizontal caps; triangulation is solely an internal GPU representation.
// The centers are sampled from exactly the authoritative collision footprint.
function fragments(h,f,coarse=false,lang='plain'){
 const points=[],sides=coarse?8:10;
 const add=(x,z,tx,tz,i,variation=0)=>{
  const radius=(coarse?.20:.24)+(i%4)*.038;
  const height=.33+(i%7)*.13+variation;
  const elongate=lang==='page'?1.85:lang==='crystal'?1.18:1.0;
  const width=lang==='page'?.48:lang==='ember'?1.13:1.0;
  const topWidth=lang==='page'?.88:.73;
  const y0=.025,top=y0+height*(lang==='crystal'?1.3:1);
  const firstAngle=Math.atan2(tz,tx);
  const point=(k,y,taper)=>{
   const angle=firstAngle+2*Math.PI*k/sides;
   const forward=Math.cos(angle)*radius*elongate*taper;
   const aside=Math.sin(angle)*radius*width*taper;
   return [x+tx*forward-tz*aside,y,z+tz*forward+tx*aside];
  };
  // Openly rectangular/rounded natural stone silhouette, not a triangular cue.
  const centreBottom=[x,y0,z],centreTop=[x,top,z];
  for(let j=0;j<sides;j++){
   const a=point(j,y0,1),b=point(j+1,y0,1),
    c=point(j,top,topWidth),d=point(j+1,top,topWidth);
   points.push(...a,...b,...c,...b,...d,...c);
   points.push(...centreBottom,...b,...a);
   points.push(...centreTop,...c,...d);
  }
 };
 if(f.kind===1||f.kind===2){
  const rings=f.kind===2?[Math.max(.12,f.r-f.halfWidth),f.r+f.halfWidth]:[f.r];
  const count=coarse?10:16;
  rings.forEach((r,k)=>{for(let i=0;i<count;i++){
   const a=(i+(k?.42:0))*Math.PI*2/count;
   add(Math.sin(a)*r,Math.cos(a)*r,Math.cos(a),-Math.sin(a),i+k*3,k*.09);
  }});
 }else if(f.kind===3){
  const length=Math.max(.1,f.halfLength),count=coarse?9:15;
  for(const side of [-1,1])for(let i=0;i<count;i++){
   const z=-length+2*length*(i+.35)/(count+.7);
   add(side*f.halfWidth,z,0,1,i+(side+1)*13,.07);
  }
  for(const side of [-1,1])for(let j=0;j<5;j++){
   const x=-f.halfWidth+2*f.halfWidth*(j+.4)/5;
   add(x,side*length,1,0,j+(side+1)*4,.03);
  }
 }else if(f.kind===4){
  // Curved smoke attacks still reference the actual sector boundaries, but
  // this renderer draws only natural rock fragments, never a sector surface.
  const count=coarse?10:18,r=Math.max(.2,f.r);
  for(let i=0;i<=count;i++){
   const a=-f.arc+2*f.arc*i/count;
   add(Math.sin(a)*r,Math.cos(a)*r,Math.cos(a),-Math.sin(a),i,.15);
  }
  for(const side of [-1,1])for(let j=0;j<9;j++){
   const rj=f.inner+(r-f.inner)*(j+.4)/9,a=side*f.arc;
   add(Math.sin(a)*rj,Math.cos(a)*rj,Math.cos(a),-Math.sin(a),j+15,.04);
  }
 }
 return new Float32Array(points);
}
export function createGyuwonHazardFx(stage,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-physical-rupture-cues';stage.add(root);
 const states=new Map(),ghosts=new Map(),corridors=new Map();let disposed=false,owner=null,lastCasts=0;
 function release(s){
  root.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();
 }
 function clearGhosts(){for(const s of ghosts.values())release(s);ghosts.clear();}
 function clearCorridors(){for(const s of corridors.values())release(s);corridors.clear();}
 function clear(){for(const s of states.values())release(s);states.clear();clearGhosts();clearCorridors();}
 function make(h,f,pattern){
  const lang=LANG[pattern]||'plain';
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(fragments(h,f,coarse,lang),3));
  geo.computeVertexNormals();
  geo.userData.silhouette='capped-rounded-stone-no-triangle-warnings';
  const material=new THREE.MeshPhysicalMaterial({
   color:COLOR[pattern]||0x9c9ca5,roughness:.62,metalness:.14,
   emissive:COLOR[pattern]||0x9c9ca5,emissiveIntensity:.12,
   side:THREE.DoubleSide,transparent:true,opacity:.32,depthWrite:false
  });
  const mesh=new THREE.Mesh(geo,material);mesh.name='gyuwon-hazard-fractured-material';
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData.visualOnly=true;root.add(mesh);
  return {mesh,r:f.r,pattern,lang};
 }
 function makeCorridor(h){
  const f={kind:3,halfWidth:CORRIDOR_HALF,halfLength:CORRIDOR_LENGTH,x:h.gapTarget,z:0,yaw:0};
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(fragments(h,f,coarse,'crystal'),3));
  geo.computeVertexNormals();
  geo.userData.silhouette='capped-rounded-stone-no-triangle-warnings';
  const material=new THREE.MeshPhysicalMaterial({
   color:CORRIDOR_COLOR,roughness:.6,metalness:.1,emissive:CORRIDOR_COLOR,emissiveIntensity:.12,
   side:THREE.DoubleSide,transparent:true,opacity:.1,depthWrite:false
  });
  const mesh=new THREE.Mesh(geo,material);mesh.name='gyuwon-tsunami-corridor-cue';
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData.visualOnly=true;root.add(mesh);
  return {mesh};
 }
 function update(g){
  if(disposed)return;
  const active=g?.status==='playing',s=g?.gyuwon,b=g?.boss;
  if(owner!==g){owner=g;lastCasts=0;clearGhosts();clearCorridors();}
  // A new cast takes over from any lingering trace; leaving phase one or ending also clears them.
  if(!active||!s||!b||b.phase!==1||s.casts!==lastCasts){clearGhosts();lastCasts=s?.casts||0;}
  const live=new Set(),liveCorridors=new Set();
  const bright=!!(active&&s&&b&&(b.phase===3||(b.phase===2&&s.space==='white')));
  if(active&&s&&b?.state==='pattern')for(const h of s.hazards||[]){
   if(h.shape==='wave'){
    // The actual tsunami surface is rendered by the memory stage; only its corridor cue is drawn here.
    if(h.gapTarget!==undefined){
     liveCorridors.add(h.id);
     let c=corridors.get(h.id);
     if(!c){c=makeCorridor(h);corridors.set(h.id,c);}
     const lead=smooth(clamp(h.age/Math.max(.01,h.shiftAt))),fade=1-clamp((h.age-5.9)/.6);
     c.mesh.position.set(h.gapTarget,.005,0);
     c.mesh.scale.y=.35+.65*lead;
     c.mesh.material.opacity=(.14+.42*lead)*fade;
     c.mesh.material.emissiveIntensity=.16+.26*lead;
    }
    continue;
   }
   const f=gyuwonHazardFootprint(h);if(!f)continue;
   live.add(h.id);
   let state=states.get(h.id);
   if(!state){state=make(h,f,s.pattern);states.set(h.id,state);}
   const mesh=state.mesh;
   // Expanding ring crests follow the same time-varying footprint as damage.
   if(f.kind===2&&Math.abs(f.r-state.r)>.09){
    const values=fragments(h,f,coarse,state.lang),attr=mesh.geometry.getAttribute('position');
    if(values.length===attr.array.length){
     attr.array.set(values);attr.needsUpdate=true;
     mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
    }
    state.r=f.r;
   }
   const charge=clamp(h.age/Math.max(.01,h.warn)),hit=h.age>=h.warn;
   const impact=hit?smooth((h.age-h.warn)/Math.max(.08,h.life)):0;
   const strength=smooth(charge),flash=hit?1-impact:0;
   const st=STYLE[s.pattern]||STYLE_DEFAULT,round=f.kind===1||f.kind===2;
   // Tremble while charging only; at impact the fragments sit exactly on the real footprint.
   const jit=hit?0:st.jitter*strength;
   mesh.position.set(f.x+jit*Math.sin(g.time*41+h.id*1.7),.005,f.z+jit*Math.cos(g.time*37+h.id*2.3));
   mesh.rotation.y=(f.kind===3||f.kind===4?f.yaw:0)+(round?st.spin*h.age:0);
   const beat=hit?0:.07*Math.sin(h.age*st.pulse*2)*strength;
   // Fragments rise visibly BEFORE impact, rather than appearing as a faint
   // near-flat decal. Preserve authored footprint, timing and draw-call count.
   const mat=mesh.material,gain=bright?1.6:1;
   if(h.preview){
    // White space: graphite pencil lines recording a proof on white paper. Never a live threat.
    mesh.scale.y=(.30+.55*strength)*(.55+.45*st.h);
    mat.opacity=Math.min(1,(hit?.16+.14*flash:.20+.30*strength)*(bright?1.5:1));
    mat.emissiveIntensity=.06+.10*strength+beat*.5;
    mat.color.setHex(bright?GRAPHITE:PREVIEW_COLOR);mat.emissive.setHex(bright?GRAPHITE:PREVIEW_COLOR);
   }else if(h.inkFinger){
    // Dark space: the recorded proof becomes real. Violet ink fractures climb higher and glow on impact.
    mesh.scale.y=(.55+1.0*strength+.45*flash)*(.7+.3*st.h);
    mat.opacity=Math.min(1,.40+.38*strength+.25*flash);
    mat.emissiveIntensity=.30+.34*strength+.60*flash+beat;
    mat.color.setHex(INK_COLOR);mat.emissive.setHex(INK_GLOW);
    mesh.position.y=.005+flash*.05;
   }else{
    mesh.scale.y=(.42+.82*strength)*st.h+(.18+.4*st.snap)*flash;
    mat.opacity=Math.min(1,(.32+.35*strength+(hit?.10*(1-impact):0))*(bright?1.25:1));
    mat.emissiveIntensity=(.12+.13*strength+beat+.25*st.snap*flash)*gain;
    tone(s.pattern,bright,b.phase);
    mat.color.copy(TMP);mat.emissive.copy(TMP);
    if(!bright)mat.color.lerp(WHITE,.35*flash);
   }
  }
  for(const [id,c] of corridors)if(!liveCorridors.has(id)){release(c);corridors.delete(id);}
  for(const [id,state]of states)if(!live.has(id)){
   states.delete(id);
   if(active&&b?.phase===1&&state.pattern==='mark'){state.t0=g.time;ghosts.set(id,state);}
   else release(state);
  }
  for(const [id,state]of ghosts){
   const age=g.time-state.t0;
   if(!(age>=0&&age<GHOST_LIFE)){release(state);ghosts.delete(id);continue;}
   const mat=state.mesh.material,fade=1-age/GHOST_LIFE,flick=.65+.35*Math.max(0,Math.sin(age*7+id));
   state.mesh.scale.y=.28;
   mat.opacity=.22*fade*flick;mat.emissiveIntensity=.04;
   mat.color.setHex(GHOST_COLOR);mat.emissive.setHex(GHOST_COLOR);
  }
 }
 function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);}
 return {root,update,clear,dispose,stats:()=>({liveHazards:states.size,ghostTraces:ghosts.size,damageSources:0,drawCalls:states.size})};
}
