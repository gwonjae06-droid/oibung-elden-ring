// Original-master performance map. Anchor locations were selected from source
// excerpts used by the old short score; section *roles* are staging decisions,
// NOT certified audio transcription or beat detection of the full MP3.
import {GYUWON_BEATS} from './gyuwon-beat-chart.mjs';
import {GYUWON_EDITED_REGIONS,originalTimingForEditedCue} from './gyuwon-original-timeline.mjs';
import {GYUWON_SONGS} from './gyuwon-song-data.mjs';

export const GYUWON_MASTER_SCENES=Object.freeze({
 5:[[0,'overture'],[7,'entrance'],[26,'verse'],[40,'ensemble'],[64,'change'],[127.6,'reprise'],[176.8,'exit']],
 6:[[0,'overture'],[11.5,'meadow'],[34,'bridge'],[54.3,'rain'],[91,'quiet'],[102,'sunrise'],[132,'skyroad'],[158,'final-sprint'],[176,'exit']],
 7:[[0,'overture'],[17,'march'],[32,'ensemble'],[56.5,'countermarch'],[115.9,'lonely'],[126,'reunion'],[175,'exit']],
 8:[[0,'overture'],[10,'pose'],[33,'turns'],[47.6,'ensemble'],[94,'bridge'],[112,'encore'],[174.5,'bow']],
 9:[[0,'entrance'],[9,'round1'],[41,'round2'],[56.6,'duel'],[93,'breather'],[108,'round3'],[144,'climax'],[176,'bow']],
 10:[[0,'launch'],[27,'city'],[53.9,'duo'],[72.72,'ascent'],[118.64,'starlight'],[132,'carrier'],[147,'victory'],[176.4,'exit']],
 11:[[0,'solo'],[24,'memory'],[37.92,'actors'],[54.32,'runner'],[61.6,'parade'],[102,'breather'],[108.72,'stars'],[124,'grand-chorus'],[157,'curtain-call'],[176.5,'bow']],
 ending:[[0,'silence'],[12.76,'narration'],[77.5,'reprise'],[97,'question'],[112.26,'reflection'],[137,'farewell'],[177,'afterglow']]
});
export const gyuwonMasterScene=(key,time)=>{
 const list=GYUWON_MASTER_SCENES[key]||[];
 const now=Number.isFinite(time)?time:0;
 let index=0;
 for(let i=1;i<list.length&&list[i][0]<=now;i++)index=i;
 return {key,kind:list[index]?.[1]||'overture',index,start:list[index]?.[0]||0,
  end:list[index+1]?.[0]||GYUWON_SONGS[key]?.duration||180};
};

export const gyuwonVerifiedMasterAccents=key=>{
 const edited=GYUWON_BEATS[key]?.notes||[];
 return edited.flatMap(n=>{
  const mapped=originalTimingForEditedCue(key,{start:n.at,end:n.at+.03});
  return mapped?[{at:mapped.start,key:n.key,lane:n.lane,source:'source-excerpt'}]:[];
 }).sort((a,b)=>a.at-b.at);
};

const pulseCache=new Map();
export function gyuwonMasterRhythmNotes(key){
 if(pulseCache.has(key))return pulseCache.get(key);
 const original=gyuwonVerifiedMasterAccents(key);
 const bpm=GYUWON_BEATS[key]?.bpm||GYUWON_SONGS[key]?.bpm||120;
 const duration=GYUWON_SONGS[key]?.duration||180;
 // Sparse 4/8-count accompaniment in *unverified* passages. It must be
 // replaced with manually checked transient anchors before claiming full sync.
 const sparse=[],interval=60/bpm*6;
 for(let t=4.2,i=0;t<duration-4;t+=interval,i++){
  const section=gyuwonMasterScene(key,t).kind;
  if(['overture','quiet','lonely','breather','silence','narration','afterglow','bow'].includes(section))continue;
  if(original.some(a=>Math.abs(a.at-t)<interval*.52))continue;
  sparse.push({at:+t.toFixed(3),key:['light','skill','light','roll'][i%4],lane:i%4,source:'guide-grid'});
 }
 const result=Object.freeze([...original,...sparse].sort((a,b)=>a.at-b.at)
  .filter((a,i,all)=>i===0||a.at-all[i-1].at>.36));
 pulseCache.set(key,result);
 return result;
}
// Only align to a known source-master accent when the candidate is close
// enough; do not change the overall tempo using an arbitrary time stretch.
export function gyuwonAlignDanceBeat(at,key=8){
 const known=gyuwonVerifiedMasterAccents(key);
 let best=null,delta=.24;
 for(const n of known){const d=Math.abs(n.at-at);if(d<delta){best=n;delta=d;}}
 return best?best.at:at;
}
