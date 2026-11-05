import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const root=process.cwd(),out='qa-output/player-quality';await mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(name==='/player-test'){res.setHeader('Content-Type','text/html');res.end('<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0;background:#10171d"></body>');return;}
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:960,height:960}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram|frame failed|lifecycle failed/i.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async r=>r.fulfill({contentType:'text/javascript',body:await readFile(path.join(root,'node_modules/three/build',new URL(r.request().url()).pathname.split('/').pop()))}));
 await page.route('https://fonts.**/**',r=>r.abort());await page.goto(url+'/player-test');
 const geometry=await page.evaluate(async()=>{
  const T=await import('three'),{buildPlayer}=await import('/src/models.mjs'),{createPlayerPolish}=await import('/src/player-polish.mjs'),{WEAPONS}=await import('/src/weapon-data.mjs'),{createCinematicWorld}=await import('/src/cinematic-graphics.mjs');
  const scene=new T.Scene();scene.background=new T.Color(0x101a24);scene.add(new T.HemisphereLight(0xddeeff,0x30232b,2.4));
  const sun=new T.DirectionalLight(0xffe6c3,4);sun.position.set(3,6,5);scene.add(sun);const rim=new T.DirectionalLight(0x7fb7e3,3);rim.position.set(-4,3,-4);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(30,30).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:0x172935,roughness:.9}));floor.position.y=-.02;scene.add(floor);
  const camera=new T.PerspectiveCamera(38,1,.05,60);camera.position.set(2.7,2.3,4.3);camera.lookAt(0,1.25,0);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,960);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.append(renderer.domElement);
  createCinematicWorld(scene,renderer,{profile:'kwon'});
  const p=buildPlayer(Object.keys(WEAPONS));scene.add(p.rig);const fx=createPlayerPolish(scene,{makeSound:()=>({clear(){},update(){},play(){},dispose(){return Promise.resolve({errors:[]});}})});
  const g={weapon:'sword',time:0,status:'playing',player:{x:0,z:0,yaw:0,action:null,skill:{}},boss:{x:0,z:3,state:'idle'}};
  let triangles=0,meshes=0;p.rig.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;meshes++;}});
  window.playerPreview={scene,camera,renderer,p,fx,g,WEAPONS,render(){fx.update(1/60,g);renderer.render(scene,camera);}};window.playerPreview.render();return {triangles,meshes};
 });assert.ok(geometry.triangles<12000);
 for(const weapon of ['sword','hammer','bow','cards']){
  await page.evaluate(weapon=>{const v=window.playerPreview;v.fx.clear();v.g.weapon=weapon;v.g.player.action=null;v.g.time+=.1;v.render();},weapon);await page.screenshot({path:out+'/'+weapon+'-idle.png'});
  await page.evaluate(weapon=>{const v=window.playerPreview,w=v.WEAPONS[weapon];v.g.player.action={kind:'attack',t:w.wind*.88,wind:w.wind,active:w.active,total:w.wind+w.active+w.end};for(let i=0;i<5;i++){v.g.time+=1/60;v.render();}},weapon);await page.screenshot({path:out+'/'+weapon+'-windup.png'});
  await page.evaluate(()=>{const v=window.playerPreview,w=v.WEAPONS[v.g.weapon];for(let i=0;i<8;i++){v.g.player.action.t=w.wind+w.active*i/8;v.g.time+=1/60;v.render();}v.fx.event({type:'boss-hit',amount:72},v.g);v.render();});await page.screenshot({path:out+'/'+weapon+'-strike.png'});
 }
 for(const kind of ['roll','heal']){
  await page.evaluate(kind=>{const v=window.playerPreview;v.fx.clear();v.g.weapon='sword';v.g.player.action={kind,t:kind==='roll'?.18:.42,total:kind==='roll'?.52:1.05};v.g.time+=1/60;v.render();},kind);await page.screenshot({path:out+'/'+kind+'.png'});
 }
 await page.evaluate(async()=>{const v=window.playerPreview,{createPlayerProjectileView}=await import('/src/player-projectile-view.mjs');v.flight=createPlayerProjectileView(v.scene);v.g.player.action=null;v.g.weapon='bow';v.g.time+=1/60;v.render();v.flight.update([{id:1,kind:'bow',x:.9,y:1.4,z:.6,yaw:-.5},{id:2,kind:'cards',x:-.9,y:1.7,z:.5,yaw:.6}],.016);v.renderer.render(v.scene,v.camera);});await page.screenshot({path:out+'/crafted-projectiles.png'});
 await page.evaluate(()=>{const v=window.playerPreview;v.flight.dispose();v.g.weapon='sword';v.g.player.action=null;v.p.rig.rotation.y=Math.PI;v.render();});await page.screenshot({path:out+'/cape-back.png'});
 await page.evaluate(async()=>{await window.playerPreview.fx.dispose();const {disposeScene}=await import('/src/runtime/scene-resources.mjs');disposeScene(window.playerPreview.scene);window.playerPreview.renderer.dispose();});
 await page.goto(url+'/spider-combat.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.getElementById('start')?.disabled===false,{timeout:60000});
 await page.evaluate(()=>{localStorage.setItem('oibung-muted','1');const d=document.getElementById('journey');if(d.open)d.close();d.hidden=true;});
 await page.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');readBattleSession(document).start('sword');});await page.waitForTimeout(1000);await page.screenshot({path:out+'/kwon-battle.png'});
 for(const boss of ['clown','dice','blood']){
  await page.evaluate(async boss=>{const {readBattleSession}=await import('/src/battle-session.mjs');readBattleSession(document).pause();const {BOSS_REGISTRY}=await import('/src/boss-registry.mjs'),b=BOSS_REGISTRY[boss];window.battle=b.launch(await b.load(),{weapon:'bow',configure:g=>{g.player.hp=g.player.maxHp=99999;},onClose(){}});},boss);
  await page.waitForFunction(boss=>document.getElementById(boss+'-battle')?.open,boss);await page.waitForTimeout(1200);
  await page.evaluate(async boss=>{const {readBattleSession}=await import('/src/battle-session.mjs'),{actPlayer,tickPlayerAction}=await import('/src/player-combat.mjs'),{WEAPONS}=await import('/src/weapon-data.mjs');const r=document.getElementById(boss+'-battle').firstElementChild.shadowRoot,g=readBattleSession(r).game;g.startGrace=0;if(actPlayer(g,'light'))tickPlayerAction(g,g.player.action.wind,WEAPONS.bow);},boss);
  await page.waitForTimeout(350);await page.screenshot({path:out+'/'+boss+'-battle.png'});await page.evaluate(async()=>{await window.battle.close();});
 }
 await page.close();
 const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(String(e)));
 await mobile.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async r=>r.fulfill({contentType:'text/javascript',body:await readFile(path.join(root,'node_modules/three/build',new URL(r.request().url()).pathname.split('/').pop()))}));await mobile.route('https://fonts.**/**',r=>r.abort());
 await mobile.goto(url+'/spider-combat.html',{waitUntil:'domcontentloaded'});await mobile.waitForFunction(()=>document.getElementById('start')?.disabled===false,{timeout:60000});
 await mobile.evaluate(async()=>{localStorage.setItem('oibung-muted','1');const d=document.getElementById('journey');if(d.open)d.close();d.hidden=true;const {readBattleSession}=await import('/src/battle-session.mjs');readBattleSession(document).start('sword');});
 await mobile.waitForTimeout(800);assert.equal(await mobile.evaluate(()=>document.getElementById('touch').hidden),false);await mobile.screenshot({path:out+'/mobile-landscape.png'});await mobile.close();
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({geometry,errors},null,2));console.log(JSON.stringify({geometry,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
