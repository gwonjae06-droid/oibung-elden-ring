// Optional authoring tool. Models download locally; source audio never leaves
// this machine and no speech-recognition dependency is shipped to the game.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';import {pipeline,env} from '@huggingface/transformers';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
env.cacheDir=path.resolve('qa-output/model-cache');env.allowLocalModels=false;fs.mkdirSync('qa-output/audio',{recursive:true});
const clips={5:[[125,138]],7:[[15,26],[104,118]],8:[[8,20],[84,108]],9:[[14,26],[90,109],[109,136]],10:[[101,120]],11:[[22,38]],ending:[[19,29],[51,62],[139,150]]};
const decode=(song,start=0,end=180)=>{const r=spawnSync(ffmpeg,['-v','error','-ss',String(start),'-i','assets/music/'+song.source,'-t',String(end-start),'-ar','16000','-ac','1','-f','f32le','pipe:1'],{maxBuffer:20e6});if(r.status!==0)throw Error(r.stderr.toString());return new Float32Array(r.stdout.buffer,r.stdout.byteOffset,r.stdout.length/4);};
for(const [size,suffix]of [['small','aligned'],['base','words']]){
 const asr=await pipeline('automatic-speech-recognition',`Xenova/whisper-${size}.en`,{dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:4,interOpNumThreads:1}});
 try{for(const [key,song]of Object.entries(GYUWON_SONGS)){
  const file=`qa-output/audio/${key}-${suffix}.json`;
  if(!fs.existsSync(file)){const result=await asr(decode(song),{return_timestamps:'word',chunk_length_s:20,stride_length_s:3,no_repeat_ngram_size:7,repetition_penalty:1.05});fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(key,size,result.chunks.length);}
  if(size==='small'&&clips[key]){const chunks=[];for(const [start,end]of clips[key]){const result=await asr(decode(song,start,end),{return_timestamps:'word',no_repeat_ngram_size:5,repetition_penalty:1.04});chunks.push(...result.chunks.map(c=>({...c,timestamp:c.timestamp.map(t=>t===null?end:t+start)})));}fs.writeFileSync(`qa-output/audio/${key}-patch.json`,JSON.stringify({chunks},null,2));}
 }}finally{await asr.dispose();}
}
