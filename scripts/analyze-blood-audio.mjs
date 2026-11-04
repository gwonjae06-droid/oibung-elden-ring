import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ffmpeg=process.env.FFMPEG_PATH||require('ffmpeg-static');
for(const file of ['assets/music/bloodbgm1.mp3','assets/music/bloodbgm2.mp3','assets/sfx/womanvoice.mp3','assets/sfx/bell.mp3']){
 const result=spawnSync(ffmpeg,['-v','error','-i',file,'-ac','1','-ar','22050','-f','f32le','pipe:1'],{maxBuffer:40*1024*1024});
 if(result.status!==0)throw Error(result.stderr?.toString()||'decode failed');
 const pcm=new Float32Array(result.stdout.buffer,result.stdout.byteOffset,result.stdout.length/4),sr=22050;let sum=0,peak=0,onset=null;const windows=[];
 for(let i=0;i<pcm.length;i++){const v=Math.abs(pcm[i]);sum+=v*v;peak=Math.max(peak,v);if(onset===null&&v>Math.pow(10,-42/20))onset=i/sr;}
 for(let i=0;i<pcm.length;i+=sr){let n=0;for(let j=i;j<Math.min(i+sr,pcm.length);j++)n+=pcm[j]*pcm[j];windows.push({at:Math.round(i/sr),rmsDb:+(20*Math.log10(Math.sqrt(n/Math.min(sr,pcm.length-i))||1e-9)).toFixed(2)});}
 console.log(JSON.stringify({file,duration:pcm.length/sr,onset,peakDb:20*Math.log10(peak),rmsDb:20*Math.log10(Math.sqrt(sum/pcm.length)),loudestSecond:windows.reduce((a,b)=>a.rmsDb>b.rmsDb?a:b),intro:windows.slice(0,8)}));
}
