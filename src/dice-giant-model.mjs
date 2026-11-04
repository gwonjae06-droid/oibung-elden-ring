// High-detail tailored-suit gentleman used for the usurped patron (torso and hands).
// Local origin of the torso is the chest centre; the front of the body faces +z.
const shape=(T,pts)=>{const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;};
const extrude=(T,pts,depth)=>new T.ExtrudeGeometry(shape(T,pts),{depth,bevelEnabled:false});
const lathe=(T,pts,seg)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg);
const solid=o=>{o.castShadow=true;o.receiveShadow=true;return o;};
export function buildGentlemanTorso(T,m){
 const group=new T.Group();
 const add=(geo,mat,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=solid(new T.Mesh(geo,mat));o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;};
 const sphere=new T.SphereGeometry(1,32,20),box=new T.BoxGeometry(1,1,1);
 // Smooth chest and waist silhouette; z is squashed to the original 15-unit depth.
 add(lathe(T,[[.01,-30],[16,-30],[18.5,-24],[20,-14],[22.5,-4],[24.5,6],[25,12],[23.5,19],[19,24.5],[12,27.5],[7,29],[.01,29.5]],48),m.suit,group,0,0,0,1,1,.6);
 // Jacket skirt below the waist.
 add(lathe(T,[[16,-30],[19.4,-34],[19.8,-39],[.01,-39]],48),m.suit,group,0,0,0,1,1,.6);
 // Padded shoulders.
 for(const side of [-1,1])add(sphere,m.suit,group,side*21,19,3,7.5,6.4,7.2);
 // Everything on the front sits on a slightly reclined plate that follows the chest curve.
 const front=new T.Group();front.position.z=13.4;front.rotation.x=-.18;group.add(front);
 add(extrude(T,[[-6.8,23],[6.8,23],[0,-3]],.4),m.shirt,front);
 for(const side of [-1,1]){
  const pts=[[6.4,23.5],[12.2,22],[10.6,14.5],[13.6,11.5],[8.8,-1],[2.2,-7.5],[.7,-4]].map(([x,y])=>[x*side,y]);
  add(extrude(T,pts,1),m.satin,front,0,0,.5);
  const wing=add(box,m.shirt,front,side*4.6,22.6,1.1,4.4,1.2,.5);wing.rotation.z=side*.5;
 }
 add(box,m.tie,front,0,17.5,1.2,3.2,3,1.8);
 add(extrude(T,[[-1.9,16],[1.9,16],[2.8,3],[0,-4.5],[-2.8,3]],.9),m.tie,front,0,0,.6);
 add(box,m.gold,front,0,6,1.9,5.2,.6,1.2);
 for(const y of [-10,-15.5])add(sphere,m.gold,front,0,y,2.2,.9,.9,.9);
 const square=add(box,m.shirt,front,-14,5,1.5,3.4,2.4,.6);square.rotation.z=.35;
 return {group};
}
export function buildGentlemanHand(T,m,side){
 const group=new T.Group(),fingers=[],thumb=[],sphere=new T.SphereGeometry(1,16,12);
 const add=(geo,mat,parent)=>{const o=solid(new T.Mesh(geo,mat));parent.add(o);return o;};
 const palm=add(sphere,m.skin,group);palm.scale.set(7.8,2.5,8.6);palm.position.z=1;
 const knuckle=add(sphere,m.skin,group);knuckle.scale.set(7.2,2.2,2.2);knuckle.position.set(0,.5,7.4);
 // Every finger is three jointed segments so a clenched fist really bends.
 function chain(root,specs){
  const joints=[];let parent=root;
  for(const [len,r] of specs){
   const joint=new T.Group();parent.add(joint);joints.push(joint);
   add(new T.CylinderGeometry(r*.92,r,len,12).rotateX(Math.PI/2).translate(0,0,len/2),m.skin,joint);
   add(sphere,m.skin,joint).scale.setScalar(r);
   const next=new T.Group();next.position.z=len;joint.add(next);parent=next;
  }
  add(sphere,m.skin,parent).scale.setScalar(specs.at(-1)[1]*.9);
  return joints;
 }
 for(let j=0;j<4;j++){
  const root=new T.Group();root.position.set((j-1.5)*3.7,0,8.2-(j===0||j===3?.9:0));group.add(root);
  fingers.push(chain(root,[[4.4,1.5],[3.4,1.35],[2.7,1.2]]));
 }
 const thumbRoot=new T.Group();thumbRoot.position.set(-side*7.6,0,2.5);thumbRoot.rotation.y=-side*.75;group.add(thumbRoot);
 thumb.push(...chain(thumbRoot,[[3.8,1.8],[3,1.5]]));
 // Shirt cuff, jacket sleeve end, cufflink and the pact mark on the back of the hand.
 add(new T.CylinderGeometry(6.6,6.6,4,24).rotateX(Math.PI/2),m.shirt,group).position.z=-8.5;
 add(new T.CylinderGeometry(7.4,7.6,6,24).rotateX(Math.PI/2),m.suit,group).position.z=-13;
 const link=add(sphere,m.gold,group);link.scale.setScalar(1);link.position.set(side*6.7,0,-8.5);
 const mark=add(new T.TorusGeometry(5,.18,8,32).rotateX(Math.PI/2),m.gold,group);mark.position.y=2.4;
 return {group,fingers,thumb};
}
