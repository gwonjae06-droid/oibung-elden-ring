import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const root=process.cwd();await mkdir('qa-output/clarity',{recursive:true});
const server=http.createServer(async(req,res)=>{
 try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/clarity-test'){res.setHeader('Content-Type','text/html');res.end('<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><body style="margin:0;background:#000"></body>');return;}
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const diceOnly=process.argv.includes('--dice-only');
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|Shader Error|frame failed|lifecycle failed/i.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async route=>route.fulfill({contentType:'text/javascript',body:await readFile(path.join(root,'node_modules/three/build',new URL(route.request().url()).pathname.split('/').pop()))}));
 await page.route('https://fonts.**/**',route=>route.abort());
 await page.goto(url+'/clarity-test');
 const cutaways=diceOnly?[]:await page.evaluate(async()=>{
  const T=await import('three'),{createCameraVisibility}=await import('/src/camera-visibility.mjs');
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,640);document.body.append(renderer.domElement);
  const defs=[['kwon',20,44,10,async s=>(await import('/src/environment.mjs')).buildEnvironment(s,new T.Mesh())],['clown',20,44,10,async s=>(await import('/src/clown-radiant-circus.mjs')).createClownCircusStage(s,{coarse:true}).root],['dice',70,165,18,async s=>(await import('/src/dice-actor.mjs')).buildDiceBoard(s).root],['blood',26,50,12,async s=>(await import('/src/blood-white-cathedral.mjs')).createWhiteCathedral(s,{coarse:true}).root]],reports=[];
  for(const[id,r,d,h,build]of defs){
   const scene=new T.Scene();scene.background=new T.Color(0x181a20);scene.add(new T.HemisphereLight(0xffffff,0x555555,2));const map=await build(scene);
   const marker=new T.Mesh(new T.BoxGeometry(1.5,2.8,1.5),new T.MeshBasicMaterial({color:0xff00ff,fog:false}));scene.add(marker);
   const camera=new T.PerspectiveCamera(60,1.5,.1,700),target=new T.Vector3(),cases=[];
   const pixel=()=>{const gl=renderer.getContext(),p=new Uint8Array(21*21*4);gl.readPixels(470,310,21,21,gl.RGBA,gl.UNSIGNED_BYTE,p);let n=0;for(let i=0;i<p.length;i+=4)if(p[i]>200&&p[i+2]>200&&p[i+1]<60)n++;return n/441;};
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4;target.set(Math.sin(a)*r,1.4,Math.cos(a)*r);marker.position.copy(target);camera.position.set(Math.sin(a)*d,h,Math.cos(a)*d);camera.lookAt(target);
    map.visible=false;renderer.render(scene,camera);const reference=pixel();map.visible=true;
    renderer.render(scene,camera);const before=pixel(),c=createCameraVisibility(scene,{roots:[map],targets:()=>[target]});renderer.render(scene,camera);const after=pixel();
    cases.push({direction:i,before,after,reference,revealed:after/reference,raycasts:c.stats.raycasts});c.dispose();
    if(i===0){renderer.render(scene,camera);}
   }
   reports.push({id,cases});
  }
  renderer.dispose();return reports;
 });
 for(const report of cutaways){assert.ok(report.cases.some(c=>c.before<c.after-.05),report.id+' needs a genuinely blocked baseline');for(const c of report.cases)assert.ok(c.revealed>=.8,report.id+': '+JSON.stringify(c));}
 await page.goto(url+'/spider-combat.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#start')?.disabled===false,{timeout:60000});
 await page.evaluate(()=>{localStorage.setItem('oibung-muted','1');document.getElementById('journey')?.setAttribute('hidden','');});
 const layouts=[];
 for(const size of diceOnly?[]:[{width:1280,height:1024},{width:1920,height:1080},{width:3440,height:1440},{width:844,height:390}]){
  await page.setViewportSize(size);await page.waitForFunction(size=>{const b=document.getElementById('world').getBoundingClientRect(),scale=Math.min(size.width/1600,size.height/900);return Math.abs(b.width-1600*scale)<1&&Math.abs(b.height-900*scale)<1;},size);
  const v=await page.evaluate(()=>{const c=document.getElementById('world'),b=c.getBoundingClientRect();return {buffer:[c.width,c.height],box:[b.x,b.y,b.width,b.height]};});
  assert.deepEqual(v.buffer,[1600,900]);assert.ok(Math.abs(v.box[2]/v.box[3]-16/9)<.002);layouts.push({size,...v});
 }
 await page.setViewportSize({width:1280,height:720});
 for(const boss of diceOnly?['dice']:['clown','dice','blood']){
  await page.evaluate(async boss=>{const {readBattleSession}=await import('/src/battle-session.mjs');readBattleSession(document)?.pause?.();
   const {BOSS_REGISTRY}=await import('/src/boss-registry.mjs'),b=BOSS_REGISTRY[boss],m=await b.load();window.clarityBattle=b.launch(m,{weapon:'sword',configure:g=>{g.player.hp=g.player.maxHp=99999;},onClose(){}});
  },boss);
  await page.waitForFunction(boss=>{const d=document.getElementById(boss+'-battle'),r=d?.firstElementChild?.shadowRoot,c=r?.getElementById('world');return d?.open&&c?.width===1600&&c?.height===900;},boss,{timeout:60000});
  await page.waitForTimeout(boss==='blood'?5500:900);
  for(const size of [{width:1280,height:1024},{width:844,height:390}]){
   await page.setViewportSize(size);await page.waitForFunction(({boss,size})=>{const c=document.getElementById(boss+'-battle').firstElementChild.shadowRoot.getElementById('world'),b=c.getBoundingClientRect(),scale=Math.min(size.width/1600,size.height/900);return c.width===1600&&c.height===900&&Math.abs(b.width-1600*scale)<1&&Math.abs(b.height-900*scale)<1;},{boss,size});
  }
  await page.setViewportSize({width:1280,height:720});await page.waitForFunction(boss=>document.getElementById(boss+'-battle').firstElementChild.shadowRoot.getElementById('world').clientWidth===1280,boss);
  await page.screenshot({path:'qa-output/clarity/'+boss+'.png'});
  if(boss==='dice'){
   const phase=await page.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs'),root=document.getElementById('dice-battle').firstElementChild.shadowRoot,g=readBattleSession(root).game;const {damageDice}=await import('/src/dice-combat.mjs'),{stepDicePlayer}=await import('/src/dice-player.mjs');damageDice(g,g.boss.maxHp*.51);for(let i=0;i<240&&g.dice.giant?.state==='transition';i++)stepDicePlayer(g,.05,{});return g.dice.giant?.state;});
   assert.ok(phase&&phase!=='transition');await page.waitForTimeout(1500);await page.screenshot({path:'qa-output/clarity/dice-phase2.png'});
  }
  await page.evaluate(async()=>{await window.clarityBattle?.close?.();});
 }
 assert.deepEqual(errors,[]);const report={cutaways,layouts,errors};await writeFile('qa-output/clarity/'+(diceOnly?'dice-report.json':'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
