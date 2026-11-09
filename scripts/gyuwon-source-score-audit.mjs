// Report traceable original-track timing coverage and remaining hand-timed
// vocal sections. Never infer a completed transcript from the archived edit.
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
import {GYUWON_ORIGINAL_SUBTITLES,GYUWON_PROVISIONAL_SUBTITLES} from '../src/gyuwon-subtitles.mjs';
import {GYUWON_MASTER_SCENES,gyuwonVerifiedMasterAccents} from '../src/gyuwon-master-director.mjs';

const merge=(cues,duration)=>{
 const result=[];
 for(const c of cues.sort((a,b)=>a.start-b.start)){
  const from=Math.max(0,c.start),end=Math.min(duration,c.end);
  if(end<=from)continue;
  if(!result.length||from>result.at(-1)[1])result.push([from,end]);
  else result.at(-1)[1]=Math.max(result.at(-1)[1],end);
 }
 return result;
};
const round=x=>Math.round(x*100)/100;
export function scoreAudit(){
 return Object.entries(GYUWON_SONGS).map(([key,song])=>{
  const duration=song.duration,source=GYUWON_ORIGINAL_SUBTITLES[key]||[];
  const windows=merge(source.map(x=>({...x})),duration);
  const mappedSeconds=windows.reduce((sum,[start,end])=>sum+end-start,0);
  const unverified=(GYUWON_PROVISIONAL_SUBTITLES[key]||[]).length;
  const scenes=GYUWON_MASTER_SCENES[key]||[];
  const accentCount=gyuwonVerifiedMasterAccents(key).length;
  return {key,track:song.source,duration,sceneAnchors:scenes.length,
   excerptMappedCues:source.length,excerptMappedSeconds:round(mappedSeconds),
   mappedPct:round(mappedSeconds/duration*100),
   excerptDerivedAccents:accentCount,provisionalDisplayCues:unverified,
   manualTranscriptionRequired:mappedSeconds<duration*.94};
 });
}
if(import.meta.url===new URL(process.argv[1],import.meta.url).href){
 console.log('Traceable original-master excerpt alignment. This is NOT a full lyric transcription.');
 for(const item of scoreAudit())console.log(
  [item.key.padEnd(6),item.track.padEnd(36),
   ('sourced '+item.excerptMappedSeconds+'s ('+item.mappedPct+'%)').padEnd(27),
   'accents '+item.excerptDerivedAccents,'provisional lines '+item.provisionalDisplayCues].join(' | '));
 console.log('All uncovered spans require a human source-audio transcription and manual sync before final approval.');
}
