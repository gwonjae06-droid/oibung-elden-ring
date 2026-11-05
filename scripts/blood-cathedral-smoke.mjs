import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium missing on runner');
await mkdir('artifacts/blood-cathedral',{recursive:true});
const browser=await chromium.launch({
 executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(error.stack||String(error)));
 page.on('console',message=>{if(message.type()==='error'&&/Blood frame failed|WebGL.*(error|failed)/i.test(message.text()))errors.push(message.text());});
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#arena',{timeout:30000});
 const launched=await page.evaluate(async()=>{
  const {launchBloodBattle}=await import('./src/blood-battle.mjs');
  window.__sacredCathedral=launchBloodBattle({diagnostics:true,configure(g){
   g.player.hp=g.player.maxHp=1000000;g.startGrace=0;g.blood.recover=1e6;
  }});
  return Boolean(window.__sacredCathedral);
 });
 assert.equal(launched,true,'blood battle did not open');
 await page.locator('#blood-battle').waitFor({state:'visible',timeout:30000});
 await page.waitForTimeout(2100);
 assert.equal(errors.length,0,'render error in sacred white cathedral: '+errors.join(' / '));
 const desktop=await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const root=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
  const canvas=root?.querySelector('canvas'),session=readBattleSession(root);
  const rect=canvas?.getBoundingClientRect();
  if(!session||!rect||rect.width<400||rect.height<200)throw Error('blood renderer canvas invalid');
  return {canvas:{width:rect.width,height:rect.height},graphics:session.diagnostics()?.graphics,phase:session.game.boss.phase};
 });
 assert.equal(desktop.phase,1);
 await page.screenshot({path:'artifacts/blood-cathedral/phase-one-white-nave.png'});
 const changed=await page.evaluate(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const session=readBattleSession(document.querySelector('#blood-battle').firstElementChild.shadowRoot);
  const g=session.game;
  g.boss.phase=2;g.boss.state='recovery';g.blood.transitioned=true;
  g.blood.recover=1e6;g.blood.phasePending=false;
  return g.boss.phase;
 });
 assert.equal(changed,2);
 await page.waitForTimeout(900);
 assert.equal(errors.length,0,'phase-two WebGL error: '+errors.join(' / '));
 await page.screenshot({path:'artifacts/blood-cathedral/phase-two-red-contrast.png'});
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(450);
 const mobile=await page.evaluate(()=>{
  const r=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
  const canvas=r?.querySelector('canvas'),box=canvas?.getBoundingClientRect();
  return {width:box?.width,height:box?.height,screen:{width:innerWidth,height:innerHeight}};
 });
 assert.ok(mobile.width>250&&mobile.height>120,'landscape battle viewport collapsed');
 await page.screenshot({path:'artifacts/blood-cathedral/mobile-landscape.png'});
 assert.deepEqual(errors,[]);
 console.log('SACRED CATHEDRAL SMOKE',JSON.stringify({desktop,mobile,errors}));
 await page.evaluate(()=>window.__sacredCathedral?.close?.());
}finally{await browser.close();}
