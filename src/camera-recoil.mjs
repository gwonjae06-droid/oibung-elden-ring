const finite=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
const same=(a,b)=>finite(a)&&finite(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9&&Math.abs(a.z-b.z)<1e-9;
const put=(a,b)=>{a.x=b.x;a.y=b.y;a.z=b.z;};
export function createCameraRecoil(){
 let camera=null,base=null,applied=null;
 function restore(){if(camera&&same(camera.position,applied)){put(camera.position,base);camera.updateMatrixWorld?.(true);}camera=null;base=applied=null;}
 function apply(next,offset){restore();if(!finite(next?.position)||!finite(offset))return false;if(!offset.x&&!offset.y&&!offset.z)return false;camera=next;base={x:next.position.x,y:next.position.y,z:next.position.z};applied={x:base.x+offset.x,y:base.y+offset.y,z:base.z+offset.z};put(next.position,applied);next.updateMatrixWorld?.(true);return true;}
 return {apply,restore,reset:restore,dispose:restore};
}
