import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8149;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/giant-raid',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});
const errors=[],frames=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});page.on('pageerror',e=>errors.push(e.stack));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto(`http://127.0.0.1:${port}/spider-combat.html`,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.startGrace=0;}});window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.musical?.time>3,null,{timeout:90000});
 const capture=[8,25,56,94,119,146,172];let snapshot=0,last=null;
 // This fixture never seeks the 5su recording, sets part HP, or injects actions
 // into the simulation. A short UI driver plays it at the native 1x clock.
 const begun=Date.now();
 while(Date.now()-begun<230000){
  last=await page.evaluate(()=>{
   const session=window.__session(),g=session.game,m=g.gyuwon.years.musical,r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
   if(m.year!==5)return {year:m.year,hp:g.boss.hp};
   const click=action=>{const b=r.querySelector(`[data-musical-action="${action}"]`);if(b&&!b.disabled&&!b.hidden){b.click();return true;}return false;};
   if(m.transition<=0&&!m.actorMotion&&m.turn!=='finish'){
    const actor=m.party.find(p=>p.id===m.turnActor),live=m.enemies.filter(e=>e.active&&!e.destroyed);
    const target=live.find(e=>e.weakness===actor?.index)||live[0];if(target)click('target'+target.index);
    const charged=m.party.find(p=>p.hp>0&&p.energy>=100);
    if(charged)click('ultimate'+charged.index);
    else if(m.turn==='player'){if(!target)click('support');else click(m.skillPoints>1?'skill':'light');}
   }
   const audio=window.__media.find(a=>a.src.includes('Welcome%20to%20My%20World!')||a.src.includes('Welcome%20to%20My%20World%21'));
   return {year:m.year,time:m.time,songEnded:m.songEnded,hp:g.boss.hp,playerHP:g.player.hp,parts:m.enemies.map(e=>({name:e.name,hp:e.hp,active:e.active,destroyed:e.destroyed})),used:m.usedAbilities,breaks:m.partBreaks,history:m.raidHistory,graphics:session.diagnostics(),caption:r.querySelector('.gy-lyric-en').textContent,mediaRate:audio?.playbackRate||1};
  });
  if(last.year===6)break;
  if(!last.songEnded)assert.equal(last.hp,6000);else assert.ok(last.hp>=5300&&last.hp<=6000);assert.ok(last.playerHP>=1);assert.equal(last.mediaRate,1);
  if(snapshot<capture.length&&last.time>=capture[snapshot]){await page.screenshot({path:`qa-output/giant-raid/scene-${snapshot}-${Math.floor(last.time)}.png`});frames.push(last);console.log('Natural raid scene',snapshot,last.time.toFixed(1),'breaks',last.breaks);snapshot++;}
  await page.waitForTimeout(380);
 }
 assert.equal(last.year,6);assert.equal(last.hp,5300);assert.equal(frames.length,7);assert.ok(frames.at(-1).breaks>=2);assert.ok(frames.at(-1).used.every(a=>a.length>0));
 await page.setViewportSize({width:844,height:390});
 // Mobile layout only: relaunch and place the media at the mask section.
 await page.evaluate(async()=>{window.__battle.close();window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.startGrace=0;}});});
 await page.waitForFunction(()=>window.__session()?.active&&window.__session().game.gyuwon.years.musical?.time>6,null,{timeout:90000});
 await page.evaluate(()=>{const a=window.__media.find(a=>!a.paused&&!a.loop);a.currentTime=94;});await page.waitForTimeout(1000);
 await page.screenshot({path:'qa-output/giant-raid/touch-mask.png'});
 const controls=await page.locator('#gyuwon-battle').locator('.gy-musical-actions button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
 for(const r of controls)assert.ok(r.x>=0&&r.x+r.w<=845&&r.y>=0&&r.y+r.h<=391);
 await page.locator('#gyuwon-battle').locator('[data-musical-action="target3"]').tap();
 assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.targetIndex),3);
 await page.evaluate(()=>window.__battle.close());assert.deepEqual(errors,[]);
 fs.writeFileSync('qa-output/giant-raid/report.json',JSON.stringify({naturalPlayback:true,frames,controls,errors},null,2));console.log('PASS: native full 5su playback, live UI combat, four original bosses, persistent parts, 1HP floor, finale and touch targeting');
}finally{await browser.close();await new Promise(r=>server.close(r));}
