import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CAPTION_LINES} from './gyuwon-caption-lines.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
const norm=s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]/g,'');
const lev=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){let next=[i+1];for(let j=0;j<b.length;j++)next[j+1]=Math.min(row[j+1]+1,next[j]+1,row[j]+(a[i]===b[j]?0:1));row=next;}return row.at(-1);};
const cost=(a,b)=>a===b?0:lev(a,b)/Math.max(a.length,b.length)<.34?.4:1;
const edit=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){let next=[i+1];for(let j=0;j<b.length;j++)next[j+1]=Math.min(row[j+1]+1,next[j]+1,row[j]+cost(a[i],b[j]));row=next;}return row.at(-1);};
const out={},audit=[];
for(const [key,lines]of Object.entries(CAPTION_LINES)){
 const tracks=['aligned','words', 'patch'].filter(s=>fs.existsSync(`qa-output/audio/${key}-${s}.json`)).map(s=>({kind:s,words:JSON.parse(fs.readFileSync(`qa-output/audio/${key}-${s}.json`)).chunks.map(x=>({...x,token:norm(x.text)})).filter(x=>x.token&&x.timestamp[0]>=0&&x.timestamp[0]<179&&x.timestamp[1]>x.timestamp[0])}));
 if(!tracks.length)throw Error('Missing original-recording word timings. Run node scripts/transcribe-gyuwon-originals.mjs first.');
 const cues=[];
 for(const line of lines.split('\n')){
  const [hintText,en,ko]=line.split('|'),hint=+hintText,tokens=en.split(/\s+/).map(norm).filter(Boolean);let best=null;
  for(const track of tracks)for(let i=0;i<track.words.length;i++){
   const w=track.words[i];if(Math.abs(w.timestamp[0]-hint)>6)continue;
   for(let n=Math.max(1,tokens.length-3);n<=tokens.length+3;n++){
    const part=track.words.slice(i,i+n);if(part.length!==n)continue;
    const last=part.at(-1),rawEnd=last.timestamp[1],end=Math.min(rawEnd,last.timestamp[0]+2.5),start=w.timestamp[0];
    if(end<=start||end-start>12)continue;
    const confidence=1-edit(tokens,part.map(x=>x.token))/Math.max(n,tokens.length),score=confidence-Math.abs(start-hint)*.035-(track.kind==='words'?.018:track.kind==='patch'?-.04:0);
    if(!best||score>best.score)best={score,confidence,start,end,kind:track.kind};
   }
  }
  if(!best||best.confidence<.57||best.score<.49){audit.push({key,hint,en,status:'unresolved',best});continue;}
  const c={start:+best.start.toFixed(2),end:+(best.end+.14).toFixed(2),en,ko,alignment:+best.confidence.toFixed(3)};cues.push(c);audit.push({key,hint,en,status:'aligned',...best});
 }
 if(key==='8'){const first=cues.find(c=>c.en.startsWith('Can you hear'));if(first){first.start=10.635;first.end=15.471;first.timing='source-excerpt';}const reply=cues.find(c=>c.en==='Everywhere I go');if(reply){reply.start=15.471;reply.end=17.446;reply.timing='source-excerpt';}}
 cues.sort((a,b)=>a.start-b.start);for(let i=0;i<cues.length;i++){if(cues[i+1])cues[i].end=Math.min(cues[i].end,cues[i+1].start);}
 out[key]=cues.filter(c=>c.end>c.start+.08);
}
const sources=Object.fromEntries(Object.entries(GYUWON_SONGS).map(([key,song])=>[key,{file:song.source,sha256:createHash('sha256').update(fs.readFileSync('assets/music/'+song.source)).digest('hex'),timeBase:'audio.currentTime'}]));
fs.writeFileSync('src/gyuwon-aligned-captions.mjs',"// Word-aligned against the unmodified original recordings with local Whisper\n// small.en/base.en and reviewed phrase text. ASR alignment is not a human\n// listening certification. Instrumentals and rejected hallucinations stay blank.\nexport const GYUWON_CAPTION_SOURCES="+JSON.stringify(sources,null,1)+';\nexport const GYUWON_ALIGNED_CAPTIONS='+JSON.stringify(out,null,1)+';\n');
fs.writeFileSync('qa-output/caption-alignment-audit.json',JSON.stringify(audit,null,2));
for(const [key,cues]of Object.entries(out))console.log(key,cues.length,'cues');
console.log('UNRESOLVED',audit.filter(x=>x.status==='unresolved').map(x=>({key:x.key,hint:x.hint,en:x.en,confidence:x.best?.confidence})));
