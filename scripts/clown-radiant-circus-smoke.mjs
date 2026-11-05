import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium unavailable');
await mkdir('artifacts/clown-radiant-circus',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 page.on('console',m=>{if(m.type()==='error'&&/Battle frame failed|WebGL.*(error|failed)/i.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#arena',{timeout:30000});
 const launched=await page.evaluate(async()=>{
  const {launchClownBattle}=await import('./src/clown-battle.mjs');
  window.__radiantCircus=launchClownBattle({practice:true,configure(g){
   g.player.invuln=1e6;g.startGrace=0;g.clown.wait=100;window.__radiantGame=g;
  }});
  return Boolean(window.__radiantCircus);
 });
 assert.equal(launched,true,'clown battle failed to initialize');
 await page.locator('#clown-battle #world').waitFor({state:'visible',timeout:30000});
 await page.waitForTimeout(1200);
 const first=await page.evaluate(()=>{
  const canvas=document.querySelector('#clown-battle')?.firstElementChild?.shadowRoot?.querySelector('canvas');
  const bounds=canvas?.getBoundingClientRect();
  return {phase:window.__radiantGame?.boss?.phase,canvas:{width:bounds?.width,height:bounds?.height},status:window.__radiantGame?.status};
 });
 assert.equal(first.phase,1);assert.equal(first.status,'playing');
 assert.ok(first.canvas.width>500&&first.canvas.height>250);
 assert.deepEqual(errors,[],'phase-one render errors');
 await page.screenshot({path:'artifacts/clown-radiant-circus/phase-one-golden-matinee.png'});
 await page.evaluate(()=>{const g=window.__radiantGame;g.boss.phase=2;g.boss.state='clown';g.clown.wait=99;});
 await page.waitForTimeout(900);
 assert.equal(await page.evaluate(()=>window.__radiantGame?.boss?.phase),2);
 assert.deepEqual(errors,[],'phase-two render errors');
 await page.screenshot({path:'artifacts/clown-radiant-circus/phase-two-mad-encore.png'});
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(450);
 const landscape=await page.evaluate(()=>{
  const canvas=document.querySelector('#clown-battle')?.firstElementChild?.shadowRoot?.querySelector('canvas');
  const r=canvas?.getBoundingClientRect();return {width:r?.width,height:r?.height};
 });
 assert.ok(landscape.width>280&&landscape.height>120,'landscape canvas collapsed');
 await page.screenshot({path:'artifacts/clown-radiant-circus/mobile-landscape.png'});
 assert.deepEqual(errors,[]);
 console.log('RADIANT CIRCUS WEBGL',JSON.stringify({first,landscape,errors}));
 await page.evaluate(()=>window.__radiantCircus?.close?.());
 await page.locator('#clown-battle').waitFor({state:'detached',timeout:5000});
}finally{await browser.close();}
