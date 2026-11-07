// Existing uploaded MP3 recordings, not synthesized oscillators or retro tones.
// The stage-foley manager enforces voice limits and mute policy at playback.
const dir='assets/sfx/';
export const CLOWN_ENSEMBLE_RECORDINGS=Object.freeze({
 knife:{file:dir+'dragon-studio-sharpening-blade-393850.mp3',volume:.15,duration:.65,fade:.12,rate:1.06},
 drum:{file:dir+'reversedclap.mp3',volume:.24,duration:.93,fade:.14,rate:.97},
 rope:{file:dir+'bodycreak.mp3',volume:.16,duration:1.04,fade:.21,rate:.98},
 trapdoor:{file:dir+'circuswarp.mp3',volume:.20,duration:1.05,fade:.15,rate:1},
 mask:{file:dir+'maskcrack.mp3',volume:.20,duration:.85,fade:.12,rate:1},
 fire:{file:dir+'yodguard-fire-magic-5-378639.mp3',volume:.17,duration:.95,fade:.2,rate:.95},
 choir:{file:dir+'womanvoice.mp3',volume:.20,duration:1.55,fade:.3,rate:1},
 puppet:{file:dir+'bodycreak.mp3',volume:.17,duration:1.05,fade:.18,rate:.94},
 cannon:{file:dir+'dragon-studio-hard-heavy-impact-515256.mp3',volume:.24,duration:.87,fade:.2,rate:.92},
 curtain:{file:dir+'clothbreath.mp3',volume:.19,duration:1.42,fade:.22,rate:.94},
 finale:{file:dir+'nightmaretransition.mp3',volume:.27,duration:1.75,fade:.3,rate:1},
 bell:{file:dir+'bell.mp3',volume:.16,duration:1.26,fade:.25,rate:.93},
 hush:{file:dir+'audiencewhisper.mp3',volume:.18,duration:1.38,fade:.3,rate:.9},
 reprise:{file:dir+'bodycreak.mp3',volume:.24,duration:1.10,fade:.2,rate:.8},
 mouthless:{file:dir+'womanvoice.mp3',volume:.22,duration:1.65,fade:.35,rate:.88},
 unison:{file:dir+'childfunny.mp3',volume:.18,duration:.88,fade:.24,rate:.84}
});
export function clownEnsembleRecording(event){
 const ev=event||{},kind=String(ev.kind||'');
 if(ev.type==='clown-troupe-beat'&&CLOWN_ENSEMBLE_RECORDINGS[kind])
  return {...CLOWN_ENSEMBLE_RECORDINGS[kind],minGap:kind==='choir'?.68:kind==='drum'?.25:.36,natural:true};
 if(ev.type==='clown-troupe-show'){
  const show=String(ev.show||'');
  if(['hush','reprise','mouthless'].includes(show))return {...CLOWN_ENSEMBLE_RECORDINGS[show],minGap:1.2,natural:true};
  const intro=/requiem|finale|curtain/i.test(show)?'finale':
   /chorus|choir|candle/i.test(show)?'choir':
   /drum|stampede/i.test(show)?'bell':
   /fire|carousel/i.test(show)?'fire':
   /twin|mirror/i.test(show)?'mask':'curtain';
  return {...CLOWN_ENSEMBLE_RECORDINGS[intro],volume:.13,minGap:.75,natural:true};
 }
 if(ev.type==='clown-impact'){
  const sound=String(ev.key||'');
  const kind=/corpseReprise/i.test(sound)?'reprise':
   /unisonSmile/i.test(sound)?'unison':
   /mouthlessChoir/i.test(sound)?'mouthless':
   /cannon/i.test(sound)?'cannon':
   /drum/i.test(sound)?'drum':
   /knife/i.test(sound)?'knife':
   /trapeze|wire|acrobat/i.test(sound)?'rope':
   /mask|mirror|twin/i.test(sound)?'mask':
   /puppet|marionette|string/i.test(sound)?'puppet':
   /fire|hoop|carousel/i.test(sound)?'fire':
   /choir|requiem|spotlight/i.test(sound)?'choir':
   /curtain/i.test(sound)?'curtain':null;
  if(kind)return {...CLOWN_ENSEMBLE_RECORDINGS[kind],volume:kind==='choir'?.12:.20,minGap:.24,natural:true};
 }
 return null;
}
