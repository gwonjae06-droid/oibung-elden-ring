import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { execFileSync } from 'node:child_process';
const which=cmd=>{try{return execFileSync('which',[cmd],{encoding:'utf8'}).trim();}catch{return ''}};
const browser=await chromium.launch({
 executablePath:which('google-chrome')||which('google-chrome-stable')||which('chromium'),
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']
});
const mark=p=>p[0]>180&&p[1]>180&&p[2]>165&&Math.max(...p.slice(0,3))-Math.min(...p.slice(0,3))<80;
function scan(buf){
 const {data,width:w,height:h}=PNG.sync.read(buf),rows=new Int32Array(h),cols=new Int32Array(w);
 let bright=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  if(mark([data[i],data[i+1],data[i+2]])){rows[y]++;cols[x]++;bright++;}
 }
 const candidates=(arr,top)=>[...arr].map((n,i)=>({at:i,bright:n,ratio:+(n/top).toFixed(3)}))
  .filter(x=>x.ratio>.035).sort((a,b)=>b.bright-a.bright).slice(0,18);
 let runs=[];
 for(let y=10;y<h-10;y++){
  const count=rows[y];
  if(count>=Math.round(w*.09)&&count>1.5*Math.max(1,(rows[y-3]+rows[y+3])*.5))runs.push({at:y,count,previous:rows[y-3],next:rows[y+3]});
 }
 return {w,h,bright,rows:candidates(rows,w),cols:candidates(cols,h),horizontalRuns:runs.slice(0,35)};
}
try{
 for(const vp of [{width:1280,height:720},{width:1920,height:1080},{width:390,height:844}]){
  const context=await browser.newContext({viewport:vp,deviceScaleFactor:1});
  const page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:8000/spider-combat.html',{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>document.querySelector('#journey')?.dataset.screen==='home',{timeout:40000}).catch(()=>{});
   await page.waitForTimeout(1800);
   const dbg=await page.evaluate(()=>{
    const qs=s=>document.querySelector(s),st=s=>{const el=qs(s);if(!el)return null;
     const r=el.getBoundingClientRect(),c=getComputedStyle(el);
     return {size:[Math.round(r.width),Math.round(r.height)],pos:[Math.round(r.left),Math.round(r.top)],
      display:c.display,opacity:c.opacity,background:c.backgroundImage.slice(0,120),border:c.border,transform:c.transform}};
    return {screen:qs('#journey')?.dataset.screen, svg:st('.j-wall-wide'),tall:st('.j-wall-tall'),
      scene:st('.j-scene'),photo:st('.j-stone-wall'),light:st('.j-light-shafts'),sheen:st('.j-relief-sheen'),
      transitions:document.querySelectorAll('dialog.journey-transition').length};
   });
   console.log('HOME DOM',JSON.stringify(vp),JSON.stringify(dbg));
   const variations=[
    ['baseline',''],
    ['static','*{animation:none!important;transition:none!important}'],
    ['no-svg','.j-scene svg{display:none!important}'],
    ['no-sheen','.j-relief-sheen,.mural-grooves,.groove-inlay{display:none!important}'],
    ['no-air','.j-light-shafts,.j-haze,.j-embers,.j-ash{display:none!important}'],
    ['no-photo-css','.j-photographic{background-image:none!important}']
   ];
   for(const [id,css]of variations){
    const style=css?await page.addStyleTag({content:css}):null;
    await page.waitForTimeout(240);
    const png=await page.screenshot();
    console.log('HOME BRIGHT SCAN',vp.width+'x'+vp.height,id,JSON.stringify(scan(png)));
    await style?.evaluate(el=>el.remove());
   }
  }finally{await context.close();}
 }
}finally{await browser.close();}
