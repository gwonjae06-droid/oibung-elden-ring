// Local QA helper: PLAYWRIGHT_PATH can point to an existing Playwright install.
const {createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[];
 const server=createServer(async(req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error('path');const data=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404|ERR_|Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.join(root,'node_modules/three',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
  await page.route('https://fonts.**',r=>r.abort());
  const url='http://127.0.0.1:'+server.address().port;await page.goto(url+'/spider-combat.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('[data-j="new"]'));
  // Use the real hidden route; the same journey launcher is used after the casino.
  await page.evaluate(()=>{for(let i=0;i<5;i++)document.querySelector('[data-j="secret-tap"]').click();});
  await page.locator('button[data-boss="blood"]').click();await page.waitForSelector('#blood-battle');
  await page.getByRole('button',{name:'건너뛰기',exact:true}).click();
  await page.waitForFunction(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const r=document.querySelector('#blood-battle')?.firstElementChild.shadowRoot;return r&&readBattleSession(r)?.active;});
  const result=await page.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const {damageBlood,stepBlood}=await import('/src/blood-combat.mjs');const root=document.querySelector('#blood-battle').firstElementChild.shadowRoot,s=readBattleSession(root),g=s.game;g.startGrace=0;s.pause();const t=g.time;await new Promise(r=>setTimeout(r,100));if(g.time!==t)throw Error('pause advanced time');s.resume();damageBlood(g,3500);return {hp:g.boss.hp,phase:g.boss.phase,weapon:g.weapon};});
  await page.waitForFunction(async()=>{const{readBattleSession}=await import('/src/battle-session.mjs');return readBattleSession(document.querySelector('#blood-battle').firstElementChild.shadowRoot).game.boss.phase===2;});
  await page.locator('#blood-battle').getByRole('button',{name:'혈익 변신 건너뛰기'}).click();await page.waitForTimeout(300);await page.screenshot({path:path.join(root,'blood-desktop.png')});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);const layout=await page.evaluate(()=>{const r=document.querySelector('#blood-battle').firstElementChild.shadowRoot,b=r.getElementById('boss-hud').getBoundingClientRect();if(b.bottom>innerHeight+1||b.top<0)throw Error('Boss HUD clipped: '+JSON.stringify({rect:b.toJSON(),innerWidth,innerHeight,d:document.querySelector('#blood-battle').getBoundingClientRect().toJSON(),host:document.querySelector('#blood-battle').firstElementChild.getBoundingClientRect().toJSON(),shell:r.getElementById('arena').getBoundingClientRect().toJSON(),css:getComputedStyle(r.getElementById('arena')).cssText,style:r.getElementById('arena').getAttribute('style')}));return b.toJSON()});await page.screenshot({path:path.join(root,'blood-mobile-landscape.png')});
  await page.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const {damageBlood}=await import('/src/blood-combat.mjs');const s=readBattleSession(document.querySelector('#blood-battle').firstElementChild.shadowRoot);damageBlood(s.game,999999);});
  await page.waitForSelector('[data-j="secret-retry"]');await page.locator('[data-j="secret-retry"]').click();await page.waitForSelector('#blood-battle');
  await page.getByRole('button',{name:'건너뛰기',exact:true}).click();await page.waitForTimeout(100);const retry=await page.evaluate(async()=>{const {readBattleSession}=await import('/src/battle-session.mjs');const s=readBattleSession(document.querySelector('#blood-battle').firstElementChild.shadowRoot);const g=s.game;await s.close();return {hp:g.boss.hp,phase:g.boss.phase,remaining:document.querySelectorAll('#blood-battle').length};});
  if(errors.length)throw Error(JSON.stringify(errors));console.log(JSON.stringify({result,retry,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
