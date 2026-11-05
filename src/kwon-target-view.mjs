const finitePoint=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
export function kwonLockFocus(player,target){if(!finitePoint(player)||!finitePoint(target))return null;const d=Math.hypot(target.x-player.x,target.z-player.z),k=Math.max(0,Math.min(.45,d*.12));return {x:player.x+(target.x-player.x)*k,y:player.y+1.6+(target.y-player.y-1.6)*.45,z:player.z+(target.z-player.z)*k};}
export function kwonReticlePoint(p,width,height){if(!finitePoint(p)||!(width>0)||!(height>0)||!Number.isFinite(width)||!Number.isFinite(height)||Math.abs(p.z)>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return null;return {x:(p.x*.5+.5)*width-6,y:(-.5*p.y+.5)*height-6};}
// The arena is the ONLY camera owner. This is a pure world-to-screen reticle
// presenter; it never rewrites the camera during Three.js' render traversal.
export function createKwonTargetView(T,B,torso,host){
 const reticle=host?.querySelector?.('#reticle')||host?.ownerDocument?.getElementById?.('reticle');
 const world=new T.Vector3(),screen=new T.Vector3();
 let boss=null,disposed=false;
 function project(camera,locked,canvas){
  if(!reticle)return null;
  if(disposed||!locked||!boss||boss.state==='dead'||!camera?.isPerspectiveCamera){
   reticle.hidden=true;return null;
  }
  const local=torso.point({x:0,y:2.25,z:1.4},'chest');
  world.set(local.x,local.y,local.z);
  B.model.localToWorld(world);
  // Project after the arena finishes positioning AND orienting the camera.
  // No lookAt here: changing it during WebGL rendering breaks frustum culling.
  camera.updateMatrixWorld(true);
  screen.copy(world).project(camera);
  const width=canvas?.clientWidth||canvas?.width||0;
  const height=canvas?.clientHeight||canvas?.height||0;
  const p=kwonReticlePoint(screen,width,height);
  reticle.hidden=!p;
  if(p){reticle.style.left=p.x+'px';reticle.style.top=p.y+'px';}
  return p;
 }
 function dispose(){if(disposed)return;disposed=true;boss=null;if(reticle)reticle.hidden=true;}
 return {update(b){boss=b;},project,dispose};
}
