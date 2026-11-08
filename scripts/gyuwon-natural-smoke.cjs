// Historical 5-11 annual-world visual QA runs in opt-in compatibility mode.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-output/gyuwon-natural');
 await fs.mkdir(out,{recursive:true});const errors=[],reports=[];let browser;
 const resolvedThree=require.resolve('three');
 const threeModule=path.join(path.dirname(resolvedThree),'three.module.js');
 const threeEntry='/'+path.relative(root,threeModule).split(path.sep).join('/');
 const html=`<!doctype html><html><head><meta charset="utf-8"><script type="importmap">{"imports":{"three":"${threeEntry}"}}</script></head><body style="margin:0;background:#121925"><canvas id="scene"></canvas></body></html>`;
 const server=http.createServer(async(req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/natural-qa.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:800},...(process.env.GYUWON_TOUCH?{isMobile:true,hasTouch:true}:{})});
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  page.on('console',m=>{
   if(m.type()==='warning')console.log('QA_WARN',m.text());
   if(m.text().startsWith('QA_PATTERN'))console.log(m.text());
   if(m.type()==='error'&&/Gyuwon frame failed|WebGL.*(error|failed)/i.test(m.text()))errors.push(m.text());
  });
  let all={patterns:0};
  if(!process.env.GYUWON_LIVE_ONLY){
  await page.goto(`http://127.0.0.1:${server.address().port}/natural-qa.html`);
  await page.evaluate(async()=>{
   const T=await import('three'),{createGyuwonActor}=await import('/src/gyuwon-actor.mjs'),{createGyuwonYearsFx}=await import('/src/gyuwon-years-fx.mjs');
   const scene=new T.Scene();scene.background=new T.Color(0x1b2533);
   scene.add(new T.HemisphereLight(0xd6e4fa,0x374652,3));
   const light=new T.DirectionalLight(0xffe1bd,4);light.position.set(-6,14,8);scene.add(light);
   const floor=new T.Mesh(new T.PlaneGeometry(140,140),new T.MeshStandardMaterial({color:0x47515b,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.06;scene.add(floor);
   const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
   const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,500);
   const actor=createGyuwonActor(scene,{coarse:false}),fx=createGyuwonYearsFx(scene,{coarse:false});
   await fx.ready;window.qa={T,scene,renderer,camera,actor,fx};
  });
  const captures=[[1,'ultimateBike',2.8],[2,'ultimateScooter',3.0],[3,'ultimateSmoke',2.1],[4,'sniper',1.55],[4,'archery',1.15],[4,'ultimateMarksman',2.0],[5,'sewageThrow',1.18],[5,'ultimateSewage',4.6],[6,'ultimateShrine',4.5],[7,'dance',1.2],[8,'octoStrike',1.1],[9,'recall',1.25],[11,'nightmare365',19.5]];
  for(const [year,id,time]of captures){
   const stats=await page.evaluate(async({year,id,time})=>{
    const {createGyuwonGame,stepGyuwon}=await import('/src/gyuwon-combat.mjs'),{startGyuwonYearCast}=await import('/src/gyuwon-years.mjs');
    const {T,scene,renderer,camera,actor,fx}=qa;
    const g=createGyuwonGame('sword',{yearMode:true,seed:42});g.gyuwon.years.legacyAnnual=true;g.gyuwon.years.year=year;g.gyuwon.stageMemory='sword';g.player.invuln=1e5;g.player.z=9;g.boss.z=0;startGyuwonYearCast(g,id);
    for(let t=0;t<time;t+=1/120){stepGyuwon(g,1/120);actor.update(g,0,1/120);}
    fx.update(g);window.qa.game=g;
    const close=['sniper','archery','sewageThrow'].includes(id),distance=close?8:37;
    camera.position.set(g.boss.x+distance*.70,close?5:25,g.boss.z+distance);
    camera.lookAt(g.boss.x,close?1.9:1.2,g.boss.z);renderer.render(scene,camera);
    const materials=renderer.info.memory.geometries;
    return {id,year,time,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:materials};
   },{year,id,time});
   reports.push(stats);await page.screenshot({path:path.join(out,id+'.png')});
  }
  all=await page.evaluate(async()=>{
   const {createGyuwonGame,stepGyuwon}=await import('/src/gyuwon-combat.mjs'),{GYUWON_YEAR_PATTERNS,gyuwonYearRoster,startGyuwonYearCast}=await import('/src/gyuwon-years.mjs');
   const {GYUWON_YEAR_SIGNATURES}=await import('/src/gyuwon-year-signatures.mjs');
   const {actor,fx,renderer,scene,camera}=qa,results=[];
    const ids=Object.keys(GYUWON_YEAR_PATTERNS);const memory=[];
    for(let cycle=0;cycle<3;cycle++){
    for(const id of ids){
    const g=createGyuwonGame('sword',{yearMode:true,seed:42});g.gyuwon.years.legacyAnnual=true;g.player.invuln=1e5;
    const year=Array.from({length:11},(_,i)=>i+1).find(y=>gyuwonYearRoster(y).includes(id)||GYUWON_YEAR_SIGNATURES[y]===id);
    g.gyuwon.years.year=year||({sewageThrow:5,sewageWave:5,sewageBomb:5,figures:6,photocard:6,merch:6,dance:7,donation:7,chatstorm:7,octoStrike:8,octoSweep:8,octoInk:8,ultimateSewage:5,ultimateShrine:6,ultimateGacha:7,ultimateOctopus:8})[id]||1;g.boss.phase=year>=9?3:1;g.gyuwon.stageMemory='sword';
    startGyuwonYearCast(g,id);
    const first=Math.min(...g.gyuwon.hazards.map(h=>h.warn));
    for(const time of cycle===0?[0,first-.10,first+.02,GYUWON_YEAR_PATTERNS[id][0]-.08]:[first+.02]){
     let frames=0;
     while(g.gyuwon.years.castT+1/120<time){stepGyuwon(g,1/120);if(frames++>5000)throw Error('stalled clock '+id);}
     actor.update(g,0,1/120);fx.update(g);renderer.render(scene,camera);
    }
    if(cycle===0)results.push(id);
    console.log('QA_PATTERN',cycle,id);
   }
   fx.clear();renderer.render(scene,camera);memory.push(renderer.info.memory.geometries);
   }
   return {patterns:results.length,expectedPatterns:ids.length,geometries:renderer.info.memory.geometries,memory};
  });
  assert.equal(all.patterns,all.expectedPatterns);assert.deepEqual(errors,[]);
  assert.equal(all.memory[1],all.memory[2],'repeated attack geometry must remain bounded');
  await page.setViewportSize({width:844,height:390});
  await page.evaluate(()=>{const {renderer,camera,scene}=qa;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.render(scene,camera);});
  await page.screenshot({path:path.join(out,'mobile-landscape.png')});
  // Exercise the actual encounter, including its unskippable intro and HUD.
  await page.evaluate(()=>{qa.fx.dispose();qa.actor.dispose();qa.renderer.dispose();});
  }
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>route.fulfill({path:path.join(path.dirname(threeModule),new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
  await page.route('https://fonts.**',route=>route.abort());
  await page.setViewportSize({width:1280,height:800});
  console.log('QA_LIVE navigating');
  await page.goto(`http://127.0.0.1:${server.address().port}/spider-combat.html`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-j="new"]',{timeout:60000});await page.waitForTimeout(200);
  console.log('QA_LIVE menu ready');
  await page.evaluate(async()=>{
   localStorage.setItem('oibung-muted','1');
   document.getElementById('journey').close();
   const {launchGyuwonBattle}=await import('/src/gyuwon-battle.mjs');
   window.liveQa=launchGyuwonBattle({weapon:'sword',diagnostics:true,configure(g){g.gyuwon.years.legacyAnnual=true;g.player.invuln=1e5;}});
   if(!window.liveQa)throw Error('real battle startup failed');
  });
  await page.evaluate(async()=>{window.readLiveSession=(await import('/src/battle-session.mjs')).readBattleSession;});
  await page.waitForFunction(()=>{
   const readBattleSession=window.readLiveSession;
   const root=document.querySelector('#gyuwon-battle')?.firstElementChild?.shadowRoot;
   return !!(root&&readBattleSession(root)?.active&&readBattleSession(root)?.diagnostics()?.view.recall.prewarmed);
  },{},{timeout:120000});
  console.log('QA_LIVE battle ready');
  await page.screenshot({path:path.join(out,'live-desktop.png')});
  const live=await page.evaluate(async()=>{
   const {readBattleSession}=await import('/src/battle-session.mjs');
   const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot,s=readBattleSession(root);
   s.pause();const time=s.game.time;await new Promise(r=>setTimeout(r,100));
   if(s.game.time!==time)throw Error('pause advanced combat');s.resume();
   return {clock:root.querySelector('.gy-dday-clock').textContent,diagnostics:s.diagnostics()};
  });
  assert.match(live.clock,/D-\d+/);
  assert.equal(await page.evaluate(()=>document.querySelector('dialog:modal')?.id),'gyuwon-battle');
  const transitions=[];
  for(const [index,map]of ['sword','circus','gamble','tsunami'].entries()){
   await page.evaluate(async({index,map})=>{
    const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;
    e.year=9;e.mode='combat';e.season=0;e.cast=null;e.recover=100;e.mapClock=0;e.mapPending=false;g.boss.phase=3;g.boss.x=0;g.boss.z=-5;g.player.x=0;g.player.z=14;g.gyuwon.hazards=[];g.gyuwon.stageMemory=map;g.gyuwon.stageTime=0;
   },{index,map});
   await page.waitForTimeout(2200);
   transitions.push(await page.evaluate(()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);return {map:s.game.gyuwon.stageMemory,time:s.game.time,diagnostics:s.diagnostics()};}));
   await page.screenshot({path:path.join(out,'live-map-'+map+'.png')});
  }
  await page.evaluate(async()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game;g.gyuwon.years.year=11;g.gyuwon.years.season=0;g.gyuwon.years.recover=0;const {startGyuwonYearCast}=await import('/src/gyuwon-years.mjs');startGyuwonYearCast(g,'nightmare365');g.gyuwon.years.castT=18.4;g.gyuwon.t=18.4;g.gyuwon.hazards.forEach(h=>h.age=18.4);});
  await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'live-last-answer.png')});
  live.transitions=transitions;
  live.webgl=await page.evaluate(()=>{const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot,gl=root.querySelector('canvas').getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?{vendor:gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}:null;});
  await page.setViewportSize({width:844,height:390});
  await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'live-mobile.png')});
  await page.evaluate(()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);s.game.status='lost';s.game.player.hp=0;});
  await page.waitForFunction(()=>!document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot.getElementById('result').hidden,{},{timeout:30000});
  await page.locator('#gyuwon-battle').locator('#retry').click();
  await page.waitForFunction(()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);return s.active&&s.game.time>0;},{},{timeout:30000});
  live.retry=await page.evaluate(()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);return {year:s.game.gyuwon.years.year,status:s.game.status,builds:s.diagnostics().view.recall.builds};});
  assert.equal(live.retry.year,1);assert.equal(live.retry.status,'playing');assert.equal(live.retry.builds,4);
  if(process.env.GYUWON_TOUCH){await page.locator('#gyuwon-battle').locator('[data-act="light"]').tap();await page.locator('#gyuwon-battle').locator('[data-act="roll"]').tap();live.touch=await page.evaluate(()=>{const s=readLiveSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);return {coarse:matchMedia('(pointer:coarse)').matches,stamina:s.game.player.stamina};});assert.ok(live.touch.coarse);assert.ok(live.touch.stamina<100);}
  const closed=await page.evaluate(async()=>{await liveQa.close();return document.querySelectorAll('#gyuwon-battle').length;});
  assert.equal(closed,0);assert.deepEqual(errors,[]);for(const item of transitions)assert.ok(item.diagnostics.view.recall.originalRoot,'real remembered scenery must be active');
  await fs.writeFile(path.join(out,process.env.GYUWON_TOUCH?'report-touch.json':process.env.GYUWON_LIVE_ONLY?'report-live.json':'report.json'),JSON.stringify({reports,all,live,errors},null,2));
  console.log(JSON.stringify({reports,all,live,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

