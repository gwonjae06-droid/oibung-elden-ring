import {BLOOD_STAGES,bloodStage} from './blood-stage.mjs';

const COLORS=Object.freeze(['#ffd6a0','#ff5a6e','#e0284f','#b673d6','#6fd0b0']);
// Five-step readout so the player can see where the current blood pattern is: prepare, start, run, finish, return.
export function createBloodStageUi(shell,doc){
 const style=doc.createElement('style'),box=doc.createElement('div'),list=doc.createElement('ol'),hint=doc.createElement('p');
 style.textContent='.blood-stage{position:absolute;top:72px;left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;font-family:var(--font-display,serif)}.blood-stage[hidden]{display:none}.blood-stage ol{display:flex;gap:6px;margin:0;padding:0;list-style:none}.blood-stage li{position:relative;min-width:54px;padding:5px 10px 8px;text-align:center;font-size:13px;letter-spacing:.18em;color:#a88b92;background:#10070bcc;border:1px solid #4a2a34;border-radius:4px;overflow:hidden;transition:color .2s,transform .2s,box-shadow .2s}.blood-stage li[data-state=past]{color:#d8a9b3;border-color:#7a3446}.blood-stage li[data-state=now]{color:#fff;transform:translateY(-2px) scale(1.08)}.blood-stage li i{position:absolute;left:0;bottom:0;height:3px;width:0}.blood-stage p{margin:0;padding:3px 12px;font-size:13px;color:#f3dcd2;background:#10070bb0;border-radius:3px;text-shadow:0 1px 6px #000}@media(max-height:500px){.blood-stage{top:46px}.blood-stage li{min-width:42px;padding:3px 6px 6px;font-size:11px}.blood-stage p{font-size:11px}}@media(prefers-reduced-motion:reduce){.blood-stage li{transition:none}}';
 box.className='blood-stage';box.hidden=true;box.setAttribute('role','status');box.setAttribute('aria-live','polite');
 const items=BLOOD_STAGES.map((stage,i)=>{const li=doc.createElement('li'),bar=doc.createElement('i');li.textContent=stage.label;bar.style.background=COLORS[i];li.appendChild(bar);list.appendChild(li);return {li,bar};});
 box.appendChild(list);box.appendChild(hint);shell.appendChild(style);shell.appendChild(box);
 let last=-2;
 return {
  update(g){
   const st=bloodStage(g);box.hidden=st.index<0;
   if(st.index<0){last=-1;return;}
   if(st.index!==last){
    last=st.index;hint.textContent=st.hint;
    items.forEach(({li,bar},i)=>{li.setAttribute('data-state',i<st.index?'past':i===st.index?'now':'next');li.style.boxShadow=i===st.index?'0 0 14px '+COLORS[i]:'';li.style.borderColor=i===st.index?COLORS[i]:'';bar.style.width='0%';});
   }
   items[st.index].bar.style.width=Math.round(st.progress*100)+'%';
  },
  dispose(){box.remove();style.remove();}
 };
}
