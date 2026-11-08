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
 // The intro UI may already be visible while renderer/texture preparation
 // is still compiling every troupe shader. Wait for the veil to truly exit.
 await page.locator('#clown-battle [role="status"]').waitFor({state:'detached',timeout:90000});
 await page.waitForTimeout(300);
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
 // WebGL software rendering can stall full-page snapshots during the 5.2s
 // transition. The model-space pose assertion below is the authoritative
 // check, while image capture is a best-effort additional QA artifact.
 try{await page.screenshot({
  path:'artifacts/clown-marionette/02-wooden-X-strings-cutscene.png',
  timeout:18000,animations:'disabled'});
 }catch(error){console.warn('Optional puppet screenshot unavailable:',String(error));}
 const pose=await page.evaluate(async()=>{
  const [{createClownActor},{createClownGame}]=await Promise.all([
   import('./src/clown-ringmaster-actor.mjs'),import('./src/clown-combat.mjs')]);
  const g=createClownGame('sword',{register:false,seed:21});
  g.boss.phase=2;g.boss.state='transition';g.boss.t=2.7;
  g.clown.horrorStage=2;g.clown.state='transition';
  const actor=createClownActor({coarse:true});actor.update(g,1/30);
  const x=actor.root.getObjectByName('seulwoo-act-two-X-shaped-wooden-marionette-controller');
  let ropes=0,planks=0;
  x?.traverse(o=>{
   if(o.name.startsWith('real-marionette-string-'))ropes++;
   if(o.name.startsWith('genuine-crossed-wooden-puppet-plank'))planks++;
  });
  const result={ropes,planks,visible:x?.visible};
  actor.disposePortrait();return result;
 });
 assert.equal(pose.planks,2);assert.equal(pose.ropes,10);assert.equal(pose.visible,true);
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
 await page.waitForTimeout(600);
 // Verify the actual vintage actor appears ABOVE the striped ball,
 // rather than only checking a silhouette-free rendering timeout.
 const miniVisual=await page.evaluate(async()=>{
  const {createLegacyEchoView}=await import('./src/clown-legacy-echo-view.mjs');
  const {createClownGame}=await import('./src/clown-combat.mjs');
  const {setCircusAct}=await import('./src/clown-troupe.mjs');
  const scene=new (await import('three')).Scene(),view=createLegacyEchoView(scene,{coarse:true});
  const g=createClownGame('sword',{register:false,seed:19});
  g.boss.phase=2;g.clown.horrorStage=2;setCircusAct(g,2);view.update(g,1/30);
  const models=[];
  for(const original of view.root.children.filter(o=>o.name==='mini-original-ball-riding-seulwoo')){
   const torso=original.getObjectByName('clown-head')||original.getObjectByName('vintage-original-full-velvet-torso');
   const shell=original.getObjectByName('original-circus-balance-ball')||
    original.getObjectByName('actual-legacy-circus-ball');
   const body=original.children.find(o=>o.type==='Group'&&o.position.y>4);
   models.push({bodyY:body?.position.y,head:!!torso,ball:!!shell});
  }
  const stats=view.stats();view.dispose();return {models,stats};
 });
 assert.ok(miniVisual.models.length>=1);
 assert.ok(miniVisual.models.every(m=>m.bodyY>5&&m.head&&m.ball),
  'full vintage model must stand visibly on top of the roller ball');
 try{await page.screenshot({path:'artifacts/clown-marionette/03-mini-bosses-in-3d.png',timeout:18000,animations:'disabled'});}
 catch(error){console.warn('Optional mini screenshot unavailable:',String(error));}
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
 try{await page.screenshot({path:'artifacts/clown-marionette/04-old-mini-projectile.png',timeout:18000,animations:'disabled'});}
 catch(error){console.warn('Optional projectile screenshot unavailable:',String(error));}
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
 try{await page.screenshot({path:'artifacts/clown-marionette/05-third-act-reinforcements.png',timeout:18000,animations:'disabled'});}
 catch(error){console.warn('Optional low-HP screenshot unavailable:',String(error));}
 await page.setViewportSize({width:844,height:390});
 await page.waitForTimeout(400);
 try{await page.screenshot({path:'artifacts/clown-marionette/06-mobile-landscape.png',timeout:18000,animations:'disabled'});}
 catch(error){console.warn('Optional mobile screenshot unavailable:',String(error));}
 assert.deepEqual(errors,[],'WebGL/JS errors during phase, miniature or reinforcement');
 console.log('CLOWN MARIONETTE WEBGL SMOKE',JSON.stringify({
  setup,live,projectile,
  thirdAct:{before:finale.before.length,after:finale.after.length},
  errors
 }));
 await page.evaluate(()=>window.__marionetteSmoke?.close?.());
 await page.locator('#clown-battle').waitFor({state:'detached',timeout:10000});
}finally{await browser.close();}
