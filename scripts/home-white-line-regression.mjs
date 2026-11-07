import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const which=s=>{try{return execFileSync('which',[s],{encoding:'utf8'}).trim();}catch{return ''}};
const executablePath=which('google-chrome')||which('google-chrome-stable')||which('chromium');
if(!executablePath)throw Error('Chrome/Chromium required');
const browser=await chromium.launch({executablePath,headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
await mkdir('artifacts/home-mural',{recursive:true});
try{
 for(const {name,width,height} of [
  {name:'desktop-1280',width:1280,height:720},
  {name:'desktop-1920',width:1920,height:1080},
  {name:'mobile-portrait',width:390,height:844},
  {name:'mobile-landscape',width:844,height:390}]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  const page=await ctx.newPage();
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='home',{timeout:45000});
   await page.waitForTimeout(800);
   const layout=await page.evaluate(()=>{
    const scene=document.querySelector('#journey .j-photographic');
    const active=[...scene.querySelectorAll('svg')].find(x=>getComputedStyle(x).display!=='none');
    const wall=active?.querySelector('.j-stone-wall');
    const r=wall?.getBoundingClientRect(),s=scene.getBoundingClientRect();
    const ids=[...document.querySelectorAll('#journey clipPath[id]')].map(x=>x.id);
    return {
     scene:{left:s.left,top:s.top,width:s.width,height:s.height},
     wall:r&&{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},
     wallMode:active?.getAttribute('preserveAspectRatio'),
     wallpaper:getComputedStyle(scene).backgroundImage,
     ghosts:scene.querySelectorAll('.j-relief-sheen,[id*="stone-hot-inlay"]').length,
     ids,visibleSvg:active?.classList.contains('j-wall-tall')?'tall':'wide'
    };
   });
   assert.ok(layout.wall,'mural wall image not painted');
   assert.equal(layout.wallpaper,'none','CSS wallpaper must not double the SVG image');
   assert.equal(layout.wallMode,'xMidYMid slice','photo must cover, not letterbox');
   assert.equal(layout.ghosts,0,'white sweeping rectangular glow must be absent');
   assert.equal(new Set(layout.ids).size,layout.ids.length,'clipping references must be unique');
   assert.ok(layout.wall.left<=1&&layout.wall.right>=width-1,
    name+' horizontal seam: SVG does not cover full viewport '+JSON.stringify(layout));
   assert.ok(layout.wall.top<=1&&layout.wall.bottom>=height-1,
    name+' vertical seam: SVG does not cover full viewport '+JSON.stringify(layout));
   await page.screenshot({path:'artifacts/home-mural/'+name+'.png'});
   console.log('HOME MURAL SEAM-FREE',name,JSON.stringify(layout));
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
