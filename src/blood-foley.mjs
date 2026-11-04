const dir='assets/sfx/';
export const BLOOD_FOLEY=Object.freeze({
 wet:dir+'universfield-sword-blade-slicing-flesh-352708.mp3',
 impact:dir+'dragon-studio-hard-heavy-impact-515256.mp3',
 heavy:dir+'dragon-studio-heavy-impact-loud-515259.mp3',
 tear:dir+'freesound_community-sword-sound-2-36274.mp3'
});
// Sparse physical recordings. No synthesized backup, no cue over the prayer/bell.
export function bloodFoleySpec(ev,g){
 if(g.boss.state==='transition')return null;
 if(ev.type==='hurt')return {file:BLOOD_FOLEY.wet,volume:.26,rate:.9,duration:.6,fade:.2,minGap:.3};
 if(ev.type!=='blood-impact')return null;
 const id=g.blood.pattern,heavy=['burst','dive','tide'].includes(id),tear=['wing','chain','pursuit'].includes(id);
 return {file:heavy?(id==='dive'?BLOOD_FOLEY.heavy:BLOOD_FOLEY.impact):tear?BLOOD_FOLEY.tear:BLOOD_FOLEY.wet,
  volume:heavy?.33:tear?.2:.17,rate:heavy?.86:tear?.94:.88,duration:heavy?.9:.52,fade:.18,minGap:heavy?.4:.22};
}
