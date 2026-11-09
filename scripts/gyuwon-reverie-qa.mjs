import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8150;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/reverie',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});
const errors=[],frames=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram|Gyuwon frame failed/i.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto(`http://127.0.0.1:${port}/spider-combat.html`,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__launch=()=>import('./src/gyuwon-battle.mjs').then(({launchGyuwonBattle})=>window.__battle=launchGyuwonBattle({diagnostics:true,configure(g){const e=g.gyuwon.years;e.year=4;e.day=0;e.cast=null;e.recover=0;g.boss.hp=6000;g.startGrace=0;}}));await window.__launch();window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.reverie?.time>.3,null,{timeout:120000});
 const begun=Date.now(),capture=[4.8,12,20,28,34,41,47.5,53.5,56.5];let next=0,paused=false,last;
 while(Date.now()-begun<95000){
  last=await page.evaluate(()=>{const s=window.__session(),g=s.game,e=g.gyuwon.years,r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;return {year:e.year,mode:e.mode,time:e.reverie?.time,hp:g.boss.hp,playerHP:g.player.hp,playerX:g.player.x,hits:g.stats.hits,graphics:s.diagnostics(),caption:r.querySelector('.gy-film-caption').textContent,bossDisplay:getComputedStyle(r.getElementById('boss-hud')).display,musicPlaying:window.__media.some(a=>decodeURIComponent(a.src).endsWith('/Welcome to My World!.mp3')&&!a.paused)};});
  if(last.year===5)break;
  assert.equal(last.graphics.livingDoodle.applied,true,'the full Gyuwon story shares the colored ink world');assert.equal(last.mode,'reverie');assert.equal(last.hp,6000);assert.equal(last.hits,0);assert.equal(last.musicPlaying,false);assert.equal(last.bossDisplay,'none');
  if(next<capture.length&&last.time>=capture[next]){await page.screenshot({path:`qa-output/reverie/scene-${next}-${Math.floor(last.time)}.png`});frames.push(last);console.log('Reverie scene',last.graphics.reverie.shot,last.time.toFixed(2));next++;}
  if(!paused&&last.time>=21){
   await page.locator('#gyuwon-battle').locator('#world').focus();await page.keyboard.press('Escape');
   const time=await page.evaluate(()=>window.__session().game.gyuwon.years.reverie.time);await page.waitForTimeout(750);
   assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.reverie.time),time);
   assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.year),4);
   await page.locator('#gyuwon-battle').locator('#resume').click();paused=true;
  }
  if(last.time>29&&last.time<31){await page.locator('#gyuwon-battle').locator('#world').focus();await page.keyboard.press('j');await page.keyboard.press('Space');await page.keyboard.press('e');}
  await page.waitForTimeout(130);
 }
 assert.equal(last.year,5);assert.equal(last.hp,6000);assert.equal(frames.length,9);assert.ok(Date.now()-begun>=57000);assert.equal(frames[5].caption,'내가 진짜 하고 싶은 일은 뭘까?');
 await page.waitForFunction(()=>window.__media.some(a=>decodeURIComponent(a.src).endsWith('/Welcome to My World!.mp3')&&!a.paused),null,{timeout:10000});
 assert.ok(await page.evaluate(()=>window.__media.find(a=>decodeURIComponent(a.src).endsWith('/Welcome to My World!.mp3')&&!a.paused).currentTime<2));
 await page.waitForTimeout(2300);assert.equal(await page.evaluate(()=>window.__session().diagnostics().livingDoodle.applied),true,'the cloud must lead into the current Act V ink world');await page.screenshot({path:'qa-output/reverie/into-act-five.png'});
 await page.evaluate(()=>window.__battle.close());await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.__launch());
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.reverie?.time>1,null,{timeout:120000});
 await page.evaluate(()=>{const r=window.__session().game.gyuwon.years.reverie;r.time=r.clock=41;});await page.waitForTimeout(200);await page.screenshot({path:'qa-output/reverie/touch-question.png'});
 const caption=await page.locator('#gyuwon-battle').locator('.gy-film-caption').boundingBox();assert.ok(caption.x>=0&&caption.x+caption.width<=845&&caption.y+caption.height<=391);
 await page.evaluate(()=>{const r=window.__session().game.gyuwon.years.reverie;r.time=r.clock=53.8;});await page.waitForTimeout(200);await page.screenshot({path:'qa-output/reverie/touch-cloud.png'});
 await page.evaluate(()=>window.__battle.close());assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/reverie/report.json',JSON.stringify({frames,caption,errors,naturalPlayback:true},null,2));console.log('PASS: 58-second fourth-year aftermath, jobs, school, bedroom, realization, volumetric cloud, pause, input lock, original song start and touch');
}finally{await browser.close();await new Promise(r=>server.close(r));}
