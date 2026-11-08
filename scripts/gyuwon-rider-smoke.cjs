const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const project=path.resolve(__dirname,'..'),touch=!!process.env.GYUWON_TOUCH,out=path.join(project,'qa-output/gyuwon-rider',touch?'touch':'desktop');
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
  if(!process.env.GYUWON_RIDER_URL)await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>route.fulfill({path:path.join(project,'node_modules/three/build',new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
  await page.route('https://fonts.**',route=>route.abort());
  await page.goto(process.env.GYUWON_RIDER_URL||`http://127.0.0.1:${server.address().port}/spider-combat.html`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('[data-j="new"]',{timeout:60000});
  await page.evaluate(async()=>{
   localStorage.setItem('oibung-muted','1');document.getElementById('journey').close();
   window.riderRead=(await import('./src/battle-session.mjs')).readBattleSession;
   window.riderBattle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.player.invuln=1e6;g.gyuwon.years.recover=1000;}});
  });
  await page.waitForFunction(()=>{const root=document.querySelector('#gyuwon-battle')?.firstElementChild.shadowRoot,s=root&&riderRead(root);return s?.active&&s.game.time>.05;},{},{timeout:150000});
  for(const id of ['bike','scooter','ultimateBike','ultimateScooter']){
   await page.evaluate(async id=>{
    const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;
    Object.assign(e,{year:id.toLowerCase().includes('scooter')?2:1,season:1,mode:'combat',recover:1000,signatureUsed:true});g.boss.x=0;g.boss.z=-5;g.player.x=0;g.player.z=8;g.gyuwon.hazards=[];
    (await import('./src/gyuwon-years.mjs')).startGyuwonYearCast(g,id);
   },id);
   for(const stage of ['orbit','windup','rush','return']){
    const report=await page.evaluate(async stage=>{
     const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game,e=g.gyuwon.years;
     const {stepGyuwon}=await import('./src/gyuwon-combat.mjs'),{ridePose}=await import('./src/gyuwon-year-choreography.mjs');
     const segment=e.rideTrack.find(x=>x.stage===stage&&(stage!=='return'||x.start>e.rideTrack.find(x=>x.stage==='rush').end-.01));
     const target=segment.start+(segment.end-segment.start)*(stage==='windup'?.85:.25);
     while(e.castT+1e-8<target)stepGyuwon(g,Math.min(1/120,target-e.castT));
     await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
     return {id:e.cast,stage,pose:ridePose(e),time:g.time,diagnostics:s.diagnostics()};
    },stage);
    assert.ok(report.pose);assert.ok(Math.hypot(report.pose.x,report.pose.z)<=28.1);
    if(stage==='windup')assert.ok(report.pose.wheelie>.35);
    reports.push(report);await page.screenshot({path:path.join(out,id+'-'+stage+'.png')});
   }
  }
  // Let the actual battle loop, camera and rendering advance on a live perimeter segment.
  const movement=await page.evaluate(async()=>{
   const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),g=s.game;
   const {stepGyuwon}=await import('./src/gyuwon-combat.mjs');
   const orbit=g.gyuwon.years.rideTrack.find(x=>x.cruise&&x.start>g.gyuwon.years.castT);
   while(g.gyuwon.years.castT<orbit.start+.1)stepGyuwon(g,1/120);
   const from={x:g.boss.x,z:g.boss.z,time:g.time};for(let i=0;i<12;i++)await new Promise(requestAnimationFrame);
   return {distance:Math.hypot(g.boss.x-from.x,g.boss.z-from.z),simulationSeconds:g.time-from.time};
  });assert.ok(movement.distance>2);assert.ok(movement.simulationSeconds>0);
  // Observe a complete ordinary ride with natural battle time and camera input.
  await page.evaluate(async()=>{
   const g=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).game;
   Object.assign(g.gyuwon.years,{year:1,season:1,mode:'combat',signatureUsed:true});g.boss.x=0;g.boss.z=-5;g.player.x=0;g.player.z=8;g.gyuwon.hazards=[];
   (await import('./src/gyuwon-years.mjs')).startGyuwonYearCast(g,'bike');
   window.riderPose=(await import('./src/gyuwon-year-choreography.mjs')).ridePose;
  });
  for(const stage of ['windup','rush','return']){
   await page.waitForFunction(stage=>{
    const g=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).game;
    return riderPose(g.gyuwon.years)?.stage===stage;
   },stage,{timeout:45000,polling:16});
   await page.screenshot({path:path.join(out,'live-bike-'+stage+'.png')});
  }
  await page.evaluate(()=>riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).pause());
  const paused=await page.evaluate(async()=>{const s=riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot),t=s.game.time;await new Promise(r=>setTimeout(r,120));return s.game.time===t;});assert.ok(paused);
  await page.evaluate(()=>riderRead(document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot).resume());
  await page.locator('#gyuwon-battle').locator('.brand').click();assert.equal(await page.locator('#gyuwon-battle').count(),0);
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({url:page.url(),touch,reports,movement,errors},null,2));console.log('RIDER_QA_PASSED',JSON.stringify({touch,views:reports.length,movement,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
