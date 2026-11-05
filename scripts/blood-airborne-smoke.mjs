import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium missing');
await mkdir('artifacts/blood-airborne',{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:[
 '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'
]});
try{
 for(const scenario of [{name:'desktop',width:1280,height:720,mobile:false},
  {name:'mobile-landscape',width:844,height:390,mobile:true}]){
  const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},
   hasTouch:scenario.mobile,isMobile:scenario.mobile,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  page.on('console',msg=>{
   if(msg.type()==='error'&&/WebGL.*(error|failed)|Shader Error|SyntaxError|TypeError/i.test(msg.text()))errors.push(msg.text());
  });
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',
    {waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#arena',{timeout:30000});
   const result=await page.evaluate(async scenario=>{
    const THREE=await import('three');
    const {createBloodGame,actBlood,startBloodPattern,stepBlood,bloodBossAirborne,
     BLOOD_PROJECTILE_GROUND_HEIGHT}=await import('./src/blood-combat.mjs');
    const {buildBloodView}=await import('./src/blood-view.mjs');
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf1f1ee);
    scene.fog=new THREE.Fog(0xf0efeb,54,123);
    scene.add(new THREE.HemisphereLight(0xffffff,0x626278,1.35));
    const light=new THREE.DirectionalLight(0xfff3df,2.25);
    light.position.set(19,38,16);scene.add(light);
    const canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none';
    document.body.appendChild(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:!scenario.mobile});
    renderer.setPixelRatio(1);renderer.setSize(scenario.width,scenario.height,false);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
    const camera=new THREE.PerspectiveCamera(62,scenario.width/scenario.height,.1,160);
    camera.position.set(0,22,33);camera.lookAt(0,5,-5);
    const view=buildBloodView(scene,{coarse:scenario.mobile,reduced:scenario.mobile});
    function advance(g,seconds){
     for(let elapsed=0;elapsed<seconds-1e-7;elapsed+=.02)
      stepBlood(g,Math.min(.02,seconds-elapsed));
     view.update(g,.02);
     renderer.render(scene,camera);
    }
    const flying=createBloodGame('bow');
    flying.boss.phase=2;flying.blood.transitioned=true;
    flying.player.z=-2;flying.player.hp=flying.player.maxHp=1e8;
    startBloodPattern(flying,'eclipse');
    advance(flying,.52);
    const hp=flying.boss.hp;
    if(!bloodBossAirborne(flying))throw Error('blood boss must be in the air');
    if(!actBlood(flying,'light'))throw Error('bow attack could not start');
    advance(flying,.4);
    const projectile=flying.projectiles.find(q=>q.life>0);
    const mesh=scene.getObjectByName('shared-player-projectiles')?.children?.[0];
    const airborne={
     hp:flying.boss.hp,bodyY:view.root.position.y,shotY:mesh?.position?.y,
     shotSimY:projectile?.y,shots:flying.projectiles.length,
     hits:flying.stats.hits,drawCalls:renderer.info.render.calls,phase:flying.boss.phase,
     noClaims:flying.projectiles.every(q=>!q.bossHit)
    };
    await new Promise(resolve=>requestAnimationFrame(resolve));
    // Screenshot is captured by the outer Playwright process.
    window.__bloodFlightCI={canvas,scene,renderer,view,camera,airborne,
     checkAfterFlight(){
      advance(flying,.38);
      return {hp:flying.boss.hp,expected:hp,missed:flying.stats.hits===0,
       noClaims:flying.projectiles.every(q=>!q.bossHit)};
     },
     checkLanding(){
      const ground=createBloodGame('bow');
      ground.boss.phase=2;ground.blood.transitioned=true;
      ground.boss.state='recovery';ground.blood.recover=1000;
      ground.player.z=-2;ground.player.hp=ground.player.maxHp=1e8;
      const startingHp=ground.boss.hp;
      actBlood(ground,'light');
      advance(ground,.75);
      return {before:startingHp,after:ground.boss.hp,
       grounded:!bloodBossAirborne(ground),hits:ground.stats.hits,
       calls:renderer.info.render.calls};
     },
     dispose(){view.dispose();renderer.dispose();canvas.remove();}
    };
    return airborne;
   },scenario);
   assert.equal(result.hp,6400,scenario.name+' bow damaged the flying boss');
   assert.ok(result.bodyY>.45,scenario.name+' boss was not visibly elevated');
   assert.equal(result.shotY,.38,scenario.name+' projectile graphic is not on the floor');
   assert.equal(result.shotSimY,.38,scenario.name+' simulation is not at the same height as the projectile');
   assert.ok(result.shots>=1&&result.drawCalls>0);
   assert.ok(result.noClaims&&result.hits===0);
   await page.screenshot({path:'artifacts/blood-airborne/'+scenario.name+'-ground-arrow-below-flying-boss.png'});
   const after=await page.evaluate(()=>window.__bloodFlightCI.checkAfterFlight());
   assert.equal(after.hp,after.expected);assert.ok(after.missed&&after.noClaims);
   const landed=await page.evaluate(()=>window.__bloodFlightCI.checkLanding());
   assert.equal(landed.grounded,true);
   assert.ok(landed.after<landed.before,scenario.name+' grounded boss did not take ranged damage');
   assert.ok(landed.hits>0&&landed.calls>0);
   assert.deepEqual(errors,[],scenario.name+' WebGL page errors');
   await page.screenshot({path:'artifacts/blood-airborne/'+scenario.name+'-grounded-boss-vulnerable.png'});
   console.log('BLOOD AIRBORNE BROWSER',JSON.stringify({scenario:scenario.name,result,after,landed,errors}));
   await page.evaluate(()=>window.__bloodFlightCI.dispose());
  }finally{await context.close();}
 }
}finally{await browser.close();}
