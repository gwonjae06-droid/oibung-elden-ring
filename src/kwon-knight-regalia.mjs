export const KWON_KNIGHT=Object.freeze({abdomenScale:Object.freeze([.82,.9,.72]),helmetStart:Math.PI,helmetArc:Math.PI,guardX:1.03,guardDepth:.12,breast:Object.freeze([[-1.15,.8],[-1.55,.2],[-1.25,-.7],[-.65,-1.05],[.65,-1.05],[1.25,-.7],[1.55,.2],[1.15,.8],[.4,.35],[-.4,.35]].map(Object.freeze))});
export const knightSpiderClutter=o=>Boolean(o?.isInstancedMesh&&o.geometry?.type==='ConeGeometry');
export function installKwonKnight(T,B,torso,head){
 const metal=new T.MeshStandardMaterial({color:0x272a32,metalness:.65,roughness:.48}),edge=new T.MeshStandardMaterial({color:0xb99653,metalness:.75,roughness:.4}),cloth=new T.MeshStandardMaterial({color:0x4d1521,roughness:.95,side:T.DoubleSide});
 torso.abdomen.scale.set(...KWON_KNIGHT.abdomenScale);torso.abdomen.traverse(o=>{if(knightSpiderClutter(o))o.visible=false;});for(const eye of B.eyes)eye.visible=false;
 for(const o of torso.chest.children)if(o.material===B.carapace&&o.geometry?.type==='SphereGeometry'&&o.geometry.parameters.radius===1.5)o.scale.set(1,.88,.85);
 for(const o of head.children){if(o.geometry?.type==='TubeGeometry')o.visible=false;else if(o.geometry?.type==='ConeGeometry')o.scale.multiplyScalar(.7);}
 const make=(geo,mat,parent,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 const body=(geo,mat,x,y,z,region='chest')=>{const o=make(geo,mat,torso.waist,x,y-1.5,z+1.5);torso.mount(o,region);return o;};
 const plate=(points,depth=.22)=>{const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.055,bevelSize:.045,bevelSegments:2,curveSegments:16,steps:1});g.translate(0,0,-depth/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+.15*Math.max(0,1-(p.getX(i)/1.7)**2));p.needsUpdate=true;g.computeVertexNormals();return g;};
 body(plate(KWON_KNIGHT.breast.map(([x,y])=>[x*1.045,y*1.045]),.14),edge,0,2,2.28);
 body(plate(KWON_KNIGHT.breast,.26),metal,0,2,2.34);
 for(const side of [-1,1])for(let i=0;i<3;i++){const p=body(new T.SphereGeometry(.9,28,18,0,Math.PI*2,0,Math.PI*.56),metal,side*(1.45+i*.16),2.7-i*.18,.75);p.scale.set(1,.64,1.15);p.rotation.z=side*(-.12-i*.08);}
 for(let i=0;i<4;i++){const p=body(new T.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI*.54),metal,0,2.1,-.8-i*.85,'abdomen');p.scale.set(2.17-i*.14,1.92-i*.04,.9);}
 body(new T.CylinderGeometry(1,1.15,.26,32),metal,0,1.2,1.15,'waist').scale.z=.7;
 body(plate([[-.16,.14],[.16,.14],[.16,-.14],[-.16,-.14]],.06),edge,0,1.2,2,'waist');
 const skirt=[[-.35,0],[.35,0],[.4,-.6],[.12,-.85],[-.35,-.72]];
 for(const side of [-1,1]){const o=body(plate(skirt,.035),cloth,side*.55,.95,1.65,'waist');o.rotation.z=side*-.12;}
 make(new T.SphereGeometry(1.19,36,24,KWON_KNIGHT.helmetStart,KWON_KNIGHT.helmetArc,0,Math.PI),metal,head);
 const guard=[[-.8,.6],[.1,.45],[.24,-.4],[-.25,-.85],[-.75,-.5]];
 for(const side of [-1,1]){const o=make(plate(guard,KWON_KNIGHT.guardDepth),metal,head,side*KWON_KNIGHT.guardX,0,-.02);o.rotation.y=side*Math.PI/2;}
 const crest=new T.CatmullRomCurve3([new T.Vector3(0,1.08,-.35),new T.Vector3(0,1.45,-.65),new T.Vector3(0,1.32,-1.05),new T.Vector3(0,.8,-1.35)]);
 make(new T.TubeGeometry(crest,24,.09,10,false),edge,head);
 for(const L of B.legs){for(let i=0;i<2;i++){const length=L.lengths[i];make(new T.CylinderGeometry(i?.22:.29,i?.28:.36,length*.55,18),metal,L.pivots[i],0,length*.44,0);}make(new T.SphereGeometry(.34,20,14),metal,L.pivots[1]);}
 return {style:'swordsman-spider'};
}
