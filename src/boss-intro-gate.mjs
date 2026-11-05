import {playBossIntro} from './boss-intro.mjs';
// This gate prevents gameplay while the boss name is on screen.
// Journey reveals it after any transition; standalone fights reveal it after UI styles load.
export function createBossIntroGate(doc,arena,bossId,{ready=()=>true,focus=()=>{},reduced=false,play=playBossIntro}={}){
 let blocked=true,requested=false,current=null,generation=0;
 function begin(){
  requested=true;
  if(!ready())return;
  const ticket=++generation,previous=current;current=null;previous?.skip();
  blocked=true;requested=false;
  try{
   const intro=play(doc,arena,bossId,{reduced});
   current=intro;
   Promise.resolve(intro.finished).then(
    ok=>{if(ticket!==generation)return;current=null;blocked=false;if(ok)focus();},
    error=>{if(ticket!==generation)return;current=null;blocked=false;console.error('Boss introduction failed',error);}
   );
  }catch(error){if(ticket===generation){current=null;blocked=false;}console.error('Boss introduction failed',error);}
 }
 function whenReady(standalone=false){if(requested||standalone)begin();}
 function arm(){++generation;const previous=current;current=null;blocked=true;requested=false;previous?.skip();}
 function cancel(){++generation;const previous=current;current=null;blocked=false;requested=false;previous?.skip();}
 return {begin,whenReady,arm,cancel,get blocked(){return blocked;}};
}
