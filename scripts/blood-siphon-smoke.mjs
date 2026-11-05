import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium missing');
await mkdir('artifacts/blood-siphon',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'
]});
try{
 for(const scenario of [{name:'desktop',width:1280,height:720,mobile:false},
  {name:'mobile-landscape',width:844,height:390,mobile:true}]){
  const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},
   deviceScaleFactor:1,hasTouch:scenario.mobile,isMobile:scenario.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  page.on('console',m=>{if(m.type()==='error'&&/Blood frame failed|WebGL.*(failed|error)|SyntaxError|TypeError/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   const launched=await page.evaluate(async()=>{
    const {launchBloodBattle}=await import('./src/blood-battle.mjs');
    window.__bloodSiphonBattle=launchBloodBattle({diagnostics:true,configure(g){
     g.player.hp=g.player.maxHp=1000000;g.blood.recover=1e6;g.startGrace=0;
    }});
    return !!window.__bloodSiphonBattle;
   });
   assert.ok(launched,'failed to launch blood battle');
   await page.locator('#blood-battle').waitFor({state:'visible',timeout:30000});
   await page.waitForTimeout(2150);
   const prepared=await page.evaluate(async()=>{
    const {readBattleSession}=await import('./src/battle-session.mjs');
    const root=document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot;
    const session=readBattleSession(root);
    if(!session)throw Error('no blood battle session');
    const g=session.game;
    session.resume?.();
    g.boss.phase=2;g.boss.hp=2000;g.boss.state='recovery';
    g.blood.transitioned=true;g.blood.phasePending=false;g.blood.recover=1e6;
    g.blood.hazards.length=0;g.blood.siphon.cooldown=.18;
    return {status:g.status,hp:g.boss.hp,running:session.active,
     pool:session.diagnostics()?.view?.siphon?.poolSize};
   });
   assert.equal(prepared.hp,2000);
   assert.ok(prepared.pool===36||prepared.pool===100);
   await page.waitForFunction(async()=>{
    const {readBattleSession}=await import('./src/battle-session.mjs');
    return !!readBattleSession(document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot)?.game?.blood?.siphon?.active;
   },null,{timeout:15000});
   await page.waitForTimeout(200);
   const casting=await page.evaluate(async()=>{
    const {readBattleSession}=await import('./src/battle-session.mjs');
    const root=document.querySelector('#blood-battle').firstElementChild.shadowRoot;
    const s=readBattleSession(root);return {hp:s.game.boss.hp,heals:s.game.blood.siphon.heals,
     active:s.game.blood.siphon.active,stream:s.diagnostics()?.view?.siphon,
     label:root.getElementById('boss-action')?.textContent,
     time:s.game.time,phase:s.game.boss.phase,bossState:s.game.boss.state,
     siphon:{...s.game.blood.siphon},activeSession:s.active};
   });
   console.log('BLOOD SIPHON CASTING DEBUG',JSON.stringify({scenario:scenario.name,prepared,casting}));
   await page.screenshot({path:'artifacts/blood-siphon/'+scenario.name+'-blood-absorption.png'});
   assert.equal(casting.hp,2000,'healing should happen only after absorption is complete');
   assert.equal(casting.heals,0);assert.equal(casting.active,true);
   assert.ok(casting.stream?.droplets>0,'no blood moving from the sea to the boss');
   assert.match(casting.label||'',/혈해 흡수/);
   await page.waitForFunction(async()=>{
    const {readBattleSession}=await import('./src/battle-session.mjs');
    return readBattleSession(document.querySelector('#blood-battle')?.firstElementChild?.shadowRoot)?.game?.blood?.siphon?.heals===1;
   },null,{timeout:15000});
   const healed=await page.evaluate(async()=>{
    const {readBattleSession}=await import('./src/battle-session.mjs');
    const s=readBattleSession(document.querySelector('#blood-battle').firstElementChild.shadowRoot);
    return {hp:s.game.boss.hp,heals:s.game.blood.siphon.heals,
     phase:s.game.boss.phase,total:s.game.blood.siphon.totalHealed,
     stream:s.diagnostics()?.view?.siphon};
   });
   assert.equal(healed.heals,1);
   assert.equal(healed.hp,2320);
   assert.equal(healed.total,320);
   assert.equal(healed.phase,2);
   assert.deepEqual(errors,[],scenario.name+' browser render errors');
   await page.screenshot({path:'artifacts/blood-siphon/'+scenario.name+'-after-healing.png'});
   console.log('BLOOD SIPHON BROWSER',JSON.stringify({scenario:scenario.name,casting,healed,errors}));
   await page.evaluate(()=>window.__bloodSiphonBattle?.close?.());
  }finally{await context.close();}
 }
}finally{await browser.close();}
