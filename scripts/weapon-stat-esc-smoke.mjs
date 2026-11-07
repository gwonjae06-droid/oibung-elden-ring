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
   const radar=await page.evaluate(()=>{
    const panel=document.querySelector('#journey .j-stat-chart');
    const svg=panel?.querySelector('.j-stat-radar');
    const bounds=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
    return {
     svg:svg?bounds(svg):null,
     panel:panel?bounds(panel):null,
     avg:svg?.querySelector('.j-radar-average')?.getAttribute('points'),
     current:svg?.querySelector('.j-radar-current')?.getAttribute('points'),
     rings:svg?.querySelectorAll('.j-radar-ring').length,
     rays:svg?.querySelectorAll('.j-radar-ray').length,
     nodes:svg?.querySelectorAll('.j-radar-node').length,
     exactValues:panel?.querySelectorAll('.j-stat-fact').length,
     recovery:panel?.querySelector('.j-stat-recovery strong')?.textContent,
     oldMarkers:panel?.querySelectorAll('.j-stat-average,.j-stat-track,.j-stat-fill').length
    };
   });
   assert.ok(radar.svg&&radar.svg.width>100,'the radar must have a visible bounding box');
   assert.equal(radar.rings,4);assert.equal(radar.rays,6);assert.equal(radar.nodes,6);
   assert.equal(radar.exactValues,6);assert.match(radar.recovery,/%/);
   assert.equal(radar.oldMarkers,0,'old white vertical line nodes must not exist');
   assert.equal(radar.avg.split(' ').length,6);assert.equal(radar.current.split(' ').length,6);
   assert.ok(radar.svg.left>=radar.panel.left-2&&radar.svg.right<=radar.panel.right+2,'radar must fit inside weapon profile');
   const polygons=[radar.current];
   for(const id of ['hammer','bow','cards']){
    await page.locator('#journey [data-j="weapon"][data-weapon="'+id+'"]').evaluate(el=>el.click());
    const current=await page.locator('#journey .j-radar-current').getAttribute('points');
    assert.ok(current&&current.split(' ').length===6,'new weapon must update the radar');
    polygons.push(current);
    assert.equal(await page.locator('#journey .j-stat-average').count(),0);
   }
   assert.equal(new Set(polygons).size,4,'four weapons must draw distinct radar shapes');
   await page.locator('#journey [data-j="weapon"][data-weapon="sword"]').evaluate(el=>el.click());
   assert.equal(await page.locator('#menu').evaluate(el=>getComputedStyle(el).display),'none','old Kwon selector should never appear under the Journey');
   await page.screenshot({path:'artifacts/ui-responsive/'+s.name+'-weapon-radar.png'});
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
     // The dialog's dataset remains 'loading' after it is closed for battle;
     // player HUD activation and the closed dialog are the actual battle state.
     const j=document.querySelector('#journey'),hud=document.getElementById('player-hud');
     return Boolean(j&&!j.open&&hud&&!hud.hidden);
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
   console.log('RADAR UI VERIFIED',s.name,JSON.stringify({axes:radar.nodes,oldMarkers:radar.oldMarkers,escape:'no legacy Kwon selector'}));
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
