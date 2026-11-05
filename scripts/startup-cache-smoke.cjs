const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}};
(async()=>{
 const root=path.resolve(__dirname,'..');let browser;
 const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end('missing');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':which('google-chrome')||which('chromium')||which('chromium-browser')),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],legacyRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async r=>{
   const name=new URL(r.request().url()).pathname.split('/').at(-1);let file=path.join(root,'node_modules/three/build',name);
   try{await fs.access(file);}catch{file=path.join(root,'node_modules/three',name);}
   await r.fulfill({path:file,contentType:'text/javascript'});
  });
  await page.route('https://fonts.**',r=>r.abort());
  // Model the pre-shortcut journey file retained in a browser cache. Its old
  // named import must neither break startup nor bypass the canonical import map.
  await page.route('**/src/journey.mjs?art=blood-boss-v1',r=>{
   legacyRequests.push(r.request().url());return r.fulfill({contentType:'text/javascript',body:"import {consumeRevivalFlame} from './purification-forge.mjs';export function installJourney(){throw Error('Stale journey entry used');}"});
  });
  await page.addInitScript(()=>localStorage.setItem('oibung-muted','1'));
  await page.goto('http://127.0.0.1:'+server.address().port+'/spider-combat.html',{waitUntil:'domcontentloaded'});
  try{await page.locator('#journey [data-j="new"]').waitFor({state:'visible',timeout:20000});}
  catch(error){console.error(JSON.stringify({errors,legacyRequests,screen:await page.locator('#journey').innerText()}));throw error;}
  assert.deepEqual(legacyRequests,[],'production startup fetched a legacy journey URL');
  await page.locator('#journey [data-j="new"]').click();await page.locator('#journey [data-j="begin"]').click();
  await page.evaluate(async()=>{window.__readSession=(await import('/src/battle-session.mjs')).readBattleSession;});
  await page.waitForFunction(()=>window.__readSession(document)?.game?.weapon==='sword'&&!document.getElementById('journey').open,null,{timeout:15000});
  const game=await page.evaluate(()=>{const g=window.__readSession(document).game;return {hp:g.boss.maxHp,status:g.status};});
  assert.equal(game.status,'playing');assert.ok(game.hp>0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({productionStartup:true,legacyRequests:legacyRequests.length,firstBoss:game,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
