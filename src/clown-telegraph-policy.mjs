const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.02;
export function largeClownTelegraph(z){
 if(z.major===false)return false;if(z.major===true)return true;
 return z.shape==='circle'?z.r>=6:z.shape==='cone'?z.r>=16&&z.half>=.8:z.shape==='lane'?z.w>=9&&z.len>=20:false;
}
function sameGeometry(geo,z){
 const p=geo?.parameters||{};
 if(z.shape==='circle')return geo?.type==='CircleGeometry'&&near(p.radius,z.r);
 if(z.shape==='lane')return geo?.type==='BoxGeometry'&&near(p.width,z.w)&&near(p.depth,z.len);
 if(z.shape==='cone'&&geo?.type==='ShapeGeometry'){const shape=Array.isArray(p.shapes)?p.shapes[0]:p.shapes,points=shape?.getPoints?.()||[];return near(Math.max(0,...points.map(p=>Math.hypot(p.x,p.y))),z.r);}
 return false;
}
export function applyClownTelegraphs(scene,g){
 const zones=g?.clown?.zones;if(!zones||!scene?.traverse)return;
 scene.traverse(m=>{
  if(m.renderOrder!==100||m.material?.depthTest!==false||![0xff3929,0xffc34a,0x4da6ff].includes(m.material?.color?.getHex?.()))return;
  m.visible=g.status==='playing'&&zones.some(z=>z.state==='warn'&&largeClownTelegraph(z)&&near(m.position?.x,z.x)&&near(m.position?.z,z.z)&&sameGeometry(m.geometry,z));
 });
}
