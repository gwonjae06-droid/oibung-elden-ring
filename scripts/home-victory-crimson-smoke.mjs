import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {PNG} from 'pngjs';
const which=n=>{try{return execFileSync('which',[n],{encoding:'utf8'}).trim();}catch{return '';}};
const binary=which('google-chrome')||which('google-chrome-stable')||which('chromium');
if(!binary)throw Error('Chromium is required');
const browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
await mkdir('artifacts/home-mural',{recursive:true});
function crimsonEnergy(buffer){
 const {data}=PNG.sync.read(buffer);let sum=0,redPixels=0;
 for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];
  const red=Math.max(0,r-Math.max(g,b));
  sum+=red;
  if(red>25&&r>55)redPixels++;
 }
 return {sum,redPixels};
}
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const page=await ctx.newPage();
 try{
  await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='home',{timeout:45000});
  const boss=page.locator('#journey .j-wall-wide [data-boss="kwon"]');
  await boss.locator('.j-relief-photo').waitFor({state:'visible',timeout:30000});
  await page.waitForTimeout(850);
  const rect=await boss.boundingBox();assert.ok(rect&&rect.width>=100&&rect.height>=100);
  const crop={x:Math.max(0,Math.floor(rect.x)),y:Math.max(0,Math.floor(rect.y)),width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
  const darkImage=await page.screenshot({clip:crop});
  const off=crimsonEnergy(darkImage);
  await page.evaluate(()=>{document.querySelector('#journey').dataset.defeated='kwon';});
  const state=await boss.evaluate(el=>({
    opacity:getComputedStyle(el.querySelector('.mural-grooves')).opacity,
    animation:getComputedStyle(el.querySelector('.mural-grooves')).animationName,
    filter:el.querySelector('.groove-inlay').getAttribute('filter'),
    id:el.querySelector('.groove-inlay').getAttribute('filter')?.slice(5,-1),
  }));
  assert.equal(state.opacity,'1','defeated boss must light the whole carving');
  assert.equal(state.animation,'inlay-ignite','the fill must rise from the bottom, not shimmer');
  assert.ok(state.filter?.startsWith('url(#stone-crimson-fire-home-wide)'));
  await page.waitForTimeout(3100);
  const litImage=await page.screenshot({clip:crop});
  const on=crimsonEnergy(litImage);
  await page.screenshot({path:'artifacts/home-mural/kwon-cleared-crimson.png'});
  assert.ok(on.sum>off.sum+500,'clearing Kwon must visibly add crimson pixels: '+JSON.stringify({on,off,state}));
  const unlit=await page.locator('#journey .j-wall-wide [data-boss="clown"] .mural-grooves')
    .evaluate(el=>getComputedStyle(el).opacity);
  assert.equal(unlit,'0','uncleared bosses must remain dark');
  const ids=await page.locator('#journey svg filter[id]').evaluateAll(elements=>elements.map(el=>el.id));
  assert.equal(ids.length,2,'the visible and mobile SVG each need one filter');
  assert.equal(new Set(ids).size,2,'filters must not alias across SVGs');
  console.log('CRIMSON MURAL',JSON.stringify({on,off,ids,comparison:Math.round(on.sum-off.sum)}));
 }finally{await ctx.close();}
}finally{await browser.close();}
