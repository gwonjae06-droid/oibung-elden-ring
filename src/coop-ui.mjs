import {connectCoop} from './coop-client.mjs';
export const COOP_BOSSES=Object.freeze({kwon:'긴턱의 이권재',clown:'광대 오슬우',dice:'거대 주사위 박성원'});
export function openCoopRoom({boss,weapon='sword',doc=globalThis.document,win=globalThis.window,connect=connectCoop}={}){
 if(!Object.hasOwn(COOP_BOSSES,boss))throw Error('잘못된 보스입니다.');
 if(doc.getElementById('coop-room-dialog'))throw Error('협동 대기실이 이미 열려 있습니다.');
 const prior=doc.activeElement,d=doc.createElement('dialog');d.id='coop-room-dialog';d.setAttribute('aria-label',COOP_BOSSES[boss]+' 방 참가');
 const el=(tag,text='')=>{const n=doc.createElement(tag);n.textContent=text;d.append(n);return n;};
 const css=el('style');css.textContent='#coop-room-dialog{width:min(440px,90vw);max-height:85dvh;overflow:auto;padding:24px;background:#19151c;color:#f5e8ce;border:1px solid #ae925b}#coop-room-dialog::backdrop{background:#0009}#coop-room-dialog label{display:block;margin:12px 0}#coop-room-dialog input{display:block;width:100%;box-sizing:border-box;padding:10px}#coop-room-dialog button{padding:10px;margin:6px}#coop-room-dialog p{white-space:pre-wrap}';
 const field=(label,value='')=>{const l=el('label',label),n=doc.createElement('input');n.value=value;l.append(n);return n;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 el('h2',COOP_BOSSES[boss]+' · 협동 대기실');el('p','현재는 대기실만 연결됩니다. 협동 전투는 아직 준비 중입니다.');
 let saved='';try{saved=win.localStorage.getItem('oibung.coop.url')||'';}catch{}
 const url=field('멀티 서버 주소',win.OIBUNG_COOP_URL||saved);url.placeholder='wss://서버주소/coop';
 const name=field('이름','모험가'),code=field('방 코드');name.maxLength=16;code.maxLength=6;
 const status=el('p','방 코드를 입력하거나 새 방을 만드세요.'),members=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 let client=null,state=null,self=null,serial=0,timer=null,busy=false;
 const create=button('방 만들기',()=>begin(false)),join=button('방 참가',()=>begin(true));
 const ready=button('준비',()=>{try{client.ready(!state.players.find(p=>p.id===self)?.ready);ready.disabled=true;}catch(e){status.textContent=e.message;}});
 const start=button('전투 연결 준비 중',()=>{}),leave=button('방 나가기',()=>stop('방에서 나왔습니다.'));button('닫기',close);
 function render(){create.disabled=join.disabled=Boolean(state)||busy;url.disabled=name.disabled=code.disabled=Boolean(state)||busy;ready.disabled=!state||state.phase!=='lobby';ready.textContent=state?.players.find(p=>p.id===self)?.ready?'준비 취소':'준비';start.disabled=true;leave.disabled=!state&&!busy;members.textContent=state?state.players.map(p=>(p.id===state.host?'방장 · ':'')+p.name+' · '+(p.ready?'준비 완료':'대기')).join('\n'):'';}
 function stop(text=''){serial++;if(timer!==null)win.clearTimeout(timer);timer=null;const old=client;client=null;state=null;self=null;busy=false;try{old?.close();}catch{}render();if(text)status.textContent=text;}
 function begin(joining){
  if(busy||state)return;const key=code.value.trim().toUpperCase();
  if(joining&&!/^[A-Z2-9]{6}$/.test(key)){status.textContent='6자리 방 코드를 입력하세요.';return;}
  let endpoint;try{endpoint=new URL(url.value.trim());if(!['ws:','wss:'].includes(endpoint.protocol)||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||(win.location?.protocol==='https:'&&endpoint.protocol!=='wss:'))throw Error();}catch{status.textContent='유효한 서버 주소가 필요합니다. HTTPS 게임은 wss:// 주소를 사용하세요.';return;}
  stop();busy=true;render();status.textContent='서버 연결 중…';const ticket=serial;
  const errorText=c=>({BOSS_MISMATCH:'다른 보스의 방입니다.',ROOM_NOT_FOUND:'방을 찾을 수 없습니다.',ROOM_FULL:'방이 가득 찼습니다.',ROOM_IN_PROGRESS:'이미 진행 중인 방입니다.'}[c]||'서버 오류: '+c);
  try{
   client=connect(endpoint.href,{onMessage(m){
    if(ticket!==serial)return;
    if(m.type==='error'){if(!state)stop(errorText(m.code));else{status.textContent=errorText(m.code);render();}return;}
    if(m.type==='room_closed'&&m.code===state?.code){stop('방장이 나가 방이 닫혔습니다.');return;}
    if(m.type!=='state')return;
    if(m.state?.boss!==boss||!m.state.players?.some(p=>p.id===m.selfId)){stop('보스 정보가 일치하지 않습니다. 서버 업데이트가 필요합니다.');return;}
    state=m.state;self=m.selfId;busy=false;if(timer!==null)win.clearTimeout(timer);timer=null;code.value=state.code;status.textContent='방 참가 완료 · '+state.code+'\n협동 전투는 아직 연결되지 않았습니다.';render();
   },onClose(){if(ticket===serial)stop('서버 연결이 종료됐습니다.');},onError(e){if(ticket===serial)stop(e.message);}});
   client.socket.addEventListener('open',()=>{if(ticket!==serial)return;try{const n=name.value.trim()||'모험가';if(joining)client.join(key,n,weapon,boss);else client.create(n,weapon,boss);try{win.localStorage.setItem('oibung.coop.url',endpoint.href);}catch{}}catch(e){stop(e.message);}},{once:true});
   timer=win.setTimeout(()=>{if(ticket===serial&&!state)stop('서버 응답 시간이 초과됐습니다.');},10000);
  }catch(e){stop(e.message);}
 }
 function close(){stop();try{d.close();}catch{}d.remove();if(prior?.isConnected)prior.focus();}
 d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('keydown',e=>e.stopPropagation());doc.body.append(d);render();try{d.showModal();code.focus();}catch(e){close();throw e;}
 return {close,dialog:d};
}
