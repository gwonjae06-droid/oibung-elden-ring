const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}};
(async()=>{
 const root=path.resolve(__dirname,'..'),errors=[];let browser;
 const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/boss-travel-qa.html'){
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
  await page.goto('http://127.0.0.1:'+server.address().port+'/boss-travel-qa.html',{waitUntil:'domcontentloaded'});
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
  const artifacts=path.join(root,'artifacts/boss-travel');await fs.mkdir(artifacts,{recursive:true});
  assert.equal(await page.locator('[data-j="skip-toggle"]').count(),0,'old shortcut should not exist');
  assert.equal(await page.locator('.j-skip-offer').count(),0);
  await click('bosses');
  const destination=stage=>page.locator('[data-j="boss-target"][data-stage="'+stage+'"]');
  for(const stage of [0,1,2,3])assert.equal(await destination(stage).isEnabled(),true);
  assert.equal(await destination(4).isDisabled(),true);
  await destination(1).click();
  assert.match(await page.locator('.j-boss-chooser').innerText(),/오슬우부터 도전/);
  await destination(3).click();
  assert.match(await page.locator('.j-boss-chooser').innerText(),/배서준부터 도전/);
  assert.equal((await read()).flames,2);
  await page.screenshot({path:path.join(artifacts,'destinations.png'),animations:'disabled'});
  await click('home');await click('new');
  assert.match(await page.locator('.j-boss-note').innerText(),/이권재부터 도전/);
  await destination(3).click();
  await page.locator('[data-j="weapon"][data-weapon="bow"]').click();
  assert.equal(await page.locator('.j-stat-chart [role="meter"]').count(),7);
  assert.match(await page.locator('.j-stat-chart').innerText(),/체력|공격 피해/);
  await page.setViewportSize({width:844,height:390});
  await page.locator('[data-j="begin"]').scrollIntoViewIfNeeded();
  assert.ok(await page.locator('[data-j="begin"]').isVisible());
  const bounds=await page.locator('.j-boss-chooser').boundingBox();assert.ok(bounds.width<=844&&bounds.x>=0);
  await page.screenshot({path:path.join(artifacts,'weapon-mobile.png')});
  await click('begin');
  await page.waitForFunction(()=>{
   const root=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
   const s=root&&window.__readSession(root);
   if(s?.game?.status==='playing'&&s.game.evolutions.includes('twin-arrow')&&!document.getElementById('journey').open){window.__travelGame=s.game;return true;}
   return false;
  },null,{timeout:30000});
  const state=await page.evaluate(async()=>{
   const {BOSS_REGISTRY}=await import('/src/boss-registry.mjs'),{journeyBossHp}=await import('/src/journey-balance.mjs');
   const g=window.__travelGame;
   return {weapon:g.weapon,hp:g.boss.maxHp,expected:journeyBossHp('blood',BOSS_REGISTRY.blood.maxHp),stillOpen:!!document.querySelector('#blood-battle')};
  });
  assert.equal(state.weapon,'bow');assert.equal(state.hp,state.expected);assert.equal(state.stillOpen,true);
  assert.equal((await read()).flames,2,'travel is free even after battle starts');
  await page.evaluate(()=>window.__journey.dispose());
  await page.evaluate(async()=>{
   const {SAVE_KEY}=await import('/src/journey-state.mjs'),{installJourney}=await import('/src/journey.mjs');
   const p=JSON.parse(localStorage.getItem(SAVE_KEY));p.defeated=[];p.memories=[];localStorage.setItem(SAVE_KEY,JSON.stringify(p));
   window.__journey=installJourney(document,window,{makeMusic:()=>({unlock(){},update(){},dispose(){}})});
  });
  assert.equal(await page.locator('[data-j="bosses"]').count(),0);
  await click('new');assert.equal(await destination(1).isDisabled(),true);
  assert.equal(await destination(0).isEnabled(),true);
  await page.evaluate(()=>window.__journey.dispose());assert.deepEqual(errors,[]);
  console.log(JSON.stringify({actualBoss:'blood',weapon:state.weapon,flamesSpent:0,lockedGate:true,mobileWidth:bounds.width,errors}));
 }catch(error){console.error('Browser errors:',JSON.stringify(errors));throw error;}
 finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
