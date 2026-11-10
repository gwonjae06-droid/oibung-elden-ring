// The small pause caption is the only entrance; no extra visible menu hint.
export const GYUWON_YEAR_LABELS=Object.freeze(['현역','재수','3수','4수','5수','6수','7수','8수','9수']);

export function createGyuwonHiddenYearMenu(doc,shell,{isPaused=()=>false,onChoose=()=>{}}={}){
 const pause=shell.querySelector('#pause-screen');
 const phrase=pause?.querySelector('.eyebrow');
 const resume=pause?.querySelector('#resume');
 if(!phrase||!resume)return {reset(){},dispose(){}};
 const style=doc.createElement('style');
 style.textContent=`.gyw-years{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:12px 0;max-width:330px}
 .gyw-years[hidden]{display:none!important}
 .gyw-years button{min-width:0;min-height:34px;padding:6px 10px;font-size:12px}
 @media(max-height:440px){.gyw-years{max-height:112px;overflow-y:auto}}`;
 shell.appendChild(style);
 const choices=doc.createElement('div');
 choices.className='gyw-years';
 choices.hidden=true;
 for(const [i,label] of GYUWON_YEAR_LABELS.entries()){
  const button=doc.createElement('button');
  button.type='button';
  button.textContent=label;
  button.dataset.gywYear=String(i+1);
  button.addEventListener('click',()=>{if(isPaused()&&!choices.hidden)onChoose(i+1);});
  choices.appendChild(button);
 }
 resume.before(choices);
 let taps=0;
 const tap=()=>{if(!isPaused()||!choices.hidden)return;if(++taps===4)choices.hidden=false;};
 const key=e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();tap();}};
 const originalTabIndex=phrase.getAttribute('tabindex');
 phrase.tabIndex=0;
 phrase.addEventListener('click',tap);
 phrase.addEventListener('keydown',key);
 return {
  reset(){taps=0;choices.hidden=true;},
  dispose(){
   phrase.removeEventListener('click',tap);
   phrase.removeEventListener('keydown',key);
   if(originalTabIndex===null)phrase.removeAttribute('tabindex');
   else phrase.setAttribute('tabindex',originalTabIndex);
   choices.remove();style.remove();
  }
 };
}
