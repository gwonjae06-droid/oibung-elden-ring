const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}};
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[];let browser;
 const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/flame-skip-qa.html'){
   const html=(await fs.readFile(path.join(root,'spider-combat.html'),'utf8')).replace(/<script type="module">[\s\S]*?<\/script>/g,'');
   res.setHeader('Content-Type','text/html');res.end(html);return;
  }
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const executablePath=process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':which('google-chrome')||which('chromium')||which('chromium-browser'));
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async r=>{
   const name=new URL(r.request().url()).pathname.split('/').at(-1);let file=path.join(root,'node_modules/three/build',name);
   try{await fs.access(file);}catch{file=path.join(root,'node_modules/three',name);}
   await r.fulfill({path:file,contentType:'text/javascript'});
  });
  await page.route('https://fonts.**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/flame-skip-qa.html',{waitUntil:'domcontentloaded'});
  // Local source snapshots may omit binary art; keep missing-image placeholders
  // from covering the controls in screenshots, without changing game assets.
  try{await fs.access(path.join(root,'assets/art/temple-wall-v1.jpg'));}catch{await page.addStyleTag({content:'.j-scene{visibility:hidden!important}'});}
  await page.evaluate(async()=>{
   const {freshProfile,SAVE_KEY}=await import('/src/journey-state.mjs'),{installJourney}=await import('/src/journey.mjs');
   window.__readSession=(await import('/src/battle-session.mjs')).readBattleSession;
   const p=freshProfile();p.flames=2;p.earnedFlames=3;p.defeated=['kwon','clown','dice'];p.forge.bow['twin-arrow']=1;
   localStorage.setItem(SAVE_KEY,JSON.stringify(p));localStorage.setItem('oibung-muted','1');
   window.__journey=installJourney(document,window,{makeMusic:()=>({unlock(){},update(){},dispose(){}})});
  });
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oibung.journey.v1')));
  const click=action=>page.locator('#journey [data-j="'+action+'"]').click();
  const artifacts=path.join(root,'artifacts/flame-skip');await fs.mkdir(artifacts,{recursive:true});
  assert.match(await page.locator('.j-skip-offer').innerText(),/배서준부터 시작/);
  await click('skip-toggle');assert.equal((await read()).flames,2);
  // A player with all four gates unlocked must be able to choose any earlier
  // boss without spending the flame merely by changing the destination.
  const destination=stage=>page.locator('[data-j="skip-target"][data-stage="'+stage+'"]');
  assert.equal(await destination(1).isEnabled(),true);
  assert.equal(await destination(2).isEnabled(),true);
  assert.equal(await destination(3).isEnabled(),true);
  await destination(1).click();
  assert.match(await page.locator('.j-skip-offer').innerText(),/오슬우부터 시작/);
  assert.equal((await read()).flames,2);
  await destination(2).click();
  assert.match(await page.locator('.j-skip-offer').innerText(),/박성원부터 시작/);
  await destination(3).click();
  assert.match(await page.locator('.j-skip-offer').innerText(),/배서준부터 시작/);
  await page.screenshot({path:path.join(artifacts,'home-selected.png'),animations:'disabled'});
  const homeVisibility=await page.locator('.j-skip-offer').evaluate(el=>({opacity:getComputedStyle(el).opacity,top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height,viewport:innerHeight}));
  assert.ok(Number(homeVisibility.opacity)>.9&&homeVisibility.top>=0&&homeVisibility.top+homeVisibility.height<=homeVisibility.viewport,'home shortcut is not visible: '+JSON.stringify(homeVisibility));
  await click('new');await click('home');assert.equal((await read()).flames,2);
  assert.equal(await page.locator('[data-j="skip-toggle"]').getAttribute('aria-pressed'),'false');
  await click('skip-toggle');await click('new');
  await page.locator('[data-j="weapon"][data-weapon="bow"]').click();
  await page.setViewportSize({width:844,height:390});
  await page.locator('[data-j="begin"]').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('[data-j="begin"]').isVisible());
  const bounds=await page.locator('.j-skip-offer').boundingBox();assert.ok(bounds.width<=844&&bounds.x>=0);
  await page.screenshot({path:path.join(artifacts,'weapon-mobile.png')});
  await click('begin');
  await page.waitForFunction(()=>{
   const readBattleSession=window.__readSession;
   const root=document.querySelector('#blood-battle')?.firstElementChild.shadowRoot;
   const s=root&&readBattleSession(root);if(s?.game?.status==='playing'&&s.game.evolutions.includes('twin-arrow')&&!document.getElementById('journey').open){window.__skipGame=s.game;return true;}return false;
  },null,{timeout:30000});
  const state=await page.evaluate(async()=>{
   const {readBattleSession}=await import('/src/battle-session.mjs'),{BOSS_REGISTRY}=await import('/src/boss-registry.mjs'),{journeyBossHp}=await import('/src/journey-balance.mjs');
   const g=window.__skipGame;
   return {weapon:g.weapon,hp:g.boss.maxHp,expected:journeyBossHp('blood',BOSS_REGISTRY.blood.maxHp),stillOpen:!!document.querySelector('#blood-battle')};
  });
  assert.equal(state.weapon,'bow');assert.equal(state.hp,state.expected);assert.equal(state.stillOpen,true,'blood battle closed after startup');assert.equal((await read()).flames,1);
  await page.evaluate(()=>window.__journey.dispose());
  await page.evaluate(async()=>{
   const {SAVE_KEY}=await import('/src/journey-state.mjs'),{installJourney}=await import('/src/journey.mjs');
   const p=JSON.parse(localStorage.getItem(SAVE_KEY));p.defeated=[];p.memories=[];localStorage.setItem(SAVE_KEY,JSON.stringify(p));
   window.__journey=installJourney(document,window,{makeMusic:()=>({unlock(){},update(){},dispose(){}})});
  });
  assert.equal(await page.locator('[data-j="skip-toggle"]').isDisabled(),true);
  assert.match(await page.locator('.j-skip-offer').innerText(),/첫 보스를 토벌하면/);
  await page.evaluate(()=>window.__journey.dispose());assert.deepEqual(errors,[]);
  console.log(JSON.stringify({actualBoss:'blood',weapon:state.weapon,flamesSpent:1,lockedGate:true,mobileWidth:bounds.width,errors}));
 }catch(error){console.error('Browser errors:',JSON.stringify(errors));throw error;}
 finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
