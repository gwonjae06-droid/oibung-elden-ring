import {audioChannelGain} from './audio-preferences.mjs';

// One owned attack voice per encounter, independent of the boss music/foley mixer.
// Volumes are intentionally low: weapons should never drown out boss warnings.
const clip=(file,gain,seconds,fade=.12,minGap=.09)=>Object.freeze({
 file,gain,seconds,fade,minGap
});
const fx=file=>'assets/sfx/'+file;
export const PLAYER_WEAPON_CLIPS=Object.freeze({
 sword:Object.freeze({
  attack:Object.freeze([clip('sword1.mp3',.14,.40),clip('sword2.mp3',.14,.42)]),
  skill:Object.freeze([clip('sword3.mp3',.17,.63,.14,.16)])
 }),
 hammer:Object.freeze({
  attack:Object.freeze([clip(fx('universfield-hammer-steel-impact-454390.mp3'),.17,.62,.15,.18)]),
  skill:Object.freeze([clip(fx('dragon-studio-hammer-smash-effect-382731 (1).mp3'),.21,.92,.19,.24)])
 }),
 bow:Object.freeze({
  attack:Object.freeze([clip(fx('u_2c8g87fmmx-bow-sound-596323.mp3'),.14,.66,.13,.15)]),
  skill:Object.freeze([
   clip(fx('dennish18-arrow-146420.mp3'),.18,.98,.19,.22),
   clip(fx('djartmusic-arrow-swish_03-306040.mp3'),.16,.78,.14,.22)
  ]),
  impact:Object.freeze([clip(fx('freesound_community-arrow-impact-87260.mp3'),.11,.38,.1,.13)])
 }),
 cards:Object.freeze({
  attack:Object.freeze([
   clip(fx('freesound_community-card-sounds-35956.mp3'),.11,.35,.09,.13),
   clip(fx('oxidvideos-taking-playing-card-522520.mp3'),.12,.42,.1,.13),
   clip(fx('oxidvideos-taking-playing-card-2-522516.mp3'),.12,.42,.1,.13),
   clip(fx('freesound_community-card-mixing-48088.mp3'),.1,.58,.13,.13)
  ]),
  blue:Object.freeze([clip(fx('yodguard-wind-magic-5-378630.mp3'),.16,1.05,.2,.28)]),
  red:Object.freeze([clip(fx('yodguard-fire-magic-5-378639.mp3'),.17,1.06,.2,.28)]),
  yellow:Object.freeze([clip(fx('yodguard-healing-magic-2-378663.mp3'),.15,1.04,.19,.28)])
 })
});
export const PLAYER_WEAPON_FILES=Object.freeze([...new Set(
 Object.values(PLAYER_WEAPON_CLIPS).flatMap(weapon=>
 Object.values(weapon).flatMap(cues=>cues.map(spec=>spec.file)))
)]);

// Resolves gameplay emissions to exactly one recording. A bow/hammer skill also
// emits a follow-up swing/shot; that follow-up must NOT trigger the basic attack.
export function playerWeaponCue(event,game){
 if(!event||!game||!PLAYER_WEAPON_CLIPS[game.weapon])return null;
 const weapon=game.weapon,pack=PLAYER_WEAPON_CLIPS[weapon];
 if(event.type==='skill-cast'){
  const flavor=event.flavor;
  if(weapon==='cards')return pack[flavor]?{key:weapon+':'+flavor,cues:pack[flavor]}:null;
  return flavor===weapon?{key:weapon+':skill',cues:pack.skill}:null;
 }
 if((event.type==='swing'&&['sword','hammer'].includes(weapon))||
    (event.type==='shot'&&['bow','cards'].includes(weapon))){
  if(game.player?.action?.kind==='skill')return null;
  return {key:weapon+':attack',cues:pack.attack};
 }
 if(event.type==='boss-hit'&&event.amount>0&&weapon==='bow')
  return {key:'bow:impact',cues:pack.impact};
 return null;
}

export function createPlayerWeaponSfx({
 AudioClass=globalThis.Audio,
 now=()=>globalThis.performance?.now?.()??Date.now(),
 storage,
 muted=()=>{try{return globalThis.localStorage?.getItem('oibung-muted')==='1';}catch{return false;}},
 hidden=()=>Boolean(globalThis.document?.hidden),
 schedule=fn=>globalThis.setInterval(fn,35),
 cancel=id=>globalThis.clearInterval(id)
}={}){
 let disposed=false,voice=null,clock=null,turn=0;
 const last=new Map();
 const cache=new Map();
 function stop(){
  const old=voice;voice=null;
  if(clock!==null){cancel(clock);clock=null;}
  if(!old)return;
  old.audio.onended=null;old.audio.onerror=null;
  try{old.audio.pause();old.audio.currentTime=0;}catch{}
 }
 function acquire(file){
  if(cache.has(file))return cache.get(file);
  if(typeof AudioClass!=='function')return null;
  let audio=null;
  try{
   audio=new AudioClass(new URL('../'+file,import.meta.url).href);
   audio.preload='auto';
  }catch{return null;}
  cache.set(file,audio);return audio;
 }
 function clear(){stop();last.clear();}
 function event(e,g){
  if(disposed)return false;
  if(muted()||hidden()){stop();return false;}
  const choice=playerWeaponCue(e,g);
  if(!choice)return false;
  const t=now();
  const previous=last.get(choice.key);
  const pick=previous?.count??0;
  const spec=choice.cues[pick%choice.cues.length];
  if(t-(previous?.time??-Infinity)<spec.minGap*1000)return false;
  const audio=acquire(spec.file);
  if(!audio)return false;
  stop();
  last.set(choice.key,{time:t,count:pick+1});
  const startedAt=now(),token=++turn;
  const volume=Math.max(0,Math.min(.3,spec.gain*audioChannelGain('effects',storage)));
  try{
   audio.currentTime=0;
   audio.volume=volume;
   audio.playbackRate=1;
   voice={audio,spec,startedAt,volume,token};
   audio.onended=()=>{if(voice?.token===token)stop();};
   audio.onerror=()=>{if(voice?.token===token)stop();};
   const promise=audio.play();
   promise?.catch?.(()=>{if(voice?.token===token)stop();});
   clock=schedule(()=>{
    if(!voice||voice.token!==token)return;
    if(muted()||hidden()){stop();return;}
    const elapsed=(now()-startedAt)/1000,left=spec.seconds-elapsed;
    if(left<=0){stop();return;}
    try{audio.volume=volume*Math.min(1,left/spec.fade);}catch{stop();}
   });
   clock?.unref?.();
   return true;
  }catch{stop();return false;}
 }
 function dispose(){
  if(disposed)return;
  disposed=true;clear();
  for(const audio of cache.values()){
   try{audio.removeAttribute?.('src');audio.load?.();}catch{}
  }
  cache.clear();
 }
 return {event,clear,dispose,get activeCount(){return voice?1:0;},get disposed(){return disposed;}};
}
