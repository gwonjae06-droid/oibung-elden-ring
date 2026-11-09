import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
const ffmpeg=createRequire(import.meta.url)('ffmpeg-static');
const cuts={5:[[0,7],[26,33],[40,63.46],[127.6,136],[176.8,179.9]],6:[[0,3],[11.5,14.7],[21,27],[34,39.7],[42.5,54.3],[91,102],[176,179.3]],7:[[0,10.8],[17,25],[32,39.7],[56.5,67],[115.9,120.7],[126,130],[175,178.7]],8:[[0,3],[10,18],[33,47.6],[94,112],[174.5,179]],9:[[0,9],[41,56.6],[93,108],[144,150],[176,179.1]],10:[[0,4],[27,33.56],[53.9,72.72],[118.64,122.64],[132,147],[176.4,179.5]],11:[[0,3],[24,31],[37.92,44.48],[54.32,61.6],[102,108.72],[108.72,116.08],[124,157],[176.5,179.9]],ending:[[0,12.76],[77.5,84],[97,112.26],[112.26,118.88],[137,146],[177,179.5]]};
const plan={crossfade:.18,normalization:'EBU R128 -16 LUFS, true peak -1.5 dB',songs:{}};
for(const [id,song]of Object.entries(GYUWON_SONGS)){
 const regions=cuts[id],cross=.18,total=regions.reduce((s,[a,b])=>s+b-a,0)-cross*(regions.length-1),speed=total/song.duration;
 const filters=regions.map(([a,b],i)=>`[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS[a${i}]`);
 let label='a0';for(let i=1;i<regions.length;i++){filters.push(`[${label}][a${i}]acrossfade=d=${cross}:c1=tri:c2=tri[x${i}]`);label='x'+i;}
 filters.push(`[${label}]atempo=${speed},loudnorm=I=-16:TP=-1.5:LRA=9,apad,atrim=duration=${song.duration},afade=t=out:st=${song.duration-.35}:d=0.35[out]`);
 const file='gyuwon'+id+'.mp3';
 const r=spawnSync(ffmpeg,['-v','error','-y','-i','assets/music/'+song.source,'-filter_complex',filters.join(';'),'-map','[out]','-c:a','libmp3lame','-b:a','192k','-ar','44100','-metadata','title='+song.source.replace('.mp3','')+' - ODEN RING stage edit','assets/music/'+file],{maxBuffer:10e6});
 if(r.status!==0)throw Error(r.stderr.toString());
 let offset=0;const mapped=regions.map(([start,end],i)=>{const out={sourceStart:start,sourceEnd:end,editStart:offset/speed,editEnd:(offset+end-start)/speed};offset+=end-start-(i<regions.length-1?cross:0);return out;});
 plan.songs[id]={source:song.source,file,duration:song.duration,speed,regions:mapped};console.log(id,file,song.duration,'seconds, tempo',speed.toFixed(3));
}
fs.writeFileSync('assets/music/gyuwon-edit-manifest.json',JSON.stringify(plan,null,2)+'\n');


const coda=spawnSync(ffmpeg,['-v','error','-y','-i','assets/music/When the Music Ends.mp3','-af','atrim=start=165:end=179,asetpts=PTS-STARTPTS,afade=t=in:d=0.8,afade=t=out:st=12:d=2,loudnorm=I=-23:TP=-3:LRA=7','-c:a','libmp3lame','-b:a','192k','assets/music/gyuwoncoda.mp3'],{maxBuffer:1e6});if(coda.status!==0)throw Error(coda.stderr.toString());
