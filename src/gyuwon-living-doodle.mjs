import * as THREE from 'three';

// Act V alone takes place inside a living hand-drawn theatrical illustration.
// Keep Three.js as the animation/hit-test authority. Only the WORLD render is
// stylized; HTML captions, controls, target selection and HP remain sharp.
export const isGyuwonLivingDoodleAct=m=>Boolean(m?.reference&&m.year===5&&!m.finishing);
export const gyuwonDoodleDrawingAt=(time,reducedMotion=false)=>reducedMotion?0:Math.floor(Math.max(0,Number.isFinite(time)?time:0)*8)%2;

// The world's detailed meshes become two subtly different ink renderings.
// A/B line shifts change only at eight intervals each second while the source
// model continues moving and the battle simulation remains at normal FPS.
// Unlike a global CSS filter, this extracts local contours and simplifies
// the interior painted planes in a dedicated WebGL post-process.
const vertexShader=`
varying vec2 vUv;
void main(){
 vUv=uv;
 gl_Position=vec4(position.xy,0.0,1.0);
}
`;
const fragmentShader=`
precision highp float;
uniform sampler2D tStage;
uniform vec2 uResolution;
uniform float uDrawing;
uniform float uStrength;
varying vec2 vUv;

float brightness(vec3 c){return dot(c,vec3(.299,.587,.114));}
float sketchHash(vec2 p){
 p=fract(p*vec2(.1031,.1030));
 p+=dot(p,p.yx+33.33);
 return fract((p.x+p.y)*p.x);
}
void main(){
 vec2 px=1.0/max(uResolution,vec2(1.0));
 vec3 original=texture2D(tStage,vUv).rgb;

 // Stable A/B contour redraws: the geometry and collision location do not
 // jump. Only the sketched edge stencil receives the short hand-drawn wobble.
 float signFrame=uDrawing<.5?1.0:-1.0;
 vec2 lineWiggle=vec2(
   sin(vUv.y*147.0+signFrame*1.6)+.4*sin(vUv.y*52.0-signFrame*2.1),
   cos(vUv.x*127.0-signFrame*1.8)+.3*sin(vUv.x*75.0+signFrame));
 vec2 at=clamp(vUv+lineWiggle*px*(.55*uStrength),px,vec2(1.0)-px);
 vec3 center=texture2D(tStage,at).rgb;
 float centerLight=brightness(center);
 float ex=abs(brightness(texture2D(tStage,at+vec2(px.x,0.0)).rgb)
              -brightness(texture2D(tStage,at-vec2(px.x,0.0)).rgb));
 float ey=abs(brightness(texture2D(tStage,at+vec2(0.0,px.y)).rgb)
              -brightness(texture2D(tStage,at-vec2(0.0,px.y)).rgb));
 float contour=ex+ey;
 float boldEdge=smoothstep(.09,.27,contour);
 float pencilEdge=smoothstep(.035,.115,contour)*.43;
 float ink=min(1.0,boldEdge*.85+pencilEdge);
 // A thin, deliberately non-identical second stroke resembles two nearby
 // redraws, but never relocates the gameplay hitbox.
 float ghost=abs(brightness(texture2D(tStage,at+lineWiggle*px*.5).rgb)-centerLight);
 ink=max(ink,smoothstep(.055,.16,ghost)*.15);

 vec3 inkColor=vec3(.065,.061,.073);
 vec3 warmPaper=vec3(.963,.930,.864);
 // Reduce physically based gradients to a painted, partly colored storyboard.
 vec3 wash=floor(clamp(original,0.0,1.0)*5.0+.5)/5.0;
 float gray=brightness(wash);
 vec3 handPaint=mix(vec3(gray),wash,.70);
 vec3 painted=mix(warmPaper,handPaint,.68);
 painted=mix(painted,warmPaper,.13*uStrength);
 // Static paper fiber and diagonal pencil shading in dark areas: neither
 // changes with time, so the screen does not shimmer like TV grain.
 float fiber=sketchHash(floor(gl_FragCoord.xy/3.5));
 painted+=vec3((fiber-.5)*.020);
 float hatch=(1.0-smoothstep(.10,.57,centerLight))
      *smoothstep(.82,1.0,sin((gl_FragCoord.x+gl_FragCoord.y)*.36));
 painted=mix(painted,inkColor,.060*hatch*uStrength);
 vec3 done=mix(painted,inkColor,min(.95,ink*uStrength));
 gl_FragColor=vec4(clamp(done,0.0,1.0),1.0);
 #include <colorspace_fragment>
}
`;

export function createGyuwonLivingDoodle(renderer,{coarse=false,reducedMotion=false}={}){
 const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
 target.texture.name='gyuwon-act-five-doodle-world';
 target.texture.colorSpace=THREE.SRGBColorSpace;
 target.texture.generateMipmaps=false;
 const uniforms={
  tStage:{value:target.texture},uResolution:{value:new THREE.Vector2(1,1)},
  uDrawing:{value:0},uStrength:{value:coarse?.88:1}
 };
 const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,
  depthTest:false,depthWrite:false,toneMapped:false});
 const geometry=new THREE.PlaneGeometry(2,2);
 const quad=new THREE.Mesh(geometry,material);
 quad.frustumCulled=false;
 const outputScene=new THREE.Scene();outputScene.add(quad);
 const outputCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const dims=new THREE.Vector2();
 let width=0,height=0,disposed=false,broken=false;
 function render(scene,camera,{active=false,time=0}={}){
  if(disposed)return false;
  if(!active||broken){renderer.render(scene,camera);return false;}
  const originalTarget=renderer.getRenderTarget();
  try{
   renderer.getDrawingBufferSize(dims);
   const w=Math.max(1,Math.floor(dims.x)),h=Math.max(1,Math.floor(dims.y));
   if(w!==width||h!==height){
    width=w;height=h;target.setSize(w,h);
    uniforms.uResolution.value.set(w,h);
   }
   uniforms.uDrawing.value=gyuwonDoodleDrawingAt(time,reducedMotion);
   renderer.setRenderTarget(target);
   renderer.render(scene,camera);
   renderer.setRenderTarget(originalTarget);
   renderer.render(outputScene,outputCamera);
   return true;
  }catch(error){
   // A shader/platform failure must never prevent completing a 3-minute song.
   broken=true;
   console.warn('Gyuwon Act V doodle effect unavailable; original stage restored',error);
   renderer.setRenderTarget(originalTarget);
   renderer.render(scene,camera);
   return false;
  }
 }
 function prewarm(){
  if(disposed)return;
  // Compilation here prevents a first-use shader hitch during the opening.
  renderer.compile?.(outputScene,outputCamera);
 }
 function dispose(){
  if(disposed)return;disposed=true;
  outputScene.remove(quad);
  geometry.dispose();material.dispose();target.dispose();
 }
 return {render,prewarm,dispose,
  stats:()=>({active:!broken&&!disposed,width,height,frame:uniforms.uDrawing.value,kind:'act5-world-ink-ab'})};
}
