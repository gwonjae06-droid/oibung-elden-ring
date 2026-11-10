// Headless browser integration regression:
// A pre-event complete save is reset once; a real game controller boss-win
// writes a new event save; two full reloads MUST keep that new victory.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}};
const EVENT_ID='oden-ending-2026-live-1110';
const PID='11111111-1111-4111-8111-111111111110';
(async()=>{
 const root=path.resolve(__dirname,'..'),issues=[],serverRecords=[];
 const server=http.createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
   if(!file.startsWith(root+path.sep))throw Error('path outside project');
   const ext=path.extname(file);
   res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[ext]||'application/octet-stream');
   res.end(await fs.readFile(file));
  }catch{res.writeHead(404);res.end('missing');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const exe=process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':which('google-chrome')||which('chromium')||which('chromium-browser'));
  browser=await chromium.launch({executablePath:exe,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>issues.push(e.stack||e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',async route=>{
   const name=new URL(route.request().url()).pathname.split('/').at(-1);
   await route.fulfill({path:path.join(root,'node_modules/three/build',name),contentType:'text/javascript'});
  });
  await page.route('https://fonts.**',route=>route.abort());
  await page.route('https://pmkhffwuzwxokqupuxkn.supabase.co/functions/v1/oden-event',async route=>{
   const req=route.request(),headers={'access-control-allow-origin':'*','access-control-allow-headers':'apikey, content-type, x-oden-token','access-control-allow-methods':'POST,OPTIONS','content-type':'application/json'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const body=JSON.parse(req.postData()||'{}');serverRecords.push(body.action);
   let obj={};
   if(body.action==='register')obj={id:PID,token:'a'.repeat(64),nickname:body.nickname,stage:-1};
   else if(body.action==='progress')obj={stage:body.stage};
   else if(body.action==='status')obj={id:PID,nickname:'행사테스트',stage:0,code:null,status:'pending',claimHold:false};
   else if(body.action==='telemetry')obj={id:PID,nickname:'행사테스트',stage:0,code:null,status:'pending',claimHold:false};
   else obj={error:'Unsupported test action'};
   await route.fulfill({status:obj.error?400:200,headers,body:JSON.stringify(obj)});
  });
  await page.addInitScript(()=>{
   if(localStorage.getItem('oden-test-seeded')==='1')return;
   localStorage.setItem('oden-test-seeded','1');
   localStorage.setItem('oibung.journey.v1',JSON.stringify({version:4,clears:3,records:[],memories:[],defeated:['kwon','clown','dice','blood','gyuwon'],flames:88,earnedFlames:88,forge:{}}));
   localStorage.setItem('oibung.gyuwon.ending-watched','1');
   localStorage.setItem('oibung.gyuwon.ensemble-photo','data:image/jpeg;base64,old-photo');
   localStorage.setItem('oibung-muted','1');
  });
  const url='http://127.0.0.1:'+server.address().port+'/spider-combat.html';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#journey [data-j="event"]').waitFor({state:'visible',timeout:30000});
  let info=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('oibung.journey.v1')||'null');
   return {marker:localStorage.getItem('oibung.odenring.legacy-save-reset.2026-11-10'),defeated:p?.defeated,flames:p?.flames,watched:localStorage.getItem('oibung.gyuwon.ending-watched'),photo:localStorage.getItem('oibung.gyuwon.ensemble-photo')};
  });
  assert.equal(info.marker,'done','first visit should mark the old save cleared');
  assert.deepEqual(info.defeated,[]);
  assert.equal(info.flames,0);
  assert.equal(info.watched,null);
  assert.equal(info.photo,null);
  await page.locator('#journey [data-j="event"]').click();
  await page.locator('#j-event-name').fill('행사테스트');
  await page.locator('#journey [data-j="event-join"]').click();
  await page.waitForFunction(id=>localStorage.getItem('oibung.oden-event.active.v1')===id,EVENT_ID,{timeout:20000});
  await page.locator('#journey [data-j="new"]').click();
  await page.locator('#journey [data-j="begin"]').click();
  await page.evaluate(async()=>{
   window.__odenGetSession=(await import('/src/battle-session.mjs')).readBattleSession;
  });
  await page.waitForFunction(()=>window.__odenGetSession(document)?.game?.status==='playing'&&!document.getElementById('journey').open,null,{timeout:30000});
  // Simulate the result of beating Kwon; invoke the real victory-accounting
  // controller and save path rather than forge localStorage directly.
  await page.evaluate(()=>{
   const g=window.__odenGetSession(document).game;
   g.status='won';g.boss.hp=0;
   document.getElementById('result').hidden=false;
  });
  await page.waitForTimeout(1700);
  const diag=await page.evaluate(({id,pid})=>{
   const game=window.__odenGetSession(document)?.game,dialog=document.getElementById('journey'),result=document.getElementById('result');
   const k='oibung.event.'+id+'.'+pid+'.oibung.journey.v1';
   const p=JSON.parse(localStorage.getItem(k)||'null');
   return {gameStatus:game?.status,resultHidden:result?.hidden,screen:dialog?.dataset?.screen,dialogOpen:dialog?.open,
    eventKeys:Object.keys(localStorage).filter(x=>x.startsWith('oibung.event.')),defeated:p?.defeated,flames:p?.flames,serverActions:undefined};
  },{id:EVENT_ID,pid:PID});
  console.log('Event victory processing diagnostic',JSON.stringify(diag));
  await page.waitForFunction(({id,pid})=>{
   const k='oibung.event.'+id+'.'+pid+'.oibung.journey.v1';
   const p=JSON.parse(localStorage.getItem(k)||'null');
   return p?.defeated?.includes('kwon')&&p?.flames>=1;
  },{id:EVENT_ID,pid:PID},{timeout:9000});
  const snapshot=await page.evaluate(({id,pid})=>({
   eventSave:localStorage.getItem('oibung.event.'+id+'.'+pid+'.oibung.journey.v1'),
   ordinarySave:localStorage.getItem('oibung.journey.v1'),
   marker:localStorage.getItem('oibung.odenring.legacy-save-reset.2026-11-10')
  }),{id:EVENT_ID,pid:PID});
  for(let pass=1;pass<=2;pass++){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#journey [data-j="event"]').waitFor({state:'visible',timeout:30000});
   const current=await page.evaluate(({id,pid})=>({
    eventSave:localStorage.getItem('oibung.event.'+id+'.'+pid+'.oibung.journey.v1'),
    ordinarySave:localStorage.getItem('oibung.journey.v1'),
    marker:localStorage.getItem('oibung.odenring.legacy-save-reset.2026-11-10'),
    active:localStorage.getItem('oibung.oden-event.active.v1')
   }),{id:EVENT_ID,pid:PID});
   assert.equal(current.marker,'done','one-time migration flag must survive reload');
   assert.equal(current.eventSave,snapshot.eventSave,'event boss victory lost at reload '+pass);
   assert.equal(current.ordinarySave,snapshot.ordinarySave,'general game save changed at reload '+pass);
   assert.equal(current.active,EVENT_ID);
   await page.locator('#journey [data-j="new"]').click();
   assert.equal(await page.locator('#journey [data-j="boss-target"][data-stage="1"]').isDisabled(),false,'Kwon victory should unlock Clown after reload');
  }
  assert.deepEqual(issues,[]);
  console.log(JSON.stringify({ok:true,firstLoadOldSaveRemoved:true,newVictorySurvivesReloads:2,backEndUsed:serverRecords,marker:snapshot.marker}));
 }catch(e){console.error('Event reload smoke failed',e.stack||e,issues);process.exitCode=1;}
 finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})();
