import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const which=x=>{try{return execFileSync('which',[x],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=process.env.EDGE_PATH||which('google-chrome')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium/Chrome unavailable');
await mkdir('artifacts/blood-seraph',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.stack||String(e)));
 page.on('console',m=>{if(m.type()==='error'&&/Blood frame failed|Shader Error|WebGL.*(failed|error)|SyntaxError|TypeError/i.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/build/**',route=>{
  const filename=new URL(route.request().url()).pathname.split('/').at(-1);
  return route.fulfill({path:resolve('node_modules/three/build',filename),contentType:'text/javascript'});
 });
 await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('[data-j="new"]',{timeout:60000});
 await page.evaluate(()=>document.getElementById('journey')?.close());
 await page.evaluate(async()=>{
  const {launchBloodBattle}=await import('./src/blood-battle.mjs');
  const {readBattleSession}=await import('./src/battle-session.mjs');
  window.__seraphSession=()=>readBattleSession(document.getElementById('blood-battle')?.firstElementChild?.shadowRoot);
  window.__seraphBattle=launchBloodBattle({weapon:'sword',diagnostics:true,configure:g=>{
   g.startGrace=0;g.player.hp=g.player.maxHp=100000;
   g.player.invuln=100000;
  }});
 });
 await page.waitForFunction(()=>window.__seraphSession?.()?.active,{},{timeout:60000});
 const third=await page.evaluate(async()=>{
  const {damageBlood,stepBlood}=await import('./src/blood-combat.mjs');
  const g=window.__seraphSession().game;
  g.boss.phase=2;g.boss.state='recovery';
  g.blood.transitioned=true;g.blood.seraphArmed=true;
  g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
  g.blood.hazards.length=0;g.blood.pattern=null;
  g.boss.hp=g.boss.maxHp*.25+1;g.blood.recover=10;
  damageBlood(g,2);stepBlood(g,.025);
  if(g.boss.phase!==3||g.boss.state!=='transition')throw Error('Seraph phase transition did not start');
  g.blood.t=3.15;
  return {hp:g.boss.hp,phase:g.boss.phase,state:g.boss.state,hasAwakening:g.events.some(e=>e.type==='blood-seraph-awakening')};
 });
 await page.waitForTimeout(600);
 const cinematic=await page.evaluate(()=>{
  const s=window.__seraphSession();
  return {view:s.diagnostics().view,phase:s.game.boss.phase,stage:s.game.boss.state};
 });
 assert.equal(cinematic.phase,3);
 assert.equal(cinematic.view.seraph.visible,true);
 assert.equal(cinematic.view.seraph.hinges,6);
 assert.ok(cinematic.view.seraph.featherInstances>=60);
 await page.screenshot({path:'artifacts/blood-seraph/seraph-formation-desktop.png'});
 const fight=await page.evaluate(async()=>{
  const {skipBloodTransition,stepBlood,startBloodPattern}=await import('./src/blood-combat.mjs');
  const s=window.__seraphSession(),g=s.game;
  skipBloodTransition(g);stepBlood(g,.03);
  if(g.boss.state!=='recovery')throw Error('3P cinematic did not complete');
  if(!startBloodPattern(g,'seraphWings'))throw Error('3P first wing pattern unavailable');
  return {phase:g.boss.phase,pattern:g.blood.pattern,warnings:g.blood.hazards.map(h=>h.warn)};
 });
 await page.waitForTimeout(600);
 const live=await page.evaluate(()=>{
  const s=window.__seraphSession(),root=document.getElementById('blood-battle').firstElementChild.shadowRoot;
  return {view:s.diagnostics().view,phase:s.game.boss.phase,state:s.game.boss.state,
   pattern:s.game.blood.pattern,phaseLabel:root.getElementById('phase-label')?.textContent};
 });
 assert.equal(live.phase,3);
 assert.equal(live.pattern,'seraphWings');
 assert.equal(live.view.seraph.visible,true);
 assert.ok(live.view.hazards>=3);
 assert.match(live.phaseLabel,/세 번째/);
 await page.screenshot({path:'artifacts/blood-seraph/seraph-six-wing-attack.png'});
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(350);
 const mobile=await page.evaluate(()=>{
  const root=document.getElementById('blood-battle')?.firstElementChild?.shadowRoot;
  return root.getElementById('world')?.getBoundingClientRect().toJSON();
 });
 assert.ok(mobile?.width>250&&mobile?.height>150);
 await page.screenshot({path:'artifacts/blood-seraph/seraph-mobile-landscape.png'});
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.__seraphBattle?.close?.());
 console.log('BLOOD_SERAPH_BROWSER',JSON.stringify({third,cinematic:cinematic.view.seraph,fight,live:live.view.seraph,mobile,errors}));
}finally{await browser.close();}
