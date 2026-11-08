// Historical 5-11 annual-world visual QA runs in opt-in compatibility mode.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright-core');
(async()=>{
 const project=path.resolve(__dirname,'..'),before=!!process.env.GYUWON_WORLD_BASELINE,touch=!!process.env.GYUWON_TOUCH;
 const out=path.join(project,'qa-output/gyuwon-worlds',before?'before':touch?'touch':'after');await fs.mkdir(out,{recursive:true});
 const baselineRef=process.env.GYUWON_WORLD_BASE_REF||'72d512a',cache=new Map(),errors=[],profiles=[];let browser;
 const server=http.createServer(async(req,res)=>{try{
  const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(project,'.'+url);if(!file.startsWith(project+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
  if(before&&url.startsWith('/src/')){if(!cache.has(url))cache.set(url,execFileSync('git',['show',baselineRef+':'+url.slice(1)],{cwd:project,maxBuffer:4000000}));res.end(cache.get(url));}
  else res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:touch?{width:844,height:390}:{width:1280,height:800},...(touch?{isMobile:true,hasTouch:true}:{})});
  page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error'&&/Gyuwon frame failed|WebGL.*(error|failed)/i.test(m.text()))errors.push(m.text());});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>route.fulfill({path:path.join(project,'node_modules/three/build',new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
  await page.route('https://fonts.**',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/spider-combat.html`,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-j="new"]',{timeout:60000});await page.waitForTimeout(200);
  await page.evaluate(async()=>{localStorage.setItem('oibung-muted','1');document.getElementById('journey').close();window.readWorldSession=(await import('/src/battle-session.mjs')).readBattleSession;window.worldBattle=(await import('/src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.legacyAnnual=true;g.player.invuln=1e6;g.gyuwon.years.recover=1000;g.gyuwon.years.worldSeed=42;}});});
  await page.waitForFunction(()=>{const root=document.querySelector('#gyuwon-battle')?.firstElementChild.shadowRoot,s=root&&readWorldSession(root);return s?.active&&s.game.time>.01;},{},{timeout:120000});
  for(const year of process.env.GYUWON_WORLD_PROBE?[1,9]:before?[1,4,9,10,11]:[1,2,3,4,5,6,7,8,9,10,11,12,13]){
   await page.evaluate(year=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;Object.assign(e,{year,season:1,mode:'combat',cast:null,castT:0,recover:1000,signatureUsed:true,mapClock:0,mapPending:false,bannerUntil:-1});g.boss.phase=year>=9?3:1;g.boss.x=0;g.boss.z=-5;g.player.x=0;g.player.z=14;g.gyuwon.hazards=[];g.gyuwon.stageMemory=year>=9?'tsunami':null;g.gyuwon.stageTime=1;},year);
   const profile=await page.evaluate(async year=>{const start=performance.now();for(let i=0;i<18;i++)await new Promise(requestAnimationFrame);const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);return {year,wallMs:performance.now()-start,diagnostics:s.diagnostics()};},year);
   profiles.push(profile);if(!before){assert.ok(profile.diagnostics.view.world.active.length);if(year<=11)assert.ok(profile.diagnostics.view.world.layers.includes(year));if(year===11)assert.equal(profile.diagnostics.view.recall.active,null);}
   await page.screenshot({path:path.join(out,'year-'+year+'.png')});console.log('WORLD',year,profile.diagnostics.calls,profile.diagnostics.triangles);
  }
  if(!before){
   await page.evaluate(async()=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;e.year=5;e.mode='combat';g.boss.phase=1;g.player.x=0;g.player.z=14;(await import('/src/gyuwon-years.mjs')).startGyuwonYearCast(g,'sewageWave');e.castT=2.8;g.gyuwon.hazards.forEach(h=>h.age=2.8);});await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'sewer-wave.png')});
   await page.evaluate(async()=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;e.year=6;e.mode='combat';(await import('/src/gyuwon-years.mjs')).startGyuwonYearCast(g,'ultimateShrine');e.wards[0].hp=0;});await page.waitForTimeout(1200);await page.screenshot({path:path.join(out,'shrine-collapse.png')});
   await page.evaluate(async()=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;e.year=3;e.mode='combat';(await import('/src/gyuwon-years.mjs')).resolveGyuwonExamGrade(g,.9);e.gradeT=1.8;});await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'world-transformation.png')});
   await page.evaluate(async()=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;e.year=11;e.mode='combat';g.player.x=0;g.player.z=14;(await import('/src/gyuwon-years.mjs')).startGyuwonYearCast(g,'nightmare365');e.castT=18;g.gyuwon.hazards.forEach(h=>h.age=18);});await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'folded-omr-floor.png')});
  }
  const freeze=await page.evaluate(async()=>{const s=readWorldSession(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot);s.pause();const time=s.game.time;await new Promise(r=>setTimeout(r,100));const unchanged=s.game.time===time;s.resume();return unchanged;});assert.ok(freeze);
  await page.locator('#gyuwon-battle').locator('.brand').click();assert.equal(await page.locator('#gyuwon-battle').count(),0);
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({before,touch,profiles,errors},null,2));console.log('WORLD_QA_PASSED',JSON.stringify({worlds:profiles.length,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
