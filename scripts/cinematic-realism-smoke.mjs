import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium unavailable');
await mkdir('artifacts/cinematic-realism',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
 '--use-gl=angle','--use-angle=swiftshader']});
const bosses=['kwon','clown','dice','blood'];
try{
 for(const boss of bosses){
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  page.on('console',m=>{
   if(m.type()==='error'&&/Battle frame failed|Blood frame failed|Clown frame failed|WebGL.*(error|failed)|Shader Error/i.test(m.text()))
    errors.push(m.text());
  });
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',
    {waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   const state=await page.evaluate(async boss=>{
    // Isolate each real battle module in a fresh browser tab; never reuse a
    // renderer, script singleton or stale material state from another boss.
    let session=null;
    if(boss==='clown'){
     const m=await import('./src/clown-battle.mjs');
     session=m.launchClownBattle({practice:true,configure(g){
      g.player.hp=g.player.maxHp=100000;window.__cinematicGame=g;
     }});
    }else if(boss==='dice'){
     const m=await import('./src/dice-battle.mjs');
     session=m.launchDiceBattle({configure(g){
      g.player.hp=g.player.maxHp=100000;window.__cinematicGame=g;
     }});
    }else if(boss==='blood'){
     const m=await import('./src/blood-battle.mjs');
     session=m.launchBloodBattle({diagnostics:true,configure(g){
      g.player.hp=g.player.maxHp=100000;window.__cinematicGame=g;
     }});
    }
    window.__cinematicSession=session;
    return {active:boss==='kwon'||Boolean(session)};
   },boss);
   assert.ok(state.active,boss+': failed to launch');
   await page.waitForTimeout(boss==='kwon'?2400:1900);
   const result=await page.evaluate(boss=>{
    const id={clown:'clown-battle',dice:'dice-battle',blood:'blood-battle'}[boss];
    const root=id?document.getElementById(id):null;
    const shadow=root?.firstElementChild?.shadowRoot;
    const canvas=shadow?.querySelector('canvas')||(!id?document.querySelector('#world'):null);
    const r=canvas?.getBoundingClientRect();
    return {width:r?.width||0,height:r?.height||0,open:!id||Boolean(root?.open),
     status:window.__cinematicGame?.status||'kwon-ready'};
   },boss);
   assert.ok(result.width>250&&result.height>120,boss+': canvas not visible '+JSON.stringify(result));
   assert.ok(result.open,boss+': battle exited unexpectedly');
   assert.deepEqual(errors,[],boss+' console errors: '+errors.join(' | '));
   await page.screenshot({path:'artifacts/cinematic-realism/'+boss+'-desktop.png'});
   if(boss==='blood'){
    const g=await page.evaluate(async()=>{
     const {readBattleSession}=await import('./src/battle-session.mjs');
     const shadow=document.querySelector('#blood-battle').firstElementChild.shadowRoot;
     return readBattleSession(shadow)?.diagnostics?.();
    });
    assert.ok(g?.graphics,'blood renderer diagnostics missing');
    assert.ok(g?.calls>0,'blood WebGL calls missing');
   }
   await page.setViewportSize({width:844,height:390});
   await page.waitForTimeout(350);
   assert.deepEqual(errors,[],boss+' landscape errors: '+errors.join(' | '));
   await page.screenshot({path:'artifacts/cinematic-realism/'+boss+'-landscape.png'});
   console.log('CINEMATIC REALISM BROWSER',JSON.stringify({boss,result,errors}));
   if(boss!=='kwon')await page.evaluate(()=>window.__cinematicSession?.close?.());
  }finally{await page.close();}
 }
}finally{await browser.close();}
