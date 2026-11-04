import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium/Chrome not installed on runner');
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const cases=[['laughBomb','headReturn',1],['laughBomb','headReturn',2],['clap','offbeatClap',1],['clap','offbeatClap',2],['dash','runaway',2]];
try{
 for(const [legacy,show,phase] of cases){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],frameErrors=[];
  page.on('pageerror',e=>errors.push(e.stack||String(e)));
  page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Battle frame failed'))frameErrors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   const opened=await page.evaluate(async({legacy,phase})=>{
    const {launchClownBattle}=await import('./src/clown-battle.mjs');
    const {startClownPattern}=await import('./src/clown-combat.mjs');
    window.__clownShowSmoke=launchClownBattle({practice:true,configure(g){
     g.boss.phase=phase;g.player.invuln=1e6;
     window.__clownShowGame=g;startClownPattern(g,legacy);
    }});
    return Boolean(window.__clownShowSmoke);
   },{legacy,phase});
   assert.equal(opened,true,'clown battle must open');
   await page.locator('#clown-battle #world').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(show=>window.__clownShowGame?.clown.showKey===show,show,{timeout:10000,polling:20});
   await page.waitForFunction(legacy=>window.__clownShowGame?.clown.last===legacy,legacy,{timeout:20000,polling:20});
   const result=await page.evaluate(()=>{
    const g=window.__clownShowGame;
    return {closed:window.__clownShowSmoke?.closed,open:document.getElementById('clown-battle')?.open,status:g.status,phase:g.boss.phase,last:g.clown.last,playerHp:g.player.hp,bossX:g.boss.x,bossZ:g.boss.z};
   });
   assert.equal(result.closed,false,'battle must not auto-close');assert.equal(result.open,true);
   assert.equal(result.status,'playing');assert.equal(result.phase,phase);assert.equal(result.last,legacy);
   assert.equal(result.playerHp,120,'invulnerable fixture must survive');
   assert.ok(Number.isFinite(result.bossX)&&Number.isFinite(result.bossZ));
   assert.deepEqual(errors,[],'browser runtime errors');assert.deepEqual(frameErrors,[],'battle loop errors');
   console.log('CLOWN SHOW SMOKE',JSON.stringify({legacy,show,phase,result}));
   await page.evaluate(()=>window.__clownShowSmoke?.close?.());
   assert.equal(await page.locator('#clown-battle').count(),0,'battle dialog must clean up');
  }finally{await page.close();}
 }
}finally{await browser.close();}
