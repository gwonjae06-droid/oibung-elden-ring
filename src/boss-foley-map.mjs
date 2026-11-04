// Recorded SFX uploaded by the project owner. All assets except heal/dead belong
// exclusively to boss events; never use these for player weapon attacks.
const dir='assets/sfx/';
export const BOSS_FOLEY_FILES=Object.freeze({
 sword: Object.freeze({
  draw:dir+'u_dtbxmnju4i-taking-out-knife-217793.mp3',
  sharpen:dir+'dragon-studio-sharpening-blade-393850.mp3',
  swing:dir+'freesound_community-sword-sound-2-36274.mp3',
  flesh:dir+'universfield-sword-blade-slicing-flesh-352708.mp3'
 }),
 clown: Object.freeze({
  drum:dir+'dragon-studio-hammer-smash-effect-382731.mp3',
  glass:dir+'freesound_community-glass-smash-6266.mp3',
  shatter:dir+'dragon-studio-window-smash-sfx-382708.mp3',
  ball:dir+'freesound_community-tennis-smash-100733.mp3'
 }),
 dice: Object.freeze({
  roll:dir+'freesound_community-rolling-dice-2-102706.mp3',
  longRoll:dir+'freesound_community-076456_2d6-rolling-dice-35980.mp3',
  jump:dir+'u_qpfzpydtro-dice-142528.mp3',
  coin:dir+'dragon-studio-dropping-a-coin-478359.mp3',
  coinSecond:dir+'freesound_gamestudio-drop-coin-384921.mp3',
  coinThird:dir+'universfield-coin-drop-229314.mp3',
  impact:dir+'dragon-studio-hard-heavy-impact-515256.mp3',
  giant:dir+'dragon-studio-heavy-impact-loud-515259.mp3',
  fracture:dir+'freesound_community-rock-smash-6304.mp3'
 })
});
export const BOSS_FOLEY_PRELOAD=Object.freeze({
 kwon:Object.freeze(Object.values(BOSS_FOLEY_FILES.sword)),
 clown:Object.freeze(Object.values(BOSS_FOLEY_FILES.clown)),
 dice:Object.freeze(Object.values(BOSS_FOLEY_FILES.dice))
});
const cue=(file,volume,duration,fade=.15,minGap=.12,rate=1)=>({
 file,volume,duration,fade,minGap,rate,
 cueDuration:Math.min(duration,.65),f:140,to:46,type:'triangle'
});
export function bossFoleySpec(ev,g){
 if(!ev||!g||!g.boss)return null;
 const type=ev.type;
 if(g.dice){
  const f=BOSS_FOLEY_FILES.dice;
  switch(type){
   case 'dice-warning':return cue(f.coin,.09,.62,.12,.32);
   case 'dice-roll':return cue(f.roll,.17,.94,.14,.22);
   case 'dice-charge':return cue(f.longRoll,.28,1.6,.2,.25);
   case 'dice-jump':return cue(f.jump,.27,1,.16,.25);
   case 'dice-pip-warning':return cue(f.coinSecond,.16,.72,.1,.28);
   case 'dice-pip-burst':return cue(f.coinThird,.17,.85,.15,.2);
   case 'dice-impact':return cue(f.impact,.34,1.25,.22,.17);
   case 'dice-stomp':return cue(f.giant,.39,1.55,.26,.25);
   case 'player-crushed':return cue(f.giant,.42,1.65,.28,.35,.92);
   case 'dice-giant-warning':return cue(f.coinThird,.18,.77,.13,.35);
   case 'dice-giant-hand-hit':return cue(f.impact,.32,.95,.18,.13);
   case 'dice-giant-neck-impact':
   case 'dice-giant-hand-destroyed':return cue(f.fracture,.38,1.95,.3,.32);
   case 'dice-giant-feral':return cue(f.impact,.35,1.4,.23,.8,.89);
   case 'dice-possession':return cue(f.longRoll,.3,1.7,.24,.5,.86);
   case 'dice-possessed':return cue(f.coinSecond,.17,.75,.12,.5);
   default:return null;
  }
 }
 if(g.clown){
  const f=BOSS_FOLEY_FILES.clown;
  switch(type){
   case 'clown-juggle':return cue(f.ball,.26,.7,.13,.18);
   case 'clown-drum':
   case 'clown-stomp':return cue(f.drum,.32,1.05,.18,.2);
   case 'clown-confetti':return cue(f.glass,.25,.72,.16,.27);
   case 'clown-blast':return cue(f.shatter,.34,1.1,.22,.25);
   default:return null;
  }
 }
 const f=BOSS_FOLEY_FILES.sword;
 switch(type){
  case 'telegraph':
   return ['thrust','jab','rush','retreat'].includes(g.boss.pattern)
    ?cue(f.draw,.23,1.07,.22,.25,1.07)
    :cue(f.sharpen,.24,1.02,.21,.35);
  case 'boss-swing':
  case 'boss-shot':return cue(f.swing,.38,.69,.12,.08,g.boss.phase===2?1.06:1);
  case 'player-hit':
   return ev.amount>0?cue(f.flesh,.39,.87,.17,.09,g.boss.phase===2?1.02:.96):null;
  case 'phase':return cue(f.draw,.3,1.45,.28,.5,.9);
  default:return null;
 }
}
