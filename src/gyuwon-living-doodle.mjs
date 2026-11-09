import * as THREE from 'three';

// Every Gyuwon act shares the colored hand-drawn world, including 2D frames.
// Keep Three.js as the animation/hit-test authority. Only the WORLD render is
// stylized; HTML captions, controls, target selection and HP remain sharp.
export const isGyuwonLivingDoodleAct=m=>Boolean(m&&m.year>=1);
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
uniform float uCompositeAlpha;
varying vec2 vUv;

float brightness(vec3 c){return dot(c,vec3(.299,.587,.114));}
float sketchHash(vec2 p){
 p=fract(p*vec2(.1031,.1030));
 p+=dot(p,p.yx+33.33);
 return fract((p.x+p.y)*p.x);
}
void main(){
 vec2 px=1.0/max(uResolution,vec2(1.0));
 vec4 sourcePixel=texture2D(tStage,vUv);
 if(sourcePixel.a>.45&&sourcePixel.a<.55){gl_FragColor=vec4(sourcePixel.rgb,uCompositeAlpha);
  #include <colorspace_fragment>
  return;
 }
 vec3 original=sourcePixel.rgb;

 // Stable A/B contour redraws: the geometry and collision location do not
 // jump. Only the sketched edge stencil receives the short hand-drawn wobble.
 float signFrame=uDrawing<.5?1.0:-1.0;
 vec2 lineWiggle=vec2(
   sin(vUv.y*147.0+signFrame*1.6)+.4*sin(vUv.y*52.0-signFrame*2.1),
   cos(vUv.x*127.0-signFrame*1.8)+.3*sin(vUv.x*75.0+signFrame));
 vec2 at=clamp(vUv+lineWiggle*px*(.55*uStrength),px,vec2(1.0)-px);
 // Three texture lookups per output pixel (rather than seven), so the
 // entire three-minute stage stays responsive on software WebGL and mobile.
 // The A/B offset affects only contour sampling, never the actual fill pixels.
 float centerLight=brightness(original);
 float ex=abs(brightness(texture2D(tStage,at+vec2(px.x,0.0)).rgb)-centerLight);
 float ey=abs(brightness(texture2D(tStage,at+vec2(0.0,px.y)).rgb)-centerLight);
 float contour=ex+ey;
 float boldEdge=smoothstep(.062,.19,contour);
 float pencilEdge=smoothstep(.018,.095,contour)*.43;
 float ink=min(1.0,boldEdge*.88+pencilEdge);

 vec3 inkColor=vec3(.065,.061,.073);
 vec3 warmPaper=vec3(.963,.930,.864);
 // Reduce physically based gradients to a painted, partly colored storyboard.
 vec3 wash=mix(original,floor(clamp(original,0.0,1.0)*8.0+.5)/8.0,.25);
 float gray=brightness(wash);
 vec3 handPaint=mix(vec3(gray),wash,1.12);
 // Keep dark coats dark and preserve each model's pigment. Paper belongs
 // to a faint surface grain, not an opaque white layer over the entire world.
 vec3 painted=clamp(handPaint*1.05+warmPaper*.008,0.0,1.0);
 // Static paper fiber and diagonal pencil shading in dark areas: neither
 // changes with time, so the screen does not shimmer like TV grain.
 float fiber=sketchHash(floor(gl_FragCoord.xy/3.5));
 painted+=vec3((fiber-.5)*.006);
 float hatch=(1.0-smoothstep(.10,.57,centerLight))
      *smoothstep(.82,1.0,sin((gl_FragCoord.x+gl_FragCoord.y)*.36));
 painted=mix(painted,inkColor,.060*hatch*uStrength);
 vec3 done=mix(painted,inkColor,min(.95,ink*uStrength));
 gl_FragColor=vec4(clamp(done,0.0,1.0),uCompositeAlpha);
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
  uDrawing:{value:0},uStrength:{value:coarse?.88:1},uCompositeAlpha:{value:1}
 };
 const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,
  depthTest:false,depthWrite:false,toneMapped:false});
 const geometry=new THREE.PlaneGeometry(2,2);
 const quad=new THREE.Mesh(geometry,material);
 quad.frustumCulled=false;
 const outputScene=new THREE.Scene();outputScene.add(quad);
 const outputCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const dims=new THREE.Vector2();
 let width=0,height=0,disposed=false,broken=false,lastApplied=false,worldCalls=0,worldTriangles=0,canvasTexture=null,canvasSource=null,source='world';
 function render(scene,camera,{active=false,time=0}={}){
  if(disposed)return false;
  lastApplied=false;
  source='world';
  if(!active||broken){renderer.render(scene,camera);return false;}
  const originalTarget=renderer.getRenderTarget();
  try{
   renderer.getDrawingBufferSize(dims);
   const w=Math.max(1,Math.floor(dims.x)),h=Math.max(1,Math.floor(dims.y));
   if(w!==target.width||h!==target.height){
    width=w;height=h;target.setSize(w,h);
    uniforms.uResolution.value.set(w,h);
   }
   uniforms.uDrawing.value=gyuwonDoodleDrawingAt(time,reducedMotion);
   renderer.setRenderTarget(target);
   renderer.render(scene,camera);
   worldCalls=renderer.info?.render?.calls||0;worldTriangles=renderer.info?.render?.triangles||0;
   renderer.setRenderTarget(originalTarget);
   renderer.render(outputScene,outputCamera);
   lastApplied=true;
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
 function renderCanvas(canvas,{time=0,opacity=1}={}){
  if(disposed||broken)return false;
  const clear=renderer.autoClear;
  try{
   if(canvasSource!==canvas){canvasTexture?.dispose();canvasSource=canvas;canvasTexture=new THREE.CanvasTexture(canvas);canvasTexture.colorSpace=THREE.SRGBColorSpace;canvasTexture.generateMipmaps=false;canvasTexture.minFilter=THREE.LinearFilter;}
   canvasTexture.needsUpdate=true;renderer.getDrawingBufferSize(dims);uniforms.uResolution.value.copy(dims);width=dims.x;height=dims.y;
   uniforms.tStage.value=canvasTexture;uniforms.uDrawing.value=gyuwonDoodleDrawingAt(time,reducedMotion);uniforms.uCompositeAlpha.value=opacity;
   material.transparent=true;renderer.autoClear=false;renderer.render(outputScene,outputCamera);
   lastApplied=true;source='canvas2d';worldCalls=1;worldTriangles=2;return true;
  }catch(error){console.warn('Gyuwon canvas ink unavailable; native 2D restored',error);return false;}
  finally{renderer.autoClear=clear;material.transparent=false;uniforms.uCompositeAlpha.value=1;uniforms.tStage.value=target.texture;}
 }
 function suspend(){lastApplied=false;}
 function prewarm(){
  if(disposed)return;
  // Compilation here prevents a first-use shader hitch during the opening.
  renderer.compile?.(outputScene,outputCamera);
 }
 function dispose(){
  if(disposed)return;disposed=true;
  outputScene.remove(quad);
  geometry.dispose();material.dispose();target.dispose();
  canvasTexture?.dispose();canvasSource=null;
 }
 return {render,renderCanvas,suspend,prewarm,dispose,
  stats:()=>({active:!broken&&!disposed,applied:lastApplied,width,height,frame:uniforms.uDrawing.value,kind:'gyuwon-colored-ink-ab',source,worldCalls,worldTriangles})};
}
