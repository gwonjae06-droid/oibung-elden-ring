import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8147;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/musical',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});
const errors=[];console.log('Starting musical WebGL QA');
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.stack));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto(`http://127.0.0.1:${port}/spider-combat.html`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.player.invuln=1e6;g.startGrace=0;}});window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 await page.waitForFunction(()=>window.__session()?.active,null,{timeout:90000});
 await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical?.time>3.2,{timeout:30000});
 // Act 5 is a turn-based encounter: wait for an allied turn and use its mapped normal attack (Q), not the obsolete J key.
 await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical?.turn==='player',null,{timeout:30000});
 await page.locator('#gyuwon-battle').locator('#world').focus();await page.keyboard.press('q');
 await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.score>0,null,{timeout:12000});
 const hp=await page.evaluate(()=>window.__session().game.boss.hp);assert.equal(hp,6000);
 await page.keyboard.press('Space'); // previously dereferenced a null player action and crashed the fight
 await page.keyboard.press('Escape');await page.waitForTimeout(100);
 const paused=await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time);await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time),paused);
 await page.evaluate(()=>document.getElementById('gyuwon-battle').firstElementChild.shadowRoot.getElementById('resume').click());
 await page.evaluate(()=>localStorage.setItem('oibung-muted','1'));await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop)?.muted),true);
 await page.evaluate(()=>localStorage.setItem('oibung-muted','0'));
 const results=[];
 for(let y=5;y<=11;y++){
  await page.waitForFunction(y=>window.__session().game.gyuwon.years.year===y&&window.__session().game.gyuwon.years.musical.time>3,y,{timeout:15000});
  await page.screenshot({path:`qa-output/musical/act-${y}.png`,timeout:30000});console.log('Verified act',y);
  results.push(await page.evaluate(()=>{const s=window.__session();return {year:s.game.gyuwon.years.year,hp:s.game.boss.hp,clock:s.game.gyuwon.years.musical.clock,graphics:s.diagnostics()};}));
  await page.evaluate(y=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);if(!a)throw Error('missing playing master '+y);a.currentTime=a.duration-.12;},y);
  await page.waitForFunction(y=>y===11?window.__session().game.gyuwon.years.mode==='curtain':window.__session().game.gyuwon.years.year===y+1,y,{timeout:15000});
  assert.equal(await page.evaluate(()=>window.__session().game.boss.hp),[5300,4600,3900,3200,2500,1800,800][y-5]);
 }
 await page.waitForFunction(()=>window.__media.some(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop),{timeout:10000});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=25;window.__session().game.gyuwon.years.musical.time=25;});
 await page.waitForTimeout(500);await page.screenshot({path:'qa-output/musical/ending-question.png'});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-.12;});
 await page.waitForFunction(()=>window.__session().game.status==='won',{timeout:10000});
 assert.equal(await page.evaluate(()=>window.__session().game.stats.damage),0);
 await page.evaluate(async()=>{window.__battle.close();window.__finale=(await import('./src/journey-finale.mjs')).playJourneyFinale(document,window);});
 await page.waitForTimeout(1800);await page.screenshot({path:'qa-output/musical/finale-seals.png'});
 await page.waitForTimeout(6500);await page.screenshot({path:'qa-output/musical/finale-corridor.png'});
 assert.equal(await page.evaluate(()=>window.__finale.finished),true);console.log('Verified finale');assert.equal(await page.locator('.od-final').count(),0);
 // The actual touch layout shares the same controls and bilingual captions.
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(async()=>{window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({configure(g){g.gyuwon.years.year=8;g.boss.hp=3900;g.player.invuln=1e6;}});});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.musical?.time>5,{timeout:90000});
 await page.screenshot({path:'qa-output/musical/mobile-rhythm.png'});
 const boxes=await page.evaluate(()=>{const r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;return ['.gy-musical-dialogue','.gy-musical-actions','.gy-musical-beat','#boss-hud'].map(q=>{const a=r.querySelector(q),b=a.getBoundingClientRect();return {q,x:b.x,y:b.y,w:b.width,h:b.height,hidden:a.hidden};});});
 for(const b of boxes)if(!b.hidden)assert.ok(b.x>=0&&b.x+b.w<=845&&b.y>=0&&b.y+b.h<=391,JSON.stringify(b));
 await page.evaluate(()=>window.__battle.close());
 assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/musical/browser-report.json',JSON.stringify({results,boxes,errors},null,2));console.log('PASS: seven native music endings, exact HP, real input, pause/mute, sad ending, corridor, compact layout');
}finally{await browser.close();await new Promise(r=>server.close(r));}
