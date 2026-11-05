import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium is not available');
await mkdir('artifacts/blood-cathedral',{recursive:true});
const browser=await chromium.launch({
 executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
});
const errors=[];
let page;
try{
 page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',error=>errors.push(error.stack||String(error)));
 page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource/.test(m.text()))errors.push(m.text());});
 // Use the same pinned Three.js source without relying on a CDN connection.
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>{const filename=new URL(route.request().url()).pathname.split('/').at(-1);return route.fulfill({path:'node_modules/three/build/'+filename,contentType:'text/javascript'});});
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#arena',{timeout:20000});
 const opened=await page.evaluate(async()=>{
  const {launchBloodBattle}=await import('./src/blood-battle.mjs');
  window.__sacredBlood=launchBloodBattle({diagnostics:true,configure:g=>{
   g.player.hp=g.player.maxHp=1e7;g.blood.recover=1e6;g.startGrace=0;
  }});
  return !!window.__sacredBlood;
 });
 assert.equal(opened,true);
 await page.waitForFunction(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
  return !!(root&&readBattleSession(root)?.active);
 },null,{timeout:40000});
 const report=()=>page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
  const session=readBattleSession(root),game=session.game,d=session.diagnostics();
  const dlg=document.querySelector('#blood-battle'),shell=root.getElementById('arena'),canvas=root.getElementById('world');
  const info=el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,width:r.width,height:r.height};};
  return {phase:game.boss.phase,status:game.status,dialogOpen:dlg.open,isModal:dlg.matches(':modal'),menuDisplay:getComputedStyle(root.getElementById('menu')).display,dialog:info(dlg),shell:info(shell),canvas:info(canvas),top:document.elementsFromPoint(innerWidth/2,innerHeight/2).slice(0,4).map(x=>x.id||x.tagName),
   geometry:d.graphics?.geometries??d.graphics?.geometry??0,
   drawCalls:d.calls,cathedral:d.view?.cathedral};
 });
 const initial=await report();
 assert.equal(initial.cathedral?.windows,12,'desktop must show all windows');
 assert.ok(initial.drawCalls>0,'real WebGL frame did not render');
 assert.equal(initial.dialogOpen,true,'the boss battle dialog must be open');
 assert.equal(initial.menuDisplay,'none','the cloned main menu must not obscure the battle');
 await page.screenshot({path:'artifacts/blood-cathedral/phase1-white-cathedral.png'});
 await page.locator('#blood-battle #world').screenshot({path:'artifacts/blood-cathedral/raw-canvas-phase1.png'});
 await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.querySelector('#blood-battle').firstElementChild.shadowRoot;
  const g=readBattleSession(root).game;
  g.boss.phase=2;g.blood.transitioned=true;g.boss.state='recovery';g.blood.recover=1e6;g.blood.t=0;
 });
 await page.waitForTimeout(600);
 const transformed=await report();
 assert.equal(transformed.phase,2);
 await page.screenshot({path:'artifacts/blood-cathedral/phase2-blood-angel.png'});
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(400);
 await page.screenshot({path:'artifacts/blood-cathedral/mobile-landscape.png'});
 const result=await report();assert.ok(Number.isFinite(result.drawCalls));
 assert.deepEqual(errors,[],'WebGL/JavaScript errors in cathedral fight');
 console.log('SACRED CATHEDRAL BROWSER SMOKE',JSON.stringify({initial,transformed,result,errors}));
 await page.evaluate(()=>window.__sacredBlood?.close?.());
}finally{await page?.close();await browser.close();}
