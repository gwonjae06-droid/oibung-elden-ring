import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const root=process.cwd(),out='qa-output/blood-footwork';await mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{try{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(name==='/player-test'){res.setHeader('Content-Type','text/html');res.end('<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0;background:#10171d"></body>');return;}
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram|frame failed/i.test(m.text()))errors.push(m.text());});
 await page.goto(url+'/player-test');
 await page.evaluate(async()=>{
  const T=await import('three'),{buildBloodView}=await import('/src/blood-view.mjs'),combat=await import('/src/blood-combat.mjs'),footwork=await import('/src/blood-footwork.mjs'),{BLOOD_PATTERNS}=await import('/src/blood-data.mjs');
  const scene=new T.Scene();scene.background=new T.Color(0xe0e4e7);scene.add(new T.HemisphereLight(0xffffff,0x626278,2));
  const light=new T.DirectionalLight(0xffefd8,3);light.position.set(6,14,9);scene.add(light);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,760);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.append(renderer.domElement);
  const camera=new T.PerspectiveCamera(45,1000/760,.1,220);camera.position.set(9,5,12);camera.lookAt(0,3.2,0);
  const view=buildBloodView(scene,{coarse:false});
  const v={T,scene,camera,view,renderer,...combat,...footwork,BLOOD_PATTERNS,g:null,
   reset(phase=1){view.clear();this.g=combat.createBloodGame('sword',{seed:93});Object.assign(this.g.boss,{phase,x:0,z:0});this.g.player.z=18;this.g.player.hp=this.g.player.maxHp=1e9;return this.g;},
   advance(seconds){for(let t=0;t<seconds-1e-8;t+=.01)combat.stepBlood(this.g,Math.min(.01,seconds-t));},
   render(){view.update(this.g,1/60);renderer.render(scene,camera);}};
  window.fixture=v;v.reset();v.render();
 });
 await page.screenshot({path:out+'/grounded-idle.png'});
 await page.evaluate(()=>{const v=window.fixture;v.startBloodPattern(v.g,'wave');v.advance(3.8+.12+.19);v.render();});await page.screenshot({path:out+'/deliberate-step.png'});
 const feet=await page.evaluate(()=>{const v=window.fixture,targets=v.bloodFootTargets(v.g);return targets.map((t,i)=>{const a=v.scene.getObjectByName('blood-boot-'+(i?1:-1)).getWorldPosition(new v.T.Vector3());return a.distanceTo(new v.T.Vector3(t.x,t.y,t.z));});});assert.ok(feet.every(d=>d<.01));
 await page.evaluate(()=>{const v=window.fixture;v.advance(.7);v.render();});await page.screenshot({path:out+'/planted-recovery.png'});
 const patterns=await page.evaluate(()=>Object.keys(window.fixture.BLOOD_PATTERNS));
 for(const id of patterns){
  await page.evaluate(id=>{const v=window.fixture,spec=v.BLOOD_PATTERNS[id];v.reset(spec.phase);v.startBloodPattern(v.g,id);const first=Math.min(...v.g.blood.hazards.map(h=>h.warn));v.advance(Math.max(.15,first-.05));v.camera.position.set(18,19,28);v.camera.lookAt(0,4,0);v.render();},id);
  if(['lances','cross','judgement','ritual'].includes(id))await page.screenshot({path:out+'/'+id+'-warning.png'});
 }
 await page.evaluate(()=>{const v=window.fixture;v.reset(2);v.g.player.x=6;v.g.player.z=12;v.startBloodPattern(v.g,'dive');v.advance(1.2);v.render();});await page.screenshot({path:out+'/dive-flight.png'});
 await page.evaluate(()=>{const v=window.fixture;v.advance(.6);v.render();});await page.screenshot({path:out+'/dive-landing.png'});
 const automatic=await page.evaluate(()=>{
  const v=window.fixture,result={};
  for(const phase of [1,2]){const g=v.reset(phase),seen=[];for(let i=0;i<2000&&seen.length<10;i++){v.stepBlood(g,.05);for(const e of g.events)if(e.type==='blood-warning')seen.push(e.pattern);g.events=[];}result[phase]=seen;v.render();}
  return result;
 });for(const list of Object.values(automatic))assert.equal(new Set(list.slice(0,9)).size,9);
 await page.evaluate(async()=>{const v=window.fixture;v.view.dispose();const {disposeScene}=await import('/src/runtime/scene-resources.mjs');disposeScene(v.scene);v.renderer.dispose();});
 await page.close();
 const mobile=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(String(e)));
 await mobile.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async r=>r.fulfill({contentType:'text/javascript',body:await readFile(path.join(root,'node_modules/three/build',new URL(r.request().url()).pathname.split('/').pop()))}));await mobile.route('https://fonts.**/**',r=>r.abort());
 await mobile.goto(url+'/spider-combat.html',{waitUntil:'domcontentloaded'});await mobile.waitForFunction(()=>document.getElementById('start')?.disabled===false,{timeout:60000});
 await mobile.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');readBattleSession(document).pause();const d=document.getElementById('journey');if(d.open)d.close();d.hidden=true;const {launchBloodBattle}=await import('/src/blood-battle.mjs');window.battle=launchBloodBattle({weapon:'sword',configure:g=>{g.player.hp=g.player.maxHp=1e6;},onClose(){}});});
 await mobile.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs'),r=document.getElementById('blood-battle')?.firstElementChild?.shadowRoot;const session=r&&readBattleSession(r);return session?.active&&session.game.time>.1&&!r.querySelector('[role=dialog][aria-label$=등장]');},null,{timeout:30000});await mobile.waitForTimeout(800);await mobile.screenshot({path:out+'/mobile-blood-gameplay.png'});await mobile.evaluate(async()=>{await window.battle.close();});await mobile.close();
 assert.deepEqual(errors,[]);const report={patterns:patterns.length,feet,automatic,errors};await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
