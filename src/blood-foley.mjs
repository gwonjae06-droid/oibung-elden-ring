// Dedicated, user-uploaded physical blood recordings for the Blood King.
// All paths are real files under assets/sfx; no synthesized fallback.
const dir='assets/sfx/';
export const BLOOD_FOLEY=Object.freeze({
 hit:dir+'bloodhit.mp3',
 hit2:dir+'bloodhit2.mp3',
 hit3:dir+'bloodhit3.mp3',
 hit4:dir+'bloodhit4.mp3',
 hit5:dir+'bloodhit5.mp3',
 splash:dir+'bloodsplash.mp3'
});

// Keep sound choices aligned with the actual combat pattern IDs.
// These are casting / terrain impacts, not player weapon-hit events.
export const BLOOD_ATTACK_SOUNDS=Object.freeze({
 wave:'splash',
 fountain:'splash',
 burst:'hit5',
 orbs:'hit',
 chain:'hit3',
 orbit:'hit2',
 vortex:'splash',
 dive:'hit5',
 eclipse:'hit4',
 rain:'splash',
 wing:'hit3',
 pulse:'hit4',
 pursuit:'hit2',
 tide:'splash',lances:'hit5',cross:'splash',judgement:'hit3',ritual:'hit4',bloodScissors:'hit3',heartCage:'hit4',wingShear:'hit3',rosary:'splash',reverseFlow:'splash',bloodStatues:'hit3',wingGenesis:'splash',heartFeast:'hit4'
});
const WET_CHARGE=new Set(['wave','fountain','vortex','rain','tide','cross','ritual','heartCage','rosary','reverseFlow','bloodStatues','heartFeast']);
const HEAVY=new Set(['burst','dive','eclipse','pursuit','tide','lances','judgement','ritual','bloodScissors','wingShear','wingGenesis','heartFeast']);
const WET_HIT=new Set(['wave','fountain','vortex','rain','tide','reverseFlow','wingGenesis']);

function cue(file,volume,duration,fade,minGap){
 return {file,rate:1,volume,duration,fade,minGap,natural:true};
}
// Sparse, layered SFX: one subdued wet windup, the actual spell release,
// and a short blood strike only when a wet attack really damages the player.
// The standard hit.mp3 plays separately for every player damage event.
export function bloodFoleySpec(ev,g){
 if(!ev||!g?.blood||g.boss?.state==='transition')return null;
 const id=ev.pattern||g.blood.pattern,key=BLOOD_ATTACK_SOUNDS[id];
 if(!key)return null;
 if(ev.type==='blood-warning')
  return WET_CHARGE.has(id)?cue(BLOOD_FOLEY.splash,.10,.46,.12,.34):null;
 if(ev.type==='blood-impact'){
  const heavy=HEAVY.has(id),wet=key==='splash';
  return cue(BLOOD_FOLEY[key],heavy?.32:wet?.23:.26,wet?1.18:heavy?.97:.72,.18,wet?.36:heavy?.31:.25);
 }
 if(ev.type==='hurt'&&Number(ev.amount)>0&&WET_HIT.has(id))
  return cue(BLOOD_FOLEY.hit,.13,.45,.12,.18);
 return null;
}
