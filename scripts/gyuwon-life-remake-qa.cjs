const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
(async()=>{
 const coarse=process.env.GYUWON_COARSE==='1';
 const root=path.resolve(__dirname,'..'),output=path.join(root,'qa-output/life-remake'+(coarse?'-coarse':''));await fs.mkdir(output,{recursive:true});
 const modulePath=path.join(path.dirname(require.resolve('three')),'three.module.js');
 const html=`<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/${path.relative(root,modulePath).split(path.sep).join('/')}"}}</script><style>html,body{margin:0;background:#171e27}#film{position:fixed;inset:0}canvas{width:100%;height:100%;display:block}</style><div id="film"><canvas id="world"></canvas></div>`;
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname);
  if(name==='/life-qa.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error('path');
  const buffer=await fs.readFile(file),match=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');
  if(match){const a=+match[1],b=match[2]?Math.min(+match[2],buffer.length-1):buffer.length-1;res.writeHead(206,{'Content-Range':`bytes ${a}-${b}/${buffer.length}`,'Content-Length':b-a+1});res.end(buffer.subarray(a,b+1));}else res.end(buffer);
 }catch{res.writeHead(404);res.end('missing');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;const errors=[],shots=[];
 try{
  browser=await chromium.launch({executablePath:process.env.EDGE_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'/usr/bin/google-chrome'),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram|Journey finale failed/i.test(m.text()))errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/life-qa.html`);
  await page.evaluate(async coarse=>{
   localStorage.setItem('oibung-muted','1');const T=await import('three'),{createGyuwonActor}=await import('/src/gyuwon-actor.mjs'),{createGyuwonLifeEpilogue}=await import('/src/gyuwon-life-epilogue.mjs');
   const source=createGyuwonActor(new T.Group(),{coarse}),renderer=new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:!coarse});
   renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.shadowMap.enabled=!coarse;
   const qa=window.qa={renderer,source,complete:0,last:0,frames:[]};
   qa.film=createGyuwonLifeEpilogue(document,document.getElementById('film'),{source:source.root,coarse,onComplete:()=>qa.complete++});qa.film.start();
  },coarse);
  for(const time of [1.5,5,10,16,24,36,47,57,72,86,100,109,120,134,142,146.8]){
   const data=await page.evaluate(time=>{
    const {film,renderer}=qa;film.update(time-qa.last);qa.last=time;
    const before=performance.now();film.render(renderer,renderer.domElement);const compileFrame=performance.now()-before;
    const samples=[];for(let i=0;i<4;i++){const at=performance.now();film.render(renderer,renderer.domElement);samples.push(performance.now()-at);}
    return {time,frame:film.frame(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,submitMs:samples,firstSubmitMs:compileFrame,stage:film.stage.stats()};
   },time);shots.push(data);await page.screenshot({path:path.join(output,`${String(time).replace('.','-')}-${data.frame.shot}.png`)});console.log('LIFE_SHOT',time,data.frame.shot,data.calls,data.triangles);
  }
  for(const time of [10,72,120,146.8]){
   await page.setViewportSize({width:844,height:390});
   await page.evaluate(time=>{qa.film.reset();qa.film.start();qa.film.update(time);qa.renderer.setSize(innerWidth,innerHeight);qa.film.render(qa.renderer,qa.renderer.domElement);},time);
   await page.screenshot({path:path.join(output,`mobile-${time}.png`)});
  }
  assert.deepEqual(errors,[]);
  let baseline=[];
  if(sync.existsSync(path.join(output,'base-stage.mjs'))){
   baseline=await page.evaluate(async()=>{
    const {createGyuwonLifeStage3d}=await import('/qa-output/life-remake/base-stage.mjs');
    const {gyuwonLifeFrame}=await import('/src/gyuwon-life-epilogue.mjs');
    const old=createGyuwonLifeStage3d({doc:document,source:qa.source.root,coarse:false}),samples=[];
    for(const time of [16,24,36,47,57,72,86,100,120,134,142]){
     old.update(gyuwonLifeFrame(time),1280,800);old.render(qa.renderer);
     const submit=[];for(let i=0;i<4;i++){const t=performance.now();old.render(qa.renderer);submit.push(performance.now()-t);}
     samples.push({time,calls:qa.renderer.info.render.calls,triangles:qa.renderer.info.render.triangles,submitMs:submit});
    }old.dispose();return samples;
   });
  }
  let natural=null;
  if(process.env.GYUWON_NATURAL==='1'){
   await page.setViewportSize({width:1280,height:800});
   await page.evaluate(()=>{
    qa.film.reset();qa.film.start();qa.renderer.setSize(innerWidth,innerHeight);qa.complete=0;qa.frames=[];let last=null;
    function frame(now){
     const dt=last===null||document.hidden?0:(now-last)/1000;last=document.hidden?null:now;
     if(!document.hidden){qa.film.update(dt);qa.film.render(qa.renderer,qa.renderer.domElement);if(qa.frames.length<1000)qa.frames.push(dt*1000);}
     if(!qa.complete)qa.request=requestAnimationFrame(frame);
    }qa.request=requestAnimationFrame(frame);
   });
   const begun=Date.now();let previous='',last=null;const corridorPhotos=new Set();
   while(Date.now()-begun<220000){
    last=await page.evaluate(()=>({time:qa.film.frame().time,shot:qa.film.frame().shot,complete:qa.complete,modal:document.querySelector('dialog:modal')?.className||null}));
    if(last.shot!==previous){console.log('LIFE_NATURAL',last.shot,last.time.toFixed(2));previous=last.shot;}
    for(const [at,name]of [[151,'mural-opening'],[164,'original-corridor'],[177,'original-credits']])if(last.time>=at&&!corridorPhotos.has(name)){await page.screenshot({path:path.join(output,name+'.png')});corridorPhotos.add(name);}
    if(last.complete)break;await page.waitForTimeout(400);
   }
   assert.equal(last.complete,1);assert.ok(Date.now()-begun>=180000);assert.equal(last.modal,null);
   natural={elapsedMs:Date.now()-begun,last,frameMs:await page.evaluate(()=>qa.frames)};
  }
  await page.evaluate(()=>{cancelAnimationFrame(qa.request);qa.film.dispose();qa.source.dispose();qa.renderer.dispose();});
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,'report.json'),JSON.stringify({shots,baseline,natural,errors},null,2));console.log('LIFE_QA_PASS',JSON.stringify({shots:shots.length,natural:!!natural,errors}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
