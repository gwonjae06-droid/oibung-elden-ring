const fs = require('node:fs');
const path = require('node:path');
const {spawn,execFileSync} = require('node:child_process');
const {once} = require('node:events');
const {chromium} = require('playwright');
const {server,root,captures} = require('./oden-montage/montage-server.cjs');

const boss=process.argv[2];
const tracks={kwon:['swordbgm.mp3','swordbgm2.mp3'],clown:['clown1.mp3','clown2.mp3'],
  dice:['dicebgm.mp3','dicebgm2.mp3'],blood:['bloodbgm1.mp3','bloodbgm2.mp3']};
if(!Object.hasOwn(tracks,boss))throw new Error('Pass one of: kwon, clown, dice, blood');
const hz=48000;
const ffmpeg=process.env.ODEN_FFMPEG||'ffmpeg';
const media=(group,file)=>path.join(root,'assets',group,file);
const clamp=(x)=>Math.max(0,Math.min(1,x));
const heavy='dragon-studio-hard-heavy-impact-515256.mp3';
const sword='freesound_community-sword-sound-2-36274.mp3';
const wind='yodguard-wind-magic-5-378630.mp3';
const glass='dragon-studio-window-smash-sfx-382708.mp3';
const cueFiles={
  'boss-hit':['hit.mp3',.85,1], 'phase':['bodycreak.mp3',.65,2], 'victory':['bossdie.mp3',1.05,3],
  'swing':[sword,.42,.8], 'shot':['u_2c8g87fmmx-bow-sound-596323.mp3',.62,.8],
  'roll':[wind,.26,.6], 'boss-swing':[sword,.72,.95], 'boss-shot':[wind,.64,.85],
  'kwon-rift-release':[glass,.69,1.4], 'kwon-moon-slash':[sword,.92,1.1],
  'kwon-moon-fall':[glass,.75,1.7], 'kwon-meteor-impact':[heavy,.91,1.35],
  'dice-warning':['freesound_community-rolling-dice-2-102706.mp3',.32,1.5],
  'dice-jump':[wind,.54,1.6], 'dice-impact':[heavy,.85,1.3],
  'dice-giant-neck-impact':[heavy,.86,1.6], 'dice-phase-change':['bodycreak.mp3',.64,1.2],
  'dice-giant-head-impact':[heavy,.86,1.3], 'dice-giant-eight-ball-impact':[heavy,.93,1.4],
  'dice-giant-palm-impact':[heavy,.64,1.4],
  'clown-clap':['clap.mp3',.82,1.2], 'clown-juggle':['clown-jump.mp3',.58,1],
  'clown-blast':[heavy,.72,1.3], 'clown-dash':[wind,.47,1.05],
  'clown-finale':['circuswarp.mp3',.8,1.6], 'clown-fire':['yodguard-fire-magic-5-378639.mp3',.68,1.4],
  'clown-troupe-cast':['clown-jump.mp3',.52,1], 'clown-impact':[heavy,.55,1.05],
  'clown-phase2':['nightmaretransition.mp3',.65,2.5], 'clown-phase3':['circuswarp.mp3',.52,1.65],
  'blood-impact':['bloodsplash.mp3',.63,1.2], 'blood-tsunami-approach':['tsunami.mp3',.88,4.8],
  'blood-cathedral-shatter':[glass,.9,1.6], 'blood-sea-crash':['bloodsplash.mp3',.9,1.4],
  'blood-seraph-reveal':['bell.mp3',.8,2.4], 'blood-whip-impact':[wind,.8,1.25],
};
const rootCues={'clap.mp3':1,'clown-jump.mp3':1};

function decode(file,seconds,offset=0){
  const bytes=execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(offset),'-i',file,
    '-t',String(seconds),'-ar',String(hz),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
  return new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
}
function peak(signal){let value=0;for(let i=0;i<signal.length;i++)value=Math.max(value,Math.abs(signal[i]));return value;}

