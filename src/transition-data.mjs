export const CUES={bind:2,pull:3.4,enter:4.7,bow:7.2,reveal:9,ready:9.35};
export const WEAPON_NAMES={sword:'검',hammer:'망치',bow:'활',cards:'카드'};
export const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function transitionPose(time){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const stage=t<CUES.bind?'declare':t<CUES.pull?'bind':t<CUES.enter?'pull':t<CUES.bow?'enter':t<CUES.reveal?'bow':t<CUES.ready?'reveal':'ready';
 const bowProgress=smooth((t-CUES.bow)/(CUES.reveal-CUES.bow));
 return {stage,bind:smooth((t-CUES.bind)/(CUES.pull-CUES.bind)),pull:smooth((t-CUES.pull)/(CUES.enter-CUES.pull)),entry:smooth((t-CUES.enter)/(CUES.bow-CUES.enter)),bow:Math.sin(Math.PI*bowProgress),ui:t>=CUES.reveal?1:0,select:t>=CUES.ready,title:clamp(t/.6)*(1-clamp((t-2.3)/1.1))};
}
export function shouldStartTransition(resultVisible,kicker){return Boolean(resultVisible)&&String(kicker).trim()==='승리';}
export function advanceTransition(time,dt,hidden=false){return hidden?time:time+Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));}
export function chooseWeapon(previous,saved){return Object.hasOwn(WEAPON_NAMES,saved)?saved:Object.hasOwn(WEAPON_NAMES,previous)?previous:'sword';}
export function makeClownLoadout(weapon,unlocked){if(!Object.hasOwn(WEAPON_NAMES,weapon))throw new Error('Unknown weapon');return {version:1,bossId:'clown',weapon,unlocked:Boolean(unlocked)};}
