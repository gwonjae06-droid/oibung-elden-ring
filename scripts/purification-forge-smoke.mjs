import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium missing');
await mkdir('artifacts/purification-forge',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
const url='http://127.0.0.1:8000/spider-combat.html';
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',error=>errors.push(String(error.stack||error)));
 page.on('console',message=>{if(message.type()==='error'&&/Journey launch failed|Game UI.*failed|Unhandled|ReferenceError|SyntaxError/.test(message.text()))errors.push(message.text());});
 await page.addInitScript(()=>{
  if(!localStorage.getItem('oibung.journey.v1'))localStorage.setItem('oibung.journey.v1',JSON.stringify({
   version:4,clears:0,records:[],memories:[],defeated:[],run:null,flames:5,earnedFlames:5,forge:{}
  }));
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oibung.journey.v1')));
 await page.locator('#journey [data-j="forge"]').waitFor({state:'visible',timeout:45000});
 await page.screenshot({path:'artifacts/purification-forge/home-flame-counter.png'});
 await page.keyboard.press('Semicolon');
 assert.equal((await read()).flames,5,'developer cheat must not work on the home screen');
 await page.locator('#journey [data-j="forge"]').click();
 await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='forge');
 assert.equal(await page.locator('#journey .j-forge-branch').count(),2);
 assert.equal(await page.locator('#journey [data-j="forge-tab"]').count(),0);
 assert.equal(await page.locator('#journey [data-j="forge-weapon"]').count(),4);
 await page.screenshot({path:'artifacts/purification-forge/forge-desktop.png'});
 assert.equal(await page.locator('#journey [data-forge-dev-easter-egg]').count(),0,'developer shortcut must not be advertised');
 assert.equal(await page.locator('#journey .j-forge-dev-result').count(),0);
 assert.doesNotMatch(await page.locator('#journey .j-forge').innerText(),/개발자용|이스터에그|; 키/);
 await page.keyboard.press('Semicolon');
 assert.equal((await read()).flames,5,'removed developer shortcut cannot grant flames');
 assert.equal(await page.locator('#journey [data-forge-dev-easter-egg], #journey .j-forge-dev-result').count(),0,'secret use must not reveal developer banner or message');
 assert.match(await page.locator('#journey .j-forge-resources').innerText(),/5/,'flame counter must remain unchanged');
 await page.screenshot({path:'artifacts/purification-forge/forge-shortcut-removed.png'});
 await page.locator('#journey [data-j="forge-buy"][data-evolution="blade-wave"]:not([disabled])').click();
 await page.locator('#journey [data-j="forge-buy"][data-evolution="blade-wave"]:not([disabled])').click();
 let saved=await read();
 assert.equal(saved.forge.sword['blade-wave'],2);
 assert.equal(saved.flames,3);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#journey [data-j="forge"]').waitFor({state:'visible',timeout:45000});
 await page.locator('#journey [data-j="forge"]').click();
 const owned=await page.locator('#journey [data-branch="blade-wave"] .j-forge-owned').count();
 assert.equal(owned,2,'forged tiers were not restored after page reload');
 await page.locator('#journey [data-j="forge-refund"]').click();
 assert.equal((await read()).forge.sword['blade-wave'],2,'refund needs confirmation');
 assert.equal(await page.locator('#journey [data-j="forge-refund-confirm"]').isVisible(),true);
 await page.locator('#journey [data-j="forge-refund-cancel"]').click();
 assert.equal((await read()).forge.sword['blade-wave'],2,'cancel must preserve upgrades');
 await page.locator('#journey [data-j="forge-refund"]').click();
 await page.locator('#journey [data-j="forge-refund-confirm"]').click();
 saved=await read();
 assert.equal(saved.forge.sword['blade-wave'],0);
 assert.equal(saved.flames,5,'refund did not restore all spent points');
 await page.locator('#journey [data-j="forge-weapon"][data-weapon="bow"]').click();
 await page.locator('#journey [data-j="forge-buy"][data-evolution="twin-arrow"]:not([disabled])').click();
 saved=await read();
 assert.equal(saved.forge.bow['twin-arrow'],1);
 assert.equal(saved.flames,4);
 await page.setViewportSize({width:844,height:390});
 await page.screenshot({path:'artifacts/purification-forge/forge-mobile-landscape.png'});
 const css=await page.locator('#journey .j-forge').evaluate(el=>({
  width:el.getBoundingClientRect().width,viewport:innerWidth,
  visible:getComputedStyle(el).display!=='none'
 }));
 assert.ok(css.visible&&css.width>400,'forge mobile panel is invisible');
 // A battle launched after forging must inherit the permanent bow skill.
 await page.locator('#journey [data-j="home"]').click();
 await page.locator('#journey [data-j="new"]').click();
 await page.locator('#journey [data-j="weapon"][data-weapon="bow"]').click();
 await page.locator('#journey [data-j="begin"]').click();
 await page.waitForFunction(async()=>{
  const {readBattleSession}=await import('./src/battle-session.mjs');
  const game=readBattleSession(document)?.game;
  return game?.weapon==='bow'&&game.evolutions?.includes('twin-arrow');
 },null,{timeout:45000});
 assert.deepEqual(errors,[]);
 console.log('FORGE BROWSER SMOKE',JSON.stringify({flames:saved.flames,bow:saved.forge.bow['twin-arrow'],mobile:css,errors}));
}finally{await browser.close();}