function score(events,seconds){
  const samples=Math.ceil(seconds*hz);
  const music=new Float32Array(samples*2),fx=new Float32Array(samples*2);
  const tracksForBoss=tracks[boss];
  const act2=events.find(e=>e.type==='phase-marker'&&e.phase===2)?.t??seconds;
  const win=events.find(e=>e.type==='victory')?.t??seconds;
  const sections=[{start:0,end:Math.min(seconds,act2+.34),file:tracksForBoss[0]},
    {start:Math.max(0,act2-.34),end:seconds,file:tracksForBoss[1]}];
  for(const {start,end,file} of sections){
    if(end-start<.1)continue;
    const clip=decode(media('music',file),end-start);
    const gain=.38/Math.max(.32,peak(clip));
    const from=Math.floor(start*hz);
    for(let i=0;i<clip.length/2&&from+i<samples;i++){
      const t=i/hz;
      const fade=clamp(t/(start===0?.28:.63))*clamp((end-start-t)/(end===seconds?1.22:.60));
      const victoryDuck=1-.62*clamp((start+t-win+.16)/.39);
      music[(from+i)*2]+=clip[2*i]*gain*fade*victoryDuck;
      music[(from+i)*2+1]+=clip[2*i+1]*gain*fade*victoryDuck;
    }
  }
  const first={t:.15,type:'intro'};
  const musicEvents=[first,...events];
  const cueCache=new Map(),previous=new Map();
  for(const {t,type} of musicEvents){
    const cue=type==='intro'?['bossstart.mp3',.61,2.2]:cueFiles[type];
    if(!cue)continue;
    const [file,volume,span]=cue;
    if(t-(previous.get(file)??-10)<(type==='blood-impact'?.20:.16))continue;
    previous.set(file,t);
    const key=file+':'+span;
    if(!cueCache.has(key)){
      const clip=decode(rootCues[file]?path.join(root,file):media('sfx',file),span);
      cueCache.set(key,{clip,gain:.53/Math.max(.22,peak(clip))});
    }
    const {clip,gain}=cueCache.get(key);
    const from=Math.max(0,Math.floor(t*hz)),len=Math.min(clip.length/2,samples-from);
    for(let i=0;i<len;i++){
      const scale=volume*gain*clamp((len-i)/(hz*.045))*clamp(i/(hz*.007));
      fx[(from+i)*2]+=clip[i*2]*scale;
      fx[(from+i)*2+1]+=clip[i*2+1]*scale;
    }
  }
  const pcm=Buffer.allocUnsafe(samples*4);
  let follow=0;
  for(let i=0;i<samples;i++){
    const idx=i*2;
    follow=Math.max(Math.abs(fx[idx]),Math.abs(fx[idx+1]),follow*.99980);
    const duck=1/(1+1.75*follow);
    for(let channel=0;channel<2;channel++){
      const v=Math.tanh((music[idx+channel]*duck+fx[idx+channel])*1.38)*.95;
      pcm.writeInt16LE(Math.round(v*32767),i*4+channel*2);
    }
  }
  return pcm;
}

async function run(){
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  let browser,encoder;
  const silent=path.join(captures,boss+'-silent.mp4');
  const log=[];
  try{
    browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
    const page=await browser.newPage({viewport:{width:1152,height:648},deviceScaleFactor:1});
    page.on('pageerror',error=>log.push(error.stack));
    page.on('console',msg=>{if(msg.type()==='error')log.push(msg.text().slice(0,1300));});
    await page.goto('http://127.0.0.1:'+server.address().port+'/spider-combat.html?boss='+boss,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__shoot?.ready||window.__shoot?.error,null,{timeout:120000,polling:125});
    const failed=await page.evaluate(()=>window.__shoot.error);
    if(failed)throw new Error(failed);
    const endedVideo=new Promise((resolve,reject)=>{
      encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0',
         '-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-video_track_timescale','30000',silent],{stdio:['pipe','ignore','inherit']});
      encoder.once('error',reject);
      encoder.once('close',code=>code===0?resolve():reject(new Error('Video encoder failed '+code)));
      encoder.stdin.on('error',reject);
    });
    endedVideo.catch(()=>{});
    const events=[];
    let result,progress=0,frames=0;
    do{
      result=await page.evaluate(()=>window.__shoot.batch(12));
      events.push(...result.events);
      frames+=result.frames.length;
      if(frames-progress>=150){
        progress=frames;
        console.log(boss,(frames/30).toFixed(1)+'s', 'phase',result.phase,'shots left',result.shot);
        fs.writeFileSync(path.join(captures,boss+'-phase-'+result.phase+'.jpg'),Buffer.from(result.frames.at(-1),'base64'));
      }
      for(const frame of result.frames){if(!encoder.stdin.write(Buffer.from(frame,'base64')))await once(encoder.stdin,'drain');}
    }while(!result.done&&frames<3000);
    encoder.stdin.end();await endedVideo;
    if(result.status!=='won'||!events.some(e=>e.type==='victory'))throw new Error('Victory footage missing');
    const length=frames/30;
    const sound=score(events,length);
    const mixed=path.join(captures,boss+'.mp4');
    execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',silent,
      '-f','s16le','-ar',String(hz),'-ac','2','-i','pipe:0','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(length),'-movflags','+faststart',mixed],{input:sound,maxBuffer:2*1024*1024});
    fs.writeFileSync(path.join(captures,boss+'-events.json'),JSON.stringify({frames,length,events},null,2));
    fs.rmSync(silent);
    console.log(boss,'done',length,'seconds',fs.statSync(mixed).size,'bytes');
  }finally{
    if(log.length)console.error(log.slice(-25).join('\n'));
    if(encoder&&!encoder.stdin.destroyed)encoder.stdin.end();
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
