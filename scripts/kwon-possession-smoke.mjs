import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const which=c=>{try{return execFileSync('which',[c],{encoding:'utf8'}).trim();}catch{return ''}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chromium not installed');
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
await mkdir('artifacts/kwon-possession',{recursive:true});
try{
 for(const vp of [{name:'desktop',width:1280,height:720},{name:'landscape',width:844,height:390}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   const setup=await page.evaluate(async()=>{
    document.querySelectorAll('dialog').forEach(d=>{if(d.open)d.close();});
    const T=await import('three');
    const [{buildBoss},{createBossStance},{createGame,swordPose,SWORD},{createKwonThirdPhaseView},
      {createKwonShatteredWorld},{createKwonMoonCataclysmView},{moonPosition},
      {makeKwonFractures}]=await Promise.all([
     import('./src/models.mjs'),import('./src/boss-stance.mjs'),import('./src/combat.mjs'),
     import('./src/kwon-third-phase-view.mjs'),import('./src/kwon-shattered-world.mjs'),
     import('./src/kwon-moon-cataclysm-view.mjs'),import('./src/kwon-moon-cataclysm.mjs'),
     import('./src/kwon-third-phase.mjs')]);
    const scene=new T.Scene();scene.background=new T.Color(0x15161d);
    scene.add(new T.HemisphereLight(0xffefd9,0x352b30,1.8));
    const sun=new T.DirectionalLight(0xd6c8ba,3);sun.position.set(15,25,9);scene.add(sun);
    const floor=new T.Mesh(new T.CircleGeometry(26,64),new T.MeshStandardMaterial({color:0x383239,roughness:1}));
    floor.rotation.x=-Math.PI/2;scene.add(floor);
    const arena=document.querySelector('#arena');arena.style.display='block';
    const canvas=document.createElement('canvas');canvas.id='kwon-possession-preview';
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none';
    arena.appendChild(canvas);
    const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);
    const camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.1,160);
    camera.position.set(9,12,32);camera.lookAt(0,5,0);
    const B=buildBoss({coarse:true});scene.add(B.root);
    const stance=createBossStance(B);
    const view=createKwonThirdPhaseView(scene,{coarse:true});
    const world=createKwonShatteredWorld(scene,{coarse:true,reduced:true});
    const meteorView=createKwonMoonCataclysmView(scene,{coarse:true});
    const g=createGame('sword',{register:false});g.boss.phase=3;g.boss.state='transition';g.boss.yaw=0;
    function paint(t,pattern='transition'){
     const b=g.boss;b.t=t;b.state=pattern;
     b.pattern=pattern==='active'?'heavenSplit':'sweep';
     if(pattern==='moonCinematic'){
      g.kwonMoon.mode='cinematic';g.kwonMoon.triggered=true;g.kwonMoon.time=t;
      const moon=moonPosition();
      camera.position.set(moon.x-24,moon.y-3,moon.z+27);camera.lookAt(moon.x,moon.y,moon.z);
     }else{camera.position.set(9,12,32);camera.lookAt(0,5,0);}
     if(B.swordGroup.parent!==B.root)B.root.add(B.swordGroup);
     const p=swordPose(b);B.swordGroup.position.set(p.x,p.y,p.z);
     B.swordGroup.rotation.set(p.pitch,p.yaw,0);const sc=p.length/SWORD.length;
     B.swordGroup.scale.set(1+(sc-1)*.58,1+(sc-1)*.58,sc);
     if(pattern==='active')g.kwonFractures=makeKwonFractures({...b,x:0,z:0,yaw:0},'heavenSplit',200).map(q=>({...q,age:q.delay+.5}));
     else g.kwonFractures=[];
     stance.update(b);view.update(g);world.update(g,.6);meteorView.update(g);floor.visible=false;renderer.render(scene,camera);
     return {draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      parent:B.swordGroup.parent===B.root,scale:B.swordGroup.scale.z,
      dropped:B.model.position.z<-.3,split:world.root.getObjectByName('kwon-real-left-continent').position.x<0,
      lunar:meteorView.root.visible,
      sever:view.root.getObjectByName('kwon-blade-severs-master')?.visible};
    }
    window.__kwonPreview={paint,dispose(){world.dispose();meteorView.dispose();view.dispose();stance.dispose();renderer.dispose();canvas.remove();}};
    return paint(2.3);
   });
   assert.ok(setup.parent&&setup.scale>1&&setup.sever&&setup.draws>0,JSON.stringify(setup));
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-master-cut.png'});
   const possessed=await page.evaluate(()=>window.__kwonPreview.paint(4.3));
   assert.ok(possessed.dropped&&possessed.split,JSON.stringify(possessed));
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-world-split.png'});
   const strike=await page.evaluate(()=>window.__kwonPreview.paint(.46,'active'));
   assert.ok(strike.draws>0&&strike.scale>1.35&&strike.split);
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-rift-strike.png'});
   const moon=await page.evaluate(()=>window.__kwonPreview.paint(4.8,'moonCinematic'));
   assert.ok(moon.lunar&&moon.draws>0);
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-moon-cut.png'});
   assert.deepEqual(errors,[]);
   console.log('KWON POSSESSION BROWSER',vp.name,JSON.stringify({setup,possessed,strike}));
   await page.evaluate(()=>window.__kwonPreview.dispose());
  }finally{await page.close();}
 }
}finally{await browser.close();}
