// All encounters share one projection and one rendering budget on every screen.
export const BATTLE_RESOLUTION=Object.freeze({width:1600,height:900});
export function battleViewportSize(width,height){
 const scale=Math.min(Math.max(1,width)/1600,Math.max(1,height)/900);
 return {width:1600*scale,height:900*scale,left:(width-1600*scale)/2,top:(height-900*scale)/2};
}
const state=new WeakMap();
export function resizeBattleViewport(renderer,camera,canvas){
 const win=canvas.ownerDocument.defaultView,shell=canvas.closest('#arena'),w=win.innerWidth,h=win.innerHeight;
 const previous=state.get(canvas);
 if(previous?.w===w&&previous?.h===h&&previous.camera===camera)return previous.size;
 const size=battleViewportSize(w,h);
 if(shell)Object.assign(shell.style,{width:size.width+'px',height:size.height+'px',minHeight:'0',left:size.left+'px',top:size.top+'px',position:'relative',margin:'0'});
 renderer.setPixelRatio(1);renderer.setSize(1600,900,false);
 camera.aspect=16/9;camera.updateProjectionMatrix();
 state.set(canvas,{w,h,camera,size});return size;
}
