// Original-track lyrics drive act-nine world changes. This director never
// relies on frame count or a wall-clock time base.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
export function gyuwonFightScene(time=0){
 const t=Math.max(0,time);
 if(t<5.9)return {kind:'handoff',arena:'theater',role:'dancer',round:1,quiet:true};
 if(t<15.74)return {kind:'opening',arena:'theater',role:'duelist',round:1};
 if(t<23.6)return {kind:'royal',arena:'theater',role:'king',round:1};
 if(t<33.5)return {kind:'clown',arena:'theater',role:'clown',round:1};
 if(t<41)return {kind:'first-chorus',arena:'theater',role:'duelist',round:1};
 if(t<56.82)return {kind:'inversion',arena:'rooftop',role:'sky',round:2};
 if(t<72.5)return {kind:'flight',arena:'rooftop',role:'sky',round:2};
 if(t<93)return {kind:'sky-duel',arena:'rooftop',role:'sky',round:2};
 if(t<108)return {kind:'breather',arena:'mirror',role:'reflection',round:2,quiet:true};
 if(t<138.34)return {kind:'reflections',arena:'mirror',role:'reflection',round:3};
 if(t<154)return {kind:'final-chorus',arena:'mirror',role:'ensemble',round:3};
 if(t<173)return {kind:'farewell',arena:'mirror',role:'ensemble',round:3};
 return {kind:'bow',arena:'stars',role:'duelist',round:3,quiet:true};
}
export const GYUWON_FIGHT_SET_PIECES=Object.freeze([
 {at:23.6,kind:'royal-sweep',radius:2.8,wind:.82,damage:9},
 {at:47.9,kind:'inverse-pulse',radius:3.2,wind:1.05,damage:13},
 {at:65.68,kind:'skyfall',radius:2.6,wind:1.12,damage:11},
 {at:111.9,kind:'mirror-echo',radius:2.75,wind:.94,damage:12},
 {at:121.28,kind:'mirror-echo',radius:2.75,wind:.94,damage:12},
 {at:144.18,kind:'chorus-finale',radius:3.3,wind:1.42,damage:17}
]);
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
