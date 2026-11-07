// All sound names are reserved for user-uploaded recordings.
// Missing MP3s must NEVER invoke synthesized tones, throw, or block combat.
const folder='assets/sfx/';
export const CLOWN_NIGHTMARE_FILES=Object.freeze({
 childLaugh:folder+'childfunny.mp3',
 reversedClap:folder+'reversedclap.mp3',
 porcelainMask:folder+'maskcrack.mp3',
 breakingBody:folder+'bodycreak.mp3',
 breathingCurtain:folder+'clothbreath.mp3',
 emptySeats:folder+'audiencewhisper.mp3',
 openJaw:folder+'voidsmile.mp3',
 splittingFace:folder+'facesplit.mp3',
 stageShift:folder+'circuswarp.mp3',
 finalAct:folder+'nightmaretransition.mp3',
});
export const CLOWN_NIGHTMARE_SFX_MANIFEST=Object.freeze([
 ['childfunny.mp3','멀리서 들리는 기괴한 아이 웃음, 텅 빈 관객석'],
 ['reversedclap.mp3','반 박자 늦는 박수와 역재생 박수'],
 ['maskcrack.mp3','떨어지는 도자기 얼굴과 깨지는 가면'],
 ['bodycreak.mp3','몸을 꺾고 접는 관절·나무 인형 마찰음'],
 ['clothbreath.mp3','살아 움직이는 무대 커튼·천막 마찰음'],
 ['audiencewhisper.mp3','비어 있는 객석의 속삭임과 숨소리'],
 ['voidsmile.mp3','말도 안 되게 크게 벌어지는 입의 낮은 울림'],
 ['facesplit.mp3','얼굴을 떼어 내거나 가면처럼 벗기는 소리'],
 ['circuswarp.mp3','거울 복도·무대 붕괴와 현실 뒤집힘'],
 ['nightmaretransition.mp3','마지막 3막 진입 때 울리는 저음 공포 신호'],
]);
const pick=Object.freeze({
 echo:'reversedClap','clap-delay':'reversedClap','echo-final':'childLaugh',
 double:'childLaugh',shadow:'breathingCurtain',hatch:'breakingBody',
 'hatch-twist':'breakingBody',porcelain:'porcelainMask','mask-fall':'porcelainMask',
 fold:'breakingBody',audience:'emptySeats',seats:'childLaugh',
 curtain:'breathingCurtain','curtain-hit':'breathingCurtain',
 teeth:'openJaw','teeth-end':'openJaw',face:'splittingFace',
 mouth:'openJaw','stage-break':'stageShift',
 'unison-hush':'emptySeats','reprise-rise':'breakingBody',
 'mouthless-song':'emptySeats','all-faces-one':'splittingFace',
});
export function clownNightmareRecording(ev){
 if(!ev||typeof ev!=='object')return null;
 const key=ev.type==='clown-phase3'?'finalAct':ev.type==='clown-horror'?pick[ev.cue]:null;
 if(!key)return null;
 const file=CLOWN_NIGHTMARE_FILES[key];
 if(!file)return null;
 return {file,volume:key==='finalAct'?.3:key==='childLaugh'?.18:.2,
  duration:key==='finalAct'?2.2:key==='emptySeats'?1.45:1.05,fade:.22,minGap:.28,
  rate:key==='childLaugh'?.86:key==='reversedClap'?.92:1,
  natural:true}; // no 8-bit synth, no synthetic fallback for missing samples
}
