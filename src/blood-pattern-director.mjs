import {bloodPool} from './blood-data.mjs';

// Seed once per attempt; every subsequent choice belongs to simulation state.
export function createBloodPatternDeck(seed=Math.floor(Math.random()*0x100000000)){
 return {seed:(seed>>>0)||0x9e3779b9,phase:0,queue:[],last:null,cycles:0};
}
function random(deck){let x=deck.seed;x^=x<<13;x^=x>>>17;x^=x<<5;deck.seed=x>>>0;return deck.seed/0x100000000;}
function shuffle(deck,list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(deck)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function nextBloodPattern(state,phase,{distance=null}={}){
 if(state.phase!==phase){state.phase=phase;state.queue=[];state.last=null;state.cycles=0;}
 if(!state.queue.length){
  if(phase===1){
   const signature=shuffle(state,['lances','cross']),rest=shuffle(state,bloodPool(1).filter(id=>!signature.includes(id)));
   state.queue=[signature[0],rest[0],rest[1],signature[1],...rest.slice(2)];
  }else{
   const signature=shuffle(state,['judgement','ritual']),ground=shuffle(state,['wing','pulse']);
   const air=shuffle(state,bloodPool(2).filter(id=>!signature.includes(id)&&!ground.includes(id)));
   state.queue=[signature[0],ground[0],air[0],signature[1],air[1],ground[1],...air.slice(2)];
  }
  // Keep a full unique deck while avoiding a repeat across deck boundaries.
  if(state.queue[0]===state.last)[state.queue[0],state.queue[2]]=[state.queue[2],state.queue[0]];
  state.cycles++;
 }
 if(Number.isFinite(distance)&&distance!==null&&state.queue.length>1){
   // Preserve the signature opening and airborne/ground sequencing, but
   // choose among nearby cards to react to range. No attacks are removed.
   const opening=state.queue.length===9||(phase===2&&state.queue.length===8);
   if(!opening){
     const pair={chain:'burst',wave:'fountain',dive:'wing',
       eclipse:'rain',pursuit:'pulse',wing:'pursuit'}[state.last];
     const close=new Set(['burst','chain','vortex','wave','wing','pulse','dive']);
     const candidates=state.queue.slice(0,Math.min(3,state.queue.length));
     const ix=pair&&candidates.includes(pair)?candidates.indexOf(pair):
       candidates.findIndex(id=>distance<10?close.has(id):distance>17?!close.has(id):false);
     if(ix>0)[state.queue[0],state.queue[ix]]=[state.queue[ix],state.queue[0]];
   }
  }
  const id=state.queue.shift();state.last=id;return id;
}
