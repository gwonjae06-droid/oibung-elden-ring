// One seeded random shuffle-bag per encounter and boss phase.
// Unlike weighted random sampling, every authored pattern fires exactly once
// per cycle, with no immediate duplicate across reshuffles.
// Seed is chosen when the encounter is created, not per simulation frame.
export function createPatternShuffle(seed=Math.floor(Math.random()*0x100000000)){
 return {seed:(seed>>>0)||0x9e3779b9,bags:{}};
}
function random(state){
 let x=state.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;
 state.seed=x>>>0;return state.seed/0x100000000;
}
function shuffled(state,values){
 const a=[...values];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(random(state)*(i+1));[a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
export function drawPatternShuffle(state,key,choices,{preferred=[],avoid=null}={}){
 if(!state||typeof state!=='object'||!Array.isArray(choices)||!choices.length)throw Error('Invalid pattern deck');
 state.bags ||= {};
 const pool=[...new Set(choices)],signature=pool.join('\u0000');
 let bag=state.bags[key];
 if(!bag||bag.signature!==signature){
  bag={signature,queue:[],last:null,cycles:0};state.bags[key]=bag;
 }
 if(!bag.queue.length){
  bag.queue=shuffled(state,pool);bag.cycles++;
  if(bag.queue.length>1&&bag.queue[0]===bag.last){
   const swap=1+Math.floor(random(state)*(bag.queue.length-1));
   [bag.queue[0],bag.queue[swap]]=[bag.queue[swap],bag.queue[0]];
  }
 }
 const previous=avoid??bag.last;
 const available=bag.queue.filter(v=>v!==previous);
 const allowed=available.length?available:bag.queue;
 const selected=Array.isArray(preferred)&&preferred.length
  ?allowed.find(v=>preferred.includes(v))??allowed[0]
  :allowed[0];
 bag.queue.splice(bag.queue.indexOf(selected),1);
 bag.last=selected;
 return selected;
}
