import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=n=>{try{return execFileSync('which',[n],{encoding:'utf8'}).trim()}catch{return ''}};
const chrome=which('google-chrome')||which('google-chrome-stable')||which('chromium');
if(!chrome)throw Error('Chromium missing');
await mkdir('artifacts/ui-responsive',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const sizes=[{name:'screenshot-size',width:640,height:660},{name:'desktop',width:1280,height:720}];
try{
 for(const s of sizes){
  const ctx=await browser.newContext({viewport:{width:s.width,height:s.height},deviceScaleFactor:1});
  const page=await ctx.newPage();
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#journey [data-j="new"]').waitFor({state:'visible',timeout:45000});
   await page.locator('#journey [data-j="new"]').click();
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='select',{timeout:20000});
   const bars=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};};
    const rows=[...document.querySelectorAll('#journey .j-stat-row')];
    return rows.map(row=>{const track=row.querySelector('.j-stat-track'),avg=row.querySelector('.j-stat-average');
     return {track:rect(track),marker:rect(avg),relative:getComputedStyle(track).position,overflow:getComputedStyle(track).overflowY};
    });
   });
   assert.equal(bars.length,7,s.name+' should render all weapon averages');
   for(const [i,{track,marker,relative,overflow}] of bars.entries()){
    assert.equal(relative,'relative','the track itself must anchor marker '+i);
    assert.ok(marker.height<=track.height+1,'vertical stripe escaped its own bar '+JSON.stringify({i,track,marker}));
    assert.ok(marker.top>=track.top-1&&marker.bottom<=track.bottom+1,'average line extends beyond bar '+i);
    assert.ok(marker.left>=track.left-2&&marker.right<=track.right+2,'average line extends past bar '+i);
   }
   assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none','old Kwon selector should never appear under the Journey');
   await page.screenshot({path:'artifacts/ui-responsive/'+s.name+'-weapon-markers.png'});
   // Escape from the selection page must return to the actual five-boss home.
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='home',{timeout:10000});
   assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none');
   if(s.name==='desktop'){
    await page.locator('#journey [data-j="new"]').click();
    await page.locator('#journey [data-j="begin"]').click();
    // During the cinematic the original Kwon chooser must remain inaccessible.
    assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none');
    await page.waitForFunction(()=>{
     const j=document.querySelector('#journey');return j?.dataset.screen==='battle'&&!j.open;
    },null,{timeout:75000});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('pause-screen')?.hidden===false,null,{timeout:15000});
    assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none','Escape must pause rather than reveal old selection');
    assert.equal(await page.locator('#journey').evaluate(el=>el.open),false,'paused combat must not display the Journey dialog');
    await page.screenshot({path:'artifacts/ui-responsive/desktop-esc-pause.png'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('pause-screen')?.hidden===true,null,{timeout:15000});
    assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none');
   }
   console.log('UI FIX VERIFIED',s.name,JSON.stringify({barCount:bars.length,escape:'no legacy Kwon selector'}));
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
