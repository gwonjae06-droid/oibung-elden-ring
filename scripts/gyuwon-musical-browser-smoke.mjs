import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8'}).trim();}catch{return null;}};
const chrome=process.env.EDGE_PATH||which('google-chrome')||which('chromium')||which('chromium-browser');
if(!chrome)throw Error('Chromium not available');
await mkdir('artifacts/gyuwon-musical',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:chrome,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'
]});
const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',err=>errors.push(err.stack||String(err)));
 page.on('console',msg=>{if(msg.type()==='error'&&/Gyuwon frame failed|WebGL.*(error|failed)/i.test(msg.text()))errors.push(msg.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>{
  const asset=new URL(route.request().url()).pathname.split('/').at(-1);
  return route.fulfill({path:path.resolve('node_modules/three/build',asset),contentType:'text/javascript'});
 });
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(()=>{localStorage.setItem('oibung-muted','1');document.getElementById('journey')?.close();});
 const launched=await page.evaluate(async()=>{
  const {launchGyuwonBattle}=await import('./src/gyuwon-battle.mjs');
  window.readMusicalSession=(await import('./src/battle-session.mjs')).readBattleSession;
  window.musicalQa=launchGyuwonBattle({weapon:'sword',diagnostics:true,configure(g){
   g.player.invuln=1e5;const e=g.gyuwon.years;
   e.year=5;e.mode='combat';e.yearStartHp=g.boss.hp;
  }});
  return !!window.musicalQa;
 });
 assert.equal(launched,true);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 await page.waitForFunction(()=>{
  const d=document.querySelector('#gyuwon-battle'),root=d?.firstElementChild?.shadowRoot;
  const s=root&&window.readMusicalSession(root);
  return s?.active&&s.game.gyuwon.years?.mode==='musical'&&s.game.time>.01;
 },{},{timeout:120000});
 for(let year=5;year<=11;year++){
  const phase=await page.evaluate(async year=>{
   const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
   const session=readMusicalSession(root),g=session.game,e=g.gyuwon.years;
   const {annualFloorForYear}=await import('./src/gyuwon-annual-progress.mjs');
   e.year=year;e.mode='combat';e.musical=null;e.day=330;e.recover=0;
   e.yearStartHp=annualFloorForYear(g,year)+900;e.damageBank=0;e.grade=null;
   g.boss.hp=Math.min(g.boss.maxHp,annualFloorForYear(g,year)+850);
   g.boss.state='recovery';g.status='playing';g.gyuwon.hazards.length=0;
   const {stepGyuwon}=await import('./src/gyuwon-combat.mjs');
   stepGyuwon(g,1/60);
   const m=e.musical;
   if(!m)throw Error('Missing playable musical '+year);
   m.transition=0;
   const visible=!!root.querySelector('.gy-musical-layer')&&!root.querySelector('.gy-musical-layer').hidden;
   const clockHidden=root.querySelector('.gy-dday').hidden;
   const title=root.querySelector('#phase-label').textContent;
   return {year,kind:m.kind,visible,clockHidden,title,mode:e.mode,
    color:m.color,gameStatus:g.status};
  },year);
  assert.equal(phase.mode,'musical');assert.equal(phase.visible,true);
  assert.equal(phase.clockHidden,true);assert.equal(phase.gameStatus,'playing');
  await page.waitForTimeout(290);
  if([5,6,7,8,10,11].includes(year)){
   await page.screenshot({path:'artifacts/gyuwon-musical/act-'+year+'.png',timeout:25000});
  }
  if(year===5){
   await page.locator('#gyuwon-battle').locator('[data-musical-action="light"]').click();
   const next=await page.evaluate(()=>{
    const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot,g=readMusicalSession(root).game;
    return {turn:g.gyuwon.years.musical.turn,hits:g.stats.hits};
   });
   assert.equal(next.turn,'boss');assert.ok(next.hits>0);
  }
  if(year===7){
   await page.locator('#gyuwon-battle').locator('[data-musical-action="light"]').click();
   const count=await page.evaluate(()=>{
    const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot,g=readMusicalSession(root).game;
    return g.gyuwon.years.musical.units.length;
   });
   assert.ok(count>=1,'army buttons should spawn physical units');
  }
  if(year===9){
   const frame=await page.evaluate(()=>{
    const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
    const g=readMusicalSession(root).game;return {x:g.player.x,enemy:g.boss.x};
   });
   assert.ok(Number.isFinite(frame.x)&&Number.isFinite(frame.enemy));
  }
  if(year===10){
   await page.locator('#gyuwon-battle').locator('[data-musical-action="light"]').click();
   const shots=await page.evaluate(()=>{
    const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
    return readMusicalSession(root).game.gyuwon.years.musical.bullets.length;
   });
   assert.ok(shots>0);
  }
  results.push(phase);
 }
 await page.evaluate(async()=>{
  const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
  const g=readMusicalSession(root).game;
  const {damageGyuwon,stepGyuwon}=await import('./src/gyuwon-combat.mjs');
  g.boss.hp=825;g.gyuwon.years.musical.transition=0;
  damageGyuwon(g,900);stepGyuwon(g,1/30);
 });
 const curtain=await page.evaluate(()=>{
  const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
  const g=readMusicalSession(root).game;
  return {mode:g.gyuwon.years.mode,finishing:g.gyuwon.years.musical.finishing,hp:g.boss.hp};
 });
 assert.equal(curtain.mode,'curtain');assert.equal(curtain.finishing,true);assert.equal(curtain.hp,800);
 await page.screenshot({path:'artifacts/gyuwon-musical/final-curtain.png',timeout:25000});
 const diagnostics=await page.evaluate(()=>{
  const root=document.querySelector('#gyuwon-battle').firstElementChild.shadowRoot;
  return readMusicalSession(root).diagnostics();
 });
 assert.ok(diagnostics.calls>=0);
 await page.evaluate(async()=>{await musicalQa.close();});
 assert.equal(await page.locator('#gyuwon-battle').count(),0);
 assert.deepEqual(errors,[],'browser/runtime must have no uncaught frame errors');
 console.log('GYUWON MUSICAL WEBGL QA',JSON.stringify({
  phaseCount:results.length,genres:results.map(x=>x.kind),
  curtain,drawCalls:diagnostics.calls,errors
 }));
}finally{await browser.close();}
