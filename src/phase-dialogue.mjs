export const PHASE_LINES=Object.freeze({kwon:'그에게도 검사라는 꿈이 있었습니다',clown:'당신은 그의 공연을 화려하게 망쳐버렸습니다. 살아남으세요.'});
export function phaseLine(g){return g?.status==='playing'&&g.boss?.state==='transition'?PHASE_LINES[g.clown?'clown':'kwon']:null;}
export function createPhaseDialogue(doc=globalThis.document){
 let notice=null,line=null,old=null;
 function clear(){
  if(notice){if(notice.textContent===line){notice.classList.remove('visible');notice.textContent='';}delete notice.dataset.phaseDialogue;Object.assign(notice.style,old);}
  notice=null;line=null;old=null;
 }
 function update(g){
  const text=phaseLine(g);if(!text||!doc){clear();return;}
  const root=g.clown?doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot:doc;
  const el=root?.getElementById('notice');if(!el){clear();return;}
  if(notice!==el){clear();notice=el;old={maxWidth:el.style.maxWidth,whiteSpace:el.style.whiteSpace,textAlign:el.style.textAlign};}
  line=text;if(el.textContent!==text)el.textContent=text;
  el.dataset.phaseDialogue=g.clown?'clown':'kwon';el.style.maxWidth='min(90vw, 780px)';el.style.whiteSpace='normal';el.style.textAlign='center';el.classList.add('visible');
 }
 return {update,clear};
}
