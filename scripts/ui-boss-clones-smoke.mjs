import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const which=name=>{try{return execFileSync('which',[name],{encoding:'utf8'}).trim();}catch{return '';}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium')||which('chromium-browser');
if(!executablePath)throw Error('Chrome/Chromium missing');
const browser=await chromium.launch({executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const scenarios=[
 {name:'desktop',width:1280,height:720,touch:false},
 {name:'mobile-landscape',width:844,height:390,touch:true},
 {name:'narrow-landscape',width:568,height:320,touch:true}
];
const rectFits=(r,w,h)=>r&&r.width>0&&r.height>0&&r.left>=-2&&r.top>=-2&&r.right<=w+2&&r.bottom<=h+2;
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
try{
 for(const scene of scenarios){
  const context=await browser.newContext({viewport:{width:scene.width,height:scene.height},isMobile:scene.touch,hasTouch:scene.touch});
  const page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   const measured=await page.evaluate(async ({touch})=>{
    const [{createDiceUi},{createBloodUi},{createGyuwonUi},{installHudLayout}]=await Promise.all([
     import('./src/dice-ui.mjs'),import('./src/blood-ui.mjs'),
     import('./src/gyuwon-ui.mjs'),import('./src/hud-layout.mjs')
    ]);
    const factories={dice:createDiceUi,blood:createBloodUi,gyuwon:createGyuwonUi};
    const getRect=el=>{const r=el?.getBoundingClientRect();return r?{
     left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;};
    const out={};
    for(const [id,create] of Object.entries(factories)){
     const ui=create({coarse:touch}),ok=await ui.ready;
     let remove=null;
     try{
      if(!ok)throw Error(id+' stylesheet failed to load');
      ui.d.showModal();
      remove=installHudLayout(ui.root);
      ui.mode('playing');
      const el=name=>ui.root.getElementById(name);
      const touchRoot=el('touch');
      const playing={
       player:getRect(el('player-hud')),boss:getRect(el('boss-hud')),
       stick:touch?getRect(el('stick')):null,
       attacks:touch?getRect(ui.root.querySelector('.touch-actions')):null,
       hiddenTouch:touchRoot.hidden
      };
      ui.mode('paused');
      const paused={
       panel:getRect(el('pause-screen')?.querySelector('.small-panel')),
       overlayZ:Number(getComputedStyle(el('pause-screen')).zIndex),
       brandZ:Number(getComputedStyle(ui.root.querySelector('.brand')).zIndex),
       pauseVisible:!el('pause-screen').hidden
      };
      ui.mode('result');
      const result={
       panel:getRect(el('result')?.querySelector('.small-panel')),
       resultVisible:!el('result').hidden
      };
      out[id]={playing,paused,result};
     }finally{remove?.();ui.dispose();}
    }
    return out;
   },{touch:scene.touch});
   for(const [id,ui]of Object.entries(measured)){
    const name=scene.name+'/'+id;
    assert.ok(rectFits(ui.playing.player,scene.width,scene.height),name+' player HUD clipping '+JSON.stringify(ui.playing.player));
    assert.ok(rectFits(ui.playing.boss,scene.width,scene.height),name+' boss HUD clipping '+JSON.stringify(ui.playing.boss));
    assert.ok(ui.paused.pauseVisible,name+' pause dialog missing');
    assert.ok(ui.result.resultVisible,name+' result dialog missing');
    assert.ok(ui.paused.overlayZ>ui.paused.brandZ,name+' modal is behind home header');
    if(scene.touch){
     assert.equal(ui.playing.hiddenTouch,false,name+' hidden touch controls');
     assert.ok(rectFits(ui.playing.stick,scene.width,scene.height),name+' joystick offscreen');
     assert.ok(rectFits(ui.playing.attacks,scene.width,scene.height),name+' attack buttons offscreen');
     assert.ok(overlap(ui.playing.boss,ui.playing.attacks)<1,name+' boss overlaps attacks');
     assert.ok(overlap(ui.playing.boss,ui.playing.stick)<1,name+' boss overlaps joystick');
    }
   }
   console.log('SHADOW BOSS UI',scene.name,JSON.stringify(measured));
  }finally{await context.close();}
 }
}finally{await browser.close();}
