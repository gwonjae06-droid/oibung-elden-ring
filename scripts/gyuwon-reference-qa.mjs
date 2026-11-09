import {GYUWON_PERFORMANCE_ROUTE} from '../src/gyuwon-musical-route.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8148;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/reference',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});
const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});page.on('pageerror',e=>errors.push(e.stack));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto(`http://127.0.0.1:${port}/spider-combat.html`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.player.invuln=1e6;g.startGrace=0;}});window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 const control=action=>page.locator('#gyuwon-battle').locator(`[data-musical-action="${action}"]`);
 const focus=()=>page.locator('#gyuwon-battle').locator('.gy-reference-canvas').focus();
 const value=fn=>page.evaluate(fn);
 for(const y of GYUWON_PERFORMANCE_ROUTE.filter(y=>y!==11)){
  await page.waitForFunction(y=>window.__session()?.active&&window.__session().game.gyuwon.years.year===y&&window.__session().game.gyuwon.years.musical?.time>3,y,{timeout:90000});
  if(y===5){
   await control('target0').click();await control('skill').click();
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.score>0);
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.skillPoints),2);
   await page.waitForTimeout(700);
  }
  if(y===6){
   await control('jump').click();await page.waitForTimeout(120);await control('jump').click();
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.jumpCount),2);
   await control('slide').dispatchEvent('pointerdown',{pointerId:1});
   assert.ok(await value(()=>window.__session().game.gyuwon.years.musical.slide>0));
   await control('slide').dispatchEvent('pointerup',{pointerId:1});
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.slide),0);
   await page.waitForTimeout(3300);await control('jump').click();
  }
  if(y===7){
   // Supply resources to exercise every native card in one short browser fixture.
   await value(()=>{const m=window.__session().game.gyuwon.years.musical;m.money=m.moneyCap=2500;m.cannon=100;});
   for(let i=0;i<6;i++)await control('summon'+i).click();
   await control('upgrade').click();await page.waitForTimeout(3500);
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.workerLevel),2);
   assert.ok(await value(()=>window.__session().game.gyuwon.years.musical.units.filter(u=>u.team===1).length>=6));
   await control('cannon').click();await page.waitForTimeout(900);
   assert.ok(await value(()=>window.__session().game.gyuwon.years.musical.cannon<10));
  }
  if(y===8){
   const first=await value(()=>window.__session().game.gyuwon.years.musical.dancePatterns[0].first);
   await page.evaluate(t=>{window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop).currentTime=t-.18;},first);
   await page.waitForFunction(t=>Math.abs(window.__session().game.gyuwon.years.musical.time-t)<.11,first);
   await control('light').dispatchEvent('pointerdown',{pointerId:1});
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.dancePatterns[0].done[0]),true);
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.note),null);
  }
  if(y===9){
   await value(()=>{const m=window.__session().game.gyuwon.years.musical;const [p,b]=m.fighters;p.x=-1.2;b.x=1.2;p.stun=b.stun=0;p.action=b.action=null;p.meter=100;m.enemyThink=99;});
   await focus();await page.keyboard.press('j');
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.fighters[1].hp<100);
   // The visible attack button automatically selects super at full meter.
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.fighters[0].meter===12);
   assert.equal(await page.locator('#gyuwon-battle').locator('.gy-musical-actions button').count(),3);
   await control('guard').dispatchEvent('pointerdown',{pointerId:9});
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.guardHeld),true);
   await control('guard').dispatchEvent('pointerup',{pointerId:9});
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.guardHeld),false);
   assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.fighters[0].meter),12);
  }
  if(y===10){
   const point=await page.locator('#gyuwon-battle').locator('.gy-reference-canvas').evaluate(c=>{const r=c.getBoundingClientRect(),s=Math.min(r.width/540,r.height/900);return {x:r.x+r.width/2-6*540/26*s,y:r.y+(r.height-900*s)/2+(120+35/44*760)*s};});
   await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(2100);await page.mouse.up();
   assert.ok(await value(()=>window.__session().game.player.x< -5));
   assert.ok(await value(()=>window.__session().game.gyuwon.years.musical.score>0));
   await control('bomb').click();assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.bombs),2);
   await control('skill').click();assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.weaponMode),'laser');
  }
  await page.screenshot({path:`qa-output/reference/act-${y}.png`});
  const result=await value(()=>{const s=window.__session(),m=s.game.gyuwon.years.musical,r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;return {year:m.year,score:m.score,hp:s.game.boss.hp,graphics:s.diagnostics(),brand:getComputedStyle(r.querySelector('.brand')).display,controls:[...r.querySelectorAll('.gy-musical-actions button')].map(b=>{const r=b.getBoundingClientRect();return {action:b.dataset.musicalAction,x:r.x,y:r.y,w:r.width,h:r.height};})};});
  assert.equal(result.graphics.renderMode,y===5?'webgl':'canvas2d');assert.equal(result.graphics.livingDoodle.applied,true,'all retained acts share colored ink');assert.equal(result.brand,'none');
  if(y>5){assert.equal(result.graphics.calls,1);assert.equal(result.graphics.triangles,2);}
  for(const b of result.controls)assert.ok(b.x>=0&&b.x+b.w<=1281&&b.y>=0&&b.y+b.h<=801,JSON.stringify(b));
  results.push(result);console.log('Verified reference controls',y);
  await page.locator('#gyuwon-battle').locator('#pause').click();
  const time=await value(()=>window.__session().game.gyuwon.years.musical.time);await page.waitForTimeout(150);
  assert.equal(await value(()=>window.__session().game.gyuwon.years.musical.time),time);
  await page.locator('#gyuwon-battle').locator('#resume').click();
  await page.waitForFunction(()=>window.__media.some(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop),null,{timeout:30000});
  await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-.12;});
 }
 await page.waitForFunction(()=>window.__session().game.gyuwon.years.year===11&&window.__session().game.gyuwon.years.musical.time>3);
 assert.equal(await value(()=>window.__session().diagnostics().renderMode),'webgl');
 await value(()=>window.__battle.close());
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(async()=>{window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({configure(g){g.gyuwon.years.year=6;g.player.invuln=1e6;}});});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.musical?.time>3,null,{timeout:90000});
 await control('jump').tap();assert.ok(await value(()=>window.__session().game.gyuwon.years.musical.jumpCount>0));
 await page.screenshot({path:'qa-output/reference/touch-runner.png'});
 await value(()=>window.__battle.close());assert.deepEqual(errors,[]);
 fs.writeFileSync('qa-output/reference/browser-report.json',JSON.stringify({results,errors},null,2));console.log('PASS: retained genres, native controls, contact scoring, ink-composited 2D frames, pause, touch and 3D return');
}finally{await browser.close();await new Promise(r=>server.close(r));}
