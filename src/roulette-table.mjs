// A roulette surround encloses the complete square combat board; it has no gameplay collision.
export const ROULETTE_NUMBERS=Object.freeze([0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]);
export const ROULETTE_TABLE=Object.freeze({feltRadius:98,pocketInner:99,pocketOuter:112,railRadius:115});
export function rouletteTexture(T,doc=globalThis.document){
 const canvas=doc.createElement('canvas');canvas.width=canvas.height=2048;
 const c=canvas.getContext('2d'),center=1024,scale=1000/115;
 c.translate(center,center);c.fillStyle='#064d39';c.beginPath();c.arc(0,0,1000,0,Math.PI*2);c.fill();
 const count=ROULETTE_NUMBERS.length;
 for(let i=0;i<count;i++){
  const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2;
  c.beginPath();c.arc(0,0,112*scale,a,b);c.arc(0,0,99*scale,b,a,true);c.closePath();
  c.fillStyle=i===0?'#178750':i%2?'#a81e36':'#11121b';c.fill();c.strokeStyle='#d6b96e';c.lineWidth=2;c.stroke();
  c.save();c.rotate((a+b)/2);c.translate(105.5*scale,0);c.rotate(Math.PI/2);c.fillStyle='#fff1c6';c.font='bold 39px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(String(ROULETTE_NUMBERS[i]),0,0);c.restore();
 }
 for(const r of [97.5,99,112,114]){c.beginPath();c.arc(0,0,r*scale,0,Math.PI*2);c.strokeStyle='#c9a552';c.lineWidth=r===114?12:4;c.stroke();}
 c.fillStyle='#bda36b';c.font='32px Georgia';c.textAlign='center';c.fillText('PARK  •  ROYALE',0,77*scale);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function buildRouletteTable(T,root){
 const wood=new T.MeshStandardMaterial({color:0x30151c,roughness:.48,metalness:.2});
 const body=new T.Mesh(new T.CylinderGeometry(115,109,9,96),wood);body.position.y=-4.6;body.name='roulette-table-body';root.add(body);
 const top=new T.Mesh(new T.CircleGeometry(114,128).rotateX(-Math.PI/2),new T.MeshStandardMaterial({map:rouletteTexture(T),roughness:.75}));top.position.y=-.04;top.receiveShadow=true;top.name='roulette-numbered-wheel';root.add(top);
 const rail=new T.Mesh(new T.TorusGeometry(115,1.7,10,96).rotateX(Math.PI/2),new T.MeshStandardMaterial({color:0xc29c51,metalness:.8,roughness:.28}));rail.position.y=.15;rail.name='roulette-brass-rail';root.add(rail);
 const foot=new T.Mesh(new T.CylinderGeometry(21,39,50,32),wood);foot.position.y=-34;root.add(foot);
 return {root:body};
}
export function buildCasinoDiceAccents(T,root,edge){
 const geometry=new T.SphereGeometry(edge*.035,8,6),material=new T.MeshStandardMaterial({color:0xffe4a0,metalness:.8,roughness:.2,emissive:0x3d2306,emissiveIntensity:.45});
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){const stud=new T.Mesh(geometry,material);stud.name='casino-dice-stud';stud.position.set(x*edge*.46,y*edge*.46,z*edge*.46);root.add(stud);}
 return {update(time=0){material.emissiveIntensity=.35+.1*Math.sin(time*2);},dispose(){/* Shared scene ownership releases geometry and material. */}};
}
