const finitePoint=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
export function kwonLockFocus(player,target){if(!finitePoint(player)||!finitePoint(target))return null;const d=Math.hypot(target.x-player.x,target.z-player.z),k=Math.max(0,Math.min(.45,d*.12));return {x:player.x+(target.x-player.x)*k,y:player.y+1.6+(target.y-player.y-1.6)*.45,z:player.z+(target.z-player.z)*k};}
export function kwonReticlePoint(p,width,height){if(!finitePoint(p)||!(width>0)||!(height>0)||!Number.isFinite(width)||!Number.isFinite(height)||Math.abs(p.z)>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return null;return {x:(p.x*.5+.5)*width-6,y:(-.5*p.y+.5)*height-6};}
export function createKwonTargetView(T,B,torso,host){
 let scene=B.root;while(scene.parent)scene=scene.parent;
 if(!scene.isScene)return {update(){},dispose(){}};
 const reticle=host?.querySelector?.('#reticle')||host?.ownerDocument?.getElementById?.('reticle'),previous=scene.onBeforeRender,world=new T.Vector3(),playerPoint=new T.Vector3(),screen=new T.Vector3();let boss=null,disposed=false;
 function render(...args){
  if(typeof previous==='function')previous.apply(this,args);
  const [renderer,,camera]=args;if(disposed||!boss||boss.state==='dead'||!reticle||reticle.hidden||!camera?.isPerspectiveCamera)return;
  const player=scene.getObjectByName('player');if(!player)return;
  const local=torso.point({x:0,y:2.25,z:1.4},'chest');world.set(local.x,local.y,local.z);B.model.localToWorld(world);player.getWorldPosition(playerPoint);
  const focus=kwonLockFocus(playerPoint,world);if(!focus)return;
  camera.lookAt(focus.x,focus.y,focus.z);camera.updateMatrixWorld(true);screen.copy(world).project(camera);
  const canvas=renderer.domElement,p=kwonReticlePoint(screen,canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height);reticle.hidden=!p;
  if(p){reticle.style.left=p.x+'px';reticle.style.top=p.y+'px';}
 }
 function dispose(){if(disposed)return;disposed=true;boss=null;if(scene.onBeforeRender===render)scene.onBeforeRender=previous;B.boneMat.removeEventListener('dispose',dispose);}
 scene.onBeforeRender=render;B.boneMat.addEventListener('dispose',dispose);
 return {update(b){boss=b;},dispose};
}
