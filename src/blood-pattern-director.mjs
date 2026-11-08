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
   const signature=shuffle(state,['lances','cross']);
   // The high-impact new blood sculptures and enclosing heart magic must be
   // seen before the monarch is pushed into his second phase.
   const rare=['bloodStatues','heartCage'];
   const rest=shuffle(state,bloodPool(1).filter(id=>!signature.includes(id)&&!rare.includes(id)));
   state.queue=[signature[0],rest[0],rare[0],signature[1],rest[1],rare[1],...rest.slice(2)];
  }else if(phase===3){
   const rest=shuffle(state,bloodPool(3).filter(id=>id!=='seraphWings'&&id!=='seraphFinale'));
   state.queue=['seraphWings',...rest];
  }else{
   const signature=shuffle(state,['judgement','ritual']),ground=shuffle(state,['wing','pulse']);
   const showcase=['heartFeast','wingGenesis'];
   const air=shuffle(state,bloodPool(2).filter(id=>
    !signature.includes(id)&&!ground.includes(id)&&!showcase.includes(id)));
   // Heart absorption previously fell anywhere in a thirteen-spell deck:
   // many fights ended without ever displaying it or its healing effect.
   state.queue=[signature[0],ground[0],showcase[0],signature[1],air[0],
    ground[1],showcase[1],...air.slice(1)];
  }
  // Keep a full unique deck while avoiding a repeat across deck boundaries.
  if(state.queue[0]===state.last)[state.queue[0],state.queue[2]]=[state.queue[2],state.queue[0]];
  state.cycles++;
 }
 if(Number.isFinite(distance)&&distance!==null&&state.queue.length>1){
   // Preserve the signature opening and airborne/ground sequencing, but
   // choose among nearby cards to react to range. No attacks are removed.
   const size=bloodPool(phase).length;
   const opening=state.queue.length===size||(phase===2&&state.queue.length===size-1);
   if(!opening){
     const pair={chain:'burst',wave:'fountain',bloodScissors:'heartCage',heartCage:'bloodScissors',wingShear:'rosary',rosary:'wingShear',dive:'wing',
       eclipse:'rain',pursuit:'pulse',wing:'pursuit'}[state.last];
     const close=new Set(['burst','chain','vortex','wave','wing','pulse','dive','bloodScissors','heartCage','wingShear','rosary']);
     const candidates=state.queue.slice(0,Math.min(3,state.queue.length));
     const ix=pair&&candidates.includes(pair)?candidates.indexOf(pair):
       candidates.findIndex(id=>distance<10?close.has(id):distance>17?!close.has(id):false);
     if(ix>0)[state.queue[0],state.queue[ix]]=[state.queue[ix],state.queue[0]];
   }
  }
  const id=state.queue.shift();state.last=id;return id;
}
