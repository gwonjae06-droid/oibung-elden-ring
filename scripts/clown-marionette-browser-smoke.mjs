import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium unavailable');
await mkdir('artifacts/clown-marionette',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
 '--use-gl=angle','--use-angle=swiftshader'
]});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await page.route('https://fonts.**/**',route=>route.abort());
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 page.on('console',m=>{
  if(m.type()==='error'&&/Battle frame failed|WebGL.*(error|failed)/i.test(m.text()))errors.push(m.text());
 });
 await page.goto('http://127.0.0.1:8000/spider-combat.html',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#arena',{timeout:30000});
 const opened=await page.evaluate(async()=>{
  const {launchClownBattle}=await import('./src/clown-battle.mjs');
  window.__marionetteSmoke=launchClownBattle({practice:true,configure(g){
   // Hold the intro gate while rendering real scene/animation snapshots.
   g.introControlled=true;g.player.invuln=100000;g.startGrace=0;
   g.clown.wait=100;window.__marionetteGame=g;
  }});
  return !!window.__marionetteSmoke;
 });
 assert.ok(opened,'clown battle should launch');
 await page.locator('#clown-battle #world').waitFor({state:'visible',timeout:60000});
 await page.waitForTimeout(1100);
 const setup=await page.evaluate(async()=>{
  const {setCircusAct}=await import('./src/clown-troupe.mjs');
  const g=window.__marionetteGame;
  setCircusAct(g,1);
  return {stage:g.clown.troupe.stage,count:g.clown.troupe.members.length};
 });
 assert.equal(setup.stage,1);assert.equal(setup.count,3);
 await page.screenshot({path:'artifacts/clown-marionette/01-stage-one.png',timeout:30000});
 await page.evaluate(()=>{
  const g=window.__marionetteGame;
  g.boss.phase=2;g.boss.state='transition';g.boss.t=2.7;
  g.clown.state='transition';g.clown.horrorStage=2;
 });
 await page.waitForTimeout(750);
 await page.screenshot({path:'artifacts/clown-marionette/02-wooden-X-strings-cutscene.png',timeout:30000});
 const live=await page.evaluate(async()=>{
  const {setCircusAct}=await import('./src/clown-troupe.mjs');
  const g=window.__marionetteGame;
  g.boss.phase=2;g.boss.state='clown';g.clown.state='idle';g.clown.wait=100;
  g.clown.horrorStage=2;g.clown.time=2.9;
  setCircusAct(g,2);
  return {stage:g.clown.troupe.stage,
   count:g.clown.troupe.members.filter(m=>!m.legacy).length,
   minis:g.clown.troupe.members.filter(m=>m.legacy).map(m=>m.id),
   preserved:g.clown.troupe.members.slice(0,3).map(m=>m.id)};
 });
 assert.equal(live.stage,2);assert.equal(live.count,5);
 assert.ok(live.minis.length>=1&&live.minis.length<=2);
 await page.waitForTimeout(850);
 await page.screenshot({path:'artifacts/clown-marionette/03-mini-bosses-in-3d.png',timeout:30000});
 const projectile=await page.evaluate(async()=>{
  const {beginLegacyEchoAttack}=await import('./src/clown-legacy-echo.mjs');
  const g=window.__marionetteGame,m=g.clown.troupe.members.find(x=>x.legacy);
  m.legacyAttackIndex=0;
  const a=beginLegacyEchoAttack(g,m,{zone:()=>{},emit:()=>{}});
  g.clown.time=a.start+.78;
  return {kind:a.kind,shots:a.shots.length};
 });
 assert.equal(projectile.kind,'headBomb');assert.ok(projectile.shots>=1);
 await page.waitForTimeout(500);
 await page.screenshot({path:'artifacts/clown-marionette/04-old-mini-projectile.png',timeout:30000});
 const finale=await page.evaluate(async()=>{
  const {setCircusAct}=await import('./src/clown-troupe.mjs');
  const g=window.__marionetteGame;
  const before=g.clown.troupe.members.map(m=>({id:m.id,life:m.life}));
  g.boss.hp=g.boss.maxHp*.20;g.clown.horrorStage=3;
  g.clown.time+=.6;setCircusAct(g,3);
  const after=g.clown.troupe.members.map(m=>({id:m.id,life:m.life,legacy:m.legacy}));
  return {before,after,normal:after.filter(m=>!m.legacy).length};
 });
 assert.equal(finale.normal,7);
 assert.ok(finale.before.every(m=>finale.after.some(n=>n.id===m.id&&n.life===m.life)),
  'low-HP should reinforce, not respawn or heal existing performers');
 await page.waitForTimeout(650);
 await page.screenshot({path:'artifacts/clown-marionette/05-third-act-reinforcements.png',timeout:30000});
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(400);
 await page.screenshot({path:'artifacts/clown-marionette/06-mobile-landscape.png',timeout:30000});
 assert.deepEqual(errors,[],'WebGL/JS errors during phase, miniature or reinforcement');
 console.log('CLOWN MARIONETTE WEBGL SMOKE',JSON.stringify({
  setup,live,projectile,
  thirdAct:{before:finale.before.length,after:finale.after.length},
  errors
 }));
 await page.evaluate(()=>window.__marionetteSmoke?.close?.());
 await page.locator('#clown-battle').waitFor({state:'detached',timeout:10000});
}finally{await browser.close();}
