import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium missing');
await mkdir('artifacts/ui-responsive',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const scenarios=[{name:'desktop',width:1280,height:720,touch:false},{name:'mobile-landscape',width:844,height:390,touch:true},{name:'narrow-landscape',width:568,height:320,touch:true},{name:'mobile-portrait',width:390,height:844,touch:true}];
const overlaps=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
function assertFits(box,w,h,label){
 assert.ok(box&&box.width>0&&box.height>0,label+' has no rendered dimensions');
 assert.ok(box.left>=-2&&box.right<=w+2,label+' crosses horizontal viewport: '+JSON.stringify(box));
 assert.ok(box.top>=-2&&box.bottom<=h+2,label+' crosses vertical viewport: '+JSON.stringify(box));
}
try{
 for(const s of scenarios){
  const context=await browser.newContext({viewport:{width:s.width,height:s.height},deviceScaleFactor:1,isMobile:s.touch,hasTouch:s.touch});
  const page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#journey [data-j="new"]').waitFor({state:'attached',timeout:45000});
   if(s.name==='mobile-portrait')await page.addStyleTag({content:'.mobile-landscape-gate{display:none!important}'});
   await page.locator('#journey [data-j="new"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='select');
   const selection=await page.evaluate(()=>{
    const q=s=>document.querySelector('#journey '+s),rect=s=>{const r=q(s)?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;};
    const d=q('.j-select');return {actions:rect('.j-select-actions'),begin:rect('.j-select-actions [data-j="begin"]'),firstBoss:rect('.j-boss-target'),scrollOverflow:d.scrollWidth-d.clientWidth};
   });
   assertFits(selection.actions,s.width,s.height,s.name+' fixed launch bar');
   assertFits(selection.begin,s.width,s.height,s.name+' launch button');
   assertFits(selection.firstBoss,s.width,s.height,s.name+' first boss');
   assert.ok(selection.scrollOverflow<=2,s.name+' boss selection horizontal overflow: '+selection.scrollOverflow);
   await page.screenshot({path:'artifacts/ui-responsive/'+s.name+'-selection.png'});
   await page.locator('#journey [data-j="home"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='home');
   await page.locator('#journey [data-j="forge"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='forge');
   const forge=await page.evaluate(()=>{
    const d=document.querySelector('#journey .j-forge'),r=d.getBoundingClientRect();
    return {bounds:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},horizontalOverflow:d.scrollWidth-d.clientWidth,branches:d.querySelectorAll('.j-forge-branch').length};
   });
   assert.ok(forge.branches>=2,s.name+' upgrade branches missing');
   assert.ok(forge.bounds.left>=-2&&forge.bounds.right<=s.width+2,s.name+' forge horizontally clipped');
   if(forge.horizontalOverflow>2){
    const offenders=await page.evaluate(()=>{
     const d=document.querySelector('#journey .j-forge'),r=d.getBoundingClientRect();
     return [...d.querySelectorAll('*')].map(el=>({el,rect:el.getBoundingClientRect()}))
      .filter(({rect})=>rect.width&&rect.height&&(rect.left<r.left-3||rect.right>r.right+3))
      .slice(0,16).map(({el,rect})=>({tag:el.tagName,cls:String(el.className?.baseVal??el.className??'').slice(0,100),left:Math.round(rect.left-r.left),right:Math.round(rect.right-r.right)}));
    });
    console.log('FORGE OVERFLOW DEBUG',s.name,JSON.stringify({overflow:forge.horizontalOverflow,offenders}));
   }
   assert.ok(forge.horizontalOverflow<=2,s.name+' forge horizontal overflow: '+forge.horizontalOverflow);
   await page.screenshot({path:'artifacts/ui-responsive/'+s.name+'-forge.png'});
   if(s.width>s.height){
    const hud=await page.evaluate(async()=>{
     const {installHudLayout}=await import('./src/hud-layout.mjs');installHudLayout(document);
     document.getElementById('journey').style.display='none';
     for(const id of ['player-hud','boss-hud','touch'])document.getElementById(id).hidden=false;
     for(const id of ['menu','pause-screen','result'])document.getElementById(id).hidden=true;
     const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     return {boss:rect(document.getElementById('boss-hud')),stick:rect(document.getElementById('stick')),actions:rect(document.querySelector('.touch-actions')),player:rect(document.getElementById('player-hud'))};
    });
    assertFits(hud.boss,s.width,s.height,s.name+' boss HUD');
    assertFits(hud.player,s.width,s.height,s.name+' player HUD');
    if(s.touch){
     assertFits(hud.stick,s.width,s.height,s.name+' joystick');
     assertFits(hud.actions,s.width,s.height,s.name+' touch attacks');
     assert.ok(overlaps(hud.boss,hud.actions)<1,s.name+' boss HUD overlaps attacks: '+JSON.stringify(hud));
     assert.ok(overlaps(hud.boss,hud.stick)<1,s.name+' boss HUD overlaps joystick: '+JSON.stringify(hud));
     assert.ok(overlaps(hud.player,hud.stick)<1,s.name+' player HUD overlaps joystick: '+JSON.stringify(hud));
    }
    await page.screenshot({path:'artifacts/ui-responsive/'+s.name+'-combat-hud.png'});
    console.log('RESPONSIVE HUD',s.name,JSON.stringify(hud));
   }
   console.log('RESPONSIVE MENUS',s.name,JSON.stringify({selection,forge}));
  }finally{await context.close();}
 }
}finally{await browser.close();}
