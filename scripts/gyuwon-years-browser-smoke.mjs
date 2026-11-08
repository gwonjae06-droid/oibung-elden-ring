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
 // This regression used to be invisible: Gyuwon's simulation emitted player
 // shots correctly but never installed the common visual projectile layer.
 // Exercise all four renderer branches in the live WebGL battle.
 await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const g=window.readYearSession(root).game,p=g.player;
  for(const [i,kind] of ['bow','cards','wave','hammer-throw'].entries()){
   g.projectiles.push({id:g.nextId++,kind,x:p.x+(i-1.5)*2.0,
    y:p.floorY+1.45,z:p.z-2.5-i*.6,yaw:Math.PI,life:8,
    speed:0,damage:0,skill:false});
  }
 });
 await page.waitForFunction(()=>{
  const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  return window.readYearSession(root)?.diagnostics()?.projectiles?.active===4;
 },{},{timeout:15000});
 const projectileState=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const session=window.readYearSession(root);
  return {simulation:session.game.projectiles.map(p=>p.kind),
   renderer:session.diagnostics().projectiles};
 });
 assert.deepEqual(projectileState.simulation,['bow','cards','wave','hammer-throw']);
 assert.equal(projectileState.renderer.active,4,'all four visual projectile types must appear');
 await page.screenshot({path:'artifacts/gyuwon-years/player-projectiles-visible.png'});
 await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  window.readYearSession(root).game.projectiles.length=0;
 });
 await page.waitForFunction(()=>{
  const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  return window.readYearSession(root)?.diagnostics()?.projectiles?.active===0;
 },{},{timeout:15000});
 // Verify that the actual live battle input, not just the shared free-look
 // helper, changes the camera when Q unlocks target tracking.
 const beforeFreeLook=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  return window.readYearSession(root).diagnostics().camera;
 });
 await page.keyboard.press('q');
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.getElementById('lock-label')?.textContent?.includes('카메라 자유'));
 await page.evaluate(()=>{
  const canvas=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot.getElementById('world');
  canvas.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,composed:true,movementX:175,movementY:0}));
 });
 await page.waitForFunction(before=>{
  const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  const now=window.readYearSession(root)?.diagnostics()?.camera;
  return now&&Math.hypot(now.x-before.x,now.z-before.z)>1;
 },beforeFreeLook,{timeout:12000});
 await page.keyboard.press('q');
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.getElementById('lock-label')?.textContent?.includes('카메라 록온'));
 // QA-only deterministic state injection: no cutscene skip is exposed to players.
 await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const {damageGyuwon}=await import('./src/gyuwon-combat.mjs');
  const g=readBattleSession(document.getElementById('gyuwon-battle').firstElementChild.shadowRoot).game;
  g.boss.maxHp=7000;g.boss.hp=7000;
  damageGyuwon(g,5000);
  const e=g.gyuwon.years;
  if(!(e.damageBank>0))throw Error('Exam carry QA did not produce deferred damage');
  e.mode='combat';e.season=48;e.signatureUsed=true;e.day=0;e.cast=null;e.recover=0;
  g.boss.state='recovery';g.gyuwon.hazards.length=0;
 });
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.querySelector('.gy-dday-clock')?.textContent==='수능 당일',{},{timeout:15000});
 const examHp=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const g=window.readYearSession(root).game;
  return {hp:g.boss.hp,bank:g.gyuwon.years.damageBank};
 });
 assert.equal(examHp.bank,0,'prior damage must be settled before the exam reward');
 await page.screenshot({path:'artifacts/gyuwon-years/suneung-exam.png'});
 await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const {resolveGyuwonExamGrade}=await import('./src/gyuwon-years.mjs');
  const g=readBattleSession(document.getElementById('gyuwon-battle').firstElementChild.shadowRoot).game;
  resolveGyuwonExamGrade(g,.08);
 });
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot?.querySelector('.gy-dday-hero')?.textContent==='수능 대성공',{},{timeout:12000});
 const gradeHp=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  return window.readYearSession(root).game.boss.hp;
 });
 assert.ok(Math.abs(gradeHp-(examHp.hp+350))<.001,
  'a successful Suneung must visibly restore 5% of the actual 7000 boss HP');
 await page.screenshot({path:'artifacts/gyuwon-years/grade-great.png'});
 await page.waitForFunction(()=>document.getElementById('gyuwon-battle')
  ?.firstElementChild?.shadowRoot&&window.readYearSession(document.getElementById('gyuwon-battle')
   .firstElementChild.shadowRoot)?.game?.gyuwon?.years?.year===2,{},{timeout:45000}).catch(async error=>{
  console.error('Year-transition state',await page.evaluate(()=>{const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot,s=root&&window.readYearSession(root);return {active:s?.active,time:s?.game?.time,years:s?.game?.gyuwon?.years,diagnostics:s?.diagnostics()};}),errors);throw error;
 });
 const carriedHp=await page.evaluate(()=>{
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const g=window.readYearSession(root).game;
  return {hp:g.boss.hp,visible:root.getElementById('boss-value').textContent};
 });
 assert.ok(Math.abs(carriedHp.hp-gradeHp)<.001,
  'the next-year transition cannot erase a successful examination recovery');
 assert.match(carriedHp.visible,/\d/,'the rendered boss HP value must be visible');
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
 // Shader warmup may delay the first visible frame after direct QA
 // state injection. Wait for the actual UI update, not a fixed 420ms.
 await page.waitForFunction(()=>{
  const root=document.getElementById('gyuwon-battle')?.firstElementChild?.shadowRoot;
  return root?.querySelector('.gy-dday-chat')?.hidden===false;
 },{},{timeout:20000});
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
 await showYear(9,'recallAll','tsunami');
 await page.waitForTimeout(850);snap=await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.getElementById('gyuwon-battle').firstElementChild.shadowRoot;
  const s=readBattleSession(root),g=s.game;
  return {year:g.gyuwon.years.year,hazards:g.gyuwon.hazards.length,
   map:s.diagnostics()?.view?.recall?.active,frameMs:s.diagnostics()?.frameMs?.slice(-120)};
 });
 assert.equal(snap.year,9);assert.ok(snap.hazards>=8);
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

