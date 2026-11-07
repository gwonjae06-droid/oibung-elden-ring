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
const variantIndex={photo:1,confetti:2,curtain:3,tilt:1,encore:2},failures=[],errors=[],frameErrors=[];
try{
 // Reuse the same GPU scene: creating thirteen software-WebGL renderers was
 // consuming minutes and starving rAF, producing false show-start timeouts.
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.route('https://fonts.**/**',route=>route.abort());
 page.on('pageerror',e=>errors.push(e.stack||String(e)));
 page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Battle frame failed'))frameErrors.push(m.text());});
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#arena',{timeout:30000});
 const opened=await page.evaluate(async()=>{
  const {launchClownBattle}=await import('./src/clown-battle.mjs');
  window.__clownShowSmoke=launchClownBattle({practice:true,configure(g){
   // Keep the intro gate closed ONLY inside the smoke test, then advance
   // the real combat stepper deterministically without a render-thread race.
   g.introControlled=true;g.startGrace=0;g.player.invuln=1e6;g.clown.wait=100;
   window.__clownShowGame=g;
  }});
  return Boolean(window.__clownShowSmoke);
 });
 assert.equal(opened,true);
 await page.locator('#clown-battle #world').waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>{
  const shadow=document.getElementById('clown-battle')?.firstElementChild?.shadowRoot;
  return Boolean(shadow?.querySelector('link[href*="style.css"]')?.sheet);
 },null,{timeout:30000});
 await page.waitForTimeout(1000);
 for(const [legacy,show,phase,variant] of cases){
  const label=legacy+'-'+phase+'-'+(variant||'base'),index=variantIndex[variant]||0;
  try{
   const outcome=await page.evaluate(async({legacy,show,phase,variant,index})=>{
    const {startClownPattern}=await import('./src/clown-combat.mjs');
    const {stepLargeClown}=await import('./src/clown-size.mjs');
    const {CLOWN_SHOWS}=await import('./src/clown-shows.mjs');
    const g=window.__clownShowGame,c=g.clown;
    g.boss.phase=phase;g.boss.state='clown';g.player.hp=g.player.maxHp=1e6;
    c.zones.length=0;c.bombs.length=0;c.waves.length=0;
    c.stageCounts={[show]:index};c.stunT=0;g.hitstop=0;
    startClownPattern(g,legacy);
    const seconds=variant==='encore'?2.6:variant==='curtain'?1.75:1.6;
    for(let i=0;i<Math.ceil(seconds*60);i++)stepLargeClown(g,1/60,{});
    const shown={showKey:c.showKey,stageKey:c.stageKey,phase:g.boss.phase,
      pt:c.pt,zones:c.zones.length,bombs:c.bombs.length,
      sideMotion:Math.hypot(g.boss.x,g.boss.z),playerHp:g.player.hp};
    // Finish only the current show so its outcome is not affected by the
    // next random act. The same real physics stepper drives these checks.
    for(let i=0;i<Math.ceil((CLOWN_SHOWS[show].dur-seconds+.03)*60)&&c.state==='pattern';i++)
     stepLargeClown(g,1/60,{});
    return {...shown,last:c.last,status:g.status};
   },{legacy,show,phase,variant,index});
   assert.equal(outcome.showKey,show,label+' wrong signature');
   if(variant)assert.equal(outcome.stageKey,variant,label+' stage variant missing');
   assert.equal(outcome.phase,phase);
   assert.ok(outcome.pt>=1.5,label+' pattern stopped advancing');
   assert.equal(outcome.last,legacy,label+' show did not finish');
   assert.equal(outcome.status,'playing');
   assert.ok(outcome.playerHp>0);
   assert.deepEqual(errors,[]);assert.deepEqual(frameErrors,[]);
   // Capture 3 representative frames to prove the real WebGL view remains alive.
   if(['photo','tilt','encore'].includes(variant))await page.screenshot({path:'artifacts/clown-shows/'+label+'.png',timeout:30000});
   console.log('CLOWN SHOW SMOKE',JSON.stringify({label,outcome}));
  }catch(error){failures.push({label,error:String(error),errors:[...errors],frameErrors:[...frameErrors]});console.error('CLOWN SHOW FAILED',JSON.stringify(failures.at(-1)));}
 }
 await page.evaluate(()=>window.__clownShowSmoke?.close?.());
 await page.locator('#clown-battle').waitFor({state:'detached',timeout:5000});
 await page.close();
 assert.deepEqual(failures,[],JSON.stringify(failures));
}finally{await browser.close();}
