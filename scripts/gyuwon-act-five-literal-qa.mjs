import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {chromium} from 'playwright-core';
const root=process.cwd(),port=8157;
const server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(root+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const size=fs.statSync(f).size,mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg'};res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let a=0,b=size-1;if(range){a=+range[1];b=range[2]?Math.min(+range[2],b):b;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});}else res.setHeader('Content-Length',size);fs.createReadStream(f,{start:a,end:b}).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1');
fs.mkdirSync('qa-output/literal',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':chromium.executablePath()),headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});

const errors=[],reports=[],beforeSource=process.env.GYUWON_LITERAL_COMPARE==='1'&&fs.existsSync('qa-output/literal-before-source.json')?JSON.parse(fs.readFileSync('qa-output/literal-before-source.json','utf8')):null;
async function launch(mode,mobile=false){
 const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:800},hasTouch:mobile});page.on('pageerror',e=>errors.push(e.stack));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',r=>r.fulfill({path:path.resolve('node_modules/three/build',new URL(r.request().url()).pathname.split('/').at(-1)),contentType:'text/javascript'}));
 if(mode==='before')await page.route('**/src/*.mjs*',r=>{const body=beforeSource[new URL(r.request().url()).pathname];return body?r.fulfill({body,contentType:'text/javascript'}):r.continue();});
 await page.addInitScript(()=>{const Native=window.Audio;window.__media=[];window.Audio=function(...args){const a=new Native(...args);window.__media.push(a);return a;};window.Audio.prototype=Native.prototype;});
 await page.goto('http://127.0.0.1:'+port+'/spider-combat.html',{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(async()=>{document.getElementById('journey').close();window.__read=(await import('./src/battle-session.mjs')).readBattleSession;window.__battle=(await import('./src/gyuwon-battle.mjs')).launchGyuwonBattle({diagnostics:true,configure(g){g.gyuwon.years.year=5;g.boss.hp=6000;g.player.invuln=1e6;g.startGrace=0;}});window.__session=()=>window.__read(document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot);});
 await page.waitForFunction(()=>window.__session()?.active&&window.__media.some(a=>!a.paused&&a.src.includes('Welcome')),null,{timeout:120000});return page;
}
async function sample(page,time,label,mode,mobile=false){
 await page.evaluate(time=>{const m=window.__session().game.gyuwon.years.musical;m.turn='player';m.turnActor='ally0';m.actorMotion=null;m.raidAttack=null;const a=window.__media.find(a=>!a.paused&&a.src.includes('Welcome'));a.currentTime=time;},time);
 await page.waitForFunction(t=>window.__session().game.gyuwon.years.musical.time>=t,time,{timeout:20000});await page.waitForTimeout(650);
 await page.screenshot({path:'qa-output/literal/'+mode+(mobile?'-touch':'')+'-'+label+'.png',timeout:60000});
 const row=await page.evaluate(()=>{const s=window.__session(),m=s.game.gyuwon.years.musical;return {time:m.time,gesture:m.songPerformance.gesture,hands:m.enemies.slice(0,2).map(e=>({x:e.x,y:e.y,z:e.z})),graphics:s.diagnostics()};});reports.push({mode,mobile,label,...row});console.log(mode,mobile?'touch':'desktop',label);
 if(mode==='after'){assert.equal(row.graphics.livingDoodle.applied,true);if(label==='flight')assert.equal(row.graphics.reference3d.acting.wings.visible,true);else assert.equal(row.graphics.reference3d.acting.wings.visible,false);if(label==='together')assert.ok(row.hands[0].x>3&&row.hands[1].x< -3);if(label==='hand')assert.ok(row.hands[1].z>-8);}
}
try{
 for(const mode of beforeSource?['before','after']:['after']){const page=await launch(mode);for(const [t,label]of [[14,'door'],[35,'wipe'],[55,'dance'],[68.5,'flight'],[71.4,'hand'],[75,'together']])await sample(page,t,label,mode);
  if(mode==='after'){
   await page.keyboard.press('Escape');const time=await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__session().game.gyuwon.years.musical.time),time);await page.evaluate(()=>document.getElementById('gyuwon-battle').firstElementChild.shadowRoot.getElementById('resume').click());
   await page.evaluate(()=>{const m=window.__session().game.gyuwon.years.musical;m.turn='player';m.turnActor='ally2';m.actorMotion=null;});const hp=await page.evaluate(()=>window.__session().game.gyuwon.years.musical.enemies[0].hp);
   await page.locator('#gyuwon-battle').locator('[data-musical-action="target0"]').click({force:true});await page.locator('#gyuwon-battle').locator('[data-musical-action="light"]').click({force:true});await page.waitForFunction(hp=>window.__session().game.gyuwon.years.musical.enemies[0].hp<hp,hp,{timeout:15000});
   await page.evaluate(()=>{const a=window.__media.find(a=>!a.paused&&a.src.includes('Welcome'));a.currentTime=a.duration-.12;});await page.waitForFunction(()=>window.__session().game.gyuwon.years.year===6,null,{timeout:30000});
  }await page.evaluate(()=>window.__battle.close());await page.close();
 }
 const touch=await launch('after',true);for(const [t,label]of [[68.5,'flight'],[71.4,'hand'],[75,'together']])await sample(touch,t,label,'after',true);await touch.evaluate(()=>window.__battle.close());await touch.close();
 assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/literal/report.json',JSON.stringify({reports,errors},null,2));console.log('PASS literal wings, reach, embrace, continued contact, pause, original song end, desktop and touch');
}finally{await browser.close();await new Promise(r=>server.close(r));}
