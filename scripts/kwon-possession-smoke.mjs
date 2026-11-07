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
      {createKwonWorldCleave},{makeKwonFractures}]=await Promise.all([
     import('./src/models.mjs'),import('./src/boss-stance.mjs'),import('./src/combat.mjs'),
     import('./src/kwon-third-phase-view.mjs'),import('./src/kwon-world-cleave.mjs'),
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
    const world=createKwonWorldCleave(arena,{coarse:true,reduced:true});
    const g=createGame('sword',{register:false});g.boss.phase=3;g.boss.state='transition';g.boss.yaw=0;
    function paint(t,pattern='transition'){
     const b=g.boss;b.t=t;b.state=pattern;
     b.pattern=pattern==='active'?'heavenSplit':'sweep';
     if(B.swordGroup.parent!==B.root)B.root.add(B.swordGroup);
     const p=swordPose(b);B.swordGroup.position.set(p.x,p.y,p.z);
     B.swordGroup.rotation.set(p.pitch,p.yaw,0);const sc=p.length/SWORD.length;
     B.swordGroup.scale.set(1+(sc-1)*.58,1+(sc-1)*.58,sc);
     if(pattern==='active')g.kwonFractures=makeKwonFractures({...b,x:0,z:0,yaw:0},'heavenSplit',200).map(q=>({...q,age:q.delay+.5}));
     else g.kwonFractures=[];
     stance.update(b);view.update(g);world.update(g);renderer.render(scene,camera);
     return {draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      parent:B.swordGroup.parent===B.root,scale:B.swordGroup.scale.z,
      dropped:B.model.position.z<-.3,screen:world.root.style.display,
      sever:view.root.getObjectByName('kwon-blade-severs-master')?.visible};
    }
    window.__kwonPreview={paint,dispose(){world.dispose();view.dispose();stance.dispose();renderer.dispose();canvas.remove();}};
    return paint(2.3);
   });
   assert.ok(setup.parent&&setup.scale>1&&setup.sever&&setup.draws>0,JSON.stringify(setup));
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-master-cut.png'});
   const possessed=await page.evaluate(()=>window.__kwonPreview.paint(4.3));
   assert.ok(possessed.dropped&&possessed.screen==='block',JSON.stringify(possessed));
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-world-split.png'});
   const strike=await page.evaluate(()=>window.__kwonPreview.paint(.46,'active'));
   assert.ok(strike.draws>0&&strike.scale>1.35&&strike.screen==='block');
   await page.screenshot({path:'artifacts/kwon-possession/'+vp.name+'-rift-strike.png'});
   assert.deepEqual(errors,[]);
   console.log('KWON POSSESSION BROWSER',vp.name,JSON.stringify({setup,possessed,strike}));
   await page.evaluate(()=>window.__kwonPreview.dispose());
  }finally{await page.close();}
 }
}finally{await browser.close();}
