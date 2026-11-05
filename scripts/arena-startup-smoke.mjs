import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium unavailable');
await mkdir('artifacts/arena-startup',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'
]});
try{
 for(const scenario of [
  {label:'desktop',width:1280,height:720,isMobile:false},
  {label:'mobile-landscape',width:844,height:390,isMobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:scenario.height},deviceScaleFactor:1,
   hasTouch:scenario.isMobile,isMobile:scenario.isMobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error.stack||error)));
  page.on('console',msg=>{if(msg.type()==='error'&&/reduceMotion|is not a function|Arena lifecycle failed|Game startup|WebGL context/i.test(msg.text()))errors.push(msg.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   const startup=await page.evaluate(async()=>{
    try{
     // Use the exact same module URL as the inline production bootstrap.
     // Any first-boss module exception rejects this Promise.
     const {bootstrapGame}=await import('./src/bootstrap.mjs?v=arena-startup-boolean-fix-20261105');
     const running=await bootstrapGame();
     const world=document.getElementById('world'),start=document.getElementById('start'),
      status=document.getElementById('load-status'),loading=document.getElementById('journey-loading');
     return {
      ok:true,
      arenaReady:Boolean(running?.arena)&&!running.arena.disposed&&running.arena.running,
      startEnabled:!!start&&!start.disabled,
      startLabel:start?.textContent,
      status:status?.textContent,
      journeyMessage:loading?.textContent,
      canvas:{width:world?.width||0,height:world?.height||0}
     };
    }catch(error){
     return {ok:false,error:String(error.stack||error),loadStatus:document.getElementById('load-status')?.textContent};
    }
   });
   assert.equal(startup.ok,true,scenario.label+' bootstrap failed: '+startup.error);
   assert.equal(startup.arenaReady,true,scenario.label+' failed to start real WebGL arena runtime');
   assert.equal(startup.startEnabled,true,scenario.label+' start button stayed disabled');
   assert.equal(startup.startLabel,'전투 시작');
   assert.match(startup.status,/준비 완료/);
   assert.ok(startup.canvas.width>400&&startup.canvas.height>200,scenario.label+' WebGL canvas has invalid dimensions');
   assert.doesNotMatch(startup.journeyMessage||'',/실패|불러오지 못했/);
   await page.waitForTimeout(450);
   assert.deepEqual(errors,[],scenario.label+' page exceptions');
   await page.screenshot({path:'artifacts/arena-startup/'+scenario.label+'-loaded.png'});
   console.log('ARENA BOOT RECOVERED',JSON.stringify({scenario:scenario.label,startup}));
  }finally{await context.close();}
 }
}finally{await browser.close();}
