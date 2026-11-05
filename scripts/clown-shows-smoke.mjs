import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium/Chrome not installed on runner');
await mkdir('artifacts/clown-shows',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const cases=[['laughBomb','headReturn',1,null],['laughBomb','headReturn',2,null],['clap','offbeatClap',1,null],['clap','offbeatClap',2,null],['dash','runaway',2,null],['laughBomb','headReturn',1,'photo'],['laughBomb','headReturn',2,'photo'],['dash','runaway',2,'tilt'],['laughBomb','headReturn',1,'confetti'],['laughBomb','headReturn',2,'confetti'],['laughBomb','headReturn',1,'curtain'],['laughBomb','headReturn',2,'curtain'],['dash','runaway',2,'encore']];
const variantIndex={photo:1,confetti:2,curtain:3,tilt:1,encore:2},failures=[];
try{
 for(const [legacy,show,phase,variant] of cases){
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],frameErrors=[],label=legacy+'-'+phase+'-'+(variant||'base');
  page.on('pageerror',e=>errors.push(e.stack||String(e)));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Battle frame failed'))frameErrors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#arena',{timeout:30000});
   const opened=await page.evaluate(async({legacy,show,phase,index})=>{const {launchClownBattle}=await import('./src/clown-battle.mjs');const {startClownPattern}=await import('./src/clown-combat.mjs');window.__clownShowSmoke=launchClownBattle({practice:true,configure(g){g.boss.phase=phase;g.player.invuln=1e6;if(index)g.clown.stageCounts={[show]:index};window.__clownShowGame=g;startClownPattern(g,legacy);}});return Boolean(window.__clownShowSmoke);},{legacy,show,phase,index:variantIndex[variant]||0});
   assert.equal(opened,true);await page.locator('#clown-battle #world').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(({show,variant})=>{const c=window.__clownShowGame?.clown;return c?.showKey===show&&(!variant||c.stageKey===variant);},{show,variant},{timeout:10000,polling:20});
   if(variant==='photo'||variant==='tilt'){
    await page.waitForFunction(()=>{const t=window.__clownShowGame.clown.pt;return t>.08&&t<.3;},null,{timeout:10000,polling:10});
    await page.keyboard.press('Escape');await page.locator('#clown-battle #pause-screen').waitFor({state:'visible',timeout:5000});
    const snapshot=()=>page.evaluate(async()=>{const {clownLensCue}=await import('./src/clown-lens-gag.mjs');const g=window.__clownShowGame;return {time:g.time,pt:g.clown.pt,hp:g.player.hp,x:g.boss.x,z:g.boss.z,cueActive:clownLensCue(g).active};});
    const before=await snapshot();assert.equal(before.cueActive,true,'pause must occur during the camera cue');await page.waitForTimeout(600);assert.deepEqual(await snapshot(),before,'paused combat clocks must not advance');
    await page.screenshot({path:'artifacts/clown-shows/'+label+'-paused.png'});await page.locator('#clown-battle #resume').click();await page.locator('#clown-battle #pause-screen').waitFor({state:'hidden',timeout:5000});
    await page.waitForFunction(time=>window.__clownShowGame.time>time,before.time,{timeout:5000});
   }
   if(variant==='photo')await page.waitForFunction(()=>window.__clownShowGame.clown.zones.some(z=>z.major&&z.r===6),null,{timeout:10000,polling:20});
   if(variant==='tilt')await page.waitForFunction(()=>window.__clownShowGame.clown.bombs.some(q=>q.kind==='roll'),null,{timeout:10000,polling:20});
   if(variant==='confetti')await page.waitForFunction(()=>window.__clownShowGame.clown.bombs.some(q=>q.kind==='ball'),null,{timeout:10000,polling:20});
   if(variant==='curtain')await page.waitForFunction(()=>window.__clownShowGame.clown.vis.neck>.1,null,{timeout:10000,polling:20});
   if(variant==='encore')await page.waitForFunction(()=>Boolean(window.__clownShowGame.clown.f['encore-dash']),null,{timeout:10000,polling:20});
   await page.screenshot({path:'artifacts/clown-shows/'+label+'.png'});await page.waitForFunction(legacy=>window.__clownShowGame?.clown.last===legacy,legacy,{timeout:20000,polling:20});
   const result=await page.evaluate(()=>{const g=window.__clownShowGame;return {closed:window.__clownShowSmoke?.closed,open:document.getElementById('clown-battle')?.open,status:g.status,phase:g.boss.phase,last:g.clown.last,playerHp:g.player.hp,bossX:g.boss.x,bossZ:g.boss.z};});
   assert.equal(result.closed,false);assert.equal(result.open,true);assert.equal(result.status,'playing');assert.equal(result.phase,phase);assert.equal(result.last,legacy);assert.equal(result.playerHp,120);assert.ok(Number.isFinite(result.bossX)&&Number.isFinite(result.bossZ));assert.deepEqual(errors,[]);assert.deepEqual(frameErrors,[]);
   console.log('CLOWN SHOW SMOKE',JSON.stringify({legacy,show,phase,variant,result}));await page.evaluate(()=>window.__clownShowSmoke?.close?.());assert.equal(await page.locator('#clown-battle').count(),0);
  }catch(error){await page.screenshot({path:'artifacts/clown-shows/'+label+'-failed.png'}).catch(()=>{});failures.push({label,error:String(error),errors,frameErrors});console.error('CLOWN SHOW FAILED',JSON.stringify(failures[failures.length-1]));}finally{await page.close();}
 }
 assert.deepEqual(failures,[],JSON.stringify(failures));
}finally{await browser.close();}
