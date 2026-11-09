import {GYUWON_PERFORMANCE_ROUTE,gyuwonNextPerformance} from '../src/gyuwon-musical-route.mjs';
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
 // The visual test seeks over the non-skippable musical overture because software
 // WebGL in CI cannot reliably render six seconds of scene time in real time.
 // Engine tests cover the complete natural intro and action delay.
 await page.waitForFunction(()=>window.__media.some(a=>a.src.includes('Welcome')&&!a.paused),null,{timeout:30000});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('Welcome')&&!a.paused);if(!a)throw Error('5수 song missing');a.currentTime=8.5;});
 await page.waitForFunction(()=>{const m=window.__session()?.game?.gyuwon?.years?.musical;return m?.year===5&&m?.time>=8&&m?.transition<=.01&&m?.turn==='player';},null,{timeout:30000});
 const attack=page.locator('#gyuwon-battle').locator('[data-musical-action="light"]');await attack.click({force:true});
 await page.waitForFunction(()=>!!window.__session().game.gyuwon.years.musical.actorMotion,null,{timeout:12000});
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
 for(const y of GYUWON_PERFORMANCE_ROUTE){
  await page.waitForFunction(y=>window.__session().game.gyuwon.years.year===y&&window.__session().game.gyuwon.years.musical.time>3,y,{timeout:15000});
  await page.screenshot({path:`qa-output/musical/act-${y}.png`,timeout:30000});console.log('Verified act',y);
  results.push(await page.evaluate(()=>{const s=window.__session();return {year:s.game.gyuwon.years.year,hp:s.game.boss.hp,clock:s.game.gyuwon.years.musical.clock,graphics:s.diagnostics()};}));
  assert.equal(results.at(-1).graphics.livingDoodle.applied,true,'all retained acts share colored ink');
  if(y===5){
   // End of the 3D show must open the actual luminous path before 6수.
   await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-11;});
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.time>160,null,{timeout:15000});
   await page.screenshot({path:'qa-output/musical/act-5-curtain-to-road.png',timeout:30000});
  }
  if(y===6){
   const entrance=await page.evaluate(()=>{
    const r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
    const s=window.__session(),m=s.game.gyuwon.years.musical;
    return {weapon:s.game.weapon,biome:m.runnerBiome,canvas:r.querySelector('.gy-reference-canvas')?.hidden,
      opacity:parseFloat(r.querySelector('.gy-reference-canvas')?.style.opacity||'1'),
      dash:!!r.querySelector('[data-musical-action="dash"]')};
   });
   assert.equal(entrance.weapon,'sword','keep the original knight weapon');
   assert.equal(entrance.biome,'theater');
   assert.equal(entrance.canvas,false);
   assert.equal(entrance.dash,true);
   assert.ok(entrance.opacity>=0&&entrance.opacity<=1);
   await page.screenshot({path:'qa-output/musical/act-6-ink-to-knight.png',timeout:30000});
   await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=145;});
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.runnerBiome==='skyroad',null,{timeout:15000});
   await page.screenshot({path:'qa-output/musical/act-6-skyroad.png',timeout:30000});
  }

  if(y===11){
   assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.curtainCall.actor),'kwon');
   await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=110;});
   await page.waitForFunction(()=>window.__session().game.gyuwon.years.musical.curtainCall?.mode==='credits',{timeout:12000});
   const closing=await page.evaluate(()=>{const shell=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
    const g=window.__session().game,m=g.gyuwon.years.musical;
    return {credits:!shell.querySelector('.gy-curtain-credits').hidden,red:shell.querySelector('#vignette')?getComputedStyle(shell.querySelector('#vignette'),'::after').backgroundImage:null,
     hero:{x:g.player.x,z:g.player.z},hazards:m.finaleHazards.length,actions:getComputedStyle(shell.querySelector('.gy-musical-actions')).display,year:m.year};});
   assert.equal(closing.credits,true);assert.equal(closing.hazards,0);
   assert.equal(closing.actions,'none');assert.equal(closing.red,'none');
   assert.equal(closing.hero.x,0);assert.equal(closing.hero.z,5);
   await page.screenshot({path:'qa-output/musical/act-11-credits.png',timeout:30000});
  }
  await page.evaluate(y=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);if(!a)throw Error('missing playing master '+y);a.currentTime=a.duration-.12;},y);
  await page.waitForFunction(({y,next})=>y===11?window.__session().game.gyuwon.years.mode==='curtain':window.__session().game.gyuwon.years.year===next,{y,next:gyuwonNextPerformance(y)},{timeout:15000});
  assert.equal(await page.evaluate(()=>window.__session().game.boss.hp),[5300,4600,3900,3200,2500,1800,800][y-5]);
 }
 await page.waitForFunction(()=>window.__media.some(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop),{timeout:10000});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=8;});
 await page.waitForFunction(()=>{const r=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  return r?.querySelector('.gy-dedication')?.textContent==='거미 배역 이권재'&&!r.querySelector('.gy-dedication').hidden;},{timeout:10000});
 await page.screenshot({path:'qa-output/musical/ending-cast-dedication.png'});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=25;window.__session().game.gyuwon.years.musical.time=25;});
 await page.waitForTimeout(500);await page.screenshot({path:'qa-output/musical/ending-question.png'});
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-.12;});
 await page.waitForFunction(()=>window.__session().game.status==='won',{timeout:10000});
 assert.equal(await page.evaluate(()=>window.__session().game.stats.damage),0);
 await page.evaluate(async()=>{window.__battle.close();window.__finale=(await import('./src/journey-finale.mjs')).playJourneyFinale(document,window);});
 await page.waitForTimeout(1800);await page.screenshot({path:'qa-output/musical/finale-seals.png'});
 await page.waitForTimeout(6500);await page.screenshot({path:'qa-output/musical/finale-corridor.png'});
 await page.waitForFunction(()=>window.__finale.finished,null,{timeout:60000});assert.equal(await page.evaluate(()=>window.__finale.finished),true);console.log('Verified finale');assert.equal(await page.locator('.od-final').count(),0);
 // The actual touch layout shares the same controls and bilingual captions.
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(async()=>{window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({configure(g){g.gyuwon.years.year=8;g.boss.hp=3900;g.player.invuln=1e6;}});});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.musical?.time>5,{timeout:90000});
 await page.screenshot({path:'qa-output/musical/mobile-rhythm.png'});
 const boxes=await page.evaluate(()=>{const r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;return ['.gy-musical-dialogue','.gy-musical-actions','.gy-musical-beat','#boss-hud'].map(q=>{const a=r.querySelector(q),b=a.getBoundingClientRect();return {q,x:b.x,y:b.y,w:b.width,h:b.height,hidden:a.hidden};});});
 for(const b of boxes)if(!b.hidden)assert.ok(b.x>=0&&b.x+b.w<=845&&b.y>=0&&b.y+b.h<=391,JSON.stringify(b));
 await page.evaluate(()=>window.__battle.close());
 assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/musical/browser-report.json',JSON.stringify({results,boxes,errors},null,2));console.log('PASS: retained native music endings, exact HP, real input, pause/mute, sad ending, corridor, compact layout');
}finally{await browser.close();await new Promise(r=>server.close(r));}
