import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium not installed');
await mkdir('artifacts/boss-phase-environments',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const boss of ['clown','dice','kwon']){
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  page.on('console',m=>{if(m.type()==='error'&&/WebGL.*(error|failed)|Shader Error/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   const sceneInfo=await page.evaluate(async boss=>{
    // Same production scenery modules, rendered through real Chromium WebGL.
    document.querySelectorAll('dialog').forEach(d=>{if(d.open)d.close();});
    const THREE=await import('three');
    const scene=new THREE.Scene();scene.background=new THREE.Color(boss==='clown'?0x574047:boss==='dice'?0x24111e:0x15202a);
    const camera=new THREE.PerspectiveCamera(58,1280/720,.1,510);
    scene.add(new THREE.HemisphereLight(0xffecd8,0x443647,boss==='dice'?2.2:1.65));
    const sun=new THREE.DirectionalLight(boss==='kwon'?0xb4cce4:0xffe1b0,2.7);
    sun.position.set(12,40,22);scene.add(sun);
    const canvas=document.createElement('canvas');canvas.id='boss-phase-ci-canvas';
    canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none';
    document.body.appendChild(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    renderer.setPixelRatio(1);renderer.setSize(1280,720,false);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.28;
    let stage,game,thirdView,thirdData;
    if(boss==='clown'){
     const m=await import('./src/clown-radiant-circus.mjs'),g=await import('./src/clown-combat.mjs');
     stage=m.createClownCircusStage(scene);game=g.createClownGame();
     camera.position.set(0,18,50);camera.lookAt(0,15,-17);
    }else if(boss==='dice'){
     const m=await import('./src/casino-room.mjs');stage=m.buildCasinoRoom(THREE,scene);
     game={boss:{phase:1,x:0,z:0},dice:{},time:0,status:'playing'};
     camera.position.set(12,66,105);camera.lookAt(0,43,-112);
    }else{
     const m=await import('./src/sanctuary.mjs'),g=await import('./src/combat.mjs');
     stage=m.buildSanctuary(THREE,scene);game=g.createGame();
     const third=await import('./src/kwon-third-phase-view.mjs');
     thirdData=await import('./src/kwon-third-phase.mjs');
     thirdView=third.createKwonThirdPhaseView(scene);
     camera.position.set(0,19,35);camera.lookAt(0,9,-36);
    }
    function render(phase){
     if(boss==='clown'){
      game.boss.phase=phase;
      if(phase===2)stage.event({type:'clown-phase2'},game);
      for(let i=0;i<110;i++){game.time+=.033;stage.update(game,.033);}
     }else if(boss==='dice'){
      game.boss.phase=phase;
      game.dice.giant=phase===1?null:{state:'attack',temperament:phase===3?'feral':'noble',rageBeat:0,t:2,hazards:[]};
      for(let i=0;i<90;i++){game.time+=.04;stage.update(game.time,game,.04);}
     }else{
      game.boss.phase=phase;
      for(let i=0;i<120;i++){game.time+=.033;stage.update(game,.033);}
      game.kwonFractures=phase===3?
       thirdData.makeKwonFractures({...game.boss,x:0,z:0,yaw:0},'heavenSplit',600)
        .map(q=>({...q,age:1.1})): [];
      thirdView.update(game);
     }
     renderer.render(scene,camera);
     return {phase,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    }
    window.__bossScenicCI={render,dispose(){
      thirdView?.dispose();renderer.dispose();canvas.remove();
      if(stage.dispose)stage.dispose();
    }};
    return {boss,first:render(1)};
   },boss);
   assert.equal(sceneInfo.boss,boss);
   assert.ok(sceneInfo.first.drawCalls>0,boss+' rendered no draw calls');
   await page.screenshot({path:'artifacts/boss-phase-environments/'+boss+'-phase-one.png'});
   const final=await page.evaluate(boss=>window.__bossScenicCI.render(boss==='dice'?3:2),boss);
   assert.ok(final.drawCalls>0);
   assert.deepEqual(errors,[],'browser errors in '+boss);
   await page.screenshot({path:'artifacts/boss-phase-environments/'+boss+'-transformed.png'});
   if(boss==='kwon'){
    const third=await page.evaluate(()=>window.__bossScenicCI.render(3));
    assert.ok(third.drawCalls>final.drawCalls,'third phase must draw actual 3D stone/sky wound geometry');
    await page.screenshot({path:'artifacts/boss-phase-environments/kwon-phase-three.png'});
    console.log('KWON PHASE THREE WEBGL',JSON.stringify(third));
   }
   console.log('BOSS ENVIRONMENT SMOKE',JSON.stringify({boss,phase1:sceneInfo.first,transformed:final,errors}));
   await page.evaluate(()=>window.__bossScenicCI.dispose());
  }finally{await page.close();}
 }
}finally{await browser.close();}
