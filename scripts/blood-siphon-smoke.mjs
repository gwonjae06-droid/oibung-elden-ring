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
  page.on('console',m=>{if(m.type()==='error'&&/Blood frame failed|WebGL.*(failed|error)|Shader Error|SyntaxError|TypeError/i.test(m.text()))errors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   // Run the actual production combat logic, cathedral renderer and siphon FX
   // under deterministic simulated time. It is independent of the 3.4-second
   // boss intro, which is sometimes indefinitely throttled by headless CI.
   const prepared=await page.evaluate(async scenario=>{
    const THREE=await import('three');
    const {createBloodGame,stepBlood}=await import('./src/blood-combat.mjs');
    const {buildBloodView}=await import('./src/blood-view.mjs');
    const {createCinematicWorld}=await import('./src/cinematic-graphics.mjs');
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf1f1ee);
    scene.fog=new THREE.Fog(0xf0efeb,54,123);
    const camera=new THREE.PerspectiveCamera(62,scenario.width/scenario.height,.1,160);
    camera.position.set(0,23,37);camera.lookAt(0,5,-5);
    scene.add(new THREE.HemisphereLight(0xffffff,0x626278,1.3));
    const sun=new THREE.DirectionalLight(0xfff3df,2.2);sun.position.set(19,38,16);scene.add(sun);
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none';
    canvas.id='blood-siphon-ci-canvas';document.body.appendChild(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:!scenario.mobile});
    renderer.setPixelRatio(1);renderer.setSize(scenario.width,scenario.height,false);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    const view=buildBloodView(scene,{coarse:scenario.mobile,reduced:scenario.mobile});
    const cinematic=createCinematicWorld(scene,renderer,{profile:'blood',coarse:scenario.mobile,reduced:scenario.mobile});
    cinematic.apply(scene.getObjectByName('blood-white-cathedral'));
    cinematic.apply(view.root,{actor:true});
    const g=createBloodGame();g.boss.phase=2;g.boss.state='recovery';g.boss.hp=2000;
    g.blood.transitioned=true;g.blood.phasePending=false;g.blood.recover=1e6;
    g.blood.siphon.cooldown=.12;g.player.hp=g.player.maxHp=1e8;
    function advance(sec){
     for(let t=0;t<sec-.0001;t+=.05){
      const dt=Math.min(.05,sec-t);
      stepBlood(g,dt);view.update(g,dt);
      for(const e of g.events)view.event(e,g);
      g.events.length=0;
     }
     renderer.render(scene,camera);
     return {hp:g.boss.hp,phase:g.boss.phase,active:g.blood.siphon.active,
      heals:g.blood.siphon.heals,charge:g.blood.siphon.t,
      view:view.stats(),drawCalls:renderer.info.render.calls,
      pixels:{width:renderer.domElement.width,height:renderer.domElement.height}};
    }
    window.__bloodSiphonCI={advance,dispose(){
     cinematic.dispose();view.dispose();renderer.dispose();canvas.remove();
    }};
    return {scenario:scenario.name,drawCalls:renderer.info.render.calls};
   },scenario);
   const casting=await page.evaluate(()=>window.__bloodSiphonCI.advance(1.1));
   assert.equal(casting.hp,2000,'healing should wait for the completed blood intake');
   assert.equal(casting.heals,0);assert.equal(casting.active,true);
   assert.ok(casting.view.siphon.droplets>0,'blood is not traveling from the sea to the core');
   assert.ok(casting.drawCalls>0,'real WebGL renderer produced no draw calls');
   await page.screenshot({path:'artifacts/blood-siphon/'+scenario.name+'-blood-absorption.png'});
   const healed=await page.evaluate(()=>window.__bloodSiphonCI.advance(1.6));
   assert.equal(healed.heals,1);
   assert.equal(healed.hp,2320);
   assert.equal(healed.phase,2);
   assert.equal(healed.view.siphon.active,false);
   assert.ok(healed.drawCalls>0);
   assert.deepEqual(errors,[],scenario.name+' WebGL errors');
   await page.screenshot({path:'artifacts/blood-siphon/'+scenario.name+'-after-healing.png'});
   console.log('BLOOD SIPHON BROWSER',JSON.stringify({scenario:scenario.name,prepared,
    casting:{hp:casting.hp,active:casting.active,droplets:casting.view.siphon.droplets},
    healed:{hp:healed.hp,heals:healed.heals,phase:healed.phase},errors}));
   await page.evaluate(()=>window.__bloodSiphonCI.dispose());
  }finally{await context.close();}
 }
}finally{await browser.close();}
