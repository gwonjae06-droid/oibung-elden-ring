// All encounters share one projection and one rendering budget on every screen.
export const BATTLE_RESOLUTION=Object.freeze({width:1600,height:900});
export function battleViewportSize(width,height){
 const scale=Math.min(Math.max(1,width)/1600,Math.max(1,height)/900);
 return {width:1600*scale,height:900*scale,left:(width-1600*scale)/2,top:(height-900*scale)/2};
}
const state=new WeakMap();
export function resizeBattleViewport(renderer,camera,canvas,renderScale=1){
 const win=canvas.ownerDocument.defaultView,shell=canvas.closest('#arena'),w=win.innerWidth,h=win.innerHeight;
 const quality=Number.isFinite(renderScale)?Math.max(.6,Math.min(1,renderScale)):1;
 // Do not shade 1600x900 pixels on a smaller physical viewport. This was
 // wasting fill-rate on 1280x720 browsers and software WebGL smoke tests.
 const viewportScale=Math.max(.5,Math.min(1,w/1600,h/900));
 const scale=Math.min(quality,viewportScale);
 const previous=state.get(canvas);
 if(previous?.w===w&&previous?.h===h&&previous.camera===camera&&previous.scale===scale)return previous.size;
 const size=battleViewportSize(w,h);
 if(shell)Object.assign(shell.style,{width:size.width+'px',height:size.height+'px',minHeight:'0',left:size.left+'px',top:size.top+'px',position:'relative',margin:'0'});
 renderer.setPixelRatio(1);
 // Reduce fill rate without moving the CSS viewport, HUD or mouse coordinates.
 renderer.setSize(Math.round(1600*scale),Math.round(900*scale),false);
 camera.aspect=16/9;camera.updateProjectionMatrix();
 state.set(canvas,{w,h,camera,scale,size});return size;
}
