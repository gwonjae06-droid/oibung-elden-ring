import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=process.env.EDGE_PATH||which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium/Chrome missing on runner');
await mkdir('artifacts/gyuwon-years',{recursive:true});
const browser=await chromium.launch({
 executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',error=>errors.push(error.stack||String(error)));
 page.on('console',msg=>{if(msg.type()==='error'&&/Gyuwon frame failed|WebGL.*(error|failed)/i.test(msg.text()))errors.push(msg.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>{
  const basename=new URL(route.request().url()).pathname.split('/').at(-1);
  return route.fulfill({path:resolve('node_modules/three/build',basename),contentType:'text/javascript'});
 });
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});await page.waitForTimeout(200);await page.evaluate(()=>document.getElementById('journey')?.close());
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 const opened=await page.evaluate(async()=>{
  const {launchGyuwonBattle}=await import('./src/gyuwon-battle.mjs');
  window.__yearQa=launchGyuwonBattle({weapon:'sword',diagnostics:true,configure(g){
   g.player.invuln=1e5;g.startGrace=0;
  }});
  return Boolean(window.__yearQa);
 });
 assert.equal(opened,true);
 await page.evaluate(async()=>{window.readYearSession=(await import('./src/battle-session.mjs')).readBattleSession;});
 await page.waitForFunction(()=>{
  const readBattleSession=window.readYearSession;
  const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  return !!(root&&readBattleSession(root)?.active);
 },{},{timeout:55000});
 await page.waitForTimeout(300);
 let snap=await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const g=readBattleSession(root).game;
  return {year:g.gyuwon.years?.year,clock:root.querySelector('.gy-dday-clock')?.textContent,
   hero:root.querySelector('.gy-dday-hero')?.textContent,view:readBattleSession(root).diagnostics().view};
 });
 assert.equal(snap.year,1);
 assert.match(snap.clock,/수능까지 D-\d+/);
 await page.screenshot({path:'artifacts/gyuwon-years/hyeonyeok-desktop.png'});
 // QA-only deterministic state injection: no cutscene skip is exposed to players.
 await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const g=readBattleSession(document.getElementById('gyuwon-battle').firstElementChild.shadowRoot).game;
  const e=g.gyuwon.years;e.mode='combat';e.season=48;e.signatureUsed=true;e.day=0;e.cast=null;e.recover=0;
  g.boss.state='recovery';g.gyuwon.hazards.length=0;
 });
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.querySelector('.gy-dday-clock')?.textContent==='수능 당일',{},{timeout:15000});
 await page.screenshot({path:'artifacts/gyuwon-years/suneung-exam.png'});
 await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const {resolveGyuwonExamGrade}=await import('./src/gyuwon-years.mjs');
  const g=readBattleSession(document.getElementById('gyuwon-battle').firstElementChild.shadowRoot).game;
  resolveGyuwonExamGrade(g,.08);
 });
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.querySelector('.gy-dday-hero')?.textContent==='수능 대성공',{},{timeout:12000});
 await page.screenshot({path:'artifacts/gyuwon-years/grade-great.png'});
 async function showYear(year,cast,memory='sword'){
  return page.evaluate(async({year,cast,memory})=>{
   const {readBattleSession}=await import('./src/battle-session.mjs');
   const {startGyuwonYearCast}=await import('./src/gyuwon-years.mjs');
   const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
   const session=readBattleSession(root),g=session.game,e=g.gyuwon.years;
   e.mode='combat';e.year=year;e.season=1;e.day=352;e.recover=1;e.cast=null;
   e.bannerUntil=g.time+2;g.boss.phase=year>=9?3:1;
   g.boss.state='recovery';g.gyuwon.stageMemory=year>=9?memory:null;
   g.gyuwon.stageTime=.7;g.gyuwon.hazards.length=0;
   const started=startGyuwonYearCast(g,cast);
   if(!started)throw Error('Could not activate '+year+'/'+cast);
   return {year,cast,view:session.diagnostics().view};
  },{year,cast,memory});
 }
 await showYear(4,'sniper');
 await page.waitForTimeout(420);await page.screenshot({path:'artifacts/gyuwon-years/sasu-firearms.png'});
 await showYear(5,'sewageWave');
 await page.waitForTimeout(430);await page.screenshot({path:'artifacts/gyuwon-years/osu-sewage-wave.png'});
 await showYear(7,'donation');
 await page.waitForTimeout(420);
 const chatState=await page.locator('#gyuwon-battle').evaluate(async el=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=el.firstElementChild.shadowRoot,session=readBattleSession(root);
  const game=session?.game,chat=root.querySelector('.gy-dday-chat');
  return {chatHidden:chat?.hidden,chatText:chat?.textContent,
   status:game?.status,year:game?.gyuwon?.years?.year,
   cast:game?.gyuwon?.years?.cast,castT:game?.gyuwon?.years?.castT,
   mode:game?.gyuwon?.years?.mode,active:session?.active};
 });
 assert.equal(chatState.chatHidden,false,
  'Gyuwon year-seven chat should be visible: '+JSON.stringify({chatState,errors}));
 await page.screenshot({path:'artifacts/gyuwon-years/chilsu-live-chat.png'});
 await showYear(8,'octoStrike');
 await page.waitForTimeout(420);
 assert.equal(await page.evaluate(()=>{
  const r=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  return r&&!!r.querySelector('.gy-dday-clock')?.textContent;
 }),true);
 await page.screenshot({path:'artifacts/gyuwon-years/palsu-octopus.png'});
 await showYear(11,'recallAll','tsunami');
 await page.waitForTimeout(850);snap=await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const s=readBattleSession(root),g=s.game;
  return {year:g.gyuwon.years.year,hazards:g.gyuwon.hazards.length,
   map:s.diagnostics()?.view?.recall?.active,frameMs:s.diagnostics()?.frameMs?.slice(-120)};
 });
 assert.equal(snap.year,11);assert.ok(snap.hazards>=8);
 assert.ok(snap.map?.includes('tsunami'),'real cathedral stage did not appear');
 await page.screenshot({path:'artifacts/gyuwon-years/sibilsu-combined-arena.png'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(480);
 const mobile=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const clock=root.querySelector('.gy-dday-clock')?.getBoundingClientRect();
  const canvas=root.getElementById('world')?.getBoundingClientRect();
  return {clock:clock?.toJSON(),canvas:canvas?.toJSON(),width:innerWidth,height:innerHeight};
 });
 assert.ok(mobile.canvas?.width>250&&mobile.canvas?.height>120);
 assert.ok(mobile.clock?.top>=0&&mobile.clock?.bottom<mobile.height);
 await page.screenshot({path:'artifacts/gyuwon-years/mobile-landscape.png'});
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.__yearQa?.close?.());
 console.log('GYUWON_DDAY_BROWSER_SMOKE',JSON.stringify({snap:{...snap,frameMs:snap.frameMs?.slice(-4)},mobile,errors}));
}finally{await browser.close();}

