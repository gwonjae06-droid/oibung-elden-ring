import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium/Chrome not installed on runner');
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>errors.push(e.stack||String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#arena',{timeout:30000});
 const opened=await page.evaluate(async()=>{
  const {launchDiceBattle}=await import('./src/dice-battle.mjs');
  window.__phase2Smoke=launchDiceBattle({startPhase:2});
  return !!window.__phase2Smoke;
 });
 assert.equal(opened,true,'phase-two battle should start');
 await page.waitForTimeout(10500);
 const result=await page.evaluate(()=>({closed:window.__phase2Smoke?.closed,dialog:!!document.getElementById('dice-battle'),open:!!document.getElementById('dice-battle')?.open}));
 console.log('PHASE2 SMOKE',JSON.stringify({result,errors:errors.slice(-10)}));
 assert.equal(result.closed,false,'phase-two runtime must not auto-close to main menu');
 assert.equal(result.dialog,true);
 assert.equal(result.open,true);
 assert.equal(errors.filter(x=>x.includes('Battle frame failed')).length,0);
 await page.evaluate(()=>window.__phase2Smoke?.close?.());
}finally{await browser.close();}
