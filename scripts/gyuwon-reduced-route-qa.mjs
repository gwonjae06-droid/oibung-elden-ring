import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8152;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/reduced-route',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});

import {GYUWON_PERFORMANCE_ROUTE as ROUTE} from '../src/gyuwon-musical-route.mjs';
import {GYUWON_CURTAIN_CAST as CAST} from '../src/gyuwon-curtain-call.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
const errors=[],reports=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});page.on('pageerror',e=>{errors.push(e.stack);console.error(e.message);});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto('http://127.0.0.1:'+port+'/spider-combat.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.player.invuln=1e6;g.startGrace=0;}});window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 await page.waitForFunction(()=>window.__session()?.active,null,{timeout:120000});
 async function seek(time){await page.evaluate(time=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);if(!a)throw Error('no active song');a.currentTime=time;},time);await page.waitForFunction(time=>window.__session().game.gyuwon.years.musical.time>=time,time,{timeout:30000});}
 async function shot(name){await page.screenshot({path:'qa-output/reduced-route/'+name+'.png',timeout:60000});}
 for(const y of ROUTE){
  await page.waitForFunction(y=>window.__session().game.gyuwon.years.musical?.year===y&&window.__session().game.gyuwon.years.musical.time>2.5,y,{timeout:45000});
  console.log('ACT',y);if(y!==11)await seek(9);await shot('act-'+y);
  const report=await page.evaluate(()=>window.__session().diagnostics());reports.push({year:y,report});assert.equal(report.livingDoodle.applied,true);assert.equal(report.livingDoodle.source,[6,8,9].includes(y)?'canvas2d':'world');
  if(y===6){await page.keyboard.press('Space');await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.jumpCount)>0,true);}
  if(y===11){
   for(let i=0;i<CAST.length;i++){const a=CAST[i];for(let k=0;k<a.scenes.length;k++){const time=(a.start+(a.end-a.start)*(k+.4)/a.scenes.length)*180;const current=await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time);if(time>current)await seek(time);await shot('cast-'+a.id+'-phase-'+a.scenes[k].phase);const f=await page.evaluate(()=>window.__session().diagnostics().curtainEnsemble);assert.equal(f.actorIndex,i);assert.equal(f.phase,a.scenes[k].phase);}}
   await seek(116);await page.waitForTimeout(1500);await shot('ensemble-front');
   const d=await page.evaluate(()=>window.__session().diagnostics());assert.equal(d.curtainEnsemble.bosses,5);assert.equal(d.curtainEnsemble.players,4);assert.equal(d.curtainEnsemble.facingCamera,true);reports.push({ensemble:d});
   await page.keyboard.press('Escape');const paused=await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time),paused);await page.evaluate(()=>document.getElementById('gyuwon-battle').firstElementChild.shadowRoot.getElementById('resume').click());
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1200);await shot('ensemble-landscape');await page.setViewportSize({width:1280,height:800});
  }
  await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-.12;});
  const next=ROUTE[ROUTE.indexOf(y)+1];await page.waitForFunction(({y,next})=>y===11?window.__session().game.gyuwon.years.mode==='curtain':window.__session().game.gyuwon.years.year===next,{y,next},{timeout:45000});
  assert.equal(await page.evaluate(()=>window.__session().game.boss.hp),GYUWON_SONGS[y].target);
 }
 await page.waitForFunction(()=>window.__media.some(a=>a.src.includes('When')&&!a.paused),null,{timeout:20000});await seek(8);await shot('dedication');
 const loaded=await page.evaluate(()=>window.__media.map(a=>decodeURIComponent(a.src)));assert.equal(loaded.some(s=>s.includes('My Little Army')||s.includes('A Million Shooting')),false);
 await page.evaluate(()=>{const a=window.__media.find(a=>a.src.includes('/assets/music/')&&!a.paused&&!a.loop);a.currentTime=a.duration-.12;});await page.waitForFunction(()=>window.__session().game.status==='won',null,{timeout:30000});await page.evaluate(()=>window.__battle.close());
 await page.evaluate(async()=>{window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.player.invuln=1e6;g.startGrace=0;}});});
 await page.waitForFunction(()=>window.__session()?.active,null,{timeout:120000});await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>window.__session().diagnostics().livingDoodle.applied),true);await shot('year-one-ink');await page.evaluate(()=>window.__battle.close());assert.deepEqual(errors,[]);
 fs.writeFileSync('qa-output/reduced-route/browser-report.json',JSON.stringify({reports,errors},null,2));console.log('PASS retained route, full original music endings, ink, actual boss phases, 9 dancers, pause, landscape, ending');
}finally{await browser.close();await new Promise(r=>server.close(r));}
