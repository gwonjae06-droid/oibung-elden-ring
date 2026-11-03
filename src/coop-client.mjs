export function connectCoop(url,{onMessage=()=>{},onClose=()=>{},onError=()=>{}}={}){
 const endpoint=new URL(url,globalThis.location?.href);
 if(!['ws:','wss:'].includes(endpoint.protocol))throw Error('WebSocket 주소가 필요합니다.');
 if(globalThis.location?.protocol==='https:'&&endpoint.protocol!=='wss:')throw Error('HTTPS 게임에서는 WSS 서버가 필요합니다.');
 const Socket=globalThis.WebSocket,socket=new Socket(endpoint);let closed=false;
 const message=e=>{if(closed)return;try{onMessage(JSON.parse(e.data));}catch(error){if(!closed)onError(error);}},error=()=>{if(!closed)onError(Error('멀티 서버 연결 오류'));},remoteClose=()=>{if(closed)return;closed=true;detach();onClose();};
 function detach(){for(const [type,fn] of [['message',message],['error',error],['close',remoteClose]])socket.removeEventListener?.(type,fn);}
 socket.addEventListener('message',message);socket.addEventListener('error',error);socket.addEventListener('close',remoteClose);
 function send(type,data={}){if(closed||socket.readyState!==Socket.OPEN)throw Error('멀티 서버가 연결되지 않았습니다.');socket.send(JSON.stringify({...data,type}));}
 function close(){if(closed)return;closed=true;detach();socket.close();}
 return {socket,create:(name,weapon='sword',boss='kwon')=>send('create',{name,weapon,boss}),join:(code,name,weapon='sword',boss)=>send('join',{code,name,weapon,boss}),ready:value=>send('ready',{value}),start:()=>send('start'),input:(epoch,seq,x,z,action=null)=>send('input',{epoch,seq,x,z,action}),leave:()=>send('leave'),close,dispose:close,get disposed(){return closed;}};
}
