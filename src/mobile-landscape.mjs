import {readBattleSession} from './battle-session.mjs';

// The arena is cloned into each boss's shadow-root dialog. Keeping this gate
// inside the shared arena makes portrait blocking work in all encounters.
export const MOBILE_LANDSCAPE_GATE_HTML = `<section class="mobile-landscape-gate" role="dialog" aria-modal="true" aria-label="가로 화면 안내">
 <div class="mobile-landscape-panel">
  <div class="mobile-rotate-icon" aria-hidden="true">▯ <span>↻</span></div>
  <h2>가로 화면으로 플레이해 주세요</h2>
  <p>오든링 모바일 전투는 가로 화면 전용입니다.<br>휴대폰을 옆으로 돌리면 계속할 수 있습니다.</p>
  <button type="button" data-mobile-landscape="lock">전체화면으로 가로 전환</button>
  <p class="mobile-landscape-status" role="status">회전하지 않으면 기기의 자동 회전 설정을 확인해 주세요.</p>
 </div>
</section>`;

const installs=new WeakMap();
export function isMobilePortrait(win){
 try{return !!win?.matchMedia?.('(pointer: coarse) and (orientation: portrait)').matches;}
 catch{return false;}
}
export function installMobileLandscape(doc=globalThis.document,win=globalThis.window){
 if(!doc||!win||!doc.getElementById||!win.addEventListener)return null;
 if(installs.has(doc))return installs.get(doc);
 const arena=doc.getElementById('arena'),journey=doc.getElementById('journey');
 if(!arena?.appendChild||!doc.createElement)return null;
 const nodes=[];
 const insert=parent=>{
  if(!parent?.appendChild)return;
  const wrapper=doc.createElement('div');wrapper.innerHTML=MOBILE_LANDSCAPE_GATE_HTML;
  const gate=wrapper.firstElementChild;
  if(gate){parent.appendChild(gate);nodes.push(gate);}
 };
 insert(arena);
 // This starter gate is replaced when Journey renders its first screen.
 insert(journey);
 let autoPaused=null,disposed=false;
 const currentRoot=()=>{
  for(const id of ['dice-battle','clown-battle']){
   const dialog=doc.getElementById(id);
   if(dialog?.open){
    const root=dialog.firstElementChild?.shadowRoot;
    if(root)return root;
   }
  }
  return doc;
 };
 function sync(){
  if(disposed)return;
  if(isMobilePortrait(win)){
   if(!autoPaused){
    const root=currentRoot(),session=readBattleSession(root);
    if(session?.active && typeof session.pause==='function'){
     autoPaused={root,game:session.game};
     session.pause();
    }
   }
  }else if(autoPaused){
   const previous=autoPaused;autoPaused=null;
   const session=readBattleSession(previous.root);
   if(session?.game===previous.game&&session.game?.status==='playing')session.resume?.();
  }
 }
 function message(text){
  // Shadow DOM encounters clone the gate, so target all visible copies.
  const roots=[doc,doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot,doc.getElementById('dice-battle')?.firstElementChild?.shadowRoot];
  for(const root of roots){
   if(!root?.querySelectorAll)continue;
   for(const element of root.querySelectorAll('.mobile-landscape-status'))element.textContent=text;
  }
 }
 async function requestLandscape(){
  const orientation=win.screen?.orientation;
  if(typeof orientation?.lock!=='function'){
   message('이 브라우저에서는 가로 고정이 지원되지 않습니다. 휴대폰을 가로로 돌려 주세요.');
   return;
  }
  try{
   if(!doc.fullscreenElement && typeof doc.documentElement?.requestFullscreen==='function'){
    try{await doc.documentElement.requestFullscreen({navigationUI:'hide'});}catch{}
   }
   await orientation.lock('landscape');
  }catch{
   message('자동 가로 전환이 차단되었습니다. 자동 회전을 켜고 휴대폰을 가로로 돌려 주세요.');
  }
  sync();
 }
 function click(event){
  if(disposed||!isMobilePortrait(win))return;
  const path=event.composedPath?.()||[event.target];
  if(path.some(node=>node?.dataset?.mobileLandscape==='lock'))void requestLandscape();
 }
 win.addEventListener('resize',sync);
 win.addEventListener('orientationchange',sync);
 win.addEventListener('click',click,true);
 win.screen?.orientation?.addEventListener?.('change',sync);
 const control={sync,dispose(){
  if(disposed)return;disposed=true;
  win.removeEventListener('resize',sync);win.removeEventListener('orientationchange',sync);
  win.removeEventListener('click',click,true);
  win.screen?.orientation?.removeEventListener?.('change',sync);
  for(const node of nodes)node.remove?.();
  installs.delete(doc);
 },get disposed(){return disposed;}};
 installs.set(doc,control);
 sync();return control;
}
