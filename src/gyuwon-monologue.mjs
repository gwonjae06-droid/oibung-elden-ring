import * as T from 'three';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createGyuwonMonologue(scene,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-quiet-monologue';scene.add(root);root.visible=false;
 const geos=[],mats=[],savedLights=new Map();
 const material=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.88,...extra});mats.push(m);return m;};
 const wood=material(0x554638),paper=material(0xbab09b),cloth=material(0x28333b),iron=material(0x353a3c,{metalness:.55,roughness:.4});
 const box=new T.BoxGeometry(1,1,1);geos.push(box);
 const add=(mat,p,s,name)=>{const m=new T.Mesh(box,mat);m.position.set(...p);m.scale.set(...s);m.name=name;m.castShadow=!coarse;m.receiveShadow=true;root.add(m);return m;};
 add(material(0x10151a),[0,-.08,0],[60,.12,60],'monologue-unadorned-floor');
 add(wood,[-2.8,.79,-1.7],[1.2,.14,1.1],'monologue-empty-chair-seat');
 add(wood,[-2.8,1.45,-2.2],[1.2,1.2,.1],'monologue-empty-chair-back');
 for(const x of [-3.3,-2.3])for(const z of [-2.1,-1.3])add(iron,[x,.38,z],[.08,.76,.08],'monologue-chair-leg');
 add(cloth,[1.8,.28,-.8],[.8,.55,.35],'monologue-worn-school-bag').rotation.z=-.12;
 for(let i=0;i<3;i++){add(i%2?wood:cloth,[1.6,.08+i*.13,.8],[.75,.12,1.02],'monologue-closed-textbook').rotation.y=i*.16;}
 for(let i=0;i<4;i++){
  const sheet=add(paper,[-1.1+i*.27,.013+i*.003,1.1+i*.12],[.46,.006,.65],'monologue-used-exam-sheet');sheet.rotation.y=.2-i*.13;
  for(let row=0;row<4;row++)add(iron,[-1.1+i*.27,.025+i*.003,.96+i*.12+row*.07],[.22,.004,.006],'monologue-printed-answer-line');
 }
 const target=new T.Object3D();target.position.set(0,2.1,0);root.add(target);
 const spot=new T.SpotLight(0xffe7c3,150,28,Math.PI/7,.65,1.5);spot.name='monologue-single-key-spotlight';spot.position.set(-2.4,9,4);spot.target=target;spot.castShadow=!coarse;spot.shadow.mapSize.set(1024,1024);spot.shadow.normalBias=.025;root.add(spot);
 const rim=new T.PointLight(0x8c9cb4,2.2,9,2);rim.position.set(2.6,3,-3);root.add(rim);
 function restore(){for(const [l,n]of savedLights)l.intensity=n;savedLights.clear();}
 function update(g){
  const m=g?.gyuwon?.years?.musical,active=!!m?.finishing&&g.status==='playing';
  root.visible=active;if(!active){restore();return;}
  if(!savedLights.size)scene.traverse(o=>{if(o.isLight&&o!==spot&&o!==rim)savedLights.set(o,o.intensity);});
  const fade=smooth(m.time/3);
  for(const [l,n]of savedLights)l.intensity=n*(1-fade*.985);
  root.position.set(g.boss.x,0,g.boss.z);
  scene.background.setRGB(.006,.008,.012);scene.fog.color.copy(scene.background);scene.fog.density=.035;
  spot.intensity=105+45*fade;target.position.y=2.15+Math.sin(m.time*.35)*.05;
 }
 return {root,update,dispose(){restore();spot.shadow.map?.dispose();root.removeFromParent();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
export function gyuwonMonologueMotion(lyric,time){
 const phase=Math.max(0,Math.min(1,lyric?.phase||0)),w=Math.sin(phase*Math.PI),gesture=lyric?.gesture;
 const ponder=['ponder','search','still','lookback','fade','ask'].includes(gesture),offer=['offer','reach','open','present','raise'].includes(gesture);
 return {torsoX:.08+Math.sin(time*.35)*.025+(ponder?.06*w:0),torsoY:Math.sin(time*.17)*.04,torsoZ:Math.sin(time*.23)*.025,
  headX:ponder?.08+.20*w:.08-.12*w,headY:Math.sin(time*.24)*.10,
  leftArm:-.12-(offer?.30*w:.03*w),rightArm:ponder?-.18-.7*w:-.18-(offer?.5*w:.15*w),
  leftElbow:-.25-(offer?.3*w:0),rightElbow:ponder?-.35-.85*w:-.35-.35*w,step:0,lift:0,twist:0,handOpen:ponder?.3:.75};
}
