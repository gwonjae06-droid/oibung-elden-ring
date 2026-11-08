// Historical 5-11 annual-world visual QA runs in opt-in compatibility mode.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const project=path.resolve(__dirname,'..'),touch=!!process.env.GYUWON_TOUCH,out=path.join(project,'qa-output/gyuwon-arsenal',touch?'touch':'desktop');
 await fs.mkdir(out,{recursive:true});const errors=[],reports=[];let browser;
 const server=http.createServer(async(req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(project,'.'+pathname);if(!file.startsWith(project+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:touch?{width:844,height:390}:{width:1280,height:800},...(touch?{isMobile:true,hasTouch:true}:{})});
  page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error'&&/Gyuwon frame failed|WebGL.*(error|failed)/i.test(m.text()))errors.push(m.text());});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  if(!process.env.GYUWON_ARSENAL_URL)await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>route.fulfill({path:path.join(project,'node_modules/three/build',new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
  await page.route('https://fonts.**',route=>route.abort());
  await page.goto(process.env.GYUWON_ARSENAL_URL||`http://127.0.0.1:${server.address().port}/spider-combat.html`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('[data-j="new"]',{timeout:60000});
  await page.evaluate(async()=>{
   localStorage.setItem('oibung-muted','1');document.getElementById('journey').close();
   window.riderRead=(await import('./src/battle-session.mjs')).readBattleSession;
   window.riderBattle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.legacyAnnual=true;g.player.invuln=1e6;g.gyuwon.years.recover=1000;}});
  });
  await page.waitForFunction(()=>{const root=document.querySelector('#gyuwon-battle')?.firstElementChild.shadowRoot,s=root&&riderRead(root);return s?.active&&s.game.time>.05;},{},{timeout:150000});
  const idle=await page.evaluate(async()=>{const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game;const {stepGyuwon}=await import('./src/gyuwon-combat.mjs');const before=g.gyuwon.years.day;for(let i=0;i<7200;i++)stepGyuwon(g,1/120);return {before,after:g.gyuwon.years.day,mode:g.gyuwon.years.mode};});assert.deepEqual(idle,{before:365,after:365,mode:'combat'});
  for(const year of process.env.GYUWON_ARSENAL_PROBE?[5]:[5,6,7,8]){
   const ids=await page.evaluate(async year=>{const m=await import('./src/gyuwon-arsenal.mjs');return [...m.ARSENAL_ROSTERS[year],m.ARSENAL_SIGNATURES[year]];},year);
   for(const id of ids){
    const report=await page.evaluate(async({year,id})=>{
     const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;
     Object.assign(e,{year,season:0,mode:'combat',recover:1000,signatureUsed:true});g.boss.hp=g.boss.maxHp*(1-.065*(year-1));e.yearStartHp=g.boss.hp;g.boss.x=0;g.boss.z=-5;g.player.x=0;g.player.z=8;g.gyuwon.hazards=[];
     (await import('./src/gyuwon-years.mjs')).startGyuwonYearCast(g,id);
     const {stepGyuwon}=await import('./src/gyuwon-combat.mjs'),first=Math.min(...g.gyuwon.hazards.map(h=>h.warn));
     while(e.castT<first-.12)stepGyuwon(g,1/120);
     await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
     return {year,id,kind:e.weaponPlan.kind,hazards:g.gyuwon.hazards.length,diagnostics:s.diagnostics()};
    },{year,id});assert.ok(report.hazards>0);reports.push(report);await page.screenshot({path:path.join(out,id+'.png')});
   }
  }
  await page.evaluate(async()=>{const g=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).game;(await import('./src/gyuwon-combat.mjs')).damageGyuwon(g,1e6);});
  await page.waitForFunction(()=>riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).game.gyuwon.years.mode==='exam',{},{timeout:90000});
  await page.screenshot({path:path.join(out,'hp-triggered-exam.png')});
  await page.evaluate(()=>riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).pause());
  const paused=await page.evaluate(async()=>{const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),t=s.game.time;await new Promise(r=>setTimeout(r,120));return s.game.time===t;});assert.ok(paused);
  await page.evaluate(()=>riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).resume());
  await page.locator('#gyuwon-battle').locator('.brand').click();assert.equal(await page.locator('#gyuwon-battle').count(),0);
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({url:page.url(),touch,reports,idle,errors},null,2));console.log('ARSENAL_QA_PASSED',JSON.stringify({touch,views:reports.length,idle,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
