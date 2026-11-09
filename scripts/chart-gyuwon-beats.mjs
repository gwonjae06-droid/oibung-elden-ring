import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
const ff=createRequire(import.meta.url)('ffmpeg-static'),tracks={};
for(const [id,s]of Object.entries(GYUWON_SONGS)){
 const r=spawnSync(ff,['-v','error','-i','assets/music/'+s.file,'-ar','11025','-ac','1','-f','f32le','pipe:1'],{maxBuffer:10e6});if(r.status!==0)throw Error(r.stderr.toString());const pcm=new Float32Array(r.stdout.buffer,r.stdout.byteOffset,r.stdout.length/4),hop=256,step=hop/11025,energy=[],flux=[];
 for(let i=0;i<pcm.length;i+=hop){let v=0;for(let j=i;j<Math.min(i+hop,pcm.length);j++)v+=pcm[j]*pcm[j];energy.push(v/hop);}
 for(let i=0;i<energy.length;i++){const base=energy.slice(Math.max(0,i-8),i).reduce((a,b)=>a+b,0)/Math.min(8,i||1);flux.push(Math.max(0,energy[i]-base));}
 let best={value:-1,bpm:s.bpm,phase:0};
 // Score periodic accent energy over candidate acoustic tempi and phases.
 for(let bpm=s.bpm*.85;bpm<=s.bpm*1.15;bpm+=.5){const period=60/bpm;
  for(let phase=0;phase<period;phase+=step){let value=0,n=0;for(let t=phase;t<s.duration-.3;t+=period){const i=Math.round(t/step);value+=Math.max(flux[i]||0,flux[i-1]||0,flux[i+1]||0);n++;}value=value/Math.max(1,n)*(1-.3*Math.abs(bpm-s.bpm)/s.bpm);if(value>best.value)best={value,bpm,phase};}
 }
 const notes=[];let index=0;for(let t=best.phase;t<s.duration-.65;t+=120/best.bpm){const i=Math.round(t/step);if(t<3||energy[i]<.0002)continue;notes.push({at:+t.toFixed(3),key:['light','light','roll','light','skill','light','roll','light'][index%8],lane:index++%4});}
 tracks[id]={bpm:+best.bpm.toFixed(2),offset:+best.phase.toFixed(3),notes};console.log(id,tracks[id].bpm,notes.length,'notes');
}
fs.writeFileSync('src/gyuwon-beat-chart.mjs','// Acoustic accent analysis of the edited masters. Silent frames do not receive notes.\nexport const GYUWON_BEATS='+JSON.stringify(tracks)+';\n');
