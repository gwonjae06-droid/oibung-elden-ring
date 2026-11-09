// Original-track lyrics drive act-nine world changes. This director never
// relies on frame count or a wall-clock time base.
import {GYUWON_LYRIC_ACTIONS} from './gyuwon-lyric-actions.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
export function gyuwonFightScene(time=0){
 const t=Math.max(0,time);
 if(t<5.9)return {kind:'handoff',arena:'theater',role:'dancer',round:1,quiet:true};
 if(t<15.74)return {kind:'opening',arena:'theater',role:'duelist',round:1};
 if(t<19.68)return {kind:'royal',arena:'theater',role:'king',round:1};
 if(t<23.6)return {kind:'clown',arena:'theater',role:'clown',round:1};
 if(t<26.14)return {kind:'inverted-world',arena:'rooftop',role:'sky',round:1};
 if(t<30)return {kind:'run-flight',arena:'rooftop',role:'sky',round:1};
 if(t<33.5)return {kind:'challenge',arena:'rooftop',role:'duelist',round:1};
 if(t<41)return {kind:'left-right-strike',arena:'rooftop',role:'duelist',round:1};
 if(t<56.82)return {kind:'inversion',arena:'rooftop',role:'sky',round:2};
 if(t<72.5)return {kind:'flight',arena:'rooftop',role:'sky',round:2};
 if(t<93)return {kind:'sky-duel',arena:'rooftop',role:'sky',round:2};
 if(t<108)return {kind:'breather',arena:'mirror',role:'reflection',round:2,quiet:true};
 if(t<138.34)return {kind:'reflections',arena:'mirror',role:'reflection',round:3};
 if(t<154)return {kind:'final-chorus',arena:'mirror',role:'ensemble',round:3};
 if(t<173)return {kind:'farewell',arena:'mirror',role:'ensemble',round:3};
 return {kind:'bow',arena:'stars',role:'duelist',round:3,quiet:true};
}
// Each strike starts with a visible windup; the five short 'one more round'
 // phrases make five distinct echoes, two deliberately non-damaging.
 export const GYUWON_FIGHT_SET_PIECES=Object.freeze(
 GYUWON_LYRIC_ACTIONS[9].flatMap(cue=>cue.attackEvents
  .filter(event=>event.type==='fighter-strike')
  .map(event=>Object.freeze({...event,lyricId:cue.id})))
);


// Connected walkable elevations. Render and combat use this identical function.
export function gyuwonFightGround(time,x){
 const t=Math.max(0,time),px=clamp(x,-16,16);
 const roof=smooth((t-41)/2.2)*(1-smooth((t-93)/2));
 const mirror=smooth((t-108)/2.5);
 const terrace=Math.max(0,1-Math.abs(Math.abs(px)-10)/6)*.78;
 const glass=.22+.48*Math.max(0,1-Math.abs(px)/9)+.1*Math.sin(px*.3);
 return roof*terrace+mirror*glass;
}
export const gyuwonFightGroundScreen=(time,x,baseline=526,scale=45)=>baseline-gyuwonFightGround(time,x)*scale;
